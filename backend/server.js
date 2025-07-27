import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import logger from './logger.js';
import { requestLogger, errorLogger, logQuery } from './middleware/logging.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(requestLogger);

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

let database;

// Initialize database connection
async function initDatabase() {
  try {
    database = await mysql.createConnection(dbConfig);
    logger.info('Connected to mysql database', {
        host: dbConfig.host,
        database: dbConfig.database
    })
    
    // Create users table if it doesn't exist
    const sql = `CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            pass VARCHAR(255) NOT NULL,
            table_name VARCHAR(255) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;

    await logQuery(database.execute.bind(database), sql, [], 'Initialize users table');
    logger.info('Database successfully initialized');
        
  } catch (error) {
    logger.error('Database connection failed', {
        error: error.message,
        host: dbConfig.host,
        database: dbConfig.database
    });
    process.exit(1);
  }
}

const authenticateToken = (request, response, next) => {
    const authHeader = request.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        logger.warn('Authentication error: no token provided', {
            ip: request.ip,
            url: request.url
        });
        return response.status(401).json({ err: 'Access token required '});
    }
    jwt.verify(token, process.env.JWT_SECRET_KEY, (error, user) => {
        if (error) {
            logger.warn('Authentication error: invalid token', {
                ip: request.ip,
                url: request.url,
                error: error.message
            });
            return response.status(403).json({ error: 'Invalid token' });
            
        } else {
            logger.debug('Authentication successful', {
                userId: user.userId,
                username: user.username
            });
            request.user = user;
            next();
        }
    })
}

function generateTableName(username) {
    return `user_${username}_data`.replace(/[^a-zA-Z0-9_]/g, '_');
}

async function createUserTable(tableName) {
    const sql = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            department VARCHAR(4) NOT NULL,
            classId INT NOT NULL,
            grade DECIMAL(3,2) NOT NULL,
            credits INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `;

    await logQuery(database.execute.bind(database), sql, [], `Create user table: ${tableName}`);
    logger.info('User table created', { tableName });
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAILAPPPASS
    }
});


//Routes

app.post('/api/register', async (request, response) => { //works
  try {
    const { username, email, pass } = request.body;
    logger.info('Registration request', { username, email });

    // Validate input
    if (!username || !email || !pass) {
        logger.warn('Registration failure: missing fields', { username, email });
        return response.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const [existingUsers] = await logQuery(database.execute.bind(database),
        `SELECT * FROM users WHERE username = ? OR email = ?`,
        [username, email], 'Check users table');

    if (existingUsers.length > 0) {
        logger.warn('Registration failure: user already exists', { username, email });
        return response.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(pass, 10);

    // Generate unique table name
    const tableName = generateTableName(username);

    // Create user
    await logQuery(database.execute.bind(database),
      'INSERT INTO users (username, email, pass, table_name) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, tableName], 'Create new user');

    // Create user-specific table
    await createUserTable(tableName);

    const dashURL = `${process.env.FRONTEND_URL}/dashboard`;

    const emailFormat = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Welcome to GPA Tracker!',
        html: `
            <div style = "font-family: Arial; max-width: 600px; margin: 0 auto;">
                <h1>Thank you for registering to GPA Tracker!</h1>
                <h4>Where tracking class grades and GPA becomes a breeze.<h4>
                <p>Click the button below to get started!<p>
                <a href = "${dashURL}" style = "display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #059669 100%); color: white; border-radius: 4px;">
                    Get Started!
                </a>
            </div>
        `};

    await transporter.sendMail(emailFormat);
    logger.info('Welcome email sent', { email });

    logger.info('User registered', { username, email, tableName });
    response.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    logger.error('Registration error', {
        username: request.body?.username,
        email: request.body?.email,
        error: error.message,
        stack: error.stack
    });
    response.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/login', async (request, response) => { //Login existing User (works)
    try {
        const { username, pass } = request.body;
        logger.info('Login request', { username });

        if (!username || !pass) {
            logger.warn('Login failure: missing credentials');
            return response.status(400).json({ error: 'Username and password are required' });
        }

        const [users] = await logQuery(database.execute.bind(database),
            'SELECT * FROM users WHERE username = ?', [username], 'User login query');

        if (users.length === 0) {
            logger.warn('Login failure: user not found', { username });
            return response.status(401).json({ error: 'Username or Password not valid' });
        }

        const user = users[0];

        const isPasswordValid = await bcrypt.compare(pass, user.pass);
        if (!isPasswordValid) {
            logger.warn('Login failure: invalid password', { username });
            return response.status(401).json({ error: 'Username or Password not valid' });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username, tableName: user.table_name },
            process.env.JWT_SECRET_KEY,
            { expiresIn: '24h' });
        logger.info('User logged in', {
            userId: user.id,
            username: user.username
        });

        response.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        logger.error('Login error', {
            username: request.body?.username,
            error: error.message,
            stack: error.stack
        });
        response.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/data', authenticateToken, async (request, response) => { //Get user's data table (works)
    try {
        const { tableName } = request.user;

        const [rows] = await logQuery(database.execute.bind(database),
            `SELECT * FROM ${tableName} ORDER BY created_at DESC`,
            [], `Get data from ${tableName}`);

        logger.info('User data retrieved', {
            username: request.user.username,
            numberOfClasses: rows.length
        });

        response.json(rows);
    } catch (error) {
        logger.error('Get data error', {
            username: request.user?.username,
            tableName: request.user?.tableName,
            error: error.message
        });
        response.status(500).json({ error: 'Failed to fetch data' });
    }
})


app.get('/api/data/gpa', authenticateToken, async (request, response) => {
    try {
        const { tableName } = request.user;

        const [result] = await logQuery(database.execute.bind(database),
            `SELECT SUM(grade * credits) as totalPoints,
             SUM(credits) as totalCredits FROM ${tableName}`, [], `GPA Calculation: ${tableName}`);

        const results = result[0];
        const gpa = results.totalPoints / results.totalCredits;

        logger.info('GPA calculated', {
            username: request.user.username,
            gpa: parseFloat(gpa.toFixed(2)),
            totalCredits: results.totalCredits
        });

        response.json({
            gpa: parseFloat(gpa.toFixed(2)),
            totalCredits: results.totalCredits
        });

    } catch (error) {
        logger.error('GPA calculation error', {
            username: request.user?.username,
            tableName: request.user?.tableName,
            error: error.message
        });
        response.status(500).json({ error: 'Failed to calculate GPA' });
    }
})


app.post('/api/data', authenticateToken, async (request, response) => { //add new class in user's table (works!)
    try {
        const { department, classId, grade, credits } = request.body;
        const { tableName } = request.user;

        const [result] = await logQuery(database.execute.bind(database),
            `INSERT INTO ${tableName} (department, classId, grade, credits) VALUES (?, ?, ?, ?)`,
            [department, classId, grade, credits], `Add class to ${tableName}`);

        const [newClass] = await logQuery(database.execute.bind(database),
            `SELECT * FROM ${tableName} WHERE id = ?`,
            [result.insertId], 'Get created class');

        logger.info('Class added successfully', {
            username: request.user.username,
            classId: newClass[0].id,
            department,
            classId
        });

        response.status(201).json(newClass[0]);
    } catch (error) {
        logger.error('Add class error', {
            username: request.user?.username,
            department: request.body?.department,
            classId: request.body?.classId,
            error: error.message
        });
        response.status(500).json({ error: 'Failed to add class...' });
    } 
});

app.put('/api/data/:id', authenticateToken, async (request, response) => { //update a user's class' data  (works)
    try {
        const { id } = request.params;
        const { department, classId, grade, credits } = request.body;
        const { tableName } = request.user;

        await logQuery(database.execute.bind(database),
            `UPDATE ${tableName} SET department = ?, classId = ?, grade = ?, credits = ? WHERE id = ?`,
            [department, classId, grade, credits, id], `Update class in ${tableName}`);

        const [updatedClass] = await logQuery(database.execute.bind(database),
            `SELECT * FROM ${tableName} WHERE id = ?`, [id], 'Get updated class');

        logger.info('Class updated', {
            username: request.user.username,
            classId: id,
            department,
            classId
        });
        
        response.status(201).json(updatedClass[0]);
    } catch (error) {
        logger.error('Update class error', {
            username: request.user?.username,
            classId: request.params?.id,
            error: error.message
        });
        response.status(500).json({ error: 'Failed to update data' });
    }
});

app.delete('/api/data/:id', authenticateToken, async (request, response) => { //delete a user's class (works)
    try {
        const { id } = request.params;
        const { tableName } = request.user;

        await logQuery(database.execute.bind(database),
            `DELETE FROM ${tableName} WHERE id = ?`, [id], `Delete class in ${tableName}`);
        
        logger.info('Class deleted', {
            username: request.user.username,
            classId: id
        });
        
        response.status(201).json({ message: 'Data deleted successfully' });
    } catch (error) {
        logger.error('Delete class error', {
            username: request.user?.username,
            classId: request.params?.id,
            error: error.message
        });
        response.status(500).json({ error: 'Failed to delete data' });
    }
})

const resetTokens = new Map(); //change to database later

app.post('/api/forgot-password', async (request, response) => { //works!
    try {
        const { email } = request.body;

        logger.info('Password reset request', { email });

        if (!email) {
            logger.warn('Password reset failure: no email');
            return response.status(400).json({ error: 'Please enter an email' });
        }

        const [users] = await logQuery(database.execute.bind(database),
            'SELECT * FROM users WHERE email = ?', [email], 'User lookup');

        if (users.length === 0) {
            logger.warn('Password reset failure: user not found', { email });
            return response.status(200).json({ message: 'If an sccount exists with that email, we sent reset instructions' });
        }

        const user = users[0];

        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiry = Date.now() + 3600000;

        resetTokens.set(resetToken, {
            id: user.id,
            email: user.email,
            expiry: expiry
        });

        const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        const emailFormat = {
            from: process.env.EMAIL,
            to: email,
            subject: 'GPA Tracker Password Reset',
            html: `
                <div style = "font-family: Arial; max-width: 600px; margin: 0 auto;">
                    <h2>Password Reset Request</h2>
                    <p>Click the button below to reset your password:</p>
                    <a href = "${resetURL}" style = "display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #059669 100%); color: white; border-radius: 4px;">
                        Reset Password
                    </a>
                    <p>Or copy and paste this URL</p>
                    <p style = "word-break: break-all;">
                        ${resetURL} 
                    </p>
                    <p><strong>This link will expire in 1 hour.</strong></p>
                    <p>If you didn't make this request, you can safely ignore this email.</p>
                </div>
            
            `};

        await transporter.sendMail(emailFormat);

        logger.info('Password reset email sent', {
            email,
            tokenExpiry: new Date(expiry).toISOString()
        });

        response.status(200).json({ message: 'Password reset instructions sent to your email! '});
    } catch (error) {
        logger.error('Forgot password error', {
            email: request.body?.email,
            error: error.message
        });
        response.status(500).json({ error: 'Failed to process reset request' });
    }
})

app.post('/api/reset-password', async (request, response) => {
    try {
        const { token, newPass } = request.body;

        if (!token || !newPass) {
            logger.warn('Password reset failure: missing token or password');
            return response.status(400).json({ error: 'Token and new password are required' });
        }

        const tokenData = resetTokens.get(token);
        if (!tokenData || tokenData.expires < Date.now()) {
            logger.warn('Password reset failure: invalid or expired token');
            return response.status(400).json({ error: 'Invalid or expired reset token '});
        }
        
        const [users] = await logQuery(database.execute.bind(database),
            'SELECT * FROM users WHERE id = ?', [tokenData.id], 'User lookup');

        if (users.length === 0) {
            logger.warn('Password reset failure: user not found');
            return response.status(404).json({ error: 'User not found' });
        }

        const hashedNewPass = await bcrypt.hash(newPass, 10);

        await logQuery(database.execute.bind(database),
            'UPDATE users SET pass = ? WHERE id = ?', [hashedNewPass, tokenData.id], 'Update user password');

        resetTokens.delete(token);

        logger.info('Password reset', {
            userId: tokenData.id,
            email: tokenData.email
        });

        response.status(200).json({ message: 'Password has been reset!' });
    } catch (error) {
        logger.error('Password reset error', {
            error: error.message
        });
        response.status(500).json({ error: 'Failed to reset password' });
    }
})

setInterval(() => {
    let expiredTokens = 0
    for (const [token, data] of resetTokens.entries()) {
        if (data.expiry < Date.now()) {
            resetTokens.delete(token);
            expiredTokens++;
        }
    }
    if (expiredTokens > 0) {
        logger.debug('Cleaned up expired tokens, more reset tokens still active', { count: expiredTokens });
    }
}, 60000)


const Port = process.env.SERVER_PORT;

async function startServer() {
  await initDatabase();
  app.listen(Port, () => {
    console.log(`Server running on port ${Port}`);
  });
}

startServer().catch(console.error);