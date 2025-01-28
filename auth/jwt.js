const jwt = require('jsonwebtoken');
const dotenv = require("dotenv").config();

const generateToken = (Obj) => {
    return jwt.sign(Obj , process.env.JWT_SECRET_KEY );
}

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET_KEY)
}
module.exports = {generateToken, verifyToken}