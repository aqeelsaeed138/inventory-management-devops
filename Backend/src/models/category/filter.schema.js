import mongoose, { Schema } from "mongoose";

const filterSchema = new Schema({
    name: { type: String, required: true }, // e.g., Size, Color, Brand
    options: [{ type: String }],            // Available dropdown options
    isActive: { type: Boolean, default: true } // Admin can enable/disable
}, { _id: false });

export default filterSchema;
