import { getTable} from "./api.js"
import { Graph } from "./graph.js";

const WS_URL = '127.0.0.1'

export const global = {
    data: null,
    connectionState: {
        server: true,
        esp32: true
    }
}
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

    try {
        client = new WebSocket(`ws://${WS_URL}:8080`);
    } catch (error) {
        console.error(error);
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
            if (global.connectionState.esp32) {
                global.connectionState.esp32 = false;
                connectionError();
            }
            return;
        }

        try {
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
function reconnect() {
    setTimeout(connect, 5000);
}



// fetch data to run on load to get intial values for graphs
async function fetchData(graphsObj) {
    // Attempts get request five times (idk why, if it didnt work first time prob not gonna work second time 1 ms after)
    console.log(`Initial GET request to all from Seconds`);
    for (let i = 0; i < 5; i++) {
        const dataArray = await getTable('seconds', 0);

        if (dataArray === null) {
            if (i === 4) {
                console.log("Server not responding");
                if (global.connectionState.server) {
                    global.connectionState.server = false;
                    connectionError();
                    reconnect();
                }
                break;
            }
            console.log("Failed request, retrying... Attempt:" + (i+1));
            continue;
        }

        const dataLength = dataArray.length;

        if (dataLength != 0) {
            for (let i = 0; i < dataLength; i++) {
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




// Create and initialize graphs
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
