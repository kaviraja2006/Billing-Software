const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');
const Joi = require('joi');

// @desc    Auth user & get token
// @route   POST /auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        res.status(400);
        throw new Error(error.details[0].message);
    }

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Register a new user
// @route   POST /auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        role: Joi.string().valid('admin', 'employee').default('employee'),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        res.status(400);
        throw new Error(error.details[0].message);
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        name,
        email,
        password,
        role: role || 'employee',
    });

    if (user) {
        res.status(201).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Logout user / clear cookie
// @route   POST /auth/logout
// @access  Public
const logoutUser = asyncHandler(async (req, res) => {
    // Since we are using stateless JWT, mostly frontend just clears token.
    // We can respond with a success message.
    res.json({ message: 'Logged out successfully' });
});

// @desc    Google Login
// @route   POST /auth/google
// @access  Public
// const googleLogin = asyncHandler(async (req, res) => {
//     const { token } = req.body;
//     const { OAuth2Client } = require('google-auth-library');
//     const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

//     try {
//         const ticket = await client.verifyIdToken({
//             idToken: token,
//             audience: process.env.GOOGLE_CLIENT_ID,
//         });

//         const { name, email, sub: googleId } = ticket.getPayload();

//         let user = await User.findOne({ $or: [{ email }, { googleId }] });

//         if (user) {
//             // Update googleId if not present (for existing email users)
//             if (!user.googleId) {
//                 user.googleId = googleId;
//                 await user.save();
//             }
//         } else {
//             // Create new user
//             user = await User.create({
//                 name,
//                 email,
//                 googleId,
//                 password: '', // No password for Google users
//                 role: 'employee', // Default role
//             });
//         }

//         res.json({
//             user: {
//                 id: user._id,
//                 name: user.name,
//                 email: user.email,
//                 role: user.role,
//             },
//             token: generateToken(user._id),
//         });

//     } catch (error) {
//         res.status(401);
//         throw new Error('Google authentication failed: ' + error.message);
//     }
// });

// @desc    Get user profile
// @route   GET /auth/me
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = {
    loginUser,
    registerUser,
    logoutUser,
    getUserProfile,
};
