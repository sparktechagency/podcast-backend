/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    signatureVersion: 'v4',
});

// 🔧 Utility function to determine folder from fileCategory
function getS3Folder(fileCategory: string): string {
    switch (fileCategory) {
        case 'profile_image':
            return 'uploads/images/profile/';
        case 'project_image':
            return 'uploads/images/project_image/';
        case 'podcast_video':
            return 'uploads/videos/';
        case 'project_document':
            return 'uploads/documents/project_document/';
        case 'material_image':
            return 'uploads/images/project_material_image/';
        case 'podcast_audio':
            return 'uploads/audios/';
        default:
            return 'uploads/others/';
    }
}

const initiateMultipartUpload = catchAsync(async (req, res) => {
    const { fileType, fileCategory } = req.body;
    if (!fileType || !fileCategory) {
        return res
            .status(400)
            .json({ error: 'Missing fileType or fileCategory' });
    }

    const timestamp = Date.now();
    const folder = getS3Folder(fileCategory);
    const fileExtension = fileType.split('/')[1];
    const fileName = `${folder}${timestamp}-${Math.random()
        .toString(36)
        .substring(2, 15)}.${fileExtension}`;

    const params = {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: fileName,
        ContentType: fileType,
    };

    const multipartUpload = await s3.createMultipartUpload(params).promise();
    const data = {
        uploadId: multipartUpload.UploadId,
        key: multipartUpload.Key,
    };
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Inititate successfull for multipart upload',
        data: data,
    });
});
const getPresignedUrlForMultipartUpload = catchAsync(async (req, res) => {
    const { key, uploadId, partNumber } = req.body;
    if (!key || !uploadId || !partNumber) {
        return res
            .status(400)
            .json({ error: 'Missing key, uploadId or partNumber' });
    }

    const params = {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
        Expires: 60 * 5, // 5 minutes
    };

    const presignedUrl = await s3.getSignedUrlPromise('uploadPart', params);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Presigned url generated successfully',
        data: { presignedUrl },
    });
});
const completeUpload = catchAsync(async (req, res) => {
    const { key, uploadId, parts } = req.body;

    if (!key || !uploadId || !parts) {
        return res
            .status(400)
            .json({ error: 'Missing key, uploadId, or parts' });
    }

    const params = {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
            Parts: parts, // format: [{ ETag, PartNumber }, ...]
        },
    };

    const completeRes = await s3.completeMultipartUpload(params).promise();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Upload completed',
        data: { location: completeRes.Location },
    });
});
const abortMultipartUpload = catchAsync(async (req, res) => {
    const { key, uploadId } = req.body;

    if (!key || !uploadId) {
        return res.status(400).json({ error: 'Missing key or uploadId' });
    }

    await s3
        .abortMultipartUpload({
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: key,
            UploadId: uploadId,
        })
        .promise();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Upload aborted',
        data: null,
    });
});

const s3Controller = {
    initiateMultipartUpload,
    getPresignedUrlForMultipartUpload,
    completeUpload,
    abortMultipartUpload,
};

export default s3Controller;
