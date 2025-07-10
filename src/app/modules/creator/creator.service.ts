import httpStatus from "http-status";
import AppError from "../../error/appError";
import { ICreator } from "./creator.interface";
import creatorModel from "./creator.model";

const updateUserProfile = async (id: string, payload: Partial<ICreator>) => {
    if (payload.email || payload.username) {
        throw new AppError(httpStatus.BAD_REQUEST, "You cannot change the email or username");
    }
    const user = await creatorModel.findById(id);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "Profile not found");
    }
    return await creatorModel.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
};

const CreatorServices = { updateUserProfile };
export default CreatorServices;