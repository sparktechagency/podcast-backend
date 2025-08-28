import { z } from 'zod';

export const createStreamingRoomValidationSchema = z.object({
    body: z.object({
        name: z.string({ required_error: 'Room name is required' }),
        description: z.string({ required_error: 'Description is required' }),
        template_id: z.string({ required_error: 'Template ID is required' }),
    }),
});

const LiveStreamingValidations = { createStreamingRoomValidationSchema };
export default LiveStreamingValidations;
