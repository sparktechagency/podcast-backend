import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLE } from '../user/user.constant';
import ReportController from './report.controller';
import ReportValidations from './report.validation';

const router = express.Router();

router.post(
    '/create-report',
    auth(USER_ROLE.user, USER_ROLE.creator),
    validateRequest(ReportValidations.reportValidationSchema),
    ReportController.createReport
);

router.get(
    '/all-reports',
    auth(USER_ROLE.superAdmin, USER_ROLE.admin),
    ReportController.getAllReports
);
///
export const reportRoutes = router;
