import { z } from 'zod';

export const updateLiveSessionData = z.object({
    body: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
    }),
});

const LiveSessionValidations = { updateLiveSessionData };
export default LiveSessionValidations;
