import httpStatus from "http-status";
import AppError from "../../error/appError";
import { ISubCategory } from "./subCategory.interface";
import subCategoryModel from "./subCategory.model";

const updateUserProfile = async (id: string, payload: Partial<ISubCategory>) => {
    if (payload.email || payload.username) {
        throw new AppError(httpStatus.BAD_REQUEST, "You cannot change the email or username");
    }
    const user = await subCategoryModel.findById(id);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "Profile not found");
    }
    return await subCategoryModel.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
};

const SubCategoryServices = { updateUserProfile };
export default SubCategoryServices;