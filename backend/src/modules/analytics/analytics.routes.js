const express = require('express');
const controller = require('./analytics.controller');
const { validate } = require('../../middlewares/validation.middleware');
const schemas = require('./analytics.validation');

const router = express.Router();

// Public, anonymous, validated analytics. It deliberately does not accept
// arbitrary URLs, identities, IP addresses, or browser metadata.
router.post('/track', validate(schemas.track), controller.track);

module.exports = router;
