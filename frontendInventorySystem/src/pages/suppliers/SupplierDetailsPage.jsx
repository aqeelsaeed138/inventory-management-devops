import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Loader2,
  Edit,
  Power,
  X,
  Save,
  AlertCircle,
  CheckCircle2,
  Info,
  Building2,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  TrendingUp,
  Package,
  DollarSign,
  Clock,
  Calendar,
  Trash2,
  AlertTriangle
} from 'lucide-react';

const SupplierDetailsPage = () => {
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const [updateForm, setUpdateForm] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    city: '',
    businessType: ''
  });

  // Get supplier ID from URL
  const supplierId = window.location.pathname.split('/').pop();

  useEffect(() => {
    if (supplierId && supplierId !== 'new') {
      fetchSupplierDetails();
    }
  }, [supplierId]);

  const fetchSupplierDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `${API_URL}/api/v1/supplier/getSupplierById/${supplierId}`
      );
      const response = await res.json();
      if (response.success) {
        setSupplier(response.data.supplier);
      } else {
        setError(response.message || 'Failed to load supplier details');
      }
    } catch (err) {
      setError(err.message || 'Failed to load supplier details');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSupplier = async () => {
    setActionError(null);
    const updates = {};
    
    if (updateForm.name?.trim()) updates.name = updateForm.name.trim();
    if (updateForm.companyName !== undefined)
      updates.companyName = updateForm.companyName.trim() || null;
    if (updateForm.email !== undefined)
      updates.email = updateForm.email.trim() || null;
    if (updateForm.phone?.trim()) updates.phone = updateForm.phone.trim();
    if (updateForm.city !== undefined)
      updates.city = updateForm.city.trim() || null;
    if (updateForm.businessType) updates.businessType = updateForm.businessType;

    if (Object.keys(updates).length === 0) {
      setActionError('Please provide at least one field to update.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch(
        `${API_URL}/api/v1/supplier/updateSupplier/${supplierId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        }
      );
      const response = await res.json();

      if (response.success) {
        setActionSuccess('Supplier updated successfully!');
        setShowUpdateModal(false);
        setTimeout(() => {
          fetchSupplierDetails();
          setActionSuccess(null);
        }, 1500);
      } else {
        setActionError(response.message || 'Failed to update supplier');
      }
    } catch (err) {
      setActionError(err.message || 'Failed to update supplier');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    setActionError(null);
    try {
      setActionLoading(true);
      const res = await fetch(
        `${API_URL}/api/v1/supplier/toggleSupplierStatus/${supplierId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      const response = await res.json();
      if (response.success) {
        setActionSuccess(
          `Supplier ${response.data.supplier.isActive ? 'activated' : 'deactivated'} successfully!`
        );
        setTimeout(() => {
          fetchSupplierDetails();
          setActionSuccess(null);
        }, 1500);
      } else {
        setActionError(response.message || 'Failed to toggle status');
      }
    } catch (err) {
      setActionError(err.message || 'Failed to toggle status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSupplier = async () => {
    setActionError(null);
    try {
      setActionLoading(true);
      const res = await fetch(
        `${API_URL}/api/v1/supplier/deleteSupplier/${supplierId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      const response = await res.json();
      if (response.success) {
        setActionSuccess('Supplier deleted successfully!');
        setTimeout(() => {
          window.location.href = '/suppliers';
        }, 1500);
      } else {
        setActionError(response.message || 'Failed to delete supplier');
      }
    } catch (err) {
      setActionError(err.message || 'Failed to delete supplier');
    } finally {
      setActionLoading(false);
    }
  };

  const openUpdateModal = () => {
    setActionError(null);
    setUpdateForm({
      name: supplier?.name || '',
      companyName: supplier?.companyName || '',
      email: supplier?.email || '',
      phone: supplier?.phone || '',
      city: supplier?.address?.city || '',
      businessType: supplier?.businessType || 'Other'
    });
    setShowUpdateModal(true);
  };

  const handleBack = () => {
    window.location.href = '/suppliers';
  };

  const getStatusConfig = (isActive) => {
    if (isActive) {
      return {
        label: 'Active',
        className: 'bg-green-600 hover:bg-green-700',
        textClass: 'text-green-700'
      };
    }
    return {
      label: 'Inactive',
      className: 'bg-gray-600 hover:bg-gray-700',
      textClass: 'text-gray-700'
    };
  };

  const businessTypes = [
    'Manufacturer',
    'Distributor',
    'Wholesaler',
    'Retailer',
    'Service Provider',
    'Other'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
        <h2 className="text-lg font-semibold mb-2">Error Loading Supplier</h2>
        <p className="text-gray-600 mb-4 text-center">{error}</p>
        <div className="flex gap-3">
          <button
            onClick={handleBack}
            className="px-4 py-2 border rounded-lg"
          >
            Back
          </button>
          <button
            onClick={fetchSupplierDetails}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(supplier?.isActive);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold">{supplier?.name}</h1>
              {supplier?.companyName && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {supplier.companyName}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={openUpdateModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" /> Edit
            </button>
            <button
              onClick={handleToggleStatus}
              disabled={actionLoading}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 text-white ${statusConfig.className} disabled:opacity-50`}
            >
              <Power className="w-4 h-4" />
              {statusConfig.label}
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Success */}
      {actionSuccess && (
        <div className="max-w-7xl mx-auto mt-6 px-4">
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex gap-3 items-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-green-700 font-medium">{actionSuccess}</p>
          </div>
        </div>
      )}

      {/* Action Error */}
      {actionError && (
        <div className="max-w-7xl mx-auto mt-6 px-4">
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex gap-3 items-center">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700 font-medium">{actionError}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 mt-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-600" />
              Contact Information
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="font-medium">{supplier.phone}</p>
                </div>
              </div>
              {supplier.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium">{supplier.email}</p>
                  </div>
                </div>
              )}
              {supplier.address?.city && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="font-medium">
                      {supplier.address.city}, {supplier.address.country || 'Pakistan'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Business Details */}
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-600" />
              Business Details
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Business Type</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700 border border-purple-300">
                  {supplier.businessType}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  supplier.isActive
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-red-100 text-red-700 border border-red-300'
                }`}>
                  {supplier.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Performance Metrics
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <p className="text-xs text-blue-600 font-medium">Total Orders</p>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  {supplier.performance?.totalOrders || 0}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <p className="text-xs text-green-600 font-medium">Completed</p>
                </div>
                <p className="text-2xl font-bold text-green-900">
                  {supplier.performance?.completedOrders || 0}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-purple-600" />
                  <p className="text-xs text-purple-600 font-medium">Total Value</p>
                </div>
                <p className="text-2xl font-bold text-purple-900">
                  ${(supplier.performance?.totalPurchaseValue || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <p className="text-xs text-orange-600 font-medium">Avg Delivery</p>
                </div>
                <p className="text-2xl font-bold text-orange-900">
                  {supplier.performance?.avgDeliveryDays?.toFixed(1) || 0} days
                </p>
              </div>
            </div>
            {supplier.performance?.lastOrderDate && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Last Order: {new Date(supplier.performance.lastOrderDate).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-blue-600" />
              Details
            </h3>
            <p className="text-sm text-gray-600 mb-1">ID:</p>
            <p className="text-xs break-all bg-gray-50 p-2 rounded">{supplier._id}</p>
            <p className="text-sm text-gray-600 mt-3">
              Created: {new Date(supplier.createdAt).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">
              Updated: {new Date(supplier.updatedAt).toLocaleString()}
            </p>
          </div>

          {!supplier.isActive && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Supplier Inactive</h3>
                  <p className="text-sm text-red-700">
                    This supplier is currently inactive and won't appear in active supplier lists.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Update Modal */}
      {showUpdateModal && (
        <Modal
          title="Update Supplier"
          onClose={() => {
            setShowUpdateModal(false);
            setActionError(null);
          }}
          onConfirm={handleUpdateSupplier}
          confirmText="Save Changes"
          loading={actionLoading}
        >
          <div className="space-y-4">
            {actionError && (
              <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {actionError}
              </div>
            )}

            <Input
              label="Supplier Name"
              value={updateForm.name}
              onChange={(e) => setUpdateForm({ ...updateForm, name: e.target.value })}
              placeholder="Supplier name"
            />
            <Input
              label="Company Name"
              value={updateForm.companyName}
              onChange={(e) => setUpdateForm({ ...updateForm, companyName: e.target.value })}
              placeholder="Company name (optional)"
            />
            <Input
              label="Email"
              type="email"
              value={updateForm.email}
              onChange={(e) => setUpdateForm({ ...updateForm, email: e.target.value })}
              placeholder="email@example.com (optional)"
            />
            <Input
              label="Phone"
              value={updateForm.phone}
              onChange={(e) => setUpdateForm({ ...updateForm, phone: e.target.value })}
              placeholder="Phone number"
            />
            <Input
              label="City"
              value={updateForm.city}
              onChange={(e) => setUpdateForm({ ...updateForm, city: e.target.value })}
              placeholder="City (optional)"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
              <select
                value={updateForm.businessType}
                onChange={(e) => setUpdateForm({ ...updateForm, businessType: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {businessTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <Modal
          title="Delete Supplier"
          onClose={() => {
            setShowDeleteModal(false);
            setActionError(null);
          }}
          onConfirm={handleDeleteSupplier}
          confirmText="Yes, Delete"
          danger
          loading={actionLoading}
        >
          <div className="flex gap-2 text-sm text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            This will permanently delete the supplier. This action cannot be undone.
          </div>
        </Modal>
      )}
    </div>
  );
};

const Modal = ({
  title,
  children,
  onClose,
  onConfirm,
  confirmText = 'Confirm',
  danger = false,
  loading = false
}) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="px-5 py-3 border-b flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="p-5 max-h-[70vh] overflow-y-auto">{children}</div>
        <div className="px-5 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-white ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            } disabled:opacity-50`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const Input = ({ label, value, onChange, type = 'text', placeholder = '' }) => {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
};

export { SupplierDetailsPage };