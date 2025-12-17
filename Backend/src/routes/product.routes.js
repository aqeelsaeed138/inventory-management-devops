import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    addNewProduct,
    updateProductStock, 
    deleteProduct, 
    getAllProducts,
    getProductById,
    updateProduct,
    getLowStockProducts,
    getProductsByCategory,
    toggleProductStatus,
    getInventoryOverview,
    getActiveAndInactiveProducts,
    getProductsByBrand
} from "../controllers/product.controllers.js";

const productRouter = Router();

productRouter.route("/addNewProduct").post(addNewProduct);
productRouter.route("/updateProductStock/:productId").put(updateProductStock);
productRouter.route("/deleteProduct/:productId").delete(verifyJWT, deleteProduct);
productRouter.route("/getAllProducts").get(getAllProducts);

productRouter.route("/getProductById/:productId").get(getProductById);
productRouter.route("/updateProduct/:productId").put(updateProduct);
productRouter.route("/getLowStockProducts").get(verifyJWT, getLowStockProducts);
productRouter.route("/getInventoryOverview").get(getInventoryOverview);
productRouter.route("/getProductsByCategory/:categoryId").get(getProductsByCategory);
productRouter.route("/toggleProductStatus/:productId").put(toggleProductStatus);
productRouter.route("/getActiveAndInactiveProducts").get(getActiveAndInactiveProducts);
productRouter.route("/getProductsByBrand/:brand").get(getProductsByBrand);

export default productRouter;
