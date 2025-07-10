/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import AdminServices from './admin.services';

// register Admin
const createAdmin = catchAsync(async (req, res) => {
    const result = await AdminServices.createAdmin(req.body);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Admin created successfully',
        data: result,
    });
});

const updateAdminProfile = catchAsync(async (req, res) => {
    const result = await AdminServices.updateAdminProfile(
        req?.params?.id,
        req?.body
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Admin profile updated successfully',
        data: result,
    });
});

const deleteAdmin = catchAsync(async (req, res) => {
    const result = await AdminServices.deleteAdminFromDB(req?.params.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Admin deleted successfully',
        data: result,
    });
});

// update shop status
const updateAdminStatus = catchAsync(async (req, res) => {
    const result = await AdminServices.updateAdminStatus(req?.params?.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Admin status updated successfully',
        data: result,
    });
});

//
const getAllAdmin = catchAsync(async (req, res) => {
    const result = await AdminServices.getAllAdminFromDB(req?.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Admin retrieved successfully',
        data: result,
    });
});
const getSingleAdmin = catchAsync(async (req, res) => {
    const result = await AdminServices.getSingleAdmin(req?.params.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Admin retrieved successfully',
        data: result,
    });
});

const AdminController = {
    updateAdminProfile,
    createAdmin,
    updateAdminStatus,
    getAllAdmin,
    getSingleAdmin,
    deleteAdmin,
};

export default AdminController;
