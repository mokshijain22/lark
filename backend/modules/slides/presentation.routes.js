const express = require('express');
const router = express.Router();
const {
  create, getAll, getById, addSlide, updateSlide, deleteSlide, reorderSlides, deletePresentation,
} = require('./presentation.controller');
const { protect } = require('../../shared/middleware/auth.middleware');

router.use(protect);

router.post('/', create);
router.get('/', getAll);
router.get('/:id', getById);
router.post('/:id/slides', addSlide);
router.patch('/:id/slides/:slideId', updateSlide);
router.delete('/:id/slides/:slideId', deleteSlide);
router.patch('/:id/reorder', reorderSlides);
router.delete('/:id', deletePresentation);

module.exports = router;
