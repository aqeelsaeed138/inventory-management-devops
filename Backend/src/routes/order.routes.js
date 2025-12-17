import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    updatePaymentStatus,
    cancelOrder,
    getOrdersBySupplier
} from "../controllers/order.controllers.js";

const orderRouter = Router();

orderRouter.route("/createOrder").post( createOrder);
orderRouter.route("/getAllOrders").get(getAllOrders);
orderRouter.route("/getOrderById/:orderId").get( getOrderById);
orderRouter.route("/updateOrderStatus/:orderId").patch( updateOrderStatus);
orderRouter.route("/updatePaymentStatus/:orderId").patch( updatePaymentStatus);
orderRouter.route("/cancelOrder/:orderId").patch( cancelOrder);
orderRouter.route("/getOrdersBySupplier/:supplierId").get( getOrdersBySupplier);

export default orderRouter;