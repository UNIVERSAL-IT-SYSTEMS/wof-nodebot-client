// app/models/robot.js
var net = require("net");
var five = require("johnny-five");
var Queue = require('../utils/Queue.js');

// variable for debugging without robot
// Set to false if not connected.
var isRobot = true;

//variable for whether you want to robot to
//automatically return to starting position
//after following instructions.
var autoReturn = true

// Calibration variables
var setPWM = 255;                 // Speed for motors

var rotationalSpeedRight = .1;    // degrees/milisecond when turning right
var rotationalSpeedLeft = .1;     // degrees/millisecond when turning right
var forwardSpeed = 0.00089;       // distance/millisecond when going forward

function Robot(id, galileoIP) {
  this.id = id;
  this.queue = new Queue();
  this.currentQueue = new Queue();
  this.runningQueue = false;
  this.stack = new Array();
  this.runningStack = false;

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
      right: new five.Motor({
        pins: {
          pwm: 9,
          dir: 8,
          cdir: 11
        }
      }),
      // b
      left: new five.Motor({
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
  var that = this;        // Allow current scope access within board func.
  this.board.wait(duration, function() {
      motors.left.stop();
      motors.right.stop();
      if (that.runningStack) {
          that.nextStackInstruction();
      } else {
          that.nextInstruction();
      }
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

Robot.prototype.move = function (command) {
    console.log('Doing:  Direction: ' + command.direction + ', Duration: ' + command.duration);
    if (autoReturn) {
        console.log('Should add to stack negative of Direction: ' + command.direction + ', Duration: ' + command.duration);
        //stack.push(//negative command)
    }
    this.motorControl(command.direction, command.duration);
}

/*
 * Set queue for the robot
 */
Robot.prototype.setQueue = function(list, newQueue) {
  console.log('Set Queue: ' + list);

  // enqueue each command
  for (var i = 0; i < list.length; i++) {
      var command = list[i];
      console.log('Queuing:  Turn: ' + command.angle + ', Go forward: ' + command.distance);

      var angleDirection;
      var turnDuration;
      var distanceDirection;
      var distanceDuration;

      //Left or right direction and duration
      if (command.angle > 0) {
          turnDuration = command.angle / rotationalSpeedRight; // deg/(deg/ms) = ms
          angleDirection = 'LEFT';
      } else if (command.angle < 0) {
          turnDuration = -command.angle / rotationalSpeedLeft; // deg/(deg/ms) = ms
          angleDirection = 'RIGHT';
      }

      //forward or back direction and duration
      if (command.distance > 0) {
          distanceDuration = command.distance / forwardSpeed; // distance/(distance/ms) = ms
          distanceDirection = 'FORWARD';
      } else if (command.angle < 0) {
          distanceDuration = -command.distance / forwardSpeed; // distance/(distance/ms) = ms
          distanceDirection = 'BACKWARD';
      }

      if(command.angle != 0){
          var angleCommand = { direction: angleDirection, duration: turnDuration };
          newQueue.enqueue(angleCommand);
      }
      if (command.distance != 0) {
          var distanceCommand = { direction: distanceDirection, duration: distanceDuration };
          newQueue.enqueue(distanceCommand);
      }
  }
}

/*
 * Creates a new queue with the newest set of instructions and addes it to the master queue.
 */
Robot.prototype.addToQueue = function (list) {
    var newQueue;
    robot.setQueue(list, newQueue);
    this.queue.enqueue(newQueue);
    if (!this.runningQueue) {
        this.runningQueue = true;
        this.runQueue;
    }
}

/*
 * Sets up the next queue of commands to run.
 */
Robot.prototype.runQueue = function () {
    if (this.queue.isEmpty()) {
        this.runningQueue = false;
        return;
    }
    this.currentQueue = this.queue.dequeue();
    this.nextInstruction();
}

/*
 * Run the current queue of commands.
 */
Robot.prototype.nextInstruction = function () {
    if (this.currentQueue.isEmpty()) {
        if (autoReturn) {
            this.runningStack = true;
            var that = this;        // Allow current scope to be accessed in board.
            this.board.wait(10000, function () {  // wait a bit for drink to be picked up
                that.nextStackInstruction();
            });
            return
        }
        this.runQueue();
        return
    }
    var that = this;        // Allow current scope to be accessed in board.
    this.board.wait(1000, function () {
        that.move(that.currentQueue.dequeue());
    });
}

/*
 * Runs the stack until robot is back where it started.
 */
Robot.prototype.nextStackInstruction = function () {
    if (this.stack.isEmpty()) {
        this.runningStack = false;
        this.runQueue();
        return
    }
    var that = this;        // Allow current scope to be accessed in board.
    this.board.wait(1000, function () {
        that.move(that.stack.pop());
    });
}

module.exports = Robot;
