-- ============================================================
--  UV SCARS — Database Schema
--  Import via: phpMyAdmin → select u856082912_scars_db → Import
--  Run this ONCE before seeding.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ── Role ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `Role` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NOT NULL,
  `color`       VARCHAR(191) NOT NULL DEFAULT '#2E7D32',
  `level`       INT          NOT NULL DEFAULT 99,
  `permissions` JSON         NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Role_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── User ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `User` (
  `id`           INT          NOT NULL AUTO_INCREMENT,
  `name`         VARCHAR(191) NOT NULL,
  `email`        VARCHAR(191) NOT NULL,
  `password`     VARCHAR(191) NOT NULL,
  `avatar`       VARCHAR(191) NOT NULL,
  `profileImage` LONGTEXT,
  `status`       VARCHAR(191) NOT NULL DEFAULT 'Active',
  `joined`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`    DATETIME(3)  NOT NULL,
  `roleId`       INT          NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`),
  KEY `User_roleId_fkey` (`roleId`),
  CONSTRAINT `User_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Team ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `Team` (
  `id`        INT          NOT NULL AUTO_INCREMENT,
  `name`      VARCHAR(191) NOT NULL,
  `status`    VARCHAR(191) NOT NULL DEFAULT 'Available',
  `specialty` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Team_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── TeamMember ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `TeamMember` (
  `userId` INT NOT NULL,
  `teamId` INT NOT NULL,
  PRIMARY KEY (`userId`, `teamId`),
  KEY `TeamMember_teamId_fkey` (`teamId`),
  CONSTRAINT `TeamMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE,
  CONSTRAINT `TeamMember_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Incident ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `Incident` (
  `id`           INT          NOT NULL AUTO_INCREMENT,
  `title`        VARCHAR(191) NOT NULL,
  `type`         VARCHAR(191) NOT NULL,
  `priority`     VARCHAR(191) NOT NULL,
  `location`     VARCHAR(191) NOT NULL,
  `description`  TEXT         NOT NULL,
  `status`       VARCHAR(191) NOT NULL DEFAULT 'Open',
  `validated`    TINYINT(1)   NOT NULL DEFAULT 0,
  `verified`     TINYINT(1)   NOT NULL DEFAULT 0,
  `media`        JSON         NOT NULL DEFAULT (JSON_ARRAY()),
  `createdAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`    DATETIME(3)  NOT NULL,
  `reportedById` INT          NOT NULL,
  `assignedToId` INT,
  PRIMARY KEY (`id`),
  KEY `Incident_reportedById_fkey` (`reportedById`),
  KEY `Incident_assignedToId_fkey` (`assignedToId`),
  CONSTRAINT `Incident_reportedById_fkey` FOREIGN KEY (`reportedById`) REFERENCES `User` (`id`),
  CONSTRAINT `Incident_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `Team` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Notification ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `Notification` (
  `id`       INT          NOT NULL AUTO_INCREMENT,
  `type`     VARCHAR(191) NOT NULL,
  `title`    VARCHAR(191) NOT NULL,
  `message`  TEXT         NOT NULL,
  `target`   VARCHAR(191) NOT NULL,
  `status`   VARCHAR(191) NOT NULL DEFAULT 'Sent',
  `sentAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `sentById` INT          NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Notification_sentById_fkey` (`sentById`),
  CONSTRAINT `Notification_sentById_fkey` FOREIGN KEY (`sentById`) REFERENCES `User` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── BackupConfig ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `BackupConfig` (
  `id`               INT          NOT NULL DEFAULT 1,
  `autoBackup`       TINYINT(1)   NOT NULL DEFAULT 1,
  `backupLocation`   VARCHAR(191) NOT NULL DEFAULT '/var/backups/scars',
  `lastBackup`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `lastBackupStatus` VARCHAR(191) NOT NULL DEFAULT 'Success',
  `retentionDays`    INT          NOT NULL DEFAULT 30,
  `schedule`         JSON         NOT NULL DEFAULT (JSON_OBJECT('frequency','Daily','time','02:00','retention','30')),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── SystemConfig ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `SystemConfig` (
  `id`             INT          NOT NULL DEFAULT 1,
  `siteName`       VARCHAR(191) NOT NULL DEFAULT 'UV Toledo Campus — SCARS',
  `timezone`       VARCHAR(191) NOT NULL DEFAULT 'UTC+8',
  `sessionTimeout` INT          NOT NULL DEFAULT 30,
  `maxFileSize`    INT          NOT NULL DEFAULT 10,
  `alertEmail`     VARCHAR(191) NOT NULL DEFAULT 'admin@uv.edu.ph',
  `logoImage`      LONGTEXT     NOT NULL DEFAULT (''),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ── Done ──────────────────────────────────────────────────────────────────────
-- All tables created. Import seed.sql next to populate default data.
