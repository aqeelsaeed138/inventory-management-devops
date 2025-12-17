// ============================================
// ADD PRODUCT MODAL COMPONENT - UPDATED
// ============================================

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  X,
  Plus,
  Loader2,
  Package,
  DollarSign,
  Tag,
  Building2,
  Calendar,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Info,
  Truck
} from "lucide-react";

const AddProductModal = ({ isOpen, onClose, onProductAdded }) => {
  // ============ STATE MANAGEMENT ============
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    subcategory: "",
    brand: "",
    costPrice: "",
    sellingPrice: "",
    currentStock: "",
    supplier: "",
    expiryDate: "",
    minStockLevel: "",
    image: ""
  });

  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);
  const [suppliersError, setSuppliersError] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || 'http://134.33.241.148:5000';

  // ============ FETCH DATA ON MODAL OPEN ============
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchSuppliers();
    }
  }, [isOpen]);

  // ============ FETCH CATEGORIES ============
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError(null);
      const res = await axios.get(
        `${API_URL}/api/v1/category/getAllCategories`
      );
      setCategories(res.data.data.categories || []);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to load categories. Please try again.";
      setCategoriesError(errorMsg);
      console.error("Categories fetch error:", err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // ============ FETCH SUPPLIERS ============
  const fetchSuppliers = async () => {
    try {
      setSuppliersLoading(true);
      setSuppliersError(null);
      const res = await axios.get(
        `${API_URL}/api/v1/supplier/getAllSuppliers`
      );
      setSuppliers(res.data.data.suppliers || []);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to load suppliers. Please try again.";
      setSuppliersError(errorMsg);
      console.error("Suppliers fetch error:", err);
    } finally {
      setSuppliersLoading(false);
    }
  };

  // ============ FORM HANDLERS ============
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
    setSubmitError(null);
  };

  // ============ VALIDATION ============
  const validateForm = () => {
    const newErrors = {};

    // Required string fields
    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }
    
    if (!formData.category) {
      newErrors.category = "Category is required";
    }
    
    if (!formData.supplier) {
      newErrors.supplier = "Supplier is required";
    }

    // Required numeric fields
    if (!formData.costPrice || formData.costPrice === "") {
      newErrors.costPrice = "Cost price is required";
    } else if (isNaN(formData.costPrice) || Number(formData.costPrice) < 0) {
      newErrors.costPrice = "Cost price must be a positive number";
    }

    if (!formData.sellingPrice || formData.sellingPrice === "") {
      newErrors.sellingPrice = "Selling price is required";
    } else if (isNaN(formData.sellingPrice) || Number(formData.sellingPrice) < 0) {
      newErrors.sellingPrice = "Selling price must be a positive number";
    } else if (Number(formData.sellingPrice) <= Number(formData.costPrice)) {
      newErrors.sellingPrice = "Selling price must be greater than cost price";
    }

    if (!formData.currentStock || formData.currentStock === "") {
      newErrors.currentStock = "Current stock is required";
    } else if (isNaN(formData.currentStock) || Number(formData.currentStock) < 0) {
      newErrors.currentStock = "Stock must be a positive number";
    }

    if (!formData.minStockLevel || formData.minStockLevel === "") {
      newErrors.minStockLevel = "Minimum stock level is required";
    } else if (isNaN(formData.minStockLevel) || Number(formData.minStockLevel) < 0) {
      newErrors.minStockLevel = "Minimum stock level must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============ FORM SUBMISSION ============
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset previous states
    setSubmitError(null);
    setSubmitSuccess(false);

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare payload with MongoDB IDs
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category, // MongoDB ObjectID
        subcategory: formData.subcategory.trim() || undefined,
        brand: formData.brand.trim() || undefined,
        costPrice: Number(formData.costPrice),
        sellingPrice: Number(formData.sellingPrice),
        currentStock: Number(formData.currentStock),
        supplier: formData.supplier, // MongoDB ObjectID
        expiryDate: formData.expiryDate || null,
        minStockLevel: Number(formData.minStockLevel),
        image: formData.image.trim() || null
      };

      // Make API call
      const response = await axios.post(
        `${API_URL}/api/v1/products/addNewProduct`,
        payload
      );

      // Success handling
      setSubmitSuccess(true);
      
      // Notify parent component
      if (onProductAdded) {
        onProductAdded(response.data.data.newProduct);
      }

      // Reset form after short delay
      setTimeout(() => {
        handleClose();
      }, 1500);

    } catch (err) {
      // Error handling - display backend error message
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error ||
                          "Something went wrong while adding the product.";
      setSubmitError(errorMessage);
      console.error("Product submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============ MODAL CLOSE ============
  const handleClose = () => {
    // Reset all states
    setFormData({
      name: "",
      description: "",
      category: "",
      subcategory: "",
      brand: "",
      costPrice: "",
      sellingPrice: "",
      currentStock: "",
      supplier: "",
      expiryDate: "",
      minStockLevel: "",
      image: ""
    });
    setErrors({});
    setSubmitError(null);
    setSubmitSuccess(false);
    setCategoriesError(null);
    setSuppliersError(null);
    onClose();
  };

  // Don't render if modal is not open
  if (!isOpen) return null;

  // ============ RENDER ============
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* ============ MODAL HEADER ============ */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Add New Product</h2>
                <p className="text-sm text-blue-100">Fill in the product details below</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============ MODAL BODY ============ */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Success Message */}
          {submitSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-green-800 font-medium">Product added successfully!</p>
                <p className="text-green-600 text-sm">The product has been added to your inventory.</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {submitError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-800 font-medium">Failed to add product</p>
                <p className="text-red-600 text-sm">{submitError}</p>
              </div>
            </div>
          )}

          {/* Categories/Suppliers Loading Error */}
          {(categoriesError || suppliersError) && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-yellow-800 font-medium">Data Loading Issues</p>
                {categoriesError && (
                  <p className="text-yellow-600 text-sm mt-1">Categories: {categoriesError}</p>
                )}
                {suppliersError && (
                  <p className="text-yellow-600 text-sm mt-1">Suppliers: {suppliersError}</p>
                )}
                <div className="flex gap-2 mt-2">
                  {categoriesError && (
                    <button
                      onClick={fetchCategories}
                      className="text-xs text-yellow-700 hover:text-yellow-800 font-medium underline"
                    >
                      Retry Categories
                    </button>
                  )}
                  {suppliersError && (
                    <button
                      onClick={fetchSuppliers}
                      className="text-xs text-yellow-700 hover:text-yellow-800 font-medium underline"
                    >
                      Retry Suppliers
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ============ BASIC INFORMATION ============ */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-600" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Blue Denim Jeans"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Enter product description..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  />
                </div>

                {/* Category Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    disabled={categoriesLoading || !!categoriesError}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      errors.category ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    } ${categoriesLoading || categoriesError ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  >
                    <option value="">
                      {categoriesLoading 
                        ? "Loading categories..." 
                        : categoriesError 
                          ? "Failed to load categories"
                          : categories.length === 0
                            ? "No categories available"
                            : "Select category"
                      }
                    </option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>
                        {cat.parentCategory 
                          ? `${cat.parentCategory.name} → ${cat.name}` 
                          : cat.name
                        }
                      </option>
                    ))}
                  </select>
                  {categoriesLoading && (
                    <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Loading categories...
                    </p>
                  )}
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.category}
                    </p>
                  )}
                  {!categoriesLoading && categories.length === 0 && !categoriesError && (
                    <p className="mt-1 text-sm text-yellow-600 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" />
                      No categories found. Please add categories first.
                    </p>
                  )}
                </div>

                {/* Supplier Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleChange}
                    disabled={suppliersLoading || !!suppliersError}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      errors.supplier ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    } ${suppliersLoading || suppliersError ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  >
                    <option value="">
                      {suppliersLoading 
                        ? "Loading suppliers..." 
                        : suppliersError 
                          ? "Failed to load suppliers"
                          : suppliers.length === 0
                            ? "No suppliers available"
                            : "Select supplier"
                      }
                    </option>
                    {suppliers.map(supplier => (
                      <option key={supplier._id} value={supplier._id}>
                        {supplier.name} {supplier.status && `(${supplier.status})`}
                      </option>
                    ))}
                  </select>
                  {suppliersLoading && (
                    <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Loading suppliers...
                    </p>
                  )}
                  {errors.supplier && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.supplier}
                    </p>
                  )}
                  {!suppliersLoading && suppliers.length === 0 && !suppliersError && (
                    <p className="mt-1 text-sm text-yellow-600 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" />
                      No suppliers found. Please add suppliers first.
                    </p>
                  )}
                </div>

                {/* Subcategory */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subcategory <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="subcategory"
                    value={formData.subcategory}
                    onChange={handleChange}
                    placeholder="e.g., Men's Wear"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    placeholder="e.g., Levi's"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* ============ PRICING INFORMATION ============ */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Pricing Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cost Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost Price <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                    <input
                      type="number"
                      name="costPrice"
                      value={formData.costPrice}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className={`w-full pl-8 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        errors.costPrice ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.costPrice && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.costPrice}
                    </p>
                  )}
                </div>

                {/* Selling Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selling Price <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                    <input
                      type="number"
                      name="sellingPrice"
                      value={formData.sellingPrice}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className={`w-full pl-8 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        errors.sellingPrice ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.sellingPrice && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.sellingPrice}
                    </p>
                  )}
                </div>

                {/* Profit Margin Display */}
                {formData.costPrice && formData.sellingPrice && 
                 Number(formData.sellingPrice) > Number(formData.costPrice) && (
                  <div className="md:col-span-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-800">Profit Margin:</span>
                      <span className="text-lg font-bold text-green-600">
                        ${(Number(formData.sellingPrice) - Number(formData.costPrice)).toFixed(2)}
                        <span className="text-sm ml-2">
                          ({(((Number(formData.sellingPrice) - Number(formData.costPrice)) / Number(formData.costPrice)) * 100).toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ============ STOCK INFORMATION ============ */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                Stock Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Stock <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="currentStock"
                    value={formData.currentStock}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      errors.currentStock ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.currentStock && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.currentStock}
                    </p>
                  )}
                </div>

                {/* Minimum Stock Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Stock Level <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="minStockLevel"
                    value={formData.minStockLevel}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      errors.minStockLevel ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.minStockLevel && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.minStockLevel}
                    </p>
                  )}
                </div>

                {/* Stock Status Indicator */}
                {formData.currentStock && formData.minStockLevel && (
                  <div className="md:col-span-2">
                    <div className={`p-3 rounded-lg border flex items-center gap-2 ${
                      Number(formData.currentStock) <= Number(formData.minStockLevel)
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}>
                      <Info className={`w-4 h-4 ${
                        Number(formData.currentStock) <= Number(formData.minStockLevel)
                          ? 'text-orange-600'
                          : 'text-blue-600'
                      }`} />
                      <span className={`text-sm font-medium ${
                        Number(formData.currentStock) <= Number(formData.minStockLevel)
                          ? 'text-orange-800'
                          : 'text-blue-800'
                      }`}>
                        {Number(formData.currentStock) <= Number(formData.minStockLevel)
                          ? '⚠️ Stock is at or below minimum level'
                          : '✓ Stock level is healthy'
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ============ ADDITIONAL INFORMATION ============ */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                Additional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Expiry Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      name="image"
                      value={formData.image}
                      onChange={handleChange}
                      placeholder="https://example.com/image.png"
                      className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* ============ MODAL FOOTER ============ */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-600 text-center sm:text-left">
            <span className="text-red-500">*</span> Required fields
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || submitSuccess || categoriesLoading || suppliersLoading || !!categoriesError || !!suppliersError}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding Product...
                </>
              ) : submitSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Product Added!
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Product
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProductModal;


// ============================================
// ADD PRODUCT BUTTON COMPONENT
// ============================================
// Use this button in your main products page

export const AddProductButton = ({ onProductAdded }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
      >
        <Plus className="w-5 h-5" />
        <span className="hidden sm:inline">Add Product</span>
        <span className="sm:hidden">Add</span>
      </button>

      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProductAdded={(newProduct) => {
          setIsModalOpen(false);
          if (onProductAdded) {
            onProductAdded(newProduct);
          }
        }}
      />
    </>
  );
};