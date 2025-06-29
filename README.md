
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

## **INSTALLATION**
- Docker repo isn't public :(
- ...but if you have access, pull from `joshtr083/arduino-web:backend` and `joshtr083/arduino-web:frontend`
- Download or copy docker-compose.yml
- Edit `docker-compose.yml` according to your needs, main focuses are:
    - Frontend port: `- LISTEN_IP:PORT:8080`
        - This will control how your frontend is accessed.
    - Backend port: ` - LISTEN_IP:PORT:8080`
        - Ideally this should be something like the device LAN IP
        - Its only needed by esp32 to connect via websocket
        - Backend by default should be inaccessible except through frontend
- Run docker-compose or [add to systemd](https://lmgtfy2.com/s/b1fZP7) or idk what the best method is.
