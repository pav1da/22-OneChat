const pool = require('../Backend/config/db.js');

async function createTemplatesTable() {
    try {
        console.log('Creating templates table in Railway database...');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS templates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL,
                content JSON NOT NULL,
                created_by INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        
        console.log('Successfully created templates table!');
        process.exit(0);
    } catch (err) {
        console.error('Error creating table:', err);
        process.exit(1);
    }
}

createTemplatesTable();
