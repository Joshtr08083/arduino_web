const express = require('express')
const app = express();
const port = 8082;
const sql = require('./sql.js');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH =  path.join(__dirname, '..', 'data');
const db = new sqlite3.Database(path.join(DB_PATH, 'json_log.db'), sqlite3.OPEN_READWRITE);


app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

const tables = ['seconds', 'minutes', 'hours']

// getting graph data function
// maybe check for sql injection vulnerabilties
app.get('/api/graph', async (req, res) => {
    let query;
    if (tables.includes(req.query.table)) {
        query = `SELECT * FROM ${req.query.table} WHERE timestamp > DATETIME('now', '${-16 - (req.query.time * 16)} ${req.query.table}') AND timestamp < DATETIME('now', '${-16 * req.query.time} ${req.query.table}')`;
        console.log(query);
    } else {
        res.status(404).send("Unknown table");
        return;
    }


    try {
        const resData = await sql.fetchAll(db, query);
        res.status(200).send(`{\"success\":true, \"response\":${JSON.stringify(resData)}}`);

    } catch (error) {
        console.error("DB error: ", error);
        res.status(500).send("Internal server error");
    }

})


app.listen(port, '127.0.0.1', () => {
    console.log(`Express listening on http://localhost:${port}`)
})