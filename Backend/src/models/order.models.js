import mongoose, { Schema } from "mongoose";

const orderItemSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    sku: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: true });

const orderSchema = new Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    orderType: {
        type: String,
        enum: ['sale', 'purchase'],
        required: true,
        index: true
    },
    customer: {
        name: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true
        },
        phone: {
            type: String,
            trim: true
        },
        address: {
            type: String,
            trim: true
        }
    },
    supplier: {
        type: Schema.Types.ObjectId,
        ref: 'Supplier'
    },
    items: {
        type: [orderItemSchema],
        required: true,
        validate: {
            validator: function(items) {
                return items && items.length > 0;
            },
            message: 'Order must have at least one item'
        }
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    taxAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    shippingCost: {
        type: Number,
        default: 0,
        min: 0
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'completed', 'cancelled'],
        default: 'pending',
        index: true
    },
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'partial', 'paid', 'refunded'],
        default: 'unpaid',
        index: true
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'bank_transfer', 'online'],
        default: 'cash'
    },
    notes: {
        type: String,
        trim: true
    },
    orderDate: {
        type: Date,
        default: Date.now,
        index: true
    },
    expectedDeliveryDate: {
        type: Date
    },
    actualDeliveryDate: {
        type: Date
    }
}, { timestamps: true });

// Indexes
orderSchema.index({ 'customer.name': 1 });
orderSchema.index({ 'customer.phone': 1 });
orderSchema.index({ supplier: 1, orderDate: -1 });
orderSchema.index({ orderType: 1, status: 1 });

// Validation
orderSchema.pre('validate', function(next) {
    if (this.orderType === 'sale' && !this.customer.name) {
        return next(new Error('Customer name is required for sale orders'));
    }
    if (this.orderType === 'purchase' && !this.supplier) {
        return next(new Error('Supplier is required for purchase orders'));
    }
    next();
});

// Instance Methods
orderSchema.methods.calculateTotals = function() {
    this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
    this.totalAmount = this.subtotal + this.taxAmount + this.shippingCost - this.discount;
    return {
        subtotal: this.subtotal,
        totalAmount: this.totalAmount
    };
};

orderSchema.methods.updateStatus = async function(newStatus) {
    const validTransitions = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['processing', 'cancelled'],
        'processing': ['completed', 'cancelled'],
        'completed': [],
        'cancelled': []
    };

    if (!validTransitions[this.status].includes(newStatus)) {
        throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
    }

    this.status = newStatus;
    
    if (newStatus === 'completed' && !this.actualDeliveryDate) {
        this.actualDeliveryDate = new Date();
    }
    
    await this.save();
};

orderSchema.methods.canBeCancelled = function() {
    return ['pending', 'confirmed', 'processing'].includes(this.status);
};

orderSchema.methods.isCompleted = function() {
    return this.status === 'completed';
};

orderSchema.methods.getDeliveryDays = function() {
    if (this.actualDeliveryDate && this.orderDate) {
        const diffTime = Math.abs(this.actualDeliveryDate - this.orderDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return null;
};

orderSchema.methods.getOrderSummary = function() {
    return {
        orderNumber: this.orderNumber,
        orderType: this.orderType,
        customerName: this.customer?.name || 'N/A',
        itemCount: this.items.length,
        totalQuantity: this.items.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: this.totalAmount,
        status: this.status,
        paymentStatus: this.paymentStatus,
        orderDate: this.orderDate
    };
};

// Static Methods
orderSchema.statics.generateOrderNumber = function(orderType) {
    const prefix = orderType === 'sale' ? 'SO' : 'PO';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
};

orderSchema.statics.getRevenueByDateRange = async function(startDate, endDate) {
    const orders = await this.find({
        orderType: 'sale',
        orderDate: { $gte: startDate, $lte: endDate },
        status: { $ne: 'cancelled' },
        paymentStatus: { $in: ['paid', 'partial'] }
    });

    return orders.reduce((sum, order) => sum + order.totalAmount, 0);
};

// Pre-save middleware
orderSchema.pre('save', function(next) {
    if (this.isNew) {
        this.calculateTotals();
    }
    next();
});

export const Order = mongoose.model("Order", orderSchema);