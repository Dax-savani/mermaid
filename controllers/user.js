const User = require("../models/user");
const { generateToken } = require("../auth/jwt");
const asyncHandler = require("express-async-handler");


const handleCreateUser = asyncHandler(async (req, res) => {
    const { email, contact } = req.body;

    const userExist = await User.exists({
        $or: [{ email }, { contact }],
    });

    if (userExist) {
        res.status(400);
        throw new Error("User already exists");
    }

    const newUser = await User.create(req.body);

    res.status(201).json({
        data: {
            id: newUser._id,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            email: newUser.email,
            contact: newUser.contact,
            dob: newUser.dob,
        },
        message: "User registered successfully",
        status: 201,
    });
});


const handleLoginCtrl = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const findUser = await User.findOne({ email });

    if (!findUser) {
        res.status(404);
        throw new Error("User not found");
    }

    const isMatch = await findUser.isPasswordMatched(password);

    if (!isMatch) {
        res.status(401);
        throw new Error("Invalid credentials");
    }

    const authToken = generateToken(findUser._id);
    const user = {
        id: findUser._id,
        first_name: findUser.first_name,
        last_name: findUser.last_name,
        dob: findUser.dob,
        contact: findUser.contact,
        email: findUser.email,
    };

    res.status(200).json({
        data: user,
        token: authToken,
        message: "Logged in successfully",
        status: 200,
    });
});


const handleGetMe = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        res.status(401);
        throw new Error("Not authorized, token failed");
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    res.status(200).json({
        data: {
            id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            dob: user.dob,
            contact: user.contact,
            email: user.email,
        },
        message: "User details retrieved successfully",
        status: 200,
    });
});

module.exports = {
    handleCreateUser,
    handleLoginCtrl,
    handleGetMe,
};
