const sqlite3 = require('sqlite3').verbose();
const sql = require('./sql.js');

const main = async () => {
    const db = new sqlite3.Database("./data/json_log.db");

    try {
        // WAL mode
        await sql.execute (
            db,
            `PRAGMA journal_mode=WAL;`
        );
        console.log("Enabled WAL mode");

        // Create seconds table
        await sql.execute (
            db,
            `CREATE TABLE IF NOT EXISTS seconds (
                timestamp DATETIME PRIMARY KEY,
                data TEXT CHECK (json_valid(data))
            )`
        );
        console.log("Created seconds table if not exists");

        await sql.execute (
            db,
            `CREATE TABLE IF NOT EXISTS minutes (
                timestamp DATETIME PRIMARY KEY,
                data TEXT CHECK (json_valid(data))
            )`
        );
        console.log("Created minutes table if not exists");

        await sql.execute (
            db,
            `CREATE TABLE IF NOT EXISTS hours (
                timestamp DATETIME PRIMARY KEY,
                data TEXT CHECK (json_valid(data))
            )`
        );
        console.log("Created hours table if not exists");
        
    } catch (error) {
        console.error(error);
    } finally {
        db.close();
    }
}

main();