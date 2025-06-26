const API_URL = "http://127.0.0.1:8082/api"
export async function getSeconds() {
    const query = `${API_URL}/seconds-graph`;
    try {
        const response = await fetch(query, {
            method: 'GET'
        });

        const data = await response.json();

        if (data.success == true)  {
            console.log("Received: " + JSON.stringify(data));
            return data.response;
        }
        else return null;
        
    } catch (error) {

        console.error(error);
        return null;
    }
}