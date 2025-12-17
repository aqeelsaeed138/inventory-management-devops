import { Category } from "../models/category.models.js";
import { Product } from "../models/product.models.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const generateSlug = (name) => {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

const addNewCategory = asyncHandler(async (req, res) => {
    if (!req.body) {
        throw new ApiErrors(400, "Request body is required");
    }

    const { name, description, parentCategory, isActive, image, taxRate } = req.body;

    if (!name || name.trim() === "") {
        throw new ApiErrors(400, "Category name is required");
    }

    if (taxRate !== undefined) {
        const numericTaxRate = Number(taxRate);
        if (isNaN(numericTaxRate) || numericTaxRate < 0 || numericTaxRate > 100) {
            throw new ApiErrors(400, "Tax rate must be a number between 0 and 100");
        }
    }

    const existedCategory = await Category.findOne({ name: name.trim() });
    if (existedCategory) {
        throw new ApiErrors(400, "Category with this name already exists");
    }

    let slug = generateSlug(name);
    const existingSlug = await Category.findOne({ slug });
    if (existingSlug) {
        const timestamp = Date.now().toString().slice(-4);
        slug = `${slug}-${timestamp}`;
    }

    let parentCategoryDoc = null;
    if (parentCategory) {
        parentCategoryDoc = await Category.findById(parentCategory);
        if (!parentCategoryDoc) {
            throw new ApiErrors(400, "Parent category not found");
        }
    }

    const newCategory = await Category.create({
        name: name.trim(),
        description: description?.trim(),
        slug,
        parentCategory: parentCategory || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        image: image?.trim() || null,
        taxRate: taxRate ? Number(taxRate) : 0
    });

    if (parentCategoryDoc) {
        parentCategoryDoc.subcategories.push(newCategory._id);
        await parentCategoryDoc.save();
    }

    const checkCategory = await Category.findById(newCategory._id)
        .populate('parentCategory', 'name slug')
        .populate('subcategories', 'name slug');

    if (!checkCategory) {
        throw new ApiErrors(500, "Server error occurred while creating category");
    }

    return res.status(201).json(
        new ApiResponse(201, { category: checkCategory }, "Category created successfully")
    );
});

const getAllCategories = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, isActive, parentCategory } = req.query;
    
    const filter = {};
    if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
    }
    if (parentCategory === 'null') {
        filter.parentCategory = null; 
    } else if (parentCategory) {
        filter.parentCategory = parentCategory;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const categories = await Category.find(filter)
        .populate('parentCategory', 'name slug')
        .populate('subcategories', 'name slug isActive')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const totalCategories = await Category.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, {
            categories,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCategories / parseInt(limit)),
                totalCategories,
                hasNextPage: skip + categories.length < totalCategories,
                hasPrevPage: parseInt(page) > 1
            }
        }, "Categories retrieved successfully")
    );
});

const getCategoryById = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;

    if (!categoryId) {
        throw new ApiErrors(400, "Category ID is required");
    }

    const category = await Category.findById(categoryId)
        .populate('parentCategory', 'name slug')
        .populate('subcategories', 'name slug isActive');

    if (!category) {
        throw new ApiErrors(404, "Category not found");
    }

    return res.status(200).json(
        new ApiResponse(200, { category }, "Category retrieved successfully")
    );
});

const updateCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    
    if (!categoryId) {
        throw new ApiErrors(400, "Category ID is required");
    }

    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiErrors(404, "Category not found");
    }

    const { name, description, parentCategory, image } = req.body;

    

    if (name && name.trim() !== category.name) {
        const existedCategory = await Category.findOne({ 
            name: name.trim(),
            _id: { $ne: categoryId }
        });
        if (existedCategory) {
            throw new ApiErrors(400, "Category with this name already exists");
        }
    }

    if (parentCategory && parentCategory !== category.parentCategory?.toString()) {
        if (parentCategory === categoryId) {
            throw new ApiErrors(400, "Category cannot be its own parent");
        }
        
        const parentCategoryDoc = await Category.findById(parentCategory);
        if (!parentCategoryDoc) {
            throw new ApiErrors(400, "Parent category not found");
        }
    }

    if (name) {
        category.name = name.trim();
        category.slug = generateSlug(name);
        
        const existingSlug = await Category.findOne({ 
            slug: category.slug,
            _id: { $ne: categoryId }
        });
        if (existingSlug) {
            const timestamp = Date.now().toString().slice(-4);
            category.slug = `${category.slug}-${timestamp}`;
        }
    }
    
    if (description !== undefined) category.description = description?.trim() || null;
    if (parentCategory !== undefined) category.parentCategory = parentCategory || null;
    if (image !== undefined) category.image = image?.trim() || null;

    await category.save();

    const updatedCategory = await Category.findById(categoryId)
        .populate('parentCategory', 'name slug')
        .populate('subcategories', 'name slug isActive');

    return res.status(200).json(
        new ApiResponse(200, { category: updatedCategory }, "Category updated successfully")
    );
});
const deactivateCategoryAndProducts = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;

    if (!categoryId) {
        throw new ApiErrors(400, "Category ID is required");
    }

    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiErrors(404, "Category not found");
    }

    // If already inactive
    if (!category.isActive) {
        return res.status(200).json(
            new ApiResponse(200, { category }, "Category is already inactive")
        );
    }

    // Deactivate category
    category.isActive = false;
    await category.save();

    // Deactivate all products in this category
    const result = await Product.updateMany(
        { category: categoryId },
        { $set: { status: "inactive" } }
    );

    return res.status(200).json(
        new ApiResponse(200, { 
            category,
            affectedProducts: result.modifiedCount
        }, "Category and all associated products have been deactivated successfully")
    );
});

const updateCategoryTaxRateAndProducts = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const { taxRate } = req.body;

    if (!categoryId) {
        throw new ApiErrors(400, "Category ID is required");
    }

    if (taxRate === undefined || taxRate === null) {
        throw new ApiErrors(400, "New tax rate is required");
    }

    const numericTaxRate = Number(taxRate);
    if (isNaN(numericTaxRate) || numericTaxRate < 0 || numericTaxRate > 100) {
        throw new ApiErrors(400, "Tax rate must be a number between 0 and 100");
    }

    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiErrors(404, "Category not found");
    }

    // Update category tax rate
    category.taxRate = numericTaxRate;
    await category.save();

    // Update all products of this category
    const result = await Product.updateMany(
        { category: categoryId },
        { $set: { taxRate: numericTaxRate } }
    );

    return res.status(200).json(
        new ApiResponse(200, { 
            category,
            updatedProducts: result.modifiedCount
        }, "Category tax rate and all associated products' tax rates updated successfully")
    );
});

const deleteCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;

    if (!categoryId) {
        throw new ApiErrors(400, "Category ID is required");
    }

    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiErrors(404, "Category not found");
    }

    // Check if category has subcategories
    if (category.subcategories && category.subcategories.length > 0) {
        throw new ApiErrors(400, "Cannot delete category that has subcategories. Please delete or reassign subcategories first.");
    }

    // Remove this category from parent's subcategories array
    if (category.parentCategory) {
        await Category.findByIdAndUpdate(
            category.parentCategory,
            { $pull: { subcategories: categoryId } }
        );
    }

    await Category.findByIdAndDelete(categoryId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Category deleted successfully")
    );
});


// Get category hierarchy (tree structure)
const getCategoryHierarchy = asyncHandler(async (_, res) => {
    const rootCategories = await Category.find({ parentCategory: null, isActive: true })
        .populate({
            path: 'subcategories',
            match: { isActive: true },
            populate: {
                path: 'subcategories',
                match: { isActive: true }
            }
        })
        .sort({ name: 1 });

    return res.status(200).json(
        new ApiResponse(200, { categoryHierarchy: rootCategories }, "Category hierarchy retrieved successfully")
    );
});
const activateCategoryAndProducts = asyncHandler(async (req, res) => {
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

    category.isActive = true;
    await category.save();

    // Optionally activate products too
    const result = await Product.updateMany(
        { category: categoryId },
        { $set: { status: "active" } }
    );

    return res.status(200).json(
        new ApiResponse(200, { 
            category,
            affectedProducts: result.modifiedCount
        }, "Category and associated products activated successfully")
    );
});

export {
    addNewCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    getCategoryHierarchy,
    deactivateCategoryAndProducts,
    updateCategoryTaxRateAndProducts,
    activateCategoryAndProducts
};