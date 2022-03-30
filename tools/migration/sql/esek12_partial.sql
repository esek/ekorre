-- phpMyAdmin SQL Dump
-- version 5.1.1-1.fc33
-- https://www.phpmyadmin.net/
--
-- Värd: localhost
-- Tid vid skapande: 08 feb 2022 kl 22:23
-- Serverversion: 10.4.18-MariaDB
-- PHP-version: 7.4.23

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Databas: `esek12`
--
CREATE DATABASE IF NOT EXISTS `esek12` DEFAULT CHARACTER SET utf8 COLLATE utf8_swedish_ci;
USE `esek12`;

-- --------------------------------------------------------

--
-- Tabellstruktur `armue_crm`
--

CREATE TABLE `armue_crm` (
  `id` int(11) UNSIGNED NOT NULL,
  `company_name` varchar(64) COLLATE utf8_swedish_ci NOT NULL,
  `company_number` varchar(64) COLLATE utf8_swedish_ci NOT NULL,
  `company_website` varchar(64) COLLATE utf8_swedish_ci NOT NULL,
  `company_address` text COLLATE utf8_swedish_ci NOT NULL,
  `company_contact` text COLLATE utf8_swedish_ci NOT NULL,
  `company_info` text COLLATE utf8_swedish_ci NOT NULL,
  `esek_personid` int(11) UNSIGNED NOT NULL,
  `teknikfokus` int(1) UNSIGNED NOT NULL,
  `status` int(1) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `articles`
--

CREATE TABLE `articles` (
  `id` int(11) NOT NULL,
  `title` varchar(30) NOT NULL DEFAULT 'no title',
  `text` text NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 0,
  `special` tinyint(1) NOT NULL DEFAULT 0,
  `priority` int(11) NOT NULL DEFAULT 0,
  `include_menu_item` tinyint(1) NOT NULL DEFAULT 1,
  `background_image_name` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Tabellstruktur `core_groups`
--

CREATE TABLE `core_groups` (
  `id` int(11) UNSIGNED NOT NULL,
  `name` varchar(64) COLLATE utf8_swedish_ci NOT NULL,
  `description` varchar(256) COLLATE utf8_swedish_ci DEFAULT NULL,
  `unix_groups` varchar(128) COLLATE utf8_swedish_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `core_log`
--

CREATE TABLE `core_log` (
  `id` int(11) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `browser` varchar(128) COLLATE utf8_swedish_ci NOT NULL,
  `ip` char(15) COLLATE utf8_swedish_ci NOT NULL,
  `logintime` datetime NOT NULL,
  `endtime` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `core_users`
--

CREATE TABLE `core_users` (
  `id` int(11) UNSIGNED NOT NULL,
  `username` varchar(64) COLLATE utf8_swedish_ci NOT NULL,
  `password` varchar(256) COLLATE utf8_swedish_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Ersättningsstruktur för vy `core_user_common`
-- (See below for the actual view)
--
CREATE TABLE `core_user_common` (
`user_id` int(11) unsigned
,`username` varchar(64)
,`firstname` text
,`surname` text
,`lth_id` text
,`stil_id` text
,`mail` text
);

-- --------------------------------------------------------

--
-- Ersättningsstruktur för vy `core_user_contact`
-- (See below for the actual view)
--
CREATE TABLE `core_user_contact` (
`user_id` int(11) unsigned
,`username` varchar(64)
,`settings` mediumtext
,`values` mediumtext
);

-- --------------------------------------------------------

--
-- Tabellstruktur `core_user_group`
--

CREATE TABLE `core_user_group` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `group_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `core_user_settings`
--

CREATE TABLE `core_user_settings` (
  `id` int(10) UNSIGNED NOT NULL,
  `setting` varchar(128) COLLATE utf8_swedish_ci NOT NULL,
  `type` enum('text','bool','multi_row') COLLATE utf8_swedish_ci NOT NULL,
  `name` varchar(64) COLLATE utf8_swedish_ci NOT NULL,
  `description` text COLLATE utf8_swedish_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `core_user_setting_user`
--

CREATE TABLE `core_user_setting_user` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `user_setting_id` int(10) UNSIGNED NOT NULL,
  `value` text COLLATE utf8_swedish_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `doorcontrol_exceptions`
--

CREATE TABLE `doorcontrol_exceptions` (
  `uid` int(11) NOT NULL,
  `door_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `doorcontrol_position_door`
--

CREATE TABLE `doorcontrol_position_door` (
  `id` int(11) NOT NULL,
  `door_id` int(11) NOT NULL,
  `position_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `doorcontrol_user_door`
--

CREATE TABLE `doorcontrol_user_door` (
  `id` int(11) NOT NULL,
  `door_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `doorsadmin_access`
--

CREATE TABLE `doorsadmin_access` (
  `id` int(11) NOT NULL,
  `uid` int(11) NOT NULL,
  `did` int(11) NOT NULL,
  `manual` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Tabellstruktur `doorsadmin_doors`
--

CREATE TABLE `doorsadmin_doors` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `url` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Tabellstruktur `doorsadmin_sugs`
--

CREATE TABLE `doorsadmin_sugs` (
  `id` int(11) NOT NULL,
  `position` int(5) DEFAULT NULL,
  `door` int(5) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Tabellstruktur `eca_invoices`
--

CREATE TABLE `eca_invoices` (
  `id` varchar(32) COLLATE utf8_swedish_ci NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `committee_id` int(11) DEFAULT NULL,
  `start_date` date NOT NULL,
  `date_created` datetime NOT NULL,
  `paid` tinyint(4) NOT NULL,
  `total` varchar(6) COLLATE utf8_swedish_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `eca_jobs`
--

CREATE TABLE `eca_jobs` (
  `id` int(10) UNSIGNED NOT NULL,
  `job_id` int(11) NOT NULL,
  `printer_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `thumbnail_id` varchar(44) COLLATE utf8_swedish_ci NOT NULL,
  `pre_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `post_time` timestamp NULL DEFAULT NULL,
  `client` varchar(32) COLLATE utf8_swedish_ci NOT NULL,
  `title` varchar(64) COLLATE utf8_swedish_ci NOT NULL,
  `copies` int(11) NOT NULL,
  `pages` int(11) NOT NULL DEFAULT 1,
  `options` varchar(128) COLLATE utf8_swedish_ci NOT NULL,
  `backend_status` int(11) DEFAULT NULL,
  `eca_transaction_id` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `eca_printers`
--

CREATE TABLE `eca_printers` (
  `id` int(10) UNSIGNED NOT NULL,
  `name_cups` varchar(64) COLLATE utf8_swedish_ci NOT NULL,
  `name` varchar(64) COLLATE utf8_swedish_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `eca_transactions`
--

CREATE TABLE `eca_transactions` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `committee_id` int(10) UNSIGNED DEFAULT NULL,
  `sum` double NOT NULL,
  `eca_invoice_id` varchar(32) COLLATE utf8_swedish_ci DEFAULT NULL,
  `date_created` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_modified` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `ekoli_slides`
--

CREATE TABLE `ekoli_slides` (
  `id` int(11) NOT NULL,
  `type` enum('image','video','applet','youtube') COLLATE utf8_swedish_ci NOT NULL,
  `owner` int(11) DEFAULT NULL,
  `duration` int(11) NOT NULL DEFAULT 7,
  `slideshow_id` int(11) NOT NULL,
  `alt_to` int(11) DEFAULT NULL,
  `image_id` varchar(44) COLLATE utf8_swedish_ci NOT NULL,
  `thumb_id` varchar(44) COLLATE utf8_swedish_ci NOT NULL,
  `url` varchar(64) COLLATE utf8_swedish_ci DEFAULT NULL,
  `active` tinyint(1) NOT NULL,
  `news_id` int(11) DEFAULT NULL,
  `description` varchar(64) COLLATE utf8_swedish_ci DEFAULT NULL,
  `created` timestamp NOT NULL DEFAULT current_timestamp(),
  `start` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `stop` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `ekoli_slideshows`
--

CREATE TABLE `ekoli_slideshows` (
  `id` int(11) NOT NULL,
  `title` varchar(32) COLLATE utf8_swedish_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `esekdata_committees`
--

CREATE TABLE `esekdata_committees` (
  `id` int(11) UNSIGNED NOT NULL,
  `name` varchar(32) COLLATE utf8_swedish_ci NOT NULL,
  `full_name` varchar(64) COLLATE utf8_swedish_ci NOT NULL,
  `start` date DEFAULT NULL,
  `end` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `esekdata_elected`
--

CREATE TABLE `esekdata_elected` (
  `id` int(11) UNSIGNED NOT NULL,
  `user_id` int(11) UNSIGNED NOT NULL,
  `position_id` int(11) UNSIGNED NOT NULL,
  `start` datetime NOT NULL,
  `end` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `esekdata_positions`
--

CREATE TABLE `esekdata_positions` (
  `id` int(11) UNSIGNED NOT NULL,
  `name` varchar(64) COLLATE utf8_swedish_ci NOT NULL,
  `committee_id` int(11) UNSIGNED NOT NULL,
  `nbr_of_places` varchar(5) COLLATE utf8_swedish_ci NOT NULL,
  `info` text COLLATE utf8_swedish_ci NOT NULL,
  `email` varchar(32) COLLATE utf8_swedish_ci NOT NULL,
  `start` date DEFAULT NULL,
  `end` date DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `period_start` datetime NOT NULL DEFAULT '0000-01-01 00:00:00',
  `period_end` datetime NOT NULL DEFAULT '0000-12-31 00:00:00',
  `election_meeting` varchar(30) COLLATE utf8_swedish_ci NOT NULL,
  `period` varchar(64) COLLATE utf8_swedish_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `esekdata_position_group`
--

CREATE TABLE `esekdata_position_group` (
  `id` int(11) UNSIGNED NOT NULL,
  `position_id` int(11) UNSIGNED NOT NULL,
  `group_id` int(11) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `esekdata_settings`
--

CREATE TABLE `esekdata_settings` (
  `user_id` int(11) UNSIGNED NOT NULL,
  `start` date NOT NULL,
  `end` date NOT NULL,
  `year` year(4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `esekdata_vars`
--

CREATE TABLE `esekdata_vars` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(64) COLLATE utf8_swedish_ci NOT NULL,
  `value` varchar(64) COLLATE utf8_swedish_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `eskil_foretag`
--

CREATE TABLE `eskil_foretag` (
  `Id` int(11) NOT NULL,
  `Foretag` text COLLATE utf8_swedish_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `eskil_konto`
--

CREATE TABLE `eskil_konto` (
  `Id` int(11) NOT NULL,
  `Nr` int(11) NOT NULL,
  `Namn` text COLLATE utf8_swedish_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `eskil_rapport`
--

CREATE TABLE `eskil_rapport` (
  `Id` int(11) NOT NULL,
  `Debet` int(11) NOT NULL,
  `Kredit` int(11) NOT NULL,
  `Vara` int(11) NOT NULL,
  `Sessid` text COLLATE utf8_swedish_ci NOT NULL,
  `Time` text COLLATE utf8_swedish_ci NOT NULL,
  `Antal` int(11) NOT NULL,
  `Pris` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `eskil_session`
--

CREATE TABLE `eskil_session` (
  `Id` int(11) NOT NULL,
  `Author` varchar(64) COLLATE utf8_swedish_ci NOT NULL,
  `Date` date NOT NULL,
  `Faknr` bigint(20) NOT NULL,
  `Foretag` varchar(32) COLLATE utf8_swedish_ci NOT NULL,
  `Sessid` text COLLATE utf8_swedish_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `eskil_vara`
--

CREATE TABLE `eskil_vara` (
  `Id` int(11) NOT NULL,
  `Konto` int(11) NOT NULL,
  `Namn` varchar(64) COLLATE utf8_swedish_ci NOT NULL,
  `Moms` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `fikafika`
--

CREATE TABLE `fikafika` (
  `id` int(11) UNSIGNED NOT NULL,
  `approved` int(1) DEFAULT NULL,
  `approved_ordf` int(1) DEFAULT NULL,
  `start` datetime NOT NULL,
  `end` datetime NOT NULL,
  `name` varchar(64) COLLATE utf8_swedish_ci NOT NULL,
  `personal_id` varchar(32) COLLATE utf8_swedish_ci NOT NULL,
  `program_year` varchar(32) COLLATE utf8_swedish_ci NOT NULL,
  `email` varchar(128) COLLATE utf8_swedish_ci NOT NULL,
  `image_id` varchar(44) COLLATE utf8_swedish_ci NOT NULL,
  `activity` varchar(128) COLLATE utf8_swedish_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `gallery_events`
--

CREATE TABLE `gallery_events` (
  `id` int(11) UNSIGNED NOT NULL,
  `name` varchar(64) COLLATE utf8_swedish_ci DEFAULT NULL,
  `event_date` date DEFAULT NULL,
  `access` int(11) DEFAULT NULL,
  `added_datetime` datetime DEFAULT NULL,
  `display_image_id` int(11) UNSIGNED DEFAULT NULL,
  `status` enum('pending','active','denied') COLLATE utf8_swedish_ci NOT NULL DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `gallery_images`
--

CREATE TABLE `gallery_images` (
  `id` int(11) UNSIGNED NOT NULL,
  `user_id` int(11) UNSIGNED DEFAULT NULL,
  `event_id` int(11) UNSIGNED NOT NULL,
  `upload_datetime` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `exif_datetime` datetime DEFAULT NULL,
  `filename` varchar(64) COLLATE utf8_swedish_ci NOT NULL,
  `file_hash` varchar(32) COLLATE utf8_swedish_ci NOT NULL,
  `height` int(11) NOT NULL,
  `width` int(11) NOT NULL,
  `text` varchar(128) COLLATE utf8_swedish_ci DEFAULT NULL,
  `access` int(11) NOT NULL,
  `status` enum('pending','active','denied') COLLATE utf8_swedish_ci NOT NULL,
  `Flash` int(4) DEFAULT NULL,
  `FocalLength` float DEFAULT NULL,
  `FocalLengthIn35mmFilm` float DEFAULT NULL,
  `ExposureTime` float DEFAULT NULL,
  `FNumber` float DEFAULT NULL,
  `FocusDistance` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `gallery_images_labels`
--

CREATE TABLE `gallery_images_labels` (
  `id` int(11) UNSIGNED NOT NULL,
  `image_id` int(11) UNSIGNED NOT NULL,
  `label_id` int(11) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `gallery_labels`
--

CREATE TABLE `gallery_labels` (
  `id` int(11) UNSIGNED NOT NULL,
  `label` varchar(64) COLLATE utf8_swedish_ci DEFAULT NULL,
  `added_datetime` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `gallery_old_objs`
--

CREATE TABLE `gallery_old_objs` (
  `id` int(11) UNSIGNED NOT NULL,
  `owner_id` int(11) UNSIGNED DEFAULT NULL,
  `name` varchar(64) COLLATE utf8_swedish_ci NOT NULL,
  `work` varchar(64) COLLATE utf8_swedish_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `gallery_old_users`
--

CREATE TABLE `gallery_old_users` (
  `id` int(11) UNSIGNED NOT NULL,
  `new_user_id` int(11) UNSIGNED DEFAULT NULL,
  `username` varchar(64) COLLATE utf8_swedish_ci DEFAULT NULL,
  `email` varchar(64) COLLATE utf8_swedish_ci DEFAULT NULL,
  `pass` varchar(16) COLLATE utf8_swedish_ci DEFAULT NULL,
  `rights` int(11) DEFAULT NULL,
  `last_login` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `gallery_tags`
--

CREATE TABLE `gallery_tags` (
  `id` int(11) UNSIGNED NOT NULL,
  `image_id` int(11) UNSIGNED NOT NULL,
  `owner_id` int(11) UNSIGNED DEFAULT NULL,
  `target` int(11) UNSIGNED DEFAULT NULL,
  `alt_target` int(11) UNSIGNED DEFAULT NULL,
  `x1` int(8) NOT NULL,
  `y1` int(8) NOT NULL,
  `x2` int(8) NOT NULL,
  `y2` int(8) NOT NULL,
  `added_datetime` datetime DEFAULT NULL,
  `status` enum('pending','active','denied') COLLATE utf8_swedish_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `images`
--

CREATE TABLE `images` (
  `id` varchar(44) COLLATE utf8_swedish_ci NOT NULL,
  `mime` varchar(16) COLLATE utf8_swedish_ci NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(64) COLLATE utf8_swedish_ci NOT NULL,
  `created` timestamp NOT NULL DEFAULT current_timestamp(),
  `size` int(10) UNSIGNED NOT NULL,
  `width` int(11) NOT NULL,
  `height` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `news`
--

CREATE TABLE `news` (
  `id` int(11) NOT NULL,
  `wdate` date NOT NULL,
  `author` varchar(128) COLLATE utf8_swedish_ci NOT NULL,
  `subject` varchar(128) COLLATE utf8_swedish_ci NOT NULL,
  `msg` text COLLATE utf8_swedish_ci NOT NULL,
  `newsmsg` text COLLATE utf8_swedish_ci NOT NULL,
  `image_id` varchar(44) COLLATE utf8_swedish_ci DEFAULT NULL,
  `ekoli` int(1) NOT NULL DEFAULT 0,
  `eracle` int(1) NOT NULL DEFAULT 0,
  `actual` tinyint(1) NOT NULL,
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `songarchive_categories`
--

CREATE TABLE `songarchive_categories` (
  `name` varchar(64) COLLATE utf8_swedish_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `songarchive_category_songs`
--

CREATE TABLE `songarchive_category_songs` (
  `category` varchar(64) COLLATE utf8_swedish_ci NOT NULL,
  `song` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `songarchive_songs`
--

CREATE TABLE `songarchive_songs` (
  `id` int(10) UNSIGNED NOT NULL,
  `title` varchar(64) COLLATE utf8_swedish_ci NOT NULL,
  `info` text COLLATE utf8_swedish_ci NOT NULL,
  `author` varchar(128) COLLATE utf8_swedish_ci NOT NULL,
  `melody` varchar(64) COLLATE utf8_swedish_ci NOT NULL,
  `book_page` smallint(5) UNSIGNED DEFAULT NULL,
  `text` text COLLATE utf8_swedish_ci NOT NULL,
  `chords` tinyint(1) NOT NULL DEFAULT 0,
  `language` varchar(32) COLLATE utf8_swedish_ci NOT NULL,
  `upload_date` datetime NOT NULL,
  `uploader` int(10) UNSIGNED NOT NULL,
  `last_edit` datetime NOT NULL,
  `last_editor` int(10) UNSIGNED NOT NULL,
  `funny` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `time_access`
--

CREATE TABLE `time_access` (
  `time_access_id` int(11) NOT NULL,
  `start` datetime DEFAULT NULL,
  `end` datetime DEFAULT NULL,
  `uid` int(11) DEFAULT NULL,
  `did` int(11) DEFAULT NULL,
  `active` tinyint(4) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `tlth_members`
--

CREATE TABLE `tlth_members` (
  `stil` varchar(10) COLLATE utf8_swedish_ci NOT NULL,
  `firstname` text COLLATE utf8_swedish_ci NOT NULL,
  `lastname` text COLLATE utf8_swedish_ci NOT NULL,
  `email` varchar(64) COLLATE utf8_swedish_ci DEFAULT NULL,
  `pnr` varchar(10) COLLATE utf8_swedish_ci NOT NULL,
  `enrollment` date NOT NULL,
  `studying` tinyint(1) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `gender` char(1) COLLATE utf8_swedish_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `tlth_raw`
--

CREATE TABLE `tlth_raw` (
  `pnr` text COLLATE utf8_swedish_ci NOT NULL,
  `first` text COLLATE utf8_swedish_ci NOT NULL,
  `last` text COLLATE utf8_swedish_ci NOT NULL,
  `mail` text COLLATE utf8_swedish_ci NOT NULL,
  `sek` text COLLATE utf8_swedish_ci NOT NULL,
  `prog` text COLLATE utf8_swedish_ci NOT NULL,
  `start` text COLLATE utf8_swedish_ci NOT NULL,
  `gender` text COLLATE utf8_swedish_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `val_elections`
--

CREATE TABLE `val_elections` (
  `id` int(11) UNSIGNED NOT NULL,
  `name` varchar(64) COLLATE utf8_swedish_ci NOT NULL,
  `electionday` date NOT NULL,
  `lastday` date NOT NULL,
  `lastnominationday` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `val_election_position`
--

CREATE TABLE `val_election_position` (
  `id` int(11) UNSIGNED NOT NULL,
  `election_id` int(11) UNSIGNED NOT NULL,
  `position_id` int(11) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `val_nominations`
--

CREATE TABLE `val_nominations` (
  `id` int(11) UNSIGNED NOT NULL,
  `election_id` int(11) UNSIGNED NOT NULL,
  `position_id` int(11) UNSIGNED NOT NULL,
  `user_id` int(11) UNSIGNED NOT NULL,
  `reply` int(2) UNSIGNED NOT NULL,
  `added_datetime` datetime NOT NULL,
  `control_question_answer` varchar(1024) COLLATE utf8_swedish_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `val_position_extras`
--

CREATE TABLE `val_position_extras` (
  `id` int(11) NOT NULL,
  `position_id` int(11) NOT NULL,
  `extended_liability` int(2) DEFAULT NULL,
  `control_question` int(2) DEFAULT NULL,
  `question` varchar(1023) COLLATE utf8_swedish_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `val_proposals`
--

CREATE TABLE `val_proposals` (
  `id` int(11) UNSIGNED NOT NULL,
  `user_id` int(11) UNSIGNED NOT NULL,
  `position_id` int(11) UNSIGNED NOT NULL,
  `election_id` int(11) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Tabellstruktur `wiki_pages`
--

CREATE TABLE `wiki_pages` (
  `title` varchar(64) COLLATE utf8_swedish_ci NOT NULL,
  `content` text COLLATE utf8_swedish_ci NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `created` timestamp NOT NULL DEFAULT current_timestamp(),
  `replaced` datetime NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

-- --------------------------------------------------------

--
-- Struktur för vy `core_user_common` exporterad som en tabell
--
DROP TABLE IF EXISTS `core_user_common`;
CREATE TABLE`core_user_common`(
    `user_id` int(11) unsigned NOT NULL DEFAULT '0',
    `username` varchar(64) COLLATE utf8_swedish_ci NOT NULL,
    `firstname` text COLLATE utf8_swedish_ci DEFAULT NULL,
    `surname` text COLLATE utf8_swedish_ci DEFAULT NULL,
    `lth_id` text COLLATE utf8_swedish_ci DEFAULT NULL,
    `stil_id` text COLLATE utf8_swedish_ci DEFAULT NULL,
    `mail` text COLLATE utf8_swedish_ci DEFAULT NULL
);

-- --------------------------------------------------------

--
-- Struktur för vy `core_user_contact` exporterad som en tabell
--
DROP TABLE IF EXISTS `core_user_contact`;
CREATE TABLE`core_user_contact`(
    `user_id` int(11) unsigned NOT NULL DEFAULT '0',
    `username` varchar(64) COLLATE utf8_swedish_ci NOT NULL,
    `settings` mediumtext COLLATE utf8_swedish_ci DEFAULT NULL,
    `values` mediumtext COLLATE utf8_swedish_ci DEFAULT NULL
);

--
-- Index för dumpade tabeller
--

--
-- Index för tabell `armue_crm`
--
ALTER TABLE `armue_crm`
  ADD PRIMARY KEY (`id`);

--
-- Index för tabell `articles`
--
ALTER TABLE `articles`
  ADD PRIMARY KEY (`id`);

--
-- Index för tabell `core_groups`
--
ALTER TABLE `core_groups`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Index för tabell `core_log`
--
ALTER TABLE `core_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Index för tabell `core_users`
--
ALTER TABLE `core_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Index för tabell `core_user_group`
--
ALTER TABLE `core_user_group`
  ADD PRIMARY KEY (`user_id`,`group_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `group_id` (`group_id`);

--
-- Index för tabell `core_user_settings`
--
ALTER TABLE `core_user_settings`
  ADD PRIMARY KEY (`id`);

--
-- Index för tabell `core_user_setting_user`
--
ALTER TABLE `core_user_setting_user`
  ADD PRIMARY KEY (`user_id`,`user_setting_id`),
  ADD KEY `user_setting_id` (`user_setting_id`);

--
-- Index för tabell `doorcontrol_position_door`
--
ALTER TABLE `doorcontrol_position_door`
  ADD PRIMARY KEY (`id`);

--
-- Index för tabell `doorcontrol_user_door`
--
ALTER TABLE `doorcontrol_user_door`
  ADD PRIMARY KEY (`id`);

--
-- Index för tabell `doorsadmin_access`
--
ALTER TABLE `doorsadmin_access`
  ADD PRIMARY KEY (`id`);

--
-- Index för tabell `doorsadmin_doors`
--
ALTER TABLE `doorsadmin_doors`
  ADD PRIMARY KEY (`id`);

--
-- Index för tabell `doorsadmin_sugs`
--
ALTER TABLE `doorsadmin_sugs`
  ADD PRIMARY KEY (`id`);

--
-- Index för tabell `eca_invoices`
--
ALTER TABLE `eca_invoices`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`,`committee_id`);

--
-- Index för tabell `eca_jobs`
--
ALTER TABLE `eca_jobs`
  ADD PRIMARY KEY (`id`);

--
-- Index för tabell `eca_printers`
--
ALTER TABLE `eca_printers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name_cups` (`name_cups`);

--
-- Index för tabell `eca_transactions`
--
ALTER TABLE `eca_transactions`
  ADD PRIMARY KEY (`id`);

--
-- Index för tabell `ekoli_slides`
--
ALTER TABLE `ekoli_slides`
  ADD PRIMARY KEY (`id`);

--
-- Index för tabell `ekoli_slideshows`
--
ALTER TABLE `ekoli_slideshows`
  ADD PRIMARY KEY (`id`);

--
-- Index för tabell `esekdata_committees`
--
ALTER TABLE `esekdata_committees`
  ADD PRIMARY KEY (`id`);

--
-- Index för tabell `esekdata_elected`
--
ALTER TABLE `esekdata_elected`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`,`position_id`,`start`,`end`);

--
-- Index för tabell `esekdata_positions`
--
ALTER TABLE `esekdata_positions`
  ADD PRIMARY KEY (`id`);

--
-- Index för tabell `esekdata_position_group`
--
ALTER TABLE `esekdata_position_group`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `position_id` (`position_id`,`group_id`);

--
-- Index för tabell `esekdata_settings`
--
ALTER TABLE `esekdata_settings`
  ADD PRIMARY KEY (`user_id`);

--
-- Index för tabell `esekdata_vars`
--
ALTER TABLE `esekdata_vars`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Index för tabell `eskil_foretag`
--
ALTER TABLE `eskil_foretag`
  ADD PRIMARY KEY (`Id`),
  ADD UNIQUE KEY `Id` (`Id`);

--
-- Index för tabell `eskil_konto`
--
ALTER TABLE `eskil_konto`
  ADD PRIMARY KEY (`Id`),
  ADD UNIQUE KEY `Id` (`Id`);

--
-- Index för tabell `eskil_rapport`
--
ALTER TABLE `eskil_rapport`
  ADD PRIMARY KEY (`Id`),
  ADD UNIQUE KEY `Id` (`Id`);

--
-- Index för tabell `eskil_session`
--
ALTER TABLE `eskil_session`
  ADD PRIMARY KEY (`Id`),
  ADD UNIQUE KEY `Id` (`Id`);

--
-- Index för tabell `eskil_vara`
--
ALTER TABLE `eskil_vara`
  ADD PRIMARY KEY (`Id`),
  ADD UNIQUE KEY `Id` (`Id`);

--
-- Index för tabell `fikafika`
--
ALTER TABLE `fikafika`
  ADD PRIMARY KEY (`id`);

--
-- Index för tabell `gallery_events`
--
ALTER TABLE `gallery_events`
  ADD PRIMARY KEY (`id`);

--
-- Index för tabell `gallery_images`
--
ALTER TABLE `gallery_images`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `filename` (`filename`),
  ADD KEY `event_id` (`event_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Index för tabell `gallery_images_labels`
--
ALTER TABLE `gallery_images_labels`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `image_id` (`image_id`,`label_id`),
  ADD KEY `label_id` (`label_id`);

--
-- Index för tabell `gallery_labels`
--
ALTER TABLE `gallery_labels`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `label` (`label`);

--
-- Index för tabell `gallery_old_objs`
--
ALTER TABLE `gallery_old_objs`
  ADD PRIMARY KEY (`id`);

--
-- Index för tabell `gallery_old_users`
--
ALTER TABLE `gallery_old_users`
  ADD PRIMARY KEY (`id`);

--
-- Index för tabell `gallery_tags`
--
ALTER TABLE `gallery_tags`
  ADD PRIMARY KEY (`id`),
  ADD KEY `added_datetime` (`added_datetime`),
  ADD KEY `target` (`target`),
  ADD KEY `alt_target` (`alt_target`),
  ADD KEY `owner_id` (`owner_id`),
  ADD KEY `image_id` (`image_id`);

--
-- Index för tabell `images`
--
ALTER TABLE `images`
  ADD PRIMARY KEY (`id`);

--
-- Index för tabell `news`
--
ALTER TABLE `news`
  ADD PRIMARY KEY (`id`);

--
-- Index för tabell `songarchive_categories`
--
ALTER TABLE `songarchive_categories`
  ADD PRIMARY KEY (`name`);

--
-- Index för tabell `songarchive_category_songs`
--
ALTER TABLE `songarchive_category_songs`
  ADD PRIMARY KEY (`category`,`song`),
  ADD UNIQUE KEY `category` (`category`,`song`),
  ADD KEY `song` (`song`);

--
-- Index för tabell `songarchive_songs`
--
ALTER TABLE `songarchive_songs`
  ADD PRIMARY KEY (`id`);

--
-- Index för tabell `time_access`
--
ALTER TABLE `time_access`
  ADD PRIMARY KEY (`time_access_id`);

--
-- Index för tabell `tlth_members`
--
ALTER TABLE `tlth_members`
  ADD PRIMARY KEY (`stil`),
  ADD UNIQUE KEY `pnr` (`pnr`,`user_id`),
  ADD KEY `enrollment` (`enrollment`,`studying`);

--
-- Index för tabell `val_elections`
--
ALTER TABLE `val_elections`
  ADD PRIMARY KEY (`id`);

--
-- Index för tabell `val_election_position`
--
ALTER TABLE `val_election_position`
  ADD PRIMARY KEY (`id`),
  ADD KEY `election_id` (`election_id`),
  ADD KEY `position_id` (`position_id`);

--
-- Index för tabell `val_nominations`
--
ALTER TABLE `val_nominations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `election_id` (`election_id`,`position_id`,`user_id`),
  ADD KEY `position_id` (`position_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Index för tabell `val_position_extras`
--
ALTER TABLE `val_position_extras`
  ADD PRIMARY KEY (`position_id`),
  ADD KEY `id` (`id`);

--
-- Index för tabell `val_proposals`
--
ALTER TABLE `val_proposals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `position_id` (`position_id`),
  ADD KEY `election_id` (`election_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Index för tabell `wiki_pages`
--
ALTER TABLE `wiki_pages`
  ADD PRIMARY KEY (`title`,`created`),
  ADD KEY `replaced` (`replaced`);

--
-- AUTO_INCREMENT för dumpade tabeller
--

--
-- AUTO_INCREMENT för tabell `armue_crm`
--
ALTER TABLE `armue_crm`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `articles`
--
ALTER TABLE `articles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `core_groups`
--
ALTER TABLE `core_groups`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `core_log`
--
ALTER TABLE `core_log`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `core_users`
--
ALTER TABLE `core_users`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `core_user_settings`
--
ALTER TABLE `core_user_settings`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `doorcontrol_position_door`
--
ALTER TABLE `doorcontrol_position_door`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `doorcontrol_user_door`
--
ALTER TABLE `doorcontrol_user_door`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `doorsadmin_access`
--
ALTER TABLE `doorsadmin_access`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `doorsadmin_doors`
--
ALTER TABLE `doorsadmin_doors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `doorsadmin_sugs`
--
ALTER TABLE `doorsadmin_sugs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `eca_jobs`
--
ALTER TABLE `eca_jobs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `eca_printers`
--
ALTER TABLE `eca_printers`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `eca_transactions`
--
ALTER TABLE `eca_transactions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `ekoli_slides`
--
ALTER TABLE `ekoli_slides`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `ekoli_slideshows`
--
ALTER TABLE `ekoli_slideshows`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `esekdata_committees`
--
ALTER TABLE `esekdata_committees`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `esekdata_elected`
--
ALTER TABLE `esekdata_elected`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `esekdata_positions`
--
ALTER TABLE `esekdata_positions`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `esekdata_position_group`
--
ALTER TABLE `esekdata_position_group`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `esekdata_vars`
--
ALTER TABLE `esekdata_vars`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `eskil_foretag`
--
ALTER TABLE `eskil_foretag`
  MODIFY `Id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `eskil_konto`
--
ALTER TABLE `eskil_konto`
  MODIFY `Id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `eskil_rapport`
--
ALTER TABLE `eskil_rapport`
  MODIFY `Id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `eskil_session`
--
ALTER TABLE `eskil_session`
  MODIFY `Id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `eskil_vara`
--
ALTER TABLE `eskil_vara`
  MODIFY `Id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `fikafika`
--
ALTER TABLE `fikafika`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `gallery_events`
--
ALTER TABLE `gallery_events`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `gallery_images`
--
ALTER TABLE `gallery_images`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `gallery_images_labels`
--
ALTER TABLE `gallery_images_labels`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `gallery_labels`
--
ALTER TABLE `gallery_labels`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `gallery_old_objs`
--
ALTER TABLE `gallery_old_objs`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `gallery_old_users`
--
ALTER TABLE `gallery_old_users`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `gallery_tags`
--
ALTER TABLE `gallery_tags`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `news`
--
ALTER TABLE `news`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `songarchive_songs`
--
ALTER TABLE `songarchive_songs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `time_access`
--
ALTER TABLE `time_access`
  MODIFY `time_access_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `val_elections`
--
ALTER TABLE `val_elections`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `val_election_position`
--
ALTER TABLE `val_election_position`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `val_nominations`
--
ALTER TABLE `val_nominations`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `val_position_extras`
--
ALTER TABLE `val_position_extras`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT för tabell `val_proposals`
--
ALTER TABLE `val_proposals`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Restriktioner för dumpade tabeller
--

--
-- Restriktioner för tabell `core_log`
--
ALTER TABLE `core_log`
  ADD CONSTRAINT `core_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `core_users` (`id`) ON UPDATE CASCADE;

--
-- Restriktioner för tabell `core_user_group`
--
ALTER TABLE `core_user_group`
  ADD CONSTRAINT `core_user_group_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `core_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `core_user_group_ibfk_2` FOREIGN KEY (`group_id`) REFERENCES `core_groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restriktioner för tabell `core_user_setting_user`
--
ALTER TABLE `core_user_setting_user`
  ADD CONSTRAINT `core_user_setting_user_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `core_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `core_user_setting_user_ibfk_2` FOREIGN KEY (`user_setting_id`) REFERENCES `core_user_settings` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restriktioner för tabell `esekdata_position_group`
--
ALTER TABLE `esekdata_position_group`
  ADD CONSTRAINT `esekdata_position_group_ibfk_1` FOREIGN KEY (`position_id`) REFERENCES `esekdata_positions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `esekdata_position_group_ibfk_2` FOREIGN KEY (`position_id`) REFERENCES `esekdata_positions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restriktioner för tabell `gallery_images`
--
ALTER TABLE `gallery_images`
  ADD CONSTRAINT `gallery_images_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `core_users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `gallery_images_ibfk_2` FOREIGN KEY (`event_id`) REFERENCES `gallery_events` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `gallery_images_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `core_users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `gallery_images_ibfk_4` FOREIGN KEY (`event_id`) REFERENCES `gallery_events` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Restriktioner för tabell `gallery_images_labels`
--
ALTER TABLE `gallery_images_labels`
  ADD CONSTRAINT `gallery_images_labels_ibfk_1` FOREIGN KEY (`image_id`) REFERENCES `gallery_images` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `gallery_images_labels_ibfk_2` FOREIGN KEY (`label_id`) REFERENCES `gallery_labels` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `gallery_images_labels_ibfk_3` FOREIGN KEY (`image_id`) REFERENCES `gallery_images` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `gallery_images_labels_ibfk_4` FOREIGN KEY (`label_id`) REFERENCES `gallery_labels` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restriktioner för tabell `gallery_tags`
--
ALTER TABLE `gallery_tags`
  ADD CONSTRAINT `gallery_tags_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `core_users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `gallery_tags_ibfk_2` FOREIGN KEY (`target`) REFERENCES `core_users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `gallery_tags_ibfk_3` FOREIGN KEY (`image_id`) REFERENCES `gallery_images` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `gallery_tags_ibfk_4` FOREIGN KEY (`owner_id`) REFERENCES `core_users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `gallery_tags_ibfk_5` FOREIGN KEY (`target`) REFERENCES `core_users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `gallery_tags_ibfk_6` FOREIGN KEY (`image_id`) REFERENCES `gallery_images` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Restriktioner för tabell `songarchive_category_songs`
--
ALTER TABLE `songarchive_category_songs`
  ADD CONSTRAINT `songarchive_category_songs_ibfk_1` FOREIGN KEY (`category`) REFERENCES `songarchive_categories` (`name`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `songarchive_category_songs_ibfk_2` FOREIGN KEY (`song`) REFERENCES `songarchive_songs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restriktioner för tabell `val_election_position`
--
ALTER TABLE `val_election_position`
  ADD CONSTRAINT `val_election_position_ibfk_1` FOREIGN KEY (`election_id`) REFERENCES `val_elections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `val_election_position_ibfk_2` FOREIGN KEY (`position_id`) REFERENCES `esekdata_positions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `val_election_position_ibfk_3` FOREIGN KEY (`election_id`) REFERENCES `val_elections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `val_election_position_ibfk_4` FOREIGN KEY (`position_id`) REFERENCES `esekdata_positions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restriktioner för tabell `val_nominations`
--
ALTER TABLE `val_nominations`
  ADD CONSTRAINT `val_nominations_ibfk_1` FOREIGN KEY (`election_id`) REFERENCES `val_elections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `val_nominations_ibfk_2` FOREIGN KEY (`position_id`) REFERENCES `esekdata_positions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `val_nominations_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `core_users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `val_nominations_ibfk_4` FOREIGN KEY (`election_id`) REFERENCES `val_elections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `val_nominations_ibfk_5` FOREIGN KEY (`position_id`) REFERENCES `esekdata_positions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `val_nominations_ibfk_6` FOREIGN KEY (`user_id`) REFERENCES `core_users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Restriktioner för tabell `val_proposals`
--
ALTER TABLE `val_proposals`
  ADD CONSTRAINT `val_proposals_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `core_users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `val_proposals_ibfk_2` FOREIGN KEY (`position_id`) REFERENCES `esekdata_positions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `val_proposals_ibfk_3` FOREIGN KEY (`election_id`) REFERENCES `val_elections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `val_proposals_ibfk_4` FOREIGN KEY (`user_id`) REFERENCES `core_users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `val_proposals_ibfk_5` FOREIGN KEY (`position_id`) REFERENCES `esekdata_positions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `val_proposals_ibfk_6` FOREIGN KEY (`election_id`) REFERENCES `val_elections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
