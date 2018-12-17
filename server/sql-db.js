const express = require('express');
const router = express.Router();

// Add an event spreadsheet to the databse
router.post('/event/upload', function(req, res) {
  // TODO
});

// Get overall event info for the most recent semester
router.get('/event', function(req, res) {
  // TODO
});

// Get information about a specific event
router.get('/event/:eventId', function(req, res) {
  // TODO
});

// Get overall membership information
router.get('/member', function(req, res) {
  // TODO
});

// Get information about a specific member
router.get('/member/:memberId', function(req, res) {
  // TODO
});

// Get newsletter sign-up information
router.get('/newsletter', function(req, res) {
  // TODO
});

// Get an overall recap of a semester
router.get('/semester/:semester', function(req, res) {
  // TODO
});

module.exports = router;
