import httpStatus from 'http-status';
import AppError from '../../error/appError';
import { deleteFileFromS3 } from '../../helper/deleteFromS3';
import { IStation } from './station.interface';
import { Station } from './station.model';

const updateStation = async (payload: Partial<IStation>) => {
    const station = await Station.findOne();
    if (!station) {
        throw new AppError(httpStatus.NOT_FOUND, 'Profile not found');
    }
    const result = await Station.findByIdAndUpdate(station._id, payload, {
        new: true,
        runValidators: true,
    });
    if (station.profile_image && payload.profile_image) {
        deleteFileFromS3(station.profile_image);
    }
    if (station.cover_image && payload.cover_image) {
        deleteFileFromS3(station.cover_image);
    }
    return result;
};

const getStation = async () => {
    const station = await Station.findOne();
    if (!station) {
        throw new AppError(httpStatus.NOT_FOUND, 'Station not found');
    }

    // Aggregate station to include isLive, liveSession, streamRoom, totalViews and latestPodcast
    const agg = await Station.aggregate([
        { $match: { _id: station._id } },
        // Lookup active live session for this station
        {
            $lookup: {
                from: 'livesessions',
                let: { stationId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$station', '$$stationId'] },
                                    { $eq: ['$status', 'active'] },
                                ],
                            },
                        },
                    },
                ],
                as: 'liveSession',
            },
        },
        {
            $addFields: {
                isLive: { $gt: [{ $size: '$liveSession' }, 0] },
                liveSession: { $arrayElemAt: ['$liveSession', 0] },
            },
        },
        // Lookup stream room if live
        {
            $lookup: {
                from: 'streamrooms',
                localField: 'liveSession.streamRoom',
                foreignField: '_id',
                as: 'streamRoom',
            },
        },
        { $unwind: { path: '$streamRoom', preserveNullAndEmptyArrays: true } },

        // Lookup podcasts for this station to compute totalViews and latestPodcast
        {
            $lookup: {
                from: 'podcasts',
                localField: '_id',
                foreignField: 'station',
                as: 'stationPodcasts',
            },
        },
        {
            $addFields: {
                totalViews: { $sum: '$stationPodcasts.totalView' },
                latestPodcast: {
                    $arrayElemAt: [
                        {
                            $sortArray: {
                                input: '$stationPodcasts',
                                sortBy: { createdAt: -1 },
                            },
                        },
                        0,
                    ],
                },
            },
        },
        {
            $project: {
                name: 1,
                description: 1,
                location: 1,
                address: 1,
                donationUrl: 1,
                profile_image: 1,
                cover_image: 1,
                isLive: 1,
                totalViews: 1,
                liveSession: {
                    session_id: '$liveSession.session_id',
                    name: '$liveSession.name',
                    description: '$liveSession.description',
                    coverImage: '$liveSession.coverImage',
                    session_started_at: '$liveSession.session_started_at',
                    duration: '$liveSession.duration',
                },
                streamRoom: 1,
                latestPodcastId: '$latestPodcast._id',
            },
        },
    ]);

    const stationAgg = agg[0] || {};

    return {
        ...station.toObject(),
        isLive: stationAgg.isLive || false,
        liveSession: stationAgg.liveSession || null,
        streamRoom: stationAgg.streamRoom || null,
        totalViews: stationAgg.totalViews || 0,
        latestPodcastId: stationAgg.latestPodcastId || null,
    };
};

const StationServices = { updateStation, getStation };
export default StationServices;
