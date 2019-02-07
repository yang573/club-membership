const express = require('express');
const router = express.Router();
const conn = require('./connection.js');

// Get newsletter sign-up information
router.get('/newsletter', (req, res) => {
  console.log('Newsletter request received');

  // Setup database calls
  let promiseArray = [
    conn.promiseQuery('SELECT COUNT(Newsletter) as count FROM members WHERE Newsletter=1'),
    conn.promiseQuery('SELECT COUNT(*) as count FROM members')
  ];

  // Resolve database calls and return
  Promise.all(promiseArray).then(results => {
    let data = {
      'signed-up': results[0][0].count,
      'total-members': results[1][0].count
    };
    return res.send(connection.packageData(data));
  }).catch(error => {
    return res.send(connection.parseError(error));
  });
});

// Get an overall recap of a semester
// TODO
router.get('/semester/:semester', function(req, res) {

});

module.exports = router;
