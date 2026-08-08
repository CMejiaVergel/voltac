import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { join } from 'path';

let db: Database | null = null;

export async function getDB() {
  if (!db) {
    db = await open({
      filename: join(process.cwd(), 'voltac.db'),
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS quotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        modality TEXT NOT NULL,
        fullName TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        consumption REAL,
        address TEXT,
        installType TEXT,
        location TEXT,
        objective TEXT,
        gridType TEXT,
        message TEXT,
        filePath TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        isDeleted BOOLEAN DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quoteId INTEGER,
        content TEXT NOT NULL,
        author TEXT NOT NULL,
        isSystem BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(quoteId) REFERENCES quotes(id)
      );

      CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        power REAL NOT NULL,
        powerUnit TEXT NOT NULL,
        connectionType TEXT NOT NULL,
        status TEXT NOT NULL,
        dateExecuted TEXT NOT NULL,
        projectType TEXT NOT NULL,
        city TEXT NOT NULL,
        department TEXT NOT NULL,
        kwValue REAL NOT NULL,
        co2calc REAL NOT NULL,
        savingsCalc REAL NOT NULL,
        isPublished BOOLEAN DEFAULT 0,
        imageUrl TEXT,
        gallery TEXT DEFAULT '[]',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS news_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        cuerpo TEXT NOT NULL,
        imagen_portada TEXT,
        keywords TEXT DEFAULT '[]',
        fuentes TEXT DEFAULT '',
        estado INTEGER DEFAULT 0,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_publicacion DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const columns = await db.all("PRAGMA table_info(quotes)");
    const columnNames = columns.map(c => c.name);
    
    const alterQueries = [];
    if (!columnNames.includes('stage')) alterQueries.push("ALTER TABLE quotes ADD COLUMN stage TEXT DEFAULT 'Nuevo';");
    if (!columnNames.includes('status')) alterQueries.push("ALTER TABLE quotes ADD COLUMN status TEXT DEFAULT 'Pendiente de contacto';");
    if (!columnNames.includes('followUpDate')) alterQueries.push("ALTER TABLE quotes ADD COLUMN followUpDate DATETIME;");
    if (!columnNames.includes('priority')) alterQueries.push("ALTER TABLE quotes ADD COLUMN priority TEXT DEFAULT 'Media';");
    if (!columnNames.includes('tags')) alterQueries.push("ALTER TABLE quotes ADD COLUMN tags TEXT DEFAULT '[]';");
    if (!columnNames.includes('assignedTo')) alterQueries.push("ALTER TABLE quotes ADD COLUMN assignedTo TEXT;");
    if (!columnNames.includes('projectType')) alterQueries.push("ALTER TABLE quotes ADD COLUMN projectType TEXT;");
    if (!columnNames.includes('source')) alterQueries.push("ALTER TABLE quotes ADD COLUMN source TEXT DEFAULT 'Web';");
    if (!columnNames.includes('isDeleted')) alterQueries.push("ALTER TABLE quotes ADD COLUMN isDeleted BOOLEAN DEFAULT 0;");

    for (const q of alterQueries) {
      await db.exec(q);
    }

    // Migrar columna gallery en projects si no existe
    const projCols = await db.all("PRAGMA table_info(projects)");
    const projColNames = projCols.map((c: any) => c.name);
    
    if (!projColNames.includes('gallery')) {
      await db.exec("ALTER TABLE projects ADD COLUMN gallery TEXT DEFAULT '[]';");
    }
    if (!projColNames.includes('reductionPercent')) {
      await db.exec("ALTER TABLE projects ADD COLUMN reductionPercent REAL DEFAULT 0;");
    }
    if (!projColNames.includes('roiRange')) {
      await db.exec("ALTER TABLE projects ADD COLUMN roiRange TEXT DEFAULT '';");
    }

    // Migrar news_entries
    const newsCols = await db.all("PRAGMA table_info(news_entries)");
    const newsColNames = newsCols.map((c: any) => c.name);
    if (!newsColNames.includes('fuentes')) {
      await db.exec("ALTER TABLE news_entries ADD COLUMN fuentes TEXT DEFAULT '';");
    }

    const keys = await db.all('SELECT * FROM api_keys');
    if (keys.length === 0) {
      await db.exec(`INSERT INTO api_keys (key, name) VALUES ('voltac_sk_default123', 'Default Key')`);
    }
  }
  return db;
}
