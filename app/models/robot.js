// app/models/robot.js
var net = require("net");
var five = require("johnny-five");
var Queue = require('../utils/Queue.js');

// variable for debugging without robot
// Set to false if not connected.
var isRobot = true;


/*********************************************************************/
                //Calibrating Speed Variables//
/*********************************************************************/
//
// Every robot will be slightly different. To calibrate your robot
// to accurately follow your commands, follow the directions below.
//
// While measuring, keep in mind that your robot might move differently
// based on what surface (ex: carpet, tile, or wood flooring) it is moving on.
// Try to take your measurements on the surface the robot will be using most.
// If there are significant differences in robot performance on different surfaces
// you may want to keep the robot from going on certain surfaces that will throw it
// off by removing those paths from your map.
//
/*********************************************************************/


//if we are going to measure a consistent speed of the robot, the motors need to have a consistent PWM
var setPWM = 255;

/**
 * Rotational speed right can be calculated by sending the command
 * {direction: RIGHT, speed: setPWM, duration: 100}
 * Then measure the degrees the robot turned. It may be helpful to mark the robot's
 * initial heading on the ground with tape to assist with measurements.
 * 
 * Try with a few different durations to make sure the degrees/duration stays relatively consistent.
 * rotationalSpeedRight = average(degrees/duration)
 */
var rotationalSpeedRight = 1; // degrees/milisecond when turning right

/**
 * Rotational speed left can be similarly calculated with
 * {direction: LEFT, speed: setPWM, duration: 100}
 * It may turn out to be the same as rotationalSpeedRight, but
 * you can't assume that will be the case.
 *
 * Again, try with a few different durations to make sure the it is relatively consistent.
 * rotationalSpeedLeft = average(degrees/duration)
 */
var rotationalSpeedLeft = 1; // degrees/millisecond when turning right

/**
 * forwardSpeed is the distance your robot moves forward in one millisecond.
 * The unit of distance you use should match the unit of distance of the map you use.
 * For example, if your directions pass in the distance in meters, forwardSpeed should be calculated in meters/millisecond. 
 *
 * Use {direction: FORWARD, speed: setPWM, duration: 100} and measure how far your robot moves forward.
 * Again, marking the ground could be helpful.
 * 
 * forwardSpeed = average(distance/duration)
 */
var forwardSpeed = 0.5; // distance/millisecond when going forward

/*********************************************************************/


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
Robot.prototype.motorControl = function(direction, duration) {
  switch(direction) {
      case 'FORWARD':
        motors.left.fwd(setPWM);
        motors.right.fwd(setPWM);
        this.motorDuration(duration)
        break;
      case 'BACKWARD':
          motors.left.rev(setPWM);
          motors.right.rev(setPWM);
          this.motorDuration(duration)
        break;
      case 'LEFT':
          motors.left.rev(setPWM);
          motors.right.fwd(setPWM);
          this.motorDuration(duration)
        break;
      case 'RIGHT':
          motors.left.fwd(setPWM);
          motors.right.rev(setPWM);
          this.motorDuration(duration)
        break;
      case 'STOP':
        motors.left.stop();
        motors.right.stop();
        break;
    }
}

/*******************************************************************************************************/
                                //Easy Calibration Functions//
/*******************************************************************************************************/
Robot.prototype.move = function (command) {
    console.log('Direction: ' + command.direction + ', Duration: ' + command.duration);
    this.motorControl(command.direction, command.duration);
}

/*******************************************************************************************************/

/*
 * move the robot in the specified direction for a defined speed and duration
 */
/*
Robot.prototype.move = function(command) {
  console.log('Move: ' + command.direction);
  this.motorControl(command.direction, command.speed, command.duration);
}
*/

/*
 * Set queue for the robot
 */
Robot.prototype.setQueue = function(list) {
  console.log('Set Queue: ' + list);

  // enqueue each command
  for (var i = 0; i < list.length; i++) {
      var command = list[i];
      console.log('Turn: ' + command.angle + ', Go forward: ' + command.distance);

      var direction;
      var duration;
      if (command.angle > 0) {
          duration = command.angle / rotationalSpeedRight; // deg/(deg/ms) = ms
          direction = 'RIGHT';
      } else if (command.angle < 0) {
          duration = -command.angle / rotationalSpeedLeft; // deg/(deg/ms) = ms
          direction = 'LEFT';
      }

      if(command.angle != 0){
          var angleCommand = { direction: direction, duration: duration };
          this.queue.enqueue(angleCommand);
      }
      if (command.distance != 0) {
          var distanceCommand = { direction: 'FORWARD', duration: command.distance / forwardSpeed };
          this.queue.enqueue(distanceCommand);
      }
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
