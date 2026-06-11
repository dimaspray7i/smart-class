-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 11, 2026 at 06:15 AM
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
-- Database: `compiler_rpl`
--

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

CREATE TABLE `announcements` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `teacher_id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `target_class` varchar(255) DEFAULT NULL,
  `priority` varchar(255) NOT NULL DEFAULT 'normal',
  `is_pinned` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendances`
--

CREATE TABLE `attendances` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `date` date NOT NULL,
  `lat` decimal(10,8) DEFAULT NULL,
  `lng` decimal(11,8) DEFAULT NULL,
  `status` enum('Hadir','Terlambat','Izin','Sakit','Alpha') NOT NULL DEFAULT 'Alpha',
  `check_in_time` time DEFAULT NULL,
  `check_out_time` time DEFAULT NULL,
  `location_string` varchar(255) DEFAULT NULL COMMENT 'Human-readable location name',
  `verified_by` bigint(20) UNSIGNED DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `verification_note` text DEFAULT NULL,
  `location_verified` tinyint(1) NOT NULL DEFAULT 0,
  `accuracy_meters` decimal(8,2) DEFAULT NULL,
  `photo_url` varchar(255) DEFAULT NULL,
  `code_used` varchar(10) DEFAULT NULL,
  `device_info` varchar(50) NOT NULL DEFAULT 'web',
  `verification_method` enum('auto','manual') NOT NULL DEFAULT 'auto',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `pkl_location_id` bigint(20) UNSIGNED DEFAULT NULL,
  `location_name` varchar(255) DEFAULT NULL COMMENT 'Cached company name for display'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendance_records`
--

CREATE TABLE `attendance_records` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `student_id` bigint(20) UNSIGNED NOT NULL,
  `attendance_session_id` bigint(20) UNSIGNED DEFAULT NULL,
  `verification_code` varchar(20) DEFAULT NULL,
  `face_verified` tinyint(1) NOT NULL DEFAULT 0,
  `face_score` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `selfie_photo` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `accuracy` smallint(5) UNSIGNED DEFAULT NULL,
  `distance_from_school` smallint(5) UNSIGNED DEFAULT NULL,
  `location_verified` tinyint(1) NOT NULL DEFAULT 0,
  `device_info` varchar(255) DEFAULT NULL,
  `browser_info` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `status` enum('pending','face_verified','location_verified','completed','failed') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendance_sessions`
--

CREATE TABLE `attendance_sessions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `code` varchar(10) NOT NULL,
  `class_id` bigint(20) UNSIGNED NOT NULL,
  `schedule_id` bigint(20) UNSIGNED DEFAULT NULL,
  `subject_id` bigint(20) UNSIGNED DEFAULT NULL,
  `generated_by` bigint(20) UNSIGNED NOT NULL,
  `valid_from` datetime NOT NULL,
  `valid_until` datetime NOT NULL,
  `location` varchar(255) DEFAULT NULL COMMENT 'Location name/address for the session',
  `status` varchar(255) NOT NULL DEFAULT 'active' COMMENT 'Session status: active, closed, cancelled',
  `reopened_by` bigint(20) UNSIGNED DEFAULT NULL,
  `reopened_at` timestamp NULL DEFAULT NULL,
  `reopen_notes` text DEFAULT NULL,
  `reopen_count` smallint(5) UNSIGNED NOT NULL DEFAULT 0,
  `notes` text DEFAULT NULL COMMENT 'Additional notes for the session',
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `qr_code` text DEFAULT NULL COMMENT 'Base64 encoded QR data for student scanning',
  `enable_geofence` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `max_uses` int(11) DEFAULT NULL,
  `uses_count` int(11) NOT NULL DEFAULT 0,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Additional session configuration' CHECK (json_valid(`metadata`)),
  `used_count` int(11) NOT NULL DEFAULT 0,
  `radius_meters` decimal(8,2) NOT NULL DEFAULT 100.00,
  `center_lat` decimal(10,8) DEFAULT NULL,
  `center_lng` decimal(11,8) DEFAULT NULL,
  `qr_expiry_minutes` int(11) NOT NULL DEFAULT 30 COMMENT 'QR code validity in minutes',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `career_paths`
--

CREATE TABLE `career_paths` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `icon` varchar(255) DEFAULT NULL,
  `color` varchar(255) NOT NULL DEFAULT '#3b82f6',
  `required_skills` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`required_skills`)),
  `career_outcomes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`career_outcomes`)),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `career_paths`
--

INSERT INTO `career_paths` (`id`, `title`, `slug`, `description`, `icon`, `color`, `required_skills`, `career_outcomes`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Frontend Web Developer', 'frontend-web-developer', 'Jalur karir yang berfokus pada pengembangan tampilan web interaktif, user interface (UI), dan user experience (UX) menggunakan HTML, CSS, JavaScript, dan React.', '🎨', '#ec4899', '[\"HTML\",\"CSS\",\"JavaScript\",\"Tailwind CSS\",\"React\"]', '[\"Junior Frontend Developer\",\"UI Engineer\",\"React Developer\"]', 1, '2026-05-20 05:14:41', '2026-05-20 05:14:41'),
(2, 'Backend Web Developer', 'backend-web-developer', 'Jalur karir yang berfokus pada pengembangan logika server, database, API, keamanan sistem, dan performa backend aplikasi menggunakan PHP, Laravel, dan MySQL.', '💻', '#3b82f6', '[\"PHP\",\"Laravel\",\"REST API\",\"MySQL\",\"Git\"]', '[\"Junior Backend Developer\",\"API Specialist\",\"Database Administrator\"]', 1, '2026-05-20 05:14:41', '2026-05-20 05:14:41');

-- --------------------------------------------------------

--
-- Table structure for table `classes`
--

CREATE TABLE `classes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `level` enum('X','XI','XII') NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `capacity` int(11) NOT NULL DEFAULT 36,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `classes`
--

INSERT INTO `classes` (`id`, `name`, `level`, `slug`, `description`, `capacity`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'RPL DevHouse', 'X', 'rpl-devhouse', 'Kelas RPL X-1 Program Keahlian RPL', 36, 1, '2026-05-20 05:14:40', '2026-05-30 16:30:51'),
(4, 'RPL FutureLabs', 'XI', 'rpl-futurelabs', 'Kelas RPL XI-1 Program Keahlian RPL', 36, 1, '2026-05-20 05:14:40', '2026-05-30 16:30:25'),
(7, 'RPL CodeStorm', 'XII', 'rpl-codestorm', 'Kelas RPL XII-1 Program Keahlian RPL', 36, 1, '2026-05-20 05:14:40', '2026-05-30 16:29:42');

-- --------------------------------------------------------

--
-- Table structure for table `class_subject`
--

CREATE TABLE `class_subject` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `class_model_id` bigint(20) UNSIGNED NOT NULL,
  `subject_id` bigint(20) UNSIGNED NOT NULL,
  `academic_year` varchar(9) DEFAULT NULL COMMENT 'Format: 2024/2025',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_user`
--

CREATE TABLE `class_user` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `class_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `role_in_class` enum('siswa','wali_kelas','guru_pengampu') NOT NULL DEFAULT 'siswa',
  `academic_year` year(4) NOT NULL DEFAULT 2025,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `class_user`
--

INSERT INTO `class_user` (`id`, `class_id`, `user_id`, `role_in_class`, `academic_year`, `is_active`, `created_at`, `updated_at`) VALUES
(3, 4, 2, 'wali_kelas', '2026', 1, '2026-05-30 16:30:25', '2026-05-30 16:30:25'),
(4, 4, 3, 'siswa', '2026', 1, '2026-06-01 17:20:13', '2026-06-01 17:20:14');

-- --------------------------------------------------------

--
-- Table structure for table `coding_logs`
--

CREATE TABLE `coding_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `commit_hash` varchar(255) DEFAULT NULL,
  `branch_name` varchar(255) NOT NULL DEFAULT 'main',
  `description` text NOT NULL,
  `lines_added` int(11) DEFAULT NULL,
  `lines_deleted` int(11) DEFAULT NULL,
  `files_changed` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`files_changed`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `devices`
--

CREATE TABLE `devices` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `ip_address` varchar(255) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `is_trusted` tinyint(1) NOT NULL DEFAULT 0,
  `retro_theme_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `login_histories`
--

CREATE TABLE `login_histories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `device_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(255) NOT NULL,
  `user_agent` text DEFAULT NULL,
  `login_successful` tinyint(1) NOT NULL,
  `failure_reason` varchar(255) DEFAULT NULL,
  `two_factor_used` tinyint(1) NOT NULL DEFAULT 0,
  `retro_theme_used` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `materials`
--

CREATE TABLE `materials` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `teacher_id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `type` varchar(255) NOT NULL DEFAULT 'document',
  `class_id` bigint(20) UNSIGNED DEFAULT NULL,
  `subject_id` bigint(20) UNSIGNED DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `deadline` timestamp NULL DEFAULT NULL,
  `file_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `sender_id` bigint(20) UNSIGNED NOT NULL,
  `receiver_id` bigint(20) UNSIGNED NOT NULL,
  `content` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000002_create_jobs_table', 1),
(3, '2026_04_23_053248_create_personal_access_tokens_table', 1),
(4, '2026_04_24_161214_create_users_table_extension', 1),
(5, '2026_04_24_161222_create_profiles_table', 1),
(6, '2026_04_24_161230_create_classes_table', 1),
(7, '2026_04_24_161235_create_subjects_table', 1),
(8, '2026_04_24_161241_create_schedules_table', 1),
(9, '2026_04_24_161247_create_attendances_table', 1),
(10, '2026_04_24_161252_create_attendance_sessions_table', 1),
(11, '2026_04_24_161257_create_permissions_table', 1),
(12, '2026_04_24_161304_create_projects_table', 1),
(13, '2026_04_24_161311_create_coding_logs_table', 1),
(14, '2026_04_24_161316_create_skills_table', 1),
(15, '2026_04_24_161321_create_student_skills_table', 1),
(16, '2026_04_24_161327_create_career_paths_table', 1),
(17, '2026_04_24_161331_create_simulator_steps_table', 1),
(18, '2026_04_24_161336_create_simulator_sessions_table', 1),
(19, '2026_04_24_161341_create_class_user_table', 1),
(20, '2026_04_26_041630_create_cache_table', 1),
(21, '2026_05_06_040517_add_subject_to_profiles_table', 1),
(22, '2026_05_06_065738_create_profile_subject_table', 1),
(23, '2026_05_09_080954_create_class_subject_table', 1),
(24, '2026_05_12_061740_create_pkl_locations_table', 1),
(25, '2026_05_12_065950_add_pkl_fields_to_attendances_table', 1),
(26, '2026_05_13_134424_create_settings_table', 1),
(27, '2026_05_14_030230_add_pkl_assignment_fields_to_users_and_profiles_table', 1),
(28, '2026_05_15_210855_create_devices_table', 1),
(29, '2026_05_15_210946_add_retro_fields_to_users_table', 1),
(30, '2026_05_15_211846_create_login_histories_table', 1),
(31, '2026_05_15_220000_add_extra_fields_to_devices_table', 1),
(32, '2026_05_17_111348_add_teacher_fields_to_tables', 1),
(33, '2026_05_17_164500_add_schedule_and_subject_to_attendance_sessions', 1),
(34, '2026_05_18_020000_add_extra_fields_to_attendance_sessions_table', 1),
(35, '2026_05_18_133238_add_profile_fields_to_profiles_table', 1),
(36, '2026_05_19_000000_add_metadata_to_personal_access_tokens', 1),
(37, '2026_05_20_000000_create_messages_table', 2),
(38, '2026_05_24_100843_create_announcements_and_materials_tables', 3),
(39, '2026_05_30_123000_create_attendance_records_table', 4),
(40, '2026_06_01_000000_make_teacher_id_nullable_in_permissions', 4);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `teacher_id` bigint(20) UNSIGNED DEFAULT NULL,
  `date_from` date NOT NULL,
  `date_to` date NOT NULL,
  `type` enum('Izin','Sakit') NOT NULL,
  `reason` text NOT NULL,
  `attachment_url` varchar(255) DEFAULT NULL,
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `note` text DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `approval_note` text DEFAULT NULL COMMENT 'Note from teacher for approval/rejection',
  `attachment_path` varchar(255) DEFAULT NULL,
  `attachment_mime` varchar(255) DEFAULT NULL,
  `attachment_size` int(11) DEFAULT NULL,
  `notify_parent` tinyint(1) NOT NULL DEFAULT 0,
  `notify_student` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `device_info` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`device_info`)),
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `device_info`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(2, 'App\\Models\\User', 1, 'rpl_token', '61296bbdcbd338dd9472b00b342dfcb7cffafdb31cac578628ca85988acc3bba', '[\"*\"]', NULL, '2026-05-28 04:18:36', NULL, '2026-05-28 04:18:16', '2026-05-28 04:18:36'),
(22, 'App\\Models\\User', 1, 'rpl_token', '876f0dbd0c7e5a03ed6269cce08451c68c97baed6b18d7c8ca5abda4a14320f8', '[\"*\"]', NULL, '2026-06-01 17:21:49', NULL, '2026-06-01 16:18:45', '2026-06-01 17:21:49');

-- --------------------------------------------------------

--
-- Table structure for table `pkl_locations`
--

CREATE TABLE `pkl_locations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `latitude` decimal(10,8) NOT NULL COMMENT 'Latitude coordinate (-90 to 90)',
  `longitude` decimal(11,8) NOT NULL COMMENT 'Longitude coordinate (-180 to 180)',
  `radius_meters` int(10) UNSIGNED NOT NULL DEFAULT 100 COMMENT 'Absensi radius in meters',
  `supervisor_name` varchar(255) DEFAULT NULL,
  `supervisor_phone` varchar(20) DEFAULT NULL,
  `supervisor_email` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `is_approved` tinyint(1) NOT NULL DEFAULT 0,
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `profiles`
--

CREATE TABLE `profiles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `nis` varchar(20) DEFAULT NULL,
  `nip` varchar(20) DEFAULT NULL,
  `class_level` enum('X','XI','XII') DEFAULT NULL,
  `major` varchar(50) DEFAULT NULL COMMENT 'Jurusan (e.g. RPL, TKJ)',
  `subject` varchar(255) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `github_url` varchar(255) DEFAULT NULL,
  `linkedin_url` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `gender` enum('L','P') DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `preferences` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`preferences`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `profiles`
--

INSERT INTO `profiles` (`id`, `user_id`, `nis`, `nip`, `class_level`, `major`, `subject`, `bio`, `github_url`, `linkedin_url`, `address`, `gender`, `date_of_birth`, `preferences`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, NULL, NULL, NULL, NULL, 'Administrator RPL Smart Ecosystem', NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-28 04:02:31', '2026-05-28 04:02:31'),
(2, 2, NULL, '198501012010011001', NULL, NULL, NULL, 'Guru Produktif RPL', NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-28 04:02:32', '2026-05-28 04:02:32'),
(3, 3, '2024001001', NULL, 'XI', NULL, NULL, 'Siswa kelas XI RPL', NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-28 04:02:32', '2026-05-28 04:02:32');

-- --------------------------------------------------------

--
-- Table structure for table `profile_subject`
--

CREATE TABLE `profile_subject` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `profile_id` bigint(20) UNSIGNED NOT NULL,
  `subject_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `profile_subject`
--

INSERT INTO `profile_subject` (`id`, `profile_id`, `subject_id`, `created_at`, `updated_at`) VALUES
(1, 2, 1, '2026-05-28 04:02:32', '2026-05-28 04:02:32'),
(2, 2, 2, '2026-05-28 04:02:32', '2026-05-28 04:02:32');

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `repository_url` varchar(255) DEFAULT NULL,
  `demo_url` varchar(255) DEFAULT NULL,
  `status` enum('planning','in_progress','review','completed','archived') NOT NULL DEFAULT 'planning',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `visibility` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `schedules`
--

CREATE TABLE `schedules` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `class_id` bigint(20) UNSIGNED NOT NULL,
  `subject_id` bigint(20) UNSIGNED NOT NULL,
  `teacher_id` bigint(20) UNSIGNED NOT NULL,
  `day` enum('senin','selasa','rabu','kamis','jumat','sabtu') NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `room` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `schedules`
--

INSERT INTO `schedules` (`id`, `class_id`, `subject_id`, `teacher_id`, `day`, `start_time`, `end_time`, `room`, `is_active`, `created_at`, `updated_at`) VALUES
(2, 4, 1, 2, 'senin', '07:00:00', '08:30:00', 'Lab Komputer', 1, '2026-05-30 02:28:40', '2026-05-30 02:28:40');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `key` varchar(255) NOT NULL COMMENT 'Setting key (e.g., general_app_name)',
  `value` text DEFAULT NULL COMMENT 'Setting value (stored as string)',
  `section` varchar(255) DEFAULT NULL COMMENT 'Section grouping (general, attendance, etc.)',
  `type` varchar(255) NOT NULL DEFAULT 'string' COMMENT 'Data type: string, boolean, integer, json',
  `description` text DEFAULT NULL COMMENT 'Setting description for admin UI',
  `is_public` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Accessible via public API',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `simulator_sessions`
--

CREATE TABLE `simulator_sessions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `career_path_id` bigint(20) UNSIGNED NOT NULL,
  `current_step_id` bigint(20) UNSIGNED NOT NULL,
  `choices` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`choices`)),
  `completed_at` timestamp NULL DEFAULT NULL,
  `result` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`result`)),
  `session_token` varchar(255) NOT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `simulator_steps`
--

CREATE TABLE `simulator_steps` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `career_path_id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `order` int(11) NOT NULL DEFAULT 0,
  `is_final` tinyint(1) NOT NULL DEFAULT 0,
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`options`)),
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `simulator_steps`
--

INSERT INTO `simulator_steps` (`id`, `career_path_id`, `title`, `content`, `order`, `is_final`, `options`, `metadata`, `created_at`, `updated_at`) VALUES
(1, 1, 'Langkah Awal Belajar Frontend', 'Sebagai pemula di dunia Frontend, teknologi dasar apa yang pertama kali harus Anda kuasai dengan matang untuk membangun struktur dan style halaman web?', 1, 0, '{\"html_css\":{\"text\":\"HTML, CSS & Javascript Dasar\",\"next_step_id\":null},\"react_direct\":{\"text\":\"Langsung belajar React \\/ Vue\",\"next_step_id\":null}}', NULL, '2026-05-20 05:14:41', '2026-05-20 05:14:41'),
(2, 1, 'Memilih CSS Framework', 'Setelah menguasai dasar-dasar HTML, CSS, dan Javascript, Anda ingin mempercepat proses slicing UI. CSS Framework / methodology mana yang Anda pilih?', 2, 0, '{\"tailwind\":{\"text\":\"Tailwind CSS (Utility-First)\",\"next_step_id\":null},\"bootstrap\":{\"text\":\"Bootstrap CSS (Component-Based)\",\"next_step_id\":null}}', NULL, '2026-05-20 05:14:41', '2026-05-20 05:14:41'),
(3, 1, 'Framework JavaScript', 'Untuk membuat aplikasi web yang dinamis, Anda perlu menguasai modern library/framework JS. Pilihan mana yang Anda ambil?', 3, 0, '{\"react\":{\"text\":\"React.js (Component & State Management)\",\"next_step_id\":null},\"vue\":{\"text\":\"Vue.js (Easy template-based)\",\"next_step_id\":null}}', NULL, '2026-05-20 05:14:41', '2026-05-20 05:14:41'),
(4, 1, 'Evaluasi Frontend Developer', 'Selamat! Anda telah menyelesaikan simulasi belajar Frontend. Berdasarkan pilihan Anda, Anda siap menjadi Frontend Developer!', 4, 1, '[]', NULL, '2026-05-20 05:14:41', '2026-05-20 05:14:41'),
(5, 2, 'Langkah Awal Belajar Backend', 'Sebelum mulai membangun server, pemahaman logika dasar apa yang sangat penting dikuasai sebagai fondasi utama backend developer?', 1, 0, '{\"php_basic\":{\"text\":\"Dasar PHP dan Pemrograman Berorientasi Objek (OOP)\",\"next_step_id\":null},\"laravel_direct\":{\"text\":\"Langsung belajar Framework Laravel\",\"next_step_id\":null}}', NULL, '2026-05-20 05:14:41', '2026-05-20 05:14:41'),
(6, 2, 'Penyimpanan Data (Database)', 'Aplikasi Anda membutuhkan database untuk menyimpan data user dan transaksi secara terstruktur. Sistem database mana yang akan Anda pelajari terlebih dahulu?', 2, 0, '{\"mysql\":{\"text\":\"MySQL \\/ PostgreSQL (Relational DB)\",\"next_step_id\":null},\"mongodb\":{\"text\":\"MongoDB (NoSQL DB)\",\"next_step_id\":null}}', NULL, '2026-05-20 05:14:41', '2026-05-20 05:14:41'),
(7, 2, 'Metode Autentikasi API', 'Anda membangun API untuk aplikasi mobile/frontend. Metode keamanan apa yang paling cocok Anda terapkan untuk mengamankan endpoint?', 3, 0, '{\"sanctum\":{\"text\":\"Laravel Sanctum (Token-based, simple)\",\"next_step_id\":null},\"jwt\":{\"text\":\"JSON Web Token (JWT, stateless)\",\"next_step_id\":null}}', NULL, '2026-05-20 05:14:41', '2026-05-20 05:14:41'),
(8, 2, 'Evaluasi Backend Developer', 'Selamat! Anda telah menyelesaikan simulasi belajar Backend. Berdasarkan pilihan Anda, Anda siap menjadi Backend Developer!', 4, 1, '[]', NULL, '2026-05-20 05:14:41', '2026-05-20 05:14:41');

-- --------------------------------------------------------

--
-- Table structure for table `skills`
--

CREATE TABLE `skills` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `category` enum('frontend','backend','database','devops','soft_skill') NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(255) DEFAULT NULL,
  `max_level` int(11) NOT NULL DEFAULT 100,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `student_skills`
--

CREATE TABLE `student_skills` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `skill_id` bigint(20) UNSIGNED NOT NULL,
  `level` int(11) NOT NULL DEFAULT 0,
  `hours_practiced` int(11) NOT NULL DEFAULT 0,
  `last_practiced_at` timestamp NULL DEFAULT NULL,
  `evidence` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`evidence`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE `subjects` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `code` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` enum('productive','normative','adaptive') NOT NULL,
  `credits` int(11) NOT NULL DEFAULT 4,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subjects`
--

INSERT INTO `subjects` (`id`, `code`, `name`, `category`, `credits`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'RPL-101', 'Dasar Pemrograman', 'productive', 4, NULL, 1, '2026-05-20 05:14:40', '2026-05-20 05:14:40'),
(2, 'RPL-102', 'Pemrograman Web Dasar', 'productive', 4, NULL, 1, '2026-05-20 05:14:40', '2026-05-20 05:14:40'),
(11, 'NOR-101', 'Pendidikan Agama Islam', 'normative', 3, NULL, 1, '2026-05-20 05:14:40', '2026-05-20 05:14:40'),
(12, 'NOR-102', 'Pendidikan Pancasila', 'normative', 2, NULL, 1, '2026-05-20 05:14:40', '2026-05-20 05:14:40'),
(13, 'NOR-103', 'Bahasa Indonesia', 'normative', 4, NULL, 1, '2026-05-20 05:14:40', '2026-05-20 05:14:40'),
(14, 'NOR-104', 'Pendidikan Jasmani & Olahraga', 'normative', 3, NULL, 1, '2026-05-20 05:14:40', '2026-05-20 05:14:40'),
(16, 'ADP-101', 'Matematika', 'adaptive', 4, NULL, 1, '2026-05-20 05:14:40', '2026-05-20 05:14:40'),
(17, 'ADP-102', 'Bahasa Inggris', 'adaptive', 4, NULL, 1, '2026-05-20 05:14:40', '2026-05-20 05:14:40'),
(19, 'ADP-104', 'Kewirausahaan', 'adaptive', 2, NULL, 1, '2026-05-20 05:14:40', '2026-05-20 05:14:40'),
(20, 'ADP-105', 'Seni Budaya', 'adaptive', 2, NULL, 1, '2026-05-20 05:14:40', '2026-05-20 05:14:40');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `theme_preferences` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`theme_preferences`)),
  `notification_preferences` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`notification_preferences`)),
  `role` enum('admin','guru','siswa') NOT NULL DEFAULT 'siswa',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `two_factor_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `two_factor_method` varchar(255) DEFAULT NULL,
  `two_factor_secret` varchar(255) DEFAULT NULL,
  `pkl_location_id` bigint(20) UNSIGNED DEFAULT NULL,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `last_login_ip` varchar(255) DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `slug`, `email`, `phone`, `avatar_url`, `theme_preferences`, `notification_preferences`, `role`, `is_active`, `two_factor_enabled`, `two_factor_method`, `two_factor_secret`, `pkl_location_id`, `last_login_at`, `last_login_ip`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Admin RPL SMKN1', 'admin-rpl-smkn1', 'adminrplsmkn1tm@gmail.com', '08123456789', NULL, NULL, NULL, 'admin', 1, 0, NULL, NULL, NULL, '2026-06-01 16:18:45', NULL, NULL, '$2y$12$lMj1PijJb2stKMyKkGvxSO28OoTgrgvVF7Ij2LdFCnUYIVKYgi9vq', NULL, '2026-05-28 04:02:31', '2026-06-01 16:18:45'),
(2, 'Leni Marliati, S.Kom', 'budi-santoso-skom', 'lenimarliati@gmail.com', '08112345678', NULL, NULL, NULL, 'guru', 1, 0, NULL, NULL, NULL, '2026-05-30 16:50:24', NULL, NULL, '$2y$12$6vHT0QWM.pI8eB8Oj5LkQeeJp2a3Ch9sRqCVjHVhXpzLJoUMs7cF2', NULL, '2026-05-28 04:02:32', '2026-06-01 17:19:48'),
(3, 'Dimas Prayogi', 'dimas-prayogi', 'dimaspray7i@gmail.com', '08987654321', NULL, NULL, NULL, 'siswa', 1, 0, NULL, NULL, NULL, '2026-05-30 16:50:54', NULL, NULL, '$2y$12$Xg0RshZRAUJFy8B3qvxxf.g0gwB/la15.NerJBtTvIuZqnOKd4SXG', NULL, '2026-05-28 04:02:32', '2026-06-01 17:20:13');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `announcements_teacher_id_foreign` (`teacher_id`);

--
-- Indexes for table `attendances`
--
ALTER TABLE `attendances`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `attendances_user_id_date_unique` (`user_id`,`date`),
  ADD KEY `attendances_date_index` (`date`),
  ADD KEY `attendances_status_index` (`status`),
  ADD KEY `attendances_user_id_date_index` (`user_id`,`date`),
  ADD KEY `attendances_user_id_date_status_index` (`user_id`,`date`,`status`),
  ADD KEY `attendances_lat_lng_index` (`lat`,`lng`),
  ADD KEY `attendances_pkl_location_id_foreign` (`pkl_location_id`),
  ADD KEY `attendances_verified_by_foreign` (`verified_by`),
  ADD KEY `attendances_user_date_idx` (`user_id`,`date`);

--
-- Indexes for table `attendance_records`
--
ALTER TABLE `attendance_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `attendance_records_attendance_session_id_foreign` (`attendance_session_id`),
  ADD KEY `attendance_records_student_id_attendance_session_id_index` (`student_id`,`attendance_session_id`),
  ADD KEY `attendance_records_verification_code_index` (`verification_code`),
  ADD KEY `attendance_records_status_index` (`status`),
  ADD KEY `attendance_records_latitude_longitude_index` (`latitude`,`longitude`);

--
-- Indexes for table `attendance_sessions`
--
ALTER TABLE `attendance_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `attendance_sessions_code_unique` (`code`),
  ADD KEY `attendance_sessions_generated_by_foreign` (`generated_by`),
  ADD KEY `attendance_sessions_code_index` (`code`),
  ADD KEY `attendance_sessions_is_active_index` (`is_active`),
  ADD KEY `attendance_sessions_valid_from_valid_until_index` (`valid_from`,`valid_until`),
  ADD KEY `attendance_sessions_class_id_index` (`class_id`),
  ADD KEY `attendance_sessions_schedule_id_foreign` (`schedule_id`),
  ADD KEY `attendance_sessions_subject_id_foreign` (`subject_id`),
  ADD KEY `attendance_sessions_reopened_by_foreign` (`reopened_by`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `career_paths`
--
ALTER TABLE `career_paths`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `career_paths_slug_unique` (`slug`),
  ADD KEY `career_paths_slug_index` (`slug`),
  ADD KEY `career_paths_is_active_index` (`is_active`);

--
-- Indexes for table `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `classes_slug_unique` (`slug`),
  ADD KEY `classes_level_index` (`level`),
  ADD KEY `classes_is_active_index` (`is_active`),
  ADD KEY `classes_slug_index` (`slug`);

--
-- Indexes for table `class_subject`
--
ALTER TABLE `class_subject`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `class_subject_unique` (`class_model_id`,`subject_id`),
  ADD KEY `idx_class_subject_class` (`class_model_id`),
  ADD KEY `idx_class_subject_subject` (`subject_id`),
  ADD KEY `idx_class_subject_year` (`academic_year`);

--
-- Indexes for table `class_user`
--
ALTER TABLE `class_user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `class_user_class_id_user_id_academic_year_unique` (`class_id`,`user_id`,`academic_year`),
  ADD KEY `class_user_user_id_index` (`user_id`),
  ADD KEY `class_user_class_id_index` (`class_id`),
  ADD KEY `class_user_academic_year_index` (`academic_year`),
  ADD KEY `class_user_is_active_index` (`is_active`);

--
-- Indexes for table `coding_logs`
--
ALTER TABLE `coding_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `coding_logs_project_id_index` (`project_id`),
  ADD KEY `coding_logs_user_id_index` (`user_id`),
  ADD KEY `coding_logs_created_at_index` (`created_at`);

--
-- Indexes for table `devices`
--
ALTER TABLE `devices`
  ADD PRIMARY KEY (`id`),
  ADD KEY `devices_user_id_last_used_at_index` (`user_id`,`last_used_at`),
  ADD KEY `devices_ip_address_index` (`ip_address`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `login_histories`
--
ALTER TABLE `login_histories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `login_histories_device_id_foreign` (`device_id`),
  ADD KEY `login_histories_user_id_created_at_index` (`user_id`,`created_at`),
  ADD KEY `login_histories_ip_address_created_at_index` (`ip_address`,`created_at`);

--
-- Indexes for table `materials`
--
ALTER TABLE `materials`
  ADD PRIMARY KEY (`id`),
  ADD KEY `materials_teacher_id_foreign` (`teacher_id`),
  ADD KEY `materials_class_id_foreign` (`class_id`),
  ADD KEY `materials_subject_id_foreign` (`subject_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `messages_sender_id_foreign` (`sender_id`),
  ADD KEY `messages_receiver_id_foreign` (`receiver_id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `permissions_user_id_index` (`user_id`),
  ADD KEY `permissions_teacher_id_index` (`teacher_id`),
  ADD KEY `permissions_status_index` (`status`),
  ADD KEY `permissions_date_from_date_to_index` (`date_from`,`date_to`),
  ADD KEY `permissions_approved_by_foreign` (`approved_by`),
  ADD KEY `permissions_status_date_idx` (`status`,`date_from`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`);

--
-- Indexes for table `pkl_locations`
--
ALTER TABLE `pkl_locations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pkl_locations_approved_by_foreign` (`approved_by`),
  ADD KEY `idx_pkl_location_coords` (`latitude`,`longitude`),
  ADD KEY `idx_pkl_status` (`is_approved`,`is_active`),
  ADD KEY `pkl_locations_is_approved_index` (`is_approved`),
  ADD KEY `pkl_locations_is_active_index` (`is_active`);

--
-- Indexes for table `profiles`
--
ALTER TABLE `profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `profiles_nis_unique` (`nis`),
  ADD UNIQUE KEY `profiles_nip_unique` (`nip`),
  ADD KEY `profiles_user_id_index` (`user_id`),
  ADD KEY `profiles_nis_index` (`nis`),
  ADD KEY `profiles_nip_index` (`nip`),
  ADD KEY `profiles_class_level_index` (`class_level`),
  ADD KEY `profiles_major_index` (`major`);

--
-- Indexes for table `profile_subject`
--
ALTER TABLE `profile_subject`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `profile_subject_profile_id_subject_id_unique` (`profile_id`,`subject_id`),
  ADD KEY `profile_subject_subject_id_foreign` (`subject_id`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `projects_slug_unique` (`slug`),
  ADD KEY `projects_user_id_index` (`user_id`),
  ADD KEY `projects_status_index` (`status`),
  ADD KEY `projects_slug_index` (`slug`),
  ADD KEY `projects_visibility_index` (`visibility`);

--
-- Indexes for table `schedules`
--
ALTER TABLE `schedules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `schedules_class_id_teacher_id_day_start_time_unique` (`class_id`,`teacher_id`,`day`,`start_time`),
  ADD KEY `schedules_subject_id_foreign` (`subject_id`),
  ADD KEY `schedules_teacher_id_foreign` (`teacher_id`),
  ADD KEY `schedules_day_index` (`day`),
  ADD KEY `schedules_start_time_index` (`start_time`),
  ADD KEY `schedules_is_active_index` (`is_active`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `settings_key_unique` (`key`),
  ADD KEY `settings_key_section_index` (`key`,`section`),
  ADD KEY `settings_updated_at_index` (`updated_at`),
  ADD KEY `settings_section_index` (`section`);

--
-- Indexes for table `simulator_sessions`
--
ALTER TABLE `simulator_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `simulator_sessions_session_token_unique` (`session_token`),
  ADD KEY `simulator_sessions_current_step_id_foreign` (`current_step_id`),
  ADD KEY `simulator_sessions_session_token_index` (`session_token`),
  ADD KEY `simulator_sessions_expires_at_index` (`expires_at`),
  ADD KEY `simulator_sessions_user_id_index` (`user_id`),
  ADD KEY `simulator_sessions_career_path_id_index` (`career_path_id`);

--
-- Indexes for table `simulator_steps`
--
ALTER TABLE `simulator_steps`
  ADD PRIMARY KEY (`id`),
  ADD KEY `simulator_steps_career_path_id_index` (`career_path_id`),
  ADD KEY `simulator_steps_order_index` (`order`),
  ADD KEY `simulator_steps_is_final_index` (`is_final`);

--
-- Indexes for table `skills`
--
ALTER TABLE `skills`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `skills_slug_unique` (`slug`),
  ADD KEY `skills_category_index` (`category`),
  ADD KEY `skills_is_active_index` (`is_active`),
  ADD KEY `skills_slug_index` (`slug`);

--
-- Indexes for table `student_skills`
--
ALTER TABLE `student_skills`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `student_skills_user_id_skill_id_unique` (`user_id`,`skill_id`),
  ADD KEY `student_skills_user_id_index` (`user_id`),
  ADD KEY `student_skills_skill_id_index` (`skill_id`),
  ADD KEY `student_skills_level_index` (`level`),
  ADD KEY `student_skills_last_practiced_at_index` (`last_practiced_at`);

--
-- Indexes for table `subjects`
--
ALTER TABLE `subjects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `subjects_code_unique` (`code`),
  ADD KEY `subjects_category_index` (`category`),
  ADD KEY `subjects_is_active_index` (`is_active`),
  ADD KEY `subjects_code_index` (`code`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD UNIQUE KEY `users_slug_unique` (`slug`),
  ADD KEY `users_role_index` (`role`),
  ADD KEY `users_is_active_index` (`is_active`),
  ADD KEY `users_slug_index` (`slug`),
  ADD KEY `users_pkl_location_id_foreign` (`pkl_location_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `announcements`
--
ALTER TABLE `announcements`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `attendances`
--
ALTER TABLE `attendances`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `attendance_records`
--
ALTER TABLE `attendance_records`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `attendance_sessions`
--
ALTER TABLE `attendance_sessions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `career_paths`
--
ALTER TABLE `career_paths`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `classes`
--
ALTER TABLE `classes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `class_subject`
--
ALTER TABLE `class_subject`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_user`
--
ALTER TABLE `class_user`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `coding_logs`
--
ALTER TABLE `coding_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `devices`
--
ALTER TABLE `devices`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `login_histories`
--
ALTER TABLE `login_histories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `materials`
--
ALTER TABLE `materials`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `pkl_locations`
--
ALTER TABLE `pkl_locations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `profiles`
--
ALTER TABLE `profiles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `profile_subject`
--
ALTER TABLE `profile_subject`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `schedules`
--
ALTER TABLE `schedules`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `simulator_sessions`
--
ALTER TABLE `simulator_sessions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `simulator_steps`
--
ALTER TABLE `simulator_steps`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `skills`
--
ALTER TABLE `skills`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `student_skills`
--
ALTER TABLE `student_skills`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subjects`
--
ALTER TABLE `subjects`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `announcements`
--
ALTER TABLE `announcements`
  ADD CONSTRAINT `announcements_teacher_id_foreign` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `attendances`
--
ALTER TABLE `attendances`
  ADD CONSTRAINT `attendances_pkl_location_id_foreign` FOREIGN KEY (`pkl_location_id`) REFERENCES `pkl_locations` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `attendances_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `attendances_verified_by_foreign` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `attendance_records`
--
ALTER TABLE `attendance_records`
  ADD CONSTRAINT `attendance_records_attendance_session_id_foreign` FOREIGN KEY (`attendance_session_id`) REFERENCES `attendance_sessions` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `attendance_records_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `attendance_sessions`
--
ALTER TABLE `attendance_sessions`
  ADD CONSTRAINT `attendance_sessions_class_id_foreign` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `attendance_sessions_generated_by_foreign` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `attendance_sessions_reopened_by_foreign` FOREIGN KEY (`reopened_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `attendance_sessions_schedule_id_foreign` FOREIGN KEY (`schedule_id`) REFERENCES `schedules` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `attendance_sessions_subject_id_foreign` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `class_subject`
--
ALTER TABLE `class_subject`
  ADD CONSTRAINT `class_subject_class_model_id_foreign` FOREIGN KEY (`class_model_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `class_subject_subject_id_foreign` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `class_user`
--
ALTER TABLE `class_user`
  ADD CONSTRAINT `class_user_class_id_foreign` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `class_user_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `coding_logs`
--
ALTER TABLE `coding_logs`
  ADD CONSTRAINT `coding_logs_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `coding_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `devices`
--
ALTER TABLE `devices`
  ADD CONSTRAINT `devices_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `login_histories`
--
ALTER TABLE `login_histories`
  ADD CONSTRAINT `login_histories_device_id_foreign` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `login_histories_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `materials`
--
ALTER TABLE `materials`
  ADD CONSTRAINT `materials_class_id_foreign` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `materials_subject_id_foreign` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `materials_teacher_id_foreign` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_receiver_id_foreign` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_sender_id_foreign` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `permissions`
--
ALTER TABLE `permissions`
  ADD CONSTRAINT `permissions_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `permissions_teacher_id_foreign` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `permissions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `pkl_locations`
--
ALTER TABLE `pkl_locations`
  ADD CONSTRAINT `pkl_locations_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `profiles`
--
ALTER TABLE `profiles`
  ADD CONSTRAINT `profiles_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `profile_subject`
--
ALTER TABLE `profile_subject`
  ADD CONSTRAINT `profile_subject_profile_id_foreign` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `profile_subject_subject_id_foreign` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `projects_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `schedules`
--
ALTER TABLE `schedules`
  ADD CONSTRAINT `schedules_class_id_foreign` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `schedules_subject_id_foreign` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `schedules_teacher_id_foreign` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `simulator_sessions`
--
ALTER TABLE `simulator_sessions`
  ADD CONSTRAINT `simulator_sessions_career_path_id_foreign` FOREIGN KEY (`career_path_id`) REFERENCES `career_paths` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `simulator_sessions_current_step_id_foreign` FOREIGN KEY (`current_step_id`) REFERENCES `simulator_steps` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `simulator_sessions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `simulator_steps`
--
ALTER TABLE `simulator_steps`
  ADD CONSTRAINT `simulator_steps_career_path_id_foreign` FOREIGN KEY (`career_path_id`) REFERENCES `career_paths` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `student_skills`
--
ALTER TABLE `student_skills`
  ADD CONSTRAINT `student_skills_skill_id_foreign` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_skills_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_pkl_location_id_foreign` FOREIGN KEY (`pkl_location_id`) REFERENCES `pkl_locations` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
