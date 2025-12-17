import React, { useState, useEffect } from 'react';
import { 
  Users, 
  AlertCircle, 
  ChevronRight, 
  CheckCircle, 
  XCircle, 
  Plus,
  Building2,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  Filter,
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';


const AllSuppliers = () => {
  const navigate = useNavigate();

  const [allSuppliers, setAllSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [filters, setFilters] = useState({
    isActive: '',
    businessType: '',
    search: ''
  });

  useEffect(() => {
    fetchSuppliers();
  }, [filters.isActive, filters.businessType]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/api/v1/supplier/getAllSuppliers?limit=100`;
      
      if (filters.isActive !== '') {
        url += `&isActive=${filters.isActive}`;
      }
      if (filters.businessType) {
        url += `&businessType=${filters.businessType}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setAllSuppliers(data.data.suppliers);
      } else {
        setError(data.message || "Failed to load suppliers");
      }
    } catch (err) {
      setError(err.message || "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

const handleNavigation = (supplierId) => {
  navigate(`/suppliers/${supplierId}`);
};

const handleAddNew = () => {
  navigate('/suppliers/new');
};

  const getStatusConfig = (status) => {
    const configs = {
      'Reliable': {
        label: 'Reliable',
        className: 'bg-green-50 text-green-700 border-green-300',
        icon: <CheckCircle className="w-3 h-3" />
      },
      'Under Review': {
        label: 'Under Review',
        className: 'bg-yellow-50 text-yellow-700 border-yellow-300',
        icon: <AlertCircle className="w-3 h-3" />
      },
      'Inactive': {
        label: 'Inactive',
        className: 'bg-red-50 text-red-700 border-red-300',
        icon: <XCircle className="w-3 h-3" />
      }
    };
    return configs[status] || configs['Under Review'];
  };

  const getBusinessTypeColor = (type) => {
    const colors = {
      'Manufacturer': 'bg-purple-100 text-purple-700 border-purple-300',
      'Distributor': 'bg-blue-100 text-blue-700 border-blue-300',
      'Wholesaler': 'bg-indigo-100 text-indigo-700 border-indigo-300',
      'Retailer': 'bg-pink-100 text-pink-700 border-pink-300',
      'Service Provider': 'bg-teal-100 text-teal-700 border-teal-300',
      'Other': 'bg-gray-100 text-gray-700 border-gray-300'
    };
    return colors[type] || colors['Other'];
  };

  const filteredSuppliers = allSuppliers.filter(supplier => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    return (
      supplier.name?.toLowerCase().includes(searchLower) ||
      supplier.companyName?.toLowerCase().includes(searchLower) ||
      supplier.email?.toLowerCase().includes(searchLower) ||
      supplier.phone?.includes(filters.search)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Suppliers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">Error</h3>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">All Suppliers</h1>
          <p className="text-sm text-gray-600">Manage your supplier network</p>
        </div>
        <button
          onClick={handleAddNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 justify-center"
        >
          <Plus className="w-4 h-4" />
          Add Supplier
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="font-semibold text-gray-800">Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.isActive}
            onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          {/* Business Type Filter */}
          <select
            value={filters.businessType}
            onChange={(e) => setFilters(prev => ({ ...prev, businessType: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Business Types</option>
            <option value="Manufacturer">Manufacturer</option>
            <option value="Distributor">Distributor</option>
            <option value="Wholesaler">Wholesaler</option>
            <option value="Retailer">Retailer</option>
            <option value="Service Provider">Service Provider</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {(filters.search || filters.isActive || filters.businessType) && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {filteredSuppliers.length} supplier{filteredSuppliers.length !== 1 ? 's' : ''} found
            </span>
            <button
              onClick={() => setFilters({ isActive: '', businessType: '', search: '' })}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-100 border-b border-gray-300">
          <div className="col-span-1 text-sm font-semibold text-gray-700">#</div>
          <div className="col-span-3 text-sm font-semibold text-gray-700">Supplier Info</div>
          <div className="col-span-2 text-sm font-semibold text-gray-700">Contact</div>
          <div className="col-span-2 text-sm font-semibold text-gray-700">Business Type</div>
          <div className="col-span-2 text-sm font-semibold text-gray-700">Performance</div>
          <div className="col-span-2 text-sm font-semibold text-gray-700">Status</div>
        </div>

        {/* Suppliers List */}
        {filteredSuppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No Suppliers Found</p>
            <p className="text-gray-400 text-sm">Add your first supplier to get started</p>
          </div>
        ) : (
          filteredSuppliers.map((supplier, index) => {
            const statusConfig = getStatusConfig(supplier.status);
            
            return (
              <div
                key={supplier._id}
                onClick={() => handleNavigation(supplier._id)}
                className="border-b border-gray-200 last:border-b-0 hover:bg-blue-50 transition-colors duration-150 cursor-pointer group"
              >
                {/* Desktop View */}
                <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 items-center">
                  {/* Serial Number */}
                  <div className="col-span-1 text-gray-600 font-medium text-sm">
                    {index + 1}
                  </div>

                  {/* Supplier Info */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                          {supplier.name}
                        </h3>
                        {supplier.companyName && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3" />
                            {supplier.companyName}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100" />
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="col-span-2">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-700 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {supplier.phone}
                      </p>
                      {supplier.email && (
                        <p className="text-xs text-gray-700 flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3" />
                          {supplier.email}
                        </p>
                      )}
                      {supplier.address?.city && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {supplier.address.city}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Business Type */}
                  <div className="col-span-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getBusinessTypeColor(supplier.businessType)}`}>
                      {supplier.businessType}
                    </span>
                  </div>

                  {/* Performance */}
                  <div className="col-span-2">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-700 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {supplier.performance?.totalOrders || 0} orders
                      </p>
                      {supplier.performance?.totalPurchaseValue > 0 && (
                        <p className="text-xs text-gray-500">
                          ${supplier.performance.totalPurchaseValue.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig.className}`}>
                      {statusConfig.icon}
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                {/* Mobile View */}
                <div className="lg:hidden px-4 py-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                        <h3 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                          {supplier.name}
                        </h3>
                      </div>
                      {supplier.companyName && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {supplier.companyName}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 mt-1" />
                  </div>
                  
                  <div className="space-y-1.5 mb-2">
                    <p className="text-xs text-gray-700 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {supplier.phone}
                    </p>
                    {supplier.email && (
                      <p className="text-xs text-gray-700 flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3" />
                        {supplier.email}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getBusinessTypeColor(supplier.businessType)}`}>
                      {supplier.businessType}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700 border border-blue-300">
                      {supplier.performance?.totalOrders || 0} orders
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${statusConfig.className}`}>
                      {statusConfig.icon}
                      {statusConfig.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export { AllSuppliers };