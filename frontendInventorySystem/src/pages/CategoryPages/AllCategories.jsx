import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FolderOpen, AlertCircle, ChevronRight, CheckCircle, XCircle, Plus } from 'lucide-react';

const AllCategories = () => {
    const navigate = useNavigate();
    const [allCategories, setAllCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState(null);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoading(true)
                const response = await axios.get(`${API_URL}/api/v1/category/getAllCategories`);
                setAllCategories(response.data.data.categories);
            } catch (error) {
                setErrors(error.response?.data?.message || "Failed to load all categories")
            } finally {
                setLoading(false)
            }
        }
        fetchCategories();
    }, [])

    // Navigate to category details
    const handleCategoryClick = (categoryId) => {
        navigate(`/categories/${categoryId}`);
    };

    // Get status badge
    const getStatusBadge = (isActive) => {
        if (isActive) {
            return { 
                label: 'Active', 
                className: 'bg-green-50 text-green-700 border-green-300',
                icon: <CheckCircle className="w-3 h-3" />
            };
        }
        return { 
            label: 'Inactive', 
            className: 'bg-red-50 text-red-700 border-red-300',
            icon: <XCircle className="w-3 h-3" />
        };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading Categories...</p>
                </div>
            </div>
        );
    }

    if (errors) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                    <div className="flex items-center gap-3 text-red-600">
                        <AlertCircle className="w-6 h-6" />
                        <div>
                            <h3 className="font-semibold">Error</h3>
                            <p className="text-sm">{errors}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-gray-50 p-6">
            {/* Page Header */}
            <div className="mb-6 flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-1">All Categories</h1>
                <p className="text-sm text-gray-600">Manage your product categories</p>
            </div>

            <button
                onClick={() => navigate('/categories/new')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
                <Plus className="w-4 h-4" />
                Add Category
            </button>
            </div>


            {/* Categories Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden">
                {/* Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-100 border-b border-gray-300">
                    <div className="col-span-1 text-sm font-semibold text-gray-700">#</div>
                    <div className="col-span-4 text-sm font-semibold text-gray-700">Category Name</div>
                    <div className="col-span-3 text-sm font-semibold text-gray-700">Parent Category</div>
                    <div className="col-span-2 text-sm font-semibold text-gray-700">Subcategories</div>
                    <div className="col-span-2 text-sm font-semibold text-gray-700">Status</div>
                </div>

                {/* Categories List */}
                {allCategories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <FolderOpen className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg">No Categories Found</p>
                        <p className="text-gray-400 text-sm">Add your first category to get started</p>
                    </div>
                ) : (
                    allCategories.map((category, index) => {
                        const statusBadge = getStatusBadge(category.isActive);
                        
                        return (
                            <div 
                                key={category._id}
                                onClick={() => handleCategoryClick(category._id)}
                                className="border-b border-gray-200 last:border-b-0 hover:bg-blue-50 transition-colors duration-150 cursor-pointer group"
                            >
                                {/* Desktop View */}
                                <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 items-center">
                                    {/* Serial Number */}
                                    <div className="col-span-1 text-gray-600 font-medium text-sm">
                                        {index + 1}
                                    </div>

                                    {/* Category Name */}
                                    <div className="col-span-4">
                                        <div className="flex items-center gap-2">
                                            <div>
                                                <h3 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                                                    {category.name}
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-0.5">Slug: {category.slug}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100" />
                                        </div>
                                    </div>

                                    {/* Parent Category */}
                                    <div className="col-span-3">
                                        <span className="text-sm text-gray-700">
                                            {category.parentCategory?.name || "—"}
                                        </span>
                                    </div>

                                    {/* Subcategories Count */}
                                    <div className="col-span-2">
                                        <p className="text-sm font-medium text-gray-900">
                                            {category.subcategories?.length || 0}
                                        </p>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-2">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadge.className}`}>
                                            {statusBadge.icon}
                                            {statusBadge.label}
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
                                                    {category.name}
                                                </h3>
                                            </div>
                                            <p className="text-xs text-gray-500">Slug: {category.slug}</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 mt-1" />
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {category.parentCategory && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-gray-100 text-gray-700 border border-gray-300">
                                                Parent: {category.parentCategory.name}
                                            </span>
                                        )}
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700 border border-blue-300">
                                            {category.subcategories?.length || 0} Subcategories
                                        </span>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${statusBadge.className}`}>
                                            {statusBadge.icon}
                                            {statusBadge.label}
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
}

export { AllCategories }