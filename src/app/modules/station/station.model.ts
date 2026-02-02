import { model, Schema } from "mongoose";
import { IStation } from "./station.interface";

const stationSchema = new Schema<IStation>({
    user: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String, required: true, unique: true },
    address: { type: String },
    profile_image: { type: String, default: "" },
    totalAmount: { type: Number, default: 0 },
    totalPoint: { type: Number, default: 0 }
}, { timestamps: true });

const stationModel = model<IStation>("Station", stationSchema);
export default stationModel;