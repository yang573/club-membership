/**
 * TODO: NEED TO PROMISE-FY EVERYTHING
 * TODO: Remove sqlString variable
 * TODO: Check SQL database column naming conventions
 * TODO: Maybe change parameterized paths to simple get ? params
 */


const express = require('express');
const router = express.Router();

const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  // TODO: Change the below to an ssl certificate
  user: 'NodeJS',
  password: 'Augmented59Shirts', // HACK: This should not be hardcoded you doofus
  database: 'dev_sbcs'
});


/** Events **/

// Add an event spreadsheet to the database
router.post('/event', function(req, res) {
  // // Get data from Google Drive
  // // req.body.PARAM == sheet name/path
  // let eventData = ['Hi', new Date(2018, 8, 30), 100];
  //
  // // Add any new members & newsletter changes
  // // TODO
  //
  // // Get semester
  // let sqlString = `SELECT * FROM Semester WHERE Value LIKE ${} LIMIT 1`;
  // connection.query(sqlString, function(error, results, fields) {
  //   if (error)
  //     res.send(parseError(error));
  //
  //   // eventData.splice(2, 0, semesterID);
  // });
  //
  // // Post event into Events table
  // sqlString = 'INSERT INTO Events (Name, Date, SemesterID, Attendance)' +
  //   'VALUES (?, ?, ?, ?)';
  // connection.query(sqlString, eventData, function(error, results, fields) {
  //   if (error)
  //     res.send(parseError(error));
  //
  //   // TODO:
  // });
  //
  // // Link Members to Events
  // // TODO:


});

// Get overall event info for the most recent semester
router.get('/event/overall', function(req, res) {
  // select row with max SemesterID
  let sqlString = 'SELECT * FROM Semester ORDER BY SemesterID DESC LIMIT 1';
  let overallData;
  promiseQuery(sqlString).then(function(result) {
    if (result.length == 0) {
      let error = new Error('No events could not be found.');
      error.code = 404;
      return Promise.reject(error);
    }

    overallData = {
      Semester: result[0].Value,
      Number_Of_Events: null,
      Average_Attendance: null
    };

    sqlString = 'SELECT * FROM Events WHERE SemesterID = ?';
    return promiseQuery(sqlString, result[0].SemesterID);
  }).then(function(results) {
    let average = 0;
    for (let row in results) {
      average += row.Attendance;
    }
    average /= results[0].length;

    overallData.Number_Of_Events = results.length;
    overallData.Average_Attendance = average;

    res.send(packageData(overallData));
  }).catch(function(error) {
    res.send(parseError(error));
  });
});

// Get information about a specific event
router.get('/event/:eventID', function(req, res) {
  let sqlString = 'SELECT * FROM Events WHERE EventID = ? LIMIT 1';
  let eventData;
  promiseQuery(sqlString, req.params.eventID).then(function(result) {
    if (result.length == 0) {
      let error = new Error('The EventID '+ req.params.eventID +' could not be found.');
      error.code = 404;
      return Promise.reject(error);
    }

    eventData = {
      EventID: result[0].EventID,
      Name: result[0].Name,
      Date: result[0].Date,
      Semester: null,
      Attendance: result[0].Attendance
    };

    sqlString = 'SELECT * FROM Semester AS Value WHERE SemesterID = ? LIMIT 1';
    return promiseQuery(sqlString, result[0].SemesterID);
  }).then(function(result) {
    eventData.Semester = result[0].Value;
    res.send(packageData(eventData));
  }).catch(function(error) {
    res.send(parseError(error));
  });
});

// Delete an event from the database
router.delete('/event/:eventID', function(req, res) {
  let sqlString = 'SELECT 1 FROM Events WHERE EventID = ?';
  promiseQuery(sqlString, req.params.eventID).then(function(result) {
    if (result.length == 0) {
      let error = new Error('The EventID '+ req.params.eventID +' could not be found.');
      error.code = 404;
      return Promise.reject(error);
    }

    sqlString = 'DELETE FROM Member_Event WHERE EventID = ?';
    return promiseQuery(sqlString, req.query.eventID);
  }).then(function(result) {
    sqlString = 'DELETE FROM Events WHERE EventID = ?';
    return promiseQuery(sqlString, req.query.eventID);
  }).then(function(result) {
    console.log(result);

    let message = {
      message: 'Deletion successful',
      eventID: req.params.eventID
    };

    res.send(packageData(message));
  }).catch(function(error) {
    res.send(parseError(error));
  });
});


/** Members **/

// Insert a new member
router.post('/member', function(req, res) {
  let sqlString = `INSERT INTO Members (FirstName, LastName, YearID, Email, Newsletter)
                      VALUES (?, ?, ?, ?, ?)`;
  let memberData = [
    req.body.firstName, req.body.lastName,
    req.body.yearID, req.body.email, req.body.newsletter
  ];

  promiseQuery(sqlString, memberData, function(result) {
    let insertData = {
      memberID: result.insertID,
      url: `/member/${result.insertID}`
    };

    res.send(packageData(insertData));
  }).catch(function(error) {
    res.send(parseError(error));
  });
});

// Get overall membership information
router.get('/member/overall', function(req, res) {
  // TODO
});

// Get information about a specific member
router.get('/member/:memberID', function(req, res) {
  // TODO: Get attendance and active member status

  let sqlString = 'SELECT * FROM Members WHERE MemberID = ? LIMIT 1';
  let memberData;
  promiseQuery(sqlString, req.params.memberID).then(function(result) {
    if (result.length == 0) {
      let error = new Error('The MemberID '+ req.params.memberID +' could not be found.');
      error.code = 404;
      return Promise.reject(error);
    }

    memberData = {
      MemberID: result[0].MemberID,
      FirstName: result[0].FirstName,
      LastName: result[0].LastName,
      Year: null,
      Email: result[0].Email,
      Newsletter: Boolean(result[0].Newsletter)
    };

    sqlString = 'SELECT * FROM Academic_Year AS Value WHERE YearID = ? LIMIT 1';
    return promiseQuery(sqlString, result[0].YearID);
  }).then(function(result) {
    console.log(result);
    memberData.Year = result[0].Value;
    res.send(packageData(memberData));
  }).catch(function(error) {
    res.send(parseError(error));
  });
});

router.delete('/member/:memberID', function(req, res) {
  let sqlString = 'SELECT 1 FROM Members WHERE MemberID = ?';
  promiseQuery(sqlString, req.params.memberID).then(function(result) {
    if (result.length == 0) {
      let error = new Error('The MemberID '+ req.params.memberID +' could not be found.');
      error.code = 404;
      return Promise.reject(error);
    }

    sqlString = 'DELETE FROM Members WHERE MemberID = ?';
    return promiseQuery(sqlString, req.query.memberID);
  }).then(function(result) {
    console.log(result);

    let message = {
      message: 'Deletion successful',
      eventID: req.params.memberID
    };

    res.send(packageData(message));
  }).catch(function(error) {
    res.send(parseError(error));
  });
});


/** Other **/

// Get newsletter sign-up information
router.get('/newsletter', function(req, res) {
  console.log('Newsletter request received');

  // Setup database calls
  let promiseArray = [];
  let sqlString = 'SELECT COUNT(Newsletter) as count FROM Members WHERE Newsletter=1';
  promiseArray.push(promiseQuery(sqlString));
  sqlString = 'SELECT COUNT(*) as count FROM Members';
  promiseArray.push(promiseQuery(sqlString));

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

function promiseQuery(query, values) {
  return new Promise(function(resolve, reject) {
    connection.query(query, values, function(error, results) {
      if (error != null)
        reject(error);
      else
        resolve(results);
    });
  });
}

function packageData(data) {
  return JSON.stringify({ status: 200, data: data });
}

function parseError(error) {
  console.log(error);
  return JSON.stringify({ status: error.code, message: error.message });
}
