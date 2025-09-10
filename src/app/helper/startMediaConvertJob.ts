import {
    CreateJobCommand,
    MediaConvertClient,
} from '@aws-sdk/client-mediaconvert';
import dotenv from 'dotenv';

dotenv.config();

const mediaConvertClient = new MediaConvertClient({
    region: process.env.AWS_MEDIACONVERT_REGION!, // Region of MediaConvert endpoint
    endpoint: process.env.AWS_MEDIACONVERT_ENDPOINT!, // MediaConvert endpoint URL
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

/**
 * Convert uploaded file into HLS format using MediaConvert
 * @param rawFileKeyOrUrl - S3 key or full S3 URL of uploaded file
 * @returns HLS playlist CloudFront URL
 */
export async function startMediaConvertJob(
    rawFileKeyOrUrl: string
): Promise<string> {
    const inputBucket = process.env.AWS_S3_BUCKET_NAME!;
    const outputBucket = process.env.AWS_S3_BUCKET_NAME!;
    const cloudfrontDomain = process.env.CLOUDFRONT_URL!; // e.g. https://dxxxxxxx.cloudfront.net

    // Extract S3 key if a full URL is passed
    let rawFileKey = rawFileKeyOrUrl;
    if (rawFileKeyOrUrl.startsWith('http')) {
        const url = new URL(rawFileKeyOrUrl);
        rawFileKey = url.pathname.replace(/^\/+/, ''); // remove leading slash
    }

    const fileBaseName =
        rawFileKey.split('/').pop()?.split('.')[0] || Date.now();

    const outputPrefix = `hls/${fileBaseName}/`;

    const params = {
        Role: process.env.AWS_MEDIACONVERT_ROLE_ARN!, // IAM role with MediaConvert + S3 access
        Settings: {
            Inputs: [
                {
                    FileInput: `s3://${inputBucket}/${rawFileKey}`,
                },
            ],
            OutputGroups: [
                {
                    Name: 'HLS Group',
                    OutputGroupSettings: {
                        Type: 'HLS_GROUP_SETTINGS',
                        HlsGroupSettings: {
                            SegmentLength: 6,
                            MinSegmentLength: 1, // ✅ REQUIRED
                            Destination: `s3://${outputBucket}/${outputPrefix}`,
                        },
                    },
                    Outputs: [
                        {
                            VideoDescription: {
                                CodecSettings: {
                                    Codec: 'H_264',
                                    H264Settings: {
                                        RateControlMode: 'QVBR',
                                        QualityTuningLevel: 'SINGLE_PASS',
                                        QvbrSettings: {
                                            QualityLevel: 8,
                                        },
                                        CodecLevel: 'AUTO',
                                        CodecProfile: 'MAIN',
                                        MaxBitrate: 5000000, // ✅ required
                                    },
                                },
                            },
                            AudioDescriptions: [
                                {
                                    CodecSettings: {
                                        Codec: 'AAC',
                                        AacSettings: {
                                            Bitrate: 96000,
                                            CodingMode: 'CODING_MODE_2_0',
                                            SampleRate: 48000,
                                        },
                                    },
                                },
                            ],
                            ContainerSettings: { Container: 'M3U8' },
                            NameModifier: '_hls',
                        },
                    ],
                },
            ],
        },
    };

    try {
        const command = new CreateJobCommand(params);
        const response = await mediaConvertClient.send(command);
        console.log('MediaConvert job started:', response);

        // Build the HLS playlist URL (CloudFront URL)
        const playlistUrl = `${cloudfrontDomain}/${outputPrefix}index.m3u8`;

        return playlistUrl;
    } catch (err) {
        console.error('Error starting MediaConvert job:', err);
        throw new Error('Failed to start MediaConvert job');
    }
}
