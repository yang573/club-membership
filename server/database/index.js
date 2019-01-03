const express = require('express');
const router = express.Router();

//exports.connection = require('./connection.js);
const event = require('./event.js');
const member = require('./member.js');
const extra = require('./extra.js');

router.use('/event', event);
router.use('/member', member);
router.use('/extra', extra);

module.exports = router;
