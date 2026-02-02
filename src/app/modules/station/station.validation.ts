import { z } from "zod";

export const updateStationData = z.object({
    body: z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
    }),
});

const StationValidations = { updateStationData };
export default StationValidations;