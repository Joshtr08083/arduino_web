import { getTable } from "./api.js"

let server_connected = false;
let esp32_connected = false;

// Websocket client
let client;
let data;
// Reconnect interval (dont change value here it wont do anything)
let reconnect = setInterval(()=>{}, 99999);

function connect() {
    clearInterval(reconnect);
    reconnect = null;

    client = new WebSocket('ws://127.0.0.1:8080');
    // Websocket client functions
    client.onopen = function(event) {
        server_connected = true;
        // Doesn't actually need real authentication, this will do
        // Note to self maybe add authentication idk not like it matters
        client.send("{\"id\":\"a\",\"auth\":\"a\"}");
    }
    client.onclose = function(event) {
        server_connected = false;
    }
    client.onmessage = async function(event) {
        try {
            const text = await event.data.text();
            data = JSON.parse(text);
            esp32_connected = true;
        } catch (error) {
            esp32_connected = false;
        }
        try {
            document.getElementById("temp").innerHTML = `SHT41 Temp: ${data.temp}°F`;
            document.getElementById("humid").innerHTML = `SHT41 Humidity: ${data.humid}% rH`;
            document.getElementById("press").innerHTML = `LPS22 Pressure: ${data.press} hPa`;
            document.getElementById("light").innerHTML = `Photoresistor: ${data.light}`;
            document.getElementById("dist").innerHTML = `Ultrasonic Transducer: ${data.dist}cm`;
        } catch (error) {
            console.error(error);
        }

    }
}
connect();

// Setup graph data
let intervals = {
    "temp": [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    "light": [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    "dist": [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
}
let graphValues = {
    "temp": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    "light": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    "dist": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]
}

// Fetch data for seconds graphs from server
async function fetchData(mode, graph, time=0) {
    // Attempts get request five times
    console.log(`GET request to ${mode} graph`)
    for (let i = 0; i < 5; i++) {
        let secondsDataArray;
        switch (mode) {
            case "Seconds":
                secondsDataArray = await getTable('seconds', time);
                break;
            case "Minutes":
                secondsDataArray = await getTable('minutes', time);
                break;
            case "Hours":
                secondsDataArray = await getTable('hours', time);
                break;
            default:
                console.error("Unknown table mode");
                return;
        }

        const dataLength = secondsDataArray.length;
        if (secondsDataArray != null) {
            if (graph === "temp" || graph === "all") graphValues['temp'] = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
            if (graph === "light" || graph === "all") graphValues['light'] = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
            if (graph === "dist" || graph === "all") graphValues['dist'] = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];

            if (dataLength != 0) {
                for (let i = 0; i < dataLength; i++) {
                    if (graph === "temp" || graph === "all") graphValues['temp'][i + (15-dataLength)] = secondsDataArray[i].data.temp;
                    if (graph === "light" || graph === "all") graphValues['light'][i + (15-dataLength)] = secondsDataArray[i].data.light;
                    if (graph === "dist" || graph === "all") graphValues['dist'][i + (15-dataLength)] = (secondsDataArray[i].data.dist < 200) ? secondsDataArray[i].data.dist : null;
                }
            }
            break;
        }
        else if (i == 4) {
            console.log("Server not responding")
            server_connected = false;
            break;
        }
        console.log("Failed to connect, retrying...");
    }
}

// fetch data to load populate charts on load
await fetchData("Seconds", "all");

const charts = {"temp":null, "light":null, "dist":null};

charts["temp"] = new Chart("tempChart", {
    type: "line",
    data: {
        labels: intervals['temp'],
        datasets: [{
            backgroundColor:"rgba(29, 27, 38, 0.44)",
            borderColor: "rgba(29, 27, 38, 0.37)",
            data: graphValues['temp'],
            lineTension: 0.1
        }]
    },
    options: {
        legend: {display: false},
        title: {
            display: true,
            text: 'Thermsistor'
        },
        scales: {
        yAxes: [{
            ticks: {min: 60, max: 80},
            scaleLabel: {
                display: true,
                labelString: 'Temperature (F)'
            }
        }],
        xAxes: [{
            scaleLabel: {
                display: true,
                labelString: "Time Elapsed"
            }
        }]
        }
    }
});
charts["light"] = new Chart("lightChart", {
    type: "line",
    data: {
        labels: intervals['light'],
        datasets: [{
            backgroundColor:"rgba(29, 27, 38, 0.44)",
            borderColor: "rgba(29, 27, 38, 0.37)",
            data: graphValues['light'],
            lineTension: 0.1
        }]
    },
    options: {
        legend: {display: false},
        title: {
            display: true,
            text: 'Photoresistor'
        },
        scales: {
        yAxes: [{
            ticks: {min: 0, max: 3000},
            scaleLabel: {
                display: true,
                labelString: 'Light Value'
            }
        }],
        xAxes: [{
            scaleLabel: {
                display: true,
                labelString: "Time Elapsed"
            }
        }]
        }
    }
});
charts["dist"] = new Chart("distChart", {
    type: "line",
    data: {
        labels: intervals['dist'],
        datasets: [{
            backgroundColor:"rgba(29, 27, 38, 0.44)",
            borderColor: "rgba(29, 27, 38, 0.37)",
            data: graphValues['dist'],
            lineTension: 0.1
        }]
    },
    options: {
        legend: {display: false},
        title: {
            display: true,
            text: 'Ultrasonic Sensor'
        },
        scales: {
        yAxes: [{
            ticks: {min: 0, max:160},
            scaleLabel: {
                display: true,
                labelString: 'Distance (cm)'
            }
        }],
        xAxes: [{
            scaleLabel: {
                display: true,
                labelString: "Time Elapsed"
            }
        }]
        }
    }
});

// Update graph functions
const updateFunction = {
    "temp": () => {
        if (!paused['temp']) {
            graphValues['temp'].push(data.temp);
            graphValues['temp'].shift();
            charts["temp"].data.datasets[0].data = graphValues['temp'];
            charts["temp"].update();
        } 
        else {
            intervals['temp'].forEach((val, i) => {intervals['temp'][i] = val+1});
            charts["temp"].data.labels = intervals['temp'];
            charts["temp"].update();
        }
    },
    "light": () => {
        if (!paused['light']) {
            // Light chart update
            graphValues['light'].push(data.light);
            graphValues['light'].shift();
            charts["light"].data.datasets[0].data = graphValues['light'];
            charts["light"].update();
        } else {
            intervals['light'].forEach((val, i) => {intervals['light'][i] = val+1});
            charts["light"].data.labels = intervals['light'];
            charts["light"].update();
        }
    },
    "dist": () => {
        if (!paused['dist']) {
            // Dist chart update
            graphValues['dist'].push((data.dist > 200) ? null : data.dist);
            graphValues['dist'].shift();
            charts["dist"].data.datasets[0].data = graphValues['dist'];
            charts["dist"].update();
        } else {
            intervals['dist'].forEach((val, i) => {intervals['dist'][i] = val+1});
            charts["dist"].data.labels = intervals['dist'];
            charts["dist"].update();
        }
    }
}


// Doesn't really do much, just checks if server and esp32 are still valid
setInterval(() => {
    if (!server_connected || !esp32_connected) {
        // reconnects every 5s
        if (!server_connected && reconnect == null) {
            reconnect = setInterval(connect, 5000)
        };
        document.getElementById("main").style.filter = "blur(1.5rem)";
        document.getElementById("alert").style.visibility = "visible";

        document.getElementById("errorMsg").innerHTML = (!server_connected) ? "Unable to connect to server<br><br>Ensure server is up and refresh" : "ESP32 not responding";
        
    } else {
        document.getElementById("main").style.filter = "blur(0)";
        document.getElementById("alert").style.visibility = "hidden";
        
    }
}, 1000);


// Creates updates cycles for graphs
let updates = {
    "temp": setInterval(updateFunction['temp'], 1000),
    "light": setInterval(updateFunction['light'], 1000),
    "dist": setInterval(updateFunction['dist'], 1000)
}

// Pausing functionality
let paused = {'temp' : false, 'light' : false, 'dist' : false}
document.getElementById('tempButton').addEventListener('click', () => {pause("temp")});
document.getElementById('lightButton').addEventListener('click', () => {pause('light')});
document.getElementById('distButton').addEventListener('click', () => {pause('dist')});
// Pause function
async function pause(graph) {
    paused[graph] = !paused[graph];

    if (paused[graph]) {
        document.getElementById(`${graph}ButtonText`).innerHTML = "▷";
        document.getElementById(`${graph}TimeLeft`).classList.remove('hide');
        document.getElementById(`${graph}Drop`).disabled = true;

    } else {
        document.getElementById(`${graph}Drop`).disabled = false;
        document.getElementById(`${graph}ButtonText`).innerHTML = "||";
        document.querySelectorAll(`.${graph}Time`).forEach((element) => {element.classList.add('hide')});
        times[graph] = 0;
        await fetchData(graphModes[graph], graph);
        charts[graph].data.datasets[0].data = graphValues[graph];
        intervals[graph] = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
        charts[graph].data.labels = intervals[graph];
        charts[graph].update();
    }

}


// Track interval modes
let graphModes = {
    'temp': "Seconds",
    'light': "Seconds",
    'dist': "Seconds"
}
// Change intervals for temp
document.getElementById('tempSeconds').addEventListener('click', () => {changeInterval("temp", "Seconds")});
document.getElementById('tempMinutes').addEventListener('click', () => {changeInterval("temp","Minutes")});
document.getElementById('tempHours').addEventListener('click',   () => {changeInterval("temp", "Hours")});

// Change intervals for light
document.getElementById('lightSeconds').addEventListener('click', () => {changeInterval("light", "Seconds")});
document.getElementById('lightMinutes').addEventListener('click', () => {changeInterval("light", "Minutes")});
document.getElementById('lightHours').addEventListener('click',   () => {changeInterval("light", "Hours")});

// Change intervals for dist
document.getElementById('distSeconds').addEventListener('click', () => {changeInterval("dist", "Seconds")});
document.getElementById('distMinutes').addEventListener('click', () => {changeInterval("dist", "Minutes")});
document.getElementById('distHours').addEventListener('click',   () => {changeInterval("dist", "Hours")});

async function changeInterval(graph, mode) {
    document.getElementById(`${graph}Drop`).innerHTML = mode;
    clearInterval(updates[graph]);
    graphModes[graph] = mode;
    await fetchData(mode, graph);
    charts[graph].data.datasets[0].data = graphValues[graph];
    charts[graph].update();
    updates[graph] = setInterval(updateFunction[graph], (mode === "Seconds") ? 1000 : (mode === "Minutes") ? 60000 : (mode === "Hours") ? 3600000 : 1000);
}

// Tracks timeline
let times = {
    "temp":0,
    "light": 0,
    "dist": 0
}
// temp timeline buttons
document.getElementById('tempTimeLeft').addEventListener('click', ()=>{timeline('temp', 'left')});
document.getElementById('tempTimeRight').addEventListener('click', ()=>{timeline('temp', 'right')});
// light timeline buttons
document.getElementById('lightTimeLeft').addEventListener('click', ()=>{timeline('light', 'left')});
document.getElementById('lightTimeRight').addEventListener('click', ()=>{timeline('light', 'right')});
// light timeline buttons
document.getElementById('distTimeLeft').addEventListener('click', ()=>{timeline('dist', 'left')});
document.getElementById('distTimeRight').addEventListener('click', ()=>{timeline('dist', 'right')});

// temperature timeline
async function timeline(graph, direction) {
    if (direction == 'left') {
        document.getElementById(`${graph}TimeRight`).classList.remove('hide');
        times[graph] += 1;
        intervals[graph].forEach((val, i) => {intervals[graph][i] = val+15});
        charts[graph].data.labels = intervals[graph];
        await fetchData(graphModes[graph], graph, times[graph]);
        charts[graph].data.datasets[0].data = graphValues[graph];
        charts[graph].update();


    } else if (direction == 'right') {
        if (times[graph] > 0) {
            if (times[graph] == 1) document.getElementById(`${graph}TimeRight`).classList.add('hide');
            times[graph] -= 1;
            intervals[graph].forEach((val, i) => {intervals[graph][i] = val-15});
            charts[graph].data.labels = intervals[graph];
            await fetchData(graphModes[graph], graph, times[graph]);
            charts[graph].data.datasets[0].data = graphValues[graph];
            charts[graph].update();
        }
    }
}
