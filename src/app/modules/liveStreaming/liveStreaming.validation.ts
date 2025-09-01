import { z } from 'zod';

export const createStreamingRoomValidationSchema = z.object({
    body: z.object({
        name: z.string({ required_error: 'Room name is required' }),
        description: z.string({ required_error: 'Description is required' }),
    }),
});

const inviteUserValidationSchema = z.object({
    body: z.object({
        invitedUserId: z.string({
            required_error: 'Invited user ID is required',
        }),
        role: z.string({ required_error: 'Role is required' }),
        room_id: z.string({ required_error: 'Room ID is required' }),
    }),
});

const LiveStreamingValidations = {
    createStreamingRoomValidationSchema,
    inviteUserValidationSchema,
};
export default LiveStreamingValidations;
