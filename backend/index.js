require('dotenv').config();
const WebSocket = require('ws');

// Create websocket connection to esp32
const wss = new WebSocket.Server({ port: SERVER_PORT});

// Gets messages
let data = "{}";
const clients = new Map();

wss.on('connection', function connection(ws) {
    ws.clientID = null;
    console.log('Client connected');

    ws.on('message', function incoming(message) {
        try {
            const parse = JSON.parse(message);
            if (parse.id) {
                if (parse.id == "ESP32" && parse.auth == process.env.ESP32_TOKEN) {
                    clients.set("ESP32", ws);
                    ws.clientID = "ESP32";
                    console.log("Connected ESP32");
                } else {
                    console.log("Failed authentication as ESP32 (could be intentional or unintentional). Sent token: " + parse.auth)
                    clients.set("FRONTEND", ws);
                    ws.clientID = "FRONTEND";
                    console.log("Connected Frontend");
                }
                
            } else if (ws.clientID == "ESP32") {
                data = message;
                console.log(`Received <-- ${data}`);
            }
        } catch (e) {
            console.log("Error: " + e);
        }

    });


    ws.on('close', function () {
        console.log('Client disconnected');
    });
});


setInterval(() => {
    const client = clients.get('FRONTEND');
    if (client && client.readyState === WebSocket.OPEN) {
        console.log(`Sending  --> ${data}`);
        client.send(data);

    }
}, 500);