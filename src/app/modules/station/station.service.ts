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

const StationServices = { updateStation };
export default StationServices;
