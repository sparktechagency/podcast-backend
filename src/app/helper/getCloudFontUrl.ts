export const getCloudFrontUrl = (s3Url: string) => {
    return s3Url.replace(
        'https://candor-construction-bucket.s3.us-east-1.amazonaws.com',
        'https://d3ncowk7trw8mo.cloudfront.net'
    );
};
