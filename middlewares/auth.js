const {verifyToken} = require("../auth/jwt");
const User = require('../models/user')

async function auth(req, res, next) {
    let authToken = req.headers.token;
    if (!authToken) return res.status(401).json({message: "UnAuthorised: Auth token not found!", status: 401});

    if (authToken.toLowerCase().startsWith("bearer ")) {
        authToken = authToken.split(" ")[1];
    }
    const user = await verifyToken(authToken);
    const verifiedUser = await User.findOne({email: user.email});
    if (!verifiedUser) return res.status(401).json({message: "UnAuthorised: Auth token is invalid!", status: 401});

    req.user = verifiedUser;

    next();
}

module.exports = {auth};