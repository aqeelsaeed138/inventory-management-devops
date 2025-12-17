import mongoose, { Schema } from "mongoose";

const categorySchema = new Schema({
    name: {
        type: String,
        required: [true, "Category name is required"],
        unique: true,
        trim: true,
        maxLength: [100, "Category name cannot exceed 100 characters"],
        minLength: [2, "Category name must be at least 2 characters"]
    },
    description: {
        type: String,
        trim: true,
        maxLength: [500, "Description cannot exceed 500 characters"],
        default: null
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    parentCategory: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        default: null
    },
    subcategories: [{
        type: Schema.Types.ObjectId,
        ref: "Category"
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    image: {
        type: String, 
        default: null
    },
    taxRate: {
        type: Number,
        min: [0, "Tax rate cannot be negative"],
        max: [100, "Tax rate cannot exceed 100%"],
        default: 0
    },
}, {timestamps: true})

export const Category = mongoose.model("Category", categorySchema);