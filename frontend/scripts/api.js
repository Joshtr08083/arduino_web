const API_URL = "http://10.0.0.2/api"
export async function getSeconds() {
    const query = `${API_URL}/seconds-graph`;
    try {
        const response = await fetch(query, {
            method: 'GET'
        });

        const data = await response.json();

        if (data)  return data;
        else return null;
        
    } catch (error) {

        console.error(error);
        return null;
    }
}