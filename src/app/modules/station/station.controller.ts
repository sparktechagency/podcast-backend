/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { getCloudFrontUrl } from '../../helper/mutler-s3-uploader';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import stationServices from './station.service';

const updateStation = catchAsync(async (req, res) => {
    const file: any = req.files?.profile_image;
    if (file) {
        req.body.profile_image = getCloudFrontUrl(file[0].key);
    }
    const file2: any = req.files?.cover_image;
    if (file2) {
        req.body.cover_image = getCloudFrontUrl(file2[0].key);
    }
    const result = await stationServices.updateStation(req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Station updated successfully',
        data: result,
    });
});

const StationController = { updateStation };
export default StationController;
