const User = require("../models/user");
const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");
const {generateToken} = require("../auth/jwt");

const getAccessToken = async (code) => {
    const body = new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        redirect_uri: "https://mermaid-16xw.onrender.com/api/linkedin/callback",
    });

    const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: {
            "Content-type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
    });

    if (!response.ok) {
        throw new Error(response.statusText);
    }

    return await response.json();
};

const getUserData = async (accessToken) => {
    const response = await fetch("https://api.linkedin.com/v2/userinfo", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(response.statusText);
    }

    return await response.json();
};

const linkedInCallback = async (req, res) => {
    try {
        const { code } = req.query;
        const accessToken = await getAccessToken(code);

        const userData = await getUserData(accessToken.access_token);
        if (!userData) {
            return res.status(500).json({
                success: false,
                error: "Unable to fetch user data",
            });
        }

        let user = await User.findOne({ email: userData.email });

        if (!user) {
            user = new User({
                name: userData.name,
                email: userData.email,
                avatar: userData?.picture,
            });
            await user.save();
        }

        const token = generateToken({ name: user.name, email: user.email, avatar: user.avatar })

        res.cookie("token", token, {
            httpOnly: false,
            secure: true,
            sameSite: "None",
        });

        res.redirect(`http://localhost:3000//dashboard?token=${token}`)
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

const getUser = async (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(403).json({
            success: false,
            message: "No token provided",
        });
    }

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        res.status(403).json({
            success: false,
            message: "Invalid token",
        });
    }
};

module.exports = {
    linkedInCallback,
    getUser,
};
