require('dotenv').config();

module.exports = {
    development: {
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'carsvisionauto',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false
    },
    production: {
        ...(process.env.DATABASE_URL
            ? {
                use_env_variable: 'DATABASE_URL',
                dialect: 'postgres',
              }
            : {
                username: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                host: process.env.DB_HOST,
                port: process.env.DB_PORT,
                dialect: 'postgres',
              }
        ),
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    }
};
