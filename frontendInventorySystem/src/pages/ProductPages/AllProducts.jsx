// ============================================
// COMPLETE PRODUCTS PAGE WITH ADD PRODUCT FEATURE
// ============================================
// This integrates the Add Product button into your existing AllProducts component

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  Package, 
  AlertCircle, 
  ChevronRight, 
  ChevronDown,
  Filter,
  X,
  Search,
  Loader2,
  FolderOpen,
  Grid3x3,
  Plus,
  RefreshCw
} from "lucide-react";
import AddProductModal from "./AddProductModal"; // Import the modal component

const AllProducts = () => {
  const navigate = useNavigate();
  
  // ============ STATE MANAGEMENT ============
  // Product states
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState(null);
  const [query, setQuery] = useState("");
  
  // Category states
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoryError, setCategoryError] = useState(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  
  // Stock status states
  const [stockSummary, setStockSummary] = useState(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState(null);
  const [showStockDropdown, setShowStockDropdown] = useState(false);
  const [selectedStockStatus, setSelectedStockStatus] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://134.33.241.148:5000';
  
  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const dropdownRef = useRef(null);
  const stockDropdownRef = useRef(null);

  // ============ UTILITY FUNCTIONS ============
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // ============ API CALLS ============
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      setCategoryError(null);
      const res = await axios.get(
        `${API_URL}/api/v1/category/getAllCategories`
      );
      setCategories(res.data.data.categories || []);
    } catch (err) {
      setCategoryError(err.response?.data?.message || "Failed to load categories");
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchInventoryOverview = async () => {
    try {
      setStockLoading(true);
      setStockError(null);
      const res = await axios.get(
        `${API_URL}/api/v1/products/getInventoryOverview`
      );
      setStockSummary(res.data.data.summary || null);
    } catch (err) {
      setStockError(err.response?.data?.message || "Failed to load stock overview");
    } finally {
      setStockLoading(false);
    }
  };

  const fetchProducts = useCallback(
    async (searchQuery = "", categoryId = null, stockStatus = null) => {
      try {
        setLoading(true);
        setErrors(null);
        
        let url = `${API_URL}/api/v1/products/getAllProducts`;
        let params = { q: searchQuery };
        
        if (categoryId) {
          url = `${API_URL}/api/v1/products/getProductsByCategory/${categoryId}`;
          params = {};
        }
        
        const res = await axios.get(url, { params });
        
        let products = categoryId 
          ? res.data.data.products 
          : res.data.data.allProductsForSinglePage;
        
        // Apply stock status filter if selected
        if (stockStatus && products) {
          products = products.filter(product => {
            const stock = product.currentStock;
            if (stockStatus === 'inStock') {
              return stock > 10;
            } else if (stockStatus === 'lowStock') {
              return stock > 0 && stock <= 10;
            } else if (stockStatus === 'outOfStock') {
              return stock === 0;
            }
            return true;
          });
        }
        
        setAllProducts(products || []);
      } catch (err) {
        setErrors(err.response?.data?.message || "Failed to load products");
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const debouncedFetchProducts = useCallback(
    debounce((searchQuery, categoryId, stockStatus) => {
      fetchProducts(searchQuery, categoryId, stockStatus);
    }, 500),
    [fetchProducts]
  );

  // ============ EFFECTS ============
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (!selectedCategory && !selectedStockStatus) {
      debouncedFetchProducts(query.trim(), null, null);
    }
  }, [query, selectedCategory, selectedStockStatus, debouncedFetchProducts]);

  useEffect(() => {
    if (showCategoryDropdown && categories.length === 0) {
      fetchCategories();
    }
  }, [showCategoryDropdown, categories.length]);

  useEffect(() => {
    if (showStockDropdown && !stockSummary) {
      fetchInventoryOverview();
    }
  }, [showStockDropdown, stockSummary]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
        setHoveredCategory(null);
      }
      if (stockDropdownRef.current && !stockDropdownRef.current.contains(event.target)) {
        setShowStockDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ============ EVENT HANDLERS ============
  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    setShowCategoryDropdown(false);
    setQuery("");
    await fetchProducts("", category._id, selectedStockStatus);
  };

  const clearCategoryFilter = () => {
    setSelectedCategory(null);
    fetchProducts(query.trim(), null, selectedStockStatus);
  };

  const handleStockStatusSelect = async (statusKey) => {
    const statusMap = {
      inStock: { key: 'inStock', label: 'In Stock' },
      lowStock: { key: 'lowStock', label: 'Low Stock' },
      outOfStock: { key: 'outOfStock', label: 'Out of Stock' }
    };
    
    setSelectedStockStatus(statusMap[statusKey]);
    setShowStockDropdown(false);
    setQuery("");
    await fetchProducts("", selectedCategory?._id, statusKey);
  };

  const clearStockFilter = () => {
    setSelectedStockStatus(null);
    fetchProducts(query.trim(), selectedCategory?._id, null);
  };

  const toggleCategoryExpansion = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  // Handle product added successfully
  const handleProductAdded = (newProduct) => {
    // Refresh the product list
    if (selectedCategory) {
      fetchProducts("", selectedCategory._id, selectedStockStatus?.key);
    } else {
      fetchProducts(query.trim(), null, selectedStockStatus?.key);
    }
  };

  // Refresh products manually
  const handleRefresh = () => {
    if (selectedCategory) {
      fetchProducts("", selectedCategory._id, selectedStockStatus?.key);
    } else {
      fetchProducts(query.trim(), null, selectedStockStatus?.key);
    }
  };

  // ============ HELPER FUNCTIONS ============
  const getSubcategories = (parentId) => {
    return categories.filter(cat => cat.parentCategory?._id === parentId);
  };

  const rootCategories = categories.filter(cat => !cat.parentCategory);

  const getStockStatus = (stock) => {
    if (stock <= 5) {
      return {
        label: "Low",
        className: "bg-orange-50 text-orange-700 border-orange-300",
      };
    }
    return {
      label: "Normal",
      className: "bg-blue-50 text-blue-700 border-blue-300",
    };
  };

  const formatPrice = (price) => `$${Number(price).toFixed(0)}`;

  // ============ CATEGORY ITEM COMPONENT ============
  const CategoryItem = ({ category, level = 0 }) => {
    const subcategories = getSubcategories(category._id);
    const hasSubcategories = subcategories.length > 0;
    const isExpanded = expandedCategories.has(category._id);
    const isHovered = hoveredCategory === category._id;

    return (
      <div className="relative">
        <div
          className={`
            flex items-center justify-between px-4 py-2.5 cursor-pointer
            transition-all duration-150 group
            ${level > 0 ? 'pl-' + (4 + level * 4) : ''}
            ${isHovered ? 'bg-blue-50' : 'hover:bg-gray-50'}
            ${!category.isActive ? 'opacity-60' : ''}
          `}
          onClick={() => {
            if (hasSubcategories) {
              toggleCategoryExpansion(category._id);
            } else {
              handleCategorySelect(category);
            }
          }}
          onMouseEnter={() => setHoveredCategory(category._id)}
          onMouseLeave={() => setHoveredCategory(null)}
        >
          <div className="flex items-center gap-2 flex-1">
            {hasSubcategories && (
              <ChevronRight 
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  isExpanded ? 'rotate-90' : ''
                }`}
              />
            )}
            {!hasSubcategories && <div className="w-4" />}
            <FolderOpen className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700 group-hover:text-blue-600 font-medium">
              {category.name}
            </span>
            {!category.isActive && (
              <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                Inactive
              </span>
            )}
          </div>
          {hasSubcategories && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {subcategories.length}
            </span>
          )}
        </div>

        {hasSubcategories && isExpanded && (
          <div className="bg-gray-50/50 border-l-2 border-gray-200 ml-4">
            {subcategories.map(subcat => (
              <CategoryItem key={subcat._id} category={subcat} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // ============ MAIN RENDER ============
  return (
    <div className="min-h-full bg-gray-50 p-6">
      {/* ============ HEADER SECTION ============ */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">All Products</h1>
            <p className="text-sm text-gray-600">
              {selectedCategory 
                ? `Showing products in "${selectedCategory.name}"`
                : "Manage your inventory products"
              }
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              title="Refresh products"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Add Product Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Add Product</span>
            </button>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          {/* Search Input */}
          <div className="relative flex-1 md:max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={selectedCategory ? "Clear category to search" : "Search products..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={!!selectedCategory}
              className={`
                w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm 
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all
                ${selectedCategory ? 'bg-gray-100 cursor-not-allowed' : ''}
              `}
            />
            {loading && (
              <div className="absolute right-3 top-2.5">
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
              </div>
            )}
          </div>

          {/* Category Filter Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-md border text-sm font-medium
                transition-all duration-150 w-full md:w-auto justify-between md:justify-start
                ${selectedCategory 
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:text-blue-600'
                }
              `}
            >
              <Filter className="w-4 h-4" />
              <span>
                {selectedCategory ? selectedCategory.name : 'All Categories'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                showCategoryDropdown ? 'rotate-180' : ''
              }`} />
            </button>

            {/* Dropdown Menu */}
            {showCategoryDropdown && (
              <div className="absolute top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col left-0 md:left-auto md:right-0">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">Select Category</h3>
                    <button
                      onClick={() => setShowCategoryDropdown(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="overflow-y-auto flex-1">
                  {categoriesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    </div>
                  ) : categoryError ? (
                    <div className="px-4 py-8 text-center">
                      <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                      <p className="text-sm text-red-600">{categoryError}</p>
                      <button
                        onClick={fetchCategories}
                        className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : rootCategories.length === 0 ? (
                    <div className="px-4 py-12 text-center">
                      <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No categories available</p>
                    </div>
                  ) : (
                    <>
                      <div
                        className="flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-all border-b border-gray-100"
                        onClick={() => {
                          clearCategoryFilter();
                          setShowCategoryDropdown(false);
                        }}
                      >
                        <Grid3x3 className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700 font-medium">All Categories</span>
                      </div>

                      {rootCategories.map(category => (
                        <CategoryItem key={category._id} category={category} />
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Stock Status Filter Dropdown */}
          <div className="relative" ref={stockDropdownRef}>
            <button
              onClick={() => setShowStockDropdown(!showStockDropdown)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-md border text-sm font-medium
                transition-all duration-150 w-full md:w-auto justify-between md:justify-start
                ${selectedStockStatus 
                  ? 'bg-green-600 text-white border-green-600 hover:bg-green-700' 
                  : 'bg-white text-gray-700 border-gray-300 hover:border-green-500 hover:text-green-600'
                }
              `}
            >
              <Package className="w-4 h-4" />
              <span>
                {selectedStockStatus ? selectedStockStatus.label : 'Stock Status'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                showStockDropdown ? 'rotate-180' : ''
              }`} />
            </button>

            {/* Stock Dropdown Menu */}
            {showStockDropdown && (
              <div className="absolute top-full mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden flex flex-col left-0 md:left-auto md:right-0">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">Filter by Stock</h3>
                    <button
                      onClick={() => setShowStockDropdown(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="overflow-y-auto">
                  {stockLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
                    </div>
                  ) : stockError ? (
                    <div className="px-4 py-8 text-center">
                      <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                      <p className="text-sm text-red-600">{stockError}</p>
                      <button
                        onClick={fetchInventoryOverview}
                        className="mt-3 text-xs text-green-600 hover:text-green-700 font-medium"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : !stockSummary ? (
                    <div className="px-4 py-12 text-center">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No stock data available</p>
                    </div>
                  ) : (
                    <>
                      {/* All Products Option */}
                      <div
                        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-all border-b border-gray-100"
                        onClick={() => {
                          clearStockFilter();
                          setShowStockDropdown(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Grid3x3 className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700 font-medium">All Products</span>
                        </div>
                      </div>

                      {/* In Stock */}
                      <div
                        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-green-50 transition-all border-b border-gray-100"
                        onClick={() => {
                          handleStockStatusSelect('inStock');
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-700 font-medium">
                            {stockSummary.inStock?.label || 'In Stock'}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {stockSummary.inStock?.count || 0}
                        </span>
                      </div>

                      {/* Low Stock */}
                      <div
                        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-orange-50 transition-all border-b border-gray-100"
                        onClick={() => {
                          handleStockStatusSelect('lowStock');
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          <span className="text-sm text-gray-700 font-medium">
                            {stockSummary.lowStock?.label || 'Low Stock'}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {stockSummary.lowStock?.count || 0}
                        </span>
                      </div>

                      {/* Out of Stock */}
                      <div
                        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-red-50 transition-all"
                        onClick={() => {
                          handleStockStatusSelect('outOfStock');
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-sm text-gray-700 font-medium">
                            {stockSummary.outOfStock?.label || 'Out of Stock'}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {stockSummary.outOfStock?.count || 0}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Filters and Count */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {selectedCategory && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                <span className="text-xs font-medium">Category: {selectedCategory.name}</span>
                <button
                  onClick={clearCategoryFilter}
                  className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            
            {selectedStockStatus && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-md border border-green-200">
                <span className="text-xs font-medium">Stock: {selectedStockStatus.label}</span>
                <button
                  onClick={clearStockFilter}
                  className="hover:bg-green-100 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            {!loading && (
              <>
                <span className="font-medium">{allProducts.length}</span>
                <span> product{allProducts.length !== 1 ? 's' : ''} found</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ============ ERROR MESSAGE ============ */}
      {errors && (
        <div className="flex items-center justify-center mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 w-full md:max-w-md">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{errors}</p>
            </div>
          </div>
        </div>
      )}

      {/* ============ PRODUCTS TABLE ============ */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-blue-600 mx-auto mb-3 animate-spin" />
              <p className="text-gray-600 text-sm">Loading Products...</p>
            </div>
          </div>
        )}

        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-100 border-b border-gray-300">
          <div className="col-span-1 text-sm font-semibold text-gray-700">#</div>
          <div className="col-span-4 text-sm font-semibold text-gray-700">Product Name</div>
          <div className="col-span-3 text-sm font-semibold text-gray-700">Category</div>
          <div className="col-span-2 text-sm font-semibold text-gray-700">Price</div>
          <div className="col-span-2 text-sm font-semibold text-gray-700">Stock</div>
        </div>

        {/* Products List */}
        {allProducts.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Package className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">
              {selectedCategory 
                ? `No products found in "${selectedCategory.name}"`
                : selectedStockStatus
                  ? `No products found with "${selectedStockStatus.label}" status`
                  : query 
                    ? "No products match your search"
                    : "No Products Found"
              }
            </p>
            <p className="text-gray-400 text-sm mb-4">
              {selectedCategory || selectedStockStatus || query ? "Try adjusting your filters" : "Add your first product to get started"}
            </p>
            {(selectedCategory || selectedStockStatus || query) ? (
              <button
                onClick={() => {
                  clearCategoryFilter();
                  clearStockFilter();
                  setQuery("");
                }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Add Your First Product
              </button>
            )}
          </div>
        ) : (
          allProducts.map((product, index) => {
            const stockStatus = getStockStatus(product.currentStock);

            return (
              <div
                key={product._id}
                onClick={() => handleProductClick(product._id)}
                className="border-b border-gray-200 last:border-b-0 hover:bg-blue-50 transition-colors duration-150 cursor-pointer group"
              >
                {/* Desktop View */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 items-center">
                  <div className="col-span-1 text-gray-600 font-medium text-sm">{index + 1}</div>
                  <div className="col-span-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">SKU: {product.sku}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100" />
                    </div>
                  </div>
                  <div className="col-span-3 text-sm text-gray-700">
                    {product.category?.name || "Uncategorized"}
                  </div>
                  <div className="col-span-2 text-sm font-bold text-gray-900">
                    {formatPrice(product.sellingPrice)}
                  </div>
                  <div className="col-span-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${stockStatus.className}`}
                    >
                      {stockStatus.label}
                    </span>
                  </div>
                </div>

                {/* Mobile View */}
                <div className="md:hidden px-4 py-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                        <h3 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                          {product.name}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 mt-1" />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-gray-100 text-gray-700 border border-gray-300">
                      {product.category?.name || "Uncategorized"}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-gray-900 text-white">
                      {formatPrice(product.sellingPrice)}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${stockStatus.className}`}
                    >
                      {stockStatus.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============ ADD PRODUCT MODAL ============ */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onProductAdded={handleProductAdded}
      />
    </div>
  );
};

export { AllProducts };