import httpStatus from 'http-status';
import AppError from '../../error/appError';
import { deleteFileFromS3 } from '../../helper/deleteFromS3';
import { StreamRoom } from '../liveStreaming/liveStreaming.model';
import { ENUM_LIVE_SESSION } from './liveSession.enum';
import { ILiveSession } from './liveSession.interface';
import LiveSession from './liveSession.model';

const createLiveSession = async (payload: Partial<ILiveSession>) => {
    const streamRoom = await StreamRoom.findOne({ room_id: payload.room_id });
    if (!streamRoom) {
        throw new AppError(httpStatus.NOT_FOUND, 'Room not found');
    }
    payload.streamRoom = streamRoom._id;
    await LiveSession.create(payload);
};

const endSession = async (
    session_id: string,
    recording_presigned_url: string,
    duration: number
) => {
    await LiveSession.findOneAndUpdate(
        { session_id: session_id },
        {
            status: ENUM_LIVE_SESSION.ENDED,
            recording_presigned_url: recording_presigned_url,
            duration,
        }
    );
};

const updateLiveSessionData = async (
    profileId: string,
    id: string,
    payload: Partial<ILiveSession>
) => {
    const liveSession = await LiveSession.findOne({
        creator: profileId,
        _id: id,
    });
    if (!liveSession) {
        throw new AppError(httpStatus.NOT_FOUND, 'Live not found');
    }
    const result = await LiveSession.findOneAndUpdate(
        { creator: profileId, _id: id },
        payload,
        { new: true, runValidators: true }
    );

    if (payload.coverImage && liveSession.coverImage) {
        deleteFileFromS3(liveSession.coverImage);
    }
    return result;
};
const getAllLiveSessions = async (query: Record<string, unknown>) => {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const aggResult = await LiveSession.aggregate([
        {
            $match: {
                status: ENUM_LIVE_SESSION.ENDED,
            },
        },
        {
            $lookup: {
                from: 'creators',
                localField: 'creator',
                foreignField: '_id',
                as: 'creatorDetails',
            },
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                session_id: 1,
                room_id: 1,
                status: 1,
                recording_presigned_url: 1,
                session_started_at: 1,
                duration: 1,
                coverImage: 1,
                createdAt: 1,
                updatedAt: 1,
                creator: {
                    name: '$creatorDetails.name',
                    profile_image: '$creatorDetails.profile_image',
                },
            },
        },
        { $sort: { createdAt: -1 } },

        {
            $facet: {
                result: [{ $skip: skip }, { $limit: limit }],
                totalCount: [{ $count: 'total' }],
            },
        },
    ]);

    const result = aggResult[0]?.result || [];
    const total = aggResult[0]?.totalCount[0]?.total || 0;
    const totalPage = Math.ceil(total / limit);

    return {
        meta: {
            page,
            limit,
            total,
            totalPage,
        },
        result,
    };
};

const LiveSessionServices = {
    createLiveSession,
    endSession,
    updateLiveSessionData,
    getAllLiveSessions,
};
export default LiveSessionServices;
