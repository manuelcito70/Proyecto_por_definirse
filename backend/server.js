require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('./src/models');

const app = express();

// Seguridad
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { mensaje: 'Demasiadas peticiones, intenta más tarde.' }
});
app.use('/api', limiter);

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('No permitido por CORS'));
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Directorio de uploads
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOADS_DIR));

// Rutas
app.use('/api', require('./src/routes/authRoutes'));
app.use('/api/expedidos', require('./src/routes/expedidosRoutes'));
app.use('/api/recibidos', require('./src/routes/recibidosRoutes'));
app.use('/api/actas', require('./src/routes/actasRoutes'));
app.use('/api/auxiliares', require('./src/routes/auxiliaresRoutes'));
app.use('/api/docentes', require('./src/routes/docentesRoutes'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', sistema: 'SIGAD - Dirección de Carrera FINI' }));

const PORT = process.env.PORT || 3000;
const alterDatabase = process.env.NODE_ENV !== 'production';

sequelize.sync({ alter: alterDatabase })
  .then(() => {
    console.log(`✅ Base de datos sincronizada (alter: ${alterDatabase})`);
    app.listen(PORT, () => {
      console.log(`🚀 Servidor SIGAD corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Error al conectar con la base de datos:', error.message);
  });
