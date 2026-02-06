

--
-- Create database Student
--

DROP SCHEMA IF EXISTS `Student` ;
CREATE SCHEMA IF NOT EXISTS `Student` DEFAULT CHARACTER SET utf8 ;
USE `Student` ;

--
-- Table structure for table `student_info`
--

DROP TABLE IF EXISTS `student_info`;

/* CREATE TABLE `student_info` (
  `std_id` int NOT NULL AUTO_INCREMENT,
  `std_name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`std_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `teacher_info` (
  `teacher_id` int NOT NULL AUTO_INCREMENT,
  `teacher_name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`teacher_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `course_info` (
  `course_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `fees` int,
  PRIMARY KEY (`course_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `batch_info` (
  `count` int,
  `time` time DEFAULT NULL,
  `stu_id` int,
  `teacher_id` int,
  `course_id` int,
  FOREIGN KEY(stu_id) REFERENCES student_info(std_id),
  FOREIGN KEY(teacher_id) REFERENCES teacher_info(teacher_id),
  FOREIGN KEY(course_id) REFERENCES course_info(course_id)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `student_email_info` (
  `stu_id` int,
  `email` varchar(100) DEFAULT NULL,
  FOREIGN KEY(stu_id) REFERENCES student_info(std_id)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `teacher_email_info` (
  `teacher_id` int,
  `email` varchar(100) DEFAULT NULL,
  FOREIGN KEY(teacher_id) REFERENCES teacher_info(teacher_id)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `student_phone_info` (
  `stu_id` int,
  `phone` bigint,
  FOREIGN KEY(stu_id) REFERENCES student_info(std_id)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `teacher_phone_info` (
  `teacher_id` int,
  `phone` bigint,
  FOREIGN KEY(teacher_id) REFERENCES teacher_info(teacher_id)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci; */

 CREATE TABLE `user_info` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `is_student` boolean,
  `is_teacher` boolean,
  `name` varchar(200) NOT NULL,
  `email` varchar(200) DEFAULT NULL,
  `phone` varchar(15),
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci; 

CREATE TABLE `course_info` (
  `course_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(200) DEFAULT NULL,
  `fees` int,
   PRIMARY KEY (`course_id`),
   FOREIGN KEY(user_id) REFERENCES user_info(user_id)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci; 

CREATE TABLE `payment` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `amount` decimal(10, 2) NOT NULL,
  `due_date` date NOT NULL,
  `payment_date` date DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'Pending',
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY (`payment_id`),
   FOREIGN KEY(student_id) REFERENCES user_info(user_id) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci; 