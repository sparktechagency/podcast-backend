import { Document, model, Schema } from 'mongoose';
import { ENUM_LIVE_STREAM_STATUS } from './liveStreaming.enum';
import { IStreamRoom } from './liveStreaming.interface';

interface IStreamRoomDocument extends IStreamRoom, Document {}

const StreamRoomSchema: Schema<IStreamRoomDocument> = new Schema(
    {
        host: {
            type: Schema.Types.ObjectId,
            ref: 'NormalUser',
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: '',
            trim: true,
        },
        template_id: {
            type: String,
            required: true,
        },
        room_id: {
            type: String,
            required: true,
            unique: true,
        },
        status: {
            type: String,
            enum: Object.values(ENUM_LIVE_STREAM_STATUS),
            required: true,
            default: ENUM_LIVE_STREAM_STATUS.wating,
        },
        startTime: {
            type: Date,
            default: null,
        },
        endTime: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

export const StreamRoom = model<IStreamRoomDocument>(
    'StreamRoom',
    StreamRoomSchema
);
