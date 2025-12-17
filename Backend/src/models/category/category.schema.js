import mongoose, { Schema } from "mongoose";
import attributeSchema from "./attribute.schema.js";
import filterSchema from "./filter.schema.js";
import variantSchema from "./variant.schema.js";

// Category Types
const CATEGORY_TYPES = ["Clothing", "Electronics", "Furniture", "Other"];

const categorySchema = new Schema({
    name: {
        type: String,
        required: [true, "Category name is required"],
        trim: true,
        maxLength: [100, "Category name cannot exceed 100 characters"],
        minLength: [2, "Category name must be at least 2 characters"]
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        maxLength: [500, "Description cannot exceed 500 characters"],
        default: null
    },
    image: { type: String, default: null },
    parentCategory: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        default: null
    },
    subcategories: [{
        type: Schema.Types.ObjectId,
        ref: "Category"
    }],
    categoryType: {
        type: String,
        enum: CATEGORY_TYPES,
        required: true,
        default: "Other"
    },
    attributes: [attributeSchema], // Dynamic attributes per type
    filters: [filterSchema],       // Category-specific filters
    taxRate: {
        type: Number,
        min: [0, "Tax rate cannot be negative"],
        max: [100, "Tax rate cannot exceed 100%"],
        default: 0
    },
    variants: [variantSchema],     // Only for leaf categories (products)
    isActive: { type: Boolean, default: true },
    seo: {
        metaTitle: { type: String, default: null },
        metaDescription: { type: String, default: null },
        metaKeywords: { type: [String], default: [] }
    },
    productCount: { type: Number, default: 0 }, // Only for leaf categories
}, { timestamps: true });

export default categorySchema;
