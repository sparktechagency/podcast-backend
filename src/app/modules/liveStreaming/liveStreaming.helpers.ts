import crypto from 'crypto';
import { HMS_ENDPOINT } from '../../constant';
import { getMgmToken } from '../../utilities/getMgmToken';

export const createRoomCodesForAllRoles = async (roomId: string) => {
    const response = await fetch(`${HMS_ENDPOINT}/room-codes/room/${roomId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getMgmToken()}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to create room codes: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('data', data);
    return data.data; // array of codes for each role
};

/**
 * Generate a unique alphanumeric code
 * @param length default = 10
 * @returns string
 */
export function generateRoomName(length: number = 10): string {
    return crypto
        .randomBytes(length)
        .toString('base64') // convert to base64 for more variety
        .replace(/[^a-zA-Z0-9]/g, '') // remove special characters
        .substring(0, length);
}
