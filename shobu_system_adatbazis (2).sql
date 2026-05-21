-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Gép: 127.0.0.1
-- Létrehozás ideje: 2026. Ápr 02. 20:27
-- Kiszolgáló verziója: 10.4.32-MariaDB
-- PHP verzió: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Adatbázis: `shobu_system_adatbazis`
--

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `felhasznalok`
--

CREATE TABLE `felhasznalok` (
  `id` int(11) NOT NULL,
  `felhasznalonev` varchar(100) DEFAULT NULL,
  `jelszo` varchar(100) DEFAULT NULL,
  `szerepkor` varchar(50) DEFAULT NULL,
  `klub` varchar(100) DEFAULT NULL,
  `nev` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- A tábla adatainak kiíratása `felhasznalok`
--

INSERT INTO `felhasznalok` (`id`, `felhasznalonev`, `jelszo`, `szerepkor`, `klub`, `nev`) VALUES
(1, 'KoloMarki', '1234', 'admin', 'admin', 'Admin'),
(2, 'A tatami', 'A-tatami', 'judge', '-', 'A_Tatami'),
(3, 'Balint.Tornai', '1234', 'coach', 'Vácrátóti HSE', 'Vácrátóti HSE');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `kategoria`
--

CREATE TABLE `kategoria` (
  `kategoria_id` int(11) NOT NULL,
  `megnevezes` varchar(100) NOT NULL,
  `tipus` varchar(20) DEFAULT 'KUMITE',
  `nem` varchar(20) DEFAULT 'Vegyes',
  `min_kor` int(11) DEFAULT 0,
  `max_kor` int(11) DEFAULT 99
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- A tábla adatainak kiíratása `kategoria`
--

INSERT INTO `kategoria` (`kategoria_id`, `megnevezes`, `tipus`, `nem`, `min_kor`, `max_kor`) VALUES
(1, 'Kata Girls 8-9 y.o.', 'KATA', 'Girls', 8, 9),
(2, 'Kata Boys 8-9 y.o.', 'KATA', 'Boys', 8, 9),
(3, 'Kata Girls 10-11 y.o.', 'KATA', 'Girls', 10, 11),
(4, 'Kata Boys 10-11 y.o.', 'KATA', 'Boys', 10, 11),
(5, 'Kata Girls 12-13 y.o.', 'KATA', 'Girls', 12, 13),
(6, 'Kata Boys 12-13 y.o.', 'KATA', 'Boys', 12, 13),
(7, 'Kata Girls 14-15 y.o.', 'KATA', 'Girls', 14, 15),
(8, 'Kata Boys 14-15 y.o.', 'KATA', 'Boys', 14, 15),
(9, 'Kata Girls 16-17 y.o.', 'KATA', 'Girls', 16, 17),
(10, 'Kata Boys 16-17 y.o.', 'KATA', 'Boys', 16, 17),
(11, 'Kata Women 18-34 y.o.', 'KATA', 'Women', 18, 34),
(12, 'Kata Men 18-34 y.o.', 'KATA', 'Men', 18, 34),
(13, 'Kata Women 35-49 y.o.', 'KATA', 'Women', 35, 49),
(14, 'Kata Men 35-49 y.o.', 'KATA', 'Men', 35, 49),
(15, 'Kata Women 50+ y.o.', 'KATA', 'Women', 50, 99),
(16, 'Kata Men 50+ y.o.', 'KATA', 'Men', 50, 99),
(17, 'Kumite Girls 8-9 y.o.', 'KUMITE', 'Girls', 8, 9),
(18, 'Kumite Boys 8-9 y.o.', 'KUMITE', 'Boys', 8, 9),
(19, 'Kumite Girls 10-11 y.o.', 'KUMITE', 'Girls', 10, 11),
(20, 'Kumite Boys 10-11 y.o.', 'KUMITE', 'Boys', 10, 11),
(21, 'Kumite Girls 12-13 y.o.', 'KUMITE', 'Girls', 12, 13),
(22, 'Kumite Boys 12-13 y.o.', 'KUMITE', 'Boys', 12, 13),
(23, 'Kumite Girls 14-15 y.o.', 'KUMITE', 'Girls', 14, 15),
(24, 'Kumite Boys 14-15 y.o.', 'KUMITE', 'Boys', 14, 15),
(25, 'Kumite Girls 16-17 y.o.', 'KUMITE', 'Girls', 16, 17),
(26, 'Kumite Boys 16-17 y.o.', 'KUMITE', 'Boys', 16, 17),
(27, 'Kumite Women 18+ y.o. Open', 'KUMITE', 'Women', 18, 99),
(28, 'Kumite Men 18+ y.o. Open', 'KUMITE', 'Men', 18, 99),
(29, 'Kumite Women 35+ y.o.', 'KUMITE', 'Women', 35, 99),
(30, 'Kumite Men 35-44 y.o.', 'KUMITE', 'Men', 35, 44),
(31, 'Kumite Men 45+ y.o.', 'KUMITE', 'Men', 45, 99);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `kategoria_tatami`
--

CREATE TABLE `kategoria_tatami` (
  `kategoria_id` int(11) NOT NULL,
  `tatami_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- A tábla adatainak kiíratása `kategoria_tatami`
--

INSERT INTO `kategoria_tatami` (`kategoria_id`, `tatami_id`) VALUES
(1, 1),
(2, 1),
(3, 1),
(4, 1),
(5, 1),
(6, 1),
(7, 3),
(8, 3),
(9, 2),
(10, 2),
(11, 2),
(12, 2),
(13, 3),
(14, 3),
(15, 3),
(16, 3),
(17, 1),
(18, 1),
(19, 1),
(20, 1),
(21, 3),
(22, 3),
(23, 3),
(24, 3),
(25, 2),
(26, 2),
(27, 2),
(28, 2),
(29, 3),
(30, 3),
(31, 3);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `nevezes`
--

CREATE TABLE `nevezes` (
  `versenyzo_id` int(11) NOT NULL,
  `kategoria_id` int(11) NOT NULL,
  `helyezes` int(11) DEFAULT NULL,
  `pontszam` int(11) DEFAULT NULL,
  `verseny_id` int(11) DEFAULT 1,
  `kiemelt` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `tatami`
--

CREATE TABLE `tatami` (
  `tatami_id` int(11) NOT NULL,
  `sorszam` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- A tábla adatainak kiíratása `tatami`
--

INSERT INTO `tatami` (`tatami_id`, `sorszam`) VALUES
(1, 'Tatami A'),
(2, 'Tatami B'),
(3, 'Tatami C');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `verseny`
--

CREATE TABLE `verseny` (
  `verseny_id` int(11) NOT NULL,
  `nev` varchar(100) NOT NULL,
  `datum` date NOT NULL,
  `nevezes_lezarva` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- A tábla adatainak kiíratása `verseny`
--

INSERT INTO `verseny` (`verseny_id`, `nev`, `datum`, `nevezes_lezarva`) VALUES
(1, 'Shobu HSE Országos Bajnokság 2026', '2026-05-20', 0);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `versenyzo`
--

CREATE TABLE `versenyzo` (
  `versenyzo_id` int(11) NOT NULL,
  `nev` varchar(100) NOT NULL,
  `egyesulet` varchar(100) DEFAULT NULL,
  `suly` decimal(5,1) NOT NULL DEFAULT 0.0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- A tábla adatainak kiíratása `versenyzo`
--

INSERT INTO `versenyzo` (`versenyzo_id`, `nev`, `egyesulet`, `suly`) VALUES
(1, 'Kovács Péter [K1]', 'Vácrátóti HSE', 0.0),
(2, 'Nagy Zsófia [K1]', 'Tatami SE', 0.0),
(3, 'Szabó Dávid [K1]', 'Budo SE', 0.0),
(4, 'Tóth Réka [K1]', 'Honbu Dojo', 0.0),
(5, 'Varga Máté [K1]', 'Karate Akadémia', 0.0),
(7, 'Kovács Péter [K2]', 'Vácrátóti HSE', 0.0),
(8, 'Nagy Zsófia [K2]', 'Tatami SE', 0.0),
(9, 'Szabó Dávid [K2]', 'Budo SE', 0.0),
(10, 'Tóth Réka [K2]', 'Honbu Dojo', 0.0),
(11, 'Varga Máté [K2]', 'Karate Akadémia', 0.0),
(12, 'Kiss Dóra [K2]', 'Sakura SE', 0.0),
(13, 'Kovács Péter [K3]', 'Vácrátóti HSE', 0.0),
(14, 'Nagy Zsófia [K3]', 'Tatami SE', 0.0),
(15, 'Szabó Dávid [K3]', 'Budo SE', 0.0),
(16, 'Tóth Réka [K3]', 'Honbu Dojo', 0.0),
(17, 'Varga Máté [K3]', 'Karate Akadémia', 0.0),
(18, 'Kiss Dóra [K3]', 'Sakura SE', 0.0),
(19, 'Kovács Péter [K4]', 'Vácrátóti HSE', 0.0),
(20, 'Nagy Zsófia [K4]', 'Tatami SE', 0.0),
(21, 'Szabó Dávid [K4]', 'Budo SE', 0.0),
(22, 'Tóth Réka [K4]', 'Honbu Dojo', 0.0),
(23, 'Varga Máté [K4]', 'Karate Akadémia', 0.0),
(24, 'Kiss Dóra [K4]', 'Sakura SE', 0.0),
(25, 'Kovács Péter [K5]', 'Vácrátóti HSE', 0.0),
(26, 'Nagy Zsófia [K5]', 'Tatami SE', 0.0),
(27, 'Szabó Dávid [K5]', 'Budo SE', 0.0),
(28, 'Tóth Réka [K5]', 'Honbu Dojo', 0.0),
(29, 'Varga Máté [K5]', 'Karate Akadémia', 0.0),
(30, 'Kiss Dóra [K5]', 'Sakura SE', 0.0),
(31, 'Kovács Péter [K6]', 'Vácrátóti HSE', 0.0),
(32, 'Nagy Zsófia [K6]', 'Tatami SE', 0.0),
(33, 'Szabó Dávid [K6]', 'Budo SE', 0.0),
(34, 'Tóth Réka [K6]', 'Honbu Dojo', 0.0),
(35, 'Varga Máté [K6]', 'Karate Akadémia', 0.0),
(36, 'Kiss Dóra [K6]', 'Sakura SE', 0.0),
(37, 'Kovács Péter [K7]', 'Vácrátóti HSE', 0.0),
(38, 'Nagy Zsófia [K7]', 'Tatami SE', 0.0),
(39, 'Szabó Dávid [K7]', 'Budo SE', 0.0),
(40, 'Tóth Réka [K7]', 'Honbu Dojo', 0.0),
(41, 'Varga Máté [K7]', 'Karate Akadémia', 0.0),
(42, 'Kiss Dóra [K7]', 'Sakura SE', 0.0),
(43, 'Kovács Péter [K8]', 'Vácrátóti HSE', 0.0),
(44, 'Nagy Zsófia [K8]', 'Tatami SE', 0.0),
(45, 'Szabó Dávid [K8]', 'Budo SE', 0.0),
(46, 'Tóth Réka [K8]', 'Honbu Dojo', 0.0),
(47, 'Varga Máté [K8]', 'Karate Akadémia', 0.0),
(48, 'Kiss Dóra [K8]', 'Sakura SE', 0.0),
(49, 'Kovács Péter [K9]', 'Vácrátóti HSE', 0.0),
(50, 'Nagy Zsófia [K9]', 'Tatami SE', 0.0),
(51, 'Szabó Dávid [K9]', 'Budo SE', 0.0),
(52, 'Tóth Réka [K9]', 'Honbu Dojo', 0.0),
(53, 'Varga Máté [K9]', 'Karate Akadémia', 0.0),
(54, 'Kiss Dóra [K9]', 'Sakura SE', 0.0),
(55, 'Kovács Péter [K10]', 'Vácrátóti HSE', 0.0),
(56, 'Nagy Zsófia [K10]', 'Tatami SE', 0.0),
(57, 'Szabó Dávid [K10]', 'Budo SE', 0.0),
(58, 'Tóth Réka [K10]', 'Honbu Dojo', 0.0),
(59, 'Varga Máté [K10]', 'Karate Akadémia', 0.0),
(60, 'Kiss Dóra [K10]', 'Sakura SE', 0.0),
(61, 'Kovács Péter [K11]', 'Vácrátóti HSE', 0.0),
(62, 'Nagy Zsófia [K11]', 'Tatami SE', 0.0),
(63, 'Szabó Dávid [K11]', 'Budo SE', 0.0),
(64, 'Tóth Réka [K11]', 'Honbu Dojo', 0.0),
(65, 'Varga Máté [K11]', 'Karate Akadémia', 0.0),
(66, 'Kiss Dóra [K11]', 'Sakura SE', 0.0),
(67, 'Kovács Péter [K12]', 'Vácrátóti HSE', 0.0),
(68, 'Nagy Zsófia [K12]', 'Tatami SE', 0.0),
(69, 'Szabó Dávid [K12]', 'Budo SE', 0.0),
(70, 'Tóth Réka [K12]', 'Honbu Dojo', 0.0),
(71, 'Varga Máté [K12]', 'Karate Akadémia', 0.0),
(72, 'Kiss Dóra [K12]', 'Sakura SE', 0.0),
(73, 'Kovács Péter [K13]', 'Vácrátóti HSE', 0.0),
(74, 'Nagy Zsófia [K13]', 'Tatami SE', 0.0),
(75, 'Szabó Dávid [K13]', 'Budo SE', 0.0),
(76, 'Tóth Réka [K13]', 'Honbu Dojo', 0.0),
(77, 'Varga Máté [K13]', 'Karate Akadémia', 0.0),
(78, 'Kiss Dóra [K13]', 'Sakura SE', 0.0),
(79, 'Kovács Péter [K14]', 'Vácrátóti HSE', 0.0),
(80, 'Nagy Zsófia [K14]', 'Tatami SE', 0.0),
(81, 'Szabó Dávid [K14]', 'Budo SE', 0.0),
(82, 'Tóth Réka [K14]', 'Honbu Dojo', 0.0),
(83, 'Varga Máté [K14]', 'Karate Akadémia', 0.0),
(84, 'Kiss Dóra [K14]', 'Sakura SE', 0.0),
(85, 'Kovács Péter [K15]', 'Vácrátóti HSE', 0.0),
(86, 'Nagy Zsófia [K15]', 'Tatami SE', 0.0),
(87, 'Szabó Dávid [K15]', 'Budo SE', 0.0),
(88, 'Tóth Réka [K15]', 'Honbu Dojo', 0.0),
(89, 'Varga Máté [K15]', 'Karate Akadémia', 0.0),
(90, 'Kiss Dóra [K15]', 'Sakura SE', 0.0),
(91, 'Kovács Péter [K16]', 'Vácrátóti HSE', 0.0),
(92, 'Nagy Zsófia [K16]', 'Tatami SE', 0.0),
(93, 'Szabó Dávid [K16]', 'Budo SE', 0.0),
(94, 'Tóth Réka [K16]', 'Honbu Dojo', 0.0),
(95, 'Varga Máté [K16]', 'Karate Akadémia', 0.0),
(96, 'Kiss Dóra [K16]', 'Sakura SE', 0.0),
(97, 'Kovács Péter [K17]', 'Vácrátóti HSE', 0.0),
(98, 'Nagy Zsófia [K17]', 'Tatami SE', 0.0),
(99, 'Szabó Dávid [K17]', 'Budo SE', 0.0),
(100, 'Tóth Réka [K17]', 'Honbu Dojo', 0.0),
(101, 'Varga Máté [K17]', 'Karate Akadémia', 0.0),
(102, 'Kiss Dóra [K17]', 'Sakura SE', 0.0),
(103, 'Kovács Péter [K18]', 'Vácrátóti HSE', 0.0),
(104, 'Nagy Zsófia [K18]', 'Tatami SE', 0.0),
(105, 'Szabó Dávid [K18]', 'Budo SE', 0.0),
(106, 'Tóth Réka [K18]', 'Honbu Dojo', 0.0),
(107, 'Varga Máté [K18]', 'Karate Akadémia', 0.0),
(108, 'Kiss Dóra [K18]', 'Sakura SE', 0.0),
(109, 'Kovács Péter [K19]', 'Vácrátóti HSE', 0.0),
(110, 'Nagy Zsófia [K19]', 'Tatami SE', 0.0),
(111, 'Szabó Dávid [K19]', 'Budo SE', 0.0),
(112, 'Tóth Réka [K19]', 'Honbu Dojo', 0.0),
(113, 'Varga Máté [K19]', 'Karate Akadémia', 0.0),
(114, 'Kiss Dóra [K19]', 'Sakura SE', 0.0),
(115, 'Kovács Péter [K20]', 'Vácrátóti HSE', 0.0),
(116, 'Nagy Zsófia [K20]', 'Tatami SE', 0.0),
(117, 'Szabó Dávid [K20]', 'Budo SE', 0.0),
(118, 'Tóth Réka [K20]', 'Honbu Dojo', 0.0),
(119, 'Varga Máté [K20]', 'Karate Akadémia', 0.0),
(120, 'Kiss Dóra [K20]', 'Sakura SE', 0.0),
(121, 'Kovács Péter [K21]', 'Vácrátóti HSE', 0.0),
(122, 'Nagy Zsófia [K21]', 'Tatami SE', 0.0),
(123, 'Szabó Dávid [K21]', 'Budo SE', 0.0),
(124, 'Tóth Réka [K21]', 'Honbu Dojo', 0.0),
(125, 'Varga Máté [K21]', 'Karate Akadémia', 0.0),
(126, 'Kiss Dóra [K21]', 'Sakura SE', 0.0),
(127, 'Kovács Péter [K22]', 'Vácrátóti HSE', 0.0),
(128, 'Nagy Zsófia [K22]', 'Tatami SE', 0.0),
(129, 'Szabó Dávid [K22]', 'Budo SE', 0.0),
(130, 'Tóth Réka [K22]', 'Honbu Dojo', 0.0),
(131, 'Varga Máté [K22]', 'Karate Akadémia', 0.0),
(132, 'Kiss Dóra [K22]', 'Sakura SE', 0.0),
(133, 'Kovács Péter [K23]', 'Vácrátóti HSE', 0.0),
(134, 'Nagy Zsófia [K23]', 'Tatami SE', 0.0),
(135, 'Szabó Dávid [K23]', 'Budo SE', 0.0),
(136, 'Tóth Réka [K23]', 'Honbu Dojo', 0.0),
(137, 'Varga Máté [K23]', 'Karate Akadémia', 0.0),
(138, 'Kiss Dóra [K23]', 'Sakura SE', 0.0),
(139, 'Kovács Péter [K24]', 'Vácrátóti HSE', 0.0),
(140, 'Nagy Zsófia [K24]', 'Tatami SE', 0.0),
(141, 'Szabó Dávid [K24]', 'Budo SE', 0.0),
(142, 'Tóth Réka [K24]', 'Honbu Dojo', 0.0),
(143, 'Varga Máté [K24]', 'Karate Akadémia', 0.0),
(144, 'Kiss Dóra [K24]', 'Sakura SE', 0.0),
(145, 'Kovács Péter [K25]', 'Vácrátóti HSE', 0.0),
(146, 'Nagy Zsófia [K25]', 'Tatami SE', 0.0),
(147, 'Szabó Dávid [K25]', 'Budo SE', 0.0),
(148, 'Tóth Réka [K25]', 'Honbu Dojo', 0.0),
(149, 'Varga Máté [K25]', 'Karate Akadémia', 0.0),
(150, 'Kiss Dóra [K25]', 'Sakura SE', 0.0),
(151, 'Kovács Péter [K26]', 'Vácrátóti HSE', 0.0),
(152, 'Nagy Zsófia [K26]', 'Tatami SE', 0.0),
(153, 'Szabó Dávid [K26]', 'Budo SE', 0.0),
(154, 'Tóth Réka [K26]', 'Honbu Dojo', 0.0),
(155, 'Varga Máté [K26]', 'Karate Akadémia', 0.0),
(156, 'Kiss Dóra [K26]', 'Sakura SE', 0.0),
(157, 'Kovács Péter [K27]', 'Vácrátóti HSE', 0.0),
(158, 'Nagy Zsófia [K27]', 'Tatami SE', 0.0),
(159, 'Szabó Dávid [K27]', 'Budo SE', 0.0),
(160, 'Tóth Réka [K27]', 'Honbu Dojo', 0.0),
(161, 'Varga Máté [K27]', 'Karate Akadémia', 0.0),
(163, 'Kovács Péter [K28]', 'Vácrátóti HSE', 0.0),
(164, 'Nagy Zsófia [K28]', 'Tatami SE', 0.0),
(165, 'Szabó Dávid [K28]', 'Budo SE', 0.0),
(166, 'Tóth Réka [K28]', 'Honbu Dojo', 0.0),
(167, 'Varga Máté [K28]', 'Karate Akadémia', 0.0),
(168, 'Kiss Dóra [K28]', 'Sakura SE', 0.0),
(169, 'Kovács Péter [K29]', 'Vácrátóti HSE', 0.0),
(170, 'Nagy Zsófia [K29]', 'Tatami SE', 0.0),
(171, 'Szabó Dávid [K29]', 'Budo SE', 0.0),
(172, 'Tóth Réka [K29]', 'Honbu Dojo', 0.0),
(173, 'Varga Máté [K29]', 'Karate Akadémia', 0.0),
(174, 'Kiss Dóra [K29]', 'Sakura SE', 0.0),
(175, 'Kovács Péter [K30]', 'Vácrátóti HSE', 0.0),
(176, 'Nagy Zsófia [K30]', 'Tatami SE', 0.0),
(177, 'Szabó Dávid [K30]', 'Budo SE', 0.0),
(178, 'Tóth Réka [K30]', 'Honbu Dojo', 0.0),
(179, 'Varga Máté [K30]', 'Karate Akadémia', 0.0),
(180, 'Kiss Dóra [K30]', 'Sakura SE', 0.0),
(181, 'Kovács Péter [K31]', 'Vácrátóti HSE', 0.0),
(182, 'Nagy Zsófia [K31]', 'Tatami SE', 0.0),
(183, 'Szabó Dávid [K31]', 'Budo SE', 0.0),
(184, 'Tóth Réka [K31]', 'Honbu Dojo', 0.0),
(185, 'Varga Máté [K31]', 'Karate Akadémia', 0.0),
(186, 'Kiss Dóra [K31]', 'Sakura SE', 0.0),
(187, 'Kovács Péter [K32]', 'Vácrátóti HSE', 0.0),
(188, 'Nagy Zsófia [K32]', 'Tatami SE', 0.0),
(189, 'Szabó Dávid [K32]', 'Budo SE', 0.0),
(190, 'Tóth Réka [K32]', 'Honbu Dojo', 0.0),
(191, 'Varga Máté [K32]', 'Karate Akadémia', 0.0),
(192, 'Kiss Dóra [K32]', 'Sakura SE', 0.0),
(193, 'Kovács Péter [K33]', 'Vácrátóti HSE', 0.0),
(194, 'Nagy Zsófia [K33]', 'Tatami SE', 0.0),
(195, 'Szabó Dávid [K33]', 'Budo SE', 0.0),
(196, 'Tóth Réka [K33]', 'Honbu Dojo', 0.0),
(197, 'Varga Máté [K33]', 'Karate Akadémia', 0.0),
(198, 'Kiss Dóra [K33]', 'Sakura SE', 0.0),
(199, 'Kovács Péter [K34]', 'Vácrátóti HSE', 0.0),
(200, 'Nagy Zsófia [K34]', 'Tatami SE', 0.0),
(201, 'Szabó Dávid [K34]', 'Budo SE', 0.0),
(202, 'Tóth Réka [K34]', 'Honbu Dojo', 0.0),
(203, 'Varga Máté [K34]', 'Karate Akadémia', 0.0),
(204, 'Kiss Dóra [K34]', 'Sakura SE', 0.0),
(205, 'Kovács Péter [K35]', 'Vácrátóti HSE', 0.0),
(206, 'Nagy Zsófia [K35]', 'Tatami SE', 0.0),
(207, 'Szabó Dávid [K35]', 'Budo SE', 0.0),
(208, 'Tóth Réka [K35]', 'Honbu Dojo', 0.0),
(209, 'Varga Máté [K35]', 'Karate Akadémia', 0.0),
(210, 'Kiss Dóra [K35]', 'Sakura SE', 0.0),
(211, 'Kovács Péter [K36]', 'Vácrátóti HSE', 0.0),
(212, 'Nagy Zsófia [K36]', 'Tatami SE', 0.0),
(213, 'Szabó Dávid [K36]', 'Budo SE', 0.0),
(214, 'Tóth Réka [K36]', 'Honbu Dojo', 0.0),
(215, 'Varga Máté [K36]', 'Karate Akadémia', 0.0),
(216, 'Kiss Dóra [K36]', 'Sakura SE', 0.0),
(217, 'Kovács Péter [K37]', 'Vácrátóti HSE', 0.0),
(218, 'Nagy Zsófia [K37]', 'Tatami SE', 0.0),
(219, 'Szabó Dávid [K37]', 'Budo SE', 0.0),
(220, 'Tóth Réka [K37]', 'Honbu Dojo', 0.0),
(221, 'Varga Máté [K37]', 'Karate Akadémia', 0.0),
(222, 'Kiss Dóra [K37]', 'Sakura SE', 0.0),
(223, 'Kovács Péter [K38]', 'Vácrátóti HSE', 0.0),
(224, 'Nagy Zsófia [K38]', 'Tatami SE', 0.0),
(225, 'Szabó Dávid [K38]', 'Budo SE', 0.0),
(226, 'Tóth Réka [K38]', 'Honbu Dojo', 0.0),
(227, 'Varga Máté [K38]', 'Karate Akadémia', 0.0),
(228, 'Kiss Dóra [K38]', 'Sakura SE', 0.0),
(229, 'Kovács Péter [K39]', 'Vácrátóti HSE', 0.0),
(230, 'Nagy Zsófia [K39]', 'Tatami SE', 0.0),
(231, 'Szabó Dávid [K39]', 'Budo SE', 0.0),
(232, 'Tóth Réka [K39]', 'Honbu Dojo', 0.0),
(233, 'Varga Máté [K39]', 'Karate Akadémia', 0.0),
(234, 'Kiss Dóra [K39]', 'Sakura SE', 0.0),
(235, 'Kovács Péter [K40]', 'Vácrátóti HSE', 0.0),
(236, 'Nagy Zsófia [K40]', 'Tatami SE', 0.0),
(237, 'Szabó Dávid [K40]', 'Budo SE', 0.0),
(238, 'Tóth Réka [K40]', 'Honbu Dojo', 0.0),
(239, 'Varga Máté [K40]', 'Karate Akadémia', 0.0),
(240, 'Kiss Dóra [K40]', 'Sakura SE', 0.0),
(241, 'Kovács Péter [K41]', 'Vácrátóti HSE', 0.0),
(242, 'Nagy Zsófia [K41]', 'Tatami SE', 0.0),
(243, 'Szabó Dávid [K41]', 'Budo SE', 0.0),
(244, 'Tóth Réka [K41]', 'Honbu Dojo', 0.0),
(245, 'Varga Máté [K41]', 'Karate Akadémia', 0.0),
(246, 'Kiss Dóra [K41]', 'Sakura SE', 0.0),
(247, 'Kovács Péter [K42]', 'Vácrátóti HSE', 0.0),
(248, 'Nagy Zsófia [K42]', 'Tatami SE', 0.0),
(249, 'Szabó Dávid [K42]', 'Budo SE', 0.0),
(250, 'Tóth Réka [K42]', 'Honbu Dojo', 0.0),
(251, 'Varga Máté [K42]', 'Karate Akadémia', 0.0),
(252, 'Kiss Dóra [K42]', 'Sakura SE', 0.0),
(253, 'Kovács Péter [K43]', 'Vácrátóti HSE', 0.0),
(254, 'Nagy Zsófia [K43]', 'Tatami SE', 0.0),
(255, 'Szabó Dávid [K43]', 'Budo SE', 0.0),
(256, 'Tóth Réka [K43]', 'Honbu Dojo', 0.0),
(257, 'Varga Máté [K43]', 'Karate Akadémia', 0.0),
(258, 'Kiss Dóra [K43]', 'Sakura SE', 0.0),
(259, 'Kovács Péter [K44]', 'Vácrátóti HSE', 0.0),
(260, 'Nagy Zsófia [K44]', 'Tatami SE', 0.0),
(261, 'Szabó Dávid [K44]', 'Budo SE', 0.0),
(262, 'Tóth Réka [K44]', 'Honbu Dojo', 0.0),
(263, 'Varga Máté [K44]', 'Karate Akadémia', 0.0),
(264, 'Kiss Dóra [K44]', 'Sakura SE', 0.0),
(265, 'Kovács Péter [K45]', 'Vácrátóti HSE', 0.0),
(266, 'Nagy Zsófia [K45]', 'Tatami SE', 0.0),
(267, 'Szabó Dávid [K45]', 'Budo SE', 0.0),
(268, 'Tóth Réka [K45]', 'Honbu Dojo', 0.0),
(269, 'Varga Máté [K45]', 'Karate Akadémia', 0.0),
(270, 'Kiss Dóra [K45]', 'Sakura SE', 0.0),
(271, 'Kovács Péter [K46]', 'Vácrátóti HSE', 0.0),
(272, 'Nagy Zsófia [K46]', 'Tatami SE', 0.0),
(273, 'Szabó Dávid [K46]', 'Budo SE', 0.0),
(274, 'Tóth Réka [K46]', 'Honbu Dojo', 0.0),
(275, 'Varga Máté [K46]', 'Karate Akadémia', 0.0),
(276, 'Kiss Dóra [K46]', 'Sakura SE', 0.0),
(277, 'Kovács Péter [K47]', 'Vácrátóti HSE', 0.0),
(278, 'Nagy Zsófia [K47]', 'Tatami SE', 0.0),
(279, 'Szabó Dávid [K47]', 'Budo SE', 0.0),
(280, 'Tóth Réka [K47]', 'Honbu Dojo', 0.0),
(281, 'Varga Máté [K47]', 'Karate Akadémia', 0.0),
(282, 'Kiss Dóra [K47]', 'Sakura SE', 0.0),
(283, 'Kovács Péter [K48]', 'Vácrátóti HSE', 0.0),
(284, 'Nagy Zsófia [K48]', 'Tatami SE', 0.0),
(285, 'Szabó Dávid [K48]', 'Budo SE', 0.0),
(286, 'Tóth Réka [K48]', 'Honbu Dojo', 0.0),
(287, 'Varga Máté [K48]', 'Karate Akadémia', 0.0),
(288, 'Kiss Dóra [K48]', 'Sakura SE', 0.0),
(289, 'Kovács Péter [K49]', 'Vácrátóti HSE', 0.0),
(290, 'Nagy Zsófia [K49]', 'Tatami SE', 0.0),
(291, 'Szabó Dávid [K49]', 'Budo SE', 0.0),
(292, 'Tóth Réka [K49]', 'Honbu Dojo', 0.0),
(293, 'Varga Máté [K49]', 'Karate Akadémia', 0.0),
(294, 'Kiss Dóra [K49]', 'Sakura SE', 0.0),
(295, 'Kovács Péter [K50]', 'Vácrátóti HSE', 0.0),
(296, 'Nagy Zsófia [K50]', 'Tatami SE', 0.0),
(297, 'Szabó Dávid [K50]', 'Budo SE', 0.0),
(298, 'Tóth Réka [K50]', 'Honbu Dojo', 0.0),
(299, 'Varga Máté [K50]', 'Karate Akadémia', 0.0),
(300, 'Kiss Dóra [K50]', 'Sakura SE', 0.0),
(301, 'Kovács Péter [K51]', 'Vácrátóti HSE', 0.0),
(302, 'Nagy Zsófia [K51]', 'Tatami SE', 0.0),
(303, 'Szabó Dávid [K51]', 'Budo SE', 0.0),
(304, 'Tóth Réka [K51]', 'Honbu Dojo', 0.0),
(305, 'Varga Máté [K51]', 'Karate Akadémia', 0.0),
(306, 'Kiss Dóra [K51]', 'Sakura SE', 0.0),
(307, 'Kovács Péter [K52]', 'Vácrátóti HSE', 0.0),
(308, 'Nagy Zsófia [K52]', 'Tatami SE', 0.0),
(309, 'Szabó Dávid [K52]', 'Budo SE', 0.0),
(310, 'Tóth Réka [K52]', 'Honbu Dojo', 0.0),
(311, 'Varga Máté [K52]', 'Karate Akadémia', 0.0),
(312, 'Kiss Dóra [K52]', 'Sakura SE', 0.0),
(313, 'Kovács Péter [K53]', 'Vácrátóti HSE', 0.0),
(314, 'Nagy Zsófia [K53]', 'Tatami SE', 0.0),
(315, 'Szabó Dávid [K53]', 'Budo SE', 0.0),
(316, 'Tóth Réka [K53]', 'Honbu Dojo', 0.0),
(317, 'Varga Máté [K53]', 'Karate Akadémia', 0.0),
(318, 'Kiss Dóra [K53]', 'Sakura SE', 0.0),
(319, 'Kovács Péter [K54]', 'Vácrátóti HSE', 0.0),
(320, 'Nagy Zsófia [K54]', 'Tatami SE', 0.0),
(321, 'Szabó Dávid [K54]', 'Budo SE', 0.0),
(322, 'Tóth Réka [K54]', 'Honbu Dojo', 0.0),
(323, 'Varga Máté [K54]', 'Karate Akadémia', 0.0),
(324, 'Kiss Dóra [K54]', 'Sakura SE', 0.0),
(325, 'Kovács Péter [K55]', 'Vácrátóti HSE', 0.0),
(326, 'Nagy Zsófia [K55]', 'Tatami SE', 0.0),
(327, 'Szabó Dávid [K55]', 'Budo SE', 0.0),
(328, 'Tóth Réka [K55]', 'Honbu Dojo', 0.0),
(329, 'Varga Máté [K55]', 'Karate Akadémia', 0.0),
(330, 'Kiss Dóra [K55]', 'Sakura SE', 0.0),
(331, 'Kovács Péter [K56]', 'Vácrátóti HSE', 0.0),
(332, 'Nagy Zsófia [K56]', 'Tatami SE', 0.0),
(333, 'Szabó Dávid [K56]', 'Budo SE', 0.0),
(334, 'Tóth Réka [K56]', 'Honbu Dojo', 0.0),
(335, 'Varga Máté [K56]', 'Karate Akadémia', 0.0),
(336, 'Kiss Dóra [K56]', 'Sakura SE', 0.0),
(337, 'Kovács Péter [K57]', 'Vácrátóti HSE', 0.0),
(338, 'Nagy Zsófia [K57]', 'Tatami SE', 0.0),
(339, 'Szabó Dávid [K57]', 'Budo SE', 0.0),
(340, 'Tóth Réka [K57]', 'Honbu Dojo', 0.0),
(341, 'Varga Máté [K57]', 'Karate Akadémia', 0.0),
(342, 'Kiss Dóra [K57]', 'Sakura SE', 0.0),
(343, 'Kovács Péter [K58]', 'Vácrátóti HSE', 0.0),
(344, 'Nagy Zsófia [K58]', 'Tatami SE', 0.0),
(345, 'Szabó Dávid [K58]', 'Budo SE', 0.0),
(346, 'Tóth Réka [K58]', 'Honbu Dojo', 0.0),
(347, 'Varga Máté [K58]', 'Karate Akadémia', 0.0),
(348, 'Kiss Dóra [K58]', 'Sakura SE', 0.0),
(349, 'Kovács Péter [K59]', 'Vácrátóti HSE', 0.0),
(350, 'Nagy Zsófia [K59]', 'Tatami SE', 0.0),
(351, 'Szabó Dávid [K59]', 'Budo SE', 0.0),
(352, 'Tóth Réka [K59]', 'Honbu Dojo', 0.0),
(353, 'Varga Máté [K59]', 'Karate Akadémia', 0.0),
(354, 'Kiss Dóra [K59]', 'Sakura SE', 0.0),
(355, 'Kovács Péter [K60]', 'Vácrátóti HSE', 0.0),
(356, 'Nagy Zsófia [K60]', 'Tatami SE', 0.0),
(357, 'Szabó Dávid [K60]', 'Budo SE', 0.0),
(358, 'Tóth Réka [K60]', 'Honbu Dojo', 0.0),
(359, 'Varga Máté [K60]', 'Karate Akadémia', 0.0),
(360, 'Kiss Dóra [K60]', 'Sakura SE', 0.0),
(361, 'Kovács Péter [K61]', 'Vácrátóti HSE', 0.0),
(362, 'Nagy Zsófia [K61]', 'Tatami SE', 0.0),
(363, 'Szabó Dávid [K61]', 'Budo SE', 0.0),
(364, 'Tóth Réka [K61]', 'Honbu Dojo', 0.0),
(365, 'Varga Máté [K61]', 'Karate Akadémia', 0.0),
(366, 'Kiss Dóra [K61]', 'Sakura SE', 0.0),
(367, 'Kovács Péter [K62]', 'Vácrátóti HSE', 0.0),
(368, 'Nagy Zsófia [K62]', 'Tatami SE', 0.0),
(369, 'Szabó Dávid [K62]', 'Budo SE', 0.0),
(370, 'Tóth Réka [K62]', 'Honbu Dojo', 0.0),
(371, 'Varga Máté [K62]', 'Karate Akadémia', 0.0),
(372, 'Kiss Dóra [K62]', 'Sakura SE', 0.0),
(373, 'Kovács Péter [K63]', 'Vácrátóti HSE', 0.0),
(374, 'Nagy Zsófia [K63]', 'Tatami SE', 0.0),
(375, 'Szabó Dávid [K63]', 'Budo SE', 0.0),
(376, 'Tóth Réka [K63]', 'Honbu Dojo', 0.0),
(377, 'Varga Máté [K63]', 'Karate Akadémia', 0.0),
(378, 'Kiss Dóra [K63]', 'Sakura SE', 0.0),
(379, 'Kovács Péter [K64]', 'Vácrátóti HSE', 0.0),
(380, 'Nagy Zsófia [K64]', 'Tatami SE', 0.0),
(381, 'Szabó Dávid [K64]', 'Budo SE', 0.0),
(382, 'Tóth Réka [K64]', 'Honbu Dojo', 0.0),
(383, 'Varga Máté [K64]', 'Karate Akadémia', 0.0),
(384, 'Kiss Dóra [K64]', 'Sakura SE', 0.0),
(385, 'Kovács Péter [K65]', 'Vácrátóti HSE', 0.0),
(386, 'Nagy Zsófia [K65]', 'Tatami SE', 0.0),
(387, 'Szabó Dávid [K65]', 'Budo SE', 0.0),
(388, 'Tóth Réka [K65]', 'Honbu Dojo', 0.0),
(389, 'Varga Máté [K65]', 'Karate Akadémia', 0.0),
(390, 'Kiss Dóra [K65]', 'Sakura SE', 0.0),
(391, 'Kovács Péter [K66]', 'Vácrátóti HSE', 0.0),
(392, 'Nagy Zsófia [K66]', 'Tatami SE', 0.0),
(393, 'Szabó Dávid [K66]', 'Budo SE', 0.0),
(394, 'Tóth Réka [K66]', 'Honbu Dojo', 0.0),
(395, 'Varga Máté [K66]', 'Karate Akadémia', 0.0),
(396, 'Kiss Dóra [K66]', 'Sakura SE', 0.0),
(397, 'Kovács Péter [K67]', 'Vácrátóti HSE', 0.0),
(398, 'Nagy Zsófia [K67]', 'Tatami SE', 0.0),
(399, 'Szabó Dávid [K67]', 'Budo SE', 0.0),
(400, 'Tóth Réka [K67]', 'Honbu Dojo', 0.0),
(401, 'Varga Máté [K67]', 'Karate Akadémia', 0.0),
(402, 'Kiss Dóra [K67]', 'Sakura SE', 0.0),
(403, 'Kovács Péter [K68]', 'Vácrátóti HSE', 0.0),
(404, 'Nagy Zsófia [K68]', 'Tatami SE', 0.0),
(405, 'Szabó Dávid [K68]', 'Budo SE', 0.0),
(406, 'Tóth Réka [K68]', 'Honbu Dojo', 0.0),
(407, 'Varga Máté [K68]', 'Karate Akadémia', 0.0),
(408, 'Kiss Dóra [K68]', 'Sakura SE', 0.0),
(409, 'Kovács Péter [K69]', 'Vácrátóti HSE', 0.0),
(410, 'Nagy Zsófia [K69]', 'Tatami SE', 0.0),
(411, 'Szabó Dávid [K69]', 'Budo SE', 0.0),
(412, 'Tóth Réka [K69]', 'Honbu Dojo', 0.0),
(413, 'Varga Máté [K69]', 'Karate Akadémia', 0.0),
(414, 'Kiss Dóra [K69]', 'Sakura SE', 0.0),
(415, 'Kovács Péter [K70]', 'Vácrátóti HSE', 0.0),
(416, 'Nagy Zsófia [K70]', 'Tatami SE', 0.0),
(417, 'Szabó Dávid [K70]', 'Budo SE', 0.0),
(418, 'Tóth Réka [K70]', 'Honbu Dojo', 0.0),
(419, 'Varga Máté [K70]', 'Karate Akadémia', 0.0),
(420, 'Kiss Dóra [K70]', 'Sakura SE', 0.0),
(421, 'Kovács Péter [K71]', 'Vácrátóti HSE', 0.0),
(422, 'Nagy Zsófia [K71]', 'Tatami SE', 0.0),
(423, 'Szabó Dávid [K71]', 'Budo SE', 0.0),
(424, 'Tóth Réka [K71]', 'Honbu Dojo', 0.0),
(425, 'Varga Máté [K71]', 'Karate Akadémia', 0.0),
(426, 'Kiss Dóra [K71]', 'Sakura SE', 0.0),
(427, 'Kovács Péter [K72]', 'Vácrátóti HSE', 0.0),
(428, 'Nagy Zsófia [K72]', 'Tatami SE', 0.0),
(429, 'Szabó Dávid [K72]', 'Budo SE', 0.0),
(430, 'Tóth Réka [K72]', 'Honbu Dojo', 0.0),
(431, 'Varga Máté [K72]', 'Karate Akadémia', 0.0),
(432, 'Kiss Dóra [K72]', 'Sakura SE', 0.0),
(433, 'Kovács Péter [K73]', 'Vácrátóti HSE', 0.0),
(434, 'Nagy Zsófia [K73]', 'Tatami SE', 0.0),
(435, 'Szabó Dávid [K73]', 'Budo SE', 0.0),
(436, 'Tóth Réka [K73]', 'Honbu Dojo', 0.0),
(437, 'Varga Máté [K73]', 'Karate Akadémia', 0.0),
(438, 'Kiss Dóra [K73]', 'Sakura SE', 0.0),
(439, 'Kovács Péter [K74]', 'Vácrátóti HSE', 0.0),
(440, 'Nagy Zsófia [K74]', 'Tatami SE', 0.0),
(441, 'Szabó Dávid [K74]', 'Budo SE', 0.0),
(442, 'Tóth Réka [K74]', 'Honbu Dojo', 0.0),
(443, 'Varga Máté [K74]', 'Karate Akadémia', 0.0),
(444, 'Kiss Dóra [K74]', 'Sakura SE', 0.0),
(445, 'Kovács Péter [K75]', 'Vácrátóti HSE', 0.0),
(446, 'Nagy Zsófia [K75]', 'Tatami SE', 0.0),
(447, 'Szabó Dávid [K75]', 'Budo SE', 0.0),
(448, 'Tóth Réka [K75]', 'Honbu Dojo', 0.0),
(449, 'Varga Máté [K75]', 'Karate Akadémia', 0.0),
(450, 'Kiss Dóra [K75]', 'Sakura SE', 0.0),
(451, 'Kovács Péter [K76]', 'Vácrátóti HSE', 0.0),
(452, 'Nagy Zsófia [K76]', 'Tatami SE', 0.0),
(453, 'Szabó Dávid [K76]', 'Budo SE', 0.0),
(454, 'Tóth Réka [K76]', 'Honbu Dojo', 0.0),
(455, 'Varga Máté [K76]', 'Karate Akadémia', 0.0),
(456, 'Kiss Dóra [K76]', 'Sakura SE', 0.0),
(457, 'Kovács Péter [K77]', 'Vácrátóti HSE', 0.0),
(458, 'Nagy Zsófia [K77]', 'Tatami SE', 0.0),
(459, 'Szabó Dávid [K77]', 'Budo SE', 0.0),
(460, 'Tóth Réka [K77]', 'Honbu Dojo', 0.0),
(461, 'Varga Máté [K77]', 'Karate Akadémia', 0.0),
(462, 'Kiss Dóra [K77]', 'Sakura SE', 0.0),
(463, 'Kovács Péter [K78]', 'Vácrátóti HSE', 0.0),
(464, 'Nagy Zsófia [K78]', 'Tatami SE', 0.0),
(465, 'Szabó Dávid [K78]', 'Budo SE', 0.0),
(466, 'Tóth Réka [K78]', 'Honbu Dojo', 0.0),
(467, 'Varga Máté [K78]', 'Karate Akadémia', 0.0),
(468, 'Kiss Dóra [K78]', 'Sakura SE', 0.0),
(469, 'Kovács Péter [K79]', 'Vácrátóti HSE', 0.0),
(470, 'Nagy Zsófia [K79]', 'Tatami SE', 0.0),
(471, 'Szabó Dávid [K79]', 'Budo SE', 0.0),
(472, 'Tóth Réka [K79]', 'Honbu Dojo', 0.0),
(473, 'Varga Máté [K79]', 'Karate Akadémia', 0.0),
(474, 'Kiss Dóra [K79]', 'Sakura SE', 0.0),
(475, 'Kovács Péter [K80]', 'Vácrátóti HSE', 0.0),
(476, 'Nagy Zsófia [K80]', 'Tatami SE', 0.0),
(477, 'Szabó Dávid [K80]', 'Budo SE', 0.0),
(478, 'Tóth Réka [K80]', 'Honbu Dojo', 0.0),
(479, 'Varga Máté [K80]', 'Karate Akadémia', 0.0),
(480, 'Kiss Dóra [K80]', 'Sakura SE', 0.0),
(481, 'Kovács Péter [K81]', 'Vácrátóti HSE', 0.0),
(482, 'Nagy Zsófia [K81]', 'Tatami SE', 0.0),
(483, 'Szabó Dávid [K81]', 'Budo SE', 0.0),
(484, 'Tóth Réka [K81]', 'Honbu Dojo', 0.0),
(485, 'Varga Máté [K81]', 'Karate Akadémia', 0.0),
(486, 'Kiss Dóra [K81]', 'Sakura SE', 0.0),
(487, 'Kovács Péter [K82]', 'Vácrátóti HSE', 0.0),
(488, 'Nagy Zsófia [K82]', 'Tatami SE', 0.0),
(489, 'Szabó Dávid [K82]', 'Budo SE', 0.0),
(490, 'Tóth Réka [K82]', 'Honbu Dojo', 0.0),
(491, 'Varga Máté [K82]', 'Karate Akadémia', 0.0),
(492, 'Kiss Dóra [K82]', 'Sakura SE', 0.0),
(493, 'Kovács Péter [K83]', 'Vácrátóti HSE', 0.0),
(494, 'Nagy Zsófia [K83]', 'Tatami SE', 0.0),
(495, 'Szabó Dávid [K83]', 'Budo SE', 0.0),
(496, 'Tóth Réka [K83]', 'Honbu Dojo', 0.0),
(497, 'Varga Máté [K83]', 'Karate Akadémia', 0.0),
(498, 'Kiss Dóra [K83]', 'Sakura SE', 0.0),
(499, 'Kovács Péter [K84]', 'Vácrátóti HSE', 0.0),
(500, 'Nagy Zsófia [K84]', 'Tatami SE', 0.0),
(501, 'Szabó Dávid [K84]', 'Budo SE', 0.0),
(502, 'Tóth Réka [K84]', 'Honbu Dojo', 0.0),
(503, 'Varga Máté [K84]', 'Karate Akadémia', 0.0);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `verseny_allapot`
--

CREATE TABLE `verseny_allapot` (
  `id` int(11) NOT NULL,
  `allapot_json` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- A tábla adatainak kiíratása `verseny_allapot`
--

INSERT INTO `verseny_allapot` (`id`, `allapot_json`) VALUES
(1, '{\"meccsek\":[],\"kata\":{},\"kataStatus\":{}}');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `verseny_kategoria`
--

CREATE TABLE `verseny_kategoria` (
  `verseny_id` int(11) NOT NULL,
  `kategoria_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `verseny_tatami`
--

CREATE TABLE `verseny_tatami` (
  `verseny_id` int(11) NOT NULL,
  `tatami_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Indexek a kiírt táblákhoz
--

--
-- A tábla indexei `felhasznalok`
--
ALTER TABLE `felhasznalok`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `kategoria`
--
ALTER TABLE `kategoria`
  ADD PRIMARY KEY (`kategoria_id`);

--
-- A tábla indexei `kategoria_tatami`
--
ALTER TABLE `kategoria_tatami`
  ADD PRIMARY KEY (`kategoria_id`,`tatami_id`),
  ADD KEY `tatami_id` (`tatami_id`);

--
-- A tábla indexei `nevezes`
--
ALTER TABLE `nevezes`
  ADD PRIMARY KEY (`versenyzo_id`,`kategoria_id`),
  ADD KEY `kategoria_id` (`kategoria_id`),
  ADD KEY `fk_verseny_nevezes` (`verseny_id`);

--
-- A tábla indexei `tatami`
--
ALTER TABLE `tatami`
  ADD PRIMARY KEY (`tatami_id`);

--
-- A tábla indexei `verseny`
--
ALTER TABLE `verseny`
  ADD PRIMARY KEY (`verseny_id`);

--
-- A tábla indexei `versenyzo`
--
ALTER TABLE `versenyzo`
  ADD PRIMARY KEY (`versenyzo_id`);

--
-- A tábla indexei `verseny_allapot`
--
ALTER TABLE `verseny_allapot`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `verseny_kategoria`
--
ALTER TABLE `verseny_kategoria`
  ADD PRIMARY KEY (`verseny_id`,`kategoria_id`),
  ADD KEY `kategoria_id` (`kategoria_id`);

--
-- A tábla indexei `verseny_tatami`
--
ALTER TABLE `verseny_tatami`
  ADD PRIMARY KEY (`verseny_id`,`tatami_id`),
  ADD KEY `tatami_id` (`tatami_id`);

--
-- A kiírt táblák AUTO_INCREMENT értéke
--

--
-- AUTO_INCREMENT a táblához `felhasznalok`
--
ALTER TABLE `felhasznalok`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT a táblához `kategoria`
--
ALTER TABLE `kategoria`
  MODIFY `kategoria_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT a táblához `tatami`
--
ALTER TABLE `tatami`
  MODIFY `tatami_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT a táblához `verseny`
--
ALTER TABLE `verseny`
  MODIFY `verseny_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT a táblához `versenyzo`
--
ALTER TABLE `versenyzo`
  MODIFY `versenyzo_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=504;

--
-- Megkötések a kiírt táblákhoz
--

--
-- Megkötések a táblához `kategoria_tatami`
--
ALTER TABLE `kategoria_tatami`
  ADD CONSTRAINT `kategoria_tatami_ibfk_1` FOREIGN KEY (`kategoria_id`) REFERENCES `kategoria` (`kategoria_id`),
  ADD CONSTRAINT `kategoria_tatami_ibfk_2` FOREIGN KEY (`tatami_id`) REFERENCES `tatami` (`tatami_id`);

--
-- Megkötések a táblához `nevezes`
--
ALTER TABLE `nevezes`
  ADD CONSTRAINT `fk_verseny_nevezes` FOREIGN KEY (`verseny_id`) REFERENCES `verseny` (`verseny_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `nevezes_ibfk_1` FOREIGN KEY (`versenyzo_id`) REFERENCES `versenyzo` (`versenyzo_id`),
  ADD CONSTRAINT `nevezes_ibfk_2` FOREIGN KEY (`kategoria_id`) REFERENCES `kategoria` (`kategoria_id`);

--
-- Megkötések a táblához `verseny_kategoria`
--
ALTER TABLE `verseny_kategoria`
  ADD CONSTRAINT `verseny_kategoria_ibfk_1` FOREIGN KEY (`verseny_id`) REFERENCES `verseny` (`verseny_id`),
  ADD CONSTRAINT `verseny_kategoria_ibfk_2` FOREIGN KEY (`kategoria_id`) REFERENCES `kategoria` (`kategoria_id`);

--
-- Megkötések a táblához `verseny_tatami`
--
ALTER TABLE `verseny_tatami`
  ADD CONSTRAINT `verseny_tatami_ibfk_1` FOREIGN KEY (`verseny_id`) REFERENCES `verseny` (`verseny_id`),
  ADD CONSTRAINT `verseny_tatami_ibfk_2` FOREIGN KEY (`tatami_id`) REFERENCES `tatami` (`tatami_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
