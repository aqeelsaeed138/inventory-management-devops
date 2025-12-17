import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Tag,
  Loader2,
  Edit,
  Power,
  X,
  Save,
  RefreshCw,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Info,
  Percent,
  Layers,
  Calendar,
  AlertTriangle
} from 'lucide-react';

const CategoryDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const [updateForm, setUpdateForm] = useState({
    name: '',
    description: '',
    parentCategory: '',
    image: ''
  });
  const [newTaxRate, setNewTaxRate] = useState('');

  useEffect(() => {
    if (id) fetchCategoryDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchCategoryDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `${API_URL}/api/v1/category/getCategoryById/${id}`
      );
      const response = await res.json();
      if (response.success) setCategory(response.data.category);
      else setError(response.message || 'Failed to load category details');
    } catch (err) {
      setError(err.message || 'Failed to load category details');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- UPDATE CATEGORY ----------------
  const handleUpdateCategory = async () => {
    setActionError(null);
    const updates = {};
    if (updateForm.name?.trim()) updates.name = updateForm.name.trim();
    if (updateForm.description !== undefined)
      updates.description = updateForm.description.trim() || null;
    if (updateForm.parentCategory !== undefined)
      updates.parentCategory = updateForm.parentCategory || null;
    if (updateForm.image !== undefined)
      updates.image = updateForm.image.trim() || null;

    if (Object.keys(updates).length === 0) {
      setActionError('Please provide at least one field to update.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch(
        `${API_URL}/api/v1/category/updateCategory/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        }
      );
      const response = await res.json();

      if (response.success) {
        setActionSuccess('Category updated successfully!');
        setShowUpdateModal(false);
        // refresh after a short delay so user sees the success message
        setTimeout(() => {
          fetchCategoryDetails();
          setActionSuccess(null);
        }, 1500);
      } else {
        setActionError(response.message || 'Failed to update category');
      }
    } catch (err) {
      setActionError(err.message || 'Failed to update category');
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------- TAX UPDATE ----------------
  const handleUpdateTaxRate = async () => {
    setActionError(null);
    if (
      newTaxRate === '' ||
      newTaxRate === null ||
      isNaN(newTaxRate) ||
      Number(newTaxRate) < 0 ||
      Number(newTaxRate) > 100
    ) {
      setActionError('Enter a valid tax rate between 0 and 100.');
      return;
    }
    try {
      setActionLoading(true);
      const res = await fetch(
        `${API_URL}/api/v1/category/updateCategoryTaxRateAndProducts/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taxRate: Number(newTaxRate) })
        }
      );
      const response = await res.json();
      if (response.success) {
        setActionSuccess(
          `Tax updated! ${response.data.updatedProducts || 0} products affected.`
        );
        setShowTaxModal(false);
        setNewTaxRate('');
        setTimeout(() => {
          fetchCategoryDetails();
          setActionSuccess(null);
        }, 2000);
      } else {
        setActionError(response.message || 'Failed to update tax rate');
      }
    } catch (err) {
      setActionError(err.message || 'Failed to update tax rate');
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------- DEACTIVATE ----------------
  const handleDeactivateCategory = async () => {
    setActionError(null);
    try {
      setActionLoading(true);
      const res = await fetch(
        `${API_URL}/api/v1/category/deactivateCategoryAndProducts/${id}`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json' } }
      );
      const response = await res.json();
      if (response.success) {
        setActionSuccess(
          `Category deactivated! ${response.data.affectedProducts || 0} products affected.`
        );
        setShowDeactivateModal(false);
        setTimeout(() => {
          fetchCategoryDetails();
          setActionSuccess(null);
        }, 2000);
      } else {
        setActionError(response.message || 'Failed to deactivate category');
      }
    } catch (err) {
      setActionError(err.message || 'Failed to deactivate category');
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------- ACTIVATE ----------------
  const handleActivateCategory = async () => {
    setActionError(null);
    try {
      setActionLoading(true);
      const res = await fetch(
        `${API_URL}/api/v1/category/activateCategoryAndProducts/${id}`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json' } }
      );
      const response = await res.json();
      if (response.success) {
        setActionSuccess('Category activated successfully!');
        setShowActivateModal(false);
        setTimeout(() => {
          fetchCategoryDetails();
          setActionSuccess(null);
        }, 1500);
      } else {
        setActionError(response.message || 'Failed to activate category');
      }
    } catch (err) {
      setActionError(err.message || 'Failed to activate category');
    } finally {
      setActionLoading(false);
    }
  };

  const openUpdateModal = () => {
    setActionError(null);
    setUpdateForm({
      name: category?.name || '',
      description: category?.description || '',
      parentCategory: category?.parentCategory?._id || '',
      image: category?.image || ''
    });
    setShowUpdateModal(true);
  };
  const openTaxModal = () => {
    setActionError(null);
    setNewTaxRate(category?.taxRate?.toString() || '0');
    setShowTaxModal(true);
  };

  // ---------------- UI ----------------
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
        <h2 className="text-lg font-semibold mb-2">Error Loading Category</h2>
        <p className="text-gray-600 mb-4 text-center">{error}</p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/categories')}
            className="px-4 py-2 border rounded-lg"
          >
            Back
          </button>
          <button
            onClick={fetchCategoryDetails}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/categories')}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold">{category?.name}</h1>
              <p className="text-sm text-gray-500">Slug: {category?.slug}</p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={openTaxModal}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Percent className="w-4 h-4" />
              Update Tax
            </button>
            <button
              onClick={openUpdateModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" /> Edit
            </button>
            <button
              onClick={() =>
                category?.isActive
                  ? setShowDeactivateModal(true)
                  : setShowActivateModal(true)
              }
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                category?.isActive
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              <Power className="w-4 h-4" />
              {category?.isActive ? 'Active' : 'Inactive'}
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

      {/* Category Info */}
      <div className="max-w-7xl mx-auto px-4 mt-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <div className="flex gap-6">
              {category?.image ? (
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-32 h-32 object-cover rounded-lg border"
                />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center bg-gray-100 rounded-lg border">
                  <ImageIcon className="w-10 h-10 text-gray-400" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold">{category.name}</h2>
                <p className="text-gray-600">
                  {category.description || 'No description available.'}
                </p>
                <div className="mt-3 flex gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      category.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                    Tax: {category.taxRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Hierarchy */}
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-blue-600" /> Category Hierarchy
            </h3>
            <p>
              <strong>Parent:</strong>{' '}
              {category?.parentCategory?.name || 'None (Root)'}
            </p>
            <p className="mt-2">
              <strong>Subcategories:</strong>{' '}
              {category?.subcategories?.length || 0}
            </p>

            {category?.subcategories?.length > 0 && (
              <div className="mt-4 space-y-2">
                {category.subcategories.map((s) => (
                  <div
                    key={s._id}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded border"
                  >
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-gray-500">ID: {s._id}</div>
                    </div>
                    <div
                      className={`px-2 py-0.5 rounded text-xs ${
                        s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {s.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <Tag className="w-5 h-5 text-blue-600" /> Details
            </h3>
            <p className="text-sm text-gray-600 mb-1">ID:</p>
            <p className="text-xs break-all bg-gray-50 p-2 rounded">{category._id}</p>
            <p className="text-sm text-gray-600 mt-3">
              Created: {new Date(category.createdAt).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">
              Updated: {new Date(category.updatedAt).toLocaleString()}
            </p>
          </div>
          {!category.isActive && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Category Inactive</h3>
                  <p className="text-sm text-red-700">
                    This category is currently inactive. All products under this category are also inactive and won't be visible in the store.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------------- MODALS ---------------- */}
      {/* Update Modal */}
      {showUpdateModal && (
        <Modal
          title="Update Category"
          onClose={() => {
            setShowUpdateModal(false);
            setActionError(null);
          }}
          onConfirm={handleUpdateCategory}
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
              label="Name"
              value={updateForm.name}
              onChange={(e) => setUpdateForm({ ...updateForm, name: e.target.value })}
              placeholder="Category name"
            />
            <Input
              label="Description"
              textarea
              value={updateForm.description}
              onChange={(e) => setUpdateForm({ ...updateForm, description: e.target.value })}
              placeholder="Short description (optional)"
            />
            <Input
              label="Parent Category ID"
              value={updateForm.parentCategory}
              onChange={(e) => setUpdateForm({ ...updateForm, parentCategory: e.target.value })}
              placeholder="Parent category ID or leave empty"
            />
            <Input
              label="Image URL"
              value={updateForm.image}
              onChange={(e) => setUpdateForm({ ...updateForm, image: e.target.value })}
              placeholder="https://example.com/image.png"
            />
            <div className="p-3 bg-blue-50 rounded border border-blue-100 text-sm text-blue-700">
              <Info className="inline-block w-4 h-4 mr-2" />
              Leave fields empty to keep current values. Only filled fields will be updated.
            </div>
          </div>
        </Modal>
      )}

      {/* Tax Modal */}
      {showTaxModal && (
        <Modal
          title="Update Tax Rate"
          onClose={() => {
            setShowTaxModal(false);
            setActionError(null);
            setNewTaxRate('');
          }}
          onConfirm={handleUpdateTaxRate}
          confirmText="Update Tax"
          loading={actionLoading}
        >
          <div className="space-y-4">
            {actionError && (
              <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {actionError}
              </div>
            )}

            <Input
              label="New Tax Rate (%)"
              type="number"
              value={newTaxRate}
              onChange={(e) => setNewTaxRate(e.target.value)}
              placeholder="e.g., 23"
            />

            <div className="mt-3 bg-yellow-50 text-yellow-800 border border-yellow-200 p-3 rounded-lg text-sm flex gap-2">
              <Info className="w-4 h-4 flex-shrink-0" />
              Updating the tax rate will affect <strong>all products</strong> under this category.
            </div>
          </div>
        </Modal>
      )}

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <Modal
          title="Deactivate Category"
          onClose={() => {
            setShowDeactivateModal(false);
            setActionError(null);
          }}
          onConfirm={handleDeactivateCategory}
          confirmText="Yes, Deactivate"
          danger
          loading={actionLoading}
        >
          <div className="flex gap-2 text-sm text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            This will deactivate the category and <strong>all products</strong> under it.
          </div>
        </Modal>
      )}

      {/* Activate Modal */}
      {showActivateModal && (
        <Modal
          title="Activate Category"
          onClose={() => {
            setShowActivateModal(false);
            setActionError(null);
          }}
          onConfirm={handleActivateCategory}
          confirmText="Activate"
          loading={actionLoading}
        >
          <p className="text-sm text-gray-700">
            Activating will make this category and its products visible again.
          </p>
        </Modal>
      )}
    </div>
  );
};

// ---------- Reusable UI Components ----------
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
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded hover:bg-gray-100"
          >
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

const Input = ({
  label,
  value,
  onChange,
  textarea = false,
  type = 'text',
  placeholder = ''
}) => {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
      {textarea ? (
        <textarea
          value={value}
          onChange={onChange}
          rows={4}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      )}
    </div>
  );
};

export {CategoryDetailsPage};
