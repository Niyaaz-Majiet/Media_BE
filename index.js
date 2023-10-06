const morgan = require('morgan');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

require('./dataAccessLayer/DBHelper/dbHelper').startup();

const app = express();
const server = require('http').createServer(app);

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(morgan('[:date[iso]] :status :method :url bytes::res[content-length] ms::response-time user-agent::user-agent'))

require('./logic/profileLogic/profileLogic').register(app);
require('./logic/movieLogic/movieLogic').register(app);

process.on('uncaughtException', function (err) {
    console.log(err);
})

console.warn('Server Starting ');
const PORT = process.env.PORT || 3000;
server.listen(PORT);
console.warn(' INDEX.JS running and listening on port ' + PORT + ' ...');
console.warn(' NODE.JS version ' + process.version + ' ...');