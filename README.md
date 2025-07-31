
# Arduino-Web Project

This is a *very* specific use-case and isn't useful outside of that use-case. Arduino and ESP32 code aren't included here.

## **Setup**
**Sensors --> Arduino --> ESP32 --> Server --> Web UI**

- Arduino to ESP32 is done because my ESP32 was having trouble reading sensors.

- Server also saves to a database, but more work is needed to flesh that part out.

<br>

**Web App**  
- Old frontend is a basic dashboard which was for a proof-of-concept
  - This one requires different sensors for SHT41, LPS22, photoresisor, thermsistor and ultrasonic sensor. 
- New frontend is the react project which is more tailored to the specific requirements of the new project
  - This one is more tailored to a specific project; it uses four touch resistors.

## **INSTALLATION**
- Docker repo isn't public
- Pull from `joshtr083/arduino-web:backend` and `joshtr083/arduino-web:frontend`
- Copy docker-compose.yml
- Edit `docker-compose-template.yml`:
    - Frontend port: `LISTEN_IP:PORT:8080`
        - This will control how your frontend is accessed.
        - Access backend via /api and /ws
