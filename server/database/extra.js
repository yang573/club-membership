const express = require('express');
const router = express.Router();
const conn = require('./connection.js');

// Get newsletter sign-up information
router.get('/newsletter', function(req, res) {
  console.log('Newsletter request received');

  // Setup database calls
  let promiseArray = [
    conn.promiseQuery('SELECT COUNT(Newsletter) as count FROM Members WHERE Newsletter=1'),
    conn.promiseQuery('SELECT COUNT(*) as count FROM Members')
  ];

  // Resolve database calls and return
  Promise.all(promiseArray).then(function(results) {
    let data = {
      'signed-up': results[0][0].count,
      'total-members': results[1][0].count
    };
    res.send(packageData(data));
  }).catch(function(error) {
    res.send(parseError(error));
  });
});

// Get an overall recap of a semester
router.get('/semester/:semester', function(req, res) {
  // TODO
});

module.exports = router;

function packageData(data) {
  return JSON.stringify({ status: 200, data: data });
}

function parseError(error) {
  console.log(error);
  return JSON.stringify({ status: error.code, message: error.message });
}
