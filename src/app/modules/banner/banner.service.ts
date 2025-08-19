import httpStatus from 'http-status';
import AppError from '../../error/appError';
import { deleteFileFromS3 } from '../../helper/deleteFromS3';
import { IBanner } from './banner.interface';
import Banner from './banner.model';

const createBanner = async (payload: IBanner) => {
    return await Banner.create(payload);
};

const getAllBanners = async () => {
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
};

const updateBanner = async (id: string, payload: Partial<IBanner>) => {
    const banner = await Banner.findById(id);
    if (!banner) {
        throw new AppError(httpStatus.NOT_FOUND, 'Banner not found');
    }
    const result = await Banner.findByIdAndUpdate(id, payload, { new: true });
    if (payload.image) {
        if (banner.image) {
            deleteFileFromS3(banner.image);
        }
    }
    return result;
};

const deleteBanner = async (id: string) => {
    return await Banner.findByIdAndDelete(id);
};

const BannerServices = {
    createBanner,
    getAllBanners,
    updateBanner,
    deleteBanner,
};

export default BannerServices;
