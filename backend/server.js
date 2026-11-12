require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('./src/models');
const { iniciarCronAlertas } = require('./src/utils/mailer');

const app = express();

// CORS (Debe ejecutarse antes que cualquier middleware o limitador)
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

// Seguridad
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));

// Rate limiting (ignora OPTIONS y eleva el límite para desarrollo)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2500,
  skip: (req) => req.method === 'OPTIONS',
  message: { mensaje: 'Demasiadas peticiones, intenta más tarde.' }
});
app.use('/api', limiter);

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
app.use('/api/materias', require('./src/routes/materiasRoutes'));
app.use('/api/convocatorias', require('./src/routes/convocatoriasRoutes'));
app.use('/api/notificaciones', require('./src/routes/notificacionesRoutes'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', sistema: 'SIGAD - Dirección de Carrera FINI' }));

const PORT = process.env.PORT || 3000;
const alterDatabase = process.env.NODE_ENV !== 'production';

// Si la base todavía es de la versión antigua, sincronizar modificaría sus tablas viejas
// (users, documents, roles...) y podría perder datos: hay que migrarla primero.
const verificarBaseActualizada = async () => {
  const [filas] = await sequelize.query(`
    SELECT t.table_name AS nombre FROM information_schema.tables t
    WHERE t.table_schema = 'public' AND t.table_name IN ('Expedidos', 'Users', 'gestiones')`);
  const tablas = new Set(filas.map((f) => f.nombre));
  if ((tablas.has('Expedidos') || tablas.has('Users')) && !tablas.has('gestiones')) {
    const error = new Error(
      'La base de datos es de la versión antigua de SIGAD. Antes de arrancar el backend, ejecuta: npm run db:actualizar'
    );
    error.baseAntigua = true;
    throw error;
  }
};

verificarBaseActualizada()
  .then(() => sequelize.sync({ alter: alterDatabase }))
  .then(() => {
    console.log(`✅ Base de datos sincronizada (alter: ${alterDatabase})`);
    iniciarCronAlertas();
    app.listen(PORT, () => {
      console.log(`🚀 Servidor SIGAD corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    if (error.baseAntigua) {
      console.error(`\n❌ ${error.message}\n   (Instrucciones: backend/database/ACTUALIZAR_BASE_ANTIGUA.md)\n`);
      process.exit(1);
    }
    console.error('❌ Error al conectar con la base de datos:', error.message);
  });
