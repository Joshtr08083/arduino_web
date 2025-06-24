require('dotenv').config();

// Express api stuff for seconding data to frontend
require('./src/api.js');

// connect to database
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database("./data/json_log.db", sqlite3.OPEN_READWRITE);
// add write to database function
const sql = require('./src/sql.js');

// data stores message
let data;
// Create map for differenct frontend/esp32 clients
const clients = new Map();
// Add set for frontend objects
clients.set('FRONTEND', new Set());
// Record last message to detect if esp32 goes offline
let lastMessageTime = Date.now();

// Create websocket connection
const WebSocket = require('ws');
// Create websocket connection to esp32
const wss = new WebSocket.Server({ port: 8080});
// Websocket connection manager
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
                lastMessageTime = Date.now();
                
                data = message;
                console.log(`Received <-- ${data}`);
                
            }
        } catch (e) {
            console.error("Error: " + e);
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
            esp32Fails = 0;
            clients.delete("ESP32");
            console.log("ESP32 disconnected");
        }

    });


});


// Interval stuff
setInterval(() => {
    const frontends = clients.get('FRONTEND');

    const esp32 = clients.get("ESP32");
    // Checks if ESP32 is available
    if (!esp32 || Date.now()-lastMessageTime > 10000) {
        // any message i sent threw an error for some reason, so for now i just send whatever
        msg = ":("
    } else {
        msg = data;
    }
    // Sends to all frontends
    for (const client of frontends) {
        if (client && client.readyState === WebSocket.OPEN) {
            console.log(`Sending  --> ${msg}`);
            client.send(msg);
        }
    }   
}, 500);

setInterval(async () => {
    // Writes data to seconds table
    if (data) {
        await sql.write_json(db, 'seconds', JSON.stringify(data));
        console.log("Saved    --| " + data);
    }
}, 1000);


