import httpStatus from 'http-status';
import AppError from '../../error/appError';
import { deleteFileFromS3 } from '../../helper/deleteFromS3';
import { IBanner } from './banner.interface';
import Banner from './banner.model';
import { JwtPayload } from 'jsonwebtoken';
import { USER_ROLE } from '../user/user.constant';
import cron from 'node-cron';
import QueryBuilder from '../../builder/QueryBuilder';
const createBanner = async (payload: IBanner) => {
    if (payload.endDate <= payload.startDate) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'End date must be greater than start date'
        );
    }
    return await Banner.create(payload);
};

const getAllBanners = async (
    userData: JwtPayload,
    query: Record<string, unknown>
) => {
    if (userData.role != USER_ROLE.superAdmin) {
        const today = new Date();
        const result = await Banner.aggregate([
            {
                $match: {
                    startDate: { $lte: today },
                    endDate: { $gte: today },
                },
            },
            {
                $sample: { size: 20 },
            },
        ]);
        return result;
    } else {
        const albumQuery = new QueryBuilder(Banner.find(), query)
            .search(['name', 'description'])
            .paginate()
            .fields();

        const result = await albumQuery.modelQuery;
        const meta = await albumQuery.countTotal();
        return { meta, result };
    }
};

const updateBanner = async (id: string, payload: Partial<IBanner>) => {
    const banner = await Banner.findById(id);
    if (!banner) {
        throw new AppError(httpStatus.NOT_FOUND, 'Banner not found');
    }
    if (payload.startDate && payload.endDate) {
        if (payload.endDate <= payload.startDate) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                'End date must be greater than start date'
            );
        }
    } else if (payload.startDate) {
        if (banner.endDate <= payload.startDate) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                'End date must be greater than start date'
            );
        }
    } else if (payload.endDate) {
        if (payload.endDate <= banner.startDate) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                'End date must be greater than start date'
            );
        }
    }
    const result = await Banner.findByIdAndUpdate(id, payload, { new: true });
    if (payload.banner_url) {
        if (banner.banner_url) {
            deleteFileFromS3(banner.banner_url);
        }
    }
    return result;
};

const deleteBanner = async (id: string) => {
    const result = await Banner.findByIdAndDelete(id);
    if (!result) {
        throw new AppError(httpStatus.NOT_FOUND, 'Banner not found');
    }
    if (result.banner_url) {
        deleteFileFromS3(result.banner_url);
    }
    return result;
};
cron.schedule('0 0 * * *', async () => {
    try {
        const expiredBanners = await Banner.find({
            endDate: { $lt: new Date() },
        });

        for (const banner of expiredBanners) {
            if (banner.banner_url) {
                try {
                    await deleteFileFromS3(banner.banner_url);
                    console.log(
                        `[CRON JOB] Deleted image from S3: ${banner.banner_url}`
                    );
                } catch (s3Error) {
                    console.error(
                        `[CRON JOB ERROR] Failed to delete S3 file: ${banner.banner_url}`,
                        s3Error
                    );
                }
            }

            await Banner.findByIdAndDelete(banner._id);
        }

        console.log(
            `[CRON JOB] Deleted ${
                expiredBanners.length
            } expired banners at ${new Date().toISOString()}`
        );
    } catch (error) {
        console.error(
            '[CRON JOB ERROR] Failed to delete expired banners:',
            error
        );
    }
});

const BannerServices = {
    createBanner,
    getAllBanners,
    updateBanner,
    deleteBanner,
};

export default BannerServices;
