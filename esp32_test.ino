
#include <Arduino.h>
// include the sensor libraries
#include <Ultrasonic.h>
// Websocket client libs
#include <ArduinoWebsockets.h>
#include <WiFi.h>
// SHT41 and LPS22 libraries
#include "Adafruit_SHT4x.h"
#include <Wire.h>
#include <Adafruit_LPS2X.h>
#include <Adafruit_Sensor.h>

#define LED 2

// Setup wifi and server info
const char *ssid = "Reidhome";
const char *password = "06062004";
const char *websockets_server_host = "192.168.86.23";
const uint16_t websockets_server_port = 8080;
const String auth = "3rugOhdqfk1jwoLh5sShIW1vfaIaw4EIf5AOD0tyPf4yOpkJ0AP3QSgLtLviKaJV";

// Websocket client
using namespace websockets;
WebsocketsClient client;

// Setup on disconnect function
void onEventsCallback(WebsocketsEvent event, String data) {
  if (event == WebsocketsEvent::ConnectionClosed) {
    Serial.println("Disconnected from server, Restarting in 5s...");
    delay(5000);
    ESP.restart();
  }
}

// Read sensors
// How often it reads data
static const unsigned long DATA_TRANSFER_RATE = 500;

//PINS
static const int LIGHT_PIN = 34;
static const int TRIG_PIN = 25;
static const int ECHO_PIN = 26;
//Ultrasonic sensor
Ultrasonic ultrasonic(TRIG_PIN, ECHO_PIN);

// SHT41 Sensor
Adafruit_SHT4x sht4 = Adafruit_SHT4x();

// LPS22 Sensor
Adafruit_LPS22 lps;
#define LPS_CS 10
#define LPS_SCK 13
#define LPS_MISO 12
#define LPS_MOSI 11

static bool get_environment(sensors_event_t* temp, sensors_event_t* humid, sensors_event_t* press, float *light, unsigned long *dist) {
  static sensors_event_t lp_temp;
  static unsigned long timestamp = millis();

  if (millis() - timestamp > DATA_TRANSFER_RATE) {
    timestamp = millis();
    // Read sht
    sht4.getEvent(humid, temp);
    // Read lps
    lps.getEvent(press, &lp_temp);

    // Read light levels
    *light = analogRead(LIGHT_PIN);

    *dist = ultrasonic.read();

    return true;
  }

  return false;
}

void setup() {
  // Sht ensor setup
  sht4.begin();
  sht4.setPrecision(SHT4X_HIGH_PRECISION);
  sht4.setHeater(SHT4X_NO_HEATER);
  //Lps setup
  lps.begin_I2C();
  lps.setDataRate(LPS22_RATE_10_HZ);

  // put your setup code here, to run once:
  Serial.begin(115200);
  pinMode(LED, OUTPUT);

  // Wifi connection
  WiFi.begin(ssid, password);
  Serial.print("Connecting to wifi");

  // Wait some 30s to connect to wifi
  for (int i = 0; i < 30 && WiFi.status() != WL_CONNECTED; i++) {
    Serial.print(".");
    delay(1000);
  }

  // Check if connected to wifi
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("Connected to WiFi!");

  } else {
    Serial.println("Failed to connect to WiFi :(");
    Serial.println("Status: " + WiFi.status());
    return;
  }

  // Attempts to connect to server
  Serial.println("Connecting to server...");

  int attempts = 0;
  while (true) {
    bool connected = client.connect(websockets_server_host, websockets_server_port, "/");
    if (connected) {
      Serial.println("Connected to Server!");
      // Waits a little
      delay(5000);
      //authenticates esp32
      String verify = ("{\"id\":\"ESP32\",\"auth\":\"" + auth + "\"}");
      Serial.println("Authorizing with: " + verify);
      client.send(verify);
      break;
    } else {
      attempts += 1;
      Serial.println("Not Connected! Attempt " + String(attempts) + "...");
      delay(5000);
    }
  }

  client.onEvent(onEventsCallback);
}

void loop() {
  // Sensor variables
  sensors_event_t temp, humid, press;
  static float light = 0;
  static unsigned long dist = 0;

  if (get_environment(&temp, &humid, &press, &light, &dist)) {
    digitalWrite(LED, HIGH);

    String msg = "{\"temp\":" + String(((temp.temperature - 0.82) * 9/5) + 32) + ",\"humid\":" + String(humid.relative_humidity) + ",\"press\":" + String(press.pressure) + ",\"light\":" + light + ",\"dist\":" + dist + "}";
    Serial.println("Sending --> " + msg);
    client.send(msg);
  }

  client.poll();
  delay(100);
  digitalWrite(LED, LOW);
}
