import { model, Schema } from 'mongoose';
import { IStation } from './station.interface';

const StationSchema = new Schema<IStation>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                required: true,
                default: 'Point',
            },
            coordinates: {
                type: [Number],
                required: true,
                validate: {
                    validator: (value: number[]) => value.length === 2,
                    message: 'Coordinates must be [longitude, latitude]',
                },
            },
        },
        address: {
            type: String,
        },
        donationUrl: {
            type: String,
        },
        profile_image: {
            type: String,
        },
        cover_image: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

StationSchema.index({ location: '2dsphere' });

export const Station = model<IStation>('Station', StationSchema);
