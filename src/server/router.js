let express = require('express')
let router = express.Router()
let sendgift = require('./api/sendgift')

router.post('/sendgift', sendgift.get)

module.exports = router
