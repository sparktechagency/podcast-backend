import httpStatus from "http-status";
import AppError from "../../error/appError";
import { IBookmark } from "./bookmark.interface";
import bookmarkModel from "./bookmark.model";

const updateUserProfile = async (id: string, payload: Partial<IBookmark>) => {
    if (payload.email || payload.username) {
        throw new AppError(httpStatus.BAD_REQUEST, "You cannot change the email or username");
    }
    const user = await bookmarkModel.findById(id);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "Profile not found");
    }
    return await bookmarkModel.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
};

const BookmarkServices = { updateUserProfile };
export default BookmarkServices;