# WoF Server
## Node server that runs on and controls Galileo robot

* Rest api build with Expressjs and body-parser to send commands to robot.
* Uses Johnny-Five and firmata to control hardware on the Galileo.

To build server run:
    npm install
This will install all necessary packages to the node_modules folder.

In order for Johnny-Five to work line 485 in node_modules/lib/board.js must be commented out.
```
message[color],
```
If this line isn't commented out the server will throw an exception when you try to run it.

To start the server, first run the Firmata project from visual studio on your Galileo board.
Then from command line run the following command 

```
node server.js
```
