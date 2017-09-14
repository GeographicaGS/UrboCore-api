var express = require('express');
var router = express.Router();
var scopes = require('./scopes');

router.use('/scopes', scopes);

module.exports = router;
