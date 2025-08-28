import httpStatus from "http-status";
import catchAsync from "../../utilities/catchasync";
import sendResponse from "../../utilities/sendResponse";
import liveStreamingServices from "./liveStreaming.service";

const updateUserProfile = catchAsync(async (req, res) => {
    const { files } = req;
    if (files && typeof files === "object" && "profile_image" in files) {
        req.body.profile_image = files["profile_image"][0].path;
    }
    const result = await liveStreamingServices.updateUserProfile(
        req.user.profileId,
        req.body
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Profile updated successfully",
        data: result,
    });
});

const LiveStreamingController = { updateUserProfile };
export default LiveStreamingController;