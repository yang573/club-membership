const util = require('util');
const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  // TODO: Change the below to an ssl certificate
  user: 'NodeJS',
  password: 'Augmented59Shirts', // HACK: This should not be hardcoded you doofus
  database: 'dev_sbcs',
  //debug: true
});

connection.connect(error => {
  if (error) {
    throw error;
  }
});

console.log('connection');

//const promiseQuery = util.promisify(connection.query);

function promiseQuery(query, values = null) {
  return new Promise((resolve, reject) => {
    connection.query(query, values, (error, results) => {
      if (error)
        reject(error);
      else
        resolve(results);
    })
  });
}

function packageData(data) {
  return JSON.stringify({ status: 200, data: data });
}

function parseError(error) {
  console.log(error);
  return JSON.stringify({ status: error.code, message: error.message });
}

module.exports = {
  connection: connection,
  promiseQuery: promiseQuery,
  packageData: packageData,
  parseError: parseError
};
