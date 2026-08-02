export const getCloudFrontUrl = (s3Url: string) => {
    return s3Url.replace(
        'https://podcast-appp-bucket.s3.us-east-1.amazonaws.com',
        'https://d2263773avtgf9.cloudfront.net'
    );
};
