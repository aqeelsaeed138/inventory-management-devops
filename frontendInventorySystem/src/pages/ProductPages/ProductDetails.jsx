import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Package,
  DollarSign,
  Box,
  Tag,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Edit,
  Power,
  ChevronDown,
  X,
  Save,
  RefreshCw,
  Image as ImageIcon,
  Info,
  ShoppingCart,
  Layers
} from 'lucide-react';

const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State Management
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);
  
  // Modal States
  const [showUpdateStockModal, setShowUpdateStockModal] = useState(false);
  const [showUpdateProductModal, setShowUpdateProductModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || 'http://134.33.241.148:5000';
  
  // Form States
  const [newStock, setNewStock] = useState('');
  const [updateForm, setUpdateForm] = useState({
    sellingPrice: '',
    costPrice: '',
    currentStock: '',
    minStockLevel: '',
    maxStockLevel: ''
  });
  const [statusAction, setStatusAction] = useState('');

  // Fetch Product Details
  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${API_URL}/api/v1/products/getProductById/${id}`
      );
      setProduct(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load product details');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update Stock Handler
  const handleUpdateStock = async () => {
    if (!newStock || newStock === '' || isNaN(newStock) || Number(newStock) < 0) {
      setActionError('Please enter a valid stock quantity');
      return;
    }

    try {
      setActionLoading(true);
      setActionError(null);
      
      const response = await axios.put(
        `${API_URL}/api/v1/products/updateProductStock/${id}`,
        { newStock: Number(newStock) }
      );
      
      setActionSuccess('Stock updated successfully!');
      setShowUpdateStockModal(false);
      setNewStock('');
      
      // Refresh product data
      setTimeout(() => {
        fetchProductDetails();
        setActionSuccess(null);
      }, 1500);
      
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update stock');
    } finally {
      setActionLoading(false);
    }
  };

  // Update Product Handler
  const handleUpdateProduct = async () => {
    const updates = {};
    
    if (updateForm.sellingPrice) updates.sellingPrice = Number(updateForm.sellingPrice);
    if (updateForm.costPrice) updates.costPrice = Number(updateForm.costPrice);
    if (updateForm.currentStock) updates.currentStock = Number(updateForm.currentStock);
    if (updateForm.minStockLevel) updates.minStockLevel = Number(updateForm.minStockLevel);
    if (updateForm.maxStockLevel) updates.maxStockLevel = Number(updateForm.maxStockLevel);
    
    if (Object.keys(updates).length === 0) {
      setActionError('Please provide at least one field to update');
      return;
    }

    try {
      setActionLoading(true);
      setActionError(null);
      
      const response = await axios.put(
        `${API_URL}/api/v1/products/updateProduct/${id}`,
        updates
      );
      
      setActionSuccess('Product updated successfully!');
      setShowUpdateProductModal(false);
      setUpdateForm({
        sellingPrice: '',
        costPrice: '',
        currentStock: '',
        minStockLevel: '',
        maxStockLevel: ''
      });
      
      setTimeout(() => {
        fetchProductDetails();
        setActionSuccess(null);
      }, 1500);
      
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update product');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Status Handler
  const handleToggleStatus = async () => {
    if (!statusAction) {
      setActionError('Please select an action');
      return;
    }

    try {
      setActionLoading(true);
      setActionError(null);
      
      const response = await axios.put(
        `${API_URL}/api/v1/products/toggleProductStatus/${id}`,
        { action: statusAction }
      );
      
      setActionSuccess(`Product ${statusAction}d successfully!`);
      setShowStatusModal(false);
      setStatusAction('');
      
      setTimeout(() => {
        fetchProductDetails();
        setActionSuccess(null);
      }, 1500);
      
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to toggle status');
    } finally {
      setActionLoading(false);
    }
  };

  // Initialize Update Form
  const openUpdateModal = () => {
    setUpdateForm({
      sellingPrice: product?.sellingPrice || '',
      costPrice: product?.costPrice || '',
      currentStock: product?.currentStock || '',
      minStockLevel: product?.minStockLevel || '',
      maxStockLevel: product?.maxStockLevel || ''
    });
    setShowUpdateProductModal(true);
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">Error Loading Product</h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/products')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={fetchProductDetails}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayInfo = product?.displayInfo;
  const stockStatus = displayInfo?.stock;
  const profitMargin = product?.sellingPrice - product?.costPrice;
  const profitPercentage = product?.costPrice ? ((profitMargin / product?.costPrice) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/products')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{product?.name}</h1>
                <p className="text-sm text-gray-500">SKU: {product?.sku}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowUpdateStockModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Layers className="w-4 h-4" />
                Update Stock
              </button>
              <button
                onClick={openUpdateModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Product
              </button>
              <button
                onClick={() => setShowStatusModal(true)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  product?.status === 'active'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                <Power className="w-4 h-4" />
                {product?.status === 'active' ? 'Active' : 'Inactive'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Feedback */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {actionSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">{actionSuccess}</p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Product Image & Basic Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  {product?.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{product?.name}</h2>
                  <p className="text-gray-600 mb-4">
                    {displayInfo?.description || 'No description available'}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      stockStatus?.isOutOfStock
                        ? 'bg-red-100 text-red-800'
                        : stockStatus?.isLowStock
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {stockStatus?.status}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      product?.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {product?.status === 'active' ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Pricing Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600 mb-1">Cost Price</p>
                  <p className="text-2xl font-bold text-blue-900">${product?.costPrice?.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-600 mb-1">Selling Price</p>
                  <p className="text-2xl font-bold text-green-900">${product?.sellingPrice?.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-600 mb-1">Profit Margin</p>
                  <p className="text-2xl font-bold text-purple-900">${profitMargin?.toFixed(2)}</p>
                  <p className="text-sm text-purple-600 mt-1">({profitPercentage}%)</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-600 mb-1">Price with Tax</p>
                  <p className="text-2xl font-bold text-orange-900">${product?.priceWithTax?.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Stock Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Box className="w-5 h-5 text-purple-600" />
                Stock Information
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Current Stock</p>
                  <p className="text-2xl font-bold text-gray-900">{product?.currentStock}</p>
                  <p className="text-xs text-gray-500 mt-1">{product?.unit}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Min Level</p>
                  <p className="text-2xl font-bold text-gray-900">{product?.minStockLevel}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Max Level</p>
                  <p className="text-2xl font-bold text-gray-900">{product?.maxStockLevel}</p>
                </div>
              </div>
              {stockStatus?.isLowStock && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <p className="text-sm text-orange-800">Stock is running low. Consider reordering.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Additional Info */}
          <div className="space-y-6">
            
            {/* Category & Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-600" />
                Product Details
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="text-base font-medium text-gray-900">{displayInfo?.category?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Brand</p>
                  <p className="text-base font-medium text-gray-900">{displayInfo?.brand?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tax Rate</p>
                  <p className="text-base font-medium text-gray-900">{product?.taxRate}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tax Included</p>
                  <p className="text-base font-medium text-gray-900">{product?.taxInclude ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>

            {/* Sales Statistics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Sales Statistics
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Sold</p>
                  <p className="text-xl font-bold text-gray-900">{product?.totalSold} units</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Sales</p>
                  <p className="text-xl font-bold text-gray-900">${product?.totalSale?.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                Important Dates
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Created At</p>
                  <p className="text-base font-medium text-gray-900">
                    {new Date(product?.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="text-base font-medium text-gray-900">
                    {new Date(product?.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                {product?.expiryDate && (
                  <div>
                    <p className="text-sm text-gray-600">Expiry Date</p>
                    <p className="text-base font-medium text-gray-900">
                      {new Date(product.expiryDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Update Stock Modal */}
      {showUpdateStockModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Update Stock</h3>
                <button
                  onClick={() => {
                    setShowUpdateStockModal(false);
                    setNewStock('');
                    setActionError(null);
                  }}
                  className="text-white hover:bg-white/20 rounded-lg p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {actionError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-red-800">{actionError}</p>
                </div>
              )}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Current Stock: <span className="font-bold text-gray-900">{product?.currentStock}</span></p>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Stock Quantity
              </label>
              <input
                type="number"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                placeholder="Enter new stock quantity"
                min="0"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setShowUpdateStockModal(false);
                  setNewStock('');
                  setActionError(null);
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStock}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Update Stock
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Product Modal */}
      {showUpdateProductModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Update Product</h3>
                <button
                  onClick={() => {
                    setShowUpdateProductModal(false);
                    setActionError(null);
                  }}
                  className="text-white hover:bg-white/20 rounded-lg p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {actionError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-red-800">{actionError}</p>
                </div>
              )}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cost Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                      <input
                        type="number"
                        value={updateForm.costPrice}
                        onChange={(e) => setUpdateForm({...updateForm, costPrice: e.target.value})}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selling Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                      <input
                        type="number"
                        value={updateForm.sellingPrice}
                        onChange={(e) => setUpdateForm({...updateForm, sellingPrice: e.target.value})}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Stock
                    </label>
                    <input
                      type="number"
                      value={updateForm.currentStock}
                      onChange={(e) => setUpdateForm({...updateForm, currentStock: e.target.value})}
                      placeholder="0"
                      min="0"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800 mb-2">
                    <Info className="w-4 h-4" />
                    <span className="text-sm font-medium">Update Note</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Leave fields empty to keep current values. Only filled fields will be updated.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setShowUpdateProductModal(false);
                  setActionError(null);
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProduct}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Update Product
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-600 to-gray-700 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Change Product Status</h3>
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setStatusAction('');
                    setActionError(null);
                  }}
                  className="text-white hover:bg-white/20 rounded-lg p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {actionError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-red-800">{actionError}</p>
                </div>
              )}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Current Status: 
                  <span className={`ml-2 font-bold ${product?.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>
                    {product?.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Action
              </label>
              <select
                value={statusAction}
                onChange={(e) => setStatusAction(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              >
                <option value="">Choose an action</option>
                <option value="activate">Activate Product</option>
                <option value="deactivate">Deactivate Product</option>
              </select>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">
                    {statusAction === 'deactivate' 
                      ? 'Deactivating will hide this product from active listings.'
                      : statusAction === 'activate'
                      ? 'Activating will make this product visible in active listings.'
                      : 'Select an action to change the product status.'}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setStatusAction('');
                  setActionError(null);
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleStatus}
                disabled={actionLoading || !statusAction}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4" />
                    Change Status
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export {ProductDetailsPage};