-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Gép: 127.0.0.1
-- Létrehozás ideje: 2026. Már 25. 19:52
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
  MODIFY `versenyzo_id` int(11) NOT NULL AUTO_INCREMENT;

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
