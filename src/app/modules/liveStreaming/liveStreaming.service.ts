/* eslint-disable no-undef */
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import config from '../../config';
import { HMS_ENDPOINT } from '../../constant';
import AppError from '../../error/appError';
import { ENUM_NOTIFICATION_TYPE } from '../../utilities/enum';
import { getMgmToken } from '../../utilities/getMgmToken';
import Notification from '../notification/notification.model';
import { ENUM_LIVE_STREAM_STATUS } from './liveStreaming.enum';
import { IStreamRoom } from './liveStreaming.interface';
import { StreamRoom } from './liveStreaming.model';
const createStreamingRoom = async (profileId: string, payload: IStreamRoom) => {
    const { name, description, template_id } = payload;
    console.log('get msg tokne', getMgmToken());
    const response = await fetch(`${HMS_ENDPOINT}/rooms`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getMgmToken()}`,
        },
        body: JSON.stringify({
            name,
            description,
            template_id,
        }),
    });
    console.log('response', response);
    const roomData = await response.json();
    console.log('rommdatewa', roomData);
    const room = await StreamRoom.create({
        host: profileId,
        name,
        description,
        template_id,
        room_id: roomData.id,
        status: ENUM_LIVE_STREAM_STATUS.wating,
    });
    console.log('room', room);

    const joinToken = await getJoinToken({
        user_id: profileId,
        role: 'host',
        room_id: roomData.id,
    });

    return { roomData, joinToken };
};

// generate join token api
// const getJoinToken = async (payload: {
//     user_id: string;
//     role: string;
//     room_id: string;
// }) => {
//     const response = await fetch(
//         `${HMS_ENDPOINT}/rooms/${payload.room_id}/token`,
//         {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 Authorization: `Bearer ${getMgmToken()}`,
//             },
//             body: JSON.stringify({
//                 user_id: payload.user_id,
//                 role: payload.role,
//             }),
//         }
//     );

//     const data = await response.json();
//     return data;
// };

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

const LiveStreamingServices = {
    createStreamingRoom,
    getJoinToken,
    inviteUser,
};
export default LiveStreamingServices;
