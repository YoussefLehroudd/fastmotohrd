const mysql = require('mysql2/promise');
const config = require('../config/db.js');

async function run() {
    try {
        const connection = await mysql.createConnection(config);
        
        // Drop existing foreign key constraints
        await connection.execute(`
            ALTER TABLE payments 
            DROP FOREIGN KEY payments_ibfk_1
        `);

        // Drop and recreate bookings table with new structure
        await connection.execute(`
            DROP TABLE IF EXISTS bookings
        `);

        await connection.execute(`
            CREATE TABLE bookings (
                id int(11) NOT NULL AUTO_INCREMENT,
                motorId int(11) NOT NULL,
                userId int(11) NOT NULL,
                startDate date NOT NULL,
                endDate date NOT NULL,
                pickupTime time NOT NULL,
                returnTime time NOT NULL,
                location varchar(255) NOT NULL,
                status enum('pending','confirmed','cancelled','completed') DEFAULT 'pending',
                totalPrice decimal(10,2) NOT NULL,
                depositAmount decimal(10,2) DEFAULT NULL,
                specialRequests text DEFAULT NULL,
                mileageStart int(11) DEFAULT NULL,
                mileageEnd int(11) DEFAULT NULL,
                fuelLevelStart varchar(50) DEFAULT NULL,
                fuelLevelEnd varchar(50) DEFAULT NULL,
                damageNotes text DEFAULT NULL,
                cancellationReason text DEFAULT NULL,
                created_at timestamp NOT NULL DEFAULT current_timestamp(),
                locationId int(11) DEFAULT NULL,
                PRIMARY KEY (id),
                KEY motorId (motorId),
                KEY userId (userId),
                CONSTRAINT bookings_ibfk_1 FOREIGN KEY (motorId) REFERENCES motors (id),
                CONSTRAINT bookings_ibfk_2 FOREIGN KEY (userId) REFERENCES users (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `);

        // Recreate the foreign key constraint for payments table
        await connection.execute(`
            ALTER TABLE payments
            ADD CONSTRAINT payments_ibfk_1 FOREIGN KEY (bookingId) REFERENCES bookings (id)
        `);

        console.log('Successfully updated bookings table structure');
        await connection.end();
    } catch (error) {
        console.error('Error executing migration:', error);
        process.exit(1);
    }
}

run();
