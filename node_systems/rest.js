//Native Node Packages
const https = require('https');

//3rd party packages
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');


//Our Packages
const utils = require('./utilz.js');

//Our App
const app = express();

//Apply Middleware
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors({origin: true, credentials: true}));

//Our Routes
const auth_routes = require('./Routes/Auth.js');

//Apply Routes
app.use(auth_routes);

https.createServer({
	key: utils.k3yc3r7.key,
	cert: utils.k3yc3r7.cert
},
app).listen(1400, () => {
	utils.logData('Server running | 1400');
	
	app.use(function(err, req, res, next) {
		res.header('Access-Control-Allow-Origin', 'Pr0con.com');
		res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
		res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, multipart/form-data');
		
		(err) ? console.log('@rest.js error: ',err) : (!err) ? next() : console.log('Something went horribly wrong!');
	});
	
	app.get('/', (req,res) => {
		res.json({time: Date().toString()});
	});
});