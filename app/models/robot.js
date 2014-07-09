// app/models/robot.js
var net = require("net");
var five = require("johnny-five");
var Queue = require('../utils/Queue.js');

// variable for debugging without robot
var debug = false;

function Robot(id, galileoIP) {
  this.id = id;
  this.queue = new Queue();

  if(debug === false) {
  // Create socket to communicate with firmata on the Galileo
  this.socket = net.createConnection(27015, galileoIP);
    console.log('Socket created.');
  this.socket.on('data', function (data) {
    // Log the response from the HTTP server.
    console.log('RESPONSE: ' + data);
  }).on('connect', function () {
    // Manually write an HTTP request.
    console.log("connected");
  }).on('end', function () {
    console.log('DONE');
  });

  // New johnny-five board
  // With socket connection
  this.board = new five.Board({
    port: this.socket
  });

  // Create board and motors
  this.board.on("ready", function() {
    motors = {
      // Each motor needs 3 pins for this shield. pwm, dir, and brake.
      // a
      left: new five.Motor({
        pins: {
          pwm: 3,
          dir: 12,
          brake: 9
        }
      }),
      // b
      right: new five.Motor({
        pins: {
          pwm: 11,
          dir: 13,
          brake: 8 
        }
      })
    };

    this.repl.inject({
      motors: motors
    });

    // Turn on brakes when we create the board
    // Helps with clean up from previous server
    motors.left.brake();
    motors.right.brake();
  });
  }

  // Stops motors after a specified duration
  five.Board.prototype.motorDuration = function(duration) {
    this.wait(duration, function() {
      motors.left.stop();
      motors.right.stop();
    });
  }

  // Control function for motors
  five.Board.prototype.motorController 
              = function(direction, speed, duration) {
    console.log("motorController:" + direction)
    switch(direction) {
      case 'FORWARD':
        motors.left.fwd(speed);
        motors.right.fwd(speed);
        this.motorDuration(duration);
        break;
      case 'BACKWARD':
        motors.left.rev(speed);
        motors.right.rev(speed);
        this.motorDuration(duration);
        break;
      case 'LEFT':
        motors.left.rev(speed);
        motors.right.fwd(speed);
        this.motorDuration(duration);
        break;
      case 'RIGHT':
        motors.left.fwd(speed);
        motors.right.rev(speed);
        this.motorDuration(duration);
        break;
      case 'STOP':
        motors.left.stop();
        motors.right.stop();
        break;
    }
  }  
}

// move the robot in the specified direction for a defined speed and duration
Robot.prototype.move = function(command) {
  console.log('move command: ' + command);
  this.board.motorController(command.direction, command.speed, command.duration);
}

// Set queue for the robot
Robot.prototype.setQueue = function(list) {
  console.log('set queue: ' + list);

  // enqueue each command
  for(var i = 0; i < list.length; i++)
    this.queue.enqueue(list[i]);
}

// Run the queue of commands
Robot.prototype.runQueue = function() {
  if(this.queue.isEmpty())
    return
  while(!this.queue.isEmpty()) {
    this.moveCommand(this.queue.dequeue());
  }
}

module.exports = Robot;
