import express, { Request, Response, NextFunction } from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import validateRequest from '../../middlewares/validateRequest';
import subCategoryValidation from './subCategory.validation';
import subCategoryController from './subCategory.controller';
import { uploadFile } from '../../helper/mutler-s3-uploader';

const router = express.Router();

router.post(
    '/create-subcategory',
    auth(USER_ROLE.superAdmin),
    uploadFile(),
    (req: Request, res: Response, next: NextFunction) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },
    validateRequest(subCategoryValidation.createSubCategoryValidationSchema),
    subCategoryController.createSubCategory
);

router.patch(
    '/update-subcategory/:id',
    auth(USER_ROLE.superAdmin),
    uploadFile(),
    (req: Request, res: Response, next: NextFunction) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },
    validateRequest(subCategoryValidation.updateSubCategoryValidationSchema),
    subCategoryController.updateSubCategory
);

router.get('/all-subcategories', subCategoryController.getAllSubCategories);
router.get(
    '/get-single-subcategory/:id',
    subCategoryController.getSingleSubCategory
);
router.delete(
    '/delete-subcategory/:id',
    auth(USER_ROLE.superAdmin),
    subCategoryController.deleteSubCategory
);

export const subCategoryRoutes = router;
