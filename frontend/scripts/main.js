import { getSeconds } from "./api.js"

let server_connected = false;
let esp32_connected = false;


const client = new WebSocket('ws://127.0.0.1:8080');
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
let data;
client.onmessage = async function(event) {
    try {
        const text = await event.data.text();
        data = JSON.parse(text);
        esp32_connected = true;
    } catch (error) {
        esp32_connected = false;
    }
    try {
        document.getElementById("DHTTemp").innerHTML = `DHT Temp: ${(data.DHTTemp * 9/5 + 32)}°F`;
        document.getElementById("humid").innerHTML = `Humidity: ${data.Humid}%`;
        document.getElementById("temp").innerHTML = `Thermistor Temp: ${data.Temp}°F`;
        document.getElementById("light").innerHTML = `Light Sensor: ${data.Light}`;
        document.getElementById("dist").innerHTML = `Distance Sensor: ${data.Dist}cm`;
    } catch (error) {
        console.error(error);
    }

}

// Setup graph data
let secondTempValues = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
let secondLightValues = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
let secondDistValues = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
let tempValues = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
let lightValues = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
let distValues = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];

// Fetch data for seconds graphs from server
async function fetchSecondsData(temp, light, dist) {
    // Attempts get request five times
    console.log("GET request to server for seconds graph")
    for (let i = 0; i < 5; i++) {
        const secondsDataArray = await getSeconds();
        if (secondsDataArray != null) {
            if (secondsDataArray.length != 0) {
                for (let i = 0; i < 15; i++) {
                    if (temp) tempValues[i] = secondsDataArray[i].data.Temp;
                    if (light) lightValues[i] = secondsDataArray[i].data.Light;
                    if (dist) distValues[i] = (secondsDataArray[i].data.Dist < 200) ? secondsDataArray[i].data.Dist : null;
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

// Create charts
let tempChart;
let lightChart;
let distChart;
document.addEventListener("DOMContentLoaded", async (event) => {

    await fetchSecondsData(true, true, true);
    
    tempChart = new Chart("tempChart", {
        type: "line",
        data: {
            labels: secondTempValues,
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
                ticks: {min: 70, max: 90},
                scaleLabel: {
                    display: true,
                    labelString: 'Temperature (F)'
                }
            }],
            xAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: "Time Elapsed (s)"
                }
            }]
            }
        }
    });
    
    lightChart = new Chart("lightChart", {
        type: "line",
        data: {
            labels: secondLightValues,
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
                    labelString: "Time Elapsed (s)"
                }
            }]
            }
        }
    });
    
    distChart = new Chart("distChart", {
        type: "line",
        data: {
            labels: secondDistValues,
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
                    labelString: "Time Elapsed (s)"
                }
            }]
            }
        }
    });

    // Update loop
    setInterval(() => {
        if (!server_connected || !esp32_connected) {
            document.getElementById("main").style.filter = "blur(1.5rem)";
            document.getElementById("alert").style.visibility = "visible";
    
            document.getElementById("errorMsg").innerHTML = (!server_connected) ? "Unable to connect to server<br><br>Ensure server is up and refresh" : "ESP32 not responding";
            
        } else {
            document.getElementById("main").style.filter = "blur(0)";
            document.getElementById("alert").style.visibility = "hidden";
        }
        // Temp chart update
        if (!tempPaused) {
            tempValues.push(data.Temp);
            tempValues.shift();
            tempChart.data.datasets[0].data = tempValues;
            tempChart.update();
        } else {
            secondTempValues.forEach((val, i) => {secondTempValues[i] = val+1});
            tempChart.data.labels = secondTempValues;
            tempChart.update();
        }

        if (!lightPaused) {
            // Light chart update
            lightValues.push(data.Light);
            lightValues.shift();
            lightChart.data.datasets[0].data = lightValues;
            lightChart.update();
        } else {
            secondLightValues.forEach((val, i) => {secondLightValues[i] = val+1});
            lightChart.data.labels = secondLightValues;
            lightChart.update();
        }

        if (!distPaused) {
            // Dist chart update
            distValues.push((data.Dist > 200) ? null : data.Dist);
            distValues.shift();
            distChart.data.datasets[0].data = distValues;
            distChart.update();
        } else {
            secondDistValues.forEach((val, i) => {secondDistValues[i] = val+1});
            distChart.data.labels = secondDistValues;
            distChart.update();
        }
        
    
    
    }, 1000);
})



document.getElementById('tempButton').addEventListener('click', tempClick);
let tempPaused = false;
async function tempClick() {
    tempPaused = !tempPaused;

    if (tempPaused) {
        document.getElementById('tempButtonText').innerHTML = "▷";
    } else {
        document.getElementById('tempButtonText').innerHTML = "||";
        await fetchSecondsData(true, false, false);
        tempChart.data.datasets[0].data = tempValues;
        secondTempValues = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
        tempChart.data.labels = secondTempValues;
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
        await fetchSecondsData(false, true, false);
        lightChart.data.datasets[0].data = lightValues;
        secondLightValues = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
        lightChart.data.labels = secondLightValues;
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
        await fetchSecondsData(false, false, true);
        distChart.data.datasets[0].data = distValues;
        secondDistValues = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
        distChart.data.labels = secondDistValues;
        distChart.update();
    }
}