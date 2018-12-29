const express = require('express');
const router = express.Router();

// Add alumni flair members according to database
router.post('/alumni', function(req, res) {
  // TODO: Perform in batches of 100
  // TODO: Add table column for facebook flair, to prevent redundency?
  promiseQuery('SELECT * FROM Members WHERE YearID > 4').then(function(results) {
    //TODO
  }).catch(function(error) {
    res.send(parseError(error));
  });
});

module.exports = router;

// TODO: Move helper functions to a shared file
/* Helper Functions */
function promiseQuery(query) {
  return new Promise(function(resolve, reject) {
    connection.query(query, function(error, results) {
      if (error != null)
        reject(error);
      else
        resolve(results);
    });
  });
}

function parseError(error) {
  console.log(error);
  return JSON.stringify({ status: error.code, message: error.message });
}
