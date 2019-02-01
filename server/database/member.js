const express = require('express');
const router = express.Router();
const connection = require('./connection');

// Insert a new member
router.post('/', function(req, res) {
  connection.promiseQuery(
    'SELECT 1 FROM Members WHERE Email = ?',
    req.body.email
  ).then(function(result) {
    if (result.length != 0) {
      let error = new Error('A member already exists with the email '+ req.body.email);
      error.code = 404;
      return Promise.reject(error);
    }

    let sqlString = `INSERT INTO Members (FirstName, LastName, YearID, Email, Newsletter)
                      VALUES (?, ?, ?, ?, ?)`;
    let memberData = [
      req.body.firstName, req.body.lastName,
      req.body.yearID, req.body.email, req.body.newsletter
    ];

    return connection.promiseQuery(sqlString, memberData);
  }).then(function(result) {
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
// TODO: Paginate list of memberID
router.get('/', function(req, res) {
  let memberData;
  let promiseArray = [
    connection.promiseQuery('SELECT COUNT(*) AS count FROM Members'),
    connection.promiseQuery(`SELECT ROUND(AVG(Semester_Attendance), 2) AS semester_average,
      ROUND(AVG(Total_Attendance), 2) AS total_average
      FROM Membership`),
    connection.promiseQuery('SELECT Active, COUNT(*) AS count FROM Membership GROUP BY Active'),
  ];

  Promise.all(promiseArray).then(function(results) {
    console.log(results);

    memberData = {
      overall: {
        total_members: results[0][0].count,
        average_semester_attendance: results[1][0].semester_average,
        total_semester_attendance: results[1][0].total_average,
        active_members: results[2][0].count
      }
    };

    promiseArray = [
      connection.promiseQuery('SELECT YearID, COUNT(*) AS count FROM Members GROUP BY YearID'),
      connection.promiseQuery(`SELECT YearID,
        ROUND(AVG(Semester_Attendance), 2) AS semester_average,
        ROUND(AVG(Total_Attendance), 2) AS total_average
        FROM Membership GROUP BY YearID`),
      connection.promiseQuery(`SELECT YearID, Active, COUNT(*) AS count
        FROM Membership GROUP BY YearID, Active`),
    ];
    return Promise.all(promiseArray);
  }).then(function(results) {
    console.log(results);

    memberData.year_breakdown = {
      total_members: yearBreakdown(results[0], 'count'),
      average_semester_attendance: yearBreakdown(results[1], 'semester_average'),
      total_semester_attendance: yearBreakdown(results[1], 'total_average'),
      active_members: yearBreakdown(results[2], 'count')
    };

    return connection.promiseQuery('SELECT MemberID, FirstName, LastName FROM Members');
  }).then(function(results) {
    console.log(results);

    let members = {};
    results.forEach(row => {
      let key = row.FirstName + '_' + row.LastName;
      members[key] = `/database/member/${row.MemberID}`;
    });

    memberData.members = members;

    res.send(packageData(memberData));
  }).catch(function(error) {
    res.send(parseError(error));
  });
});

// Get information about a specific member
router.get('/:memberID', function(req, res) {
  let memberData;
  let promiseArray = [
    connection.promiseQuery('SELECT * FROM Members WHERE MemberID = ? LIMIT 1', req.params.memberID),
    connection.promiseQuery('SELECT * FROM Membership WHERE MemberID = ? LIMIT 1', req.params.memberID)
  ];

  Promise.all(promiseArray).then(function(results) {
    if (results[0].length == 0) {
      let error = new Error('The MemberID '+ req.params.memberID +' could not be found.');
      error.code = 404;
      return Promise.reject(error);
    }

    memberData = {
      MemberID: results[0][0].MemberID,
      FirstName: results[0][0].FirstName,
      LastName: results[0][0].LastName,
      Year: null,
      Email: results[0][0].Email,
      Newsletter: Boolean(results[0][0].Newsletter),
      Semester_Attendance: results[1][0].Semester_Attendance,
      Total_Attendance: results[1][0].Total_Attendance,
      Active: Boolean(results[1][0].Active)
    };

    return connection.promiseQuery(
      'SELECT * FROM Academic_Year AS Value WHERE YearID = ? LIMIT 1',
      results[0][0].YearID
    );
  }).then(function(result) {
    console.log(result);
    memberData.Year = result[0].Value;
    res.send(packageData(memberData));
  }).catch(function(error) {
    res.send(parseError(error));
  });
});

// Modify a specified member
router.patch('/:memberID', function(req, res) {
  let values = req.body.values; // JSON
  connection.promiseQuery(
    'SELECT 1 FROM Members WHERE MemberID = ?',
    req.params.memberID
  ).then(function(result) {
    if (result.length == 0) {
      let error = new Error('The MemberID '+ req.params.memberID +' could not be found.');
      error.code = 404;
      return Promise.reject(error);
    }

    // TODO: Check if toSqlString() is needed for the bottom to work
    return connection.promiseQuery(
      'UPDATE Members SET ? WHERE MemberID = ?',
      [values, req.params.memberID]
    );
  }).then(function(result) {
    let message = {
      memberID: req.params.memberID,
      affectedRows: result.affectedRows,
      entryChanged: Boolean(result.changedRows)
    };
    res.send(packageData(message));
  }).catch(function(error) {
    res.send(parseError(error));
  });
});

// Delete the specified member from the database
// TODO: Delete Member refernce in Promos and Member_Login tables
router.delete('/:memberID', function(req, res) {
  connection.promiseQuery(
    'SELECT 1 FROM Members WHERE MemberID = ?',
    req.params.memberID
  ).then(function(result) {
    if (result.length == 0) {
      let error = new Error('The MemberID '+ req.params.memberID +' could not be found.');
      error.code = 404;
      return Promise.reject(error);
    }

    return connection.promiseQuery(
      'DELETE FROM Member_Event WHERE MemberID = ?',
      req.params.memberID
    );
  }).then(function(result) {
    console.log(result);
    return connection.promiseQuery(
      'DELETE FROM Members WHERE MemberID = ?',
      req.params.memberID
    );
  }).then(function(result) {
    console.log(result);
    let message = {
      message: 'Deletion successful',
      memberID: req.params.memberID
    };
    res.send(packageData(message));
  }).catch(function(error) {
    res.send(parseError(error));
  });
});

module.exports = router;

function yearBreakdown(rawData, key) {
	let yearData = Array(8);
	let i = 0;

	for (let j = 0; i < rawData.length; j++) {
    yearData[j] = rawData[i].YearID == j + 1 ? rawData[i++][key] : 0;
  }

	return {
		freshmen: yearData[0],
		sophomore: yearData[1],
		junior: yearData[2],
		senior: yearData[3],
		graduate_student: yearData[4],
		professor: yearData[5],
    company_rep: yearData[6],
		other: yearData[7],
	};
}

function packageData(data) {
  return JSON.stringify({ status: 200, data: data });
}

function parseError(error) {
  console.log(error);
  return JSON.stringify({ status: error.code, message: error.message });
}
