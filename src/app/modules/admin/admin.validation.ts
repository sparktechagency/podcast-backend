import { z } from 'zod';

const createAdminValidatoinSchema = z.object({
    body: z.object({
        name: z
            .string({ required_error: 'Name is required' })
            .min(1, 'Name is required'),
        email: z
            .string({ required_error: 'Email is required' })
            .email('Invalid email address'),
        profile_image: z.string().optional(),
        password: z.string({ required_error: 'Password is required' }),
    }),
});

const updateAdminProfileValidationSchema = z.object({
    body: z.object({
        name: z.string({ required_error: 'Name is required' }).optional(),
        email: z
            .string({ required_error: 'Email is required' })
            .email('Invalid email address')
            .optional(),
        profile_image: z.string().optional(),
    }),
});

const AdminValidations = {
    createAdminValidatoinSchema,
    updateAdminProfileValidationSchema,
};

export default AdminValidations;
