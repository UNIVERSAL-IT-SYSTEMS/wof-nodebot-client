// app/models/robot.js
var net = require("net");
var five = require("johnny-five");
var Queue = require('../utils/Queue.js');

// variable for debugging without robot
// Set to false if not connected.
var isRobot = true;

function Robot(id, galileoIP) {
  this.id = id;
  this.queue = new Queue();

  if(isRobot) {
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
      /*
        Seeed Studio Motor Shield V1.0, V2.0
        Motor A
          pwm: 9
          dir: 8
          cdir: 11
        Motor B
          pwm: 10
          dir: 12
          cdir: 13

        Arduino MotorShield 3 
        Motor A:
          pwm: 3
          dir: 12
          brake: 9
        Motor B:
          pwm: 11
          dir: 13
          brake: 8
      */

      //a
      left: new five.Motor({
        pins: {
          pwm: 9,
          dir: 8,
          cdir: 11
        }
      }),
      // b
      right: new five.Motor({
        pins: {
          pwm: 10,
          dir: 12,
          cdir: 13 
        }
      })
    };

    // Allow override control of motors from the REPL
    // E.g. >> motors.left.fwd(255)
    this.repl.inject({
      motors: motors
    });

    // Turn on brakes when we create the board
    motors.left.brake();
    motors.right.brake();
  });
  }
}

/*
 * Stops motors after a given duration.
 * Calls runQueue to continue the queue.
 */
Robot.prototype.motorDuration = function(duration) {
  var that = this;
  this.board.wait(duration, function() {
      motors.left.stop();
      motors.right.stop();
      that.runQueue();
  });
}

/*
 * Control the motors on the robot.
 */
Robot.prototype.motorControl = function(direction, speed, duration) {
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

/*
 * move the robot in the specified direction for a defined speed and duration
 */
Robot.prototype.move = function(command) {
  console.log('Move: ' + command.direction);
  this.motorControl(command.direction, command.speed, command.duration);
}

/*
 * Set queue for the robot
 */
Robot.prototype.setQueue = function(list) {
  console.log('Set Queue: ' + list);

  // enqueue each command
  for(var i = 0; i < list.length; i++) {
    console.log(list[i].direction);
    this.queue.enqueue(list[i]);
  }
}

/*
 * Run the queue of commands
 */
Robot.prototype.runQueue = function() {
  if(this.queue.isEmpty())
    return
  this.move(this.queue.dequeue());
}

module.exports = Robot;
