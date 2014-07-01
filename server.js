var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser());
app.use(bodyParser.json({type : 'application/vnd.api+json'}));

var Robot = require('./app/models/robot');
var robot = new Robot('4'); // give robot id

app.post('/robot', function(req, res) {
	console.log(req.body);
	var direction = req.body.direction,
	speed = req.body.speed,
	duration = req.body.duration;
	robot.move(direction, speed, duration);
});
app.post('/robot/list', function(req, res) {
	console.log(req.body);
	var commandList = req.body;
	for (var command in directionList) 
		robot.move(command.direction, command.speed, command.duration);
});
var server = app.listen(3000, function() {
  console.log('Listening on port %d', server.address().port);
});