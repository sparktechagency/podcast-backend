import { Schema, model, Types } from 'mongoose';
import { IAlbum } from './album.interface';

const albumSchema = new Schema<IAlbum>(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        tags: { type: [String], default: [] },
        cover_image: { type: String, required: true },
        podcasts: [{ type: Types.ObjectId, ref: 'Podcast', required: true }],
    },
    { timestamps: true }
);

const Album = model<IAlbum>('Album', albumSchema);
export default Album;
