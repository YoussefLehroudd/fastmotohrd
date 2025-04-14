-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 14, 2025 at 02:46 PM
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
(54, 2, 8, '2025-04-12', '2025-04-13', '09:00:00', '09:00:00', 'laayoune, hey el massira', 'confirmed', 150.00, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-12 07:50:58', NULL),
(55, 2, 8, '2025-04-14', '2025-04-16', '10:00:00', '09:00:00', 'laayoune, hey el massira', 'confirmed', 300.00, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, '2025-04-14 10:32:40', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `countries`
--

CREATE TABLE `countries` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(10) NOT NULL,
  `flag` varchar(10) NOT NULL,
  `flag_image` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `countries`
--

INSERT INTO `countries` (`id`, `name`, `code`, `flag`, `flag_image`) VALUES
(1, 'Afghanistan', '+93', '🇦🇫', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Flag_of_the_Taliban.svg/320px-Flag_of_the_Taliban.svg.png'),
(2, 'Åland Islands', '+358', '🇦🇽', 'https://flagcdn.com/w320/ax.png'),
(3, 'Albania', '+355', '🇦🇱', 'https://flagcdn.com/w320/al.png'),
(4, 'Algeria', '+213', '🇩🇿', 'https://flagcdn.com/w320/dz.png'),
(5, 'American Samoa', '+1', '🇦🇸', 'https://flagcdn.com/w320/as.png'),
(6, 'Andorra', '+376', '🇦🇩', 'https://flagcdn.com/w320/ad.png'),
(7, 'Angola', '+244', '🇦🇴', 'https://flagcdn.com/w320/ao.png'),
(8, 'Anguilla', '+1', '🇦🇮', 'https://flagcdn.com/w320/ai.png'),
(9, 'Antarctica', '+672', '🇦🇶', 'https://flagcdn.com/w320/aq.png'),
(10, 'Antigua and Barbuda', '+1', '🇦🇬', 'https://flagcdn.com/w320/ag.png'),
(11, 'Argentina', '+54', '🇦🇷', 'https://flagcdn.com/w320/ar.png'),
(12, 'Armenia', '+374', '🇦🇲', 'https://flagcdn.com/w320/am.png'),
(13, 'Aruba', '+297', '🇦🇼', 'https://flagcdn.com/w320/aw.png'),
(14, 'Australia', '+61', '🇦🇺', 'https://flagcdn.com/w320/au.png'),
(15, 'Austria', '+43', '🇦🇹', 'https://flagcdn.com/w320/at.png'),
(16, 'Azerbaijan', '+994', '🇦🇿', 'https://flagcdn.com/w320/az.png'),
(17, 'Bahamas', '+1', '🇧🇸', 'https://flagcdn.com/w320/bs.png'),
(18, 'Bahrain', '+973', '🇧🇭', 'https://flagcdn.com/w320/bh.png'),
(19, 'Bangladesh', '+880', '🇧🇩', 'https://flagcdn.com/w320/bd.png'),
(20, 'Barbados', '+1', '🇧🇧', 'https://flagcdn.com/w320/bb.png'),
(21, 'Belarus', '+375', '🇧🇾', 'https://flagcdn.com/w320/by.png'),
(22, 'Belgium', '+32', '🇧🇪', 'https://flagcdn.com/w320/be.png'),
(23, 'Belize', '+501', '🇧🇿', 'https://flagcdn.com/w320/bz.png'),
(24, 'Benin', '+229', '🇧🇯', 'https://flagcdn.com/w320/bj.png'),
(25, 'Bermuda', '+1', '🇧🇲', 'https://flagcdn.com/w320/bm.png'),
(26, 'Bhutan', '+975', '🇧🇹', 'https://flagcdn.com/w320/bt.png'),
(27, 'Bolivia (Plurinational State of)', '+591', '🇧🇴', 'https://flagcdn.com/w320/bo.png'),
(28, 'Bonaire, Sint Eustatius and Saba', '+599', '🇧🇶', 'https://flagcdn.com/w320/bq.png'),
(29, 'Bosnia and Herzegovina', '+387', '🇧🇦', 'https://flagcdn.com/w320/ba.png'),
(30, 'Botswana', '+267', '🇧🇼', 'https://flagcdn.com/w320/bw.png'),
(31, 'Bouvet Island', '+47', '🇧🇻', 'https://flagcdn.com/w320/bv.png'),
(32, 'Brazil', '+55', '🇧🇷', 'https://flagcdn.com/w320/br.png'),
(33, 'British Indian Ocean Territory', '+246', '🇮🇴', 'https://flagcdn.com/w320/io.png'),
(34, 'United States Minor Outlying Islands', '+246', '🇺🇲', 'https://flagcdn.com/w320/um.png'),
(35, 'Virgin Islands (British)', '+1', '🇻🇬', 'https://flagcdn.com/w320/vg.png'),
(36, 'Virgin Islands (U.S.)', '+1 340', '🇻🇮', 'https://flagcdn.com/w320/vi.png'),
(37, 'Brunei Darussalam', '+673', '🇧🇳', 'https://flagcdn.com/w320/bn.png'),
(38, 'Bulgaria', '+359', '🇧🇬', 'https://flagcdn.com/w320/bg.png'),
(39, 'Burkina Faso', '+226', '🇧🇫', 'https://flagcdn.com/w320/bf.png'),
(40, 'Burundi', '+257', '🇧🇮', 'https://flagcdn.com/w320/bi.png'),
(41, 'Cambodia', '+855', '🇰🇭', 'https://flagcdn.com/w320/kh.png'),
(42, 'Cameroon', '+237', '🇨🇲', 'https://flagcdn.com/w320/cm.png'),
(43, 'Canada', '+1', '🇨🇦', 'https://flagcdn.com/w320/ca.png'),
(44, 'Cabo Verde', '+238', '🇨🇻', 'https://flagcdn.com/w320/cv.png'),
(45, 'Cayman Islands', '+1', '🇰🇾', 'https://flagcdn.com/w320/ky.png'),
(46, 'Central African Republic', '+236', '🇨🇫', 'https://flagcdn.com/w320/cf.png'),
(47, 'Chad', '+235', '🇹🇩', 'https://flagcdn.com/w320/td.png'),
(48, 'Chile', '+56', '🇨🇱', 'https://flagcdn.com/w320/cl.png'),
(49, 'China', '+86', '🇨🇳', 'https://flagcdn.com/w320/cn.png'),
(50, 'Christmas Island', '+61', '🇨🇽', 'https://flagcdn.com/w320/cx.png'),
(51, 'Cocos (Keeling) Islands', '+61', '🇨🇨', 'https://flagcdn.com/w320/cc.png'),
(52, 'Colombia', '+57', '🇨🇴', 'https://flagcdn.com/w320/co.png'),
(53, 'Comoros', '+269', '🇰🇲', 'https://flagcdn.com/w320/km.png'),
(54, 'Congo', '+242', '🇨🇬', 'https://flagcdn.com/w320/cg.png'),
(55, 'Congo (Democratic Republic of the)', '+243', '🇨🇩', 'https://flagcdn.com/w320/cd.png'),
(56, 'Cook Islands', '+682', '🇨🇰', 'https://flagcdn.com/w320/ck.png'),
(57, 'Costa Rica', '+506', '🇨🇷', 'https://flagcdn.com/w320/cr.png'),
(58, 'Croatia', '+385', '🇭🇷', 'https://flagcdn.com/w320/hr.png'),
(59, 'Cuba', '+53', '🇨🇺', 'https://flagcdn.com/w320/cu.png'),
(60, 'Curaçao', '+599', '🇨🇼', 'https://flagcdn.com/w320/cw.png'),
(61, 'Cyprus', '+357', '🇨🇾', 'https://flagcdn.com/w320/cy.png'),
(62, 'Czech Republic', '+420', '🇨🇿', 'https://flagcdn.com/w320/cz.png'),
(63, 'Denmark', '+45', '🇩🇰', 'https://flagcdn.com/w320/dk.png'),
(64, 'Djibouti', '+253', '🇩🇯', 'https://flagcdn.com/w320/dj.png'),
(65, 'Dominica', '+1', '🇩🇲', 'https://flagcdn.com/w320/dm.png'),
(66, 'Dominican Republic', '+1', '🇩🇴', 'https://flagcdn.com/w320/do.png'),
(67, 'Ecuador', '+593', '🇪🇨', 'https://flagcdn.com/w320/ec.png'),
(68, 'Egypt', '+20', '🇪🇬', 'https://flagcdn.com/w320/eg.png'),
(69, 'El Salvador', '+503', '🇸🇻', 'https://flagcdn.com/w320/sv.png'),
(70, 'Equatorial Guinea', '+240', '🇬🇶', 'https://flagcdn.com/w320/gq.png'),
(71, 'Eritrea', '+291', '🇪🇷', 'https://flagcdn.com/w320/er.png'),
(72, 'Estonia', '+372', '🇪🇪', 'https://flagcdn.com/w320/ee.png'),
(73, 'Ethiopia', '+251', '🇪🇹', 'https://flagcdn.com/w320/et.png'),
(74, 'Falkland Islands (Malvinas)', '+500', '🇫🇰', 'https://flagcdn.com/w320/fk.png'),
(75, 'Faroe Islands', '+298', '🇫🇴', 'https://flagcdn.com/w320/fo.png'),
(76, 'Fiji', '+679', '🇫🇯', 'https://flagcdn.com/w320/fj.png'),
(77, 'Finland', '+358', '🇫🇮', 'https://flagcdn.com/w320/fi.png'),
(78, 'France', '+33', '🇫🇷', 'https://flagcdn.com/w320/fr.png'),
(79, 'French Guiana', '+594', '🇬🇫', 'https://flagcdn.com/w320/gf.png'),
(80, 'French Polynesia', '+689', '🇵🇫', 'https://flagcdn.com/w320/pf.png'),
(81, 'French Southern Territories', '+262', '🇹🇫', 'https://flagcdn.com/w320/tf.png'),
(82, 'Gabon', '+241', '🇬🇦', 'https://flagcdn.com/w320/ga.png'),
(83, 'Gambia', '+220', '🇬🇲', 'https://flagcdn.com/w320/gm.png'),
(84, 'Georgia', '+995', '🇬🇪', 'https://flagcdn.com/w320/ge.png'),
(85, 'Germany', '+49', '🇩🇪', 'https://flagcdn.com/w320/de.png'),
(86, 'Ghana', '+233', '🇬🇭', 'https://flagcdn.com/w320/gh.png'),
(87, 'Gibraltar', '+350', '🇬🇮', 'https://flagcdn.com/w320/gi.png'),
(88, 'Greece', '+30', '🇬🇷', 'https://flagcdn.com/w320/gr.png'),
(89, 'Greenland', '+299', '🇬🇱', 'https://flagcdn.com/w320/gl.png'),
(90, 'Grenada', '+1', '🇬🇩', 'https://flagcdn.com/w320/gd.png'),
(91, 'Guadeloupe', '+590', '🇬🇵', 'https://flagcdn.com/w320/gp.png'),
(92, 'Guam', '+1', '🇬🇺', 'https://flagcdn.com/w320/gu.png'),
(93, 'Guatemala', '+502', '🇬🇹', 'https://flagcdn.com/w320/gt.png'),
(94, 'Guernsey', '+44', '🇬🇬', 'https://flagcdn.com/w320/gg.png'),
(95, 'Guinea', '+224', '🇬🇳', 'https://flagcdn.com/w320/gn.png'),
(96, 'Guinea-Bissau', '+245', '🇬🇼', 'https://flagcdn.com/w320/gw.png'),
(97, 'Guyana', '+592', '🇬🇾', 'https://flagcdn.com/w320/gy.png'),
(98, 'Haiti', '+509', '🇭🇹', 'https://flagcdn.com/w320/ht.png'),
(99, 'Heard Island and McDonald Islands', '+672', '🇭🇲', 'https://flagcdn.com/w320/hm.png'),
(100, 'Vatican City', '+379', '🇻🇦', 'https://flagcdn.com/w320/va.png'),
(101, 'Honduras', '+504', '🇭🇳', 'https://flagcdn.com/w320/hn.png'),
(102, 'Hungary', '+36', '🇭🇺', 'https://flagcdn.com/w320/hu.png'),
(103, 'Hong Kong', '+852', '🇭🇰', 'https://flagcdn.com/w320/hk.png'),
(104, 'Iceland', '+354', '🇮🇸', 'https://flagcdn.com/w320/is.png'),
(105, 'India', '+91', '🇮🇳', 'https://flagcdn.com/w320/in.png'),
(106, 'Indonesia', '+62', '🇮🇩', 'https://flagcdn.com/w320/id.png'),
(107, 'Ivory Coast', '+225', '🇨🇮', 'https://flagcdn.com/w320/ci.png'),
(108, 'Iran (Islamic Republic of)', '+98', '🇮🇷', 'https://flagcdn.com/w320/ir.png'),
(109, 'Iraq', '+964', '🇮🇶', 'https://flagcdn.com/w320/iq.png'),
(110, 'Ireland', '+353', '🇮🇪', 'https://flagcdn.com/w320/ie.png'),
(111, 'Isle of Man', '+44', '🇮🇲', 'https://flagcdn.com/w320/im.png'),
(112, 'Israel', '+972', '🇮🇱', 'https://flagcdn.com/w320/il.png'),
(113, 'Italy', '+39', '🇮🇹', 'https://flagcdn.com/w320/it.png'),
(114, 'Jamaica', '+1', '🇯🇲', 'https://flagcdn.com/w320/jm.png'),
(115, 'Japan', '+81', '🇯🇵', 'https://flagcdn.com/w320/jp.png'),
(116, 'Jersey', '+44', '🇯🇪', 'https://flagcdn.com/w320/je.png'),
(117, 'Jordan', '+962', '🇯🇴', 'https://flagcdn.com/w320/jo.png'),
(118, 'Kazakhstan', '+76', '🇰🇿', 'https://flagcdn.com/w320/kz.png'),
(119, 'Kenya', '+254', '🇰🇪', 'https://flagcdn.com/w320/ke.png'),
(120, 'Kiribati', '+686', '🇰🇮', 'https://flagcdn.com/w320/ki.png'),
(121, 'Kuwait', '+965', '🇰🇼', 'https://flagcdn.com/w320/kw.png'),
(122, 'Kyrgyzstan', '+996', '🇰🇬', 'https://flagcdn.com/w320/kg.png'),
(123, 'Lao People\'s Democratic Republic', '+856', '🇱🇦', 'https://flagcdn.com/w320/la.png'),
(124, 'Latvia', '+371', '🇱🇻', 'https://flagcdn.com/w320/lv.png'),
(125, 'Lebanon', '+961', '🇱🇧', 'https://flagcdn.com/w320/lb.png'),
(126, 'Lesotho', '+266', '🇱🇸', 'https://flagcdn.com/w320/ls.png'),
(127, 'Liberia', '+231', '🇱🇷', 'https://flagcdn.com/w320/lr.png'),
(128, 'Libya', '+218', '🇱🇾', 'https://flagcdn.com/w320/ly.png'),
(129, 'Liechtenstein', '+423', '🇱🇮', 'https://flagcdn.com/w320/li.png'),
(130, 'Lithuania', '+370', '🇱🇹', 'https://flagcdn.com/w320/lt.png'),
(131, 'Luxembourg', '+352', '🇱🇺', 'https://flagcdn.com/w320/lu.png'),
(132, 'Macao', '+853', '🇲🇴', 'https://flagcdn.com/w320/mo.png'),
(133, 'North Macedonia', '+389', '🇲🇰', 'https://flagcdn.com/w320/mk.png'),
(134, 'Madagascar', '+261', '🇲🇬', 'https://flagcdn.com/w320/mg.png'),
(135, 'Malawi', '+265', '🇲🇼', 'https://flagcdn.com/w320/mw.png'),
(136, 'Malaysia', '+60', '🇲🇾', 'https://flagcdn.com/w320/my.png'),
(137, 'Maldives', '+960', '🇲🇻', 'https://flagcdn.com/w320/mv.png'),
(138, 'Mali', '+223', '🇲🇱', 'https://flagcdn.com/w320/ml.png'),
(139, 'Malta', '+356', '🇲🇹', 'https://flagcdn.com/w320/mt.png'),
(140, 'Marshall Islands', '+692', '🇲🇭', 'https://flagcdn.com/w320/mh.png'),
(141, 'Martinique', '+596', '🇲🇶', 'https://flagcdn.com/w320/mq.png'),
(142, 'Mauritania', '+222', '🇲🇷', 'https://flagcdn.com/w320/mr.png'),
(143, 'Mauritius', '+230', '🇲🇺', 'https://flagcdn.com/w320/mu.png'),
(144, 'Mayotte', '+262', '🇾🇹', 'https://flagcdn.com/w320/yt.png'),
(145, 'Mexico', '+52', '🇲🇽', 'https://flagcdn.com/w320/mx.png'),
(146, 'Micronesia (Federated States of)', '+691', '🇫🇲', 'https://flagcdn.com/w320/fm.png'),
(147, 'Moldova (Republic of)', '+373', '🇲🇩', 'https://flagcdn.com/w320/md.png'),
(148, 'Monaco', '+377', '🇲🇨', 'https://flagcdn.com/w320/mc.png'),
(149, 'Mongolia', '+976', '🇲🇳', 'https://flagcdn.com/w320/mn.png'),
(150, 'Montenegro', '+382', '🇲🇪', 'https://flagcdn.com/w320/me.png'),
(151, 'Montserrat', '+1', '🇲🇸', 'https://flagcdn.com/w320/ms.png'),
(152, 'Morocco', '+212', '🇲🇦', 'https://flagcdn.com/w320/ma.png'),
(153, 'Mozambique', '+258', '🇲🇿', 'https://flagcdn.com/w320/mz.png'),
(154, 'Myanmar', '+95', '🇲🇲', 'https://flagcdn.com/w320/mm.png'),
(155, 'Namibia', '+264', '🇳🇦', 'https://flagcdn.com/w320/na.png'),
(156, 'Nauru', '+674', '🇳🇷', 'https://flagcdn.com/w320/nr.png'),
(157, 'Nepal', '+977', '🇳🇵', 'https://flagcdn.com/w320/np.png'),
(158, 'Netherlands', '+31', '🇳🇱', 'https://flagcdn.com/w320/nl.png'),
(159, 'New Caledonia', '+687', '🇳🇨', 'https://flagcdn.com/w320/nc.png'),
(160, 'New Zealand', '+64', '🇳🇿', 'https://flagcdn.com/w320/nz.png'),
(161, 'Nicaragua', '+505', '🇳🇮', 'https://flagcdn.com/w320/ni.png'),
(162, 'Niger', '+227', '🇳🇪', 'https://flagcdn.com/w320/ne.png'),
(163, 'Nigeria', '+234', '🇳🇬', 'https://flagcdn.com/w320/ng.png'),
(164, 'Niue', '+683', '🇳🇺', 'https://flagcdn.com/w320/nu.png'),
(165, 'Norfolk Island', '+672', '🇳🇫', 'https://flagcdn.com/w320/nf.png'),
(166, 'Korea (Democratic People\'s Republic of)', '+850', '🇰🇵', 'https://flagcdn.com/w320/kp.png'),
(167, 'Northern Mariana Islands', '+1', '🇲🇵', 'https://flagcdn.com/w320/mp.png'),
(168, 'Norway', '+47', '🇳🇴', 'https://flagcdn.com/w320/no.png'),
(169, 'Oman', '+968', '🇴🇲', 'https://flagcdn.com/w320/om.png'),
(170, 'Pakistan', '+92', '🇵🇰', 'https://flagcdn.com/w320/pk.png'),
(171, 'Palau', '+680', '🇵🇼', 'https://flagcdn.com/w320/pw.png'),
(172, 'Palestine, State of', '+970', '🇵🇸', 'https://flagcdn.com/w320/ps.png'),
(173, 'Panama', '+507', '🇵🇦', 'https://flagcdn.com/w320/pa.png'),
(174, 'Papua New Guinea', '+675', '🇵🇬', 'https://flagcdn.com/w320/pg.png'),
(175, 'Paraguay', '+595', '🇵🇾', 'https://flagcdn.com/w320/py.png'),
(176, 'Peru', '+51', '🇵🇪', 'https://flagcdn.com/w320/pe.png'),
(177, 'Philippines', '+63', '🇵🇭', 'https://flagcdn.com/w320/ph.png'),
(178, 'Pitcairn', '+64', '🇵🇳', 'https://flagcdn.com/w320/pn.png'),
(179, 'Poland', '+48', '🇵🇱', 'https://flagcdn.com/w320/pl.png'),
(180, 'Portugal', '+351', '🇵🇹', 'https://flagcdn.com/w320/pt.png'),
(181, 'Puerto Rico', '+1', '🇵🇷', 'https://flagcdn.com/w320/pr.png'),
(182, 'Qatar', '+974', '🇶🇦', 'https://flagcdn.com/w320/qa.png'),
(183, 'Republic of Kosovo', '+383', '🇽🇰', 'https://flagcdn.com/w320/xk.png'),
(184, 'Réunion', '+262', '🇷🇪', 'https://flagcdn.com/w320/re.png'),
(185, 'Romania', '+40', '🇷🇴', 'https://flagcdn.com/w320/ro.png'),
(186, 'Russian Federation', '+7', '🇷🇺', 'https://flagcdn.com/w320/ru.png'),
(187, 'Rwanda', '+250', '🇷🇼', 'https://flagcdn.com/w320/rw.png'),
(188, 'Saint Barthélemy', '+590', '🇧🇱', 'https://flagcdn.com/w320/bl.png'),
(189, 'Saint Helena, Ascension and Tristan da Cunha', '+290', '🇸🇭', 'https://flagcdn.com/w320/sh.png'),
(190, 'Saint Kitts and Nevis', '+1', '🇰🇳', 'https://flagcdn.com/w320/kn.png'),
(191, 'Saint Lucia', '+1', '🇱🇨', 'https://flagcdn.com/w320/lc.png'),
(192, 'Saint Martin (French part)', '+590', '🇲🇫', 'https://flagcdn.com/w320/mf.png'),
(193, 'Saint Pierre and Miquelon', '+508', '🇵🇲', 'https://flagcdn.com/w320/pm.png'),
(194, 'Saint Vincent and the Grenadines', '+1', '🇻🇨', 'https://flagcdn.com/w320/vc.png'),
(195, 'Samoa', '+685', '🇼🇸', 'https://flagcdn.com/w320/ws.png'),
(196, 'San Marino', '+378', '🇸🇲', 'https://flagcdn.com/w320/sm.png'),
(197, 'Sao Tome and Principe', '+239', '🇸🇹', 'https://flagcdn.com/w320/st.png'),
(198, 'Saudi Arabia', '+966', '🇸🇦', 'https://flagcdn.com/w320/sa.png'),
(199, 'Senegal', '+221', '🇸🇳', 'https://flagcdn.com/w320/sn.png'),
(200, 'Serbia', '+381', '🇷🇸', 'https://flagcdn.com/w320/rs.png'),
(201, 'Seychelles', '+248', '🇸🇨', 'https://flagcdn.com/w320/sc.png'),
(202, 'Sierra Leone', '+232', '🇸🇱', 'https://flagcdn.com/w320/sl.png'),
(203, 'Singapore', '+65', '🇸🇬', 'https://flagcdn.com/w320/sg.png'),
(204, 'Sint Maarten (Dutch part)', '+1', '🇸🇽', 'https://flagcdn.com/w320/sx.png'),
(205, 'Slovakia', '+421', '🇸🇰', 'https://flagcdn.com/w320/sk.png'),
(206, 'Slovenia', '+386', '🇸🇮', 'https://flagcdn.com/w320/si.png'),
(207, 'Solomon Islands', '+677', '🇸🇧', 'https://flagcdn.com/w320/sb.png'),
(208, 'Somalia', '+252', '🇸🇴', 'https://flagcdn.com/w320/so.png'),
(209, 'South Africa', '+27', '🇿🇦', 'https://flagcdn.com/w320/za.png'),
(210, 'South Georgia and the South Sandwich Islands', '+500', '🇬🇸', 'https://flagcdn.com/w320/gs.png'),
(211, 'Korea (Republic of)', '+82', '🇰🇷', 'https://flagcdn.com/w320/kr.png'),
(212, 'Spain', '+34', '🇪🇸', 'https://flagcdn.com/w320/es.png'),
(213, 'Sri Lanka', '+94', '🇱🇰', 'https://flagcdn.com/w320/lk.png'),
(214, 'Sudan', '+249', '🇸🇩', 'https://flagcdn.com/w320/sd.png'),
(215, 'South Sudan', '+211', '🇸🇸', 'https://flagcdn.com/w320/ss.png'),
(216, 'Suriname', '+597', '🇸🇷', 'https://flagcdn.com/w320/sr.png'),
(217, 'Svalbard and Jan Mayen', '+47', '🇸🇯', 'https://flagcdn.com/w320/sj.png'),
(218, 'Swaziland', '+268', '🇸🇿', 'https://flagcdn.com/w320/sz.png'),
(219, 'Sweden', '+46', '🇸🇪', 'https://flagcdn.com/w320/se.png'),
(220, 'Switzerland', '+41', '🇨🇭', 'https://flagcdn.com/w320/ch.png'),
(221, 'Syrian Arab Republic', '+963', '🇸🇾', 'https://flagcdn.com/w320/sy.png'),
(222, 'Taiwan', '+886', '🇹🇼', 'https://flagcdn.com/w320/tw.png'),
(223, 'Tajikistan', '+992', '🇹🇯', 'https://flagcdn.com/w320/tj.png'),
(224, 'Tanzania, United Republic of', '+255', '🇹🇿', 'https://flagcdn.com/w320/tz.png'),
(225, 'Thailand', '+66', '🇹🇭', 'https://flagcdn.com/w320/th.png'),
(226, 'Timor-Leste', '+670', '🇹🇱', 'https://flagcdn.com/w320/tl.png'),
(227, 'Togo', '+228', '🇹🇬', 'https://flagcdn.com/w320/tg.png'),
(228, 'Tokelau', '+690', '🇹🇰', 'https://flagcdn.com/w320/tk.png'),
(229, 'Tonga', '+676', '🇹🇴', 'https://flagcdn.com/w320/to.png'),
(230, 'Trinidad and Tobago', '+1', '🇹🇹', 'https://flagcdn.com/w320/tt.png'),
(231, 'Tunisia', '+216', '🇹🇳', 'https://flagcdn.com/w320/tn.png'),
(232, 'Turkey', '+90', '🇹🇷', 'https://flagcdn.com/w320/tr.png'),
(233, 'Turkmenistan', '+993', '🇹🇲', 'https://flagcdn.com/w320/tm.png'),
(234, 'Turks and Caicos Islands', '+1', '🇹🇨', 'https://flagcdn.com/w320/tc.png'),
(235, 'Tuvalu', '+688', '🇹🇻', 'https://flagcdn.com/w320/tv.png'),
(236, 'Uganda', '+256', '🇺🇬', 'https://flagcdn.com/w320/ug.png'),
(237, 'Ukraine', '+380', '🇺🇦', 'https://flagcdn.com/w320/ua.png'),
(238, 'United Arab Emirates', '+971', '🇦🇪', 'https://flagcdn.com/w320/ae.png'),
(239, 'United Kingdom of Great Britain and Northern Ireland', '+44', '🇬🇧', 'https://flagcdn.com/w320/gb.png'),
(240, 'United States of America', '+1', '🇺🇸', 'https://flagcdn.com/w320/us.png'),
(241, 'Uruguay', '+598', '🇺🇾', 'https://flagcdn.com/w320/uy.png'),
(242, 'Uzbekistan', '+998', '🇺🇿', 'https://flagcdn.com/w320/uz.png'),
(243, 'Vanuatu', '+678', '🇻🇺', 'https://flagcdn.com/w320/vu.png'),
(244, 'Venezuela (Bolivarian Republic of)', '+58', '🇻🇪', 'https://flagcdn.com/w320/ve.png'),
(245, 'Vietnam', '+84', '🇻🇳', 'https://flagcdn.com/w320/vn.png'),
(246, 'Wallis and Futuna', '+681', '🇼🇫', 'https://flagcdn.com/w320/wf.png'),
(247, 'Western Sahara', '+212', '🇪🇭', 'https://flagcdn.com/w320/eh.png'),
(248, 'Yemen', '+967', '🇾🇪', 'https://flagcdn.com/w320/ye.png'),
(249, 'Zambia', '+260', '🇿🇲', 'https://flagcdn.com/w320/zm.png'),
(250, 'Zimbabwe', '+263', '🇿🇼', 'https://flagcdn.com/w320/zw.png');

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
(2, 9, 'Yamaha R1', 'High-performance sportbike with advanced electronics', NULL, '/uploads/1744023465120-397580674.webp', 150.00, 1, 'sport', 'Yamaha', 'R1', 2021, 1, 998, 2, 'available', NULL, NULL, NULL, NULL, NULL, '2025-04-07 10:57:45'),
(3, 9, 'Honda CBR500R', 'Lightweight and versatile sport motorcycle', NULL, '/uploads/1744023629427-943015587.jpg', 100.00, 1, 'sport', 'Honda', 'CBR500R', 2020, 1, 471, 2, 'available', NULL, NULL, NULL, NULL, NULL, '2025-04-07 11:00:29'),
(4, 9, 'Suzuki Hayabusa', 'Legendary high-speed touring bike', NULL, '/uploads/1744023755760-156097138.jpg', 400.00, 1, 'sport', 'Suzuki', 'Hayabusa', 2022, 1, 1340, 2, 'available', NULL, NULL, NULL, NULL, NULL, '2025-04-07 11:02:35'),
(5, 9, 'KTM Duke 390', 'Lightweight naked bike with aggressive styling', NULL, '/uploads/1744023883888-45126303.jpg', 250.00, 1, 'sport', 'KTM', 'Duke 390', 2023, 1, 373, 2, 'available', NULL, NULL, NULL, NULL, NULL, '2025-04-07 11:04:43'),
(9, 9, 'Aprilia RSV4', 'Italian superbike with race-derived performance', NULL, '/uploads/1744477661240-673018404.jpg', 1500.00, 1, 'sport', 'Aprilia', 'RSV4', 2023, 1, 999, 2, 'available', NULL, NULL, NULL, NULL, NULL, '2025-04-12 17:07:41');

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
(449, 9, 'New booking request for Yamaha R1', 0, 'booking', 'high', '/bookings/48', '2025-04-11 16:53:37'),
(450, 9, 'New booking request for Yamaha R1', 0, 'booking', 'high', '/bookings/49', '2025-04-11 16:56:57'),
(463, 9, 'New booking request for Yamaha R1', 0, 'booking', 'high', '/bookings/54', '2025-04-12 07:50:58'),
(466, 9, 'New booking request for Yamaha R1', 0, 'booking', 'high', '/bookings/55', '2025-04-14 10:32:40'),
(467, 8, 'Your booking for Yamaha R1 has been confirmed', 0, 'booking', 'high', '/bookings/55', '2025-04-14 10:35:11'),
(468, 8, 'Your payment for Yamaha R1 has been validated', 0, 'payment', 'high', '/bookings/55', '2025-04-14 10:36:11');

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
(54, 54, 150.00, 'validated', 'cash_on_delivery', NULL, NULL, NULL, NULL, '2025-04-12 07:50:58', NULL, NULL, NULL, NULL),
(55, 55, 300.00, 'validated', 'cash_on_delivery', NULL, NULL, NULL, NULL, '2025-04-14 10:32:40', NULL, NULL, NULL, NULL);

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
(28, 2, 13, 4, 'waaaaa', '2025-04-11 16:16:10', NULL),
(29, 2, 8, 5, 'jjj', '2025-04-14 10:56:12', NULL);

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
(8, 'Youssef', 'antf5m@gmail.com', '$2a$12$kgtW13zIsW64GiZ9VhWmY.fdJmqxpDU0N/eb0NPbMAzkx6VaVEb3y', 'user', 0, 0, '116966854962129316707', 'antf5m@gmail.com', '2025-04-13 20:42:46', 0, '2025-04-07 10:44:43', '655899003', 'Laayoune', NULL, NULL, '+212'),
(9, 'Youssefhrd', 'youssefhrd@gmx.fr', '$2a$12$nT38OYYRIGtybU6nPkn9Hu3RW/iwny759.kLqwojdAOZfnpZcg6mS', 'seller', 0, 0, NULL, NULL, '2025-04-11 20:12:13', 0, '2025-04-07 10:46:01', NULL, NULL, NULL, NULL, '+212'),
(10, 'F5M DESIGNER', 'f5mdesigner01@gmail.com', NULL, 'admin', 0, 0, '104386487207686996449', 'f5mdesigner01@gmail.com', '2025-04-14 12:45:47', 0, '2025-04-07 13:21:46', NULL, NULL, NULL, NULL, '+212'),
(11, 'ennah', '123ennah@gmail.com', '$2a$12$2gC2nmUyI2t3SO8wAnFMMe.ardReg.Lc7aCo6vSpUJNHr4eUS3bz.', 'seller', 0, 0, NULL, NULL, '2025-04-07 13:57:21', 0, '2025-04-07 13:55:24', NULL, NULL, NULL, NULL, '+212'),
(12, 'ANT F5M44', 'monacomizaret@gmail.com', NULL, 'user', 0, 0, '111287792489336979205', 'monacomizaret@gmail.com', '2025-04-08 09:21:21', 0, '2025-04-08 09:21:21', NULL, NULL, NULL, NULL, '+212'),
(13, 'Youness', 'ccyat0518@gmail.com', '$2a$12$fUe/.Vwudi182q.GI82IL.fJhJWF1IF7j34wRafEW0qj5o2K9yYoS', 'user', 0, 0, NULL, NULL, '2025-04-11 15:53:42', 0, '2025-04-10 16:58:57', '644819899', NULL, NULL, NULL, '+212');

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT for table `countries`
--
ALTER TABLE `countries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=251;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `motor_locations`
--
ALTER TABLE `motor_locations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=469;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

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
