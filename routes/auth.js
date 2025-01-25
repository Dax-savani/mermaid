const express = require('express');
const {handleCreateUser, handleLoginCtrl, handleGetMe} = require('../controllers/user');
const {auth} = require("../middlewares/auth");
const router = express.Router();

router.post('/register', handleCreateUser);

router.post('/login', handleLoginCtrl);

router.get('/me', auth, handleGetMe);

module.exports = router;
