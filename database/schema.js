// database/schema.js - Estructura completa de la base de datos
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, 'dreamplay.db');
        this.db = null;
        this.init();
    }

    init() {
        // Conectar a la base de datos (se crea automáticamente si no existe)
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('❌ Error conectando a la base de datos:', err.message);
            } else {
                console.log('✅ Conectado a la base de datos SQLite.');
                this.createTables();
            }
        });
    }

    createTables() {
        // Tabla de usuarios
        this.db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            display_name TEXT,
            bio TEXT,
            avatar_url TEXT DEFAULT '/images/default-avatar.png',
            role TEXT DEFAULT 'user',
            is_verified BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Tabla de películas
        this.db.run(`CREATE TABLE IF NOT EXISTS films (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            director_id INTEGER NOT NULL,
            genre TEXT,
            duration INTEGER,
            video_url TEXT NOT NULL,
            thumbnail_url TEXT DEFAULT '/images/default-thumbnail.jpg',
            tags TEXT,
            is_featured BOOLEAN DEFAULT 0,
            is_approved BOOLEAN DEFAULT 1,
            view_count INTEGER DEFAULT 0,
            like_count INTEGER DEFAULT 0,
            donation_total REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (director_id) REFERENCES users (id)
        )`);

        // Tabla de donaciones
        this.db.run(`CREATE TABLE IF NOT EXISTS donations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            film_id INTEGER NOT NULL,
            donor_id INTEGER,
            donor_email TEXT,
            donor_name TEXT,
            amount REAL NOT NULL,
            message TEXT,
            is_anonymous BOOLEAN DEFAULT 0,
            payment_method TEXT,
            payment_status TEXT DEFAULT 'completed',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (film_id) REFERENCES films (id),
            FOREIGN KEY (donor_id) REFERENCES users (id)
        )`);

        // Tabla de transacciones de revenue
        this.db.run(`CREATE TABLE IF NOT EXISTS revenue_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            film_id INTEGER NOT NULL,
            director_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            gross_amount REAL NOT NULL,
            director_share REAL NOT NULL,
            platform_share REAL NOT NULL,
            director_percentage REAL NOT NULL,
            platform_percentage REAL NOT NULL,
            status TEXT DEFAULT 'processed',
            transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            payout_date DATETIME,
            FOREIGN KEY (film_id) REFERENCES films (id),
            FOREIGN KEY (director_id) REFERENCES users (id)
        )`);

        // Tabla de balances de directores
        this.db.run(`CREATE TABLE IF NOT EXISTS director_balances (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            director_id INTEGER UNIQUE NOT NULL,
            available_balance REAL DEFAULT 0,
            pending_balance REAL DEFAULT 0,
            total_earned REAL DEFAULT 0,
            last_payout_date DATETIME,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (director_id) REFERENCES users (id)
        )`);

        // Tabla de balances de plataforma
        this.db.run(`CREATE TABLE IF NOT EXISTS platform_balances (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            total_donation_revenue REAL DEFAULT 0,
            total_ad_revenue REAL DEFAULT 0,
            total_platform_share REAL DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Tabla de solicitudes de retiro
        this.db.run(`CREATE TABLE IF NOT EXISTS payout_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            director_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            payment_method TEXT,
            payment_details TEXT,
            requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            processed_at DATETIME,
            FOREIGN KEY (director_id) REFERENCES users (id)
        )`);

        // Tabla de vistas (para analytics)
        this.db.run(`CREATE TABLE IF NOT EXISTS film_views (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            film_id INTEGER NOT NULL,
            user_id INTEGER,
            ip_address TEXT,
            user_agent TEXT,
            viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (film_id) REFERENCES films (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);

        // Tabla de likes
        this.db.run(`CREATE TABLE IF NOT EXISTS film_likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            film_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            liked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(film_id, user_id),
            FOREIGN KEY (film_id) REFERENCES films (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);

        console.log('✅ Todas las tablas creadas/verificadas correctamente.');
        this.insertSampleData();
    }

    async insertSampleData() {
        // Insertar usuario admin por defecto
        const adminPassword = await bcrypt.hash('admin123', 10);
        
        this.db.run(`INSERT OR IGNORE INTO users (username, email, password_hash, display_name, role, is_verified) 
                    VALUES (?, ?, ?, ?, ?, ?)`, 
        ['admin', 'admin@dreamplay.com', adminPassword, 'Administrador', 'admin', 1], 
        function(err) {
            if (err) {
                console.error('Error creando usuario admin:', err);
            } else {
                console.log('✅ Usuario admin creado: admin@dreamplay.com / admin123');
            }
        });

        // Insertar balance de plataforma
        this.db.run(`INSERT OR IGNORE INTO platform_balances (id, total_platform_share) VALUES (1, 0)`);

        // Insertar películas de ejemplo (solo si no existen)
        this.db.get('SELECT COUNT(*) as count FROM films', (err, row) => {
            if (err) return console.error(err);
            
            if (row.count === 0) {
                const sampleFilms = [
                    {
                        title: 'El Sueño del Cineasta',
                        description: 'Un conmovedor cortometraje sobre la pasión por el cine independiente.',
                        director_id: 1,
                        genre: 'Drama',
                        duration: 15,
                        video_url: '/videos/sample1.mp4',
                        thumbnail_url: '/images/thumbnail1.jpg',
                        is_featured: 1,
                        view_count: 12450,
                        like_count: 845,
                        donation_total: 856.50
                    },
                    {
                        title: 'Latidos Urbanos',
                        description: 'Documental que explora la vida en la ciudad moderna a través de sus sonidos.',
                        director_id: 1,
                        genre: 'Documental',
                        duration: 22,
                        video_url: '/videos/sample2.mp4',
                        thumbnail_url: '/images/thumbnail2.jpg',
                        is_featured: 1,
                        view_count: 8700,
                        like_count: 623,
                        donation_total: 567.25
                    },
                    {
                        title: 'Sombras del Alma',
                        description: 'Drama psicológico que explora las profundidades de la mente humana.',
                        director_id: 1,
                        genre: 'Drama',
                        duration: 18,
                        video_url: '/videos/sample3.mp4',
                        thumbnail_url: '/images/thumbnail3.jpg',
                        is_featured: 1,
                        view_count: 15300,
                        like_count: 1200,
                        donation_total: 1245.75
                    }
                ];

                sampleFilms.forEach(film => {
                    this.db.run(`INSERT INTO films 
                                (title, description, director_id, genre, duration, video_url, thumbnail_url, is_featured, view_count, like_count, donation_total) 
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [film.title, film.description, film.director_id, film.genre, film.duration, 
                     film.video_url, film.thumbnail_url, film.is_featured, film.view_count, 
                     film.like_count, film.donation_total], 
                    function(err) {
                        if (err) console.error('Error insertando película:', err);
                    });
                });

                console.log('✅ Películas de ejemplo insertadas');
            }
        });
    }

    // Método para hacer queries fácilmente
    query(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Método para una sola fila
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Método para ejecutar (INSERT, UPDATE, DELETE)
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }
}

// Exportar una única instancia de la base de datos
module.exports = new Database();