
# Arduino-Web Project

This is a *very* specific use-case made by a *very* inexperienced developer who may or may not have gotten more-than-hed-like-to-admit advice from ChatGPT.

### **What is it?**
This is the web dashboard app for logging and displaying data gathered from an arduino. Right now that data is useless data from sensors lying around. 

### **The Setup**
Sensors --> Arduino --> ESP32 --> Server --> Web UI

**Sensors**
- Doesn't really matter here
**Arduino**
- Mega2560
- UART to ESP32
- Why not use one with wifi? I didn't have one.
**ESP32**
- Used only for wifi communication to server
- Why not use ESP32 directly? I didn't know how (I have no idea what im doing)
**Server**
- Not really relevant, just serves webpage and logs data
- Websocket connection to ESP32
**Web UI**
- Also not much to say
- Websocket connection to server

