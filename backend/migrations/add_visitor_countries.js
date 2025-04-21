const mysql = require('mysql2/promise');
const config = require('../config/db');

async function migrate() {
  try {
    const connection = await mysql.createConnection(config);
    
    // Create visitor_countries table with basic fields
    await connection.query(`
      CREATE TABLE IF NOT EXISTS visitor_countries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL,
        country_code CHAR(2),
        country_name VARCHAR(100),
        region VARCHAR(50),
        region_name VARCHAR(100),
        city VARCHAR(100),
        timezone VARCHAR(100),
        isp VARCHAR(255),
        visit_count INT DEFAULT 1,
        first_visit DATETIME NOT NULL,
        last_visit DATETIME NOT NULL,
        UNIQUE KEY unique_ip (ip_address)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Visitor countries table created successfully');
    await connection.end();
  } catch (error) {
    console.error('Error creating visitor countries table:', error);
    process.exit(1);
  }
}

migrate();
