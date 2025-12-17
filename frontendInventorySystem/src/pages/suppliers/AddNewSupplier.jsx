import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Briefcase
} from 'lucide-react';

const AddNewSupplier = () => {
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    city: '',
    businessType: 'Other'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const businessTypes = [
    'Manufacturer',
    'Distributor',
    'Wholesaler',
    'Retailer',
    'Service Provider',
    'Other'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
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

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Supplier name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Supplier name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Supplier name cannot exceed 100 characters';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[\+]?[0-9\s\-\(\)]{10,15}$/.test(formData.phone.trim())) {
      errors.phone = 'Please enter a valid phone number (10-15 digits)';
    }

    // Email validation (optional but must be valid if provided)
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = 'Please enter a valid email address';
      }
    }

    // Company name validation (optional)
    if (formData.companyName && formData.companyName.trim().length > 150) {
      errors.companyName = 'Company name cannot exceed 150 characters';
    }

    // City validation (optional)
    if (formData.city && formData.city.trim().length > 50) {
      errors.city = 'City name cannot exceed 50 characters';
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
        companyName: formData.companyName.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim(),
        city: formData.city.trim() || undefined,
        businessType: formData.businessType
      };

      const response = await fetch(
        `${API_URL}/api/v1/supplier/addNewSupplier`,
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
          window.location.href = `/suppliers/${data.data.supplier._id}`;
        }, 1500);
      } else {
        setError(data.message || 'Failed to create supplier');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while creating the supplier');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      companyName: '',
      email: '',
      phone: '',
      city: '',
      businessType: 'Other'
    });
    setValidationErrors({});
    setError(null);
    setSuccess(false);
  };

const handleBack = () => {
  navigate('/suppliers');
};

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Add New Supplier</h1>
                <p className="text-sm text-gray-500">Create a new supplier profile</p>
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

      {/* Success Message */}
      {success && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-900">Supplier Created Successfully!</h3>
              <p className="text-sm text-green-700">Redirecting to supplier details...</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error Creating Supplier</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6">
        <div className="bg-white rounded-xl border shadow-sm p-6">
          {/* Basic Information Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-5 pb-3 border-b">
              <User className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">Basic Information</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {/* Supplier Name */}
              <FormField
                label="Supplier Name"
                required
                error={validationErrors.name}
              >
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., ABC Suppliers"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    validationErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.name.trim().length}/100 characters
                </p>
              </FormField>

              {/* Company Name */}
              <FormField
                label="Company Name"
                error={validationErrors.companyName}
                helper="Optional"
              >
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="e.g., ABC Trading Company Ltd."
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    validationErrors.companyName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.companyName.trim().length}/150 characters
                </p>
              </FormField>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-5 pb-3 border-b">
              <Phone className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-800">Contact Information</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {/* Phone */}
              <FormField
                label="Phone Number"
                required
                error={validationErrors.phone}
              >
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="e.g., +92 300 1234567"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    validationErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
              </FormField>

              {/* Email */}
              <FormField
                label="Email Address"
                error={validationErrors.email}
                helper="Optional"
              >
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="e.g., contact@supplier.com"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
              </FormField>
            </div>
          </div>

          {/* Business Details Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-5 pb-3 border-b">
              <Briefcase className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-800">Business Details</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {/* Business Type */}
              <FormField
                label="Business Type"
                required
              >
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  {businessTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </FormField>

              {/* City */}
              <FormField
                label="City"
                error={validationErrors.city}
                helper="Optional"
              >
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="e.g., Lahore"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    validationErrors.city ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
              </FormField>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-2">Supplier Profile Tips</p>
                <ul className="space-y-1.5 text-blue-800">
                  <li>• All suppliers are active by default</li>
                  <li>• Country is set to Pakistan automatically</li>
                  <li>• Phone number is required for communication</li>
                  <li>• Performance metrics are tracked automatically</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleBack}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Create Supplier
                </>
              )}
            </button>
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

export { AddNewSupplier };