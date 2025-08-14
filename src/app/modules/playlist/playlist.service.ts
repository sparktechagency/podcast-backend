import httpStatus from 'http-status';
import AppError from '../../error/appError';
import QueryBuilder from '../../builder/QueryBuilder';

import { deleteFileFromS3 } from '../../helper/deleteFromS3';
import PodcastPlaylist from './playlist.model';
import { IPodcastPlaylist } from './playlist.interface';

// Create Playlist
const createPlaylist = async (userId: string, payload: IPodcastPlaylist) => {
    return await PodcastPlaylist.create({ ...payload, user: userId });
};

// Get All Playlists
const getAllPlaylists = async (query: Record<string, unknown>) => {
    const playlistQuery = new QueryBuilder(
        PodcastPlaylist.find().populate({
            path: 'user',
            select: 'name profile_image',
        }),
        query
    )
        .search(['name', 'description'])
        .filter()
        .sort()
        .paginate()
        .fields();

    const result = await playlistQuery.modelQuery;
    const meta = await playlistQuery.countTotal();

    return { meta, result };
};

const getMyPlaylists = async (
    userId: string,
    query: Record<string, unknown>
) => {
    const playlistQuery = new QueryBuilder(
        PodcastPlaylist.find({ user: userId }),
        query
    )
        .search(['name', 'description'])
        .filter()
        .sort()
        .paginate()
        .fields();

    const result = await playlistQuery.modelQuery;
    const meta = await playlistQuery.countTotal();

    return { meta, result };
};

// const getPlaylistById = async (playlistId: string) => {
//     const playlist = await PodcastPlaylist.findById(playlistId)
//         .populate('user', 'name profile_image')
//         .populate('podcasts');
//     if (!playlist) {
//         throw new AppError(httpStatus.NOT_FOUND, 'Podcast playlist not found');
//     }
//     return playlist;
// };

const getPlaylistById = async (playlistId: string) => {
    const playlist = await PodcastPlaylist.findById(playlistId)
        .populate('user', 'name profile_image')
        .populate({
            path: 'podcasts',
            populate: [
                {
                    path: 'creator',
                    select: 'name profile_image',
                },
                {
                    path: 'category',
                    select: 'name',
                },
                {
                    path: 'subCategory',
                    select: 'name',
                },
            ],
        });

    if (!playlist) {
        throw new AppError(httpStatus.NOT_FOUND, 'Podcast playlist not found');
    }

    return playlist;
};

const updatePlaylist = async (
    userId: string,
    playlistId: string,
    payload: Partial<IPodcastPlaylist>
) => {
    const playlist = await PodcastPlaylist.findOne({
        user: userId,
        _id: playlistId,
    });
    if (!playlist) {
        throw new AppError(httpStatus.NOT_FOUND, 'Podcast playlist not found');
    }

    const updated = await PodcastPlaylist.findByIdAndUpdate(
        playlistId,
        payload,
        {
            new: true,
            runValidators: true,
        }
    );

    if (payload.cover_image && playlist.cover_image) {
        deleteFileFromS3(playlist.cover_image);
    }

    return updated;
};

const deletePlaylist = async (userId: string, playlistId: string) => {
    const playlist = await PodcastPlaylist.findOne({
        user: userId,
        _id: playlistId,
    });
    if (!playlist) {
        throw new AppError(httpStatus.NOT_FOUND, 'Podcast playlist not found');
    }

    const result = await PodcastPlaylist.findByIdAndDelete(playlistId);
    if (playlist.cover_image) {
        deleteFileFromS3(playlist.cover_image);
    }

    return result;
};

const PodcastPlaylistService = {
    createPlaylist,
    getAllPlaylists,
    getPlaylistById,
    getMyPlaylists,
    updatePlaylist,
    deletePlaylist,
};

export default PodcastPlaylistService;
