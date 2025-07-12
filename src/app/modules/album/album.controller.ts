import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import { getCloudFrontUrl } from '../../helper/mutler-s3-uploader';
import AlbumService from './album.service';

/* eslint-disable @typescript-eslint/no-explicit-any */
const createAlbum = catchAsync(async (req, res) => {
    const file: any = req.files?.album_cover;
    if (file) {
        req.body.cover_image = getCloudFrontUrl(file[0].key);
    }

    const result = await AlbumService.createAlbum(req.body);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Album created successfully',
        data: result,
    });
});

const getAllAlbums = catchAsync(async (req, res) => {
    const result = await AlbumService.getAllAlbums(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Albums retrieved successfully',
        data: result,
    });
});

const getAlbumById = catchAsync(async (req, res) => {
    const result = await AlbumService.getAlbumById(req.params.albumId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Album retrieved successfully',
        data: result,
    });
});

const updateAlbum = catchAsync(async (req, res) => {
    const file: any = req.files?.album_cover;
    if (file) {
        req.body.cover_image = getCloudFrontUrl(file[0].key);
    }

    const result = await AlbumService.updateAlbum(req.params.albumId, req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Album updated successfully',
        data: result,
    });
});

const deleteAlbum = catchAsync(async (req, res) => {
    const result = await AlbumService.deleteAlbum(req.params.albumId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Album deleted successfully',
        data: result,
    });
});

const AlbumController = {
    createAlbum,
    getAllAlbums,
    getAlbumById,
    updateAlbum,
    deleteAlbum,
};

export default AlbumController;
