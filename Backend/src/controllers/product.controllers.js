import { Category } from "../models/category.models.js";
import { Product } from "../models/product.models.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const generateSKU = function(name, category, brand,unit='unit') {
    const parts = [];
        if (category) {
        parts.push(category.substring(0, 3).toUpperCase() || 'CAT');
    }
    
    if (brand) {
        parts.push(brand.substring(0, 3).toUpperCase());
    }
    
    if (name) {
        const nameCode = name
            .replace(/[^a-zA-Z0-9]/g, '') // Remove special characters
            .substring(0, 3)
            .toUpperCase();
        parts.push(nameCode);
    }
    const unitCodes = {
        'kg': 'KG',
        'gram': 'GM', 
        'liter': 'LT',
        'meter': 'MT',
        'pack': 'PK',
        'box': 'BX',
        'dozen': 'DZ',
        'unit': 'UN',
        'set': 'ST',
        'roll': 'RL'
    };
    parts.push(unitCodes[unit] || 'UN');

    const timestamp = Date.now().toString().slice(-4); 
    parts.push(timestamp);
    
    return parts.join('-');
};

const addNewProduct = asyncHandler(async (req, res) => {
  if (!req.body) {
    throw new ApiErrors(400, "Request body is required");
  }

  const {
    name,
    description,
    category,
    subcategory,
    brand,
    costPrice,
    sellingPrice,
    currentStock,
    supplier,
    expiryDate,
    minStockLevel,
    image 
  } = req.body;

  const stringFields = [name, category, supplier];
  const numericFields = [costPrice, sellingPrice, currentStock, minStockLevel];

  if (
    stringFields.some((field) => {
      return !field || field.trim() === "";
    })
  ) {
    throw new ApiErrors(400, "Necessary fields are required to add new product");
  }

  for (let field of numericFields) {
    if (field !== undefined && (!Number.isFinite(field) || field < 0)) {
      throw new ApiErrors(400, "Numeric fields must be valid positive numbers");
    }
  }

  if (sellingPrice <= costPrice) {
    throw new ApiErrors(400, "Selling price must be greater than cost price");
  }

  const existedProduct = await Product.findOne({ name });
  if (existedProduct) {
    throw new ApiErrors(400, "This product is already present in the stock");
  }

  const checkCategory = await Category.findById(category);
  if (!checkCategory) {
    throw new ApiErrors(400, "Product's category is invalid");
  }

  const sku = generateSKU(name, category, brand);

  const newProduct = await Product.create({
    name: name.trim(),
    description: description?.trim(),
    sku,
    category,
    subcategory: subcategory?.trim(),
    brand: brand?.trim(),
    costPrice,
    sellingPrice,
    currentStock,
    supplier,
    minStockLevel,
    expiryDate,
    image: image || null 
  });

  const checkProduct = await Product.findById(newProduct._id);
  if (!checkProduct) {
    throw new ApiErrors(500, "Some server error occurred while creating new product");
  }

  const stockStatus = checkProduct.getStockStatus();

  return res
    .status(200)
    .json(
      new ApiResponse(
        201,
        { newProduct, stockStatus },
        "Successfully created new product"
      )
    );
});

const updateProductStock = asyncHandler(async (req, res)=> {
    const { productId } = req.params
    const {newStock} = req.body
    if (!productId) {
        throw new ApiErrors(400, "Product id is required")
    }
    const product = await Product.findById(productId)
    if (!product) {
        throw new ApiErrors(400, "This product is not present. First add this product")
    }
    await product.updateStock(newStock);
    return res.status(200)
    .json(
        new ApiResponse(200, {}, "Product stock updated successfully")
    )
})
const deleteProduct = asyncHandler(async (req, res)=> {
    const {productId} = req.params
    if (!productId) {
        throw new ApiErrors("Product id is required")
    }
    const product = await Product.findById(productId)
    if (!product) {
        throw new ApiErrors(400, "This product is not present. First add this product")
    }
    await Product.findByIdAndDelete(product._id)

    res.status(200)
    .json(
        new ApiResponse(200, {}, "Delete a product successfully")
    )
})

const getAllProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    category,
    brand,
    status = "active",
    sortBy = "createdAt",
    sortOrder = "desc",
    q,
  } = req.query;

  const skip = (page - 1) * limit;
  const sortDirection = sortOrder === "desc" ? -1 : 1;

  // ✅ If search query exists → use Atlas Search
  if (q && q.trim() !== "") {
    try {
      const searchPipeline = [
        {
          $search: {
            index: "productSearch", // name of your Atlas Search index
            text: {
              query: q,
              path: ["name", "sku", "brand", "category"], // searchable fields
              fuzzy: { maxEdits: 2 },
            },
          },
        },
        // 🧱 Filter non-text fields after search
        {
          $match: {
            ...(status ? { status } : {}),
            ...(category ? { category } : {}),
            ...(brand ? { brand } : {}),
          },
        },
        {
          $sort: { [sortBy]: sortDirection },
        },
        {
          $skip: skip,
        },
        {
          $limit: parseInt(limit),
        },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $lookup: {
            from: "brands",
            localField: "brand",
            foreignField: "_id",
            as: "brand",
          },
        },
        {
          $unwind: { path: "$category", preserveNullAndEmptyArrays: true },
        },
        {
          $unwind: { path: "$brand", preserveNullAndEmptyArrays: true },
        },
      ];

      const allProductsForSinglePage = await Product.aggregate(searchPipeline);

      // Get total count for pagination (optional but nice to have)
      const totalProductsPipeline = [
        {
          $search: {
            index: "productSearch",
            text: {
              query: q,
              path: ["name", "sku", "brand", "category"],
              fuzzy: { maxEdits: 2 },
            },
          },
        },
        {
          $match: {
            ...(status ? { status } : {}),
            ...(category ? { category } : {}),
            ...(brand ? { brand } : {}),
          },
        },
        { $count: "total" },
      ];

      const totalResult = await Product.aggregate(totalProductsPipeline);
      const totalProducts = totalResult[0]?.total || 0;
      const totalPages = Math.ceil(totalProducts / limit);

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            allProductsForSinglePage,
            totalProducts,
            pagination: {
              currentPage: parseInt(page),
              totalPages,
              hasNextPage: page < totalPages,
              hasPrevPage: page > 1,
            },
          },
          "Products fetched successfully using Atlas Search"
        )
      );
    } catch (error) {
      console.error("Atlas Search Error:", error);
      return res.status(500).json({ message: "Search failed", error });
    }
  }

  // 🧱 If no search query → fallback to normal MongoDB filter
  const filter = {};
  if (category) filter.category = category;
  if (brand) filter.brand = brand;
  if (status) filter.status = status;

  const sort = {};
  sort[sortBy] = sortDirection;

  const allProductsForSinglePage = await Product.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .populate("category", "name")
    .populate("brand", "name");

  const totalProducts = await Product.countDocuments(filter);
  const totalPages = Math.ceil(totalProducts / limit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        allProductsForSinglePage,
        totalProducts,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      "All products fetched successfully"
    )
  );
});
const getActiveAndInactiveProducts = asyncHandler(async (req, res) => {
    // Fetch active and inactive products
    const activeProducts = await Product.find({ status: "active" })
        .populate("category supplier")
        .sort({ createdAt: -1 });

    const inactiveProducts = await Product.find({ status: "inactive" })
        .populate("category supplier")
        .sort({ createdAt: -1 });

    // Count totals
    const activeCount = activeProducts.length;
    const inactiveCount = inactiveProducts.length;

    // Build response structure
    const data = {
        summary: {
            active: { label: "Active Products", count: activeCount },
            inactive: { label: "Inactive Products", count: inactiveCount },
        },
        products: {
            active: activeProducts,
            inactive: inactiveProducts,
        },
    };

    return res
        .status(200)
        .json(new ApiResponse(200, data, "Active and inactive products fetched successfully"));
});
const getProductsByBrand = asyncHandler(async (req, res) => {
    const { brand } = req.params; // e.g., /api/v1/products/brand/Nike

    if (!brand || brand.trim() === "") {
        throw new ApiErrors(400, "Brand name is required");
    }

    // Case-insensitive brand search using regex
    const products = await Product.find({ brand: { $regex: new RegExp(brand, "i") } })
        .populate("category supplier")
        .sort({ createdAt: -1 });

    if (!products || products.length === 0) {
        throw new ApiErrors(404, `No products found for brand: ${brand}`);
    }

    const count = products.length;

    return res.status(200).json(
        new ApiResponse(
            200,
            { count, brand, products },
            `Products for brand '${brand}' fetched successfully`
        )
    );
});


const getProductById = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    if (!productId) {
        throw new ApiErrors(400, "Product ID is required");
    }

    const product = await Product.findById(productId)
        .populate('category', 'name description')
        .populate('brand', 'name description');

    if (!product) {
        throw new ApiErrors(404, "Product not found");
    }

    const productInfo = {
        ...product.toObject(),
        displayInfo: product.getDisplayInfo(),
        priceWithTax: await product.getPriceWithTax(),
        daysUntilExpired: product.getDaysUntilExpired()
    };

    res.status(200)
    .json(
        new ApiResponse(200, productInfo, "Successfully Get all all information of a product")
    )
});
const updateProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const updateData = req.body;
    
    if (Object.keys(updateData).length === 0) {
        throw new ApiErrors(400, "Updated data is required")
    }

    if (!productId) {
        throw new ApiErrors(400, "Product ID is required");
    }

    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiErrors(404, "Product not found");
    }

    // Apply updates to the product instance temporarily for validation
    if (updateData.sellingPrice !== undefined) {
        product.sellingPrice = updateData.sellingPrice;
    }
    if (updateData.costPrice !== undefined) {
        product.costPrice = updateData.costPrice;
    }
    if (updateData.currentStock !== undefined) {
        product.currentStock = updateData.currentStock;
    }
    if (updateData.minStockLevel !== undefined) {
        product.minStockLevel = updateData.minStockLevel;
    }
    if (updateData.maxStockLevel !== undefined) {
        product.maxStockLevel = updateData.maxStockLevel;
    }

    if (updateData.sellingPrice !== undefined || updateData.costPrice !== undefined) {
        const priceValidation = product.validatePrice();
        if (!priceValidation.isValid) {
            throw new ApiErrors(400, priceValidation.errors.join(', '));
        }
    }

    if (updateData.currentStock !== undefined || 
        updateData.minStockLevel !== undefined || 
        updateData.maxStockLevel !== undefined) {
        const stockValidation = product.validateStock();
        if (!stockValidation.isValid) {
            throw new ApiErrors(400, stockValidation.errors.join(', '));
        }
    }

    if (updateData.expiryDate !== undefined) {
        const expiryValidation = product.validateExpiry();
        if (!expiryValidation.isValid) {
            throw new ApiErrors(400, expiryValidation.errors.join(', '));
        }
    }
    const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        updateData,
        { new: true, runValidators: true }
    ).populate('category brand');

    res.status(200)
    .json(
        new ApiResponse(200, updatedProduct, "Product updated successfully")
    );
});
const getLowStockProducts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const products = await Product.find({ status: 'active'})
        .populate('category brand')
        .skip(skip)
        .limit(parseInt(limit));

    const lowStockProducts = products.filter(product => product.isLowStock());

    const totalLowStockProducts = lowStockProducts.length;
    const totalPages = Math.ceil(totalLowStockProducts / limit);

    res.status(200)
    .json(
        new ApiResponse(200, {
            products: lowStockProducts,
            totalLowStockProducts,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }}, "all low stock products fetched successfully") 
    );
});
const getInventoryOverview = asyncHandler(async (req, res) => {
    const { filter = "all", page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Fetch only active products for inventory tracking
    const products = await Product.find({ status: "active" })
        .populate("category supplier")
        .skip(skip)
        .limit(parseInt(limit));

    // Use schema methods to classify products
    const lowStockProducts = [];
    const outOfStockProducts = [];
    const inStockProducts = [];

    products.forEach((product) => {
        if (product.isOutOfStock()) outOfStockProducts.push(product);
        else if (product.isLowStock()) lowStockProducts.push(product);
        else inStockProducts.push(product);
    });

    // Apply filtering based on query param
    let filteredProducts = [];
    if (filter === "low") filteredProducts = lowStockProducts;
    else if (filter === "out") filteredProducts = outOfStockProducts;
    else if (filter === "in") filteredProducts = inStockProducts;
    else filteredProducts = [...inStockProducts, ...lowStockProducts, ...outOfStockProducts];

    // Prepare inventory summary
    const totalInStock = await Product.countDocuments({ currentStock: { $gt: 10 }, status: "active" });
    const totalLowStock = await Product.countDocuments({ currentStock: { $gt: 0, $lte: 10 }, status: "active" });
    const totalOutOfStock = await Product.countDocuments({ currentStock: 0, status: "active" });

    const summary = {
        inStock: { label: "In Stock", count: totalInStock },
        lowStock: { label: "Low Stock (< 10 units)", count: totalLowStock },
        outOfStock: { label: "Out of Stock", count: totalOutOfStock },
    };

    // Pagination info
    const totalProducts = filteredProducts.length;
    const totalPages = Math.ceil(totalProducts / limit);

    res.status(200).json(
        new ApiResponse(
            200,
            {
                summary,
                products: filteredProducts,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                },
            },
            "Inventory overview fetched successfully"
        )
    );
});
const getProductsByCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const { page = 1, limit = 10, status = 'active' } = req.query;

    if (!categoryId) {
        throw new ApiErrors(400, "Category ID is required");
    }

    const filter = { 
        category: categoryId,
        status: status
     };

    const skip = (page - 1) * limit;

    const products = await Product.find(filter)
        .populate('category brand')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    res.status(200)
    .json(
        new ApiResponse(200, {
            products,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalProducts
            }
        }, "fetched all products by category")
    )
});

const toggleProductStatus = asyncHandler(async (req, res) => {
    if (!req.body) {
        throw new ApiErrors(400, "Request body is required")
    }
    const { productId } = req.params;
    const { action } = req.body;

    if (!productId) {
        throw new ApiErrors(400, "Product ID is required");
    }

    if (!action || !['activate', 'deactivate'].includes(action)) {
        throw new ApiErrors(400, "Action must be 'activate' or 'deactivate'");
    }

    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiErrors(404, "Product not found");
    }

    if (action === 'activate') {
        product.activate();
    } else {
        product.deactivate();
    }

    res.status(200)
    .json(
        new ApiResponse(200, {
            productId,
            status: product.isActive() ? 'Active': 'Inactive'
        }, `Product ${action}d successfully`)
    )
});

export { 
    addNewProduct,
    updateProductStock, 
    deleteProduct, 
    getAllProducts,
    getProductById,
    updateProduct,
    getLowStockProducts,
    getProductsByCategory,
    toggleProductStatus,
    getInventoryOverview,
    getActiveAndInactiveProducts,
    getProductsByBrand }
