import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Loader2,
  Image,
  AlertCircle,
  CheckCircle2,
  Info,
  Percent,
  Tag,
  FileText,
  Layers,
  Search,
  X
} from 'lucide-react';

const AddNewCategory = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentCategory: '',
    isActive: true,
    image: '',
    taxRate: '0'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [allCategories, setAllCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showParentSearch, setShowParentSearch] = useState(false);
  const [parentSearchQuery, setParentSearchQuery] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchAllCategories();
  }, []);

  useEffect(() => {
    if (formData.image) {
      setImagePreview(formData.image);
    } else {
      setImagePreview('');
    }
  }, [formData.image]);

  const fetchAllCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await fetch(
        `${API_URL}/api/v1/category/getAllCategories?limit=1000`
      );
      const data = await response.json();
      if (data.success) {
        setAllCategories(data.data.categories.filter(cat => cat.isActive));
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Category name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Category name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Category name cannot exceed 100 characters';
    }

    if (formData.description && formData.description.trim().length > 500) {
      errors.description = 'Description cannot exceed 500 characters';
    }

    const taxRate = Number(formData.taxRate);
    if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
      errors.taxRate = 'Tax rate must be between 0 and 100';
    }

    if (formData.image && formData.image.trim()) {
      try {
        new URL(formData.image.trim());
      } catch {
        errors.image = 'Please enter a valid URL';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateForm()) {
      setError('Please fix the validation errors before submitting');
      return;
    }

    submitForm();
  };

  const submitForm = async () => {
    try {
      setLoading(true);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        parentCategory: formData.parentCategory || undefined,
        isActive: formData.isActive,
        image: formData.image.trim() || undefined,
        taxRate: Number(formData.taxRate)
      };

      const response = await fetch(
        `${API_URL}/api/v1/category/addNewCategory`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate(`/categories/${data.data.category._id}`);
        }, 1500);
      } else {
        setError(data.message || 'Failed to create category');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while creating the category');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      parentCategory: '',
      isActive: true,
      image: '',
      taxRate: '0'
    });
    setValidationErrors({});
    setError(null);
    setSuccess(false);
    setImagePreview('');
  };

  const filteredCategories = allCategories.filter(cat =>
    cat.name.toLowerCase().includes(parentSearchQuery.toLowerCase())
  );

  const selectedParent = allCategories.find(cat => cat._id === formData.parentCategory);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/categories')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Add New Category</h1>
                <p className="text-sm text-gray-500">Create a new product category</p>
              </div>
            </div>
            <button
              onClick={resetForm}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {success && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-900">Category Created Successfully!</h3>
              <p className="text-sm text-green-700">Redirecting to category details...</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error Creating Category</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <Tag className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-800">Basic Information</h2>
              </div>

              <div className="space-y-5">
                <FormField
                  label="Category Name"
                  required
                  error={validationErrors.name}
                >
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Electronics, Clothing, Home & Garden"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      validationErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.name.trim().length}/100 characters
                  </p>
                </FormField>

                <FormField
                  label="Description"
                  error={validationErrors.description}
                >
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Brief description of this category (optional)"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors ${
                      validationErrors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description.trim().length}/500 characters
                  </p>
                </FormField>
              </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <Layers className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-800">Category Hierarchy</h2>
              </div>

              <FormField
                label="Parent Category"
                helper="Select a parent category to create a subcategory (optional)"
              >
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowParentSearch(!showParentSearch)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-left bg-white hover:bg-gray-50 transition-colors flex items-center justify-between"
                    disabled={loading || loadingCategories}
                  >
                    <span className={selectedParent ? 'text-gray-900' : 'text-gray-500'}>
                      {selectedParent ? selectedParent.name : 'None (Root Category)'}
                    </span>
                    <Search className="w-4 h-4 text-gray-400" />
                  </button>

                  {showParentSearch && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
                      <div className="p-2 border-b">
                        <input
                          type="text"
                          value={parentSearchQuery}
                          onChange={(e) => setParentSearchQuery(e.target.value)}
                          placeholder="Search categories..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, parentCategory: '' }));
                            setShowParentSearch(false);
                            setParentSearchQuery('');
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors text-sm text-gray-700 border-b"
                        >
                          None (Root Category)
                        </button>
                        {filteredCategories.length === 0 ? (
                          <div className="px-4 py-8 text-center text-gray-500 text-sm">
                            No categories found
                          </div>
                        ) : (
                          filteredCategories.map(cat => (
                            <button
                              key={cat._id}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, parentCategory: cat._id }));
                                setShowParentSearch(false);
                                setParentSearchQuery('');
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0"
                            >
                              <div className="text-sm font-medium text-gray-900">{cat.name}</div>
                              <div className="text-xs text-gray-500">Slug: {cat.slug}</div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </FormField>
            </div>

            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <Image className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-800">Category Image</h2>
              </div>

              <FormField
                label="Image URL"
                error={validationErrors.image}
                helper="Enter a URL to an image for this category"
              >
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="https://example.com/category-image.jpg"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    validationErrors.image ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
              </FormField>

              {imagePreview && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-40 h-40 object-cover rounded-lg border-2 border-gray-200"
                      onError={() => {
                        setValidationErrors(prev => ({
                          ...prev,
                          image: 'Failed to load image. Please check the URL.'
                        }));
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      aria-label="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <FileText className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-semibold text-gray-800">Settings</h2>
              </div>

              <div className="space-y-5">
                <FormField
                  label="Tax Rate (%)"
                  required
                  error={validationErrors.taxRate}
                  helper="Tax rate for products in this category"
                >
                  <div className="relative">
                    <input
                      type="number"
                      name="taxRate"
                      value={formData.taxRate}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="0"
                      className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        validationErrors.taxRate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      disabled={loading}
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </FormField>

                <div className="pt-3 border-t">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="sr-only peer"
                        disabled={loading}
                      />
                      <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">Active Status</span>
                      <p className="text-xs text-gray-500">
                        {formData.isActive ? 'Category is active' : 'Category is inactive'}
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-2">Category Tips</p>
                  <ul className="space-y-1.5 text-blue-800">
                    <li>• Use clear, descriptive names</li>
                    <li>• Slug is auto-generated from name</li>
                    <li>• Tax rate applies to all products</li>
                    <li>• Inactive categories hide products</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm p-6">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Create Category
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FormField = ({ label, required, error, helper, children }) => {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
      {helper && !error && (
        <p className="mt-1.5 text-xs text-gray-500">{helper}</p>
      )}
    </div>
  );
};

export { AddNewCategory };