// ==========================================
// 2. CLOTHING CATEGORY CONTROLLER
// controllers/category/category.clothing.controller.js
// ==========================================

import { Category } from "../../models/category/index.js";
import { ApiErrors } from "../../utils/ApiErrors.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { generateSlug, validateParentCategory } from "./category.base.controller.js";

// Predefined options for clothing
const CLOTHING_DEFAULTS = {
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    colors: ["Black", "White", "Red", "Blue", "Green", "Yellow", "Pink", "Purple", "Gray", "Brown"],
    materials: ["Cotton", "Polyester", "Wool", "Silk", "Denim", "Leather", "Linen", "Nylon"],
    genders: ["Male", "Female", "Unisex", "Kids"]
};

// POST: Create Clothing Category
export const createClothingCategory = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        parentCategory,
        image,
        taxRate = 0,
        isActive = true,
        brand,
        availableSizes,
        availableColors,
        material,
        gender,
        seo
    } = req.body;
    
    // Validation
    if (!name || name.trim() === "") {
        throw new ApiErrors(400, "Category name is required");
    }
    
    // Check for duplicate name
    const existedCategory = await Category.findOne({ name: name.trim() });
    if (existedCategory) {
        throw new ApiErrors(400, "Category with this name already exists");
    }
    
    // Validate tax rate
    if (taxRate < 0 || taxRate > 100) {
        throw new ApiErrors(400, "Tax rate must be between 0 and 100");
    }
    
    // Validate parent if provided
    let parentCategoryDoc = null;
    if (parentCategory) {
        parentCategoryDoc = await validateParentCategory(parentCategory);
    }
    
    // Generate slug
    const slug = await generateSlug(name);
    
    // Define clothing-specific attributes
    const attributes = [
        {
            name: "Brand",
            values: brand ? [brand] : [],
            isActive: true
        },
        {
            name: "Size",
            values: availableSizes || CLOTHING_DEFAULTS.sizes,
            isActive: true
        },
        {
            name: "Color",
            values: availableColors || CLOTHING_DEFAULTS.colors,
            isActive: true
        },
        {
            name: "Material",
            values: material ? [material] : CLOTHING_DEFAULTS.materials,
            isActive: true
        },
        {
            name: "Gender",
            values: gender ? [gender] : CLOTHING_DEFAULTS.genders,
            isActive: true
        }
    ];
    
    // Define clothing-specific filters
    const filters = [
        {
            name: "Brand",
            options: brand ? [brand] : [],
            isActive: true
        },
        {
            name: "Size",
            options: availableSizes || CLOTHING_DEFAULTS.sizes,
            isActive: true
        },
        {
            name: "Color",
            options: availableColors || CLOTHING_DEFAULTS.colors,
            isActive: true
        },
        {
            name: "Material",
            options: material ? [material] : CLOTHING_DEFAULTS.materials,
            isActive: true
        },
        {
            name: "Gender",
            options: gender ? [gender] : CLOTHING_DEFAULTS.genders,
            isActive: true
        },
        {
            name: "Price Range",
            options: [],
            isActive: true
        }
    ];
    
    // Create category
    const newCategory = await Category.create({
        name: name.trim(),
        slug,
        description: description?.trim(),
        parentCategory: parentCategory || null,
        image: image?.trim() || null,
        categoryType: "Clothing",
        attributes,
        filters,
        taxRate: Number(taxRate),
        isActive: Boolean(isActive),
        seo: seo || {}
    });
    
    // Update parent's subcategories array
    if (parentCategoryDoc) {
        parentCategoryDoc.subcategories.push(newCategory._id);
        await parentCategoryDoc.save();
    }
    
    // Fetch and return populated category
    const createdCategory = await Category.findById(newCategory._id)
        .populate('parentCategory', 'name slug categoryType')
        .populate('subcategories', 'name slug categoryType');
    
    return res.status(201).json(
        new ApiResponse(201, { category: createdCategory }, "Clothing category created successfully")
    );
});

// PUT: Update Clothing Category Attributes
export const updateClothingCategoryAttributes = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const { brand, availableSizes, availableColors, material, gender } = req.body;
    
    if (!categoryId) {
        throw new ApiErrors(400, "Category ID is required");
    }
    
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiErrors(404, "Category not found");
    }
    
    if (category.categoryType !== "Clothing") {
        throw new ApiErrors(400, "This endpoint is only for Clothing categories");
    }
    
    // Update attributes
    const attributeUpdates = {};
    if (brand) attributeUpdates["Brand"] = brand;
    if (availableSizes) attributeUpdates["Size"] = availableSizes;
    if (availableColors) attributeUpdates["Color"] = availableColors;
    if (material) attributeUpdates["Material"] = Array.isArray(material) ? material : [material];
    if (gender) attributeUpdates["Gender"] = Array.isArray(gender) ? gender : [gender];
    
    // Update category attributes and filters
    category.attributes.forEach(attr => {
        if (attributeUpdates[attr.name]) {
            attr.values = attributeUpdates[attr.name];
        }
    });
    
    category.filters.forEach(filter => {
        if (attributeUpdates[filter.name]) {
            filter.options = attributeUpdates[filter.name];
        }
    });
    
    await category.save();
    
    const updatedCategory = await Category.findById(categoryId)
        .populate('parentCategory', 'name slug categoryType')
        .populate('subcategories', 'name slug categoryType');
    
    return res.status(200).json(
        new ApiResponse(200, { category: updatedCategory }, "Clothing category attributes updated successfully")
    );
});

// POST: Add Stock Matrix for Clothing Variants
export const addClothingVariantStock = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const { variants } = req.body; // Array of { size, color, stock, price }
    
    if (!categoryId) {
        throw new ApiErrors(400, "Category ID is required");
    }
    
    if (!variants || !Array.isArray(variants) || variants.length === 0) {
        throw new ApiErrors(400, "Variants array is required");
    }
    
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiErrors(404, "Category not found");
    }
    
    if (category.categoryType !== "Clothing") {
        throw new ApiErrors(400, "This endpoint is only for Clothing categories");
    }
    
    if (!category.isLeaf()) {
        throw new ApiErrors(400, "Variants can only be added to leaf categories (categories without subcategories)");
    }
    
    // Validate and add variants
    const variantObjects = variants.map(v => {
        if (!v.size || !v.color || v.price === undefined) {
            throw new ApiErrors(400, "Each variant must have size, color, and price");
        }
        
        return {
            attributes: new Map([
                ["Size", v.size],
                ["Color", v.color]
            ]),
            stock: v.stock || 0,
            price: Number(v.price),
            isActive: v.isActive !== undefined ? Boolean(v.isActive) : true
        };
    });
    
    // Replace or add variants
    category.variants = variantObjects;
    await category.save();
    
    return res.status(200).json(
        new ApiResponse(200, { 
            category,
            variantsAdded: variantObjects.length
        }, "Clothing variants added successfully")
    );
});

export { CLOTHING_DEFAULTS };