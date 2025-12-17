import { Order } from "../models/order.models.js";
import { Product } from "../models/product.models.js";
import { Supplier } from "../models/supplier.models.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createOrder = asyncHandler(async (req, res) => {
    if (!req.body) {
        throw new ApiErrors(400, "Request body is required");
    }

    const { 
        orderType, 
        customer, 
        supplier, 
        items, 
        taxAmount, 
        discount, 
        shippingCost,
        paymentMethod,
        notes,
        expectedDeliveryDate
    } = req.body;

    if (!orderType || !['sale', 'purchase'].includes(orderType)) {
        throw new ApiErrors(400, "Order type must be 'sale' or 'purchase'");
    }

    if (!items || items.length === 0) {
        throw new ApiErrors(400, "Order must have at least one item");
    }

    if (orderType === 'sale' && (!customer || !customer.name || !customer.phone)) {
        throw new ApiErrors(400, "Customer name and phone are required for sale orders");
    }

    if (orderType === 'purchase' && !supplier) {
        throw new ApiErrors(400, "Supplier is required for purchase orders");
    }

    if (orderType === 'purchase') {
        const checkSupplier = await Supplier.findById(supplier);
        if (!checkSupplier) {
            throw new ApiErrors(400, "Invalid supplier");
        }
        if (!checkSupplier.isActive) {
            throw new ApiErrors(400, "Supplier is not active");
        }
    }

    const processedItems = [];
    let subtotal = 0;

    for (const item of items) {
        if (!item.product || !item.quantity || item.quantity <= 0) {
            throw new ApiErrors(400, "Each item must have a valid product and quantity");
        }

        const product = await Product.findById(item.product);
        if (!product) {
            throw new ApiErrors(400, `Product not found: ${item.product}`);
        }

        if (product.status !== 'active') {
            throw new ApiErrors(400, `Product is not active: ${product.name}`);
        }

        if (orderType === 'sale' && product.currentStock < item.quantity) {
            throw new ApiErrors(400, `Insufficient stock for product: ${product.name}`);
        }

        const unitPrice = orderType === 'sale' ? product.sellingPrice : product.costPrice;
        const itemSubtotal = unitPrice * item.quantity;

        processedItems.push({
            product: product._id,
            productName: product.name,
            sku: product.sku,
            quantity: item.quantity,
            unitPrice,
            subtotal: itemSubtotal
        });

        subtotal += itemSubtotal;
    }

    const orderNumber = Order.generateOrderNumber(orderType);
    
    const totalAmount = subtotal + (taxAmount || 0) + (shippingCost || 0) - (discount || 0);

    const newOrder = await Order.create({
        orderNumber,
        orderType,
        customer: orderType === 'sale' ? {
            name: customer.name.trim(),
            email: customer.email?.trim(),
            phone: customer.phone.trim(),
            address: customer.address?.trim()
        } : undefined,
        supplier: orderType === 'purchase' ? supplier : undefined,
        items: processedItems,
        subtotal,
        taxAmount: taxAmount || 0,
        discount: discount || 0,
        shippingCost: shippingCost || 0,
        totalAmount,
        paymentMethod: paymentMethod || 'cash',
        notes: notes?.trim(),
        expectedDeliveryDate: expectedDeliveryDate || undefined
    });

    for (const item of processedItems) {
        const product = await Product.findById(item.product);
        if (orderType === 'sale') {
            await product.updateStock(-item.quantity);
        } else {
            await product.updateStock(item.quantity);
        }
    }

    const checkOrder = await Order.findById(newOrder._id)
        .populate('items.product', 'name sku currentStock')
        .populate('supplier', 'name companyName phone');

    if (!checkOrder) {
        throw new ApiErrors(500, "Server error occurred while creating order");
    }

    return res.status(201).json(
        new ApiResponse(201, { order: checkOrder }, "Order created successfully")
    );
});

const getAllOrders = asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        orderType, 
        status, 
        paymentStatus,
        sortBy = 'orderDate',
        sortOrder = 'desc'
    } = req.query;

    const filter = {};
    if (orderType) filter.orderType = orderType;
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
        .populate('items.product', 'name sku')
        .populate('supplier', 'name companyName')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    return res.status(200).json(
        new ApiResponse(200, {
            orders,
            totalOrders,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        }, "Orders retrieved successfully")
    );
});

const getOrderById = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    if (!orderId) {
        throw new ApiErrors(400, "Order ID is required");
    }

    const order = await Order.findById(orderId)
        .populate('items.product', 'name sku currentStock category brand')
        .populate('supplier', 'name companyName email phone address');

    if (!order) {
        throw new ApiErrors(404, "Order not found");
    }

    const orderInfo = {
        ...order.toObject(),
        summary: order.getOrderSummary(),
        deliveryDays: order.getDeliveryDays()
    };

    return res.status(200).json(
        new ApiResponse(200, orderInfo, "Order retrieved successfully")
    );
});

const updateOrderStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!orderId) {
        throw new ApiErrors(400, "Order ID is required");
    }

    if (!status) {
        throw new ApiErrors(400, "Status is required");
    }

    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiErrors(404, "Order not found");
    }

    await order.updateStatus(status);

    if (status === 'completed' && order.orderType === 'purchase' && order.supplier) {
        const supplier = await Supplier.findById(order.supplier);
        if (supplier) {
            const deliveryDays = order.getDeliveryDays();
            supplier.updatePerformance({
                isCompleted: true,
                orderValue: order.totalAmount,
                deliveryDays: deliveryDays
            });
            await supplier.save();
        }
    }

    const updatedOrder = await Order.findById(orderId)
        .populate('items.product', 'name sku')
        .populate('supplier', 'name');

    return res.status(200).json(
        new ApiResponse(200, updatedOrder, "Order status updated successfully")
    );
});

const updatePaymentStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { paymentStatus } = req.body;

    if (!orderId) {
        throw new ApiErrors(400, "Order ID is required");
    }

    if (!paymentStatus) {
        throw new ApiErrors(400, "Payment status is required");
    }

    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiErrors(404, "Order not found");
    }

    await order.updatePaymentStatus(paymentStatus);

    return res.status(200).json(
        new ApiResponse(200, { 
            orderId: order._id,
            orderNumber: order.orderNumber,
            paymentStatus: order.paymentStatus 
        }, "Payment status updated successfully")
    );
});

const cancelOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    if (!orderId) {
        throw new ApiErrors(400, "Order ID is required");
    }

    const order = await Order.findById(orderId).populate('items.product');
    if (!order) {
        throw new ApiErrors(404, "Order not found");
    }

    if (!order.canBeCancelled()) {
        throw new ApiErrors(400, "Order cannot be cancelled at this stage");
    }

    for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product && order.orderType === 'sale') {
            await product.updateStock(item.quantity);
        } else if (product && order.orderType === 'purchase') {
            await product.updateStock(-item.quantity);
        }
    }

    await order.updateStatus('cancelled');

    return res.status(200).json(
        new ApiResponse(200, { 
            orderId: order._id,
            orderNumber: order.orderNumber,
            status: order.status 
        }, "Order cancelled successfully")
    );
});

const getOrdersBySupplier = asyncHandler(async (req, res) => {
    const { supplierId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    if (!supplierId) {
        throw new ApiErrors(400, "Supplier ID is required");
    }

    const filter = { 
        supplier: supplierId,
        orderType: 'purchase'
    };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
        .populate('items.product', 'name sku')
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    return res.status(200).json(
        new ApiResponse(200, {
            orders,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalOrders
            }
        }, "Supplier orders retrieved successfully")
    );
});

export {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    updatePaymentStatus,
    cancelOrder,
    getOrdersBySupplier
};