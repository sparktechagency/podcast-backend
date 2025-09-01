/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../error/appError';
import NormalUser from '../normalUser/normalUser.model';
import { USER_ROLE } from '../user/user.constant';
import { IReport } from './report.interface';
import Report from './report.model';

const createReport = async (userData: JwtPayload, payload: IReport) => {
    if (new mongoose.Types.ObjectId(userData?.profileId) == payload.reportTo) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'You are not able to report yourself'
        );
    }
    const reportTo: any = await NormalUser.findOne(payload.reportTo)
        .select('user')
        .populate({ path: 'user', select: 'role' });
    if (!reportTo) {
        throw new AppError(httpStatus.NOT_FOUND, 'Reported user not found');
    }
    payload.reportToModel =
        reportTo.user.role == USER_ROLE.user ? 'NormalUser' : 'Creator';
    payload.reportFromModel =
        userData.role == USER_ROLE.user ? 'NormalUser' : 'Creator';
    const result = await Report.create({
        ...payload,
        reportFrom: userData.profileId,
    });
    // const notificaitonData = {
    //     title: 'Profile Report',
    //     message: 'A user report a profile',
    //     receiver: USER_ROLE.superAdmin,
    //     type: ENUM_NOTIFICATION_TYPE.GENERAL,
    // };

    // sendNotification(notificaitonData);
    return result;
};

const getAllReports = async (query: Record<string, unknown>) => {
    const reportQuery = new QueryBuilder(
        Report.find()
            .populate({
                path: 'reportFrom',
                select: 'profile_image name',
            })
            .populate({
                path: 'reportTo',
                select: 'profile_image name',
            }),
        query
    )
        .search(['incidentType'])
        .fields()
        .filter()
        .paginate()
        .sort();

    const result = await reportQuery.modelQuery;
    const meta = await reportQuery.countTotal();

    return {
        meta,
        result,
    };
};

const ReportService = {
    createReport,
    getAllReports,
};

export default ReportService;
