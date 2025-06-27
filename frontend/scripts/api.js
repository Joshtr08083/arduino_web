const API_URL = "http://10.0.0.2/api"
export async function getTable(table, time) {
    const query = `${API_URL}/graph?time=${time}&table=${table}`;
    try {
        const response = await fetch(query, {
            method: 'GET'
        });

        const data = await response.json();

        if (data.success == true)  {
            console.log(`Received (${table}): ` + JSON.stringify(data));
            return data.response;
        }
        else return null;
        
    } catch (error) {

        console.error(error);
        return null;
    }
}
