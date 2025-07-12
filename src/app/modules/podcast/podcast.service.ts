import httpStatus from 'http-status';
import AppError from '../../error/appError';
import { IPodcast } from './podcast.interface';
import Podcast from './podcast.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { deleteFileFromS3 } from '../../helper/deleteFromS3';
import Category from '../category/category.model';
import SubCategory from '../subCategory/subCategory.model';

const createPodcastIntoDB = async (userId: string, payload: IPodcast) => {
    const [category, subCategory] = await Promise.all([
        Category.findById(payload.category),
        SubCategory.findById(payload.subCategory),
    ]);

    if (!category || !subCategory) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            !category ? 'Category not found' : 'Sub category not found'
        );
    }

    return await Podcast.create({ ...payload, user: userId });
};

const updatePodcastIntoDB = async (
    userId: string,
    id: string,
    payload: Partial<IPodcast>
) => {
    const podcast = await Podcast.findOne({ _id: id, user: userId });
    if (!podcast) {
        throw new AppError(httpStatus.NOT_FOUND, 'Podcast not found');
    }

    const reuslt = await Podcast.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });

    if (payload.coverImage && podcast?.coverImage) {
        deleteFileFromS3(podcast?.coverImage);
    }

    return reuslt;
};

const getAllPodcasts = async (query: Record<string, unknown>) => {
    const resultQuery = new QueryBuilder(Podcast.find(), query)
        .search(['name', 'title', 'description'])
        .fields()
        .filter()
        .paginate()
        .sort();

    const result = await resultQuery.modelQuery;
    const meta = await resultQuery.countTotal();

    return { meta, result };
};

const getSinglePodcast = async (id: string) => {
    const podcast = await Podcast.findById(id);
    if (!podcast) {
        throw new AppError(httpStatus.NOT_FOUND, 'Podcast not found');
    }

    return podcast;
};

const deletePodcastFromDB = async (userId: string, id: string) => {
    const podcast = await Podcast.findOne({ _id: id, user: userId });
    if (!podcast) {
        throw new AppError(httpStatus.NOT_FOUND, 'Podcast not found');
    }

    return await Podcast.findByIdAndDelete(id);
};

const podcastService = {
    createPodcastIntoDB,
    updatePodcastIntoDB,
    getAllPodcasts,
    getSinglePodcast,
    deletePodcastFromDB,
};

export default podcastService;
