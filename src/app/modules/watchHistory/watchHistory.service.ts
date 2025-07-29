import httpStatus from "http-status";
import AppError from "../../error/appError";
import { IWatchHistory } from "./watchHistory.interface";
import watchHistoryModel from "./watchHistory.model";

const updateUserProfile = async (id: string, payload: Partial<IWatchHistory>) => {
    if (payload.email || payload.username) {
        throw new AppError(httpStatus.BAD_REQUEST, "You cannot change the email or username");
    }
    const user = await watchHistoryModel.findById(id);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "Profile not found");
    }
    return await watchHistoryModel.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
};

const WatchHistoryServices = { updateUserProfile };
export default WatchHistoryServices;