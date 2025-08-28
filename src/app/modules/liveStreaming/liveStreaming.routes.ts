import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLE } from "../user/user.constant";
import validateRequest from "../../middlewares/validateRequest";
import liveStreamingValidations from "./liveStreaming.validation";
import liveStreamingController from "./liveStreaming.controller";
import { uploadFile } from "../../helper/fileUploader";

const router = express.Router();

router.patch(
    "/update-profile",
    auth(USER_ROLE.user),
    uploadFile(),
    (req, res, next) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },
    validateRequest(liveStreamingValidations.updateLiveStreamingData),
    liveStreamingController.updateUserProfile
);

export const liveStreamingRoutes = router;