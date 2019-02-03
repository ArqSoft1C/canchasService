const app = require('express')();
const mysql = require('mysql');

const bodyParser = require('body-parser');

app.use(bodyParser.json({
	limit: '8mb'
})); 

// environment variables
const PORT = process.env.PORT || 4005;
const HOST = process.env.HOST || '0.0.0.0';
const MYSQL_HOST = '192.168.99.101';
const responses = {
	200: "OK",
	201: "Created",
	500: "Internal Server Error",
	400: "Bad Request",
	204: "No Content"
};

// mysql credentials
const connection = mysql.createConnection({
	host: process.env.MYSQL_HOST || MYSQL_HOST,
	user: process.env.MYSQL_USER || 'root',
	password: process.env.MYSQL_PASSWORD || '12345678',
	database: process.env.MYSQL_DATABASE || 'courts_db',
	port: process.env.MYSQL_PORT || '3307',
	connectTimeout: 30000
});

connection.connect((err) => {
	if (err) {
		console.error('error connecting mysql: ', err);
	} else {
		console.log('mysql connection successful');
		app.listen(PORT, HOST, (err) => {
			if (err) {
				console.error('Error starting  server', err);
			} else {
				console.log('server listening at port ' + PORT);
			}
		});
	}
});

//manage database

//define variables to make operations over database
var dropCourtsTable = "DROP TABLE IF EXISTS courts";
var createCourtsTable = "CREATE TABLE courts (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, latitude FLOAT NOT NULL, longitude FLOAT NOT NULL, address VARCHAR(255) NOT NULL, availability BOOLEAN NOT NULL DEFAULT 1, price_hour INT NOT NULL)";
var addCourts = "INSERT INTO courts (name,latitude,longitude,address,availability,price_hour) VALUES ?";
var courts = [
	['Cancha Futbol 5', 4.69717478, -74.06437721, "Calle 45 #32-13", false, 40000],
	['Futbolito', 4.69505524, -73.99548436, "Calle 45 #32-13", true, 50000],
	['Futbol 5 Pro', 4.64459335, -74.08939437, "Autopista Norte Km 5", true, 60000],
	['Cotejos 5', 4.71104799, -74.07858079, "La Castellana", true, 40000],
	['Bogota Micro', 4.73995996, -74.05314579, "Colina Campestre", true, 40000],
	['Micreros', 4.64530557, -74.07742907, "San Cristóbal Sur", false, 80000],
	['Fut Five', 4.7741544, -74.0614379, "Galerías Calle 51#40-27", true, 50000],
	['Futboleros', 4.76469427, -74.02863123, "Chapiner", true, 90000],
	['Futbol Diversion', 4.67176734, -74.10682186, "Carrera 56 #35-19", false, 40000],
	['Soccer 5', 4.73282317, -73.98594857, "Av. Boyacá #71-34", true, 60000]
];

//drop table if exists
connection.query(dropCourtsTable, function (err, results, fields) {
	if (err) {
		console.log(err.message);
	} else {
		console.log("TABLE DROPPED!");
	}
});

//create table 'courts'
connection.query(createCourtsTable, function (err, results, fields) {
	if (err) {
		console.log(err.message);
	} else {
		console.log("TABLE CREATED!");
	}
});

//insert values into table 'courts'
connection.query(addCourts, [courts], function (err, results, fields) {
	if (err) {
		console.log(err.message);
	} else {
		console.log("Number of records inserted: " + results.affectedRows);
	}
});


//define routes

// home page
app.get('/', (req, res) => {
	res.status(200).json({
		success: true,
		message: 'Server runnning!'
	});
});

// insert a court into database
app.post('/courts', (req, res) => {
	var court = req.body;
	var postCourt = 'INSERT INTO courts (name,latitude,longitude,address,availability,price_hour) VALUES (?, ?, ?, ?, ?, ?)';

	connection.query(postCourt, [court.name, court.latitude, court.longitude, court.address, court.availability, court.price_hour], (err) => {

		var code = null;
		var courtObject = JSON.stringify(court);

		if (err) {

			if (err.code === "ER_BAD_NULL_ERROR") {
				code = 400;
				res.status(code).json({
					success: false,
					message: 'Invalid Params'
				});
			} else {
				code = 500;
				res.status(code).json({
					success: false,
					message: 'Internal Server Error'
				});
			}
		} else {
			code = 201;
			res.status(code).json(court);
		}
		console.log("POST " + MYSQL_HOST + ":" + PORT + "/courts " + code + " " + responses[code.toString()] + "\n" + courtObject);
	});
});

// get all courts
app.get('/courts', (req, res) => {

	var getAllCourts = 'SELECT * FROM courts';
	connection.query(getAllCourts, (err, results) => {

		var code = null;
		var courtsObject = JSON.stringify(results);

		if (err) {
			code = 500;
			res.status(code).json({
				success: false,
				message: 'Internal Server Error'
			});
		} else {
			code = 200;
			res.status(200).json(results);
		}
		console.log("GET " + MYSQL_HOST + ":" + PORT + "/courts " + code + " " + responses[code.toString()] + "\n" + courtsObject);
	});
});

// get a court by its id
app.get('/courts/:id', (req, res) => {

	var id = req.params.id;
	var getCourtById = 'SELECT * FROM courts WHERE id=?';

	connection.query(getCourtById, [id], (err, results) => {
		var code = null;
		var courtObject = JSON.stringify(results);

		if (err) {
			code = 500;
			res.status(code).json({
				success: false,
				message: 'Internal Server Error'
			});
		} else {
			var results_arr = results;
			if (results_arr.length !== 0) {
				code = 200;
				res.status(code).json(results[0]);
			} else {
				code = 204;
				res.status(code).json({
					success: false,
					message: 'No Content'
				});
			}

		}
		console.log("GET "+ MYSQL_HOST + ":" + PORT + "/courts/" + id + " "+code + " " + responses[code.toString()] + "\n" + courtObject);
	});
});

// update a court 
app.put('/courts/:id', (req, res) => {

	var court = req.body;
	var id = req.params.id;
	var putCourt = 'UPDATE courts SET name=?,latitude=?,longitude=?,address=?,availability=?,price_hour=? WHERE id=?';

	connection.query(putCourt, [court.name, court.latitude, court.longitude, court.address, court.availability, court.price_hour, [id]], (err) => {
		var code = null;
		var courtObject = JSON.stringify(court);

		if (err) {
			if (err.code === "ER_BAD_NULL_ERROR") {
				code = 400;
				res.status(code).json({
					success: false,
					message: 'Invalid Params'
				});
			} else {
				code = 500;
				res.status(code).json({
					success: false,
					message: 'Internal Server Error'
				});
			}
		} else {
			code = 200;
			res.status(code).json(court);
		}
		console.log("PUT "+ MYSQL_HOST + ":" + PORT + "/courts/" + id +" "+code + " " + responses[code.toString()] + "\n" + courtObject);
	});
});

// delete a court 
app.delete('/courts/:id', (req, res) => {

	var id = req.params.id;
	var deleteCourt = 'DELETE FROM courts WHERE id=?';

	connection.query(deleteCourt, [id], (err, results) => {
		var code = null;
		
		if (err) {
			code = 500;
			res.status(code).json({
				success: false,
				message: 'Internal Server Error'
			});
		} else {
			if (results.affectedRows === 0) {
				code = 200;
				res.status(code).json({
					success: true,
					message: "The court doesn't exist"
				});
			} else {
				code = 200;
				res.status(code).json({
					success: true,
					message: 'Successfully deleted court'
				});
			}
		}
		console.log("DELETE "+ MYSQL_HOST + ":" + PORT + "/courts/" + id +" "+ code + " " + responses[code.toString()]);

	});
});