require('dotenv').config();
const WebSocket = require('ws');

// Create websocket connection to esp32
const wss = new WebSocket.Server({ port: 8080});

// Gets messages
let data = "{}";
// Create map for differenct frontend/esp32 clients
const clients = new Map();
// Add set for frontend objects
clients.set('FRONTEND', new Set());

wss.on('connection', function connection(ws) {
    ws.clientID = null;
    console.log('Client connected');

    ws.on('message', function incoming(message) {
        try {
            const parse = JSON.parse(message);
            // If ID is present, client is trying to authenticate
            if (parse.id) {
                if (parse.id == "ESP32" && parse.auth == process.env.ESP32_TOKEN) {
                    clients.set("ESP32", ws);
                    ws.clientID = "ESP32";
                    console.log("Connected ESP32");
                } else {
                    console.log("Failed authentication as ESP32 (could be intentional or unintentional). Sent token: " + parse.auth)
                    clients.get('FRONTEND').add(ws);
                    ws.clientID = "FRONTEND";
                    console.log("Connected Frontend");
                }
            // Otherwise verify if its data from esp32
            } else if (ws.clientID == "ESP32") {
                data = message;
                console.log(`Received <-- ${data}`);
            }
        } catch (e) {
            console.log("Error: " + e);
        }

    });


    ws.on('close', function () {
        if (ws.clientID == 'FRONTEND') {
            const frontends = clients.get('FRONTEND');
            if (!frontends && frontends.has(ws)) {
                frontends.delete(ws);
                console.log("Frontend disconnected");
            }
        } else if (ws.clientID == 'ESP32') {
            console.log("ESP32 disconnected");
        }

    });
});


setInterval(() => {
    const frontends = clients.get('FRONTEND');
    // Sends to all frontends
    for (const client of frontends) {
        if (client && client.readyState === WebSocket.OPEN) {
            console.log(`Sending  --> ${data}`);
            client.send(data);
        }
    }   
}, 500);