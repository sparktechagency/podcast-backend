import { z } from "zod";

export const updateWatchHistoryData = z.object({
    body: z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
    }),
});

const WatchHistoryValidations = { updateWatchHistoryData };
export default WatchHistoryValidations;