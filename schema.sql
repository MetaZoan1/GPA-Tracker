CREATE DATABASE calculator;
USE calculator;

CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        pass VARCHAR(255) NOT NULL,
        table_name VARCHAR(255) UNIQUE NOT NULL,
        created TIMESTAMP DEFAULT NOW()
);