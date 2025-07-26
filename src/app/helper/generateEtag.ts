import crypto from 'crypto';

const generateETag = (data: object) => {
    const json = JSON.stringify(data);
    return crypto.createHash('md5').update(json).digest('hex');
};

export default generateETag;
