import { z } from "zod";

export const updateSubCategoryData = z.object({
    body: z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
    }),
});

const SubCategoryValidations = { updateSubCategoryData };
export default SubCategoryValidations;