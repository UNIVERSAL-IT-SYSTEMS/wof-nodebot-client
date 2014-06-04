// app/models/robot.js
var five = require("johnny-five")

function Robot(id) {
  this.id = id;

  // New johnny-five board
  this.board = new five.Board();

  this.board.on("ready", function() {
    motors = {
      left: new five.Motor([3, 12]), // pwm: 3, dir: 12
      right: new five.Motor([11, 2])
    };

    led = new five.Led({
      pin:13
    });
  });

  // Control function for motors
  five.Board.prototype.motorController 
              = function(direction, speed, duration) {
    console.log("motorController:" + direction)
    switch(direction) {
      case 'forward':
        motors.left.fwd(speed);
        motors.right.fwd(speed);
        motorDuration(duration);
        break;
      case 'backward':
        motors.left.rev(speed);
        motors.right.rev(speed);
        motorDuration(duration);
        break;
      case 'left':
        motors.left.rev(speed);
        motors.right.fwd(speed);
        motorDuration(duration);
        break;
      case 'right':
        motors.left.fwd(speed);
        motors.right.fwd(speed);
        motorDuration(duration);
        break;
    }

    five.Board.prototype.motorDuration = function(duration) {
      board.wait(duration, function() {
        motors.left.stop();
        motors.right.stop();
      });
    }
  }  

  five.Board.prototype.ledControl = function(command) {
    switch(command) {
      case 'on':
        led.on();
        break;
      case 'off':
        led.off();
        break;
    }
  }
}

// move the robot in the specified direction for a defined speed and
// duration
Robot.prototype.move = function(direction, speed, duration) {
  // move in direction hjkl
  console.log(direction);
  //this.board.motorController(direction);
  this.board.ledControl(direction);

}

module.exports = Robot;
