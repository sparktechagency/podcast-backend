/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-undef */
import httpStatus from 'http-status';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import config from '../../config';
import { HMS_ENDPOINT } from '../../constant';
import AppError from '../../error/appError';
import { ENUM_NOTIFICATION_TYPE } from '../../utilities/enum';
import { getMgmToken } from '../../utilities/getMgmToken';
import { ENUM_LIVE_SESSION } from '../liveSession/liveSession.enum';
import LiveSession from '../liveSession/liveSession.model';
import Notification from '../notification/notification.model';
import { Station } from '../station/station.model';
import { USER_ROLE } from '../user/user.constant';
import { ENUM_LIVE_STREAM_STATUS } from './liveStreaming.enum';
import {
    createRoomCodesForAllRoles,
    generateRoomName,
} from './liveStreaming.helpers';
import { StreamRoom } from './liveStreaming.model';

const createStreamingRoom = async (userData: JwtPayload) => {
    const liveRoom = await StreamRoom.findOne({
        host: userData.profileId,
    });

    if (liveRoom) {
        throw new AppError(httpStatus.NOT_FOUND, 'You already created a room');
    }

    const name = generateRoomName();
    const response = await fetch(`${HMS_ENDPOINT}/rooms`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getMgmToken()}`,
        },
        body: JSON.stringify({
            name,
            template_id: config.hms.template_id,
        }),
    });
    const roomData = await response.json();
    const roomCodes = await createRoomCodesForAllRoles(roomData.id);
    if (userData.role == USER_ROLE.creator) {
        await StreamRoom.create({
            creator: userData.profileId,
            name,
            template_id: config.hms.template_id,
            room_id: roomData.id,
            status: ENUM_LIVE_STREAM_STATUS.live,
            roomCodes,
        });
    } else {
        const station = await Station.findOne();
        await StreamRoom.create({
            station: station?._id,
            name,
            template_id: config.hms.template_id,
            room_id: roomData.id,
            status: ENUM_LIVE_STREAM_STATUS.live,
            roomCodes,
        });
    }

    return { roomData, roomCodes };
};

const getJoinToken = (payload: {
    user_id: string;
    role: string;
    room_id: string;
}) => {
    if (!config.hms.hms_secret || !config.hms.hms_access_key) {
        throw new Error('HMS access key or secret is missing in config');
    }

    const tokenPayload = {
        access_key: config.hms.hms_access_key,
        room_id: payload.room_id,
        user_id: payload.user_id,
        role: payload.role, // e.g. "host" | "guest"
        type: 'app',
        version: 2,
        jti: uuidv4(),
    };

    const token = jwt.sign(tokenPayload, config.hms.hms_secret as string, {
        algorithm: 'HS256',
        expiresIn: '24h',
    });

    return token;
};

const inviteUser = async (
    profileId: string,
    payload: { invitedUserId: string; role: string; room_id: string }
) => {
    const room = await StreamRoom.findOne({
        room_id: payload.room_id,
        host: profileId,
    });
    if (!room) {
        throw new AppError(httpStatus.NOT_FOUND, 'Room not found');
    }

    const token = await getJoinToken({
        user_id: payload.invitedUserId,
        role: payload.role,
        room_id: payload.room_id,
    });

    await Notification.create({
        title: 'Live Streaming Invitation',
        message: `You have been invited to join the live streaming room: ${room.name}`,
        receiver: payload.invitedUserId,
        type: ENUM_NOTIFICATION_TYPE.LIVE_INVITATION,
        redirectId: room.room_id,
    });

    return token;
};

const endLiveAndStoreRecordings = async (roomId: string) => {
    // Find the room first
    const room = await StreamRoom.findOne({ room_id: roomId });
    if (!room) throw new AppError(httpStatus.NOT_FOUND, 'Room not found');

    const sessionRes = await fetch(
        `${HMS_ENDPOINT}/recordings?room_id=${roomId}`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${await getMgmToken()}`,
            },
        }
    );
    const sessionData = await sessionRes.json();
    console.log('sessionRes', sessionData);

    // return room;

    return null;
};

const getMyLiveRoom = async (userData: JwtPayload) => {
    let room: any;
    if (userData.role === USER_ROLE.creator) {
        room = await StreamRoom.findOne({
            creator: userData.profileId,
        });
    } else {
        const station = await Station.findOne();
        room = await StreamRoom.findOne({
            station: station?._id,
        });
    }
    if (!room) return null;

    // Check if room is still active on 100ms
    const codeCheckRes = await fetch(
        `${HMS_ENDPOINT}/room-codes/room/${room.room_id}`,
        {
            method: 'GET',
            headers: { Authorization: `Bearer ${getMgmToken()}` },
        }
    );

    const codeData = await codeCheckRes.json();

    //  Room is active, return codes
    if (codeData.data && codeData.data.length > 0) {
        const activeCodes = codeData.data.filter(
            (c: any) => c.enabled === true
        );
        const isActive = await LiveSession.findOne({
            streamRoom: room._id,
            status: ENUM_LIVE_SESSION.ACTIVE,
        });

        return {
            ...room.toObject(),
            roomCodes: activeCodes,
            isActive: !!isActive,
        };
    }



    const name = generateRoomName();
    const newRoomRes = await fetch(`${HMS_ENDPOINT}/rooms`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getMgmToken()}`,
        },
        body: JSON.stringify({
            name,
            template_id: config.hms.template_id,
        }),
    });
    const newRoomData = await newRoomRes.json();

    // Generate codes for new room
    const freshRoomCodes = await createRoomCodesForAllRoles(newRoomData.id);

    // Update DB with new room details
    await StreamRoom.findByIdAndUpdate(room._id, {
        room_id: newRoomData.id,
        name,
        roomCodes: freshRoomCodes,
        status: ENUM_LIVE_STREAM_STATUS.ended,
    });

    const isActive = await LiveSession.findOne({
        streamRoom: room._id,
        status: ENUM_LIVE_SESSION.ACTIVE,
    });


    return {
        ...room.toObject(),
        room_id: newRoomData.id,
        roomCodes: freshRoomCodes,
        isActive: !!isActive,
    };
};
const LiveStreamingServices = {
    createStreamingRoom,
    getJoinToken,
    inviteUser,
    endLiveAndStoreRecordings,
    getMyLiveRoom,
};
export default LiveStreamingServices;
