/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import podcastService from './podcast.service';
import { getCloudFrontUrl } from '../../helper/mutler-s3-uploader';
import generateETag from '../../helper/generateEtag';

const createPodcast = catchAsync(async (req, res) => {
    const file: any = req.files?.podcast_cover;
    if (req.files?.podcast_cover) {
        req.body.coverImage = getCloudFrontUrl(file[0].key);
    }
    const result = await podcastService.createPodcastIntoDB(
        req.user.profileId,
        req.body
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Podcast created successfully',
        data: result,
    });
});

const updatePodcast = catchAsync(async (req, res) => {
    const result = await podcastService.updatePodcastIntoDB(
        req.user.profileId,
        req.params.id,
        req.body
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Podcast updated successfully',
        data: result,
    });
});

const getAllPodcasts = catchAsync(async (req, res) => {
    const result = await podcastService.getAllPodcasts(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Podcasts retrieved successfully',
        data: result,
    });
});

const getSinglePodcast = catchAsync(async (req, res) => {
    const result = await podcastService.getSinglePodcast(req.params.id);

    const eTag = generateETag(result);

    // Check If-None-Match header (sent by client if cached)
    if (req.headers['if-none-match'] === eTag) {
        return res.status(304).end(); // No change
    }

    // Set ETag header in the response
    res.setHeader('ETag', eTag);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Podcast retrieved successfully',
        data: result,
    });
});

const deletePodcast = catchAsync(async (req, res) => {
    const result = await podcastService.deletePodcastFromDB(
        req.user.profileId,

        req.params.id
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Podcast deleted successfully',
        data: result,
    });
});
const viewPodcast = catchAsync(async (req, res) => {
    const result = await podcastService.countPodcastView(
        req.user.profileId,
        req.params.id
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Podcast viewed successfully',
        data: result,
    });
});

const podcastController = {
    createPodcast,
    updatePodcast,
    getAllPodcasts,
    getSinglePodcast,
    deletePodcast,
    viewPodcast,
};

export default podcastController;
