var io = require('socket.io-client');
var serverUrl = 'http://localhost:1337';
var socket = io.connect(serverUrl);
var Robot = require('./app/models/robot');

// Replace GALILEO_IP with the ip address/hostname of you galileo.
var galileoIP = 'mygalileo'; 
// Each robot can have an id.
var robot = new Robot('4', galileoIP);

/*
 * Takes one direction and executes it.
 */
socket.on('robotControl', function(command){
  console.log(command);
  robot.move(command);
});

/*
 * Takes a list of instructions and executes them.
 * Creates a queue of instructions for the robot to follow.
 */
socket.on('robotControlList', function(data) {
  console.log(data);
  var commandList = data.commandList;
  console.log(commandList);

  robot.addToQueue(commandList);
  robot.runQueue();
});
