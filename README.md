# WoF Server and Client

## Node socket client that controls the Galileo
* Client takes instructions from server and controls the hardware with Johnny-Five.

## Setup
To set up your Galileo see the [documentation](http://ms-iot.github.io/windows-on-fridges/nodebot/building).
These docs will explain how to build the physical robot with Galileo.

To build server run:
    npm install
This will install all necessary packages to the node_modules folder.

In order for Johnny-Five to work line 485 in node_modules/lib/board.js must be commented out.
```
message[color],
```
If this line isn't commented out the server will throw an exception when you try to run it.

Then in client.js change galileoIP to your hostname or IP address
```
var galileoIP = 'mygalileo';
```

To start the server, first run the Firmata project from visual studio on your Galileo board.
Then from command line run the following command 

```
node server.js
```

This will launch the REPL to interact with the board, the motors are injected into the REPL and can be controlled directly
```
motors.left.fwd(255)  // left motor forward at full speed 
motors.right.rev(100) // right motor reverse at reduced speed
motors.right.stop()   // stop right motor
motors.left.stop()    // stop left motor
```

You can also make a post request to the server at the ip address of the machine or Galileo it is running on at the port specified in the server.
```
curl -v -H "Accept: application/json" -H "Content-type: application/json" -X POST -d '{"angle":90, "distance":2}'  http://localhost:1337/robot
```
"localhost" in the example can be changed to the domain the server is running on.

You can also post a list of commands. Just post an array of the command objects to localhost:1337/robot/list
