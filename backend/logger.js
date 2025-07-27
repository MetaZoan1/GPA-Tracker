import winston from 'winston';
import DRF from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};

const levelColors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'white',
    debug: 'magenta'
};

winston.addColors(levelColors);

const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.prettyPrint()
);

const logsDir = path.join(__dirname, 'logs');

const allLogs = new DRF({
    filename: path.join(logsDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: format,
    level: 'debug'
});

const errorsOnly = new DRF({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    format: format,
    level: 'error'
});

const logger = winston.createLogger({
    levels: levels,
    level: process.env.LEVEL || 'info',
    format: format,
    transports: [
        allLogs,
        errorsOnly
    ],
    exceptionHandlers: [
        new DRF({
            filename: path.join(logsDir, 'exceptions-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
            format: format
        })
    ],
    rejectionHandlers: [
        new DRF({
            filename: path.join(logsDir, 'rejections-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
            format: format
        })
    ]
});

const console = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level, message, ...meta}) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += `${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: console,
        level: 'debug'
    }));
}

logger.stream = {
    write: (message) => {
        logger.http(message.trim());
    }
};

export default logger;

