import mongoose, { Schema } from "mongoose";

const variantSchema = new Schema({
    attributes: { type: Map, of: String, required: true }, 
    // e.g., { Size: "M", Color: "Blue" }
    stock: { type: Number, default: 0, min: 0 },
    price: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true } // Variant status
}, { _id: false });

export default variantSchema;
