import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import podcastService from './podcast.service';

const createPodcast = catchAsync(async (req, res) => {
  const result = await podcastService.createPodcastIntoDB(
    req.user.profileId,
    req.body,
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
    req.body,
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

    req.params.id,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Podcast deleted successfully',
    data: result,
  });
});

const podcastController = {
  createPodcast,
  updatePodcast,
  getAllPodcasts,
  getSinglePodcast,
  deletePodcast,
};

export default podcastController;
