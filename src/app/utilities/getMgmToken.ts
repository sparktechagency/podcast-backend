import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';

export const getMgmToken = () => {
    if (!config.hms.hms_secret || !config.hms.hms_access_key) {
        throw new Error('HMS access key or secret is missing in config');
    }

    const payload = {
        access_key: config.hms.hms_access_key,
        type: 'management',
        version: 2,
        jti: uuidv4(), // unique token id required by 100ms
    };

    const token = jwt.sign(payload, config.hms.hms_secret as string, {
        algorithm: 'HS256',
        expiresIn: '24h',
    });

    return token;
};
