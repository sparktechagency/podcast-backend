/* eslint-disable no-undef */
import httpStatus from 'http-status';
import config from '../../config';
import { HMS_ENDPOINT } from '../../constant';
import AppError from '../../error/appError';
import { ENUM_NOTIFICATION_TYPE } from '../../utilities/enum';
import Notification from '../notification/notification.model';
import { ENUM_LIVE_STREAM_STATUS } from './liveStreaming.enum';
import { IStreamRoom } from './liveStreaming.interface';
import { StreamRoom } from './liveStreaming.model';

const getMgmToken = () =>
    Buffer.from(`${config.hms.hms_secret}`).toString('base64');

const createStreamingRoom = async (profileId: string, payload: IStreamRoom) => {
    const { name, description, template_id } = payload;
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
    const roomData = await response.json();
    const room = await StreamRoom.create({
        host: profileId,
        name,
        description,
        template_id,
        room_id: roomData.id,
        status: ENUM_LIVE_STREAM_STATUS.wating,
    });
    console.log('room', room);

    return roomData;
};

// generate join token api
const getJoinToken = async (payload: {
    user_id: string;
    role: string;
    room_id: string;
}) => {
    const response = await fetch(
        `${HMS_ENDPOINT}/rooms/${payload.room_id}/token`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getMgmToken()}`,
            },
            body: JSON.stringify({
                user_id: payload.user_id,
                role: payload.role,
            }),
        }
    );

    const data = await response.json();
    return data;
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
