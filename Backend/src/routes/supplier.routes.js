import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    addNewSupplier,
    getAllSuppliers,
    getSupplierById,
    updateSupplier,
    toggleSupplierStatus,
    deleteSupplier
} from "../controllers/supplier.controllers.js";

const supplierRouter = Router();

supplierRouter.route("/addNewSupplier").post( addNewSupplier);
supplierRouter.route("/getAllSuppliers").get( getAllSuppliers);
supplierRouter.route("/getSupplierById/:supplierId").get( getSupplierById);
supplierRouter.route("/updateSupplier/:supplierId").put( updateSupplier);
supplierRouter.route("/toggleSupplierStatus/:supplierId").patch( toggleSupplierStatus);
supplierRouter.route("/deleteSupplier/:supplierId").delete( deleteSupplier);

export default supplierRouter;