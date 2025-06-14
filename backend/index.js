const WebSocket = require('ws');
const express = require('express');
const app = express();
const port = 8081;

// Create websocket connection to esp32
const wss = new WebSocket.Server({ port: 8080 });

// Gets messages
let data = "{}";
let repeat = 0;
wss.on('connection', function connection(ws) {

    console.log('Client connected');


    ws.on('message', function incoming(message) {
        if (String(message) == String(data)) {
            repeat += 1;
            process.stdout.write(`Received: ${message}} (x${repeat})   \r`);
        }
        else {
            data = message;
            repeat = 0;
            console.log(`Received: ${message}`);
        }
    });


    ws.on('close', function () {
        console.log('Client disconnected');
    });
});

app.use(express.json());
app.listen(port, () => {console.log(`Server is running on http://localhost:${port}`)});
app.get('/data', (req, res) => {
    res.json({
        response: `${data}`,
        success: true
    });
});