import validateRequest from '../../middlewares/validateRequest';
import userControllers from './user.controller';
import { NextFunction, Request, Response, Router } from 'express';
import userValidations from './user.validation';
import normalUserValidations from '../normalUser/normalUser.validation';
import auth from '../../middlewares/auth';
import { USER_ROLE } from './user.constant';
import { uploadFile } from '../../helper/mutler-s3-uploader';

const router = Router();

router.post(
    '/register-user',
    validateRequest(normalUserValidations.registerNormalUserValidationSchema),
    userControllers.registerUser
);
router.post(
    '/verify-code',
    validateRequest(userValidations.verifyCodeValidationSchema),
    userControllers.verifyCode
);

router.post(
    '/resend-verify-code',
    validateRequest(userValidations.resendVerifyCodeSchema),
    userControllers.resendVerifyCode
);
router.get(
    '/get-my-profile',
    auth(
        USER_ROLE.user,
        USER_ROLE.admin,
        USER_ROLE.superAdmin,
        USER_ROLE.creator
    ),
    userControllers.getMyProfile
);

router.patch(
    '/update-profile',
    auth(
        USER_ROLE.user,
        USER_ROLE.superAdmin,
        USER_ROLE.admin,
        USER_ROLE.creator
    ),
    uploadFile(),
    (req: Request, res: Response, next: NextFunction) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },
    validateRequest(normalUserValidations.updateNormalUserValidationSchema),
    userControllers.updateUserProfile
);

router.patch(
    '/block-unblock/:id',
    auth(USER_ROLE.superAdmin),
    userControllers.changeUserStatus
);
router.delete(
    '/delete-account',
    auth(USER_ROLE.user, USER_ROLE.creator),
    validateRequest(userValidations.deleteUserAccountValidationSchema),
    userControllers.deleteUserAccount
);

router.get(
    '/get-my-profile',
    auth(USER_ROLE.user, USER_ROLE.superAdmin),
    userControllers.getMyProfile
);

export const userRoutes = router;
