-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin', 'seller') DEFAULT 'user',
  isBlocked BOOLEAN DEFAULT false,
  isVerified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS motors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sellerId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  imageUrl VARCHAR(255),
  dailyRate DECIMAL(10, 2),
  isAvailableForRent BOOLEAN DEFAULT true,
  motorType ENUM('sport', 'cruiser', 'touring', 'dirt', 'scooter', 'other') NOT NULL,
  brand VARCHAR(100),
  model VARCHAR(100),
  year INT,
  isActive BOOLEAN DEFAULT false,
  capacity INT,
  seats INT DEFAULT 2,
  status ENUM('available', 'rented', 'maintenance', 'unavailable') DEFAULT 'available',
  features TEXT,
  licensePlate VARCHAR(20) UNIQUE,
  mileage INT,
  maintenanceDate DATE,
  insuranceExpiryDate DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sellerId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS motor_locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  motorId INT NOT NULL,
  city VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  isActive BOOLEAN DEFAULT true,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  pickupInstructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (motorId) REFERENCES motors(id)
);

CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  motorId INT NOT NULL,
  userId INT NOT NULL,
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  pickupTime TIME NOT NULL,
  returnTime TIME NOT NULL,
  locationId INT NOT NULL,
  FOREIGN KEY (locationId) REFERENCES motor_locations(id),
  status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
  totalPrice DECIMAL(10, 2) NOT NULL,
  depositAmount DECIMAL(10, 2),
  specialRequests TEXT,
  mileageStart INT,
  mileageEnd INT,
  fuelLevelStart VARCHAR(50),
  fuelLevelEnd VARCHAR(50),
  damageNotes TEXT,
  cancellationReason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (motorId) REFERENCES motors(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bookingId INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  proofUrl VARCHAR(255),
  status ENUM('pending', 'validated', 'rejected') DEFAULT 'pending',
  paymentType ENUM('deposit', 'rental', 'damage', 'refund') NOT NULL,
  paymentMethod VARCHAR(50),
  transactionId VARCHAR(100),
  refundAmount DECIMAL(10, 2),
  refundReason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bookingId) REFERENCES bookings(id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bookingId INT NOT NULL,
  userId INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  motorConditionRating INT CHECK (motorConditionRating >= 1 AND motorConditionRating <= 5),
  serviceRating INT CHECK (serviceRating >= 1 AND serviceRating <= 5),
  recommendationRating INT CHECK (recommendationRating >= 1 AND recommendationRating <= 5),
  sellerResponse TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bookingId) REFERENCES bookings(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  content TEXT NOT NULL,
  isRead BOOLEAN DEFAULT false,
  type ENUM('booking', 'payment', 'review', 'maintenance', 'system') NOT NULL,
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  actionUrl VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS maintenance_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  motorId INT NOT NULL,
  maintenanceType VARCHAR(100) NOT NULL,
  description TEXT,
  cost DECIMAL(10, 2),
  serviceDate DATE NOT NULL,
  nextServiceDate DATE,
  servicedBy VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (motorId) REFERENCES motors(id)
);

CREATE TABLE IF NOT EXISTS insurance_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  motorId INT NOT NULL,
  insuranceProvider VARCHAR(100) NOT NULL,
  policyNumber VARCHAR(100),
  coverage TEXT,
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  premium DECIMAL(10, 2),
  status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (motorId) REFERENCES motors(id)
);
