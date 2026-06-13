import { Types } from 'mongoose';
import { ENUM_LIVE_SESSION } from './liveSession.enum';

export interface ILiveSession {
    creator: Types.ObjectId;
    station: Types.ObjectId;
    coverImage: string;
    name: string;
    description: string;
    room_id: string;
    streamRoom: Types.ObjectId;
    session_id: string;
    session_started_at: Date;
    status: (typeof ENUM_LIVE_SESSION)[keyof typeof ENUM_LIVE_SESSION];
    recording_presigned_url: string;
    duration: number;
    isPublic: boolean;
}
