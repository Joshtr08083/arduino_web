const WS_PORT = 8080;

require('dotenv').config();
const { CronJob } = require('cron');

// Express api stuff for seconding data to frontend
require('./src/api.js');

// connect to database
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const DB_PATH =  path.join(__dirname, 'data');
console.log(DB_PATH)

// add write to database function
const sql = require('./src/sql.js');

const db = new sqlite3.Database(path.join(DB_PATH, 'json_log.db'), sqlite3.OPEN_READWRITE);
const archivedb = new sqlite3.Database(path.join(DB_PATH, 'archive.db'));

sql.execute (
            db,
            `ATTACH "${path.join(DB_PATH, 'archive.db')}" AS archive`
);



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
const wss = new WebSocket.Server({ port: WS_PORT});
// Websocket connection manager
wss.on('connection', function connection(ws) {
    ws.clientID = null;

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
                console.table(clients);
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
        console.table(clients);

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


// cron deez nuts
const secondSaveCron = new CronJob(
    '* * * * * *', // every second
    async function() {
        const write = data;
        if (write) {
            write_console('Saving   --S ' + write);
            await sql.write_json(db, 'seconds', write);
        }
    },
    null,
    true,
    'America/New_York'
);
const minuteSaveCron = new CronJob(
    '* * * * *', // every minute
    async function() {
        const write = data;
        if (write) {
            write_console('Saving   --M ' + write);
            await sql.write_json(db, 'minutes', write);
        }
    },
    null,
    true,
    'America/New_York'
);
const hourSaveCron = new CronJob(
    '0 * * * *', // every hour
    async function() {
        const write = data;
        if (write) {
            write_console('Saving   --H ' + write);
            await sql.write_json(db, 'hours', write);
        }
    },
    null,
    true,
    'America/New_York'
);

// data archival
const secondArchiveCron = new CronJob(
    '0 */6 * * *',  // every 6 hrs
    async function() {
        await sql.execute(db,  `INSERT OR IGNORE INTO archive.seconds SELECT * FROM main.seconds WHERE timestamp < DATETIME('now', '-6 hours')`)
        await sql.execute(db, `DELETE FROM seconds WHERE timestamp < DATETIME('now', '-6 hours')`);
    },
    null,
    true,
    'America/New_York'
);
const minuteArchiveCron = new CronJob(
    '0 0 */14 * *', // every 14 days
    async function() {
        await sql.execute(db, `INSERT OR IGNORE INTO archive.minutes SELECT * FROM main.minutes WHERE timestamp < DATETIME('now', '-14 days')`);
        await sql.execute(db, `DELETE FROM minutes WHERE timestamp < DATETIME('now', '-14 days')`);
    },
    null,
    true,
    'America/New_York'
);
const hourArchiveCron = new CronJob(
    '0 0 1 1 *', // Jan 1 00:00
    async function() {
        await sql.execute(db, `INSERT OR IGNORE INTO archive.hours SELECT * FROM main.hours WHERE timestamp < DATETIME('now', '-2 years')`);
        await sql.execute(db, `DELETE FROM hours WHERE timestamp < DATETIME('now', '-2 years')`)
    },
    null,
    true,
    'America/New_York'
);


// TO-DO: Add functionality to move data into archive

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