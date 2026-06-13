-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: aio_dashboard
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `active_timers`
--

DROP TABLE IF EXISTS `active_timers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `active_timers` (
  `user_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `ticket_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `started_at` datetime NOT NULL,
  PRIMARY KEY (`user_id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `active_timers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `active_timers_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `active_timers`
--

LOCK TABLES `active_timers` WRITE;
/*!40000 ALTER TABLE `active_timers` DISABLE KEYS */;
/*!40000 ALTER TABLE `active_timers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activity`
--

DROP TABLE IF EXISTS `activity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` enum('status_change','priority_change','reassign','subject_change','type_change','comment','ticket_updated') NOT NULL,
  `content` text DEFAULT NULL,
  `old_value` varchar(100) DEFAULT NULL,
  `new_value` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `ticket_id` (`ticket_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `activity_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `activity_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity`
--

LOCK TABLES `activity` WRITE;
/*!40000 ALTER TABLE `activity` DISABLE KEYS */;
INSERT INTO `activity` VALUES (1,4,1,'status_change',NULL,NULL,'NEW','2026-03-17 19:12:15'),(2,4,1,'comment','фівфів',NULL,NULL,'2026-03-17 19:17:32'),(3,4,1,'status_change',NULL,NULL,'COMPLETED','2026-03-17 19:17:35'),(4,5,1,'status_change',NULL,NULL,'NEW','2026-03-17 19:36:37'),(5,5,1,'comment','іваіва',NULL,NULL,'2026-03-17 19:40:53'),(6,5,1,'status_change',NULL,NULL,'IN_PROGRESS','2026-03-17 19:40:59'),(7,6,1,'status_change',NULL,NULL,'NEW','2026-03-17 19:41:29'),(8,6,1,'','added 0 mins to time tracking',NULL,NULL,'2026-03-17 19:58:10'),(9,6,1,'','added 1 mins to time tracking',NULL,NULL,'2026-03-17 20:04:02'),(10,6,1,'','added 3 mins to time tracking',NULL,NULL,'2026-03-17 20:09:43'),(11,6,1,'status_change',NULL,'NEW','IN_PROGRESS','2026-03-17 20:09:59'),(12,6,1,'comment','Бугага працює',NULL,NULL,'2026-03-17 20:12:35'),(13,6,1,'status_change',NULL,'IN_PROGRESS','COMPLETED','2026-03-17 20:13:06'),(14,6,1,'','added 60 mins to time tracking (manual)',NULL,NULL,'2026-03-17 20:18:47'),(15,6,1,'','removed 60 mins to time tracking (manual)',NULL,NULL,'2026-03-17 20:18:57'),(16,6,1,'','added 600 mins to time tracking (manual)',NULL,NULL,'2026-03-17 20:21:57'),(17,7,1,'status_change',NULL,NULL,'NEW','2026-03-17 20:22:55'),(18,8,1,'status_change',NULL,NULL,'NEW','2026-03-17 20:38:10'),(19,9,1,'status_change',NULL,NULL,'NEW','2026-03-17 20:39:00'),(20,9,1,'status_change',NULL,'NEW','IN_PROGRESS','2026-03-17 20:52:07'),(21,9,1,'comment','фівфівфівф',NULL,NULL,'2026-03-17 20:52:07'),(22,9,1,'','added 0 mins to time tracking',NULL,NULL,'2026-03-17 20:52:18'),(23,9,1,'','added 90 mins to time tracking (manual)',NULL,NULL,'2026-03-17 20:52:27'),(24,9,1,'','removed 10 mins to time tracking (manual)',NULL,NULL,'2026-03-17 21:06:17'),(25,8,2,'comment','@bot1',NULL,NULL,'2026-03-18 18:05:09'),(26,8,1,'comment','Що?\n',NULL,NULL,'2026-03-18 18:06:03'),(27,8,1,'',NULL,'','HIGH','2026-03-18 20:34:02'),(28,9,1,'',NULL,'','NORMAL','2026-03-18 20:34:13'),(29,9,1,'comment','asd',NULL,NULL,'2026-03-18 20:34:29'),(30,9,1,'',NULL,'','NORMAL','2026-03-18 20:47:04'),(31,9,1,'',NULL,'NORMAL','HIGH','2026-03-18 20:49:02'),(32,9,1,'',NULL,'HIGH','NORMAL','2026-03-18 20:49:26'),(33,8,1,'',NULL,'HIGH','NORMAL','2026-03-18 20:49:37'),(34,8,1,'priority_change',NULL,'NORMAL','HIGH','2026-03-18 20:57:57'),(35,8,1,'priority_change',NULL,'HIGH','NORMAL','2026-03-18 20:58:01'),(36,9,1,'status_change',NULL,'IN_PROGRESS','COMPLETED','2026-03-18 21:05:55'),(37,8,1,'status_change',NULL,'NEW','IN_PROGRESS','2026-03-18 21:06:04'),(38,8,1,'comment','@bot1 ти де? \n',NULL,NULL,'2026-03-18 21:19:31'),(39,8,1,'comment','@bot2  працюєш?',NULL,NULL,'2026-03-18 21:33:46'),(40,9,1,'comment','@bot1 ',NULL,NULL,'2026-03-18 21:36:43'),(41,9,1,'comment','@bot1 ти де: ?',NULL,NULL,'2026-03-18 21:45:42'),(42,9,1,'','added 300 mins to time tracking (manual)',NULL,NULL,'2026-03-19 17:58:38'),(43,8,1,'','added 180 mins to time tracking (manual)',NULL,NULL,'2026-03-19 17:58:58'),(44,10,1,'status_change',NULL,NULL,'NEW','2026-03-19 19:12:49'),(45,9,1,'type_change',NULL,'Task','Feature','2026-03-19 19:24:13'),(46,9,1,'comment','ага',NULL,NULL,'2026-03-19 19:24:13'),(47,9,1,'type_change',NULL,'Feature','Support','2026-03-19 19:31:09'),(48,9,1,'comment','фів',NULL,NULL,'2026-03-19 19:31:09'),(49,9,1,'comment','цу',NULL,NULL,'2026-03-19 19:33:21'),(50,9,1,'type_change',NULL,'Support','Task','2026-03-19 19:33:37'),(51,9,1,'comment','йцу',NULL,NULL,'2026-03-19 19:33:37'),(52,10,1,'','added 0 mins to time tracking',NULL,NULL,'2026-03-20 10:01:18'),(53,10,1,'','added 240 mins to time tracking (manual)',NULL,NULL,'2026-03-20 10:01:28'),(54,9,1,'reassign',NULL,'1','2','2026-03-20 10:09:09'),(55,10,1,'','added 240 mins to time tracking (manual)',NULL,NULL,'2026-03-26 18:09:35'),(56,11,1,'status_change',NULL,NULL,'NEW','2026-03-26 18:22:56'),(57,11,1,'','added 480 mins to time tracking (manual)',NULL,NULL,'2026-03-26 18:23:07'),(58,12,4,'status_change',NULL,NULL,'NEW','2026-03-26 19:01:32'),(59,12,1,'comment','@maksim asd',NULL,NULL,'2026-03-26 19:20:53'),(60,12,4,'comment','@maksim hello',NULL,NULL,'2026-03-26 19:22:46');
/*!40000 ALTER TABLE `activity` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `actor_id` int(11) NOT NULL,
  `type` enum('mention','assignment','status_update') NOT NULL,
  `target_id` int(11) NOT NULL,
  `message` text DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `actor_id` (`actor_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,1,4,'mention',12,'Bot3 mentioned you in ticket: 123',0,'2026-03-26 19:22:46');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `projects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `client_name` varchar(150) DEFAULT NULL,
  `color` varchar(20) DEFAULT '#00f2fe',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES (1,'фів','фів','#00f2fe',0,'2026-03-17 18:44:11'),(2,'qweqweqwe','qweqweqwe','#00f2fe',0,'2026-03-17 18:45:09'),(3,'фівфівфів','фівфів','#00f2fe',0,'2026-03-17 19:17:23'),(4,'Maxim Mychko','фів','#00f2fe',0,'2026-03-17 19:23:39'),(5,'Maxim Mychko','фів','#10b981',0,'2026-03-17 19:36:14'),(6,'фівфів','фівфі','#00f2fe',1,'2026-03-17 19:41:15'),(7,'123123',NULL,'#f97316',1,'2026-03-17 20:38:20'),(8,'test',NULL,'#f97316',1,'2026-03-26 18:09:50');
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tickets`
--

DROP TABLE IF EXISTS `tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tickets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) DEFAULT NULL,
  `subject` varchar(255) NOT NULL,
  `body` text DEFAULT NULL,
  `status` enum('NEW','IN_PROGRESS','COMPLETED','CLOSED') DEFAULT 'NEW',
  `priority` enum('NORMAL','HIGH') DEFAULT 'NORMAL',
  `ticket_type` enum('Feature','Bug','Task','Support') DEFAULT 'Task',
  `created_by` int(11) NOT NULL,
  `assignee_id` int(11) DEFAULT NULL,
  `is_private` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `created_by` (`created_by`),
  KEY `assignee_id` (`assignee_id`),
  CONSTRAINT `tickets_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tickets_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `tickets_ibfk_3` FOREIGN KEY (`assignee_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tickets`
--

LOCK TABLES `tickets` WRITE;
/*!40000 ALTER TABLE `tickets` DISABLE KEYS */;
INSERT INTO `tickets` VALUES (4,2,'фів','фів','COMPLETED','NORMAL','Task',1,NULL,0,'2026-03-17 19:12:15','2026-03-17 19:17:35'),(5,5,'фів',NULL,'IN_PROGRESS','HIGH','Task',1,NULL,0,'2026-03-17 19:36:37','2026-03-17 19:40:53'),(6,6,'іваіва','іваіваіва','COMPLETED','HIGH','Task',1,NULL,0,'2026-03-17 19:41:29','2026-03-17 20:19:15'),(7,NULL,'фівфі',NULL,'NEW','NORMAL','Task',1,NULL,1,'2026-03-17 20:22:55','2026-03-17 20:22:55'),(8,6,'йцу123','123123','IN_PROGRESS','NORMAL','Bug',1,2,0,'2026-03-17 20:38:10','2026-03-18 21:33:46'),(9,7,'123123123',NULL,'COMPLETED','NORMAL','Task',1,2,0,'2026-03-17 20:39:00','2026-03-20 10:09:09'),(10,7,'аххаха','азазазаза','NEW','NORMAL','Bug',1,NULL,0,'2026-03-19 19:12:49','2026-03-19 19:12:49'),(11,8,'ТЕСТ1','ТЕСТ ТЕСТ ТСЕТ ТСЕТ','NEW','NORMAL','Bug',1,1,0,'2026-03-26 18:22:56','2026-03-26 18:22:56'),(12,NULL,'123','123','NEW','NORMAL','Task',4,1,0,'2026-03-26 19:01:32','2026-03-26 19:22:46');
/*!40000 ALTER TABLE `tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `time_entries`
--

DROP TABLE IF EXISTS `time_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `time_entries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `ticket_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime DEFAULT NULL,
  `duration_minutes` int(11) DEFAULT 0,
  `is_manual` tinyint(1) DEFAULT 0,
  `edited_by` int(11) DEFAULT NULL,
  `edited_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `project_id` (`project_id`),
  KEY `ticket_id` (`ticket_id`),
  KEY `edited_by` (`edited_by`),
  CONSTRAINT `time_entries_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `time_entries_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `time_entries_ibfk_3` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE SET NULL,
  CONSTRAINT `time_entries_ibfk_4` FOREIGN KEY (`edited_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `time_entries`
--

LOCK TABLES `time_entries` WRITE;
/*!40000 ALTER TABLE `time_entries` DISABLE KEYS */;
INSERT INTO `time_entries` VALUES (1,1,6,NULL,NULL,'2026-03-17 21:57:34','2026-03-17 21:57:39',0,0,NULL,NULL,'2026-03-17 19:57:39'),(2,1,6,6,NULL,'2026-03-17 21:57:54','2026-03-17 21:58:10',0,0,NULL,NULL,'2026-03-17 19:58:10'),(3,1,6,NULL,NULL,'2026-03-17 21:58:21','2026-03-17 21:58:24',0,0,NULL,NULL,'2026-03-17 19:58:24'),(4,1,6,6,NULL,'2026-03-17 22:02:59','2026-03-17 22:04:02',1,0,NULL,NULL,'2026-03-17 20:04:02'),(5,1,6,6,NULL,'2026-03-17 22:07:10','2026-03-17 22:09:43',3,0,NULL,NULL,'2026-03-17 20:09:43'),(6,1,6,6,'Manual addition','2026-03-17 22:18:47','2026-03-17 22:18:47',60,1,NULL,NULL,'2026-03-17 20:18:47'),(7,1,6,6,'Manual reduction','2026-03-17 22:18:57','2026-03-17 22:18:57',-60,1,NULL,NULL,'2026-03-17 20:18:57'),(8,1,6,6,'Manual addition','2026-03-17 22:21:57','2026-03-17 22:21:57',600,1,NULL,NULL,'2026-03-17 20:21:57'),(9,1,7,9,NULL,'2026-03-17 22:52:12','2026-03-17 22:52:18',0,0,NULL,NULL,'2026-03-17 20:52:18'),(10,1,7,9,'Manual addition','2026-03-17 22:52:27','2026-03-17 22:52:27',90,1,NULL,NULL,'2026-03-17 20:52:27'),(11,1,7,NULL,NULL,'2026-03-17 23:05:48','2026-03-17 23:05:56',0,0,NULL,NULL,'2026-03-17 21:05:56'),(12,1,7,9,'Manual reduction','2026-03-17 23:06:17','2026-03-17 23:06:17',-10,1,NULL,NULL,'2026-03-17 21:06:17'),(13,1,7,9,'Manual addition','2026-03-19 19:58:38','2026-03-19 19:58:38',300,1,NULL,NULL,'2026-03-19 17:58:38'),(14,1,6,8,'Manual addition','2026-03-19 19:58:58','2026-03-19 19:58:58',180,1,NULL,NULL,'2026-03-19 17:58:58'),(15,1,7,10,NULL,'2026-03-20 12:01:11','2026-03-20 12:01:18',0,0,NULL,NULL,'2026-03-20 10:01:18'),(16,1,7,10,'Manual addition','2026-03-20 12:01:28','2026-03-20 12:01:28',240,1,NULL,NULL,'2026-03-20 10:01:28'),(17,1,7,10,'Manual addition','2026-03-26 20:09:35','2026-03-26 20:09:35',240,1,NULL,NULL,'2026-03-26 18:09:35'),(18,1,8,11,'Manual addition','2026-03-26 20:23:07','2026-03-26 20:23:07',480,1,NULL,NULL,'2026-03-26 18:23:07');
/*!40000 ALTER TABLE `time_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `NAME` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `avatar_color` varchar(20) DEFAULT '#00f2fe',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `avatar_url` varchar(255) DEFAULT NULL,
  `status` enum('online','away','dnd','invisible') DEFAULT 'online',
  `role` enum('admin','user') DEFAULT 'user',
  `handle` varchar(50) DEFAULT NULL,
  `theme` varchar(20) DEFAULT 'dark',
  `font` varchar(50) DEFAULT 'Inter',
  `last_notifications_check` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `handle` (`handle`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Максим','maksimkamychko@gmail.com','$2b$10$UY3MnU.aABfztCUEoNwxsOAW0WipA/aZmk6LcGCGC3S5WB3hjR.C.','#3e8488ff','2026-03-17 19:04:19','http://localhost:3001/uploads/avatars/user_1_1773857557844.jpg','online','admin','maksim','midnight','Inter',NULL),(2,'Bot1','asdasdasd@gmail.com','$2b$10$pTEVzrl9BN/TpJgJHyVqQO8MXRVspNrng5jP5pF69a.bA24cN9giy','#00f2fe','2026-03-18 18:04:09',NULL,'online','user','bot1','dark','Inter',NULL),(3,'Bot2','qwerty@gmail.com','$2b$10$64P8sYqUa.Xg/WUe.28Ez.XcVzZpDHL6DJFxbZb7lK.fjepvsLLeu','#3e8488ff','2026-03-18 21:20:29',NULL,'online','user','bot2','dark','Inter',NULL),(4,'Bot3','asdasdasd1123@gmail.com','$2b$10$ovru9rH2jdorvXz3ejpNJ.0FrlX/JjEeX84q6AJ6jMN0ZZyKZZ6Ji','#00f2fe','2026-03-20 10:04:42',NULL,'online','user','bot3','dark','Inter',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'aio_dashboard'
--

--
-- Dumping routines for database 'aio_dashboard'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-13 18:47:31
