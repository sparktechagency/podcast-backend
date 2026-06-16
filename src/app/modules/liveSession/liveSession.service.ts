/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';
import AppError from '../../error/appError';
import { deleteFileFromS3 } from '../../helper/deleteFromS3';
import redis from '../../utilities/redisClient';
import { StreamRoom } from '../liveStreaming/liveStreaming.model';
import { Station } from '../station/station.model';
import { USER_ROLE } from '../user/user.constant';
import { ENUM_LIVE_SESSION } from './liveSession.enum';
import { ILiveSession } from './liveSession.interface';
import LiveSession from './liveSession.model';

const createLiveSession = async (payload: Partial<ILiveSession>) => {
    console.log('createLiveSession called', payload);

    const streamRoom = await StreamRoom.findOne({
        room_id: payload.room_id,
    });



    if (!streamRoom) {
        console.log('Room not found');
        throw new AppError(httpStatus.NOT_FOUND, 'Room not found');
    }

    payload.streamRoom = streamRoom._id;
    payload.creator = streamRoom?.creator || null;
    payload.station = streamRoom?.station || null;

    const session = await LiveSession.create(payload);


    await redis.del('home:data');
};

const endSession = async (session_id: string) => {
    await LiveSession.findOneAndUpdate(
        { session_id: session_id },
        {
            status: ENUM_LIVE_SESSION.ENDED,
        }
    );
    await redis.del('home:data');
};
const saveRecording = async (
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
    await redis.del('home:data');
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

    const matchStage: any = {
        status: ENUM_LIVE_SESSION.ENDED,
        recording_presigned_url: { $exists: true, $nin: [null, ''] },
    };
    if (query.isPublic == 'true') {
        query.isPublic = true;
    }
    if (query.isPublic == 'false') {
        query.isPublic = false;
    }
    if (query.isPublic) {
        matchStage.isPublic = query.isPublic;
    }

    const aggResult = await LiveSession.aggregate([
        {
            $match: matchStage,
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
            $unwind: {
                path: '$creatorDetails',
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: 'stations',
                localField: 'station',
                foreignField: '_id',
                as: 'stationDetails',
            },
        },
        {
            $unwind: {
                path: '$stationDetails',
                preserveNullAndEmptyArrays: true,
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
                isPublic: 1,
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
                station: {
                    name: '$stationDetails.name',
                    profile_image: '$stationDetails.profile_image',
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
const getMyLivesessions = async (
    userData: JwtPayload,
    query: Record<string, unknown>
) => {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    let stationId: any = null;
    if (userData.role == USER_ROLE.superAdmin) {
        const station = await Station.findOne();
        stationId = station?._id;
    }

    const aggResult = await LiveSession.aggregate([
        {
            $match: {
                status: ENUM_LIVE_SESSION.ENDED,
                $or: [
                    {
                        creator: new mongoose.Types.ObjectId(
                            userData.profileId
                        ),
                        station: null,
                    },
                    {
                        station: new mongoose.Types.ObjectId(
                            stationId as string
                        ),
                    },
                ],
                recording_presigned_url: { $exists: true, $nin: [null, ''] },
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
                isPublic: 1,
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
    console.log('Result previous stream', result);
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

// private , public
const togglePublicPrivate = async (userData: JwtPayload, id: string) => {
    if (userData.role == USER_ROLE.creator) {
        const liveSession = await LiveSession.findOne({
            creator: userData.profileId,
            _id: id,
        });
        if (!liveSession) {
            throw new AppError(httpStatus.NOT_FOUND, 'Live session not found');
        }

        const result = await LiveSession.findByIdAndUpdate(
            id,
            { isPublic: !liveSession.isPublic },
            { new: true, runValidators: true }
        );
        return result;
    } else {
        const liveSession = await LiveSession.findOne({
            creator: null,
            _id: id,
        });
        if (!liveSession) {
            throw new AppError(httpStatus.NOT_FOUND, 'Live session not found');
        }

        const result = await LiveSession.findByIdAndUpdate(
            id,
            { isPublic: !liveSession.isPublic },
            { new: true, runValidators: true }
        );
        return result;
    }
};

const deleteLive = async (profileId: string, id: string) => {
    const result = await LiveSession.findOneAndDelete({
        _id: id,
        creator: profileId,
    });
    if (!result) {
        throw new AppError(httpStatus.NOT_FOUND, 'Live session not found');
    }

    if (result.recording_presigned_url) {
        deleteFileFromS3(result.recording_presigned_url);
    }
};
const LiveSessionServices = {
    createLiveSession,
    endSession,
    updateLiveSessionData,
    getAllLiveSessions,
    togglePublicPrivate,
    deleteLive,
    getMyLivesessions,
    saveRecording,
};
export default LiveSessionServices;
