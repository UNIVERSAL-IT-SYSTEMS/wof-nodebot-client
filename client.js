var io = require('socket.io-client');
var serverUrl = 'http://localhost:1337';
var socket = io.connect(serverUrl);

// we can have multiple robot clients each with unique ids.
// Replace GALILEO_IP with the ip address of you galileo.

var galileoIP = 'GALILEO_IP'; 

var Robot = require('./app/models/robot');
var robot = new Robot('4', galileoIP); // give robot id

/*
 * Takes one direction and executes it.
 */
socket.on('robotControl', function(data){
  console.log(data);
	var direction = data.direction,
	speed = data.speed,
	duration = data.duration;
  console.log(speed + " " + duration + " " + direction);
	robot.move(direction, speed, duration);
});

/*
 * Takes a list of instructions and executes them.
 */
socket.on('robotControlList', function(data) {
  console.log(data);
  var commandList = data.commandList;

  for(var i = 0; i < commandList.length; i++) {
    var command = commandList[i];
  }
});
