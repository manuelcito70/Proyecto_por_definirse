require('dotenv').config();
const { Sequelize } = require('sequelize');

let sequelize;

if (process.env.DATABASE_URL) {
    // Railway provee DATABASE_URL automáticamente
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        logging: false
    });
} else {
    // Configuración local con variables separadas
    const dbName = process.env.DB_NAME || 'sistema_documentos';
    const dbUser = process.env.DB_USER || 'postgres';
    const dbPass = process.env.DB_PASS !== undefined ? String(process.env.DB_PASS) : '';
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || 5432;

    if (!process.env.DB_PASS) {
        console.warn('⚠️  ADVERTENCIA: La variable DB_PASS no está definida en el archivo backend/.env.');
    }

    sequelize = new Sequelize(
        dbName,
        dbUser,
        dbPass,
        {
            host: dbHost,
            dialect: 'postgres',
            port: dbPort,
            logging: false
        }
    );
}

module.exports = sequelize;
