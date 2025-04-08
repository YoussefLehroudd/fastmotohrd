-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 07, 2025 at 08:05 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `motor_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` int(11) NOT NULL,
  `motorId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `startDate` date NOT NULL,
  `endDate` date NOT NULL,
  `pickupTime` time NOT NULL,
  `returnTime` time NOT NULL,
  `location` varchar(255) NOT NULL,
  `status` enum('pending','confirmed','cancelled','completed') DEFAULT 'pending',
  `totalPrice` decimal(10,2) NOT NULL,
  `depositAmount` decimal(10,2) DEFAULT NULL,
  `specialRequests` text DEFAULT NULL,
  `mileageStart` int(11) DEFAULT NULL,
  `mileageEnd` int(11) DEFAULT NULL,
  `fuelLevelStart` varchar(50) DEFAULT NULL,
  `fuelLevelEnd` varchar(50) DEFAULT NULL,
  `damageNotes` text DEFAULT NULL,
  `cancellationReason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `locationId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `motorId`, `userId`, `startDate`, `endDate`, `pickupTime`, `returnTime`, `location`, `status`, `totalPrice`, `depositAmount`, `specialRequests`, `mileageStart`, `mileageEnd`, `fuelLevelStart`, `fuelLevelEnd`, `damageNotes`, `cancellationReason`, `created_at`, `locationId`) VALUES
(8, 3, 8, '2025-04-10', '2025-04-11', '05:55:00', '18:06:00', 'casablanca, rue soltane', 'cancelled', 100.00, NULL, '25235', NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-07 14:05:36', NULL),
(11, 3, 8, '2025-04-06', '2025-04-29', '08:00:00', '14:00:00', 'casablanca, rue soltane', 'confirmed', 2300.00, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-07 14:18:52', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `countries`
--

CREATE TABLE `countries` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(10) NOT NULL,
  `flag` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `countries`
--

INSERT INTO `countries` (`id`, `name`, `code`, `flag`) VALUES
(257, 'Morocco', '+212', '🇲🇦'),
(258, 'Algeria', '+213', '🇩🇿'),
(259, 'Tunisia', '+216', '🇹🇳'),
(260, 'Libya', '+218', '🇱🇾'),
(261, 'Egypt', '+20', '🇪🇬'),
(262, 'Saudi Arabia', '+966', '🇸🇦'),
(263, 'UAE', '+971', '🇦🇪'),
(264, 'Qatar', '+974', '🇶🇦'),
(265, 'Kuwait', '+965', '🇰🇼'),
(266, 'Bahrain', '+973', '🇧🇭'),
(267, 'Oman', '+968', '🇴🇲'),
(268, 'Yemen', '+967', '🇾🇪'),
(269, 'Iraq', '+964', '🇮🇶'),
(270, 'Syria', '+963', '🇸🇾'),
(271, 'Lebanon', '+961', '🇱🇧'),
(272, 'Jordan', '+962', '🇯🇴'),
(273, 'Palestine', '+970', '🇵🇸'),
(274, 'Sudan', '+249', '🇸🇩'),
(275, 'Somalia', '+252', '🇸🇴'),
(276, 'Djibouti', '+253', '🇩🇯'),
(277, 'Comoros', '+269', '🇰🇲'),
(278, 'Mauritania', '+222', '🇲🇷'),
(279, 'France', '+33', '🇫🇷'),
(280, 'Germany', '+49', '🇩🇪'),
(281, 'United Kingdom', '+44', '🇬🇧'),
(282, 'Italy', '+39', '🇮🇹'),
(283, 'Spain', '+34', '🇪🇸'),
(284, 'Portugal', '+351', '🇵🇹'),
(285, 'Netherlands', '+31', '🇳🇱'),
(286, 'Belgium', '+32', '🇧🇪'),
(287, 'Switzerland', '+41', '🇨🇭'),
(288, 'Austria', '+43', '🇦🇹'),
(289, 'Sweden', '+46', '🇸🇪'),
(290, 'Norway', '+47', '🇳🇴'),
(291, 'Denmark', '+45', '🇩🇰'),
(292, 'Finland', '+358', '🇫🇮'),
(293, 'United States', '+1', '🇺🇸'),
(294, 'Canada', '+1', '🇨🇦'),
(295, 'Mexico', '+52', '🇲🇽'),
(296, 'China', '+86', '🇨🇳'),
(297, 'Japan', '+81', '🇯🇵'),
(298, 'South Korea', '+82', '🇰🇷'),
(299, 'India', '+91', '🇮🇳'),
(300, 'Pakistan', '+92', '🇵🇰'),
(301, 'Bangladesh', '+880', '🇧🇩'),
(302, 'Indonesia', '+62', '🇮🇩'),
(303, 'Malaysia', '+60', '🇲🇾'),
(304, 'Singapore', '+65', '🇸🇬'),
(305, 'Thailand', '+66', '🇹🇭'),
(306, 'Vietnam', '+84', '🇻🇳'),
(307, 'Philippines', '+63', '🇵🇭'),
(308, 'South Africa', '+27', '🇿🇦'),
(309, 'Nigeria', '+234', '🇳🇬'),
(310, 'Kenya', '+254', '🇰🇪'),
(311, 'Ethiopia', '+251', '🇪🇹'),
(312, 'Ghana', '+233', '🇬🇭'),
(313, 'Senegal', '+221', '🇸🇳'),
(314, 'Brazil', '+55', '🇧🇷'),
(315, 'Argentina', '+54', '🇦🇷'),
(316, 'Chile', '+56', '🇨🇱'),
(317, 'Colombia', '+57', '🇨🇴'),
(318, 'Peru', '+51', '🇵🇪'),
(319, 'Australia', '+61', '🇦🇺'),
(320, 'New Zealand', '+64', '🇳🇿');

-- --------------------------------------------------------

--
-- Table structure for table `insurance_records`
--

CREATE TABLE `insurance_records` (
  `id` int(11) NOT NULL,
  `motorId` int(11) NOT NULL,
  `insuranceProvider` varchar(100) NOT NULL,
  `policyNumber` varchar(100) DEFAULT NULL,
  `coverage` text DEFAULT NULL,
  `startDate` date NOT NULL,
  `endDate` date NOT NULL,
  `premium` decimal(10,2) DEFAULT NULL,
  `status` enum('active','expired','cancelled') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `maintenance_records`
--

CREATE TABLE `maintenance_records` (
  `id` int(11) NOT NULL,
  `motorId` int(11) NOT NULL,
  `maintenanceType` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT NULL,
  `serviceDate` date NOT NULL,
  `nextServiceDate` date DEFAULT NULL,
  `servicedBy` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `motors`
--

CREATE TABLE `motors` (
  `id` int(11) NOT NULL,
  `sellerId` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `imageUrl` varchar(255) DEFAULT NULL,
  `dailyRate` decimal(10,2) DEFAULT NULL,
  `isAvailableForRent` tinyint(1) DEFAULT 1,
  `motorType` enum('sport','cruiser','touring','dirt','scooter','other') NOT NULL,
  `brand` varchar(100) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `year` int(11) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 0,
  `capacity` int(11) DEFAULT NULL,
  `seats` int(11) DEFAULT 2,
  `status` enum('available','rented','maintenance','unavailable') DEFAULT 'available',
  `features` text DEFAULT NULL,
  `licensePlate` varchar(20) DEFAULT NULL,
  `mileage` int(11) DEFAULT NULL,
  `maintenanceDate` date DEFAULT NULL,
  `insuranceExpiryDate` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `motors`
--

INSERT INTO `motors` (`id`, `sellerId`, `title`, `description`, `price`, `imageUrl`, `dailyRate`, `isAvailableForRent`, `motorType`, `brand`, `model`, `year`, `isActive`, `capacity`, `seats`, `status`, `features`, `licensePlate`, `mileage`, `maintenanceDate`, `insuranceExpiryDate`, `created_at`) VALUES
(2, 9, 'Yamaha R1', 'High-performance sportbike with advanced electronics', NULL, '/uploads/1744023465120-397580674.webp', 150.00, 1, 'other', 'Yamaha', 'R1', 2021, 1, 998, 2, 'available', NULL, NULL, NULL, NULL, NULL, '2025-04-07 10:57:45'),
(3, 9, 'Honda CBR500R', 'Lightweight and versatile sport motorcycle', NULL, '/uploads/1744023629427-943015587.jpg', 100.00, 1, 'other', 'Honda', 'CBR500R', 2020, 1, 471, 2, 'available', NULL, NULL, NULL, NULL, NULL, '2025-04-07 11:00:29'),
(4, 9, 'Suzuki Hayabusa', 'Legendary high-speed touring bike', NULL, '/uploads/1744023755760-156097138.jpg', 400.00, 1, 'other', 'Suzuki', 'Hayabusa', 2022, 1, 1340, 2, 'available', NULL, NULL, NULL, NULL, NULL, '2025-04-07 11:02:35'),
(5, 9, 'KTM Duke 390', 'Lightweight naked bike with aggressive styling', NULL, '/uploads/1744023883888-45126303.jpg', 250.00, 1, 'other', 'KTM', 'Duke 390', 2023, 0, 373, 2, 'available', NULL, NULL, NULL, NULL, NULL, '2025-04-07 11:04:43'),
(6, 9, 'ksdchskdc', ';hkhkhh', NULL, '/uploads/1744036346171-757949984.jpg', 205.00, 1, 'other', 'dscdsdsc', 'e\"ée', 2025, 1, 545, 2, 'available', NULL, NULL, NULL, NULL, NULL, '2025-04-07 14:32:26');

-- --------------------------------------------------------

--
-- Table structure for table `motor_locations`
--

CREATE TABLE `motor_locations` (
  `id` int(11) NOT NULL,
  `motorId` int(11) NOT NULL,
  `city` varchar(100) NOT NULL,
  `address` text NOT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `pickupInstructions` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `motor_locations`
--

INSERT INTO `motor_locations` (`id`, `motorId`, `city`, `address`, `isActive`, `latitude`, `longitude`, `pickupInstructions`, `created_at`) VALUES
(51, 2, 'laayoune', 'hey el massira', 1, NULL, NULL, NULL, '2025-04-07 10:58:07'),
(52, 3, 'casablanca', 'rue soltane', 1, NULL, NULL, NULL, '2025-04-07 11:06:08');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `content` text NOT NULL,
  `isRead` tinyint(1) DEFAULT 0,
  `type` enum('booking','payment','review','maintenance','system') NOT NULL,
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `actionUrl` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `userId`, `content`, `isRead`, `type`, `priority`, `actionUrl`, `created_at`) VALUES
(356, 9, 'New booking request for Honda CBR500R', 0, 'booking', 'high', '/bookings/8', '2025-04-07 14:05:36'),
(358, 8, 'Your booking for Honda CBR500R has been cancelled', 1, 'booking', 'high', '/bookings/8', '2025-04-07 14:12:08'),
(363, 9, 'New booking request for Honda CBR500R', 0, 'booking', 'high', '/bookings/11', '2025-04-07 14:18:52'),
(364, 8, 'Your booking for Honda CBR500R has been confirmed', 1, 'booking', 'high', '/bookings/11', '2025-04-07 14:33:19');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `motorId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `status` enum('pending','confirmed','cancelled') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `bookingId` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('pending','validated','rejected') DEFAULT 'pending',
  `paymentMethod` enum('cash_on_delivery','bank_transfer','stripe') DEFAULT 'cash_on_delivery',
  `proofUrl` varchar(255) DEFAULT NULL,
  `validatedBy` int(11) DEFAULT NULL,
  `validatedAt` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `stripePaymentIntentId` varchar(255) DEFAULT NULL,
  `stripeClientSecret` varchar(255) DEFAULT NULL,
  `stripeCustomerId` varchar(255) DEFAULT NULL,
  `stripeChargeId` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `bookingId`, `amount`, `status`, `paymentMethod`, `proofUrl`, `validatedBy`, `validatedAt`, `notes`, `created_at`, `stripePaymentIntentId`, `stripeClientSecret`, `stripeCustomerId`, `stripeChargeId`) VALUES
(8, 8, 100.00, 'pending', 'stripe', NULL, NULL, NULL, NULL, '2025-04-07 14:05:36', NULL, NULL, NULL, NULL),
(11, 11, 2300.00, '', 'cash_on_delivery', NULL, NULL, NULL, NULL, '2025-04-07 14:18:52', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `motor_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `seller_response` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`id`, `motor_id`, `user_id`, `rating`, `comment`, `created_at`, `seller_response`) VALUES
(23, 2, 8, 4, 'good', '2025-04-07 14:40:50', 'hi');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('user','seller','admin') DEFAULT 'user',
  `isBlocked` tinyint(1) DEFAULT 0,
  `isVerified` tinyint(1) DEFAULT 0,
  `google_id` varchar(255) DEFAULT NULL,
  `google_email` varchar(100) DEFAULT NULL,
  `last_login` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `login_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `profileImageUrl` varchar(255) DEFAULT NULL,
  `countryCode` varchar(10) DEFAULT '+212'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `isBlocked`, `isVerified`, `google_id`, `google_email`, `last_login`, `login_count`, `created_at`, `phone`, `address`, `bio`, `profileImageUrl`, `countryCode`) VALUES
(8, 'ANT F5M', 'antf5m@gmail.com', '$2a$12$Y8bj1yw5hy3XaLs8WJeA9.nz6dPKjnZxjvxayD811ihNG0ZeBxlVy', 'user', 0, 0, '116966854962129316707', 'antf5m@gmail.com', '2025-04-07 13:30:37', 0, '2025-04-07 10:44:43', NULL, NULL, NULL, NULL, '+212'),
(9, 'Youssefhrd', 'youssefhrd@gmx.fr', '$2a$12$2GXdUO7GCgaDIcCVgwR3.uG62igKHAQ54eK..KF9txzA.l1w3DPly', 'seller', 0, 0, NULL, NULL, '2025-04-07 10:46:01', 0, '2025-04-07 10:46:01', NULL, NULL, NULL, NULL, '+212'),
(10, 'F5M DESIGNER', 'f5mdesigner01@gmail.com', NULL, 'admin', 0, 0, '104386487207686996449', 'f5mdesigner01@gmail.com', '2025-04-07 14:32:48', 0, '2025-04-07 13:21:46', NULL, NULL, NULL, NULL, '+212'),
(11, 'ennah', '123ennah@gmail.com', '$2a$12$2gC2nmUyI2t3SO8wAnFMMe.ardReg.Lc7aCo6vSpUJNHr4eUS3bz.', 'seller', 0, 0, NULL, NULL, '2025-04-07 13:57:21', 0, '2025-04-07 13:55:24', NULL, NULL, NULL, NULL, '+212');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `motorId` (`motorId`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `countries`
--
ALTER TABLE `countries`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `insurance_records`
--
ALTER TABLE `insurance_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `motorId` (`motorId`);

--
-- Indexes for table `maintenance_records`
--
ALTER TABLE `maintenance_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `motorId` (`motorId`);

--
-- Indexes for table `motors`
--
ALTER TABLE `motors`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sellerId` (`sellerId`);

--
-- Indexes for table `motor_locations`
--
ALTER TABLE `motor_locations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `motorId` (`motorId`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `motorId` (`motorId`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `validatedBy` (`validatedBy`),
  ADD KEY `payments_ibfk_1` (`bookingId`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_review` (`motor_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `countries`
--
ALTER TABLE `countries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=321;

--
-- AUTO_INCREMENT for table `insurance_records`
--
ALTER TABLE `insurance_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `maintenance_records`
--
ALTER TABLE `maintenance_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `motors`
--
ALTER TABLE `motors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `motor_locations`
--
ALTER TABLE `motor_locations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=365;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`motorId`) REFERENCES `motors` (`id`),
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`id`);

--
-- Constraints for table `insurance_records`
--
ALTER TABLE `insurance_records`
  ADD CONSTRAINT `insurance_records_ibfk_1` FOREIGN KEY (`motorId`) REFERENCES `motors` (`id`);

--
-- Constraints for table `maintenance_records`
--
ALTER TABLE `maintenance_records`
  ADD CONSTRAINT `maintenance_records_ibfk_1` FOREIGN KEY (`motorId`) REFERENCES `motors` (`id`);

--
-- Constraints for table `motors`
--
ALTER TABLE `motors`
  ADD CONSTRAINT `motors_ibfk_1` FOREIGN KEY (`sellerId`) REFERENCES `users` (`id`);

--
-- Constraints for table `motor_locations`
--
ALTER TABLE `motor_locations`
  ADD CONSTRAINT `motor_locations_ibfk_1` FOREIGN KEY (`motorId`) REFERENCES `motors` (`id`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`);

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`motorId`) REFERENCES `motors` (`id`),
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`id`);

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`bookingId`) REFERENCES `bookings` (`id`),
  ADD CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`validatedBy`) REFERENCES `users` (`id`);

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`motor_id`) REFERENCES `motors` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
