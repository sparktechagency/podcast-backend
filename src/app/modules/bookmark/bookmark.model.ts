import { model, Schema } from 'mongoose';
import { IBookmark } from './bookmark.interface';

const bookmarkSchema = new Schema<IBookmark>(
    {
        podcast: {
            type: Schema.Types.ObjectId,
            default: null,
            ref: 'Podcast',
        },
        user: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Bookmark = model('Bookmark', bookmarkSchema);

export default Bookmark;
