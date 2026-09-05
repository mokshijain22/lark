const express = require('express');
const router = express.Router();
const {
  createDocument, getDocuments, getTemplates, getDocumentById,
  updateDocument, getVersions, revertVersion, deleteDocument,
} = require('./document.controller');
const { protect } = require('../../shared/middleware/auth.middleware');

router.use(protect);

router.post('/', createDocument);
router.get('/', getDocuments);
router.get('/templates', getTemplates);
router.get('/:id', getDocumentById);
router.patch('/:id', updateDocument);
router.get('/:id/versions', getVersions);
router.post('/:id/revert', revertVersion);
router.delete('/:id', deleteDocument);

module.exports = router;
