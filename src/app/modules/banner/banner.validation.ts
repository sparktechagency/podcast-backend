import { z } from 'zod';

export const createBannerValidationSchema = z.object({
    body: z.object({
        startDate: z.string({ required_error: 'Start date is required' }),
        endDate: z.string({ required_error: 'End date is required' }),
        redirect_url: z.string().optional(),
    }),
});
const updateBannerValidationSchema = z.object({
    body: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
    }),
});

const BannerValidations = {
    createBannerValidationSchema,
    updateBannerValidationSchema,
};
export default BannerValidations;
