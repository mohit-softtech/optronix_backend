const express = require('express');
const router = express.Router();
const CorrectionController = require('../controllers/correction.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { createCorrectionSchema } = require('../validators/correction.validator');

router.use(authenticate);

// POST /api/corrections — Employee raises a correction
router.post('/', authorize('employee'), validate(createCorrectionSchema), CorrectionController.create);

// GET /api/corrections — Employee views own corrections
router.get('/', authorize('employee'), CorrectionController.getMyRequests);

// DELETE /api/corrections/:id — Employee cancels own pending correction
router.delete('/:id', authorize('employee'), CorrectionController.cancelRequest);

module.exports = router;
