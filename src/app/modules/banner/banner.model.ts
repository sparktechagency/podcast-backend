import { model, Schema } from 'mongoose';
import { IBanner } from './banner.interface';

const bannerSchema = new Schema<IBanner>(
    {
        url: {
            type: String,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true }
);

const Banner = model<IBanner>('Banner', bannerSchema);
export default Banner;
