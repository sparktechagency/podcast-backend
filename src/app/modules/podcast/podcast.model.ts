import { Schema, model } from 'mongoose';
import { IPodcast } from './podcast.interface';

const PodcastSchema = new Schema<IPodcast>(
    {
        creator: {
            type: Schema.Types.ObjectId,
            ref: 'Creator',
            required: true,
        },
        category: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        },
        subCategory: {
            type: Schema.Types.ObjectId,
            ref: 'SubCategory',
            required: true,
        },
        coverImage: { type: String, required: true },
        video_url: { type: String },
        audio_url: { type: String },
        title: { type: String, required: true },
        description: { type: String, required: true },
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true },
        },
        address: { type: String, required: true },
        tags: [{ type: String }],
        totalView: {
            type: Number,
            default: 0,
        },
        duration: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);

PodcastSchema.index({ location: '2dsphere' });
PodcastSchema.index({ creator: 1 });
PodcastSchema.index({ category: 1 });
PodcastSchema.index({ createdAt: -1 });
PodcastSchema.index({ title: 'text', name: 'text', description: 'text' });

const Podcast = model<IPodcast>('Podcast', PodcastSchema);
export default Podcast;
