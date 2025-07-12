import httpStatus from "http-status";
import AppError from "../../error/appError";
import { IAlbum } from "./album.interface";
import albumModel from "./album.model";

const updateUserProfile = async (id: string, payload: Partial<IAlbum>) => {
    if (payload.email || payload.username) {
        throw new AppError(httpStatus.BAD_REQUEST, "You cannot change the email or username");
    }
    const user = await albumModel.findById(id);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "Profile not found");
    }
    return await albumModel.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
};

const AlbumServices = { updateUserProfile };
export default AlbumServices;