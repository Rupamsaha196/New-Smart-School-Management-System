-- MySQL dump 10.13  Distrib 8.4.3, for Win64 (x86_64)
--
-- Host: localhost    Database: smart_school
-- ------------------------------------------------------
-- Server version	8.0.39

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `academic_sessions`
--

DROP TABLE IF EXISTS `academic_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `academic_sessions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `academic_sessions_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `academic_sessions`
--

LOCK TABLES `academic_sessions` WRITE;
/*!40000 ALTER TABLE `academic_sessions` DISABLE KEYS */;
INSERT INTO `academic_sessions` VALUES (1,'2025-2026','2025-04-01','2026-03-31',1,'2026-09-26 06:48:44','2026-09-26 06:48:44'),(2,'2026-2027','2026-04-01','2027-03-31',0,'2026-09-26 06:48:44','2026-09-26 06:48:44'),(3,'2024-2025','2024-04-01','2025-03-31',0,'2026-09-26 06:48:44','2026-09-26 06:48:44'),(4,'Academic Year 2029 - 2030','2029-04-01','2030-03-31',0,'2026-09-28 01:12:26','2026-09-28 01:12:26');
/*!40000 ALTER TABLE `academic_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accounts_heads`
--

DROP TABLE IF EXISTS `accounts_heads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounts_heads` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('Income','Expense') COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounts_heads`
--

LOCK TABLES `accounts_heads` WRITE;
/*!40000 ALTER TABLE `accounts_heads` DISABLE KEYS */;
/*!40000 ALTER TABLE `accounts_heads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendances`
--

DROP TABLE IF EXISTS `attendances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendances` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` bigint unsigned NOT NULL,
  `class_id` bigint unsigned DEFAULT NULL,
  `date` date NOT NULL,
  `status` enum('Present','Absent','Late','Half Day','Holiday') COLLATE utf8mb4_unicode_ci NOT NULL,
  `remark` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `marked_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `attendances_student_id_date_unique` (`student_id`,`date`),
  KEY `attendances_marked_by_foreign` (`marked_by`),
  CONSTRAINT `attendances_marked_by_foreign` FOREIGN KEY (`marked_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `attendances_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendances`
--

LOCK TABLES `attendances` WRITE;
/*!40000 ALTER TABLE `attendances` DISABLE KEYS */;
INSERT INTO `attendances` VALUES (1,1,NULL,'2026-09-28','Present',NULL,NULL,'2026-09-28 00:33:48','2026-09-28 00:34:01');
/*!40000 ALTER TABLE `attendances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `book_issues`
--

DROP TABLE IF EXISTS `book_issues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `book_issues` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `book_id` bigint unsigned NOT NULL,
  `student_id` bigint unsigned DEFAULT NULL,
  `staff_id` bigint unsigned DEFAULT NULL,
  `student_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `issue_date` date NOT NULL,
  `due_date` date NOT NULL,
  `return_date` date DEFAULT NULL,
  `fine_amount` decimal(8,2) NOT NULL DEFAULT '0.00',
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'issued',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `book_issues_student_id_foreign` (`student_id`),
  KEY `book_issues_staff_id_foreign` (`staff_id`),
  CONSTRAINT `book_issues_staff_id_foreign` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL,
  CONSTRAINT `book_issues_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `book_issues`
--

LOCK TABLES `book_issues` WRITE;
/*!40000 ALTER TABLE `book_issues` DISABLE KEYS */;
/*!40000 ALTER TABLE `book_issues` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `calendar_events`
--

DROP TABLE IF EXISTS `calendar_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `calendar_events` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL,
  `type` enum('Academic','Event','Holiday') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Event',
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calendar_events`
--

LOCK TABLES `calendar_events` WRITE;
/*!40000 ALTER TABLE `calendar_events` DISABLE KEYS */;
INSERT INTO `calendar_events` VALUES (1,'Summer Vacation Begins','2026-05-15','Holiday','Summer break starts for all students.','2026-09-26 06:48:44','2026-09-26 06:48:44'),(2,'Annual Sports Meet','2026-11-20','Event','Inter-house sports competition.','2026-09-26 06:48:44','2026-09-26 06:48:44'),(3,'First Term Exams','2026-09-10','Academic','First term final examinations for all classes.','2026-09-26 06:48:44','2026-09-26 06:48:44'),(4,'Independence Day Celebration','2026-08-15','Event','Flag hoisting and cultural programs.','2026-09-26 06:48:44','2026-09-26 06:48:44'),(5,'Diwali Holiday','2026-10-20','Holiday','School closed for Diwali festival.','2026-09-26 06:48:44','2026-09-26 06:48:44'),(6,'Parent-Teacher Meeting','2026-12-05','Academic','PTM for all classes.','2026-09-26 06:48:44','2026-09-26 06:48:44'),(7,'State Level Science Olympiad 2026','2026-11-15','Academic','Inter-district competitive science championship','2026-09-28 01:44:21','2026-09-28 01:44:21');
/*!40000 ALTER TABLE `calendar_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `class_subjects`
--

DROP TABLE IF EXISTS `class_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_subjects` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `class_id` bigint unsigned NOT NULL,
  `subject_id` bigint unsigned NOT NULL,
  `teacher_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `class_subjects_class_id_subject_id_unique` (`class_id`,`subject_id`),
  KEY `class_subjects_subject_id_foreign` (`subject_id`),
  CONSTRAINT `class_subjects_class_id_foreign` FOREIGN KEY (`class_id`) REFERENCES `school_classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `class_subjects_subject_id_foreign` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `class_subjects`
--

LOCK TABLES `class_subjects` WRITE;
/*!40000 ALTER TABLE `class_subjects` DISABLE KEYS */;
/*!40000 ALTER TABLE `class_subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `custom_fields`
--

DROP TABLE IF EXISTS `custom_fields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `custom_fields` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `form` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('Text','Number','Date','Dropdown') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Text',
  `required` tinyint(1) NOT NULL DEFAULT '0',
  `options` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `custom_fields`
--

LOCK TABLES `custom_fields` WRITE;
/*!40000 ALTER TABLE `custom_fields` DISABLE KEYS */;
INSERT INTO `custom_fields` VALUES (1,'Student Admission','Blood Group','Dropdown',1,'[\"A+\", \"A-\", \"B+\", \"B-\", \"O+\", \"O-\", \"AB+\", \"AB-\"]','2026-09-26 06:48:44','2026-09-26 06:48:44'),(2,'Staff Record','Previous School Name','Text',0,NULL,'2026-09-26 06:48:44','2026-09-26 06:48:44'),(3,'Student Admission','Allergies','Text',0,NULL,'2026-09-26 06:48:44','2026-09-26 06:48:44');
/*!40000 ALTER TABLE `custom_fields` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `download_materials`
--

DROP TABLE IF EXISTS `download_materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `download_materials` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Study Material',
  `class_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'All Classes',
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1.2 MB',
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `download_materials`
--

LOCK TABLES `download_materials` WRITE;
/*!40000 ALTER TABLE `download_materials` DISABLE KEYS */;
INSERT INTO `download_materials` VALUES (1,'CBSE Mathematics Annual Syllabus 2025-26','Syllabus','Class 10','/storage/materials/math_syllabus_class10.pdf','1.2 MB','Complete chapter-wise syllabus and marking scheme','2026-09-26 06:48:44','2026-09-26 06:48:44'),(2,'Physics Mechanics & Optics Question Bank','Study Material','Class 12','/storage/materials/physics_notes_class12.pdf','3.5 MB','Key formulas, derivations and exemplar solved problems','2026-09-26 06:48:44','2026-09-26 06:48:44'),(3,'English Creative Writing & Grammar Assignment','Assignment','Class 8','/storage/materials/english_assignment_class8.pdf','850 KB','Autumn vacation practice assignment','2026-09-26 06:48:44','2026-09-26 06:48:44'),(4,'Annual Examination Comprehensive Timetable','Other','All Classes','/storage/materials/annual_exam_timetable.pdf','420 KB','Detailed exam routine with instructions','2026-09-26 06:48:44','2026-09-26 06:48:44');
/*!40000 ALTER TABLE `download_materials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exam_results`
--

DROP TABLE IF EXISTS `exam_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exam_results` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` bigint unsigned NOT NULL,
  `exam` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `marks` int NOT NULL,
  `total` int NOT NULL,
  `grade` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pass',
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `exam_results_student_id_foreign` (`student_id`),
  CONSTRAINT `exam_results_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exam_results`
--

LOCK TABLES `exam_results` WRITE;
/*!40000 ALTER TABLE `exam_results` DISABLE KEYS */;
INSERT INTO `exam_results` VALUES (1,1,'Unit Test 1','Mathematics',42,50,'A+','Pass',NULL,'2026-09-26 06:48:44','2026-09-26 06:48:44'),(2,1,'Unit Test 1','Science',38,50,'A','Pass',NULL,'2026-09-26 06:48:44','2026-09-26 06:48:44'),(3,1,'Unit Test 1','English',44,50,'A+','Pass',NULL,'2026-09-26 06:48:44','2026-09-26 06:48:44'),(4,1,'Unit Test 1','Hindi',36,50,'A','Pass',NULL,'2026-09-26 06:48:44','2026-09-26 06:48:44'),(5,1,'Unit Test 1','Social Studies',40,50,'A+','Pass',NULL,'2026-09-26 06:48:44','2026-09-26 06:48:44'),(6,1,'Unit Test 1','Mathematics',48,50,'A1','Pass',NULL,'2026-09-28 00:30:34','2026-09-28 00:30:34'),(7,1,'Unit Test 1','Mathematics',48,50,'A1','Pass',NULL,'2026-09-28 00:30:49','2026-09-28 00:30:49'),(8,1,'Unit Test 1','Mathematics',48,50,'A1','Pass',NULL,'2026-09-28 00:34:02','2026-09-28 00:34:02'),(9,1,'Unit Test 1','General',88,100,'A2','Pass',NULL,'2026-09-28 01:21:21','2026-09-28 01:21:21'),(10,2,'Unit Test 1','General',95,100,'A1','Pass',NULL,'2026-09-28 01:21:21','2026-09-28 01:21:21');
/*!40000 ALTER TABLE `exam_results` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exam_schedules`
--

DROP TABLE IF EXISTS `exam_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exam_schedules` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `exam_id` bigint unsigned NOT NULL,
  `class_id` bigint unsigned NOT NULL,
  `subject_id` bigint unsigned NOT NULL,
  `exam_date` date NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `total_marks` int NOT NULL DEFAULT '100',
  `pass_marks` int NOT NULL DEFAULT '35',
  `room` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `exam_schedules_exam_id_foreign` (`exam_id`),
  KEY `exam_schedules_class_id_foreign` (`class_id`),
  KEY `exam_schedules_subject_id_foreign` (`subject_id`),
  CONSTRAINT `exam_schedules_class_id_foreign` FOREIGN KEY (`class_id`) REFERENCES `school_classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `exam_schedules_exam_id_foreign` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `exam_schedules_subject_id_foreign` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exam_schedules`
--

LOCK TABLES `exam_schedules` WRITE;
/*!40000 ALTER TABLE `exam_schedules` DISABLE KEYS */;
/*!40000 ALTER TABLE `exam_schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exams`
--

DROP TABLE IF EXISTS `exams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exams` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `term` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Written',
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Scheduled',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exams`
--

LOCK TABLES `exams` WRITE;
/*!40000 ALTER TABLE `exams` DISABLE KEYS */;
INSERT INTO `exams` VALUES (1,'Unit Test 1','Term 1','Written','Completed','2026-07-10','2026-07-15','2026-09-26 06:48:44','2026-09-26 06:48:44'),(2,'Mid Term 2026','Term 1','Written','Scheduled','2026-10-01','2026-10-10','2026-09-26 06:48:44','2026-09-26 06:48:44'),(3,'Annual Exam 2026','Term 2','Written','Scheduled','2027-02-15','2027-03-05','2026-09-26 06:48:44','2026-09-26 06:48:44');
/*!40000 ALTER TABLE `exams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`),
  KEY `failed_jobs_connection_queue_failed_at_index` (`connection`,`queue`,`failed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fee_discounts`
--

DROP TABLE IF EXISTS `fee_discounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fee_discounts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` bigint unsigned NOT NULL,
  `fee_type_id` bigint unsigned NOT NULL,
  `discount_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_type` enum('Percentage','Fixed') COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` decimal(8,2) NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fee_discounts_student_id_foreign` (`student_id`),
  KEY `fee_discounts_fee_type_id_foreign` (`fee_type_id`),
  CONSTRAINT `fee_discounts_fee_type_id_foreign` FOREIGN KEY (`fee_type_id`) REFERENCES `fee_types` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fee_discounts_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fee_discounts`
--

LOCK TABLES `fee_discounts` WRITE;
/*!40000 ALTER TABLE `fee_discounts` DISABLE KEYS */;
INSERT INTO `fee_discounts` VALUES (1,1,1,'Sibling Concession','Percentage',15.00,'15% discount for younger sibling enrolled in school','2026-09-26 06:48:44','2026-09-26 06:48:44'),(2,1,1,'Academic Merit Scholarship','Percentage',25.00,'25% scholarship for students scoring 95%+ in annual exams','2026-09-26 06:48:44','2026-09-26 06:48:44');
/*!40000 ALTER TABLE `fee_discounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fee_types`
--

DROP TABLE IF EXISTS `fee_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fee_types` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `frequency` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Monthly',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fee_types`
--

LOCK TABLES `fee_types` WRITE;
/*!40000 ALTER TABLE `fee_types` DISABLE KEYS */;
INSERT INTO `fee_types` VALUES (1,'Tuition Fee',12500.00,'Monthly','2026-09-26 06:48:44','2026-09-26 06:48:44'),(2,'Transport Fee',3000.00,'Monthly','2026-09-26 06:48:44','2026-09-26 06:48:44'),(3,'Hostel Fee',8000.00,'Monthly','2026-09-26 06:48:44','2026-09-26 06:48:44'),(4,'Library Fee',500.00,'Annual','2026-09-26 06:48:44','2026-09-26 06:48:44'),(5,'Examination Fee',1000.00,'Annual','2026-09-26 06:48:44','2026-09-26 06:48:44'),(6,'Sports Fee',750.00,'Annual','2026-09-26 06:48:44','2026-09-26 06:48:44');
/*!40000 ALTER TABLE `fee_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `homeworks`
--

DROP TABLE IF EXISTS `homeworks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `homeworks` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `class_id` bigint unsigned NOT NULL,
  `section` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject_id` bigint unsigned NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `assigned_date` date NOT NULL,
  `due_date` date NOT NULL,
  `attachment` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigned_by` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `homeworks_class_id_foreign` (`class_id`),
  KEY `homeworks_subject_id_foreign` (`subject_id`),
  KEY `homeworks_assigned_by_foreign` (`assigned_by`),
  CONSTRAINT `homeworks_assigned_by_foreign` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `homeworks_class_id_foreign` FOREIGN KEY (`class_id`) REFERENCES `school_classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `homeworks_subject_id_foreign` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `homeworks`
--

LOCK TABLES `homeworks` WRITE;
/*!40000 ALTER TABLE `homeworks` DISABLE KEYS */;
/*!40000 ALTER TABLE `homeworks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hostel_rooms`
--

DROP TABLE IF EXISTS `hostel_rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hostel_rooms` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `hostel_id` bigint unsigned NOT NULL,
  `room_no` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Dormitory',
  `capacity` int NOT NULL DEFAULT '4',
  `fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `hostel_rooms_hostel_id_foreign` (`hostel_id`),
  CONSTRAINT `hostel_rooms_hostel_id_foreign` FOREIGN KEY (`hostel_id`) REFERENCES `hostels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hostel_rooms`
--

LOCK TABLES `hostel_rooms` WRITE;
/*!40000 ALTER TABLE `hostel_rooms` DISABLE KEYS */;
INSERT INTO `hostel_rooms` VALUES (1,1,'Room B-101','Standard',2,5000.00,'2026-09-28 01:44:21','2026-09-28 01:44:21'),(2,1,'Room A-204','Double Sharing',2,5000.00,'2026-09-28 07:14:06','2026-09-28 07:14:06');
/*!40000 ALTER TABLE `hostel_rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hostels`
--

DROP TABLE IF EXISTS `hostels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hostels` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `intake` int NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hostels`
--

LOCK TABLES `hostels` WRITE;
/*!40000 ALTER TABLE `hostels` DISABLE KEYS */;
INSERT INTO `hostels` VALUES (1,'Boys Hostel A','Boys','Campus North Wing',100,'2026-09-26 06:48:44','2026-09-26 06:48:44'),(2,'Girls Hostel B','Girls','Campus South Wing',80,'2026-09-26 06:48:44','2026-09-26 06:48:44'),(3,'Kalam Innovation Block D','Boys','North Campus',60,'2026-09-28 01:09:34','2026-09-28 01:09:34'),(4,'Aryabhata Research Hostel (Block E)','Co-Ed / Senior','Science Quadrangle',80,'2026-09-28 01:12:26','2026-09-28 01:12:26'),(5,'Balaji','Boys','School Campus',200,'2026-09-28 01:20:34','2026-09-28 01:20:34');
/*!40000 ALTER TABLE `hostels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` smallint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leave_applications`
--

DROP TABLE IF EXISTS `leave_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_applications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `leaveable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `leaveable_id` bigint unsigned NOT NULL,
  `leave_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `from_date` date NOT NULL,
  `to_date` date NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('Pending','Approved','Rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `approved_by` bigint unsigned DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `leave_applications_leaveable_type_leaveable_id_index` (`leaveable_type`,`leaveable_id`),
  KEY `leave_applications_approved_by_foreign` (`approved_by`),
  CONSTRAINT `leave_applications_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_applications`
--

LOCK TABLES `leave_applications` WRITE;
/*!40000 ALTER TABLE `leave_applications` DISABLE KEYS */;
/*!40000 ALTER TABLE `leave_applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `library_books`
--

DROP TABLE IF EXISTS `library_books`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `library_books` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `author` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isbn` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `publisher` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `publish_year` year DEFAULT NULL,
  `rack_no` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `language` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'English',
  `qty` int NOT NULL DEFAULT '1',
  `available_qty` int NOT NULL DEFAULT '1',
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Available',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `library_books`
--

LOCK TABLES `library_books` WRITE;
/*!40000 ALTER TABLE `library_books` DISABLE KEYS */;
INSERT INTO `library_books` VALUES (1,'Advanced Physics','H.C. Verma','978-1234567890',NULL,NULL,NULL,NULL,'English',10,8,'Available','2026-09-26 06:48:44','2026-09-26 06:48:44'),(2,'Mathematics for Class 10','R.D. Sharma','978-0987654321',NULL,NULL,NULL,NULL,'English',15,15,'Available','2026-09-26 06:48:44','2026-09-26 06:48:44'),(3,'Wings of Fire','A.P.J. Abdul Kalam','978-8173711466',NULL,NULL,NULL,NULL,'English',5,3,'Available','2026-09-26 06:48:44','2026-09-26 06:48:44'),(4,'NCERT Chemistry Part 1','NCERT','978-8174507327',NULL,NULL,NULL,NULL,'English',20,20,'Available','2026-09-26 06:48:44','2026-09-26 06:48:44'),(5,'AI & Machine Learning Primer','Dr. Vivek Saxena',NULL,'Technology',NULL,NULL,'Rack A-01','English',15,15,'Available','2026-09-28 01:09:34','2026-09-28 01:09:34'),(6,'Introduction to Algorithms 4th Ed','Thomas H. Cormen','978-0262046305','Computer Science',NULL,NULL,'Rack A-01','English',20,20,'Available','2026-09-28 01:12:26','2026-09-28 01:12:26'),(7,'Byomkesh Samagra','Saradindu Bandopadhyay','978-938483501','General Reference',NULL,NULL,'Rack B-06','English',15,15,'Available','2026-09-28 05:38:46','2026-09-28 05:38:46'),(8,'Byomkesh Samagra','Saradindu Bandopadhyay','978-936671011','General Reference',NULL,NULL,'Rack B-05','English',15,15,'Available','2026-09-28 07:13:40','2026-09-28 07:13:40');
/*!40000 ALTER TABLE `library_books` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `live_classes`
--

DROP TABLE IF EXISTS `live_classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `live_classes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `class_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL,
  `time` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `platform` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Google Meet',
  `link` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Upcoming',
  `teacher_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Faculty',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `live_classes`
--

LOCK TABLES `live_classes` WRITE;
/*!40000 ALTER TABLE `live_classes` DISABLE KEYS */;
INSERT INTO `live_classes` VALUES (1,'Linear Equations in Two Variables','Mathematics','Class 10','2026-09-26','10:00 AM - 11:00 AM','Zoom','https://zoom.us/j/1234567890','Live','Rajesh Sharma','2026-09-26 06:48:44','2026-09-26 06:48:44'),(2,'Ray Optics and Wave Theory','Physics','Class 12','2026-09-26','11:30 AM - 12:30 PM','Google Meet','https://meet.google.com/abc-defg-hij','Upcoming','Dr. Sunita Verma','2026-09-26 06:48:44','2026-09-26 06:48:44'),(3,'Indian National Movement','History','Class 9','2026-09-27','09:00 AM - 10:00 AM','Google Meet','https://meet.google.com/xyz-uvwx-rst','Upcoming','Amit Kumar','2026-09-26 06:48:44','2026-09-26 06:48:44'),(4,'Advanced AI and Robotics Interactive Lab Session','Computer Science','Class 10-A','2026-09-28','11:00 AM - 12:00 PM','Google Meet','https://meet.google.com/new','upcoming','Dr. Vivek Saxena','2026-09-28 01:44:21','2026-09-28 01:44:21'),(6,'Google Meet Physics Live Stream','Physics','Class 12-A','2026-09-28','11:00 AM (Live Now)','Google Meet','https://meet.google.com/abc-defg-hij','live','Dr. Vivek Saxena','2026-09-28 02:16:29','2026-09-28 02:16:29');
/*!40000 ALTER TABLE `live_classes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `from_user_id` bigint unsigned NOT NULL,
  `to_user_id` bigint unsigned NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `messages_from_user_id_foreign` (`from_user_id`),
  KEY `messages_to_user_id_foreign` (`to_user_id`),
  CONSTRAINT `messages_from_user_id_foreign` FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_to_user_id_foreign` FOREIGN KEY (`to_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2026_09_24_092528_create_personal_access_tokens_table',1),(5,'2026_09_25_060000_create_calendar_events_table',1),(6,'2026_09_25_060100_create_custom_fields_table',1),(7,'2026_09_25_060200_create_qr_attendance_logs_table',1),(8,'2026_09_25_060300_add_two_factor_columns_to_users_table',1),(9,'2026_09_25_060400_create_students_table',1),(10,'2026_09_25_060500_create_staff_table',1),(11,'2026_09_25_060600_create_profile_relations_table',1),(12,'2026_09_25_060700_create_all_modules_tables',1),(13,'2026_09_26_100000_expand_students_and_admissions',1),(14,'2026_09_26_100100_create_attendance_tables',1),(15,'2026_09_26_100200_expand_staff_and_payroll',1),(16,'2026_09_26_100300_expand_academics_and_exams',1),(17,'2026_09_26_100400_expand_fees_and_finance',1),(18,'2026_09_26_100500_create_communication_tables',1),(19,'2026_09_26_100600_expand_operations_modules',1),(20,'2026_09_26_100700_create_permissions_and_roles',1),(21,'2026_09_26_110000_create_remaining_44_modules_tables',1);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notices`
--

DROP TABLE IF EXISTS `notices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notices` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL,
  `audience` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'All',
  `attachment` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notices_created_by_foreign` (`created_by`),
  CONSTRAINT `notices_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notices`
--

LOCK TABLES `notices` WRITE;
/*!40000 ALTER TABLE `notices` DISABLE KEYS */;
INSERT INTO `notices` VALUES (1,'Annual Sports Day 2026','Annual Sports Day will be held on October 15, 2026. All students are requested to participate.','2026-10-15','All',NULL,1,2,'2026-09-26 06:48:44','2026-09-26 06:48:44'),(2,'Fee Payment Reminder','Last date for September fee payment is 10th October 2026. Please pay on time to avoid fine.','2026-10-01','Parents',NULL,1,2,'2026-09-26 06:48:44','2026-09-26 06:48:44'),(3,'Parent Teacher Meeting','PTM scheduled for 5th December 2026. All parents are required to attend.','2026-12-05','Parents',NULL,1,2,'2026-09-26 06:48:44','2026-09-26 06:48:44'),(4,'Global Science Olympiad Nominations Open','Students from Classes 8 through 12 may register with their science faculty.','2026-09-28','Students',NULL,1,1,'2026-09-28 01:12:26','2026-09-28 01:12:26');
/*!40000 ALTER TABLE `notices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_logs`
--

DROP TABLE IF EXISTS `notification_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `recipient_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_contact` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel` enum('SMS','Email','Push') COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('Sent','Failed','Pending') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_logs`
--

LOCK TABLES `notification_logs` WRITE;
/*!40000 ALTER TABLE `notification_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payslip_items`
--

DROP TABLE IF EXISTS `payslip_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payslip_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `salary_record_id` bigint unsigned NOT NULL,
  `label` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_type` enum('Earning','Deduction') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payslip_items_salary_record_id_foreign` (`salary_record_id`),
  CONSTRAINT `payslip_items_salary_record_id_foreign` FOREIGN KEY (`salary_record_id`) REFERENCES `salary_records` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payslip_items`
--

LOCK TABLES `payslip_items` WRITE;
/*!40000 ALTER TABLE `payslip_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `payslip_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'students.view','Students','view','2026-09-26 06:48:43','2026-09-26 06:48:43'),(2,'students.create','Students','create','2026-09-26 06:48:43','2026-09-26 06:48:43'),(3,'students.edit','Students','edit','2026-09-26 06:48:43','2026-09-26 06:48:43'),(4,'students.delete','Students','delete','2026-09-26 06:48:43','2026-09-26 06:48:43'),(5,'staff.view','Staff','view','2026-09-26 06:48:43','2026-09-26 06:48:43'),(6,'staff.create','Staff','create','2026-09-26 06:48:43','2026-09-26 06:48:43'),(7,'staff.edit','Staff','edit','2026-09-26 06:48:43','2026-09-26 06:48:43'),(8,'staff.delete','Staff','delete','2026-09-26 06:48:43','2026-09-26 06:48:43'),(9,'attendance.view','Attendance','view','2026-09-26 06:48:43','2026-09-26 06:48:43'),(10,'attendance.mark','Attendance','mark','2026-09-26 06:48:43','2026-09-26 06:48:43'),(11,'attendance.report','Attendance','report','2026-09-26 06:48:43','2026-09-26 06:48:43'),(12,'fees.view','Fees','view','2026-09-26 06:48:43','2026-09-26 06:48:43'),(13,'fees.create','Fees','create','2026-09-26 06:48:43','2026-09-26 06:48:43'),(14,'fees.collect','Fees','collect','2026-09-26 06:48:43','2026-09-26 06:48:43'),(15,'fees.report','Fees','report','2026-09-26 06:48:43','2026-09-26 06:48:43'),(16,'exams.view','Exams','view','2026-09-26 06:48:43','2026-09-26 06:48:43'),(17,'exams.create','Exams','create','2026-09-26 06:48:43','2026-09-26 06:48:43'),(18,'exams.marks_entry','Exams','marks_entry','2026-09-26 06:48:43','2026-09-26 06:48:43'),(19,'exams.report','Exams','report','2026-09-26 06:48:43','2026-09-26 06:48:43'),(20,'academics.view','Academics','view','2026-09-26 06:48:43','2026-09-26 06:48:43'),(21,'academics.create','Academics','create','2026-09-26 06:48:43','2026-09-26 06:48:43'),(22,'academics.edit','Academics','edit','2026-09-26 06:48:43','2026-09-26 06:48:43'),(23,'academics.delete','Academics','delete','2026-09-26 06:48:43','2026-09-26 06:48:43'),(24,'library.view','Library','view','2026-09-26 06:48:43','2026-09-26 06:48:43'),(25,'library.issue','Library','issue','2026-09-26 06:48:43','2026-09-26 06:48:43'),(26,'library.return','Library','return','2026-09-26 06:48:43','2026-09-26 06:48:43'),(27,'library.manage','Library','manage','2026-09-26 06:48:43','2026-09-26 06:48:43'),(28,'transport.view','Transport','view','2026-09-26 06:48:43','2026-09-26 06:48:43'),(29,'transport.manage','Transport','manage','2026-09-26 06:48:43','2026-09-26 06:48:43'),(30,'hostel.view','Hostel','view','2026-09-26 06:48:43','2026-09-26 06:48:43'),(31,'hostel.manage','Hostel','manage','2026-09-26 06:48:43','2026-09-26 06:48:43'),(32,'notices.view','Notices','view','2026-09-26 06:48:43','2026-09-26 06:48:43'),(33,'notices.create','Notices','create','2026-09-26 06:48:43','2026-09-26 06:48:43'),(34,'notices.edit','Notices','edit','2026-09-26 06:48:43','2026-09-26 06:48:43'),(35,'notices.delete','Notices','delete','2026-09-26 06:48:43','2026-09-26 06:48:43'),(36,'timetable.view','Timetable','view','2026-09-26 06:48:43','2026-09-26 06:48:43'),(37,'timetable.manage','Timetable','manage','2026-09-26 06:48:43','2026-09-26 06:48:43'),(38,'payroll.view','Payroll','view','2026-09-26 06:48:43','2026-09-26 06:48:43'),(39,'payroll.generate','Payroll','generate','2026-09-26 06:48:43','2026-09-26 06:48:43'),(40,'payroll.pay','Payroll','pay','2026-09-26 06:48:43','2026-09-26 06:48:43'),(41,'reports.view','Reports','view','2026-09-26 06:48:43','2026-09-26 06:48:43'),(42,'reports.export','Reports','export','2026-09-26 06:48:43','2026-09-26 06:48:43'),(43,'settings.view','Settings','view','2026-09-26 06:48:43','2026-09-26 06:48:43'),(44,'settings.manage','Settings','manage','2026-09-26 06:48:43','2026-09-26 06:48:43');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `qr_attendance_logs`
--

DROP TABLE IF EXISTS `qr_attendance_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `qr_attendance_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `identifier` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `person_type` enum('Student','Staff') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Student',
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Present',
  `scanned_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `qr_attendance_logs`
--

LOCK TABLES `qr_attendance_logs` WRITE;
/*!40000 ALTER TABLE `qr_attendance_logs` DISABLE KEYS */;
INSERT INTO `qr_attendance_logs` VALUES (1,'Suresh Kumar','T1001','Staff','Present','2026-09-26 02:45:00','2026-09-26 06:48:44','2026-09-26 06:48:44'),(2,'Amit Singh','S2045','Student','Present','2026-09-26 02:52:00','2026-09-26 06:48:44','2026-09-26 06:48:44'),(3,'Priya Sharma','S2046','Student','Present','2026-09-26 03:00:00','2026-09-26 06:48:44','2026-09-26 06:48:44'),(4,'Aarav Sharma','SS2025001','Student','Present','2026-09-28 00:34:01','2026-09-28 00:34:01','2026-09-28 00:34:01');
/*!40000 ALTER TABLE `qr_attendance_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `role` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `permission_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_permissions_role_permission_id_unique` (`role`,`permission_id`),
  KEY `role_permissions_permission_id_foreign` (`permission_id`),
  CONSTRAINT `role_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=113 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (1,'super_admin',1,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(2,'super_admin',2,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(3,'super_admin',3,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(4,'super_admin',4,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(5,'super_admin',5,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(6,'super_admin',6,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(7,'super_admin',7,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(8,'super_admin',8,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(9,'super_admin',9,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(10,'super_admin',10,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(11,'super_admin',11,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(12,'super_admin',12,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(13,'super_admin',13,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(14,'super_admin',14,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(15,'super_admin',15,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(16,'super_admin',16,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(17,'super_admin',17,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(18,'super_admin',18,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(19,'super_admin',19,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(20,'super_admin',20,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(21,'super_admin',21,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(22,'super_admin',22,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(23,'super_admin',23,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(24,'super_admin',24,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(25,'super_admin',25,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(26,'super_admin',26,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(27,'super_admin',27,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(28,'super_admin',28,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(29,'super_admin',29,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(30,'super_admin',30,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(31,'super_admin',31,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(32,'super_admin',32,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(33,'super_admin',33,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(34,'super_admin',34,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(35,'super_admin',35,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(36,'super_admin',36,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(37,'super_admin',37,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(38,'super_admin',38,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(39,'super_admin',39,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(40,'super_admin',40,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(41,'super_admin',41,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(42,'super_admin',42,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(43,'super_admin',43,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(44,'super_admin',44,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(45,'admin',1,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(46,'admin',2,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(47,'admin',3,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(48,'admin',4,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(49,'admin',5,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(50,'admin',6,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(51,'admin',7,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(52,'admin',8,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(53,'admin',9,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(54,'admin',10,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(55,'admin',11,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(56,'admin',12,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(57,'admin',13,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(58,'admin',14,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(59,'admin',15,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(60,'admin',16,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(61,'admin',17,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(62,'admin',18,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(63,'admin',19,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(64,'admin',20,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(65,'admin',21,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(66,'admin',22,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(67,'admin',23,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(68,'admin',24,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(69,'admin',25,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(70,'admin',26,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(71,'admin',27,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(72,'admin',28,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(73,'admin',29,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(74,'admin',30,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(75,'admin',31,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(76,'admin',32,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(77,'admin',33,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(78,'admin',34,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(79,'admin',35,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(80,'admin',36,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(81,'admin',37,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(82,'admin',38,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(83,'admin',39,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(84,'admin',40,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(85,'admin',41,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(86,'admin',42,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(87,'admin',43,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(88,'admin',44,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(89,'teacher',1,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(90,'teacher',9,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(91,'teacher',10,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(92,'teacher',16,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(93,'teacher',18,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(94,'teacher',20,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(95,'teacher',24,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(96,'teacher',32,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(97,'teacher',36,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(98,'accountant',1,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(99,'accountant',12,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(100,'accountant',13,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(101,'accountant',14,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(102,'accountant',15,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(103,'accountant',38,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(104,'accountant',39,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(105,'accountant',40,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(106,'accountant',41,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(107,'accountant',42,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(108,'librarian',1,'2026-09-26 06:48:43','2026-09-26 06:48:43'),(109,'librarian',24,'2026-09-26 06:48:44','2026-09-26 06:48:44'),(110,'librarian',25,'2026-09-26 06:48:44','2026-09-26 06:48:44'),(111,'librarian',26,'2026-09-26 06:48:44','2026-09-26 06:48:44'),(112,'librarian',27,'2026-09-26 06:48:44','2026-09-26 06:48:44');
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `salary_records`
--

DROP TABLE IF EXISTS `salary_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salary_records` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `staff_id` bigint unsigned NOT NULL,
  `month` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year` int NOT NULL,
  `basic` decimal(10,2) NOT NULL DEFAULT '0.00',
  `allowances` decimal(10,2) NOT NULL DEFAULT '0.00',
  `deductions` decimal(10,2) NOT NULL DEFAULT '0.00',
  `net_salary` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` enum('Paid','Pending') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `payment_date` date DEFAULT NULL,
  `payment_mode` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `salary_records_staff_id_foreign` (`staff_id`),
  CONSTRAINT `salary_records_staff_id_foreign` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `salary_records`
--

LOCK TABLES `salary_records` WRITE;
/*!40000 ALTER TABLE `salary_records` DISABLE KEYS */;
/*!40000 ALTER TABLE `salary_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `school_classes`
--

DROP TABLE IF EXISTS `school_classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `school_classes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sections` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `class_teacher` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `room_no` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `school_classes`
--

LOCK TABLES `school_classes` WRITE;
/*!40000 ALTER TABLE `school_classes` DISABLE KEYS */;
INSERT INTO `school_classes` VALUES (1,'Nursery','A',NULL,NULL,'2026-09-26 06:48:44','2026-09-26 06:48:44'),(2,'LKG','A, B',NULL,NULL,'2026-09-26 06:48:44','2026-09-26 06:48:44'),(3,'UKG','A, B',NULL,NULL,'2026-09-26 06:48:44','2026-09-26 06:48:44'),(4,'Class 1','A, B',NULL,NULL,'2026-09-26 06:48:44','2026-09-26 06:48:44'),(5,'Class 5','A, B',NULL,NULL,'2026-09-26 06:48:44','2026-09-26 06:48:44'),(6,'Class 8','A, B',NULL,NULL,'2026-09-26 06:48:44','2026-09-26 06:48:44'),(7,'Class 10','A, B',NULL,NULL,'2026-09-26 06:48:44','2026-09-26 06:48:44'),(8,'Class 11','Science, Arts',NULL,NULL,'2026-09-26 06:48:44','2026-09-26 06:48:44'),(9,'Class 12','Science, Arts, Commerce',NULL,NULL,'2026-09-26 06:48:44','2026-09-26 06:48:44'),(10,'Robotics & AI Masterclass','A, B','Dr. Vivek Saxena',NULL,'2026-09-28 01:03:26','2026-09-28 01:03:26'),(11,'Class 10 - Advanced Coding','A, B, C','Mr. Deepak Sharma',NULL,'2026-09-28 01:12:26','2026-09-28 01:12:26'),(12,'Grade 11 Tech','A, B','Ms. Pooja Sen',NULL,'2026-09-28 02:01:17','2026-09-28 02:01:17');
/*!40000 ALTER TABLE `school_classes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `school_settings`
--

DROP TABLE IF EXISTS `school_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `school_settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Smart School International',
  `tagline` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Empowering Minds, Shaping Futures',
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'admin@smartschool.edu',
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '+91 98765 43210',
  `address` text COLLATE utf8mb4_unicode_ci,
  `active_session` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '2025-2026',
  `currency` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INR',
  `currency_symbol` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INR',
  `receipt_prefix` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'REC-',
  `thermal_format` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '80mm',
  `whatsapp_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '+919876543210',
  `whatsapp_default_message` text COLLATE utf8mb4_unicode_ci,
  `current_campus` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Main Campus - Sector 15',
  `available_campuses` json DEFAULT NULL,
  `online_processing_fee_pct` decimal(5,2) NOT NULL DEFAULT '1.50',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `razorpay_key_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'rzp_test_YOUR_KEY_ID_HERE',
  `razorpay_key_secret` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'YOUR_KEY_SECRET_HERE',
  `razorpay_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `razorpay_mode` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'test',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `school_settings`
--

LOCK TABLES `school_settings` WRITE;
/*!40000 ALTER TABLE `school_settings` DISABLE KEYS */;
INSERT INTO `school_settings` VALUES (1,'Smart School International - Kolkata Hub','Excellence in Holistic Education','contact@smartschool.edu','+91 98765 43210','Plot 42, Institutional Area, Sector V, Salt Lake, Kolkata, West Bengal - 700091','2025-2026','INR','Γé╣','SS-REC-','80mm','+919876543210','Hello Smart School! I need information about student admissions and fee structure.','Kolkata Main Campus (Salt Lake Sector V)','[\"Kolkata Main Campus (Salt Lake Sector V)\", \"South Kolkata Campus (Ballygunge)\", \"St. Xavier Model Academy (Park Street)\", \"New Town Eco Park Branch\"]',1.50,'2026-09-26 06:48:44','2026-09-28 07:20:46','rzp_test_YOUR_KEY_ID_HERE','YOUR_KEY_SECRET_HERE',1,'test');
/*!40000 ALTER TABLE `school_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `emp_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `designation` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `gender` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `blood_group` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `religion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `joining_date` date DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `city` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pincode` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qualification` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `basic_salary` decimal(10,2) DEFAULT NULL,
  `account_no` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ifsc_code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profile_photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `staff_emp_id_unique` (`emp_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
INSERT INTO `staff` VALUES (1,'EMP001','Rajesh Sharma','Teacher','Senior Teacher','rajesh@smartschool.com','9876540001',NULL,NULL,NULL,NULL,NULL,'2020-06-01','Sector V, Salt Lake City','Kolkata','West Bengal','700091',NULL,45000.00,NULL,NULL,NULL,NULL,'Science','Active','2026-09-26 06:48:44','2026-09-26 06:48:44'),(2,'EMP002','Sunita Verma','Accountant','Senior Accountant','sunita@smartschool.com','9876540002',NULL,NULL,NULL,NULL,NULL,'2019-04-01','Rowdon Street, Mullick Bazar','Kolkata','West Bengal','700017',NULL,38000.00,NULL,NULL,NULL,NULL,'Finance','Active','2026-09-26 06:48:44','2026-09-26 06:48:44'),(3,'EMP003','Amit Kumar','Librarian','Chief Librarian','amit@smartschool.com','9876540003',NULL,NULL,NULL,NULL,NULL,'2021-07-15','College Street, Bowbazar','Kolkata','West Bengal','700073',NULL,32000.00,NULL,NULL,NULL,NULL,'Library','Active','2026-09-26 06:48:44','2026-09-26 06:48:44'),(4,'EMP004','Meena Patel','Receptionist','Front Desk Officer','meena@smartschool.com','9876540004',NULL,NULL,NULL,NULL,NULL,'2022-01-10','Rashbehari Avenue, Kalighat','Kolkata','West Bengal','700026',NULL,28000.00,NULL,NULL,NULL,NULL,'Admin','Active','2026-09-26 06:48:44','2026-09-26 06:48:44'),(6,'EMP1099','Dr. Alok Verma','Senior Lecturer','Senior Lecturer',NULL,'9876543299',NULL,NULL,NULL,NULL,NULL,NULL,'New Town Action Area 1','Kolkata','West Bengal','700156',NULL,85000.00,NULL,NULL,NULL,NULL,'Physics','Active','2026-09-28 01:04:19','2026-09-28 01:04:19');
/*!40000 ALTER TABLE `staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_attendances`
--

DROP TABLE IF EXISTS `staff_attendances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_attendances` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `staff_id` bigint unsigned NOT NULL,
  `date` date NOT NULL,
  `status` enum('Present','Absent','Late','Half Day','Holiday','Leave') COLLATE utf8mb4_unicode_ci NOT NULL,
  `remark` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `time_in` time DEFAULT NULL,
  `time_out` time DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `staff_attendances_staff_id_date_unique` (`staff_id`,`date`),
  CONSTRAINT `staff_attendances_staff_id_foreign` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_attendances`
--

LOCK TABLES `staff_attendances` WRITE;
/*!40000 ALTER TABLE `staff_attendances` DISABLE KEYS */;
INSERT INTO `staff_attendances` VALUES (1,1,'2026-09-27','Present',NULL,'08:30:00','16:00:00','2026-09-27 04:38:08','2026-09-27 04:52:36'),(2,1,'2026-09-28','Present',NULL,'08:30:00','16:00:00','2026-09-27 23:59:10','2026-09-28 07:28:54'),(3,1,'2026-09-29','Present',NULL,'08:30:00','16:00:00','2026-09-28 23:55:23','2026-09-29 00:58:55');
/*!40000 ALTER TABLE `staff_attendances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_custom_field_values`
--

DROP TABLE IF EXISTS `student_custom_field_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_custom_field_values` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` bigint unsigned NOT NULL,
  `custom_field_id` bigint unsigned NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_custom_field_values_student_id_foreign` (`student_id`),
  KEY `student_custom_field_values_custom_field_id_foreign` (`custom_field_id`),
  CONSTRAINT `student_custom_field_values_custom_field_id_foreign` FOREIGN KEY (`custom_field_id`) REFERENCES `custom_fields` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_custom_field_values_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_custom_field_values`
--

LOCK TABLES `student_custom_field_values` WRITE;
/*!40000 ALTER TABLE `student_custom_field_values` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_custom_field_values` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_documents`
--

DROP TABLE IF EXISTS `student_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_documents` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` bigint unsigned NOT NULL,
  `document_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_documents_student_id_foreign` (`student_id`),
  CONSTRAINT `student_documents_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_documents`
--

LOCK TABLES `student_documents` WRITE;
/*!40000 ALTER TABLE `student_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_fees`
--

DROP TABLE IF EXISTS `student_fees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_fees` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `receipt_no` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `student_id` bigint unsigned NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `paid` decimal(10,2) NOT NULL DEFAULT '0.00',
  `payment_mode` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `transaction_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `fine` decimal(8,2) NOT NULL DEFAULT '0.00',
  `discount` decimal(8,2) NOT NULL DEFAULT '0.00',
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `date` date DEFAULT NULL,
  `month` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `collected_by` bigint unsigned DEFAULT NULL,
  `razorpay_order_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `razorpay_payment_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_fees_student_id_foreign` (`student_id`),
  KEY `student_fees_collected_by_foreign` (`collected_by`),
  CONSTRAINT `student_fees_collected_by_foreign` FOREIGN KEY (`collected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `student_fees_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_fees`
--

LOCK TABLES `student_fees` WRITE;
/*!40000 ALTER TABLE `student_fees` DISABLE KEYS */;
INSERT INTO `student_fees` VALUES (1,'RZP-82734912',1,'Tuition Fee',12500.00,5000.00,'Razorpay Online Gateway',NULL,NULL,0.00,0.00,'Paid','2025-04-10','April','2026-09-26 06:48:44','2026-09-26 06:48:44',NULL,'order_sim_da9128a61f3d00a6','pay_sim_982734912','2026-09-28 09:56:21'),(2,NULL,1,'Tuition Fee',12500.00,12500.00,'Cash',NULL,NULL,0.00,0.00,'Paid','2025-05-08','May','2026-09-26 06:48:44','2026-09-26 06:48:44',NULL,NULL,NULL,NULL),(3,NULL,1,'Tuition Fee',12500.00,12500.00,'Cash',NULL,NULL,0.00,0.00,'Paid','2025-06-12','June','2026-09-26 06:48:44','2026-09-26 06:48:44',NULL,NULL,NULL,NULL),(4,NULL,1,'Transport Fee',3000.00,3000.00,'Cash',NULL,NULL,0.00,0.00,'Paid','2025-04-10','Q1','2026-09-26 06:48:44','2026-09-26 06:48:44',NULL,NULL,NULL,NULL),(5,NULL,1,'Tuition Fee',12500.00,0.00,'Cash',NULL,NULL,0.00,0.00,'Pending',NULL,'September','2026-09-26 06:48:44','2026-09-26 06:48:44',NULL,NULL,NULL,NULL),(6,'REC-6AB8EB09C9CD3',1,'Tuition Fee',2500.00,2500.00,'Cash',NULL,NULL,0.00,0.00,'Paid',NULL,'September','2026-09-27 04:38:09','2026-09-27 04:38:09',NULL,NULL,NULL,NULL),(7,'REC-6AB8EB574E721',1,'Tuition Fee',2500.00,2500.00,'Cash',NULL,NULL,0.00,0.00,'Paid',NULL,'September','2026-09-27 04:39:27','2026-09-27 04:39:27',NULL,NULL,NULL,NULL),(8,'SS-REC-2026-04304',1,'Tuition Fee (Monthly)',2500.00,2500.00,'Cash Counter',NULL,'2026-10-12',0.00,0.00,'Paid','2026-09-27','September 2026','2026-09-27 04:51:54','2026-09-27 04:51:54',NULL,NULL,NULL,NULL),(9,'SS-REC-2026-05383',1,'Tuition Fee (Monthly)',2500.00,2500.00,'Cash Counter',NULL,'2026-10-12',0.00,0.00,'Paid','2026-09-27','September 2026','2026-09-27 04:52:23','2026-09-27 04:52:23',NULL,NULL,NULL,NULL),(10,'REC-6AB8EE6C47762',1,'Tuition Fee',2500.00,2500.00,'Cash',NULL,NULL,0.00,0.00,'Paid',NULL,'September','2026-09-27 04:52:36','2026-09-27 04:52:36',NULL,NULL,NULL,NULL),(11,'SS-REC-2026-07145',1,'Tuition Fee (Monthly)',2500.00,2500.00,'Cash Counter',NULL,'2026-10-13',0.00,0.00,'Paid','2026-09-28','September 2026','2026-09-27 23:59:10','2026-09-27 23:59:10',NULL,NULL,NULL,NULL),(12,'SS-REC-2026-00879',1,'Tuition Fee (Monthly)',2500.00,2500.00,'Cash Counter',NULL,'2026-10-13',0.00,0.00,'Paid','2026-09-28','September 2026','2026-09-28 00:29:22','2026-09-28 00:29:22',NULL,NULL,NULL,NULL),(13,'SS-REC-2026-00327',1,'Library & Sports Fee',8500.00,8500.00,'Cash Counter',NULL,'2026-10-13',0.00,0.00,'Paid','2026-09-28','September 2026','2026-09-28 00:30:34','2026-09-28 00:30:34',NULL,NULL,NULL,NULL),(14,'SS-REC-2026-09210',1,'Library & Sports Fee',8500.00,8500.00,'Cash Counter',NULL,'2026-10-13',0.00,0.00,'Paid','2026-09-28','September 2026','2026-09-28 00:30:48','2026-09-28 00:30:48',NULL,NULL,NULL,NULL),(15,'SS-REC-2026-06262',1,'Library & Sports Fee',8500.00,8500.00,'Cash Counter',NULL,'2026-10-13',0.00,0.00,'Paid','2026-09-28','September 2026','2026-09-28 00:34:01','2026-09-28 00:34:01',NULL,NULL,NULL,NULL),(16,'RZP-YTGRC4YP',9,'Tuition Fee (Quarterly)',12688.00,12688.00,'Razorpay Online Gateway',NULL,'2026-09-28',0.00,0.00,'Paid','2026-09-28','September 2026','2026-09-28 04:50:43','2026-09-28 04:50:43',NULL,'order_sim_5ac555176d84dd3b','pay_sim_eehytgrc4yp','2026-09-28 10:20:43'),(17,'RZP-068469E4',7,'Tuition Fee (Quarterly)',12500.00,12500.00,'Razorpay Online Gateway',NULL,'2026-10-13',0.00,0.00,'Paid',NULL,'September 2026','2026-09-28 10:21:35','2026-09-28 04:53:28',NULL,'order_sim_e77b874f4b12c57f','pay_sim_5ae5068469e4','2026-09-28 10:23:28'),(18,'SS-REC-2026-01396',7,'Tuition Fee (Quarterly)',12500.00,12500.00,'Cash Counter',NULL,'2026-10-13',0.00,0.00,'Paid','2026-09-28','September 2026','2026-09-28 04:53:10','2026-09-28 04:53:10',NULL,NULL,NULL,NULL),(19,'RZP-FS3MFLGR',7,'Tuition Fee (Quarterly)',12500.00,12688.00,'Razorpay Online Gateway',NULL,'2026-10-28',0.00,0.00,'Paid',NULL,'Term 2 2026','2026-09-28 10:23:41','2026-09-28 06:31:13',NULL,'order_sim_4c351c27bfc408ef','pay_sim_zabfs3mflgr','2026-09-28 12:01:13'),(20,'SS-REC-2026-09147',1,'Tuition Fee (Monthly)',2500.00,2500.00,'Cash Counter',NULL,'2026-10-13',0.00,0.00,'Paid','2026-09-28','September 2026','2026-09-28 05:13:48','2026-09-28 05:13:48',NULL,NULL,NULL,NULL),(21,'SS-REC-2026-04002',1,'Tuition Fee (Monthly)',2500.00,2500.00,'Cash Counter',NULL,'2026-10-13',0.00,0.00,'Paid','2026-09-28','September 2026','2026-09-28 05:14:38','2026-09-28 05:14:38',NULL,NULL,NULL,NULL),(22,'SS-REC-2026-02138',1,'Tuition Fee (Monthly)',2500.00,2500.00,'Cash Counter',NULL,'2026-10-13',0.00,0.00,'Paid','2026-09-28','September 2026','2026-09-28 07:10:41','2026-09-28 07:10:41',NULL,NULL,NULL,NULL),(23,'SS-REC-2026-09605',1,'Tuition Fee (Monthly)',2500.00,2500.00,'Cash Counter',NULL,'2026-10-13',0.00,0.00,'Paid','2026-09-28','September 2026','2026-09-28 07:28:54','2026-09-28 07:28:54',NULL,NULL,NULL,NULL),(24,'SS-REC-2026-06584',1,'Tuition Fee (Monthly)',2500.00,2500.00,'Cash Counter',NULL,'2026-10-14',0.00,0.00,'Paid','2026-09-29','September 2026','2026-09-28 23:55:23','2026-09-28 23:55:23',NULL,NULL,NULL,NULL),(25,'SS-REC-2026-08531',1,'Tuition Fee (Monthly)',2500.00,2500.00,'Cash Counter',NULL,'2026-10-14',0.00,0.00,'Paid','2026-09-29','September 2026','2026-09-29 00:22:54','2026-09-29 00:22:54',NULL,NULL,NULL,NULL),(26,'SS-REC-2026-00128',1,'Tuition Fee (Monthly)',2500.00,2500.00,'Cash Counter',NULL,'2026-10-14',0.00,0.00,'Paid','2026-09-29','September 2026','2026-09-29 00:26:19','2026-09-29 00:26:19',NULL,NULL,NULL,NULL),(27,'SS-REC-2026-09601',1,'Tuition Fee (Monthly)',2500.00,2500.00,'Cash Counter',NULL,'2026-10-14',0.00,0.00,'Paid','2026-09-29','September 2026','2026-09-29 00:44:06','2026-09-29 00:44:06',NULL,NULL,NULL,NULL),(28,'SS-REC-2026-07906',1,'Tuition Fee (Monthly)',2500.00,2500.00,'Cash Counter',NULL,'2026-10-14',0.00,0.00,'Paid','2026-09-29','September 2026','2026-09-29 00:58:55','2026-09-29 00:58:55',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `student_fees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_hostels`
--

DROP TABLE IF EXISTS `student_hostels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_hostels` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` bigint unsigned NOT NULL,
  `hostel_id` bigint unsigned NOT NULL,
  `room_id` bigint unsigned DEFAULT NULL,
  `join_date` date NOT NULL,
  `leave_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_hostels_student_id_foreign` (`student_id`),
  KEY `student_hostels_hostel_id_foreign` (`hostel_id`),
  KEY `student_hostels_room_id_foreign` (`room_id`),
  CONSTRAINT `student_hostels_hostel_id_foreign` FOREIGN KEY (`hostel_id`) REFERENCES `hostels` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_hostels_room_id_foreign` FOREIGN KEY (`room_id`) REFERENCES `hostel_rooms` (`id`) ON DELETE SET NULL,
  CONSTRAINT `student_hostels_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_hostels`
--

LOCK TABLES `student_hostels` WRITE;
/*!40000 ALTER TABLE `student_hostels` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_hostels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_notes`
--

DROP TABLE IF EXISTS `student_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_notes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` bigint unsigned NOT NULL,
  `added_by` bigint unsigned NOT NULL,
  `note` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'General',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_notes_student_id_foreign` (`student_id`),
  KEY `student_notes_added_by_foreign` (`added_by`),
  CONSTRAINT `student_notes_added_by_foreign` FOREIGN KEY (`added_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_notes_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_notes`
--

LOCK TABLES `student_notes` WRITE;
/*!40000 ALTER TABLE `student_notes` DISABLE KEYS */;
INSERT INTO `student_notes` VALUES (1,1,1,'Exemplary conduct and active leadership during science fair','Behavioural','2026-09-27 04:38:09','2026-09-27 04:38:09'),(2,1,1,'Exemplary conduct and active leadership during science fair','Behavioural','2026-09-27 04:39:27','2026-09-27 04:39:27'),(3,1,1,'Exemplary conduct and leadership','Merit','2026-09-27 04:48:28','2026-09-27 04:48:28'),(4,1,1,'Exemplary conduct and leadership','Merit','2026-09-27 04:51:27','2026-09-27 04:51:27'),(5,1,1,'Exemplary conduct and leadership','Merit','2026-09-27 04:51:54','2026-09-27 04:51:54'),(6,1,1,'Exemplary conduct and leadership','Merit','2026-09-27 04:52:23','2026-09-27 04:52:23'),(7,1,1,'Exemplary conduct and active leadership during science fair','Behavioural','2026-09-27 04:52:36','2026-09-27 04:52:36'),(8,1,1,'Exemplary conduct and leadership','Merit','2026-09-27 23:59:10','2026-09-27 23:59:10'),(9,1,1,'Exemplary conduct and leadership','Merit','2026-09-28 00:29:22','2026-09-28 00:29:22'),(10,1,1,'Exemplary conduct and leadership','Merit','2026-09-28 05:13:48','2026-09-28 05:13:48'),(11,1,1,'Exemplary conduct and leadership','Merit','2026-09-28 05:14:38','2026-09-28 05:14:38'),(12,1,1,'Exemplary conduct and leadership','Merit','2026-09-28 07:10:41','2026-09-28 07:10:41'),(13,1,1,'Exemplary conduct and leadership','Merit','2026-09-28 07:28:54','2026-09-28 07:28:54'),(14,1,1,'Exemplary conduct and leadership','Merit','2026-09-28 23:55:23','2026-09-28 23:55:23'),(15,1,1,'Exemplary conduct and leadership','Merit','2026-09-29 00:22:54','2026-09-29 00:22:54'),(16,1,1,'Exemplary conduct and leadership','Merit','2026-09-29 00:26:19','2026-09-29 00:26:19'),(17,1,1,'Exemplary conduct and leadership','Merit','2026-09-29 00:44:06','2026-09-29 00:44:06'),(18,1,1,'Exemplary conduct and leadership','Merit','2026-09-29 00:58:55','2026-09-29 00:58:55');
/*!40000 ALTER TABLE `student_notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_promotions`
--

DROP TABLE IF EXISTS `student_promotions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_promotions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` bigint unsigned NOT NULL,
  `from_class` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `from_section` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `to_class` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `to_section` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `academic_year` int NOT NULL,
  `result` enum('Promoted','Failed','Detained') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Promoted',
  `promoted_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_promotions_student_id_foreign` (`student_id`),
  KEY `student_promotions_promoted_by_foreign` (`promoted_by`),
  CONSTRAINT `student_promotions_promoted_by_foreign` FOREIGN KEY (`promoted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `student_promotions_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_promotions`
--

LOCK TABLES `student_promotions` WRITE;
/*!40000 ALTER TABLE `student_promotions` DISABLE KEYS */;
INSERT INTO `student_promotions` VALUES (1,1,'8','1','Class 10','A',2026,'Promoted',1,'2026-09-27 04:38:08','2026-09-27 04:38:08'),(2,1,'Class 10','A','Class 10','A',2026,'Promoted',1,'2026-09-27 04:39:27','2026-09-27 04:39:27'),(3,1,'Class 10','A','Class 10','A',2026,'Promoted',1,'2026-09-27 04:52:36','2026-09-27 04:52:36');
/*!40000 ALTER TABLE `student_promotions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_siblings`
--

DROP TABLE IF EXISTS `student_siblings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_siblings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` bigint unsigned NOT NULL,
  `sibling_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_siblings_student_id_foreign` (`student_id`),
  KEY `student_siblings_sibling_id_foreign` (`sibling_id`),
  CONSTRAINT `student_siblings_sibling_id_foreign` FOREIGN KEY (`sibling_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_siblings_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_siblings`
--

LOCK TABLES `student_siblings` WRITE;
/*!40000 ALTER TABLE `student_siblings` DISABLE KEYS */;
INSERT INTO `student_siblings` VALUES (1,1,2,NULL,NULL);
/*!40000 ALTER TABLE `student_siblings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_timelines`
--

DROP TABLE IF EXISTS `student_timelines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_timelines` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` bigint unsigned NOT NULL,
  `event` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `event_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_timelines_student_id_foreign` (`student_id`),
  CONSTRAINT `student_timelines_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_timelines`
--

LOCK TABLES `student_timelines` WRITE;
/*!40000 ALTER TABLE `student_timelines` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_timelines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_transports`
--

DROP TABLE IF EXISTS `student_transports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_transports` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` bigint unsigned NOT NULL,
  `route_id` bigint unsigned NOT NULL,
  `stop_id` bigint unsigned DEFAULT NULL,
  `academic_year` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_transports_student_id_foreign` (`student_id`),
  KEY `student_transports_route_id_foreign` (`route_id`),
  KEY `student_transports_stop_id_foreign` (`stop_id`),
  CONSTRAINT `student_transports_route_id_foreign` FOREIGN KEY (`route_id`) REFERENCES `transport_routes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_transports_stop_id_foreign` FOREIGN KEY (`stop_id`) REFERENCES `transport_stops` (`id`) ON DELETE SET NULL,
  CONSTRAINT `student_transports_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_transports`
--

LOCK TABLES `student_transports` WRITE;
/*!40000 ALTER TABLE `student_transports` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_transports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `admission_no` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dob` date DEFAULT NULL,
  `gender` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `blood_group` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `religion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `caste` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `admission_date` date DEFAULT NULL,
  `class_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `section_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `roll_no` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rte` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'No',
  `previous_school` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `previous_class` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `city` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pincode` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'India',
  `father_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `father_phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `father_occupation` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mother_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mother_phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mother_occupation` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guardian_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guardian_relation` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guardian_phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guardian_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `students_admission_no_unique` (`admission_no`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (1,'SS2025001','Aarav','Sharma','2012-05-15','Male','B+','Hindu','General',NULL,'2023-04-01','Class 10','A','12','No',NULL,NULL,'aarav.parent@email.com','9876543210','24 Park Street, Mullick Bazar','Kolkata','West Bengal','700016','India','Rajesh Sharma','9876543200','Engineer','Sunita Sharma','9876543201','Teacher',NULL,NULL,NULL,NULL,'active','2026-09-26 06:48:44','2026-09-29 00:58:55'),(2,'SS2025002','Priya','Singh',NULL,'Female',NULL,NULL,NULL,NULL,NULL,'11','2',NULL,'No',NULL,NULL,NULL,'9876543211','15/2 Gariahat Road, Ballygunge','Kolkata','West Bengal','700019','India',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active','2026-09-26 06:48:44','2026-09-26 06:48:44'),(7,'SS2026730','Rupam','Saha','2015-05-14','Male',NULL,NULL,NULL,NULL,NULL,'5','A','14','No',NULL,NULL,'rupamsaha@example.com','6291958861','88 VIP Road, Kankurgachi, Kolkata','Kolkata','West Bengal','700054','India','Braja Dulal Saha','9830112233','Business','Sikha Saha','9830445566','Homemaker',NULL,NULL,NULL,NULL,'active','2026-09-28 01:16:35','2026-09-29 00:41:02'),(8,'SS2026776','Subham ','Das','2015-05-29','Male',NULL,NULL,NULL,NULL,NULL,'5','A','24','No',NULL,NULL,'subhamdas@example.com','9087908790','102 Bidhan Sarani, Shyambazar','Kolkata','West Bengal','700004','India','Rajesh Das',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active','2026-09-28 03:25:08','2026-09-28 03:25:08'),(9,'SS2026464','Kaustab','Manna','2015-04-17','Male',NULL,NULL,NULL,NULL,NULL,'5','B','25','No',NULL,NULL,'kaustabmanna@example.com','8989897067','14 Prince Anwar Shah Road, Jadavpur','Kolkata','West Bengal','700032','India','Ramesh Manna',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active','2026-09-28 04:50:16','2026-09-28 04:50:16');
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subjects`
--

DROP TABLE IF EXISTS `subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subjects` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Theory',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subjects`
--

LOCK TABLES `subjects` WRITE;
/*!40000 ALTER TABLE `subjects` DISABLE KEYS */;
INSERT INTO `subjects` VALUES (1,'Mathematics','MATH101','Theory','2026-09-26 06:48:44','2026-09-26 06:48:44'),(2,'Science','SCI101','Theory','2026-09-26 06:48:44','2026-09-26 06:48:44'),(3,'Physics','PHY101','Practical','2026-09-26 06:48:44','2026-09-26 06:48:44'),(4,'Chemistry','CHEM101','Practical','2026-09-26 06:48:44','2026-09-26 06:48:44'),(5,'English','ENG101','Theory','2026-09-26 06:48:44','2026-09-26 06:48:44'),(6,'Hindi','HIN101','Theory','2026-09-26 06:48:44','2026-09-26 06:48:44'),(7,'Social Studies','SS101','Theory','2026-09-26 06:48:44','2026-09-26 06:48:44'),(8,'Computer Science','CS101','Practical','2026-09-26 06:48:44','2026-09-26 06:48:44'),(9,'Cloud Computing & Cyber Security','CS502','Practical & Lab','2026-09-28 01:12:26','2026-09-28 01:12:26');
/*!40000 ALTER TABLE `subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `timetables`
--

DROP TABLE IF EXISTS `timetables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `timetables` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `class_id` bigint unsigned NOT NULL,
  `section` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `day` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday') COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `subject_id` bigint unsigned NOT NULL,
  `teacher_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `room` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `timetables_class_id_foreign` (`class_id`),
  KEY `timetables_subject_id_foreign` (`subject_id`),
  CONSTRAINT `timetables_class_id_foreign` FOREIGN KEY (`class_id`) REFERENCES `school_classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `timetables_subject_id_foreign` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `timetables`
--

LOCK TABLES `timetables` WRITE;
/*!40000 ALTER TABLE `timetables` DISABLE KEYS */;
INSERT INTO `timetables` VALUES (1,1,'A','Monday','09:00:00','09:45:00',1,'Ms. Pooja Sen','Room 101','2026-09-28 01:45:40','2026-09-28 01:45:40');
/*!40000 ALTER TABLE `timetables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `type` enum('Income','Expense') COLLATE utf8mb4_unicode_ci NOT NULL,
  `accounts_head_id` bigint unsigned DEFAULT NULL,
  `head` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `date` date NOT NULL,
  `reference_no` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_mode` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Cash',
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `transactions_accounts_head_id_foreign` (`accounts_head_id`),
  CONSTRAINT `transactions_accounts_head_id_foreign` FOREIGN KEY (`accounts_head_id`) REFERENCES `accounts_heads` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
INSERT INTO `transactions` VALUES (1,'Income',NULL,'Tuition Fee',125000.00,'2026-09-01',NULL,'Cash','September fee collection','2026-09-26 06:48:44','2026-09-26 06:48:44'),(2,'Income',NULL,'Transport Fee',30000.00,'2026-09-01',NULL,'Cash','September transport fees','2026-09-26 06:48:44','2026-09-26 06:48:44'),(3,'Expense',NULL,'Electricity',15000.00,'2026-09-05',NULL,'Cash','August electricity bill','2026-09-26 06:48:44','2026-09-26 06:48:44'),(4,'Expense',NULL,'Staff Salary',450000.00,'2026-09-01',NULL,'Cash','September payroll','2026-09-26 06:48:44','2026-09-26 06:48:44'),(5,'Expense',NULL,'Maintenance',25000.00,'2026-09-10',NULL,'Cash','Lab equipment maintenance','2026-09-26 06:48:44','2026-09-26 06:48:44'),(6,'Income',NULL,'Quick Fee Collection',2500.00,'2026-09-27',NULL,'Cash','Quick Fee collection for Student #1','2026-09-27 04:38:09','2026-09-27 04:38:09'),(7,'Income',NULL,'Quick Fee Collection',2500.00,'2026-09-27',NULL,'Cash','Quick Fee collection for Student #1','2026-09-27 04:39:27','2026-09-27 04:39:27'),(8,'Income',NULL,'Tuition & Academic Fees',2500.00,'2026-09-27',NULL,'Cash','Quick Fee Collection: Tuition Fee (Monthly) for Aarav Sharma','2026-09-27 04:52:23','2026-09-27 04:52:23'),(9,'Income',NULL,'Quick Fee Collection',2500.00,'2026-09-27',NULL,'Cash','Quick Fee collection for Student #1','2026-09-27 04:52:36','2026-09-27 04:52:36'),(10,'Income',NULL,'Tuition & Academic Fees',2500.00,'2026-09-28',NULL,'Cash','Quick Fee Collection: Tuition Fee (Monthly) for Aarav Sharma','2026-09-27 23:59:10','2026-09-27 23:59:10'),(11,'Income',NULL,'Tuition & Academic Fees',2500.00,'2026-09-28',NULL,'Cash','Quick Fee Collection: Tuition Fee (Monthly) for Aarav Sharma','2026-09-28 00:29:22','2026-09-28 00:29:22'),(12,'Income',NULL,'Tuition & Academic Fees',8500.00,'2026-09-28',NULL,'Cash','Quick Fee Collection: Library & Sports Fee for Aarav Sharma','2026-09-28 00:30:34','2026-09-28 00:30:34'),(13,'Income',NULL,'Tuition & Academic Fees',8500.00,'2026-09-28',NULL,'Cash','Quick Fee Collection: Library & Sports Fee for Aarav Sharma','2026-09-28 00:30:48','2026-09-28 00:30:48'),(14,'Income',NULL,'Tuition & Academic Fees',8500.00,'2026-09-28',NULL,'Cash','Quick Fee Collection: Library & Sports Fee for Aarav Sharma','2026-09-28 00:34:01','2026-09-28 00:34:01'),(15,'Income',NULL,'Corporate Alumni Donation Fund',150000.00,'2026-09-28','TXN-699938D1','Bank Transfer','Campus Innovation Hub Expansion grant','2026-09-28 01:12:26','2026-09-28 01:12:26'),(16,'Income',NULL,'Online Fee Collection (Razorpay)',12500.00,'2026-09-28','RZP-77665544','Razorpay Online Gateway','Online fee payment for Aarav Sharma (SS2025001) via Razorpay Gateway. Payment ID: pay_sim_998877665544, Order ID: order_sim_b87ca4a0e16a9150','2026-09-28 04:04:56','2026-09-28 04:04:56'),(17,'Income',NULL,'Online Fee Collection (Razorpay)',5000.00,'2026-09-28','RZP-82734912','Razorpay Online Gateway','Online fee payment for Aarav Sharma (ADM-2024-001) via Razorpay Gateway. Payment ID: pay_sim_982734912, Order ID: order_sim_da9128a61f3d00a6','2026-09-28 04:26:21','2026-09-28 04:26:21'),(18,'Income',NULL,'Online Fee Collection (Razorpay)',12688.00,'2026-09-28','RZP-TFB7Z6WB','Razorpay Online Gateway','Online fee payment for Aarav Sharma (SS2025001) via Razorpay Gateway. Payment ID: pay_sim_rrqtfb7z6wb, Order ID: order_sim_f0c49c93fa60903e','2026-09-28 04:27:45','2026-09-28 04:27:45'),(19,'Income',NULL,'Online Fee Collection (Razorpay)',12688.00,'2026-09-28','RZP-VVXV84G4','Razorpay Online Gateway','Online fee payment for Aarav Sharma (SS2025001) via Razorpay Gateway. Payment ID: pay_sim_y6vvxv84g4, Order ID: order_sim_a060f006f7a1e3a5','2026-09-28 04:28:08','2026-09-28 04:28:08'),(20,'Income',NULL,'Tuition Fee (Quarterly)',12500.00,'2026-09-28','RCP-TEST-001','Cash','Test transaction for Rupam Saha','2026-09-28 04:47:14','2026-09-28 04:47:14'),(21,'Income',NULL,'Online Fee Collection (Razorpay)',12688.00,'2026-09-28','RZP-YTGRC4YP','Razorpay Online Gateway','Online fee payment for Kaustab Manna (SS2026464) via Razorpay Gateway. Payment ID: pay_sim_eehytgrc4yp, Order ID: order_sim_5ac555176d84dd3b','2026-09-28 04:50:43','2026-09-28 04:50:43'),(22,'Income',NULL,'Tuition & Academic Fees',12500.00,'2026-09-28',NULL,'Cash','Quick Fee Collection: Tuition Fee (Quarterly) for Rupam Saha','2026-09-28 04:53:10','2026-09-28 04:53:10'),(23,'Income',NULL,'Online Fee Collection (Razorpay)',12500.00,'2026-09-28','RZP-068469E4','Razorpay Online Gateway','Online fee payment for Rupam Saha (SS2026730) via Razorpay Gateway. Payment ID: pay_sim_5ae5068469e4, Order ID: order_sim_e77b874f4b12c57f','2026-09-28 04:53:28','2026-09-28 04:53:28'),(24,'Income',NULL,'Tuition & Academic Fees',2500.00,'2026-09-28',NULL,'Cash','Quick Fee Collection: Tuition Fee (Monthly) for Aarav Sharma','2026-09-28 05:13:48','2026-09-28 05:13:48'),(25,'Income',NULL,'Tuition & Academic Fees',2500.00,'2026-09-28',NULL,'Cash','Quick Fee Collection: Tuition Fee (Monthly) for Aarav Sharma','2026-09-28 05:14:38','2026-09-28 05:14:38'),(26,'Income',NULL,'Online Fee Collection (Razorpay)',12688.00,'2026-09-28','RZP-FS3MFLGR','Razorpay Online Gateway','Online fee payment for Rupam Saha (SS2026730) via Razorpay Gateway. Payment ID: pay_sim_zabfs3mflgr, Order ID: order_sim_4c351c27bfc408ef','2026-09-28 06:31:13','2026-09-28 06:31:13'),(27,'Income',NULL,'Tuition & Academic Fees',2500.00,'2026-09-28',NULL,'Cash','Quick Fee Collection: Tuition Fee (Monthly) for Aarav Sharma','2026-09-28 07:10:41','2026-09-28 07:10:41'),(28,'Income',NULL,'Tuition & Academic Fees',2500.00,'2026-09-28',NULL,'Cash','Quick Fee Collection: Tuition Fee (Monthly) for Aarav Sharma','2026-09-28 07:28:54','2026-09-28 07:28:54'),(29,'Income',NULL,'Tuition & Academic Fees',2500.00,'2026-09-29',NULL,'Cash','Quick Fee Collection: Tuition Fee (Monthly) for Aarav Sharma','2026-09-28 23:55:23','2026-09-28 23:55:23'),(30,'Income',NULL,'Tuition & Academic Fees',2500.00,'2026-09-29',NULL,'Cash','Quick Fee Collection: Tuition Fee (Monthly) for Aarav Sharma','2026-09-29 00:22:54','2026-09-29 00:22:54'),(31,'Income',NULL,'Tuition & Academic Fees',2500.00,'2026-09-29',NULL,'Cash','Quick Fee Collection: Tuition Fee (Monthly) for Aarav Sharma','2026-09-29 00:26:19','2026-09-29 00:26:19'),(32,'Income',NULL,'Tuition & Academic Fees',2500.00,'2026-09-29',NULL,'Cash','Quick Fee Collection: Tuition Fee (Monthly) for Aarav Sharma','2026-09-29 00:44:06','2026-09-29 00:44:06'),(33,'Income',NULL,'Tuition & Academic Fees',2500.00,'2026-09-29',NULL,'Cash','Quick Fee Collection: Tuition Fee (Monthly) for Aarav Sharma','2026-09-29 00:58:55','2026-09-29 00:58:55');
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transport_routes`
--

DROP TABLE IF EXISTS `transport_routes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transport_routes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `route_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicle_no` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `driver_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `driver_phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fare` decimal(8,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transport_routes`
--

LOCK TABLES `transport_routes` WRITE;
/*!40000 ALTER TABLE `transport_routes` DISABLE KEYS */;
INSERT INTO `transport_routes` VALUES (1,'Route 01: North Kolkata ΓÇö Shyambazar & Dum Dum Express','WB-02-EA-4521','Mr. Ramesh Ghosh','9876543220',1500.00,'2026-09-26 06:48:44','2026-09-26 06:48:44'),(2,'Route 02: South Kolkata ΓÇö Ballygunge & Gariahat Loop','WB-02-EA-6890','Mr. Subhash Mondal','9876543221',1800.00,'2026-09-26 06:48:44','2026-09-26 06:48:44'),(3,'Route 03: East Corridor ΓÇö Salt Lake Sector V & New Town Express','WB-04-EB-1204','Mr. Satish Banerjee','+91 98765 00000',2500.00,'2026-09-28 01:09:34','2026-09-28 01:09:34'),(4,'Route 04: Central & South-West ΓÇö Alipore & Behala Chowrasta','WB-01-EB-3310','Mr. Sanjoy Chatterjee','+91 98765 00000',2800.00,'2026-09-28 01:12:26','2026-09-28 01:12:26');
/*!40000 ALTER TABLE `transport_routes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transport_stops`
--

DROP TABLE IF EXISTS `transport_stops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transport_stops` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `route_id` bigint unsigned NOT NULL,
  `stop_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pickup_time` time DEFAULT NULL,
  `drop_time` time DEFAULT NULL,
  `order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `transport_stops_route_id_foreign` (`route_id`),
  CONSTRAINT `transport_stops_route_id_foreign` FOREIGN KEY (`route_id`) REFERENCES `transport_routes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transport_stops`
--

LOCK TABLES `transport_stops` WRITE;
/*!40000 ALTER TABLE `transport_stops` DISABLE KEYS */;
/*!40000 ALTER TABLE `transport_stops` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'admin',
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profile_photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `last_login_at` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `two_factor_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `two_factor_secret` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `two_factor_recovery_codes` json DEFAULT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Super Admin','super_admin','superadmin@smartschool.com',NULL,NULL,1,NULL,NULL,'$2y$12$ifwO7Q/lL4yNcWFp6qBkye.iBGOyJyU2bzA3qUtlq1EJo.GmfEXCq',0,NULL,NULL,NULL,'2026-09-26 06:48:40','2026-09-26 06:48:40'),(2,'Admin User','admin','admin@smartschool.com',NULL,NULL,1,NULL,NULL,'$2y$12$hRAmlK6vZpwIIJ3wnXaKLORFQBsn.tSA4tIfolQVlxUDxHUQjRC.m',0,NULL,NULL,NULL,'2026-09-26 06:48:41','2026-09-26 06:48:41'),(3,'Rajesh Sharma','teacher','teacher@smartschool.com','9876540001',NULL,1,NULL,NULL,'$2y$12$dTo1xCl.gKAvNP0AHIYekuxUWTBq5y4hhvwz6r2Jmc6OjoL44YPwC',0,NULL,NULL,NULL,'2026-09-26 06:48:41','2026-09-26 06:48:41'),(4,'Sunita Verma','accountant','accountant@smartschool.com',NULL,NULL,1,NULL,NULL,'$2y$12$TyfxqKGHCSeXSHHiup93AuXWDMLu5Kn4ld0bZF0jyg8A0xmuZAddC',0,NULL,NULL,NULL,'2026-09-26 06:48:41','2026-09-26 06:48:41'),(5,'Meena Patel','receptionist','receptionist@smartschool.com',NULL,NULL,1,NULL,NULL,'$2y$12$83OHRQb.YG6PLLnqR75Lnefy6PCUt2dwgS1cJ3dBTxnOdogKeT6Ii',0,NULL,NULL,NULL,'2026-09-26 06:48:42','2026-09-26 06:48:42'),(6,'Amit Kumar','librarian','librarian@smartschool.com',NULL,NULL,1,NULL,NULL,'$2y$12$UVqoxdo/e7o.Pswr1Akzc.ZKDkkQLMPD.AuqYqF4kjeVkV9rK7eA.',0,NULL,NULL,NULL,'2026-09-26 06:48:42','2026-09-26 06:48:42'),(7,'Rajesh Sharma (Parent)','parent','parent@smartschool.com',NULL,NULL,1,NULL,NULL,'$2y$12$7DwcveoKWJahN/OMpzAFu.6uuz6eIuINPM8J7LTQ1y35zpQMphL7K',0,NULL,NULL,NULL,'2026-09-26 06:48:42','2026-09-26 06:48:42'),(8,'Aarav Sharma','student','student@smartschool.com',NULL,NULL,1,NULL,NULL,'$2y$12$I9EBKEw9m3Bc4QLak.KiLO.0QKzabvdzgdX2URTdAjag1BddOUbmm',0,NULL,NULL,NULL,'2026-09-26 06:48:43','2026-09-26 06:48:43');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-29 11:59:29
