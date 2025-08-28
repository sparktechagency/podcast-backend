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

const LiveStreamingServices = {
    createStreamingRoom,
};
export default LiveStreamingServices;
