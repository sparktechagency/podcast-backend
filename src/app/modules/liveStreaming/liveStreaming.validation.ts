import { z } from "zod";

export const updateLiveStreamingData = z.object({
    body: z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
    }),
});

const LiveStreamingValidations = { updateLiveStreamingData };
export default LiveStreamingValidations;