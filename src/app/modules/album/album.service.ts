import httpStatus from 'http-status';
import AppError from '../../error/appError';
import QueryBuilder from '../../builder/QueryBuilder';
import { deleteFileFromS3 } from '../../helper/deleteFromS3';
import Album from './album.model';
import { IAlbum } from './album.interface';

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
        select: 'title name coverImage description, duration audio_url video_url creator subCategory category address location tags totalView createdAt',
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
                select: 'name profile_image', // optional, in case you want creator details too
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

const AlbumService = {
    createAlbum,
    getAllAlbums,
    getAlbumById,
    updateAlbum,
    deleteAlbum,
};

export default AlbumService;
