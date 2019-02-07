const http = require('http');
// const fs = require('fs');
const express = require('express');
var localtunnel = require('localtunnel');
var sheets = require("./getSheets.js");
var localtunnelInfo = require("./sensitiveData/localtunnel.json");

// Setup
// const db = require('./server/database/index.js');
// const facebook = require('./server/facebook-api.js');
// const linkedin = require('./server/linkedin-api.js');
const app = express();
const hostname = '127.0.0.1';
const port = 3000;

var tunnel = localtunnel(port, {"subdomain":localtunnelInfo.subdomain}, function(err, tunnel) {
    if (err) {console.log(err)}
    console.log(tunnel.url);
});

tunnel.on('close', function() {
    // tunnels are closed
});

// POST Parser Setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routing
// app.use('/database', db);
// app.use('/facebook', facebook);
// app.use('/linkedin', linkedin);

app.get('/', (req,res) => {
  res.send('Hello World!!!');
});


// Catch-all for returning help info
app.get('*', (req, res) => {
  // TODO
  console.log('Catch-all');
  res.send('Catch-all');
});

app.set('port', port);
app.listen(port, () => console.log(`Server running at http://${hostname}:${port}/`));

// const server = http.createServer((req, res) => {
//   res.statusCode = 200;
//   res.setHeader('Content-Type', 'text/html');
//   res.end('Hello World\n');
// });
