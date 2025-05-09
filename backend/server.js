const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const socketIo = require('socket.io');

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../frontend/public/uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

const { generateOTP, sendLoginOTP, sendPasswordResetOTP, sendPasswordChangeNotification } = require('./utils/emailService');

dotenv.config({ path: path.join(__dirname, '.env') });
const app = express();


app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images
app.use(cors({ 
  origin: 'http://localhost:3000', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Add security headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  next();
});
app.use(cookieParser());

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../frontend/public/uploads')));

// MySQL Connection and Database Initialization
const initializeDatabase = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'motor_db'
    });
    await connection.query('SET GLOBAL max_allowed_packet = 16777216'); // Set to 16MB
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    const sqlContent = fs.readFileSync(path.join(__dirname, 'models.sql'), 'utf8');
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    for (let statement of statements) {
      if (statement.trim()) {
        await connection.query(statement);
      }
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    await connection.end();

    return mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
};

let db;

const { verifyToken } = require('./middleware/auth');

// Store signup OTPs temporarily (in production, use Redis or similar)
const signupOTPStore = new Map();
const otpStore = new Map();
const passwordResetOTPStore = new Map();

// Validation middleware
const validateSignupData = async (req, res, next) => {
  const { username, email, password, role } = req.body;

  try {
    // Check if username already exists first
    const [existingUsername] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUsername.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Check if email already exists
    const [existingEmail] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingEmail.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Check if all required fields are present
    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate email format
    if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate password strength
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters with uppercase, lowercase, and numbers' 
      });
    }

    // Validate role
    if (!['user', 'seller'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role selected' });
    }

  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({ message: 'Error validating registration data' });
  }

  next();
};

// Auth Routes
app.post('/api/auth/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const [users] = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE email = ?',
      [email]
    );

    const exists = users[0].count > 0;
    
    res.json({ exists });
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/auth/signup', validateSignupData, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    // Generate and store OTP
    const otp = generateOTP();
    const expiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
    
    signupOTPStore.set(email, {
      otp,
      expiryTime,
      userData: { username, email, password, role }
    });

    await sendLoginOTP(email, otp);
    
    res.json({ 
      message: 'OTP sent to your email for verification',
      success: true,
      requiresOTP: true
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'An error occurred during registration' });
  }
});

app.post('/api/auth/verify-signup-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const storedData = signupOTPStore.get(email);

    if (!storedData || Date.now() > storedData.expiryTime) {
      signupOTPStore.delete(email);
      return res.status(400).json({ message: 'OTP expired or invalid. Please try signing up again.' });
    }

    if (otp !== storedData.otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    const { username, password, role } = storedData.userData;
    const hashedPassword = await bcrypt.hash(password, 12);

    await db.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', 
      [username, email, hashedPassword, role]
    );

    signupOTPStore.delete(email);

    res.json({ 
      message: 'Account created successfully! You can now login.',
      success: true
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'An error occurred during verification' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }
    
    const user = rows[0];
    
    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
    }
    
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: 'Incorrect password. Please try again.' });
    }

    const otp = generateOTP();
    const expiryTime = Date.now() + 5 * 60 * 1000;
    
    otpStore.set(email, {
      otp,
      expiryTime,
      userId: user.id,
      role: user.role
    });

    await sendLoginOTP(email, otp);
    
    res.json({ 
      message: 'OTP sent to your email',
      requiresOTP: true
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'An error occurred during login' });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const storedData = otpStore.get(email);

    if (!storedData || Date.now() > storedData.expiryTime) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'OTP expired or invalid. Please try logging in again.' });
    }

    if (otp !== storedData.otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    // Get user data
    const [user] = await db.query(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [storedData.userId]
    );

    if (!user.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = jwt.sign({ id: storedData.userId, role: storedData.role }, process.env.JWT_SECRET);
    otpStore.delete(email);

    res.cookie('token', token, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }).json({ 
      message: 'Login successful!',
      user: user[0]
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'An error occurred during verification' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict'
  }).json({ message: 'Logged out' });
});

// Get current user info
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const [user] = await db.query(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user data' });
  }
});

// Forgot Password Routes
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const [user] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    
    if (user.length === 0) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    const otp = generateOTP();
    const expiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

    passwordResetOTPStore.set(email, {
      otp,
      expiryTime,
      userId: user[0].id
    });

    await sendPasswordResetOTP(email, otp);
    res.json({ message: 'Password reset OTP sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to process password reset request' });
  }
});

app.post('/api/auth/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const storedData = passwordResetOTPStore.get(email);

    if (!storedData || Date.now() > storedData.expiryTime) {
      passwordResetOTPStore.delete(email);
      return res.status(400).json({ message: 'OTP expired or invalid. Please try again.' });
    }

    if (otp !== storedData.otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const storedData = passwordResetOTPStore.get(email);

    if (!storedData || Date.now() > storedData.expiryTime) {
      passwordResetOTPStore.delete(email);
      return res.status(400).json({ message: 'Session expired. Please start the password reset process again.' });
    }

    if (otp !== storedData.otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, storedData.userId]);
    
    passwordResetOTPStore.delete(email);
    await sendPasswordChangeNotification(email);
    
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

// Locations API
app.get('/api/motors/:motorId/locations', async (req, res) => {
  try {
    const [locations] = await db.query(
      'SELECT id, motorId, city, address FROM motor_locations WHERE motorId = ?',
      [req.params.motorId]
    );
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ message: 'Failed to load locations' });
  }
});

app.post('/api/motors/:motorId/locations', verifyToken, async (req, res) => {
  try {
    const { city, address } = req.body;
    
    // Validate input
    if (!city || !address) {
      return res.status(400).json({ message: 'City and address are required' });
    }

    // Check if motor exists and belongs to seller
    const [motor] = await db.query(
      'SELECT id FROM motors WHERE id = ? AND sellerId = ?',
      [req.params.motorId, req.user.id]
    );

    if (!motor.length) {
      return res.status(404).json({ message: 'Motor not found or unauthorized' });
    }

    // Add location
    await db.query(
      'INSERT INTO motor_locations (motorId, city, address) VALUES (?, ?, ?)',
      [req.params.motorId, city, address]
    );

    res.json({ message: 'Location added successfully' });
  } catch (error) {
    console.error('Error adding location:', error);
    res.status(500).json({ message: 'Failed to add location' });
  }
});

// Update location
app.patch('/api/motors/:motorId/locations/:locationId', verifyToken, async (req, res) => {
  try {
    const { city, address } = req.body;
    
    // Validate input
    if (!city || !address) {
      return res.status(400).json({ message: 'City and address are required' });
    }

    // Check if motor exists and belongs to seller
    const [motor] = await db.query(
      'SELECT id FROM motors WHERE id = ? AND sellerId = ?',
      [req.params.motorId, req.user.id]
    );

    if (!motor.length) {
      return res.status(404).json({ message: 'Motor not found or unauthorized' });
    }

    // Update location
    const [result] = await db.query(
      'UPDATE motor_locations SET city = ?, address = ? WHERE id = ? AND motorId = ?',
      [city, address, req.params.locationId, req.params.motorId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Location not found' });
    }

    res.json({ message: 'Location updated successfully' });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Failed to update location' });
  }
});

// Delete location
app.delete('/api/motors/:motorId/locations/:locationId', verifyToken, async (req, res) => {
  try {
    // Check if motor exists and belongs to seller
    const [motor] = await db.query(
      'SELECT id FROM motors WHERE id = ? AND sellerId = ?',
      [req.params.motorId, req.user.id]
    );

    if (!motor.length) {
      return res.status(404).json({ message: 'Motor not found or unauthorized' });
    }

    // Delete location
    const [result] = await db.query(
      'DELETE FROM motor_locations WHERE id = ? AND motorId = ?',
      [req.params.locationId, req.params.motorId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Location not found' });
    }

    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ message: 'Failed to delete location' });
  }
});

// Motors API
app.get('/api/motors/seller', verifyToken, async (req, res) => {
  try {
    const [motors] = await db.query(`
      SELECT m.*, u.username as sellerName 
      FROM motors m 
      JOIN users u ON m.sellerId = u.id
      WHERE m.sellerId = ?
    `, [req.user.id]);
    res.json(motors);
  } catch (error) {
    console.error('Error fetching seller motors:', error);
    res.status(500).json({ message: 'Failed to fetch motors' });
  }
});

app.get('/api/motors/public', async (req, res) => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0];
    
    const [motors] = await db.query(`
      SELECT m.*, u.username as sellerName,
        CASE 
          WHEN b.id IS NOT NULL AND b.status IN ('confirmed') THEN 'booked'
          ELSE 'available'
        END as current_status,
        CASE
          WHEN b.endDate = ? THEN CONCAT(b.endDate, ' ', b.returnTime)
          ELSE b.endDate
        END as available_after
      FROM motors m 
      JOIN users u ON m.sellerId = u.id
      LEFT JOIN (
        SELECT motorId, endDate, returnTime, status, id
        FROM bookings 
        WHERE status IN ('confirmed')
        AND ((startDate = ? AND pickupTime > ?)
          OR startDate > ?
          OR (endDate = ? AND returnTime > ?)
          OR endDate > ?)
      ) b ON m.id = b.motorId
      WHERE m.isActive = true`,
      [today, today, currentTime, today, today, currentTime, today]
    );
    res.json(motors);
  } catch (error) {
    console.error('Error fetching public motors:', error);
    res.status(500).json({ message: 'Failed to fetch motors' });
  }
});

app.get('/api/motors', async (req, res) => {
  try {
    const [motors] = await db.query(`
      SELECT m.*, u.username as sellerName 
      FROM motors m 
      JOIN users u ON m.sellerId = u.id
    `);
    res.json(motors);
  } catch (error) {
    console.error('Error fetching motors:', error);
    res.status(500).json({ message: 'Failed to fetch motors' });
  }
});

const checkSubscription = require('./middleware/checkSubscription');
app.post('/api/motors', verifyToken, checkSubscription, upload.single('image'), async (req, res) => {
  try {
    const [user] = await db.query('SELECT id FROM users WHERE id = ?', [req.user.id]);
    if (!user.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    const {
      title, description, price, dailyRate, isAvailableForRent,
      motorType, brand, model, year, capacity, seats, features,
      licensePlate, mileage, maintenanceDate, insuranceExpiryDate, isActive
    } = req.body;

    const motorTypeValue = motorType || 'other';
    const seatsValue = seats || 2;
    const isActiveValue = isActive || false;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    // Parse numeric values with validation
    const parsedPrice = price && !isNaN(parseFloat(price)) ? parseFloat(price) : null;
    const parsedDailyRate = dailyRate && !isNaN(parseFloat(dailyRate)) ? parseFloat(dailyRate) : null;
    const parsedYear = year && !isNaN(parseInt(year)) ? parseInt(year) : null;
    const parsedCapacity = capacity && !isNaN(parseInt(capacity)) ? parseInt(capacity) : null;
    const parsedMileage = mileage && !isNaN(parseInt(mileage)) ? parseInt(mileage) : null;
    
    // Convert string 'true'/'false' to boolean
    // Default to true if not specified
    const isAvailableForRentBool = isAvailableForRent !== 'false';
    const isActiveBool = isActive !== 'false';

    const [result] = await db.query(
      `INSERT INTO motors (
        sellerId, title, description, price, imageUrl, dailyRate, isAvailableForRent,
        motorType, brand, model, year, capacity, seats, features,
        licensePlate, mileage, maintenanceDate, insuranceExpiryDate, isActive
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id, title, description, parsedPrice, imageUrl, parsedDailyRate, isAvailableForRentBool,
        motorTypeValue, brand || null, model || null, parsedYear, parsedCapacity, seatsValue, features || null,
        licensePlate || null, parsedMileage, maintenanceDate || null, insuranceExpiryDate || null, isActiveBool
      ]
    );
    res.json({ message: 'Motor added', motorId: result.insertId });
  } catch (error) {
    console.error('Error adding motor:', error);
    res.status(500).json({ message: 'Failed to add motor' });
  }
});

app.get('/api/motors/:id', async (req, res) => {
  try {
    const [motor] = await db.query(`
      SELECT m.*, u.username as sellerName 
      FROM motors m 
      JOIN users u ON m.sellerId = u.id 
      WHERE m.id = ? AND (m.isActive = true OR m.sellerId = ?)`, 
      [req.params.id, req.user?.id || 0]
    );
    if (!motor.length) {
      return res.status(404).json({ message: 'Motor not found' });
    }
    res.json(motor[0]);
  } catch (error) {
    console.error('Error fetching motor:', error);
    res.status(500).json({ message: 'Failed to fetch motor' });
  }
});

app.patch('/api/motors/:id', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { 
      title, description, price, dailyRate, isAvailableForRent, isActive,
      brand, model, year, motorType
    } = req.body;
    let imageUrl = undefined; // undefined means don't update the image
    
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const updateFields = [];
    const updateValues = [];

    // Only include fields that are present in the request
    if (title !== undefined) { updateFields.push('title = ?'); updateValues.push(title); }
    if (description !== undefined) { updateFields.push('description = ?'); updateValues.push(description); }
    if (price !== undefined) { updateFields.push('price = ?'); updateValues.push(parseFloat(price) || null); }
    if (dailyRate !== undefined) { updateFields.push('dailyRate = ?'); updateValues.push(parseFloat(dailyRate) || null); }
    if (isAvailableForRent !== undefined) { updateFields.push('isAvailableForRent = ?'); updateValues.push(isAvailableForRent === 'true'); }
    if (isActive !== undefined) { updateFields.push('isActive = ?'); updateValues.push(isActive === 'true'); }
    if (imageUrl !== undefined) { updateFields.push('imageUrl = ?'); updateValues.push(imageUrl); }
    if (brand !== undefined) { updateFields.push('brand = ?'); updateValues.push(brand || null); }
    if (model !== undefined) { updateFields.push('model = ?'); updateValues.push(model || null); }
    if (year !== undefined) { updateFields.push('year = ?'); updateValues.push(parseInt(year) || null); }
    if (motorType !== undefined) { updateFields.push('motorType = ?'); updateValues.push(motorType); }

    // Add the WHERE clause parameters
    updateValues.push(req.params.id, req.user.id);

    if (updateFields.length > 0) {
      await db.query(
        `UPDATE motors SET ${updateFields.join(', ')} WHERE id = ? AND sellerId = ?`,
        updateValues
      );
    }

    res.json({ message: 'Motor updated' });
  } catch (error) {
    console.error('Error updating motor:', error);
    res.status(500).json({ message: 'Failed to update motor' });
  }
});

app.delete('/api/motors/:id', verifyToken, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM reviews WHERE motor_id = ?', [req.params.id]);
    await connection.query('DELETE FROM payments WHERE bookingId IN (SELECT id FROM bookings WHERE motorId = ?)', [req.params.id]);
    await connection.query('DELETE FROM bookings WHERE motorId = ?', [req.params.id]);
    await connection.query('DELETE FROM motor_locations WHERE motorId = ?', [req.params.id]);
    await connection.query('DELETE FROM maintenance_records WHERE motorId = ?', [req.params.id]);
    await connection.query('DELETE FROM insurance_records WHERE motorId = ?', [req.params.id]);
    await connection.query('DELETE FROM motors WHERE id = ? AND sellerId = ?', [req.params.id, req.user.id]);
    await connection.commit();
    res.json({ message: 'Motor and all related records deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting motor:', error);
    res.status(500).json({ message: 'Failed to delete motor and related records' });
  } finally {
    connection.release();
  }
});

// Initialize socket service
const { initializeSocket } = require('./utils/socketService');
const { sendSubscriptionEmail } = require('./utils/emailService');

// Watch for subscription events and send emails
const watchSubscriptionEvents = async () => {
  try {
    // Get one unprocessed subscription event
    const [events] = await db.query(`
      SELECT e.*, u.email 
      FROM subscription_events e
      JOIN users u ON e.seller_id = u.id
      WHERE e.processed = 0
      AND e.event_type = 'subscription_expired'
      AND NOT EXISTS (
        SELECT 1 FROM subscription_events e2
        WHERE e2.seller_id = e.seller_id
        AND e2.event_type = e.event_type
        AND e2.processed = 1
        AND e2.event_date = e.event_date
      )
      ORDER BY e.created_at ASC
      LIMIT 1
    `);

    if (events.length > 0) {
      const event = events[0];
      const data = JSON.parse(event.data);

      // Step 2: Update the event to mark it as processed
      await db.query(
        'UPDATE subscription_events SET processed = -1 WHERE id = ?',
        [event.id]
      );

      // Step 3: Send email with complete subscription details
      console.log('Sending email to:', event.email);
      await sendSubscriptionEmail(event.email, {
        type: 'expired',
        planName: data.plan_name,
        price: data.price,
        duration: data.duration,
        maxListings: data.max_listings,
        endDate: data.end_date
      });


      // Step 4: Mark any other events for this seller today as processed to prevent duplicates
      await db.query(
        `UPDATE subscription_events 
         SET processed = 1 
         WHERE seller_id = ? 
         AND event_type = 'subscription_expired' 
         AND DATE(created_at) = CURRENT_DATE`,
        [event.seller_id]
      );

      // Emit socket event (optional, if you want to notify the frontend)
      const io = getIO();
      io.to(`seller_${event.seller_id}`).emit('subscription_update', {
        type: 'expired',
        subscription: event
      });

      console.log('Event processed and email sent successfully');
    } else {
      // console.log('No unprocessed events found');
    }
  } catch (error) {
    console.error('Error processing subscription events:', error);
  }
};

// Check for subscription events every second
setInterval(watchSubscriptionEvents, 1000);



// Register all routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const countriesRoutes = require('./routes/countries');
const sellerRoutes = require('./routes/seller');
const userRoutes = require('./routes/users');
const bookingsRoutes = require('./routes/bookings');
const notificationsRoutes = require('./routes/notifications');
const reviewsRoutes = require('./routes/reviews_updated');
const paymentsRoutes = require('./routes/payments');
const subscriptionRoutes = require('./routes/subscriptions');
const subscriptionExpireRoutes = require('./routes/subscriptions/expire');

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/countries', countriesRoutes);
app.use('/api/stripe', require('./routes/stripe'));
app.use('/api/bookings', bookingsRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationsRoutes);
// Mount reviews routes
app.use('/api/reviews', reviewsRoutes);
app.use('/api/motors/:motorId/reviews', (req, res, next) => {
  req.motorId = req.params.motorId;
  next();
}, reviewsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/subscriptions', subscriptionExpireRoutes);
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin', require('./routes/admin/chat'));
app.use('/api/tracking', require('./routes/tracking'));

app.post('/api/auth/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const storedData = otpStore.get(email);

    if (!storedData) {
      return res.status(400).json({ message: 'No active login session. Please login again.' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

    // Update stored data with new OTP
    otpStore.set(email, {
      ...storedData,
      otp,
      expiryTime
    });

    await sendLoginOTP(email, otp);

    res.json({ 
      message: 'New OTP sent to your email',
      success: true
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Failed to resend OTP' });
  }
});

// Start Server
const startServer = async () => {
  try {
    db = await initializeDatabase();
    console.log('Database initialized successfully');


    const tryPort = async (port) => {
      try {
        await new Promise((resolve, reject) => {
          const server = app.listen(port)
            .once('error', (err) => {
              if (err.code === 'EADDRINUSE') {
                server.close();
                resolve(false);
              } else {
                reject(err);
              }
            })
            .once('listening', () => {
              // Initialize Socket.IO
              const io = socketIo(server, {
                cors: {
                  origin: "http://localhost:3000",
                  methods: ["GET", "POST"],
                  credentials: true,
                  allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
                }
              });
              initializeSocket(io);

              console.log(`Server running on http://localhost:${port}`);
              resolve(true);
            });
        });
        return true;
      } catch (error) {
        console.error(`Error starting server on port ${port}:`, error);
        return false;
      }
    };

    // Try ports 5000, 5001, 5002
    for (let port = 5000; port <= 5002; port++) {
      if (await tryPort(port)) {
        break;
      }
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
