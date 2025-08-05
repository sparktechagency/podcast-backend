import { model, Schema } from 'mongoose';
import { IWatchHistory } from './watchHistory.interface';

const watchHistorySchema = new Schema<IWatchHistory>(
    {
        user: {
            type: String,
            required: true,
        },
        podcast: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Podcast',
        },
    },
    { timestamps: true }
);

watchHistorySchema.index({ user: 1, podcast: 1 });

watchHistorySchema.index({ createdAt: -1 });

const WatchHistory = model<IWatchHistory>('WatchHistory', watchHistorySchema);
export default WatchHistory;
