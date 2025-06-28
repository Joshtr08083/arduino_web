const sqlite3 = require('sqlite3').verbose();
const sql = require('./sql.js');
const path = require('path');

const DB_PATH =  path.join(__dirname, 'data');
const main = async () => {
    const db = new sqlite3.Database(path.join(DB_PATH, 'json_log.db'));

    try {
        // WAL mode
        await sql.execute (
            db,
            `PRAGMA journal_mode=WAL;`
        );
        console.log("json_log.db: Enabled WAL mode");

        // Create seconds table
        await sql.execute (
            db,
            `CREATE TABLE IF NOT EXISTS seconds (
                timestamp DATETIME PRIMARY KEY,
                data TEXT CHECK (json_valid(data))
            )`
        );

        console.log("json_log.db: Created seconds table if not exists");

        await sql.execute (
            db,
            `CREATE TABLE IF NOT EXISTS minutes (
                timestamp DATETIME PRIMARY KEY,
                data TEXT CHECK (json_valid(data))
            )`
        );
        console.log("json_log.db: Created minutes table if not exists");

        await sql.execute (
            db,
            `CREATE TABLE IF NOT EXISTS hours (
                timestamp DATETIME PRIMARY KEY,
                data TEXT CHECK (json_valid(data))
            )`
        );
        console.log("json_log.db: Created hours table if not exists");


        await sql.execute(
            db,
            `CREATE INDEX IF NOT EXISTS idx_seconds_timestamp ON seconds(timestamp);
             CREATE INDEX IF NOT EXISTS idx_minutes_timestamp ON minutes(timestamp);
             CREATE INDEX IF NOT EXISTS idx_hours_timestamp ON hours(timestamp);
            `
        );
        console.log("json_log.db: Created indexes for 3 tables")


        // Archive db (for old data)

        console.log("-- Initializing archival database --");

        // Add archive to main db
        await sql.execute (
            db,
            `ATTACH "${path.join(DB_PATH, 'archive.db')}" AS archive`
        );
        console.log("json_log.db: attached archive.db\n             path: " + path.join(DB_PATH, 'archive.db'));

        await sql.execute(
            db,
            `PRAGMA archive.journal_mode=DELETE;`
        )
        console.log("archive.db: Disabled WAL mode");

        // Create seconds table
        await sql.execute (
            db,
            `CREATE TABLE IF NOT EXISTS archive.seconds (
                timestamp DATETIME PRIMARY KEY,
                data TEXT CHECK (json_valid(data))
            )`
        );
        console.log("archive.db: Created seconds table if not exists");
        // Minutes table
        await sql.execute (
            db,
            `CREATE TABLE IF NOT EXISTS archive.minutes (
                timestamp DATETIME PRIMARY KEY,
                data TEXT CHECK (json_valid(data))
            )`
        );
        console.log("archive.db: Created minutes table if not exists");
        // Hours table
        await sql.execute (
            db,
            `CREATE TABLE IF NOT EXISTS archive.hours (
                timestamp DATETIME PRIMARY KEY,
                data TEXT CHECK (json_valid(data))
            )`
        );
        console.log("archive.db: Created hours table if not exists");

        
    } catch (error) {
        console.error(error);
    } finally {
        db.close();
    }
}

main();