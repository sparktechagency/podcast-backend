import { model, Schema } from "mongoose";
import { ISubCategory } from "./subCategory.interface";

const subCategorySchema = new Schema<ISubCategory>({
    user: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String, required: true, unique: true },
    address: { type: String },
    profile_image: { type: String, default: "" },
    totalAmount: { type: Number, default: 0 },
    totalPoint: { type: Number, default: 0 }
}, { timestamps: true });

const subCategoryModel = model<ISubCategory>("SubCategory", subCategorySchema);
export default subCategoryModel;