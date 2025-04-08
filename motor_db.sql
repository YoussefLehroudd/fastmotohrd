-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : ven. 28 mars 2025 à 21:39
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `motor_db`
--

-- --------------------------------------------------------

--
-- Structure de la table `bookings`
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

-- --------------------------------------------------------

--
-- Structure de la table `countries`
--

CREATE TABLE `countries` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(10) NOT NULL,
  `flag` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `countries`
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
-- Structure de la table `insurance_records`
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
-- Structure de la table `maintenance_records`
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
-- Structure de la table `motors`
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
-- Déchargement des données de la table `motors`
--

INSERT INTO `motors` (`id`, `sellerId`, `title`, `description`, `price`, `imageUrl`, `dailyRate`, `isAvailableForRent`, `motorType`, `brand`, `model`, `year`, `isActive`, `capacity`, `seats`, `status`, `features`, `licensePlate`, `mileage`, `maintenanceDate`, `insuranceExpiryDate`, `created_at`) VALUES
(27, 5, 'Yamaha R1', 'bien et fast', NULL, '/uploads/1743104732660-493399591.webp', 250.00, 1, 'other', NULL, NULL, NULL, 1, NULL, 2, 'available', NULL, NULL, NULL, NULL, NULL, '2025-03-27 19:45:32'),
(28, 5, 'Yamaha R1', 'tres bon etat', NULL, '/uploads/1743105453778-373887477.jpeg', 155.00, 1, 'other', NULL, NULL, NULL, 1, NULL, 2, 'available', NULL, NULL, NULL, NULL, NULL, '2025-03-27 19:57:33'),
(29, 8, 'Youssef', 'dsdqd', NULL, '/uploads/1743145155913-29054830.png', 250.00, 0, 'other', NULL, NULL, NULL, 1, NULL, 2, 'available', NULL, NULL, NULL, NULL, NULL, '2025-03-28 06:59:15');

-- --------------------------------------------------------

--
-- Structure de la table `motor_locations`
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
-- Déchargement des données de la table `motor_locations`
--

INSERT INTO `motor_locations` (`id`, `motorId`, `city`, `address`, `isActive`, `latitude`, `longitude`, `pickupInstructions`, `created_at`) VALUES
(43, 28, 'dqs', 'dqd', 1, NULL, NULL, NULL, '2025-03-27 20:04:32');

-- --------------------------------------------------------

--
-- Structure de la table `notifications`
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

-- --------------------------------------------------------

--
-- Structure de la table `orders`
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
-- Structure de la table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `bookingId` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `proofUrl` varchar(255) DEFAULT NULL,
  `status` enum('pending','validated','rejected') DEFAULT 'pending',
  `paymentType` enum('deposit','rental','damage','refund') NOT NULL,
  `paymentMethod` varchar(50) DEFAULT NULL,
  `transactionId` varchar(100) DEFAULT NULL,
  `refundAmount` decimal(10,2) DEFAULT NULL,
  `refundReason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `bookingId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `comment` text DEFAULT NULL,
  `motorConditionRating` int(11) DEFAULT NULL CHECK (`motorConditionRating` >= 1 and `motorConditionRating` <= 5),
  `serviceRating` int(11) DEFAULT NULL CHECK (`serviceRating` >= 1 and `serviceRating` <= 5),
  `recommendationRating` int(11) DEFAULT NULL CHECK (`recommendationRating` >= 1 and `recommendationRating` <= 5),
  `sellerResponse` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','admin','seller') DEFAULT 'user',
  `isBlocked` tinyint(1) DEFAULT 0,
  `isVerified` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `profileImageUrl` varchar(255) DEFAULT NULL,
  `countryCode` varchar(10) DEFAULT '+212'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `isBlocked`, `isVerified`, `created_at`, `phone`, `address`, `bio`, `profileImageUrl`, `countryCode`) VALUES
(5, 'Youssefhrd', 'antf5m@gmail.com', '$2a$12$LwKrNRg3HoJDP.sMN6ok8OqsG6PMepX0HOlq8Ysit6eqwM22N0QF6', 'seller', 0, 0, '2025-03-26 23:09:00', '644819899', 'hay el massira', 'fast services and good works', '/uploads/profiles/profile-1743107906182.jpeg', '+212'),
(7, 'nour', 'shop011112@gmail.com', '$2a$12$/.r/bCZcOE6YdH3sgZxv3u9HRFtgCTFwJ/nvzE1CaKW0Wn4MFVzZC', 'user', 0, 0, '2025-03-27 20:28:50', '143547726', '6 Impasse Entre les Murs', NULL, '/uploads/profiles/profile-1743145917551.png', '+212'),
(8, 'oussama', 'nojagem469@dizigg.com', '$2a$12$VLYsqdUlXwkwqgiO8jenU.QL.tfvMcZudtKsh5Sb0/ZXkh7tF7gyG', 'seller', 0, 0, '2025-03-28 06:52:10', NULL, NULL, 'fast service', NULL, '+212');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `motorId` (`motorId`),
  ADD KEY `userId` (`userId`),
  ADD KEY `locationId` (`locationId`);

--
-- Index pour la table `countries`
--
ALTER TABLE `countries`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `insurance_records`
--
ALTER TABLE `insurance_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `motorId` (`motorId`);

--
-- Index pour la table `maintenance_records`
--
ALTER TABLE `maintenance_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `motorId` (`motorId`);

--
-- Index pour la table `motors`
--
ALTER TABLE `motors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `licensePlate` (`licensePlate`),
  ADD KEY `sellerId` (`sellerId`);

--
-- Index pour la table `motor_locations`
--
ALTER TABLE `motor_locations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `motorId` (`motorId`);

--
-- Index pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`);

--
-- Index pour la table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `motorId` (`motorId`),
  ADD KEY `userId` (`userId`);

--
-- Index pour la table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bookingId` (`bookingId`);

--
-- Index pour la table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bookingId` (`bookingId`),
  ADD KEY `userId` (`userId`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `countries`
--
ALTER TABLE `countries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=321;

--
-- AUTO_INCREMENT pour la table `insurance_records`
--
ALTER TABLE `insurance_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `maintenance_records`
--
ALTER TABLE `maintenance_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `motors`
--
ALTER TABLE `motors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT pour la table `motor_locations`
--
ALTER TABLE `motor_locations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT pour la table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`motorId`) REFERENCES `motors` (`id`),
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `bookings_ibfk_3` FOREIGN KEY (`locationId`) REFERENCES `motor_locations` (`id`);

--
-- Contraintes pour la table `insurance_records`
--
ALTER TABLE `insurance_records`
  ADD CONSTRAINT `insurance_records_ibfk_1` FOREIGN KEY (`motorId`) REFERENCES `motors` (`id`);

--
-- Contraintes pour la table `maintenance_records`
--
ALTER TABLE `maintenance_records`
  ADD CONSTRAINT `maintenance_records_ibfk_1` FOREIGN KEY (`motorId`) REFERENCES `motors` (`id`);

--
-- Contraintes pour la table `motors`
--
ALTER TABLE `motors`
  ADD CONSTRAINT `motors_ibfk_1` FOREIGN KEY (`sellerId`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `motor_locations`
--
ALTER TABLE `motor_locations`
  ADD CONSTRAINT `motor_locations_ibfk_1` FOREIGN KEY (`motorId`) REFERENCES `motors` (`id`);

--
-- Contraintes pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`motorId`) REFERENCES `motors` (`id`),
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`bookingId`) REFERENCES `bookings` (`id`);

--
-- Contraintes pour la table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`bookingId`) REFERENCES `bookings` (`id`),
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
