import mongoose, { Schema } from 'mongoose';
import { ENUM_LIVE_SESSION } from './liveSession.enum';
import { ILiveSession } from './liveSession.interface';

const liveSessionSchema: Schema<ILiveSession> = new Schema(
    {
        creator: {
            type: Schema.Types.ObjectId,
            ref: 'Creator',
            default: null,
        },

        station: {
            type: Schema.Types.ObjectId,
            ref: 'Station',
            default: null,
        },

        name: {
            type: String,
            default: '',
        },
        description: {
            type: String,
            default: '',
        },
        streamRoom: {
            type: Schema.Types.ObjectId,
            ref: 'StreamRoom',
            required: true,
        },
        room_id: {
            type: String,
            required: true,
        },
        session_id: {
            type: String,
            required: true,
            unique: true,
        },
        status: {
            type: String,
            enum: Object.values(ENUM_LIVE_SESSION),
            default: ENUM_LIVE_SESSION.ACTIVE,
            required: true,
        },
        recording_presigned_url: {
            type: String,
            default: '',
        },
        session_started_at: {
            type: Date,
            default: null,
        },
        duration: {
            type: Number,
            default: null,
        },
        coverImage: {
            type: String,
            default: '',
        },
        isPublic: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Create the model
const LiveSession = mongoose.model<ILiveSession>(
    'LiveSession',
    liveSessionSchema
);

export default LiveSession;
