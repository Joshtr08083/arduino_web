const api_url = "http://192.168.86.23:8081";

async function getData() {
    const query = `${api_url}/data`;
    try {
        const response = await fetch(query, {
            method: 'GET',
            headers: {
                'Content-Type' : 'application/json'
            }
        });

        const data = await response.json();
        if (data.success) {
            return data.response;
        }
        return null;

    } catch (error) {
        console.error(`${error}`);
        return null;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    while(true) {
        const data = JSON.parse(await getData());
        
        console.log("Temperature: " + (data.Temp * 9/5 + 32) + "°F");
        console.log("Humidity: " + data.Humid + "%");
        document.getElementById("Temp").innerHTML = `Temperature: ${(data.Temp * 9/5 + 32)}°F`;
        document.getElementById("Humid").innerHTML = `Humidity: ${data.Humid}%`;
        await new Promise(r => setTimeout(r, 3000));
    }
});