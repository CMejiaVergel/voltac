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
        fullName TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        company TEXT,
        budget TEXT,
        requirement TEXT,
        message TEXT,
        stage TEXT DEFAULT 'Nuevo Prospecto',
        status TEXT DEFAULT 'Pendiente de contacto',
        priority TEXT DEFAULT 'Media',
        assignedTo TEXT,
        followUpDate DATETIME,
        projectType TEXT,
        source TEXT DEFAULT 'Web',
        tags TEXT DEFAULT '[]',
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
        title TEXT NOT NULL,
        techType TEXT NOT NULL,
        challenge TEXT NOT NULL,
        solution TEXT NOT NULL,
        metrics TEXT DEFAULT '[]',
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
    if (!columnNames.includes('status')) alterQueries.push("ALTER TABLE quotes ADD COLUMN status TEXT DEFAULT 'Pendiente de contacto';");
    if (!columnNames.includes('priority')) alterQueries.push("ALTER TABLE quotes ADD COLUMN priority TEXT DEFAULT 'Media';");
    if (!columnNames.includes('followUpDate')) alterQueries.push("ALTER TABLE quotes ADD COLUMN followUpDate DATETIME;");
    if (!columnNames.includes('assignedTo')) alterQueries.push("ALTER TABLE quotes ADD COLUMN assignedTo TEXT;");
    if (!columnNames.includes('projectType')) alterQueries.push("ALTER TABLE quotes ADD COLUMN projectType TEXT;");

    for (const q of alterQueries) {
      await db.exec(q);
    }

    const keys = await db.all('SELECT * FROM api_keys');
    if (keys.length === 0) {
      await db.exec(`INSERT INTO api_keys (key, name) VALUES ('voltac_sk_default123', 'Default Key')`);
    }
  }
  return db;
}
