const execute = async (db, sql) => {
    return new Promise((resolve, reject) => {
        db.exec(sql, (err) => {
            if (err) reject (err);
            resolve();
        })
    });
};

const run = async (db, sql, params) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, (err) => {
            if (err) reject (err);
            resolve();
        })
    })
};

const fetchAll = async (db, sql) => {
    return new Promise((resolve, reject) => {
      db.all(sql, (err, rows) => {

        // Eror 
        if (err) return reject(err);

        const toString = rows.map(row => {
            // Some work has to be done to get the data column for some reason
            let data;

            try {
                // Parses row data
                const rowData = JSON.parse(row.data).data;
                // If succeeds than that means its (probably) a buffer data type
                data = Buffer.from(rowData).toString();
            } catch (error) {
                // Otherwise assumes its a regular string
                data = row.data;
            }
            
            // Verifies that the data is valid JSON
            try {
                data = JSON.parse(data);
            } catch (error) {
                console.error("Failed to parse data to JSON");
                data = {};
            }
            
            return {
                data: data
            };
        });
        resolve(toString);

      });
    });
};

const tables = ["seconds", "minutes", "hours"]

async function write_json(db, table, json) {
    try {
        JSON.parse(json);
    } catch (error) {
        console.error("Failed to parse json to sql");
        return;
    }

    try {
        const timestamp = new Date().toISOString();

        if (!tables.includes(table)) {
            console.error("Unknown table in write json");
            return;
        }
    
        await run(
            db, 
            `INSERT INTO "${table}" (timestamp, data) VALUES (datetime(?), ?)`,
            [timestamp, json]
        );

        
    } catch (error) {
        console.error(error);
    }

}

module.exports = {
    execute: execute,
    write_json: write_json,
    fetchAll : fetchAll
};