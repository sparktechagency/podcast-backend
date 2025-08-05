import httpStatus from "http-status";
import AppError from "../../error/appError";
import { IComment } from "./comment.interface";
import commentModel from "./comment.model";

const updateUserProfile = async (id: string, payload: Partial<IComment>) => {
    if (payload.email || payload.username) {
        throw new AppError(httpStatus.BAD_REQUEST, "You cannot change the email or username");
    }
    const user = await commentModel.findById(id);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "Profile not found");
    }
    return await commentModel.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
};

const CommentServices = { updateUserProfile };
export default CommentServices;