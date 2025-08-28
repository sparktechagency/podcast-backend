/* eslint-disable no-undef */
import config from '../../config';
import { HMS_ENDPOINT } from '../../constant';
import { IStreamRoom } from './liveStreaming.interface';

const getMgmToken = () =>
    Buffer.from(`${config.hms.hms_secret}`).toString('base64');

const createStreamingRoom = async (payload: IStreamRoom) => {
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

    return response.json();
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

    return response.json();
};

const LiveStreamingServices = {
    createStreamingRoom,
    getJoinToken,
};
export default LiveStreamingServices;
