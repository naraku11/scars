-- ============================================================
--  UV SCARS — Database Seed
--  Generated: 2026-03-16T09:41:51.481Z
--  Import via: phpMyAdmin → select database → Import tab
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ── Clear existing data (children first) ──────────────────────────────────────
DELETE FROM `Notification`;
DELETE FROM `Incident`;
DELETE FROM `TeamMember`;
DELETE FROM `User`;
DELETE FROM `Team`;
DELETE FROM `Role`;

-- ── Roles ─────────────────────────────────────────────────────────────────────
INSERT INTO `Role` (id, name, description, color, level, permissions) VALUES
  (1, 'Admin',     'Full system access',            '#dc3545', 1, '{"incidents":true,"response":true,"notifications":true,"reports":true,"admin":true}'),
  (2, 'Officer',   'Campus security officer',        '#28a745', 2, '{"incidents":true,"response":true,"notifications":false,"reports":true,"admin":false}'),
  (3, 'Responder', 'Handle incident responses',      '#2E7D32', 3, '{"incidents":true,"response":true,"notifications":true,"reports":false,"admin":false}'),
  (4, 'Student',   'Student — can report incidents', '#0288D1', 4, '{"incidents":true,"response":false,"notifications":false,"reports":false,"admin":false}');

-- ── Users ─────────────────────────────────────────────────────────────────────
INSERT INTO `User` (id, name, email, password, avatar, profileImage, status, joined, createdAt, updatedAt, roleId) VALUES
  (1, 'John Admin',      'admin@uv.edu.ph',            '$2b$10$wbNlNyPu.sVJKeXCbGsDcuZFOTH8MAbDHmVNrveHZ3pfznb8qX9vG',     'JA', NULL, 'Active', '2024-01-15 00:00:00', NOW(), NOW(), 1),
  (2, 'Mike Officer',    'officer@uv.edu.ph',           '$2b$10$MtnkT2aT0G8G7iavO4I2o.Jp557QTAX9wsrLiOhLzcpXjONTDEhhC',   'MO', NULL, 'Active', '2024-03-01 00:00:00', NOW(), NOW(), 2),
  (3, 'Sarah Responder', 'responder@uv.edu.ph',         '$2b$10$vNp5cykTyWsWAwzKmhK7Qen/piu85m4M8uPBcBvI.091fK7RIeJhe', 'SR', NULL, 'Active', '2024-02-20 00:00:00', NOW(), NOW(), 3),
  (4, 'Ana Santos',      'ana.santos@uv.edu.ph',        '$2b$10$j30KL6aoREvHtUuMxgJvGeJO8cx.uyRh/utRnxDQJ005Gwc8/CdiC',   'AS', NULL, 'Active', '2024-06-10 00:00:00', NOW(), NOW(), 4),
  (5, 'Carlo Reyes',     'carlo.reyes@uv.edu.ph',       '$2b$10$j30KL6aoREvHtUuMxgJvGeJO8cx.uyRh/utRnxDQJ005Gwc8/CdiC',   'CR', NULL, 'Active', '2024-06-10 00:00:00', NOW(), NOW(), 4),
  (6, 'Maria Cruz',      'maria.cruz@uv.edu.ph',        '$2b$10$j30KL6aoREvHtUuMxgJvGeJO8cx.uyRh/utRnxDQJ005Gwc8/CdiC',   'MC', NULL, 'Active', '2024-06-11 00:00:00', NOW(), NOW(), 4),
  (7, 'Jose Dela Torre', 'jose.delatorre@uv.edu.ph',    '$2b$10$j30KL6aoREvHtUuMxgJvGeJO8cx.uyRh/utRnxDQJ005Gwc8/CdiC',   'JD', NULL, 'Active', '2024-06-11 00:00:00', NOW(), NOW(), 4),
  (8, 'Lea Villanueva',  'lea.villanueva@uv.edu.ph',    '$2b$10$j30KL6aoREvHtUuMxgJvGeJO8cx.uyRh/utRnxDQJ005Gwc8/CdiC',   'LV', NULL, 'Active', '2024-06-12 00:00:00', NOW(), NOW(), 4);

-- ── Teams ─────────────────────────────────────────────────────────────────────
INSERT INTO `Team` (id, name, status, specialty) VALUES
  (1, 'Alpha Team', 'Available', 'General Security'),
  (2, 'Beta Team',  'On Duty',   'Medical Emergency'),
  (3, 'Delta Team', 'Available', 'Fire Safety');

-- ── Team Members ──────────────────────────────────────────────────────────────
INSERT INTO `TeamMember` (userId, teamId) VALUES
  (3, 1), (2, 1),   -- Alpha: Responder + Officer
  (2, 2),           -- Beta:  Officer
  (3, 3), (2, 3);   -- Delta: Responder + Officer

-- ── Incidents ─────────────────────────────────────────────────────────────────
INSERT INTO `Incident` (id, title, type, priority, location, description, status, validated, verified, media, createdAt, updatedAt, reportedById, assignedToId) VALUES
  (1,  'Suspicious Person in Library',   'Security',       'High',     'Main Library',          'A suspicious individual was seen loitering near the restricted archives.',         'Open',        0, 0, '[]', '2024-12-01 01:00:00', NOW(), 2, 1),
  (2,  'Medical Emergency at Cafeteria', 'Medical',        'Critical', 'Main Cafeteria',         'Student collapsed after lunch. Possible allergic reaction.',                       'In Progress', 1,  1,  '[]', '2024-12-02 04:15:00', NOW(), 2, 2),
  (3,  'Fire Alarm Triggered',           'Fire',           'Critical', 'Engineering Block B',    'Fire alarm activated on 2nd floor. Smoke detected near electrical room.',          'Resolved',    1,  1,  '[]', '2024-12-03 06:00:00', NOW(), 3, 3),
  (4,  'Vandalism Reported',             'Security',       'Low',      'Parking Lot C',          'Multiple vehicles had windows broken overnight.',                                  'Open',        0, 0, '[]', '2024-12-04 00:00:00', NOW(), 2, NULL),
  (5,  'Power Outage',                   'Infrastructure', 'Medium',   'Admin Building',         'Power outage on 3rd floor affecting 5 offices.',                                  'In Progress', 1,  0, '[]', '2024-12-05 02:00:00', NOW(), 2, 1),
  (6,  'Flood in Basement',              'Infrastructure', 'High',     'Science Building',       'Water pipe burst in basement lab. Equipment at risk.',                             'Open',        0, 0, '[]', '2024-12-05 23:30:00', NOW(), 2, NULL),
  (7,  'Theft Incident',                 'Security',       'Medium',   'Dormitory Block A',      'Laptop stolen from student room. Door lock reportedly tampered.',                  'Resolved',    1,  1,  '[]', '2024-11-28 08:00:00', NOW(), 2, 1),
  (8,  'Protest Gathering',              'Security',       'Medium',   'Central Plaza',          'Unauthorized student gathering blocking main entrance.',                           'In Progress', 1,  1,  '[]', '2024-12-06 01:00:00', NOW(), 2, 2),
  (9,  'Broken Classroom Door Lock',     'Infrastructure', 'Low',      'Room 204, Main Bldg',   'Door lock broken, room cannot be secured after class.',                            'Open',        0, 0, '[]', '2024-12-05 05:00:00', NOW(), 4, NULL),
  (10, 'Harassment Near Canteen',        'Security',       'High',     'North Canteen',          'Student reported verbal harassment by unidentified individual near canteen.',       'Open',        0, 0, '[]', '2024-12-06 03:30:00', NOW(), 5, NULL),
  (11, 'Slip and Fall at Hallway',       'Medical',        'Medium',   'College of Eng. Bldg',  'Student slipped on wet floor due to roof leak. Minor injury sustained.',            'In Progress', 1,  0, '[]', '2024-12-07 00:45:00', NOW(), 6, 2);

-- ── Notifications ─────────────────────────────────────────────────────────────
INSERT INTO `Notification` (id, type, title, message, target, status, sentAt, sentById) VALUES
  (1, 'Web Push', 'Emergency Alert',    'Fire alarm at Engineering Block B. Evacuate immediately.',       'All',        'Sent', '2024-12-03 06:05:00', 1),
  (2, 'SMS',      'Incident Update',    'Medical emergency resolved at cafeteria. Area is clear.',        'Responders', 'Sent', '2024-12-02 05:00:00', 1),
  (3, 'Email',    'Weekly Report',      'Please find attached the weekly incident summary report.',       'Admin',      'Sent', '2024-12-01 00:00:00', 1),
  (4, 'Web Push', 'System Maintenance', 'System will be down for maintenance tonight at 11pm.',           'All',        'Sent', '2024-11-30 07:00:00', 1),
  (5, 'Web Push', 'Safety Reminder',    'Always report suspicious activity immediately via SCARS.',       'Students',   'Sent', '2024-12-06 00:00:00', 1);

-- ── System Config ─────────────────────────────────────────────────────────────
INSERT INTO `SystemConfig` (id, siteName, timezone, sessionTimeout, maxFileSize, alertEmail, logoImage)
VALUES (1, 'UV Toledo Campus — SCARS', 'UTC+8', 30, 10, 'admin@uv.edu.ph', '')
ON DUPLICATE KEY UPDATE id = 1;

-- ── Backup Config ─────────────────────────────────────────────────────────────
INSERT INTO `BackupConfig` (id, autoBackup, backupLocation, lastBackup, lastBackupStatus, retentionDays, schedule)
VALUES (1, 1, '/var/backups/scars', NOW(), 'Success', 30, '{"frequency":"Daily","time":"02:00","retention":"30"}')
ON DUPLICATE KEY UPDATE id = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- ── Done ──────────────────────────────────────────────────────────────────────
-- Default accounts:
--   admin@uv.edu.ph     / admin123
--   officer@uv.edu.ph   / off123
--   responder@uv.edu.ph / resp123
--   ana.santos@uv.edu.ph / student123
-- Change all passwords after first login!
