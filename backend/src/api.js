const express = require('express')
const app = express();
const port = 8082;
const sql = require('./sql.js');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database("./data/json_log.db", sqlite3.OPEN_READWRITE);


app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1'); // Or a specific origin
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});


app.get('/seconds-graph', async (req, res) => {
    const query = `SELECT * FROM seconds WHERE timestamp > DATETIME('now', '-16 seconds')`;

    try {
        const resData = await sql.fetchAll(db, query);
        res.status(200).send(resData);

    } catch (error) {
        console.error("DB error: ", err);
        res.status(500).send("Internal server error");
    }

})

app.listen(port, () => {
    console.log(`Express listening on http://localhost:${port}`)
})