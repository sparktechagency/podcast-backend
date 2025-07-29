import { model, Schema } from 'mongoose';
import { IWatchHistory } from './watchHistory.interface';

const watchHistorySchema = new Schema<IWatchHistory>(
    {
        user: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'NormalUser',
        },
        podcast: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Podcast',
        },
    },
    { timestamps: true }
);

const watchHistory = model<IWatchHistory>('WatchHistory', watchHistorySchema);
export default watchHistory;
