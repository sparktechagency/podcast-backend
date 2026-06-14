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
import Notification from '../notification/notification.model';
import { USER_ROLE } from '../user/user.constant';
import { ENUM_LIVE_STREAM_STATUS } from './liveStreaming.enum';
import {
    createRoomCodesForAllRoles,
    generateRoomName,
} from './liveStreaming.helpers';
import { StreamRoom } from './liveStreaming.model';

const createStreamingRoom = async (userData: JwtPayload) => {
    console.log('console from live stream');
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
        await StreamRoom.create({
            station: userData.profileId,
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

    // const allRecording = await fetch(
    //     `${HMS_ENDPOINT}/v2/recordings?room_id=${roomId}`,
    //     {
    //         method: 'GET',
    //         headers: {
    //             Authorization: `Bearer ${getMgmToken()}`,
    //         },
    //     }
    // );

    // const allRecordings = await allRecording.json();
    // console.log('all recordings', allRecordings);

    // 1. Fetch sessions for this room
    // const sessionRes = await fetch(
    //     `${HMS_ENDPOINT}/sessions?room_id=${roomId}`,
    //     {
    //         method: 'GET',
    //         headers: {
    //             Authorization: `Bearer ${await getMgmToken()}`,
    //         },
    //     }
    // );
    // const sessionData = await sessionRes.json();
    // console.log('sessionRes', sessionData);
    // console.log('reocododd', sessionData.data[0].recording);
    // console.log('reocododd', sessionData.data[1].recording);
    // console.log('reocododd', sessionData.data[2].recording);

    // for (const session of sessionData.data) {
    //     const sessionId = session.id;
    //     console.log('session id', sessionId);
    //     // 2. Fetch recordings for this session
    //     const recordingRes = await fetch(
    //         `${HMS_ENDPOINT}/recordings?session_id=${sessionId}`,
    //         {
    //             method: 'GET',
    //             headers: {
    //                 Authorization: `Bearer ${getMgmToken()}`,
    //             },
    //         }
    //     );
    //     const recordingData = await recordingRes.json();
    //     console.log('recroding', recordingData);
    //     // 3. Store recordings in DB
    //     // const recordings = recordingData.data.map((r: any) => ({
    //     //     session_id: sessionId,
    //     //     started_at: session.started_at,
    //     //     ended_at: session.ended_at,
    //     //     duration: session.duration,
    //     //     url: r.url, // actual downloadable recording URL
    //     // }));

    //     // room.recordings.push(...recordings);
    // }

    // room.status = ENUM_LIVE_STREAM_STATUS.ended;
    // room.endTime = new Date();
    // await room.save();

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

// const getMyLiveRoom = async (profileId: string) => {
//     const room = await StreamRoom.findOne({
//         status: ENUM_LIVE_STREAM_STATUS.live,
//         host: profileId,
//     });
//     console.log('room data', room);
//     if (!room) {
//         return null;
//     }
//     return room;
// };

// const getMyLiveRoom = async (profileId: string) => {
//     const room = await StreamRoom.findOne({ host: profileId });
//     console.log('Room----------------------------------->>>>', room);
//     if (!room) return null;

//     // Check if existing codes are still active
//     const codeCheckRes = await fetch(
//         `${HMS_ENDPOINT}/room-codes/room/${room.room_id}`,
//         {
//             method: 'GET',
//             headers: {
//                 Authorization: `Bearer ${getMgmToken()}`,
//             },
//         }
//     );
//     const codeData = await codeCheckRes.json();
//     console.log('Code json=============================>', codeData);
//     const activeCodes = codeData.data?.filter((c: any) => c.enabled === true);

//     if (activeCodes && activeCodes.length > 0) {
//         console.log('in site active codes', activeCodes);
//         // ✅ Codes still valid, return as-is
//         return { ...room.toObject(), roomCodes: activeCodes };
//     }

//     console.log('nice to meet you ');
//     // ♻️ Codes expired or disabled, regenerate
//     const freshRoomCodes = await createRoomCodesForAllRoles(room.room_id);
//     console.log('freesh room code', freshRoomCodes);
//     await StreamRoom.findByIdAndUpdate(room._id, { roomCodes: freshRoomCodes });

//     return { ...room.toObject(), roomCodes: freshRoomCodes };
// };

const getMyLiveRoom = async (profileId: string) => {
    const room = await StreamRoom.findOne({ host: profileId });
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

    // ✅ Room is active, return codes
    if (codeData.data && codeData.data.length > 0) {
        console.log('activecodes', codeData.data);
        const activeCodes = codeData.data.filter(
            (c: any) => c.enabled === true
        );
        return { ...room.toObject(), roomCodes: activeCodes };
    }

    // ❌ Room is dead on 100ms (403 room not active)
    // Create a completely new room on 100ms
    console.log('Room is dead, creating new room on 100ms...');

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
    console.log('New room created:', newRoomData);

    // Generate codes for new room
    const freshRoomCodes = await createRoomCodesForAllRoles(newRoomData.id);
    console.log('Fresh room codes:', freshRoomCodes);

    // Update DB with new room details
    await StreamRoom.findByIdAndUpdate(room._id, {
        room_id: newRoomData.id,
        name,
        roomCodes: freshRoomCodes,
        status: ENUM_LIVE_STREAM_STATUS.ended,
    });

    return {
        ...room.toObject(),
        room_id: newRoomData.id,
        roomCodes: freshRoomCodes,
    };
};
const LiveStreamingServices = {
    createStreamingRoom,
    getJoinToken,
    inviteUser,
    endLiveAndStoreRecordings,
    getMyLiveRoom,
    // startRecording,
};
export default LiveStreamingServices;
