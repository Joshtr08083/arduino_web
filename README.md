
# Arduino-Web Project

This is a *very* specific use-case made by a *very* inexperienced developer.

## **What is it?**
This is the web dashboard app for logging and displaying data gathered from an arduino. Right now that data is useless data from sensors lying around. 

## **The Setup**
Sensord --> ESP32 --> Server --> Web UI

<br>
  
**Sensors**  
- Doesn't really matter here
- Right now it uses SHT41, LPS22, Photoresistor, and HC-SR04.


**ESP32**  
- Sends sensor data to server

**Server**  
- Just serves webpage and logs data
- Websocket connection to ESP32 and front-end
- SQLite database for logging json data

**Web UI**  
- Websocket connection to server  
- Displays graphs to show data
- Uses database do graph past data

