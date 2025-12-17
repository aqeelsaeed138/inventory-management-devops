import mongoose, { Schema } from "mongoose";

const supplierSchema = new Schema({
    name: {
        type: String,
        required: [true, "Supplier name is required"],
        trim: true,
        maxLength: [100, "Supplier name cannot exceed 50 characters"],
        minLength: [2, "Supplier name must be at least 2 characters"]
    },
    companyName: {
        type: String,
        trim: true,
        maxLength: [150, "Company name cannot exceed 100 characters"],
        default: null
    },
    email: {
        type: String,
        trim: true,
    },
    phone: {
            type: String,
            required: [true, "Primary phone number is required"],
            trim: true,
            match: [/^[\+]?[0-9\s\-\(\)]{10,15}$/, 'Please enter a valid phone number']
    },
    address: {
        street: {
            type: String,
            trim: true,
            maxLength: [200, "Street address cannot exceed 100 characters"]
        },
        city: {
            type: String,
            trim: true,
            maxLength: [50, "City name cannot exceed 50 characters"]
        },
        state: {
            type: String,
            trim: true,
            maxLength: [50, "State name cannot exceed 50 characters"]
        },
        country: {
            type: String,
            trim: true,
            maxLength: [50, "Country name cannot exceed 50 characters"],
            default: "Pakistan"
        },
        postalCode: {
            type: String,
            trim: true,
            maxLength: [10, "Postal code cannot exceed 10 characters"]
        }
    },
    businessType: {
            type: String,
            enum: ["Manufacturer", "Distributor", "Wholesaler", "Retailer", "Service Provider", "Other"],
            default: "Other"
    },
    isActive: {
        type: Boolean,
        default: true
    },
    categories: [{
        type: Schema.Types.ObjectId,
        ref: "Category"
    }],
    performance: {
        totalOrders: {
            type: Number,
            default: 0
        },
        completedOrders: {
            type: Number,
            default: 0
        },
        totalPurchaseValue: {
            type: Number,
            default: 0
        },
        avgDeliveryDays: {
            type: Number,
            default: 0
        },
        lastOrderDate: {
            type: Date,
            default: null
        }
    }
}, {
    timestamps: true,
});


supplierSchema.methods.getFullAddress = function() {
    const { street, city, state, country, postalCode } = this.address;
    const addressParts = [street, city, state, country, postalCode].filter(Boolean);
    return addressParts.join(', ') || 'Address not provided';
};

supplierSchema.methods.getPrimaryContact = function() {
    return {
        name: this.name,
        phone: this.phone,
        email: this.email || 'Email not provided'
    };
};

supplierSchema.methods.isReliable = function() {
    const { totalOrders, completedOrders } = this.performance;
    if (totalOrders === 0) return true; 
    const completionRate = (completedOrders / totalOrders) * 100;
    return completionRate >= 80;
};

supplierSchema.methods.getSupplierStatus = function() {
    if (!this.isActive) return 'Inactive';
    if (this.isReliable()) return 'Reliable';
    return 'Under Review';
};

supplierSchema.methods.updatePerformance = function(orderData) {
    const { isCompleted, orderValue, deliveryDays } = orderData;
    
    this.performance.totalOrders += 1;
    if (isCompleted) {
        this.performance.completedOrders += 1;
    }
    
    this.performance.totalPurchaseValue += orderValue || 0;
    
    if (deliveryDays) {
        const currentAvg = this.performance.avgDeliveryDays;
        const totalCompleted = this.performance.completedOrders;
        this.performance.avgDeliveryDays = 
            ((currentAvg * (totalCompleted - 1)) + deliveryDays) / totalCompleted;
    }
    
    this.performance.lastOrderDate = new Date();
    return this;
};

export const Supplier = mongoose.model("Supplier", supplierSchema);