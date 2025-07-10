import { z } from "zod";

export const updateCreatorData = z.object({
    body: z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
    }),
});

const CreatorValidations = { updateCreatorData };
export default CreatorValidations;