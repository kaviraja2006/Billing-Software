const asyncHandler = require('express-async-handler');
const Customer = require('../models/customerModel');
const Joi = require('joi');

// @desc    Get all customers
// @route   GET /customers
// @access  Private
const getCustomers = asyncHandler(async (req, res) => {
    const customers = await Customer.find({}).sort({ createdAt: -1 });
    // Map to include 'id' field for frontend consistency
    const response = customers.map(c => ({
        id: c._id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: c.address,
        totalVisits: c.totalVisits,
        totalSpent: c.totalSpent,
        due: c.due,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
    }));
    res.json(response);
});

// @desc    Get single customer
// @route   GET /customers/:id
// @access  Private
const getCustomerById = asyncHandler(async (req, res) => {
    const customer = await Customer.findById(req.params.id);

    if (customer) {
        // Return with 'id' field
        const response = {
            id: customer._id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            totalVisits: customer.totalVisits,
            totalSpent: customer.totalSpent,
            due: customer.due,
            createdAt: customer.createdAt,
            updatedAt: customer.updatedAt
        };
        res.json(response);
    } else {
        res.status(404);
        throw new Error('Customer not found');
    }
});

// @desc    Create a customer
// @route   POST /customers
// @access  Private
const createCustomer = asyncHandler(async (req, res) => {
    const { name, phone, email, address } = req.body;

    const schema = Joi.object({
        name: Joi.string().required(),
        phone: Joi.string().required(),
        email: Joi.string().allow('').optional(),
        address: Joi.string().allow('').optional(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        res.status(400);
        throw new Error(error.details[0].message);
    }

    const customer = await Customer.create({
        name,
        phone,
        email,
        address,
    });
    // Return with 'id' field
    const response = {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        totalVisits: customer.totalVisits,
        totalSpent: customer.totalSpent,
        due: customer.due,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt
    };
    res.status(201).json(response);
});

// @desc    Update a customer
// @route   PUT /customers/:id
// @access  Private
const updateCustomer = asyncHandler(async (req, res) => {
    const customer = await Customer.findById(req.params.id);

    if (customer) {
        customer.name = req.body.name || customer.name;
        customer.phone = req.body.phone || customer.phone;
        customer.email = req.body.email || customer.email;
        customer.address = req.body.address || customer.address;

        const updatedCustomer = await customer.save();
        res.json(updatedCustomer);
    } else {
        res.status(404);
        throw new Error('Customer not found');
    }
});

// @desc    Delete a customer
// @route   DELETE /customers/:id
// @access  Private
const deleteCustomer = asyncHandler(async (req, res) => {
    const customer = await Customer.findById(req.params.id);

    if (customer) {
        await customer.deleteOne();
        res.json({ message: 'Customer deleted successfully' });
    } else {
        res.status(404);
        throw new Error('Customer not found');
    }
});

module.exports = {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
};
