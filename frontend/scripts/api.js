import { global } from "./globals.js?v=2.6";

export async function getTable(table, time) {
    const query = `${global.API_URL}/api/graph?time=${time}&table=${table}`;
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
