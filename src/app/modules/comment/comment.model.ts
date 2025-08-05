import { model, Schema } from 'mongoose';
import { IComment } from './comment.interface';

const commentSchema = new Schema<IComment>(
    {
        podcast: {
            type: Schema.Types.ObjectId,
            ref: 'Podcast',
            required: true,
        },
        commentor: {
            type: Schema.Types.ObjectId,
            refPath: 'commentorType',
            required: true,
        },
        commentorType: {
            type: String,
            enum: ['NormalUser', 'Creator'],
            required: true,
        },
        text: {
            type: String,
            required: true,
        },
        likers: [{ type: Schema.Types.ObjectId, refPath: 'likerType' }],
        likerType: {
            type: String,
            enum: ['NormalUser', 'Creator'],
            required: true,
        },
        parent: {
            type: Schema.Types.ObjectId,
            ref: 'Comment',
            default: null,
        },
    },
    { timestamps: true }
);

const commentModel = model<IComment>('Comment', commentSchema);
export default commentModel;
