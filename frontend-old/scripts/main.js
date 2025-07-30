import { getTable} from "./api.js?v=2.6";
import { Graph } from "./graph.js?v=2.6";
import { global } from "./globals.js?v=2.6";

// Websocket client
let client;

function connectionError() {
    const connected = global.connectionState.server && global.connectionState.esp32;

    if (connected) {
        document.getElementById("main").style.filter = "blur(0)";
        document.getElementById("alert").style.visibility = "hidden";

    } else {

        document.getElementById("main").style.filter = "blur(1.5rem)";
        document.getElementById("alert").style.visibility = "visible";

        const error = !global.connectionState.server ? "Unable to connect to server<br><br>Attempting reconnect..." : "Unable to connect to ESP32<br><br>Waiting for ESP32..."

        document.getElementById("errorMsg").innerHTML = error;
    }

    
}
// Start websocket connection
function connect() {
    console.log("Connecting to websocket...");
    try {
        client = new WebSocket(global.WS_URL);

    } catch (error) {
        console.error(error);
        // atempts reconnect on fail
        if (global.connectionState.server) {
            global.connectionState.esp32 = false;
            connectionError();
            reconnect();
        }
        
    }
    
    // Websocket client functions
    client.onopen = function(event) {
        // Note to self: probably maybe possibly if you feel like it add proper authentication
        client.send("{\"id\":\"a\",\"auth\":\"a\"}");
        if (!global.connectionState.server) {
            global.connectionState.server = true;
            connectionError();
        }
        
    }

    client.onclose = function(event) {
        // Sets server state to false and reconnects
        if (global.connectionState.server) {
            global.connectionState.server = false;
            connectionError()
            reconnect();
        }
    }

    client.onmessage = async function(event) {
        try {
            if (!global.connectionState.esp32) {
                global.connectionState.esp32 = true;
                connectionError();
            }
            const text = await event.data.text();
            global.data = JSON.parse(text);

        } catch (error) {
            // Puts esp32 fail message on screen
            if (global.connectionState.esp32) {
                global.connectionState.esp32 = false;
                connectionError();
            }
            return;
        }

        try {
            // Updates DOM text
            document.getElementById("temp").innerHTML = `SHT41 Temp: ${global.data.temp}°F`;
            document.getElementById("humid").innerHTML = `SHT41 Humidity: ${global.data.humid}% rH`;
            document.getElementById("press").innerHTML = `LPS22 Pressure: ${global.data.press} hPa`;
            document.getElementById("light").innerHTML = `Photoresistor: ${global.data.light}`;
            document.getElementById("dist").innerHTML = `Ultrasonic Transducer: ${global.data.dist}cm`;

        } catch (error) {
            console.error(error);
        }

    }

}
connect();
// Reconnect function that runs on a delay to reconnect every 5s
function reconnect() {
    setTimeout(connect, 5000);
}


// fetch data to run on load to get intial values for graphs
async function fetchData(graphsObj) {
    console.log(`Initial GET request to table Seconds for graphs ` + Object.keys(graphsObj));
    // Attempts get request five times (idk why, if it didnt work first time prob not gonna work second time 1 ms after)
    for (let i = 0; i < 5; i++) {
        // api request
        const dataArray = await getTable('seconds', 0);
        // Checks if null, retries or quits
        if (dataArray === null) {
            
            if (i === 4) {
                console.log("Server not responding");
                // Changes server to state to failed
                if (global.connectionState.server) {
                    global.connectionState.server = false;
                    connectionError();
                }
                break;
            }
            console.log("Failed request, retrying... Attempt:" + (i+1));
            continue;
        }
        
        const dataLength = dataArray.length;
        
        if (dataLength != 0) {
            for (let i = 0; i < dataLength; i++) {
                // Iterates through graph keys and sets each of their array values
                Object.keys(graphsObj).forEach((key) => {
                    try {
                        graphsObj[key][i + (15-dataLength)] = dataArray[i].data[key];

                    } catch (error) {
                        console.error(error);
                    }
                    
                });
            }
        }
        
        break;
    }
}

const graphs = {
    "temp": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    "light": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    "dist": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]
}   

// fetch data populates graph object with data from server if any
await fetchData(graphs);

// Define graphs using class 
const tempGraph = new Graph('temp', 'Time Elapsed', 'Temperature (F)', 'SHT41 Temp', {'low': 60, 'high': 80}, graphs.temp);
const lightGraph = new Graph('light', 'Time Elapsed', 'Light Value', 'Photoresistor', {'low': 0, 'high': 3000}, graphs.light);
const distGraph = new Graph('dist', 'Time Elapsed', 'Distance (cm)', 'Ultrasonic Transducer (Distance)', {'low': 0, 'high': 160}, graphs.dist);



