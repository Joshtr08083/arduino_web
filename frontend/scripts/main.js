const client = new WebSocket('ws://127.0.0.1/api/ws');

let data;

client.onopen = function(event) {
    // Doesn't actually need real authentication, this will do
    // Note to self maybe add authentication idk not like it matters
    client.send("{\"id\":\"a\",\"auth\":\"a\"}");
};

client.onmessage = async function(event) {
    const text = await event.data.text();
    // Receives server data which it (hoepfully) got from esp32
    data = JSON.parse(text);

    //console.log(data);
    document.getElementById("DHTTemp").innerHTML = `DHT Temp: ${(data.DHTTemp * 9/5 + 32)}°F`;
    document.getElementById("humid").innerHTML = `Humidity: ${data.Humid}%`;
    document.getElementById("temp").innerHTML = `Thermistor Temp: ${data.Temp}°F`;
    document.getElementById("light").innerHTML = `Light Sensor: ${data.Light}`;
    document.getElementById("dist").innerHTML = `Distance Sensor: ${data.Dist}cm`;
}


const xValues = [50,60,70,80,90,100,110,120,130,140,150];
const yValues = [7,8,8,9,9,9,10,11,14,14,15];

const tempChart = new Chart("tempChart", {
    type: "line",
    data: {
        labels: xValues,
        datasets: [{
            backgroundColor:"rgba(29, 27, 38, 0.44)",
            borderColor: "rgba(0,0,255,0.1)",
            data: yValues
        }]
    },
    options: {
        legend: {display: false},
        scales: {
          yAxes: [{ticks: {min: 6, max:16}}],
        },
        plugins: {
            title: {
                display: true,
                text: 'Thermsistor Temp',
            }
        }
    }
});