import httpStatus from "http-status";
import AppError from "../../error/appError";
import { IStation } from "./station.interface";
import stationModel from "./station.model";

const updateUserProfile = async (id: string, payload: Partial<IStation>) => {
    if (payload.email || payload.username) {
        throw new AppError(httpStatus.BAD_REQUEST, "You cannot change the email or username");
    }
    const user = await stationModel.findById(id);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "Profile not found");
    }
    return await stationModel.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
};

const StationServices = { updateUserProfile };
export default StationServices;