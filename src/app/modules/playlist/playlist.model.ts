import { Schema, model, Types } from 'mongoose';
import { IPodcastPlaylist } from './playlist.interface';

const podcastPlaylistSchema = new Schema<IPodcastPlaylist>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'NormalUser',
            required: true,
        },
        name: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        tags: { type: [String], default: [] },
        cover_image: { type: String, required: true },
        podcasts: [{ type: Types.ObjectId, ref: 'Podcast', required: true }],
    },
    { timestamps: true }
);

const PodcastPlaylist = model<IPodcastPlaylist>(
    'PodcastPlaylist',
    podcastPlaylistSchema
);
export default PodcastPlaylist;
