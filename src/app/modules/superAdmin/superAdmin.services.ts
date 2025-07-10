import httpStatus from 'http-status';
import { ISuperAdmin } from './superAdmin.interface';
import AppError from '../../error/appError';
import SuperAdmin from './superAdmin.model';
import { USER_ROLE } from '../user/user.constant';
import { JwtPayload } from 'jsonwebtoken';
import Admin from '../admin/admin.model';

const updateSuperAdminProfile = async (
    userData: JwtPayload,
    payload: Partial<ISuperAdmin>
) => {
    if (payload.email) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'You can not change the email'
        );
    }
    if (userData.role == USER_ROLE.admin) {
        const user = await Admin.findById(userData.profileId);
        if (!user) {
            throw new AppError(httpStatus.NOT_FOUND, 'Profile not found');
        }
        const result = await Admin.findByIdAndUpdate(
            userData.profileId,
            payload,
            {
                new: true,
                runValidators: true,
            }
        );
        return result;
    } else {
        const user = await SuperAdmin.findById(userData.profileId);
        if (!user) {
            throw new AppError(httpStatus.NOT_FOUND, 'Profile not found');
        }
        const result = await SuperAdmin.findByIdAndUpdate(
            userData.profileId,
            payload,
            {
                new: true,
                runValidators: true,
            }
        );
        return result;
    }
};

const SuperAdminServices = {
    updateSuperAdminProfile,
};

export default SuperAdminServices;
