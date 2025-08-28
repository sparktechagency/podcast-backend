import { Types } from 'mongoose';
import { ENUM_LIVE_STREAM_STATUS } from './liveStreaming.enum';
export interface IStreamRoom {
    host: Types.ObjectId;
    name: string;
    description: string;
    template_id: string;
    room_id: string;
    status: (typeof ENUM_LIVE_STREAM_STATUS)[keyof typeof ENUM_LIVE_STREAM_STATUS];
    startTime?: Date;
    endTime?: Date;
}
