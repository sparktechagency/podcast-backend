import { z } from 'zod';

const updateCreatorValidationSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required').optional(),
        email: z.string().email('Invalid email format').optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
    }),
});

const creatorValidation = {
    updateCreatorValidationSchema,
};

export default creatorValidation;
