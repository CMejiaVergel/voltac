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

      -- TABLAS MÓDULO ACCOUNTING
      CREATE TABLE IF NOT EXISTS acc_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        parent_id INTEGER,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY(parent_id) REFERENCES acc_accounts(id)
      );

      CREATE TABLE IF NOT EXISTS acc_clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        document_type TEXT,
        document_number TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        tax_regime TEXT,
        notes TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS acc_suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        document_type TEXT,
        document_number TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        category TEXT,
        bank_account TEXT,
        notes TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS acc_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        date DATETIME NOT NULL,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'COP',
        category_id INTEGER,
        account_id INTEGER,
        description TEXT NOT NULL,
        payment_method TEXT,
        status TEXT DEFAULT 'Completado',
        attachment_url TEXT,
        reference_id TEXT,
        reference_type TEXT,
        notes TEXT,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(account_id) REFERENCES acc_accounts(id)
      );

      CREATE TABLE IF NOT EXISTS acc_invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number TEXT NOT NULL,
        type TEXT NOT NULL,
        third_party_id INTEGER NOT NULL,
        issue_date DATETIME NOT NULL,
        due_date DATETIME NOT NULL,
        currency TEXT DEFAULT 'COP',
        subtotal REAL NOT NULL,
        discount REAL DEFAULT 0,
        tax_total REAL DEFAULT 0,
        total REAL NOT NULL,
        status TEXT DEFAULT 'Borrador',
        notes TEXT,
        terms TEXT,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS acc_invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit_price REAL NOT NULL,
        discount_pct REAL DEFAULT 0,
        tax_id INTEGER,
        total REAL NOT NULL,
        FOREIGN KEY(invoice_id) REFERENCES acc_invoices(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS acc_quotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number TEXT NOT NULL,
        client_id INTEGER NOT NULL,
        issue_date DATETIME NOT NULL,
        expiry_date DATETIME NOT NULL,
        currency TEXT DEFAULT 'COP',
        subtotal REAL NOT NULL,
        discount REAL DEFAULT 0,
        tax_total REAL DEFAULT 0,
        total REAL NOT NULL,
        status TEXT DEFAULT 'Borrador',
        version INTEGER DEFAULT 1,
        converted_invoice_id INTEGER,
        FOREIGN KEY(client_id) REFERENCES acc_clients(id)
      );

      CREATE TABLE IF NOT EXISTS acc_calendar_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        date DATETIME NOT NULL,
        time TEXT,
        description TEXT,
        recurrence TEXT DEFAULT 'none',
        linked_id TEXT,
        linked_type TEXT,
        alert_days TEXT DEFAULT '[]',
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS acc_webhook_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event TEXT NOT NULL,
        payload TEXT NOT NULL,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT NOT NULL,
        response_code INTEGER,
        error_message TEXT
      );

      CREATE TABLE IF NOT EXISTS acc_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        date DATETIME NOT NULL,
        amount REAL NOT NULL,
        method TEXT NOT NULL,
        reference TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(invoice_id) REFERENCES acc_invoices(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS acc_quote_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quote_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit_price REAL NOT NULL,
        discount_pct REAL DEFAULT 0,
        tax_id INTEGER,
        total REAL NOT NULL,
        FOREIGN KEY(quote_id) REFERENCES acc_quotes(id) ON DELETE CASCADE
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

    // Migrate acc_quotes — add columns that may not exist on pre-existing DBs
    const accQuoteCols = await db.all("PRAGMA table_info(acc_quotes)");
    const accQuoteColNames = accQuoteCols.map((c: any) => c.name);
    const accQuoteMigrations: string[] = [];
    if (!accQuoteColNames.includes('converted_invoice_id'))
      accQuoteMigrations.push("ALTER TABLE acc_quotes ADD COLUMN converted_invoice_id INTEGER;");
    if (!accQuoteColNames.includes('version'))
      accQuoteMigrations.push("ALTER TABLE acc_quotes ADD COLUMN version INTEGER DEFAULT 1;");
    for (const q of accQuoteMigrations) { await db.exec(q); }

    // Migrate acc_invoices — ensure notes and terms columns exist
    const accInvCols = await db.all("PRAGMA table_info(acc_invoices)");
    const accInvColNames = accInvCols.map((c: any) => c.name);
    const accInvMigrations: string[] = [];
    if (!accInvColNames.includes('notes'))
      accInvMigrations.push("ALTER TABLE acc_invoices ADD COLUMN notes TEXT;");
    if (!accInvColNames.includes('terms'))
      accInvMigrations.push("ALTER TABLE acc_invoices ADD COLUMN terms TEXT;");
    for (const q of accInvMigrations) { await db.exec(q); }

    // Migrate acc_calendar_events — add priority and color columns
    const accCalCols = await db.all("PRAGMA table_info(acc_calendar_events)");
    const accCalColNames = accCalCols.map((c: any) => c.name);
    if (!accCalColNames.includes('priority'))
      await db.exec("ALTER TABLE acc_calendar_events ADD COLUMN priority TEXT DEFAULT 'Media';");
    if (!accCalColNames.includes('color'))
      await db.exec("ALTER TABLE acc_calendar_events ADD COLUMN color TEXT;");


    const keys = await db.all('SELECT * FROM api_keys');
    if (keys.length === 0) {
      await db.exec(`INSERT INTO api_keys (key, name) VALUES ('voltac_sk_default123', 'Default Key')`);
    }

    // Seed base para plan de cuentas
    const accountsCount = await db.get('SELECT COUNT(*) as count FROM acc_accounts');
    if (accountsCount && accountsCount.count === 0) {
      await db.exec(`
        INSERT INTO acc_accounts (code, name, type) VALUES 
        ('1', 'Activo', 'Activo'),
        ('11', 'Efectivo y Equivalentes', 'Activo'),
        ('13', 'Deudores (Cuentas por Cobrar)', 'Activo'),
        ('2', 'Pasivo', 'Pasivo'),
        ('21', 'Obligaciones Financieras', 'Pasivo'),
        ('22', 'Proveedores (Cuentas por Pagar)', 'Pasivo'),
        ('24', 'Impuestos por Pagar', 'Pasivo'),
        ('3', 'Patrimonio', 'Patrimonio'),
        ('31', 'Capital Social', 'Patrimonio'),
        ('4', 'Ingresos', 'Ingreso'),
        ('41', 'Ingresos Operacionales', 'Ingreso'),
        ('5', 'Gastos', 'Egreso'),
        ('51', 'Gastos de Administración', 'Egreso'),
        ('52', 'Gastos de Ventas', 'Egreso'),
        ('6', 'Costos de Ventas', 'Costo');
      `);
    }
  }
  return db;
}
