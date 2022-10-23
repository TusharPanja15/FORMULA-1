const express = require('express');

const router = express.Router();

const adminControlller = require('../controllers/admin');

router.post('/add-event', adminControlller.postEvent);

module.exports = router;