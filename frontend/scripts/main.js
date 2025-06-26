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
let tempIntervals = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
let tempLight = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
let tempDist = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
let tempValues = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
let lightValues = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
let distValues = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];

// Fetch data for seconds graphs from server
async function fetchData(mode, temp, light, dist) {
    // Attempts get request five times
    console.log(`GET request to ${mode} graph`)
    for (let i = 0; i < 5; i++) {
        let secondsDataArray;
        switch (mode) {
            case "sec":
                secondsDataArray = await getTable('seconds');
                break;
            case "min":
                secondsDataArray = await getTable('minutes');
                break;
            case "hr":
                secondsDataArray = await getTable('hours');
                break;
            default:
                console.error("Unknown table mode");
                return;
        }

        const dataLength = secondsDataArray.length;
        if (secondsDataArray != null) {
            if (temp) tempValues = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
            if (light) lightValues = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
            if (dist) distValues = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];

            if (dataLength != 0) {
                for (let i = 0; i < dataLength; i++) {
                    if (temp) tempValues[i + (15-dataLength)] = secondsDataArray[i].data.temp;
                    if (light) lightValues[i + (15-dataLength)] = secondsDataArray[i].data.light;
                    if (dist) distValues[i + (15-dataLength)] = (secondsDataArray[i].data.dist < 200) ? secondsDataArray[i].data.dist : null;
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
await fetchData("sec", true, true, true);

const tempChart = new Chart("tempChart", {
    type: "line",
    data: {
        labels: tempIntervals,
        datasets: [{
            backgroundColor:"rgba(29, 27, 38, 0.44)",
            borderColor: "rgba(29, 27, 38, 0.37)",
            data: tempValues,
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
            ticks: {min: 75, max: 85},
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
const lightChart = new Chart("lightChart", {
    type: "line",
    data: {
        labels: tempLight,
        datasets: [{
            backgroundColor:"rgba(29, 27, 38, 0.44)",
            borderColor: "rgba(29, 27, 38, 0.37)",
            data: lightValues,
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
            ticks: {min: 300, max: 4000},
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
const distChart = new Chart("distChart", {
    type: "line",
    data: {
        labels: tempDist,
        datasets: [{
            backgroundColor:"rgba(29, 27, 38, 0.44)",
            borderColor: "rgba(29, 27, 38, 0.37)",
            data: distValues,
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
            ticks: {min: 0, max:90},
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
function updateTemp() {
    if (!tempPaused) {
        tempValues.push(data.temp);
        tempValues.shift();
        tempChart.data.datasets[0].data = tempValues;
        tempChart.update();
    } else {
        tempIntervals.forEach((val, i) => {tempIntervals[i] = val+1});
        tempChart.data.labels = tempIntervals;
        tempChart.update();
    }
}
function updateLight() {
    if (!lightPaused) {
        // Light chart update
        lightValues.push(data.light);
        lightValues.shift();
        lightChart.data.datasets[0].data = lightValues;
        lightChart.update();
    } else {
        tempLight.forEach((val, i) => {tempLight[i] = val+1});
        lightChart.data.labels = tempLight;
        lightChart.update();
    }
}
function updateDist() {
    if (!distPaused) {
        // Dist chart update
        distValues.push((data.dist > 200) ? null : data.dist);
        distValues.shift();
        distChart.data.datasets[0].data = distValues;
        distChart.update();
    } else {
        tempDist.forEach((val, i) => {tempDist[i] = val+1});
        distChart.data.labels = tempDist;
        distChart.update();
    }
}

// Doesn't really do much, just checks if server and esp32 are still valid
const update = setInterval(() => {
    if (!server_connected || !esp32_connected) {
        // reconnects every 5s
        reconnect = setInterval(connect, 5000);
        document.getElementById("main").style.filter = "blur(1.5rem)";
        document.getElementById("alert").style.visibility = "visible";

        document.getElementById("errorMsg").innerHTML = (!server_connected) ? "Unable to connect to server<br><br>Ensure server is up and refresh" : "ESP32 not responding";
        
    } else {
        document.getElementById("main").style.filter = "blur(0)";
        document.getElementById("alert").style.visibility = "hidden";
        
    }
}, 1000);


// Creates updates cycles for graphs
let tempUpdate = setInterval(updateTemp, 1000);

let lightUpdate = setInterval(updateLight, 1000);

let distUpdate = setInterval(updateDist, 1000);


// Following lines are a lot of copy-pasted code (ik theres a lot above too but this ones really bad)
// In the future i want to clean these up

// Pausing functionality
document.getElementById('tempButton').addEventListener('click', tempClick);
let tempPaused = false;
async function tempClick() {
    tempPaused = !tempPaused;

    if (tempPaused) {
        document.getElementById('tempButtonText').innerHTML = "▷";
    } else {
        document.getElementById('tempButtonText').innerHTML = "||";
        await fetchData(tempMode, true, false, false);
        tempChart.data.datasets[0].data = tempValues;
        tempIntervals = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
        tempChart.data.labels = tempIntervals;
        tempChart.update();
    }
}

document.getElementById('lightButton').addEventListener('click', lightClick);
let lightPaused = false;
async function lightClick() {
    lightPaused = !lightPaused;

    if (lightPaused) {
        document.getElementById('lightButtonText').innerHTML = "▷";
    } else {
        document.getElementById('lightButtonText').innerHTML = "||";
        await fetchData(lightMode, false, true, false);
        lightChart.data.datasets[0].data = lightValues;
        tempLight = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
        lightChart.data.labels = tempLight;
        lightChart.update();
    }
}

document.getElementById('distButton').addEventListener('click', distClick);
let distPaused = false;
async function distClick() {
    distPaused = !distPaused;

    if (distPaused) {
        document.getElementById('distButtonText').innerHTML = "▷";
    } else {
        document.getElementById('distButtonText').innerHTML = "||";
        await fetchData(distMode, false, false, true);
        distChart.data.datasets[0].data = distValues;
        tempDist = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
        distChart.data.labels = tempDist;
        distChart.update();
    }
}





// Change intervals for temp
document.getElementById('tempSeconds').addEventListener('click', tempSeconds);
let tempMode = "sec";
async function tempSeconds() {
    clearInterval(tempUpdate);
    document.getElementById('tempDrop').innerHTML = "Seconds";
    // Get recent seconds data
    tempMode = "sec";
    await fetchData("sec", true, false, false);
    tempChart.data.datasets[0].data = tempValues;
    tempChart.update();
    // Start interval
    tempUpdate = setInterval(updateTemp, 1000);
}

document.getElementById('tempMinutes').addEventListener('click', tempMinutes);
async function tempMinutes() {
    clearInterval(tempUpdate);
    document.getElementById('tempDrop').innerHTML = "Minutes";
    tempMode = "min";
    await fetchData("min", true, false, false);
    tempChart.data.datasets[0].data = tempValues;
    tempChart.update();
    tempUpdate = setInterval(updateTemp, 60000);
}

document.getElementById('tempHours').addEventListener('click', tempHours);
async function tempHours() {
    clearInterval(tempUpdate);
    document.getElementById('tempDrop').innerHTML = "Hours";
    tempMode = "hr";
    await fetchData("hr", true, false, false);
    tempChart.data.datasets[0].data = tempValues;
    tempChart.update();
    tempUpdate = setInterval(updateTemp, 3600000);
}




// Change intervals for light
document.getElementById('lightSeconds').addEventListener('click', lightSeconds);
let lightMode = "sec";
async function lightSeconds() {
    clearInterval(lightUpdate);
    document.getElementById('lightDrop').innerHTML = "Seconds";
    lightMode = "sec";
    // Get recent seconds data
    await fetchData("sec", false, true, false);
    lightChart.data.datasets[0].data = lightValues;
    lightChart.update();
    // Start interval
    lightUpdate = setInterval(updateLight, 1000);
}

document.getElementById('lightMinutes').addEventListener('click', lightMinutes);
async function lightMinutes() {
    clearInterval(lightUpdate);
    document.getElementById('lightDrop').innerHTML = "Minutes";
    lightMode = "min";
    await fetchData("min", false, true, false);
    lightChart.data.datasets[0].data = lightValues;
    lightChart.update();
    lightUpdate = setInterval(updateLight, 60000);
}

document.getElementById('lightHours').addEventListener('click', lightHours);
async function lightHours() {
    clearInterval(lightUpdate);
    document.getElementById('lightDrop').innerHTML = "Hours";
    lightMode = "hr";
    await fetchData("hr", false, true, false);
    lightChart.data.datasets[0].data = lightValues;
    lightChart.update();
    lightUpdate = setInterval(updateDist, 3600000);
}





// Change intervals for dist
document.getElementById('distSeconds').addEventListener('click', distSeconds);
let distMode = "sec";
async function distSeconds() {
    clearInterval(distUpdate);
    document.getElementById('distDrop').innerHTML = "Seconds";
    distMode = "sec";
    // Get recent seconds data
    await fetchData("sec", false, false, true);
    distChart.data.datasets[0].data = distValues;
    distChart.update();
    // Start interval
    distUpdate = setInterval(updateDist, 1000);
}

document.getElementById('distMinutes').addEventListener('click', distMinutes);
async function distMinutes() {
    clearInterval(distUpdate);
    document.getElementById('distDrop').innerHTML = "Minutes";
    distMode = "min";
    await fetchData("min", false, false, true);
    distChart.data.datasets[0].data = distValues;
    distChart.update();
    distUpdate = setInterval(updateDist, 60000);
}

document.getElementById('distHours').addEventListener('click', distHours);
async function distHours() {
    clearInterval(distUpdate);
    document.getElementById('distDrop').innerHTML = "Hours";
    distMode = "hr";
    await fetchData("hr", false, false, true);
    distChart.data.datasets[0].data = distValues;
    distChart.update();
    distUpdate = setInterval(updateDist, 3600000);
}