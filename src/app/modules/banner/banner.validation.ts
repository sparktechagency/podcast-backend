import { z } from 'zod';

export const createBannerValidationSchema = z.object({
    body: z
        .object({
            image: z.string().min(1),
            url: z.string().url().optional(),
            startDate: z
                .date()
                .refine(
                    (date) => date instanceof Date && !isNaN(date.getTime())
                ),
            endDate: z
                .date()
                .refine(
                    (date) => date instanceof Date && !isNaN(date.getTime())
                ),
        })
        .superRefine((data, ctx) => {
            if (data.endDate <= data.startDate) {
                ctx.addIssue({
                    path: ['endDate'],
                    message: 'End date must be later than start date',
                    code: z.ZodIssueCode.custom,
                });
            }
        }),
});

const BannerValidations = { createBannerValidationSchema };
export default BannerValidations;
