import { getSeconds } from "./api.js"

let server_connected = false;
let esp32_connected = false;

const client = new WebSocket('ws://10.0.0.2:8080');

let data;

client.onopen = function(event) {
    server_connected = true;
    // Doesn't actually need real authentication, this will do
    // Note to self maybe add authentication idk not like it matters
    client.send("{\"id\":\"a\",\"auth\":\"a\"}");
};

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
    

    // Receives server data which it (hoepfully) got from esp32
    
    
    //console.log(data);
    try {
        document.getElementById("DHTTemp").innerHTML = `DHT Temp: ${(data.DHTTemp * 9/5 + 32)}°F`;
        document.getElementById("humid").innerHTML = `Humidity: ${data.Humid}%`;
        document.getElementById("temp").innerHTML = `Thermistor Temp: ${data.Temp}°F`;
        document.getElementById("light").innerHTML = `Light Sensor: ${data.Light}`;
        document.getElementById("dist").innerHTML = `Distance Sensor: ${data.Dist}cm`;
    } catch (error) {
        console.error("Sensor error: ", error);
    }

}



document.addEventListener("DOMContentLoaded", async (event) => {
    // Setup graph data
    const secondValues = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    let tempValues = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
    let lightValues = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
    let distValues = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];

    // Attempts get request five times
    // If all tries fail it throws error
    console.log("GET request to server for seconds graph")
    for (let i = 0; i < 5; i++) {
        const secondsDataArray = await getSeconds();
        if (secondsDataArray) {
            for (let i = 0; i < 15; i++) {
                tempValues[i] = secondsDataArray[i].data.Temp;
                lightValues[i] = secondsDataArray[i].data.Light;
                distValues[i] = (secondsDataArray[i].data.Dist < 200) ? secondsDataArray[i].data.Dist : null;
            }
            break;
        }
        else if (i == 4) {
            
            server_connected = false;
            break;
        }
        console.log("Failed to connect, retrying...");
    }
    

    const tempChart = new Chart("tempChart", {
        type: "line",
        data: {
            labels: secondValues,
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

    const lightChart = new Chart("lightChart", {
        type: "line",
        data: {
            labels: secondValues,
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
                ticks: {min: 300, max: 800},
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

    const distChart = new Chart("distChart", {
        type: "line",
        data: {
            labels: secondValues,
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
                ticks: {min: 0, max:70},
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

    const interval = setInterval(() => {
        if (!server_connected || !esp32_connected) {
            document.getElementById("main").style.filter = "blur(1.5rem)";
            document.getElementById("alert").style.visibility = "visible";
    
            document.getElementById("errorMsg").innerHTML = (!server_connected) ? "Unable to connect to server<br><br>Ensure server is up and refresh" : "ESP32 not responding";
            
        } else {
            document.getElementById("main").style.filter = "blur(0)";
            document.getElementById("alert").style.visibility = "hidden";
        }
        // Temp chart update
        tempValues.push(data.Temp);
        tempValues.shift();
        tempChart.data.datasets[0].data = tempValues;
        tempChart.update();
    
        // Light chart update
        lightValues.push(data.Light);
        lightValues.shift();
        lightChart.data.datasets[0].data = lightValues;
        lightChart.update();
    
        if (data.Dist > 200) {
            // Dist chart update
            distValues.push(null);
            distValues.shift();
            distChart.data.datasets[0].data = distValues;
            distChart.update();
        } else {
            // Dist chart update
            distValues.push(data.Dist);
            distValues.shift();
            distChart.data.datasets[0].data = distValues;
            distChart.update();
        }
    
    
    }, 1000);
})



