import httpStatus from 'http-status';
import mongoose from 'mongoose';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../error/appError';
import { deleteFileFromS3 } from '../../helper/deleteFromS3';
import { IAlbum } from './album.interface';
import Album from './album.model';

const createAlbum = async (payload: IAlbum) => {
    return await Album.create(payload);
};

const getAllAlbums = async (query: Record<string, unknown>) => {
    const albumQuery = new QueryBuilder(Album.find(), query)
        .search(['name', 'description'])
        .filter()
        .sort()
        .paginate()
        .fields();

    const result = await albumQuery.modelQuery;
    const meta = await albumQuery.countTotal();
    return { meta, result };
};

const getAlbumById = async (albumId: string) => {
    const album = await Album.findById(albumId).populate({
        path: 'podcasts',
        select: 'title name coverImage description, duration podcast_url creator subCategory category address location tags totalView createdAt',
        populate: [
            {
                path: 'category',
                select: 'name',
            },
            {
                path: 'subCategory',
                select: 'name',
            },
            {
                path: 'creator',
                select: 'name profile_image',
            },
            {
                path: 'station',
                select: 'name profile_image',
            },
        ],
    });
    if (!album) {
        throw new AppError(httpStatus.NOT_FOUND, 'Album not found');
    }
    return album;
};

const updateAlbum = async (albumId: string, payload: Partial<IAlbum>) => {
    const existingAlbum = await Album.findById(albumId);
    if (!existingAlbum) {
        throw new AppError(httpStatus.NOT_FOUND, 'Album not found');
    }

    const updated = await Album.findByIdAndUpdate(albumId, payload, {
        new: true,
        runValidators: true,
    });

    if (payload.cover_image && existingAlbum.cover_image) {
        deleteFileFromS3(existingAlbum.cover_image);
    }

    return updated;
};

const deleteAlbum = async (albumId: string) => {
    const album = await Album.findById(albumId);
    if (!album) {
        throw new AppError(httpStatus.NOT_FOUND, 'Album not found');
    }

    const result = await Album.findByIdAndDelete(albumId);
    if (album.cover_image) {
        deleteFileFromS3(album.cover_image);
    }

    return result;
};

const addPodcastToAlbum = async (albumId: string, podcastId: string) => {
    const album = await Album.findById(albumId);
    if (!album) {
        throw new AppError(httpStatus.NOT_FOUND, 'Album not found');
    }

    if (album.podcasts.includes(new mongoose.Types.ObjectId(podcastId))) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Podcast already in album');
    }

    album.podcasts.push(new mongoose.Types.ObjectId(podcastId));
    await album.save();

    return album;
};

/**
 */
const removePodcastFromAlbum = async (albumId: string, podcastId: string) => {
    const album = await Album.findById(albumId);
    if (!album) {
        throw new AppError(httpStatus.NOT_FOUND, 'Album not found');
    }

    if (!album.podcasts.includes(new mongoose.Types.ObjectId(podcastId))) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'Podcast not found in album'
        );
    }

    album.podcasts = album.podcasts.filter((p) => p.toString() !== podcastId);
    await album.save();

    return album;
};
const AlbumService = {
    createAlbum,
    getAllAlbums,
    getAlbumById,
    updateAlbum,
    deleteAlbum,
    addPodcastToAlbum,
    removePodcastFromAlbum,
};

export default AlbumService;
