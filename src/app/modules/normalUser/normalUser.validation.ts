import { z } from 'zod';

const registerNormalUserValidationSchema = z.object({
    body: z.object({
        password: z
            .string({ required_error: 'Password is required' })
            .min(6, { message: 'Password must be at least 6 characters' }),
        confirmPassword: z
            .string({ required_error: 'Confirm password is required' })
            .min(6, { message: 'Password must be at least 6 characters' }),
        name: z.string({
            required_error: 'Name is required',
            invalid_type_error: 'Name must be a string',
        }),
        email: z.string().email('Invalid email format'),
        phone: z.string().optional(),
    }),
});

const updateNormalUserValidationSchema = z.object({
    body: z.object({
        name: z
            .string({
                required_error: 'Name is required',
                invalid_type_error: 'Name must be a string',
            })
            .optional(),
        email: z.string().email('Invalid email format').optional(),
        phone: z.string().optional(),
    }),
});

const normalUserValidations = {
    registerNormalUserValidationSchema,
    updateNormalUserValidationSchema,
};

export default normalUserValidations;
