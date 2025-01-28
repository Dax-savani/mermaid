const express = require("express");
const { linkedInCallback, getUser } = require("../controllers/user");

const AuthRoutes = express.Router();

AuthRoutes.get("/callback", linkedInCallback);
AuthRoutes.get("/get-user", getUser);

module.exports = AuthRoutes;
