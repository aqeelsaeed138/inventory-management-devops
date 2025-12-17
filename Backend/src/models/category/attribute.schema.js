import mongoose, { Schema } from "mongoose";

// Attribute schema for dynamic fields per category type
const attributeSchema = new Schema({
    name: { type: String, required: true }, // e.g., Size, Color, Brand, RAM
    values: [{ type: String, required: true }], // Dropdown options or multi-select values
    isActive: { type: Boolean, default: true } // Whether this attribute/filter is active
}, { _id: false });

export default attributeSchema;
