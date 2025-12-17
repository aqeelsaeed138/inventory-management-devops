import categorySchema from "./category.schema.js";
import slugify from "slugify";

// Pre-save hook: generate slug from name if not provided
categorySchema.pre("save", function(next) {
    if (!this.slug && this.name) {
        this.slug = slugify(this.name, { lower: true, strict: true });
    }
    next();
});

// Pre-save hook: propagate inactive status to subcategories and variants
categorySchema.pre("save", async function(next) {
    if (!this.isModified("isActive")) return next();
    if (!this.isActive) {
        // Deactivate subcategories recursively
        await this.model("Category").updateMany(
            { parentCategory: this._id },
            { isActive: false }
        );
        // Deactivate variants in this category
        if (this.variants && this.variants.length > 0) {
            this.variants.forEach(v => v.isActive = false);
        }
    }
    next();
});

// Method: check if category is leaf (no subcategories)
categorySchema.methods.isLeaf = function() {
    return !this.subcategories || this.subcategories.length === 0;
};

export default categorySchema;
