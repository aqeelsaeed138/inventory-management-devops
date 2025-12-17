// ==========================================
// 6. CATEGORY HIERARCHY CONTROLLER
// controllers/category/category.hierarchy.controller.js
// ==========================================

import { Category } from "../../models/category/index.js";
import { ApiErrors } from "../../utils/ApiErrors.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// GET: Retrieve complete category hierarchy (tree structure)
export const getCategoryHierarchy = asyncHandler(async (req, res) => {
    const { categoryType, includeInactive = false } = req.query;
    
    const filter = { parentCategory: null };
    if (!includeInactive || includeInactive === 'false') {
        filter.isActive = true;
    }
    if (categoryType) {
        filter.categoryType = categoryType;
    }
    
    const rootCategories = await Category.find(filter)
        .populate({
            path: 'subcategories',
            match: includeInactive === 'true' ? {} : { isActive: true },
            populate: {
                path: 'subcategories',
                match: includeInactive === 'true' ? {} : { isActive: true },
                populate: {
                    path: 'subcategories',
                    match: includeInactive === 'true' ? {} : { isActive: true }
                }
            }
        })
        .sort({ name: 1 });
    
    return res.status(200).json(
        new ApiResponse(200, { categoryHierarchy: rootCategories }, "Category hierarchy retrieved successfully")
    );
});

// GET: Get breadcrumb path for a category
export const getCategoryBreadcrumb = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    
    if (!categoryId) {
        throw new ApiErrors(400, "Category ID is required");
    }
    
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiErrors(404, "Category not found");
    }
    
    const breadcrumb = [];
    let currentCategory = category;
    
    // Build breadcrumb from bottom to top
    while (currentCategory) {
        breadcrumb.unshift({
            id: currentCategory._id,
            name: currentCategory.name,
            slug: currentCategory.slug,
            categoryType: currentCategory.categoryType
        });
        
        if (currentCategory.parentCategory) {
            currentCategory = await Category.findById(currentCategory.parentCategory);
        } else {
            break;
        }
    }
    
    return res.status(200).json(
        new ApiResponse(200, { breadcrumb }, "Category breadcrumb retrieved successfully")
    );
});

// GET: Get all descendants of a category
export const getCategoryDescendants = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const { includeInactive = false } = req.query;
    
    if (!categoryId) {
        throw new ApiErrors(400, "Category ID is required");
    }
    
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiErrors(404, "Category not found");
    }
    
    const descendants = [];
    
    const collectDescendants = async (catId) => {
        const filter = { parentCategory: catId };
        if (!includeInactive || includeInactive === 'false') {
            filter.isActive = true;
        }
        
        const children = await Category.find(filter);
        
        for (const child of children) {
            descendants.push({
                id: child._id,
                name: child.name,
                slug: child.slug,
                categoryType: child.categoryType,
                isActive: child.isActive,
                level: descendants.filter(d => d.parentCategory?.toString() === catId.toString()).length + 1
            });
            
            // Recursively get children's children
            await collectDescendants(child._id);
        }
    };
    
    await collectDescendants(categoryId);
    
    return res.status(200).json(
        new ApiResponse(200, { 
            category: {
                id: category._id,
                name: category.name,
                slug: category.slug
            },
            descendants,
            totalDescendants: descendants.length
        }, "Category descendants retrieved successfully")
    );
});

// POST: Move category to different parent
export const moveCategoryToParent = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const { newParentId } = req.body; // null for root level
    
    if (!categoryId) {
        throw new ApiErrors(400, "Category ID is required");
    }
    
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiErrors(404, "Category not found");
    }
    
    // Check if category has products
    const Product = require("../../models/product.models.js").Product;
    const hasProducts = await Product.countDocuments({ category: categoryId }) > 0;
    if (hasProducts) {
        throw new ApiErrors(400, "Cannot move category with existing products. Please remove products first.");
    }
    
    // Validate new parent
    if (newParentId) {
        if (newParentId === categoryId) {
            throw new ApiErrors(400, "Category cannot be its own parent");
        }
        
        // Check if new parent is a descendant (circular reference prevention)
        const isDescendant = async (parentId, childId) => {
            const parent = await Category.findById(parentId);
            if (!parent) return false;
            if (parent.parentCategory?.toString() === childId) return true;
            if (parent.parentCategory) {
                return await isDescendant(parent.parentCategory, childId);
            }
            return false;
        };
        
        if (await isDescendant(newParentId, categoryId)) {
            throw new ApiErrors(400, "Cannot move category to its own descendant");
        }
        
        const newParent = await Category.findById(newParentId);
        if (!newParent) {
            throw new ApiErrors(404, "New parent category not found");
        }
        
        if (!newParent.isActive) {
            throw new ApiErrors(400, "Cannot move to inactive parent category");
        }
    }
    
    // Remove from old parent
    if (category.parentCategory) {
        await Category.findByIdAndUpdate(
            category.parentCategory,
            { $pull: { subcategories: categoryId } }
        );
    }
    
    // Add to new parent
    if (newParentId) {
        await Category.findByIdAndUpdate(
            newParentId,
            { $addToSet: { subcategories: categoryId } }
        );
    }
    
    // Update category's parent reference
    category.parentCategory = newParentId || null;
    await category.save();
    
    const updatedCategory = await Category.findById(categoryId)
        .populate('parentCategory', 'name slug categoryType')
        .populate('subcategories', 'name slug categoryType');
    
    return res.status(200).json(
        new ApiResponse(200, { category: updatedCategory }, "Category moved successfully")
    );
});

// ==========================================
// 7. CATEGORY TAX CONTROLLER
// controllers/category/category.tax.controller.js
// ==========================================

// PUT: Update category tax rate
export const updateCategoryTaxRate = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const { taxRate, applyToProducts = true } = req.body;
    
    if (!categoryId) {
        throw new ApiErrors(400, "Category ID is required");
    }
    
    if (taxRate === undefined || taxRate === null) {
        throw new ApiErrors(400, "Tax rate is required");
    }
    
    const numericTaxRate = Number(taxRate);
    if (isNaN(numericTaxRate) || numericTaxRate < 0 || numericTaxRate > 100) {
        throw new ApiErrors(400, "Tax rate must be between 0 and 100");
    }
    
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiErrors(404, "Category not found");
    }
    
    const oldTaxRate = category.taxRate;
    category.taxRate = numericTaxRate;
    await category.save();
    
    let updatedProductsCount = 0;
    
    // Update products if requested
    if (applyToProducts) {
        const Product = require("../../models/product.models.js").Product;
        const result = await Product.updateMany(
            { category: categoryId },
            { $set: { taxRate: numericTaxRate } }
        );
        updatedProductsCount = result.modifiedCount;
    }
    
    return res.status(200).json(
        new ApiResponse(200, { 
            category,
            oldTaxRate,
            newTaxRate: numericTaxRate,
            productsUpdated: updatedProductsCount
        }, "Tax rate updated successfully")
    );
});

// PUT: Propagate tax rate to subcategories
export const propagateTaxRateToSubcategories = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const { includeProducts = true } = req.body;
    
    if (!categoryId) {
        throw new ApiErrors(400, "Category ID is required");
    }
    
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiErrors(404, "Category not found");
    }
    
    const taxRate = category.taxRate;
    const updatedCategories = [];
    let updatedProductsCount = 0;
    
    const updateSubcategories = async (catId, rate) => {
        const subcategories = await Category.find({ parentCategory: catId });
        
        for (const subcat of subcategories) {
            subcat.taxRate = rate;
            await subcat.save();
            updatedCategories.push(subcat._id);
            
            // Update products in this subcategory
            if (includeProducts) {
                const Product = require("../../models/product.models.js").Product;
                const result = await Product.updateMany(
                    { category: subcat._id },
                    { $set: { taxRate: rate } }
                );
                updatedProductsCount += result.modifiedCount;
            }
            
            // Recursively update nested subcategories
            await updateSubcategories(subcat._id, rate);
        }
    };
    
    await updateSubcategories(categoryId, taxRate);
    
    return res.status(200).json(
        new ApiResponse(200, { 
            category,
            taxRate,
            subcategoriesUpdated: updatedCategories.length,
            productsUpdated: updatedProductsCount
        }, "Tax rate propagated to subcategories successfully")
    );
});

// GET: Get tax rate for a category (inherited from parent if not set)
export const getEffectiveTaxRate = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    
    if (!categoryId) {
        throw new ApiErrors(400, "Category ID is required");
    }
    
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiErrors(404, "Category not found");
    }
    
    let effectiveTaxRate = category.taxRate;
    let source = "category";
    
    // If tax rate is 0, check parent categories
    if (effectiveTaxRate === 0 && category.parentCategory) {
        let parentCat = await Category.findById(category.parentCategory);
        while (parentCat && effectiveTaxRate === 0) {
            if (parentCat.taxRate > 0) {
                effectiveTaxRate = parentCat.taxRate;
                source = `inherited from ${parentCat.name}`;
                break;
            }
            if (parentCat.parentCategory) {
                parentCat = await Category.findById(parentCat.parentCategory);
            } else {
                break;
            }
        }
    }
    
    return res.status(200).json(
        new ApiResponse(200, { 
            category: {
                id: category._id,
                name: category.name,
                taxRate: category.taxRate
            },
            effectiveTaxRate,
            source
        }, "Effective tax rate retrieved successfully")
    );
});

// ==========================================
// 8. CATEGORY STATUS CONTROLLER
// controllers/category/category.status.controller.js
// ==========================================

// PUT: Activate category
export const activateCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    
    if (!categoryId) {
        throw new ApiErrors(400, "Category ID is required");
    }
    
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiErrors(404, "Category not found");
    }
    
    if (category.isActive) {
        return res.status(200).json(
            new ApiResponse(200, { category }, "Category is already active")
        );
    }
    
    // Check if parent is active
    if (category.parentCategory) {
        const parent = await Category.findById(category.parentCategory);
        if (!parent.isActive) {
            throw new ApiErrors(400, "Cannot activate category. Parent category is inactive.");
        }
    }
    
    category.isActive = true;
    await category.save();
    
    return res.status(200).json(
        new ApiResponse(200, { category }, "Category activated successfully")
    );
});

// PUT: Deactivate category and its contents
export const deactivateCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const { deactivateSubcategories = true, deactivateProducts = true } = req.body;
    
    if (!categoryId) {
        throw new ApiErrors(400, "Category ID is required");
    }
    
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiErrors(404, "Category not found");
    }
    
    if (!category.isActive) {
        return res.status(200).json(
            new ApiResponse(200, { category }, "Category is already inactive")
        );
    }
    
    category.isActive = false;
    await category.save();
    
    let subcategoriesDeactivated = 0;
    let productsDeactivated = 0;
    
    // Deactivate subcategories recursively
    if (deactivateSubcategories) {
        const deactivateSubcats = async (catId) => {
            const result = await Category.updateMany(
                { parentCategory: catId, isActive: true },
                { $set: { isActive: false } }
            );
            subcategoriesDeactivated += result.modifiedCount;
            
            const subcats = await Category.find({ parentCategory: catId });
            for (const subcat of subcats) {
                await deactivateSubcats(subcat._id);
            }
        };
        
        await deactivateSubcats(categoryId);
    }
    
    // Deactivate products
    if (deactivateProducts) {
        const Product = require("../../models/product.models.js").Product;
        const result = await Product.updateMany(
            { category: categoryId, status: "active" },
            { $set: { status: "inactive" } }
        );
        productsDeactivated = result.modifiedCount;
    }
    
    return res.status(200).json(
        new ApiResponse(200, { 
            category,
            subcategoriesDeactivated,
            productsDeactivated
        }, "Category deactivated successfully")
    );
});

// PUT: Bulk activate/deactivate categories
export const bulkUpdateCategoryStatus = asyncHandler(async (req, res) => {
    const { categoryIds, isActive } = req.body;
    
    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
        throw new ApiErrors(400, "Category IDs array is required");
    }
    
    if (isActive === undefined) {
        throw new ApiErrors(400, "isActive status is required");
    }
    
    const result = await Category.updateMany(
        { _id: { $in: categoryIds } },
        { $set: { isActive: Boolean(isActive) } }
    );
    
    return res.status(200).json(
        new ApiResponse(200, { 
            categoriesUpdated: result.modifiedCount,
            status: Boolean(isActive) ? "active" : "inactive"
        }, "Categories status updated successfully")
    );
});