const client = new WebSocket('ws://192.168.86.23:8080');

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

    console.log(data);
    console.log("Temperature: " + (data.Temp * 9/5 + 32) + "°F");
    console.log("Humidity: " + data.Humid + "%");
    document.getElementById("DHTTemp").innerHTML = `DHT Temp: ${(data.DHTTemp * 9/5 + 32)}°F`;
    document.getElementById("Humid").innerHTML = `Humidity: ${data.Humid}%`;
    document.getElementById("Temp").innerHTML = `Thermistor Temp: ${data.Temp}°F`;
    document.getElementById("Light").innerHTML = `Light Sensor: ${data.Light}`;
    document.getElementById("Dist").innerHTML = `Distance Sensor: ${data.Dist}cm`;
}
