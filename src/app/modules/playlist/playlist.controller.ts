/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import { getCloudFrontUrl } from '../../helper/mutler-s3-uploader';
import PodcastPlaylistService from './playlist.service';

const createPlaylist = catchAsync(async (req, res) => {
    const file: any = req.files?.playlist_cover;
    if (file) {
        req.body.cover_image = getCloudFrontUrl(file[0].key);
    }

    const result = await PodcastPlaylistService.createPlaylist(
        req.user.profileId,
        req.body
    );
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Podcast playlist created successfully',
        data: result,
    });
});

const getAllPlaylists = catchAsync(async (req, res) => {
    const result = await PodcastPlaylistService.getAllPlaylists(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Podcast playlists retrieved successfully',
        data: result,
    });
});

const getMyPlaylists = catchAsync(async (req, res) => {
    const result = await PodcastPlaylistService.getMyPlaylists(
        req.user.profileId,
        req.query
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'My podcast playlists retrieved successfully',
        data: result,
    });
});

const getPlaylistById = catchAsync(async (req, res) => {
    const result = await PodcastPlaylistService.getPlaylistById(
        req.params.playlistId
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Podcast playlist retrieved successfully',
        data: result,
    });
});

const updatePlaylist = catchAsync(async (req, res) => {
    const file: any = req.files?.playlist_cover;
    if (file) {
        req.body.cover_image = getCloudFrontUrl(file[0].key);
    }

    const result = await PodcastPlaylistService.updatePlaylist(
        req.user.profileId,
        req.params.playlistId,
        req.body
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Podcast playlist updated successfully',
        data: result,
    });
});

const deletePlaylist = catchAsync(async (req, res) => {
    const result = await PodcastPlaylistService.deletePlaylist(
        req.user.profileId,
        req.params.playlistId
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Podcast playlist deleted successfully',
        data: result,
    });
});

const PodcastPlaylistController = {
    createPlaylist,
    getAllPlaylists,
    getMyPlaylists,
    getPlaylistById,
    updatePlaylist,
    deletePlaylist,
};

export default PodcastPlaylistController;
