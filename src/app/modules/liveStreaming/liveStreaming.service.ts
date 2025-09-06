/* eslint-disable @typescript-eslint/no-explicit-any */
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
import {
    createRoomCodesForAllRoles,
    generateRoomName,
} from './liveStreaming.helpers';
import { StreamRoom } from './liveStreaming.model';
const createStreamingRoom = async (profileId: string) => {
    const liveRoom = await StreamRoom.findOne({
        host: profileId,
        $or: [
            { status: ENUM_LIVE_STREAM_STATUS.live },
            { status: ENUM_LIVE_STREAM_STATUS.wating },
        ],
    });

    if (liveRoom) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            "You can't able to start another live , because you already created a room for live , please join with that"
        );
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
    await StreamRoom.create({
        host: profileId,
        name,
        template_id: config.hms.template_id,
        room_id: roomData.id,
        status: ENUM_LIVE_STREAM_STATUS.wating,
        roomCodes,
    });
    // const joinToken = await getJoinToken({
    //     user_id: profileId,
    //     role: 'host',
    //     room_id: roomData.id,
    // });

    return { roomData, roomCodes };
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
    const sessionRes = await fetch(
        `${HMS_ENDPOINT}/sessions?room_id=${roomId}`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${await getMgmToken()}`,
            },
        }
    );
    const sessionData = await sessionRes.json();
    console.log('sessionRes', sessionData);
    console.log('reocododd', sessionData.data[0].recording);
    console.log('reocododd', sessionData.data[1].recording);
    console.log('reocododd', sessionData.data[2].recording);

    for (const session of sessionData.data) {
        const sessionId = session.id;
        console.log('session id', sessionId);
        // 2. Fetch recordings for this session
        const recordingRes = await fetch(
            `${HMS_ENDPOINT}/recordings?session_id=${sessionId}`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${getMgmToken()}`,
                },
            }
        );
        const recordingData = await recordingRes.json();
        console.log('recroding', recordingData);
        // 3. Store recordings in DB
        // const recordings = recordingData.data.map((r: any) => ({
        //     session_id: sessionId,
        //     started_at: session.started_at,
        //     ended_at: session.ended_at,
        //     duration: session.duration,
        //     url: r.url, // actual downloadable recording URL
        // }));

        // room.recordings.push(...recordings);
    }

    // room.status = ENUM_LIVE_STREAM_STATUS.ended;
    // room.endTime = new Date();
    // await room.save();

    // return room;

    return null;
};

const getMyLiveRoom = async (profileId: string) => {
    const room = await StreamRoom.findOne({
        status: ENUM_LIVE_STREAM_STATUS.live,
        host: profileId,
    });
    return room;
};

const LiveStreamingServices = {
    createStreamingRoom,
    getJoinToken,
    inviteUser,
    endLiveAndStoreRecordings,
    getMyLiveRoom,
};
export default LiveStreamingServices;
