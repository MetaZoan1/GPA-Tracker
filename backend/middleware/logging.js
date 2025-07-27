import logger from '../logger.js';

export function requestLogger(request, response, next) {
    const start = Date.now();

    const details = {
        method: request.method,
        url: request.url,
        ip: request.ip || request.connection.remoteAddress,
        userAgent: request.get('User-Agent'),
        timestamp: new Date().toISOString()
    };

    if (request.body && Object.keys(request.body).length > 0) {
        const info = { ...request.body };
        delete info.pass;
        delete info.newPass;
        details.body = info;
    }

    logger.http('Incoming request', details);

    const originalJSON = response.json;
    response.json = function(body) {
        const duration = Date.now() - start;
        const responseData = {
            method: request.method,
            url: request.url,
            statusCode: response.statusCode,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
        };

        if (response.statusCode >= 400) {
            logger.warn('Request completed with error', responseData);
        } else {
            logger.http('Request Completed', responseData);
        }

        return originalJSON.call(this, body);
    };
    next();
};

export function errorLogger(error, request, response, next) {
    const errorInfo = {
        method: request.method,
        url: request.url,
        ip: request.ip || request.connection.remoteAddress,
        userAgent: request.get('User-Agent'),
        error: {
            message: error.message,
            stack: error.stack,
            name: error.name
        },
        timestamp: new Date().toISOString()
    };

    logger.error('Unhandled error occurred', errorInfo);

    if (process.env.NODE_ENV === 'production') {
        response.status(500).json({ error: 'Internal Server Error' });
    } else {
        response.status(500).json({
            error: 'Internal server error',
            message: error.message,
            stack: error.stack
        });
    }
}

export async function logQuery(queryFn, query, params = [], context = '') {
    const start = Date.now();
    try {
        logger.debug('Database query started', {
            query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
            context,
            timestamp: new Date().toISOString()
        });

        const result = await queryFn(query, params);
        const duration = Date.now() - start;

        logger.debug('Database query completed', {
            context,
            duration: `${duration}ms`,
            rowsAffected: result[0]?.length || result?.affectedRows || 0,
            timestamp: new Date().toISOString()
        });

        return result;
    } catch (error) {
        const duration = Date.now() - start;

        logger.error('Database query failed', {
            query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
            context,
            duration: `${duration}ms`,
            error: {
                message: error.message,
                code: error.code,
                errno: error.errno
            },
            timestamp: new Date().toISOString()
        });
        throw error;
    }
};
