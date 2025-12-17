import mongoose from "mongoose";
import categorySchema from "./category.schema.js";

export const Category = mongoose.model("Category", categorySchema);
