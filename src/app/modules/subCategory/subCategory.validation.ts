import { z } from 'zod';

const createSubCategoryValidationSchema = z.object({
    body: z.object({
        category: z.string({ required_error: 'Parent category is required' }),
        name: z
            .string({ required_error: 'Subcategory name is required' })
            .min(1),
    }),
});

const updateSubCategoryValidationSchema = z.object({
    body: z.object({
        category: z.string().optional(),
        name: z.string().min(1).optional(),
        category_image: z.string().optional(),
    }),
});

const subCategoryValidation = {
    createSubCategoryValidationSchema,
    updateSubCategoryValidationSchema,
};

export default subCategoryValidation;
