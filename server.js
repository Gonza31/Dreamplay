// server.js - Servidor principal con base de datos
const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;

// Importar la base de datos
const db = require('./database/schema');
// ⬇️⬇️⬇️ AGREGAR ESTAS 2 LÍNEAS NUEVAS AQUÍ ⬇️⬇️⬇️
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// Agregar esta línea NUEVA con los otros requires
const { enviarEmailDonacion, enviarEmailBienvenida } = require('./services/emailService');
// ⬆️⬆️⬆️ FIN DE LAS LÍNEAS NUEVAS ⬆️⬆️⬆️

// Configuración básica
// Servir archivos estáticos desde la carpeta public
app.use(express.static('public'));

// Servir archivos de video desde la carpeta videos
app.use('/videos', express.static('videos'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'dreamplay-secret-key-2024',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Configurar EJS como motor de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware para hacer user disponible en todas las vistas
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// ==================== RUTAS PÚBLICAS ====================

// Página principal
app.get('/', async (req, res) => {
    try {
        const featuredFilms = await db.query(`
            SELECT f.*, u.display_name as director_name, u.username as director_username 
            FROM films f 
            JOIN users u ON f.director_id = u.id 
            WHERE f.is_featured = 1 
            ORDER BY f.created_at DESC 
            LIMIT 6
        `);
        
        res.render('index', { 
            title: 'Dreamplay - Cine Independiente',
            user: req.session.user,
            featuredFilms: featuredFilms
        });
    } catch (error) {
        console.error('Error cargando página principal:', error);
        res.status(500).render('error', { error: 'Error interno del servidor' });
    }
});

// Explorar películas
app.get('/browse', async (req, res) => {
    try {
        const films = await db.query(`
            SELECT f.*, u.display_name as director_name, u.username as director_username 
            FROM films f 
            JOIN users u ON f.director_id = u.id 
            WHERE f.is_approved = 1 
            ORDER BY f.created_at DESC
        `);
        
        res.render('browse', { 
            title: 'Explorar Contenido - Dreamplay',
            user: req.session.user,
            films: films
        });
    } catch (error) {
        console.error('Error cargando explorar:', error);
        res.status(500).render('error', { error: 'Error interno del servidor' });
    }
});
// ==================== RUTAS API PARA VIDEOS ====================

// Ruta para la página del reproductor - VERSIÓN ALTERNATIVA
app.get('/player', (req, res) => {
    res.sendFile(__dirname + '/views/video-player.html');
});
// RUTA TEMPORAL DE PRUEBA
app.get('/test-player', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Reproductor de Prueba</title>
            <style>
                body { font-family: Arial; background: #1a1a2e; color: white; padding: 20px; }
                h1 { color: #3498db; }
            </style>
        </head>
        <body>
            <h1>🎬 Reproductor de Prueba - DreamPlay</h1>
            <p>¡Esta es una página de prueba!</p>
            <p>Si ves esto, el servidor está funcionando.</p>
            <a href="/" style="color: #3498db;">← Volver al Inicio</a>
        </body>
        </html>
    `);
});


// API: Obtener lista de videos
app.get('/api/videos', (req, res) => {
    // Por ahora usamos datos de ejemplo
    // Luego conectaremos con la base de datos
    const videos = [
        {
            id: 1,
            title: "Trailer DreamPlay",
            description: "Descubre las características increíbles de nuestra plataforma de streaming",
            filename: "trailer.mp4",
            likes: 15,
            isLiked: false,
            isFavorited: false,
            duration: "2:30"
        },
        {
            id: 2,
            title: "Tutorial de Uso Completo",
            description: "Aprende a usar todas las funciones avanzadas de DreamPlay",
            filename: "tutorial.mp4",
            likes: 8,
            isLiked: false,
            isFavorited: false,
            duration: "5:15"
        },
        {
            id: 3,
            title: "Behind the Scenes",
            description: "Un vistazo exclusivo de cómo creamos DreamPlay desde cero",
            filename: "behind-scenes.mp4",
            likes: 23,
            isLiked: false,
            isFavorited: false,
            duration: "3:45"
        }
    ];
    res.json(videos);
});

// API: Dar like/quitar like
app.post('/api/like', (req, res) => {
    const { videoId, action } = req.body;
    
    // Por ahora simulamos la base de datos
    // Luego guardaremos en SQLite
    console.log(`Usuario ${action} el video ${videoId}`);
    
    // Simular cambio en los likes
    const newLikes = action === 'like' ? 
        Math.floor(Math.random() * 10) + 20 : // Like: 20-30 likes
        Math.floor(Math.random() * 10) + 10;  // Unlike: 10-20 likes
    
    res.json({
        success: true,
        newLikes: newLikes,
        message: `Like ${action === 'like' ? 'agregado' : 'eliminado'} correctamente`
    });
});

// API: Agregar/quitar favorito
app.post('/api/favorite', (req, res) => {
    const { videoId, action } = req.body;
    
    console.log(`Video ${videoId} ${action === 'favorite' ? 'agregado a' : 'eliminado de'} favoritos`);
    
    res.json({
        success: true,
        message: `Video ${action === 'favorite' ? 'agregado a' : 'eliminado de'} favoritos`
    });
});

// Ruta para videos individuales
app.get('/video/:id', (req, res) => {
    res.redirect('/player');
});

// ==================== AUTENTICACIÓN ====================

// Página de registro
app.get('/register', (req, res) => {
    res.render('register', { 
        title: 'Registrarse - Dreamplay',
        error: null 
    });
});

// Procesar registro
app.post('/register', async (req, res) => {
    try {
        const { username, email, password, display_name, bio } = req.body;
        
        // Verificar si el usuario ya existe
        const existingUser = await db.get(
            'SELECT id FROM users WHERE email = ? OR username = ?', 
            [email, username]
        );
        
        if (existingUser) {
            return res.render('register', {
                title: 'Registrarse - Dreamplay',
                error: 'El email o usuario ya está registrado'
            });
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insertar nuevo usuario
        const result = await db.run(
            `INSERT INTO users (username, email, password_hash, display_name, bio) 
             VALUES (?, ?, ?, ?, ?)`,
            [username, email, hashedPassword, display_name, bio]
        );

        // Iniciar sesión automáticamente
        req.session.user = {
            id: result.id,
            username: username,
            display_name: display_name,
            email: email,
            role: 'user'
        };

        res.redirect('/profile');

    } catch (error) {
        console.error('Error en registro:', error);
        res.render('register', {
            title: 'Registrarse - Dreamplay',
            error: 'Error interno del servidor'
        });
    }
});

// Página de login
app.get('/login', (req, res) => {
    res.render('login', { 
        title: 'Iniciar Sesión - Dreamplay',
        error: null 
    });
});

// Procesar login
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Buscar usuario
        const user = await db.get(
            'SELECT * FROM users WHERE email = ? OR username = ?',
            [email, email]
        );
        
        if (!user) {
            return res.render('login', {
                title: 'Iniciar Sesión - Dreamplay',
                error: 'Credenciales incorrectas'
            });
        }

        // Verificar contraseña
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        
        if (passwordMatch) {
            req.session.user = {
                id: user.id,
                username: user.username,
                display_name: user.display_name,
                email: user.email,
                role: user.role
            };
            
            // Redirigir según el rol
            if (user.role === 'admin') {
                res.redirect('/admin');
            } else {
                res.redirect('/profile');
            }
        } else {
            res.render('login', {
                title: 'Iniciar Sesión - Dreamplay',
                error: 'Credenciales incorrectas'
            });
        }

    } catch (error) {
        console.error('Error en login:', error);
        res.render('login', {
            title: 'Iniciar Sesión - Dreamplay',
            error: 'Error interno del servidor'
        });
    }
});

// Cerrar sesión
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// ==================== PERFIL DE USUARIO ====================

// Middleware para verificar autenticación
function requireAuth(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Perfil de usuario
app.get('/profile', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;
        
        // Obtener estadísticas del usuario
        const userStats = await db.get(`
            SELECT 
                COUNT(*) as film_count,
                SUM(view_count) as total_views,
                SUM(like_count) as total_likes,
                SUM(donation_total) as total_earnings
            FROM films 
            WHERE director_id = ?
        `, [userId]);
        
        // Obtener películas del usuario
        const userFilms = await db.query(`
            SELECT * FROM films 
            WHERE director_id = ? 
            ORDER BY created_at DESC
        `, [userId]);
        
        // Obtener balance del director
        const balance = await db.get(`
            SELECT * FROM director_balances 
            WHERE director_id = ?
        `, [userId]) || {
            director_id: userId,
            available_balance: 0,
            pending_balance: 0,
            total_earned: 0
        };
        
        res.render('profile', {
            title: 'Mi Perfil - Dreamplay',
            user: req.session.user,
            stats: userStats,
            films: userFilms,
            balance: balance
        });
        
    } catch (error) {
        console.error('Error cargando perfil:', error);
        res.status(500).render('error', { error: 'Error interno del servidor' });
    }
});

// ==================== RUTAS ESTÁTICAS (tus páginas HTML) ====================

// Ruta para upload.html
app.get('/upload.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'upload.html'));
});

// Ruta para donate.html
app.get('/donate.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'donate.html'));
});

// Ruta para admin.html
app.get('/admin.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// ==================== MANEJO DE ERRORES ====================

// Manejar 404
app.use((req, res) => {
    res.status(404).render('404', { 
        title: 'Página No Encontrada - Dreamplay' 
    });
});

// Manejar errores generales
app.use((err, req, res, next) => {
    console.error('Error del servidor:', err);
    res.status(500).render('error', { 
        title: 'Error del Servidor - Dreamplay',
        error: 'Algo salió mal. Por favor, intenta nuevamente.'
    });
});

// ==================== INICIAR SERVIDOR ====================
// ⬇️⬇️⬇️ AGREGAR ESTO JUSTO ANTES DE app.listen ⬇️⬇️⬇️

// ==================== RUTAS DE PAGO STRIPE ====================
app.post('/create-checkout-session', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Donación DreamPlay',
                            description: 'Apoya nuestro proyecto de streaming'
                        },
                        unit_amount: 500, // $5.00 USD
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: 'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: 'http://localhost:3000/cancel',
        });

        res.json({ id: session.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ruta de éxito - MODIFICAR ESTA RUTA
app.get('/success', async (req, res) => {
    try {
        const sessionId = req.query.session_id;
        
        // Aquí normalmente obtendrías los datos reales del usuario desde tu base de datos
        // Por ahora usaremos datos de ejemplo
        const datosDonacion = {
            emailUsuario: 'usuario@ejemplo.com', // En un caso real, esto vendría de tu BD
            nombreUsuario: 'Usuario DreamPlay',
            monto: '5.00',
            fecha: new Date().toLocaleDateString('es-ES')
        };
        
        // Enviar email de confirmación de donación
        await enviarEmailDonacion(datosDonacion);
        
        res.send(`
            <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: green;">¡Pago exitoso! 🎉</h1>
                    <p>Gracias por tu donación a DreamPlay.</p>
                    <p>📧 Se ha enviado un email de confirmación a tu correo.</p>
                    <a href="/" style="color: blue;">Volver al inicio</a>
                </body>
            </html>
        `);
    } catch (error) {
        console.error('Error en ruta success:', error);
        res.send(`
            <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: green;">¡Pago exitoso! 🎉</h1>
                    <p>Gracias por tu donación a DreamPlay.</p>
                    <a href="/" style="color: blue;">Volver al inicio</a>
                </body>
            </html>
        `);
    }
});

app.get('/cancel', (req, res) => {
    res.send(`
        <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: orange;">Pago cancelado</h1>
                <p>Tu pago fue cancelado. Puedes intentar nuevamente cuando quieras.</p>
                <a href="/donate.html" style="color: blue;">Intentar nuevamente</a>
            </body>
        </html>
    `);
});

// ⬆️⬆️⬆️ FIN DEL CÓDIGO NUEVO ⬆️⬆️⬆️

app.listen(port, () => {
    console.log(`🎬 Dreamplay ejecutándose en http://localhost:${port}`);
});


app.listen(port, () => {
    console.log(`🎬 Dreamplay ejecutándose en http://localhost:${port}`);
    console.log(`✅ Base de datos conectada`);
    console.log(`🚀 ¡Todo listo!`);
});