const winston = require('winston');

const { combine, timestamp, colorize, printf, json } = winston.format;

// Format pour la console (développement)
const devFormat = printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
});

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        process.env.NODE_ENV === 'production'
            ? json()
            : combine(colorize(), devFormat)
    ),
    transports: [
        new winston.transports.Console(),
        // En production, on peut ajouter un fichier
        ...(process.env.NODE_ENV === 'production' ? [
            new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
            new winston.transports.File({ filename: 'logs/combined.log' })
        ] : [])
    ]
});

module.exports = logger;
