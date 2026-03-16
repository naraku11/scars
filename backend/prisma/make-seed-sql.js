/**
 * UV SCARS — SQL Seed Generator
 *
 * Run locally:   node prisma/make-seed-sql.js
 * Output file:   prisma/seed.sql
 * Import at:     Hostinger hPanel → Databases → phpMyAdmin → select DB → Import
 *
 * This bypasses npm/node issues on shared hosting — just import the SQL file.
 */

import bcrypt from 'bcryptjs'
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

console.log('🔐 Hashing passwords...')
const COST = 10
const hAdmin     = bcrypt.hashSync('admin123',   COST)
const hOfficer   = bcrypt.hashSync('off123',     COST)
const hResponder = bcrypt.hashSync('resp123',    COST)
const hStudent   = bcrypt.hashSync('student123', COST)
console.log('✔  Passwords hashed')

// ── helpers ──────────────────────────────────────────────────────────────────
const esc  = (v) => String(v).replace(/'/g, "''")
const json = (v) => `'${esc(JSON.stringify(v))}'`
const dt   = (d) => `'${new Date(d).toISOString().slice(0, 19).replace('T', ' ')}'`
const bool = (b) => b ? 1 : 0

// ── SQL ───────────────────────────────────────────────────────────────────────
const sql = `-- ============================================================
--  UV SCARS — Database Seed
--  Generated: ${new Date().toISOString()}
--  Import via: phpMyAdmin → select database → Import tab
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ── Clear existing data (children first) ──────────────────────────────────────
DELETE FROM \`Notification\`;
DELETE FROM \`Incident\`;
DELETE FROM \`TeamMember\`;
DELETE FROM \`User\`;
DELETE FROM \`Team\`;
DELETE FROM \`Role\`;

-- ── Roles ─────────────────────────────────────────────────────────────────────
INSERT INTO \`Role\` (id, name, description, color, level, permissions) VALUES
  (1, 'Admin',     'Full system access',            '#dc3545', 1, ${json({ incidents: true,  response: true,  notifications: true,  reports: true,  admin: true  })}),
  (2, 'Officer',   'Campus security officer',        '#28a745', 2, ${json({ incidents: true,  response: true,  notifications: false, reports: true,  admin: false })}),
  (3, 'Responder', 'Handle incident responses',      '#2E7D32', 3, ${json({ incidents: true,  response: true,  notifications: true,  reports: false, admin: false })}),
  (4, 'Student',   'Student — can report incidents', '#0288D1', 4, ${json({ incidents: true,  response: false, notifications: false, reports: false, admin: false })});

-- ── Users ─────────────────────────────────────────────────────────────────────
INSERT INTO \`User\` (id, name, email, password, avatar, profileImage, status, joined, createdAt, updatedAt, roleId) VALUES
  (1, 'John Admin',      'admin@uv.edu.ph',            '${esc(hAdmin)}',     'JA', NULL, 'Active', ${dt('2024-01-15')}, NOW(), NOW(), 1),
  (2, 'Mike Officer',    'officer@uv.edu.ph',           '${esc(hOfficer)}',   'MO', NULL, 'Active', ${dt('2024-03-01')}, NOW(), NOW(), 2),
  (3, 'Sarah Responder', 'responder@uv.edu.ph',         '${esc(hResponder)}', 'SR', NULL, 'Active', ${dt('2024-02-20')}, NOW(), NOW(), 3),
  (4, 'Ana Santos',      'ana.santos@uv.edu.ph',        '${esc(hStudent)}',   'AS', NULL, 'Active', ${dt('2024-06-10')}, NOW(), NOW(), 4),
  (5, 'Carlo Reyes',     'carlo.reyes@uv.edu.ph',       '${esc(hStudent)}',   'CR', NULL, 'Active', ${dt('2024-06-10')}, NOW(), NOW(), 4),
  (6, 'Maria Cruz',      'maria.cruz@uv.edu.ph',        '${esc(hStudent)}',   'MC', NULL, 'Active', ${dt('2024-06-11')}, NOW(), NOW(), 4),
  (7, 'Jose Dela Torre', 'jose.delatorre@uv.edu.ph',    '${esc(hStudent)}',   'JD', NULL, 'Active', ${dt('2024-06-11')}, NOW(), NOW(), 4),
  (8, 'Lea Villanueva',  'lea.villanueva@uv.edu.ph',    '${esc(hStudent)}',   'LV', NULL, 'Active', ${dt('2024-06-12')}, NOW(), NOW(), 4);

-- ── Teams ─────────────────────────────────────────────────────────────────────
INSERT INTO \`Team\` (id, name, status, specialty) VALUES
  (1, 'Alpha Team', 'Available', 'General Security'),
  (2, 'Beta Team',  'On Duty',   'Medical Emergency'),
  (3, 'Delta Team', 'Available', 'Fire Safety');

-- ── Team Members ──────────────────────────────────────────────────────────────
INSERT INTO \`TeamMember\` (userId, teamId) VALUES
  (3, 1), (2, 1),   -- Alpha: Responder + Officer
  (2, 2),           -- Beta:  Officer
  (3, 3), (2, 3);   -- Delta: Responder + Officer

-- ── Incidents ─────────────────────────────────────────────────────────────────
INSERT INTO \`Incident\` (id, title, type, priority, location, description, status, validated, verified, media, createdAt, updatedAt, reportedById, assignedToId) VALUES
  (1,  'Suspicious Person in Library',   'Security',       'High',     'Main Library',          'A suspicious individual was seen loitering near the restricted archives.',         'Open',        ${bool(false)}, ${bool(false)}, '[]', ${dt('2024-12-01T09:00:00')}, NOW(), 2, 1),
  (2,  'Medical Emergency at Cafeteria', 'Medical',        'Critical', 'Main Cafeteria',         'Student collapsed after lunch. Possible allergic reaction.',                       'In Progress', ${bool(true)},  ${bool(true)},  '[]', ${dt('2024-12-02T12:15:00')}, NOW(), 2, 2),
  (3,  'Fire Alarm Triggered',           'Fire',           'Critical', 'Engineering Block B',    'Fire alarm activated on 2nd floor. Smoke detected near electrical room.',          'Resolved',    ${bool(true)},  ${bool(true)},  '[]', ${dt('2024-12-03T14:00:00')}, NOW(), 3, 3),
  (4,  'Vandalism Reported',             'Security',       'Low',      'Parking Lot C',          'Multiple vehicles had windows broken overnight.',                                  'Open',        ${bool(false)}, ${bool(false)}, '[]', ${dt('2024-12-04T08:00:00')}, NOW(), 2, NULL),
  (5,  'Power Outage',                   'Infrastructure', 'Medium',   'Admin Building',         'Power outage on 3rd floor affecting 5 offices.',                                  'In Progress', ${bool(true)},  ${bool(false)}, '[]', ${dt('2024-12-05T10:00:00')}, NOW(), 2, 1),
  (6,  'Flood in Basement',              'Infrastructure', 'High',     'Science Building',       'Water pipe burst in basement lab. Equipment at risk.',                             'Open',        ${bool(false)}, ${bool(false)}, '[]', ${dt('2024-12-06T07:30:00')}, NOW(), 2, NULL),
  (7,  'Theft Incident',                 'Security',       'Medium',   'Dormitory Block A',      'Laptop stolen from student room. Door lock reportedly tampered.',                  'Resolved',    ${bool(true)},  ${bool(true)},  '[]', ${dt('2024-11-28T16:00:00')}, NOW(), 2, 1),
  (8,  'Protest Gathering',              'Security',       'Medium',   'Central Plaza',          'Unauthorized student gathering blocking main entrance.',                           'In Progress', ${bool(true)},  ${bool(true)},  '[]', ${dt('2024-12-06T09:00:00')}, NOW(), 2, 2),
  (9,  'Broken Classroom Door Lock',     'Infrastructure', 'Low',      'Room 204, Main Bldg',   'Door lock broken, room cannot be secured after class.',                            'Open',        ${bool(false)}, ${bool(false)}, '[]', ${dt('2024-12-05T13:00:00')}, NOW(), 4, NULL),
  (10, 'Harassment Near Canteen',        'Security',       'High',     'North Canteen',          'Student reported verbal harassment by unidentified individual near canteen.',       'Open',        ${bool(false)}, ${bool(false)}, '[]', ${dt('2024-12-06T11:30:00')}, NOW(), 5, NULL),
  (11, 'Slip and Fall at Hallway',       'Medical',        'Medium',   'College of Eng. Bldg',  'Student slipped on wet floor due to roof leak. Minor injury sustained.',            'In Progress', ${bool(true)},  ${bool(false)}, '[]', ${dt('2024-12-07T08:45:00')}, NOW(), 6, 2);

-- ── Notifications ─────────────────────────────────────────────────────────────
INSERT INTO \`Notification\` (id, type, title, message, target, status, sentAt, sentById) VALUES
  (1, 'Web Push', 'Emergency Alert',    'Fire alarm at Engineering Block B. Evacuate immediately.',       'All',        'Sent', ${dt('2024-12-03T14:05:00')}, 1),
  (2, 'SMS',      'Incident Update',    'Medical emergency resolved at cafeteria. Area is clear.',        'Responders', 'Sent', ${dt('2024-12-02T13:00:00')}, 1),
  (3, 'Email',    'Weekly Report',      'Please find attached the weekly incident summary report.',       'Admin',      'Sent', ${dt('2024-12-01T08:00:00')}, 1),
  (4, 'Web Push', 'System Maintenance', 'System will be down for maintenance tonight at 11pm.',           'All',        'Sent', ${dt('2024-11-30T15:00:00')}, 1),
  (5, 'Web Push', 'Safety Reminder',    'Always report suspicious activity immediately via SCARS.',       'Students',   'Sent', ${dt('2024-12-06T08:00:00')}, 1);

-- ── System Config ─────────────────────────────────────────────────────────────
INSERT INTO \`SystemConfig\` (id, siteName, timezone, sessionTimeout, maxFileSize, alertEmail, logoImage)
VALUES (1, 'UV Toledo Campus — SCARS', 'UTC+8', 30, 10, 'admin@uv.edu.ph', '')
ON DUPLICATE KEY UPDATE id = 1;

-- ── Backup Config ─────────────────────────────────────────────────────────────
INSERT INTO \`BackupConfig\` (id, autoBackup, backupLocation, lastBackup, lastBackupStatus, retentionDays, schedule)
VALUES (1, 1, '/var/backups/scars', NOW(), 'Success', 30, ${json({ frequency: 'Daily', time: '02:00', retention: '30' })})
ON DUPLICATE KEY UPDATE id = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- ── Done ──────────────────────────────────────────────────────────────────────
-- Default accounts:
--   admin@uv.edu.ph     / admin123
--   officer@uv.edu.ph   / off123
--   responder@uv.edu.ph / resp123
--   ana.santos@uv.edu.ph / student123
-- Change all passwords after first login!
`

writeFileSync(join(__dirname, 'seed.sql'), sql)
console.log('✅  prisma/seed.sql written')
console.log('   Import it via: hPanel → Databases → phpMyAdmin → Import')
