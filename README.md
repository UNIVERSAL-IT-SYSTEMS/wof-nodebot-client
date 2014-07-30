# WoF Server and Client

_For more information read our [docs](http://ms-iot.github.io/windows-on-fridges)_

## Node socket client that controls the Galileo
Client takes instructions from [server](https://github.com/ms-iot/wof-nodebot-server) and controls the hardware with Johnny-Five.

## Setup
To set up your Galileo see the [documentation](http://ms-iot.github.io/windows-on-fridges/nodebot/building).
These docs will explain how to build the physical robot with Galileo.

To install project dependencies run
```
npm install
```

In order for Johnny-Five to work line 485 in node_modules/lib/board.js must be commented out.
If this line isn't commented out the server will throw an exception when you try to run it.
```
message[color],
```

Then in client.js change galileoIP to your hostname or IP address
```
var galileoIP = 'mygalileo';
```

To start the server, first run the Firmata project from visual studio on your Galileo board.
Then from command line run the following command 

```
node client.js
```

This will launch the REPL to interact with the board, the motors are injected into the REPL and can be controlled directly
```
motors.left.fwd(255)  // left motor forward at full speed 
motors.right.rev(100) // right motor reverse at reduced speed
motors.right.stop()   // stop right motor
motors.left.stop()    // stop left motor
```
