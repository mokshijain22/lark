const express = require('express');
const router = express.Router();
const { createEvent, getEvents, getEventById, respondRsvp, deleteEvent } = require('./event.controller');
const { protect } = require('../../shared/middleware/auth.middleware');

router.use(protect);

router.post('/events', createEvent);
router.get('/events', getEvents);
router.get('/events/:id', getEventById);
router.patch('/events/:id/rsvp', respondRsvp);
router.delete('/events/:id', deleteEvent);

module.exports = router;
