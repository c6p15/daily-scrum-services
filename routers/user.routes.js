
const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth.js')

const { register, login, getInfo, logout, getAllUsers } = require('../controller/user.controller.js')

router.post('/login', login)
router.post('/register', register)
router.get('/info', auth, getInfo)
router.post('/logout', auth, logout)

router.get('/all', getAllUsers)

module.exports = router