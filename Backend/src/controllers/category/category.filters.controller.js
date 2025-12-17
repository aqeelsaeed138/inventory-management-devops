// ==========================================
// 9. CATEGORY FILTERS CONTROLLER
// controllers/category/category.filters.controller.js
// ==========================================

import { Category } from "../../models/category/index.js";
import { Product } from "../../models/product.models.js";
import { ApiErrors } from "../../utils/ApiErrors.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// GET: Get available filters for a category
export const getCategoryFilters = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const { includeInactive = false } = req.query;
    
    if (!categoryId) {
        throw new ApiErrors(400, "Category ID is required");
    }
    
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiErrors(404, "Category not found");
    }
    
    let filters = category.filters || [];
    
    // Filter out inactive filters if requested
    if (!includeInactive || includeInactive === 'false') {
        filters = filters.filter(f => f.isActive);
    }
    
    return res.status(200).json(
        new ApiResponse(200, { 
            categoryId: category._id,
            categoryName: category.name,
            categoryType: category.categoryType,
            filters
        }, "Category filters retrieved successfully")
    );
});

// POST: Add or update filters for a category
export const updateCategoryFilters = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const { filters } = req.body; // Array of { name, options, isActive }
    
    if (!categoryId) {
        throw new ApiErrors(400, "Category ID is required");
    }
    
    if (!filters || !Array.isArray(filters)) {
        throw new ApiErrors(400, "Filters array is required");
    }
    
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiErrors(404, "Category not found");
    }
    
    // Update or add filters
    filters.forEach(newFilter => {
        if (!newFilter.name) {
            throw new ApiErrors(400, "Filter name is required");
        }
        
        const existingFilterIndex = category.filters.findIndex(f => f.name === newFilter.name);
        
        if (existingFilterIndex !== -1) {
            // Update existing filter
            category.filters[existingFilterIndex].options = newFilter.options || [];
            category.filters[existingFilterIndex].isActive = newFilter.isActive !== undefined ? newFilter.isActive : true;
        } else {
            // Add new filter
            category.filters.push({
                name: newFilter.name,
                options: newFilter.options || [],
                isActive: newFilter.isActive !== undefined ? newFilter.isActive : true
            });
        }
    });
    
    await category.save();
    
    return res.status(200).json(
        new ApiResponse(200, { 
            category,
            filtersUpdated: filters.length
        }, "Category filters updated successfully")
    );
});

// PUT: Toggle filter active status
export const toggleFilterStatus = asyncHandler(async (req, res) => {
    const { categoryId, filterName } = req.params;
    
    if (!categoryId || !filterName) {
        throw new ApiErrors(400, "Category ID and filter name are required");
    }
    
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiErrors(404, "Category not found");
    }
    
    const filter = category.filters.find(f => f.name === filterName);
    if (!filter) {
        throw new ApiErrors(404, "Filter not found in this category");
    }
    
    filter.isActive = !filter.isActive;
    await category.save();
    
    return res.status(200).json(
        new ApiResponse(200, { 
            category,
            filterName,
            isActive: filter.isActive
        }, `Filter ${filter.isActive ? 'activated' : 'deactivated'} successfully`)
    );
});

// DELETE: Remove a filter from category
export const removeCategoryFilter = asyncHandler(async (req, res) => {
    const { categoryId, filterName } = req.params;
    
    if (!categoryId || !filterName) {
        throw new ApiErrors(400, "Category ID and filter name are required");
    }
    
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiErrors(404, "Category not found");
    }
    
    const initialLength = category.filters.length;
    category.filters = category.filters.filter(f => f.name !== filterName);
    
    if (category.filters.length === initialLength) {
        throw new ApiErrors(404, "Filter not found in this category");
    }
    
    await category.save();
    
    return res.status(200).json(
        new ApiResponse(200, { category }, "Filter removed successfully")
    );
});

// GET: Get products filtered by category filters
export const getFilteredProducts = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = req.query;
    
    if (!categoryId) {
        throw new ApiErrors(400, "Category ID is required");
    }
    
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiErrors(404, "Category not found");
    }
    
    // Build product query
    const productQuery = { category: categoryId, status: "active" };
    
    // Apply filters from query parameters
    Object.keys(filters).forEach(filterKey => {
        if (filterKey === 'minPrice' || filterKey === 'maxPrice') {
            if (!productQuery.price) productQuery.price = {};
            if (filterKey === 'minPrice') productQuery.price.$gte = Number(filters[filterKey]);
            if (filterKey === 'maxPrice') productQuery.price.$lte = Number(filters[filterKey]);
        } else {
            // Check if this filter exists in category filters
            const categoryFilter = category.filters.find(f => f.name.toLowerCase() === filterKey.toLowerCase() && f.isActive);
            if (categoryFilter) {
                // Apply attribute filter (this assumes products have an attributes field)
                productQuery[`attributes.${filterKey}`] = filters[filterKey];
            }
        }
    });
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    const products = await Product.find(productQuery)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('category', 'name slug categoryType');
    
    const totalProducts = await Product.countDocuments(productQuery);
    
    // Get available filter options based on current results
    const availableFilters = {};
    for (const filter of category.filters) {
        if (filter.isActive) {
            availableFilters[filter.name] = filter.options;
        }
    }
    
    return res.status(200).json(
        new ApiResponse(200, {
            category: {
                id: category._id,
                name: category.name,
                slug: category.slug
            },
            products,
            availableFilters,
            appliedFilters: filters,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalProducts / parseInt(limit)),
                totalProducts,
                limit: parseInt(limit),
                hasNextPage: skip + products.length < totalProducts,
                hasPrevPage: parseInt(page) > 1
            }
        }, "Filtered products retrieved successfully")
    );
});

// ==========================================
// 10. CATEGORY ATTRIBUTES CONTROLLER
// controllers/category/category.attributes.controller.js
// ==========================================

// GET: Get category attributes
export const getCategoryAttributes = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const { includeInactive = false } = req.query;
    
    if (!categoryId) {
        throw new ApiErrors(400, "Category ID is required");
    }
    
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiErrors(404, "Category not found");
    }
    
    let attributes = category.attributes || [];
    
    // Filter out inactive attributes if requested
    if (!includeInactive || includeInactive === 'false') {
        attributes = attributes.filter(a => a.isActive);
    }
    
    return res.status(200).json(
        new ApiResponse(200, { 
            categoryId: category._id,
            categoryName: category.name,
            categoryType: category.categoryType,
            attributes
        }, "Category attributes retrieved successfully")
    );
});

// POST: Add or update category attributes
export const updateCategoryAttributes = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const { attributes } = req.body; // Array of { name, values, isActive }
    
    if (!categoryId) {
        throw new ApiErrors(400, "Category ID is required");
    }
    
    if (!attributes || !Array.isArray(attributes)) {
        throw new ApiErrors(400, "Attributes array is required");
    }
    
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiErrors(404, "Category not found");
    }
    
    // Update or add attributes
    attributes.forEach(newAttr => {
        if (!newAttr.name || !newAttr.values) {
            throw new ApiErrors(400, "Attribute name and values are required");
        }
        
        const existingAttrIndex = category.attributes.findIndex(a => a.name === newAttr.name);
        
        if (existingAttrIndex !== -1) {
            // Update existing attribute
            category.attributes[existingAttrIndex].values = Array.isArray(newAttr.values) ? newAttr.values : [newAttr.values];
            category.attributes[existingAttrIndex].isActive = newAttr.isActive !== undefined ? newAttr.isActive : true;
        } else {
            // Add new attribute
            category.attributes.push({
                name: newAttr.name,
                values: Array.isArray(newAttr.values) ? newAttr.values : [newAttr.values],
                isActive: newAttr.isActive !== undefined ? newAttr.isActive : true
            });
        }
    });
    
    await category.save();
    
    return res.status(200).json(
        new ApiResponse(200, { 
            category,
            attributesUpdated: attributes.length
        }, "Category attributes updated successfully")
    );
});

// PUT: Add value to existing attribute
export const addAttributeValue = asyncHandler(async (req, res) => {
    const { categoryId, attributeName } = req.params;
    const { value } = req.body;
    
    if (!categoryId || !attributeName) {
        throw new ApiErrors(400, "Category ID and attribute name are required");
    }
    
    if (!value) {
        throw new ApiErrors(400, "Attribute value is required");
    }
    
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiErrors(404, "Category not found");
    }
    
    const attribute = category.attributes.find(a => a.name === attributeName);
    if (!attribute) {
        throw new ApiErrors(404, "Attribute not found in this category");
    }
    
    // Add value if it doesn't exist
    const values = Array.isArray(value) ? value : [value];
    values.forEach(v => {
        if (!attribute.values.includes(v)) {
            attribute.values.push(v);
        }
    });
    
    await category.save();
    
    return res.status(200).json(
        new ApiResponse(200, { 
            category,
            attributeName,
            values: attribute.values
        }, "Attribute value added successfully")
    );
});

// DELETE: Remove value from attribute
export const removeAttributeValue = asyncHandler(async (req, res) => {
    const { categoryId, attributeName, value } = req.params;
    
    if (!categoryId || !attributeName || !value) {
        throw new ApiErrors(400, "Category ID, attribute name, and value are required");
    }
    
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiErrors(404, "Category not found");
    }
    
    const attribute = category.attributes.find(a => a.name === attributeName);
    if (!attribute) {
        throw new ApiErrors(404, "Attribute not found in this category");
    }
    
    const initialLength = attribute.values.length;
    attribute.values = attribute.values.filter(v => v !== value);
    
    if (attribute.values.length === initialLength) {
        throw new ApiErrors(404, "Value not found in attribute");
    }
    
    await category.save();
    
    return res.status(200).json(
        new ApiResponse(200, { 
            category,
            attributeName,
            values: attribute.values
        }, "Attribute value removed successfully")
    );
});

// PUT: Toggle attribute active status
export const toggleAttributeStatus = asyncHandler(async (req, res) => {
    const { categoryId, attributeName } = req.params;
    
    if (!categoryId || !attributeName) {
        throw new ApiErrors(400, "Category ID and attribute name are required");
    }
    
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiErrors(404, "Category not found");
    }
    
    const attribute = category.attributes.find(a => a.name === attributeName);
    if (!attribute) {
        throw new ApiErrors(404, "Attribute not found in this category");
    }
    
    attribute.isActive = !attribute.isActive;
    await category.save();
    
    return res.status(200).json(
        new ApiResponse(200, { 
            category,
            attributeName,
            isActive: attribute.isActive
        }, `Attribute ${attribute.isActive ? 'activated' : 'deactivated'} successfully`)
    );
});

// DELETE: Remove entire attribute from category
export const removeCategoryAttribute = asyncHandler(async (req, res) => {
    const { categoryId, attributeName } = req.params;
    
    if (!categoryId || !attributeName) {
        throw new ApiErrors(400, "Category ID and attribute name are required");
    }
    
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiErrors(404, "Category not found");
    }
    
    const initialLength = category.attributes.length;
    category.attributes = category.attributes.filter(a => a.name !== attributeName);
    
    if (category.attributes.length === initialLength) {
        throw new ApiErrors(404, "Attribute not found in this category");
    }
    
    await category.save();
    
    return res.status(200).json(
        new ApiResponse(200, { category }, "Attribute removed successfully")
    );
});