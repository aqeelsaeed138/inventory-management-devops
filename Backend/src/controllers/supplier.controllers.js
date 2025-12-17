import { Supplier } from "../models/supplier.models.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const addNewSupplier = asyncHandler(async (req, res) => {
    if (!req.body) {
        throw new ApiErrors(400, "Request body is required");
    }
    const { 
        name, 
        companyName, 
        email, 
        phone, 
        city, 
        businessType,
    } = req.body;

    if (!name || name.trim() === "") {
        throw new ApiErrors(400, "Supplier name is required");
    }

    if (!phone || phone.trim() === "") {
        throw new ApiErrors(400, "phone number is required");
    }

    const existingSupplier = await Supplier.findOne({
        $or: [
            { name: name.trim() },
            { email: email?.trim() }
        ]
    });

    if (existingSupplier) {
        throw new ApiErrors(400, "Supplier with this name or email already exists");
    }

    const newSupplier = await Supplier.create({
        name: name.trim(),
        companyName: companyName?.trim() || null,
        email: email?.toLowerCase().trim() || null,
        phone: phone.trim(),
        address: {
            city: city?.trim() || null,
            country: "Pakistan"
        },
        businessType: businessType || "Other",
    });

    const checkSupplier = await Supplier.findById(newSupplier._id);
    if (!checkSupplier) {
        throw new ApiErrors(500, "Server error occurred while creating supplier");
    }

    const supplierStatus = checkSupplier.getSupplierStatus();
    const primaryContact = checkSupplier.getPrimaryContact();

    return res.status(201).json(
        new ApiResponse(201, {
            supplier: checkSupplier,
            status: supplierStatus,
            primaryContact
        }, "Supplier created successfully")
    );
});

const getAllSuppliers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, isActive, businessType } = req.query;

    // Build filter
    const filter = {};
    if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
    }
    if (businessType) {
        filter.businessType= businessType;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const suppliers = await Supplier.find(filter)
        .select('name companyName email phone address.city businessType isActive performance.totalOrders createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const totalSuppliers = await Supplier.countDocuments(filter);

    const suppliersWithStatus = suppliers.map(supplier => ({
        ...supplier.toObject(),
        status: supplier.getSupplierStatus()
    }));

    return res.status(200).json(
        new ApiResponse(200, {
            suppliers: suppliersWithStatus,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalSuppliers / parseInt(limit)),
                totalSuppliers,
                hasNextPage: skip + suppliers.length < totalSuppliers,
                hasPrevPage: parseInt(page) > 1
            }
        }, "Suppliers retrieved successfully")
    );
});

const getSupplierById = asyncHandler(async (req, res) => {
    const { supplierId } = req.params;

    if (!supplierId) {
        throw new ApiErrors(400, "Supplier ID is required");
    }

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
        throw new ApiErrors(404, "Supplier not found");
    }

    const supplierStatus = supplier.getSupplierStatus();
    const fullAddress = supplier.getFullAddress();
    const primaryContact = supplier.getPrimaryContact();

    return res.status(200).json(
        new ApiResponse(200, {
            supplier,
            status: supplierStatus,
            fullAddress,
            primaryContact
        }, "Supplier retrieved successfully")
    );
});

const updateSupplier = asyncHandler(async (req, res) => {
    const { supplierId } = req.params;

    if (!supplierId) {
        throw new ApiErrors(400, "Supplier ID is required");
    }

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
        throw new ApiErrors(404, "Supplier not found");
    }

    const { 
        name, 
        companyName, 
        email, 
        phone, 
        city, 
        businessType,
    } = req.body;

    if (name || email) {
        const conflictFilter = {
            _id: { $ne: supplierId },
            $or: []
        };
        
        if (name) conflictFilter.$or.push({ name: name.trim() });
        if (email) conflictFilter.$or.push({ email: email.toLowerCase().trim() });

        const existingSupplier = await Supplier.findOne(conflictFilter);
        if (existingSupplier) {
            throw new ApiErrors(400, "Supplier with this name or email already exists");
        }
    }
    if (name) supplier.name = name.trim();
    if (companyName !== undefined) supplier.companyName = companyName?.trim() || null;
    if (email !== undefined) supplier.email = email?.toLowerCase().trim() || null;
    if (phone) supplier.phone= phone.trim();
    if (city !== undefined) supplier.address.city = city?.trim() || null;
    if (businessType) supplier.businessType = businessType;

    await supplier.save();

    const supplierStatus = supplier.getSupplierStatus();

    return res.status(200).json(
        new ApiResponse(200, {
            supplier,
            status: supplierStatus
        }, "Supplier updated successfully")
    );
});

const toggleSupplierStatus = asyncHandler(async (req, res) => {
    const { supplierId } = req.params;

    if (!supplierId) {
        throw new ApiErrors(400, "Supplier ID is required");
    }

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
        throw new ApiErrors(404, "Supplier not found");
    }

    supplier.isActive = !supplier.isActive;
    await supplier.save();

    return res.status(200).json(
        new ApiResponse(200, {
            supplier: {
                _id: supplier._id,
                name: supplier.name,
                isActive: supplier.isActive
            }
        }, `Supplier ${supplier.isActive ? 'activated' : 'deactivated'} successfully`)
    );
});

const deleteSupplier = asyncHandler(async (req, res) => {
    const { supplierId } = req.params;

    if (!supplierId) {
        throw new ApiErrors(400, "Supplier ID is required");
    }

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
        throw new ApiErrors(404, "Supplier not found");
    }

    await Supplier.findByIdAndDelete(supplierId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Supplier deleted successfully")
    );
});

export {
    addNewSupplier,
    getAllSuppliers,
    getSupplierById,
    updateSupplier,
    toggleSupplierStatus,
    deleteSupplier
};