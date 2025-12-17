// ==========================================
// 3. ELECTRONICS CATEGORY CONTROLLER
// controllers/category/category.electronics.controller.js
// ==========================================

import { Category } from "../../models/category/index.js";
import { ApiErrors } from "../../utils/ApiErrors.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { generateSlug, validateParentCategory } from "./category.base.controller.js";

// Predefined options for electronics
const ELECTRONICS_DEFAULTS = {
    brands: ["Apple", "Samsung", "Sony", "LG", "Dell", "HP", "Lenovo", "Asus", "Microsoft", "Google"],
    storage: ["64GB", "128GB", "256GB", "512GB", "1TB", "2TB"],
    ram: ["4GB", "8GB", "16GB", "32GB", "64GB"],
    warranty: ["No Warranty", "6 Months", "1 Year", "2 Years", "3 Years"]
};

// POST: Create Electronics Category
export const createElectronicsCategory = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        parentCategory,
        image,
        taxRate = 0,
        isActive = true,
        brand,
        storageOptions,
        ramOptions,
        warrantyOptions,
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
    
    // Define electronics-specific attributes
    const attributes = [
        {
            name: "Brand",
            values: brand ? (Array.isArray(brand) ? brand : [brand]) : ELECTRONICS_DEFAULTS.brands,
            isActive: true
        },
        {
            name: "Storage",
            values: storageOptions || ELECTRONICS_DEFAULTS.storage,
            isActive: true
        },
        {
            name: "RAM",
            values: ramOptions || ELECTRONICS_DEFAULTS.ram,
            isActive: true
        },
        {
            name: "Warranty",
            values: warrantyOptions || ELECTRONICS_DEFAULTS.warranty,
            isActive: true
        }
    ];
    
    // Define electronics-specific filters
    const filters = [
        {
            name: "Brand",
            options: brand ? (Array.isArray(brand) ? brand : [brand]) : ELECTRONICS_DEFAULTS.brands,
            isActive: true
        },
        {
            name: "Storage",
            options: storageOptions || ELECTRONICS_DEFAULTS.storage,
            isActive: true
        },
        {
            name: "RAM",
            options: ramOptions || ELECTRONICS_DEFAULTS.ram,
            isActive: true
        },
        {
            name: "Warranty",
            options: warrantyOptions || ELECTRONICS_DEFAULTS.warranty,
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
        categoryType: "Electronics",
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
        new ApiResponse(201, { category: createdCategory }, "Electronics category created successfully")
    );
});

// PUT: Update Electronics Category Attributes
export const updateElectronicsCategoryAttributes = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const { brand, storageOptions, ramOptions, warrantyOptions } = req.body;
    
    if (!categoryId) {
        throw new ApiErrors(400, "Category ID is required");
    }
    
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiErrors(404, "Category not found");
    }
    
    if (category.categoryType !== "Electronics") {
        throw new ApiErrors(400, "This endpoint is only for Electronics categories");
    }
    
    // Update attributes
    const attributeUpdates = {};
    if (brand) attributeUpdates["Brand"] = Array.isArray(brand) ? brand : [brand];
    if (storageOptions) attributeUpdates["Storage"] = storageOptions;
    if (ramOptions) attributeUpdates["RAM"] = ramOptions;
    if (warrantyOptions) attributeUpdates["Warranty"] = warrantyOptions;
    
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
        new ApiResponse(200, { category: updatedCategory }, "Electronics category attributes updated successfully")
    );
});

// POST: Add Variants for Electronics (Storage + RAM combinations)
export const addElectronicsVariantStock = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const { variants } = req.body; // Array of { storage, ram, warranty, stock, price }
    
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
    
    if (category.categoryType !== "Electronics") {
        throw new ApiErrors(400, "This endpoint is only for Electronics categories");
    }
    
    if (!category.isLeaf()) {
        throw new ApiErrors(400, "Variants can only be added to leaf categories (categories without subcategories)");
    }
    
    // Validate and add variants
    const variantObjects = variants.map(v => {
        if (v.price === undefined) {
            throw new ApiErrors(400, "Each variant must have a price");
        }
        
        const attributes = new Map();
        if (v.storage) attributes.set("Storage", v.storage);
        if (v.ram) attributes.set("RAM", v.ram);
        if (v.warranty) attributes.set("Warranty", v.warranty);
        
        return {
            attributes,
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
        }, "Electronics variants added successfully")
    );
});

// POST: Add Technical Specifications
export const addElectronicsTechnicalSpecs = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const { technicalSpecs } = req.body; // Object with key-value pairs
    
    if (!categoryId) {
        throw new ApiErrors(400, "Category ID is required");
    }
    
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiErrors(404, "Category not found");
    }
    
    if (category.categoryType !== "Electronics") {
        throw new ApiErrors(400, "This endpoint is only for Electronics categories");
    }
    
    // Add technical specs as custom attributes
    if (technicalSpecs && typeof technicalSpecs === 'object') {
        Object.entries(technicalSpecs).forEach(([key, value]) => {
            const existingAttr = category.attributes.find(a => a.name === key);
            if (existingAttr) {
                existingAttr.values = Array.isArray(value) ? value : [value];
            } else {
                category.attributes.push({
                    name: key,
                    values: Array.isArray(value) ? value : [value],
                    isActive: true
                });
            }
        });
        
        await category.save();
    }
    
    return res.status(200).json(
        new ApiResponse(200, { category }, "Technical specifications added successfully")
    );
});

export { ELECTRONICS_DEFAULTS };