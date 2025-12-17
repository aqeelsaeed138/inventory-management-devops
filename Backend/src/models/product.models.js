import mongoose, { mongo, Schema } from "mongoose";
import { ApiErrors } from "../utils/ApiErrors.js";

const productSchema = new Schema({
    name: {
        type: String,
        required: [true, "Product name is required"],
        trim: true,
        unique: true,
        maxLength: 50,
        index: true
    },
    description: {
        type: String,
        trim: true,
        maxLength: 500
    },
    sku: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
        index: true
    },
    category: {
        type: mongoose.Types.ObjectId,
        ref: "Category",
        default: null
    },
    subcategory: {
        type: String,
        trim: true
    },
    brand: {
        type: String,
        trim: true
    },
    costPrice: {
        type: Number,
        required: [true, "Cost price is required"],
        min: [0, "Cost price cannot be negative"]
    },
    sellingPrice: {
        type: Number,
        required: [true, "Selling price is required"],
        min: [0, "Selling price cannot be negative"]
    },    
    currentStock: {
        type: Number,
        required: [true, "Current stock is required"],
        min: [0, "Stock cannot be negative"],
        default: 0
    },
    minStockLevel: {
        type: Number,
        required: [true, "Minimum stock level is required"],
        min: [0, "Minimum stock level cannot be negative"],
        default: 5
    },
    maxStockLevel: {
        type: Number,
        min: [0, "Maximum stock level cannot be negative"],
        default: 500
    },    
    unit: {
        type: String,
        required: [true, "Unit is required"],
        enum: ["kg", "gram", "liter", "meter", "pack", "box", "dozen", "unit", "set", "roll"],
        default: "unit"
    },
    image: {
        type: String,
        default: null
    },
    supplier: {
        type: mongoose.Types.ObjectId,
        ref: "Supplier",
        default: null
    },
    status: {
        type: String,
        enum: ["active", "inactive", "out_of_stock"],
        default: "active"
    },
    expiryDate: {
        type: Date,
        default: null
    },
    taxRate: {
        type: Number,
        min: [0, "Tax rate cannot be negative"],
        max: [100, "Tax rate cannot exceed 100%"],
        default: 0
    },
    taxInclude: {
        type: Boolean,
        default: false
    },
    totalSold: {
        type: Number,
        default: 0,
        min: [0, "Total sold cannot be negative"]
    },
    totalSale: {
        type: Number,
        default: 0
    },
    profitMargin: {
        type: Number,
        default: 0
    },
    averageRating: {
        type: Number,
        min: [0, "Rating cannot be negative"],
        max: [5, "Rating cannot exceed 5"]
    }
}, {timestamps: true});


//    for stock management
productSchema.methods.setMinimumStockLevel =async function(minStock){
    if (Number.isFinite(minStock) && minStock>0) {
        if (this.maxStockLevel && minStock >= this.maxStockLevel) {
            throw new ApiErrors(400, "Minimum stock level must be less than maximum stock level");
        }
        this.minStockLevel = minStock
        return await this.save();
    }else
        throw new ApiErrors(400, "Min Stock value must be greater than zero")
}
productSchema.methods.setMaximumStockLevel =async function(maxStock){
    if (Number.isFinite(maxStock) && maxStock>0) {
         if (this.minStockLevel && maxStock <= this.minStockLevel) {
            throw new ApiErrors(400, "Maximum stock level must be greater than minimum stock level");
        }
        this.maxStockLevel = maxStock
        return await this.save();
    }else
        throw new ApiErrors(400, "Max Stock value must be greater than zero")
}
productSchema.methods.updateStock = async function(newStock){
    this.currentStock += newStock
    if (this.currentStock > this.maxStockLevel) {
        throw new ApiErrors(400, "Stock exceed the specified limit. newStock can't be added")
    }
    else
        return await this.save();
}
productSchema.methods.isLowStock = function(){
    return this.currentStock <= this.minStockLevel
}
productSchema.methods.isOutOfStock = function(){
    return this.currentStock === 0
}
productSchema.methods.isOverStock = function(){
    return this.currentStock > this.maxStockLevel
}
productSchema.methods.getStockStatus = function(){
    if (this.isOutOfStock()) {
        return "Out of Stock";
    } else if (this.isLowStock()) {
        return "Low Stock!";
    } else if (this.isOverStock()) {
        return "Over Stock";
    } else {
        return "Normal";
    }
}

//    profit and sales calculation

productSchema.methods.calculateProfitAmount = function(){
    return this.totalSold * (this.sellingPrice - this.costPrice)
}

productSchema.methods.updateProductSale = async function(){
    this.totalSale = (this.totalSold * this.sellingPrice)
    return await this.save();
}
productSchema.methods.updateProfitMargin = function(){
    const totalProfit = this.calculateProfitAmount()
    this.profitMargin = (totalProfit / this.totalSale) * 100
    return this.save();
}
productSchema.methods.getPriceWithTax = async function(){
   if (this.taxInclude) {
    return this.sellingPrice + (this.sellingPrice * this.taxRate) 
   }
   else{
    return this.sellingPrice
   }
    
}
productSchema.methods.calculateTaxAmount = function() {
    const priceWithoutTax = this.taxInclude
        ? this.sellingPrice / (1 + this.taxRate / 100)
        : this.sellingPrice;
    
    const taxPerUnit = this.sellingPrice - priceWithoutTax;
    return Number((taxPerUnit * this.totalSold).toFixed(2));
};
productSchema.methods.updateTotalSoldCount = async function(soldItems){
    if (!Number.isFinite(soldItems) || soldItems <= 0) {
        throw new ApiErrors(400, "Sold items must be a positive number");
    }
    if (this.currentStock < soldItems) {
        throw new ApiErrors(400, "Insufficient stock available");
    }
    this.totalSold += soldItems
    this.currentStock -= soldItems;
    this.totalSale = this.totalSold * this.sellingPrice;
    return await this.save();
}

//      product status
productSchema.methods.activate = async function(){
    this.status = 'active'
    return await this.save()
}
productSchema.methods.deactivate = async function(){
    this.status = 'inactive'
    return await this.save()
}
productSchema.methods.markOutOfStock = async function(){
    this.status = 'out_of_stock'
    return await this.save()
}
productSchema.methods.isActive = function(){
    return this.status === 'active'
}
productSchema.methods.isExpired = function(){
    if (!this.expiryDate) {
        return false
    }
    return Date.now() >= this.expiryDate.getTime()
}
productSchema.methods.getDaysUntilExpired = function(){
     if (!this.expiryDate) {
        return null
    }
    const currentDate = new Date();
    const expiryDate = new Date(this.expiryDate);

    const timeDifference = expiryDate.getTime() - currentDate.getTime();
    const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
    
    return daysDifference;
}

//  display information
productSchema.methods.getDisplayInfo = function(){
    return {
        id: this._id,
        name: this.name,
        sku: this.sku,
        description: this.description || 'No description available',
        price: {
            value: this.price,
            formatted: `${this.price?.toFixed(2) || '0.00'}`,
            currency: this.currency || 'USD'
        },
        stock: {
            current: this.currentStock || 0,
            status: this.getStockStatus(),
            isLowStock: this.isLowStock(),
            isOutOfStock: this.isOutOfStock(),
            isOverStock: this.isOverStock()
        },
        status: {
            current: this.status,
        },
        expiry: {
            date: this.expiryDate,
            daysUntilExpired: this.getDaysUntilExpired(),
            isExpired: this.isExpired(),
        },
        category: {
            id: this.category?._id,
            name: this.category?.name || 'Uncategorized'
        },
        brand: {
            name: this.brand || 'No brand'
        },
        images: this.images || [],
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        
        profitMargin: this.profitMargin,
        sellingPrice: this.sellingPrice,
    };
};

//  validations

productSchema.methods.validatePrice = function(){
    const price = this.sellingPrice;
    
    if (typeof price !== 'number' || isNaN(price)) {
        return {
            isValid: false,
            errors: ['Price must be a valid number']
        };
    }
    const errors = [];
    
    if (price <= 0) {
        errors.push('Price must be greater than 0');
    }
    if (price < this.costPrice) {
        errors.push('Selling price must be greater than cost price')
    }
    return {
        isValid: errors.length === 0,
        errors: errors
    };
};
productSchema.methods.validateStock = function(){
    const stock = this.currentStock;
    const minStockLevel = this.minStockLevel;
    const maxStockLevel = this.maxStockLevel;
    
    const errors = [];
    
    if (stock === undefined || stock === null) {
        errors.push('Stock quantity is required');
    } else if (typeof stock !== 'number' || !Number.isInteger(stock)) {
        errors.push('Stock must be a whole number');
    } else if (stock < 0) {
        errors.push('Stock cannot be negative');
    }
    
    if (minStockLevel !== undefined && maxStockLevel !== undefined && 
        minStockLevel >= maxStockLevel) {
        errors.push('Minimum stock level must be less than maximum stock level');
    }
    
    if (stock > 10000) {
        errors.push('Stock quantity seems unusually high (maximum recommended: 10,000)');
    }
    return {
        isValid: errors.length === 0,
        errors: errors,
    };
};
productSchema.methods.validateExpiry = function() {
    const expiryDate = this.expiryDate;
    
    const errors = [];
    
    if (!expiryDate) {
        return {
            isValid: true,
            errors: []
        };
    }
    
    if (!(expiryDate instanceof Date) || isNaN(expiryDate.getTime())) {
        errors.push('Expiry date must be a valid date');
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    const expiryDateOnly = new Date(expiryDate);
    expiryDateOnly.setHours(0, 0, 0, 0);
    
    // Check if expiry date is in the past
    if (expiryDateOnly < currentDate) {
        errors.push('Expiry date cannot be in the past');
    }
    
    // Check if expiry date is too far in the future
    const maxYearsInFuture = 10;
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + maxYearsInFuture);
    
    if (expiryDateOnly > maxFutureDate) {
        errors.push(`Expiry date cannot be more than ${maxYearsInFuture} years in the future`);
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
};
productSchema.methods.isValidForSale = function(){
    const errors = [];
    
    // Check if product is inactive
    if (this.status !== 'active') {
        errors.push('Product is inactive');
    }
    
    // Check if product is out of stock
    if (this.isOutOfStock()) {
        errors.push('Product is out of stock');
    }
    
    // Check if product is expired
    if (this.isExpired()) {
        errors.push('Product has expired');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
};



export const Product = mongoose.model("Product", productSchema);
