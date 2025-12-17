import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    addNewCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    getCategoryHierarchy,
    updateCategoryTaxRateAndProducts,
    deactivateCategoryAndProducts,
    activateCategoryAndProducts
} from "../controllers/category.controllers.js";

const categoryRouter = Router();

categoryRouter.route("/addNewCategory").post( addNewCategory);
categoryRouter.route("/getAllCategories").get(getAllCategories);
categoryRouter.route("/getCategoryById/:categoryId").get( getCategoryById);
categoryRouter.route("/updateCategory/:categoryId").put( updateCategory);
categoryRouter.route("/deleteCategory/:categoryId").delete( deleteCategory);
categoryRouter.route("/updateCategoryTaxRateAndProducts/:categoryId").put( updateCategoryTaxRateAndProducts);
categoryRouter.route("/deactivateCategoryAndProducts/:categoryId").put( deactivateCategoryAndProducts);
categoryRouter.route("/getCategoryHierarchy").get( getCategoryHierarchy);
categoryRouter.route("/activateCategoryAndProducts/:categoryId").put(activateCategoryAndProducts);

export default categoryRouter;