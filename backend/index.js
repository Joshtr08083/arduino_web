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

    write_console(`Client connected\nClients connected: \n`);
    console.table(clients);

    ws.on('message', function incoming(message) {
        try {
            const parse = JSON.parse(message);
            // If ID is present, client is trying to authenticate
            if (parse.id) {
                if (parse.id == "ESP32" && parse.auth == process.env.ESP32_TOKEN) {
                    clients.set("ESP32", ws);
                    ws.clientID = "ESP32";
                    write_console("Connected ESP32");
                    
                } else {
                    write_console("Failed authentication as ESP32 (could be intentional or unintentional). Sent token: " + parse.auth)
                    clients.get('FRONTEND').add(ws);
                    ws.clientID = "FRONTEND";
                    write_console("Connected Frontend");
                }
            // Otherwise verify if its data from esp32
            } else if (ws.clientID == "ESP32") {
                lastMessageTime = Date.now();
                write_console('Received <-- ' + message);
                data = message;
            }
        } catch (e) {
            console.error("Error: " + e);
        }

    });


    ws.on('close', function () {
        if (ws.clientID == 'FRONTEND') {
            const frontends = clients.get('FRONTEND');
            if (frontends && frontends.has(ws)) {
                frontends.delete(ws);
                write_console("Frontend disconnected");
            }
        } else if (ws.clientID == 'ESP32') {
            esp32Fails = 0;
            clients.delete("ESP32");
            write_console("ESP32 disconnected");
        } else {
            write_console("Unknown client disconnected");
        }

    });


});


// Interval stuff
setInterval(() => {
    const frontends = clients.get('FRONTEND');

    const esp32 = clients.get("ESP32");
    // Checks if ESP32 is available
    if (!esp32 || Date.now()-lastMessageTime > 10000) {
        // clears data
        data = null;
        // any message i sent threw an error for some reason, so for now i just send whatever
        msg = "no esp :("
    } else {
        msg = data;
    }
    // Sends to all frontends
    for (const client of frontends) {
        if (client && client.readyState === WebSocket.OPEN) {
            write_console('Sending  --> ' + msg);
            
            client.send(msg);
        }
    }   
}, 500);

// Save every second
setInterval(async () => {
    // Writes data to seconds table
    const write = data;
    if (write) {
        write_console('Saving   --S ' + write);
        await sql.write_json(db, 'seconds', write);
    }
}, 1000);
// Save every minute
setInterval(async () => {
    const write = data;
    // Writes data to seconds table
    if (write) {
        write_console('Saving   --M ' + write);
        await sql.write_json(db, 'minutes', write);
    }
}, 60000);
// Save every hour
setInterval(async () => {
    const write = data;
    // Writes data to seconds table
    if (write) {
        write_console('Saving   --H ' + write);
        await sql.write_json(db, 'hours', write);
    }
}, 3600000);

let bufferMsg = "";
let repeats = 0;
function write_console(msg) {

    if (process.stdout.isTTY) {
        if (bufferMsg == msg) {
            repeats++;
            process.stdout.write(`${msg} x${repeats}\r`);
        } else {
            repeats = 0;
            process.stdout.write(`\n${msg}\r`);
        }
        bufferMsg = msg;
    } else {
        console.log(msg);
    }

}