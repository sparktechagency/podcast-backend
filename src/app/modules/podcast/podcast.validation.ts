import { z } from 'zod';

const locationSchema = z.object({
    type: z.literal('Point'),
    coordinates: z
        .array(z.number())
        .length(2, 'Coordinates must be [longitude, latitude]'),
});

const createPodcastValidationSchema = z.object({
    body: z.object({
        category: z.string({ required_error: 'Category is required' }),
        subCategory: z.string({ required_error: 'Category is required' }),
        coverImage: z.string().optional(),
        video_url: z.string().optional(),
        audio_url: z.string().optional(),
        title: z.string().min(1, 'Title is required'),
        description: z.string().min(1, 'Description is required'),
        location: locationSchema,
        address: z.string().min(1, 'Address is required'),
        tags: z.array(z.string()).optional(),
    }),
});

const updatePodcastValidationSchema = z.object({
    body: createPodcastValidationSchema.shape.body.partial(),
});

const podcastValidation = {
    createPodcastValidationSchema,
    updatePodcastValidationSchema,
};

export default podcastValidation;
