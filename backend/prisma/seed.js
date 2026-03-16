import 'dotenv/config'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'

const { DATABASE_URL = 'mysql://root:@localhost:3306/scars_db' } = process.env

function parseDbUrl(urlStr) {
  const u = new URL(urlStr)
  return {
    host: u.hostname,
    port: Number(u.port) || 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.slice(1),
  }
}

async function main() {
  console.log('🌱 Seeding UV Toledo Campus SCARS database...')

  const conn = await mysql.createConnection({ ...parseDbUrl(DATABASE_URL), multipleStatements: true })

  // ── Roles ──────────────────────────────────────────────────────────────────
  const rolesData = [
    { name: 'Admin',     description: 'Full system access',          color: '#dc3545', level: 1, permissions: { incidents: true,  response: true,  notifications: true,  reports: true,  admin: true  } },
    { name: 'Officer',   description: 'Campus security officer',      color: '#28a745', level: 2, permissions: { incidents: true,  response: true,  notifications: false, reports: true,  admin: false } },
    { name: 'Responder', description: 'Handle incident responses',    color: '#2E7D32', level: 3, permissions: { incidents: true,  response: true,  notifications: true,  reports: false, admin: false } },
    { name: 'Student',   description: 'Student — can report incidents', color: '#0288D1', level: 4, permissions: { incidents: true,  response: false, notifications: false, reports: false, admin: false } },
  ]

  for (const r of rolesData) {
    await conn.execute(
      `INSERT INTO Role (name, description, color, level, permissions)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE level = VALUES(level)`,
      [r.name, r.description, r.color, r.level, JSON.stringify(r.permissions)]
    )
  }
  const [roleRows] = await conn.execute('SELECT id, name FROM Role')
  const roleMap = Object.fromEntries(roleRows.map(r => [r.name, r.id]))
  console.log(`  ✔ ${rolesData.length} roles created`)

  // ── Users ──────────────────────────────────────────────────────────────────
  const usersData = [
    { name: 'John Admin',      email: 'admin@uv.edu.ph',              password: 'admin123',   avatar: 'JA', role: 'Admin',     joined: '2024-01-15' },
    { name: 'Mike Officer',    email: 'officer@uv.edu.ph',            password: 'off123',     avatar: 'MO', role: 'Officer',   joined: '2024-03-01' },
    { name: 'Sarah Responder', email: 'responder@uv.edu.ph',          password: 'resp123',    avatar: 'SR', role: 'Responder', joined: '2024-02-20' },
    { name: 'Ana Santos',      email: 'ana.santos@uv.edu.ph',         password: 'student123', avatar: 'AS', role: 'Student',   joined: '2024-06-10' },
    { name: 'Carlo Reyes',     email: 'carlo.reyes@uv.edu.ph',        password: 'student123', avatar: 'CR', role: 'Student',   joined: '2024-06-10' },
    { name: 'Maria Cruz',      email: 'maria.cruz@uv.edu.ph',         password: 'student123', avatar: 'MC', role: 'Student',   joined: '2024-06-11' },
    { name: 'Jose Dela Torre', email: 'jose.delatorre@uv.edu.ph',     password: 'student123', avatar: 'JD', role: 'Student',   joined: '2024-06-11' },
    { name: 'Lea Villanueva',  email: 'lea.villanueva@uv.edu.ph',     password: 'student123', avatar: 'LV', role: 'Student',   joined: '2024-06-12' },
  ]

  for (const u of usersData) {
    const hashed = await bcrypt.hash(u.password, 10)
    await conn.execute(
      `INSERT INTO User (name, email, password, avatar, roleId, joined)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [u.name, u.email, hashed, u.avatar, roleMap[u.role], new Date(u.joined)]
    )
  }
  const [userRows] = await conn.execute('SELECT id, email FROM User')
  const userMap = Object.fromEntries(userRows.map(u => [u.email, u.id]))
  console.log(`  ✔ ${usersData.length} users created`)

  const adminId     = userMap['admin@uv.edu.ph']
  const officerId   = userMap['officer@uv.edu.ph']
  const responderId = userMap['responder@uv.edu.ph']
  const student1Id  = userMap['ana.santos@uv.edu.ph']
  const student2Id  = userMap['carlo.reyes@uv.edu.ph']
  const student3Id  = userMap['maria.cruz@uv.edu.ph']

  // ── Teams ──────────────────────────────────────────────────────────────────
  const teamsData = [
    { name: 'Alpha Team', status: 'Available', specialty: 'General Security',  members: [responderId, officerId] },
    { name: 'Beta Team',  status: 'On Duty',   specialty: 'Medical Emergency', members: [officerId] },
    { name: 'Delta Team', status: 'Available', specialty: 'Fire Safety',        members: [responderId, officerId] },
  ]

  for (const t of teamsData) {
    await conn.execute(
      `INSERT INTO Team (name, status, specialty)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [t.name, t.status, t.specialty]
    )
  }
  const [teamRows] = await conn.execute('SELECT id, name FROM Team')
  const teamMap = Object.fromEntries(teamRows.map(t => [t.name, t.id]))

  for (const t of teamsData) {
    const teamId = teamMap[t.name]
    await conn.execute('DELETE FROM TeamMember WHERE teamId = ?', [teamId])
    for (const userId of t.members) {
      await conn.execute(
        'INSERT IGNORE INTO TeamMember (userId, teamId) VALUES (?, ?)',
        [userId, teamId]
      )
    }
  }
  console.log(`  ✔ ${teamsData.length} teams created`)

  const alphaId = teamMap['Alpha Team']
  const betaId  = teamMap['Beta Team']
  const deltaId = teamMap['Delta Team']

  // ── Incidents ──────────────────────────────────────────────────────────────
  await conn.execute('DELETE FROM Incident')
  const incidentsData = [
    { title: 'Suspicious Person in Library',    type: 'Security',       priority: 'High',     location: 'Main Library',         description: 'A suspicious individual was seen loitering near the restricted archives.',      status: 'Open',        validated: 0, verified: 0, reportedById: officerId,   assignedToId: alphaId, createdAt: '2024-12-01 09:00:00' },
    { title: 'Medical Emergency at Cafeteria',  type: 'Medical',        priority: 'Critical', location: 'Main Cafeteria',       description: 'Student collapsed after lunch. Possible allergic reaction.',                    status: 'In Progress', validated: 1, verified: 1, reportedById: officerId,   assignedToId: betaId,  createdAt: '2024-12-02 12:15:00' },
    { title: 'Fire Alarm Triggered',            type: 'Fire',           priority: 'Critical', location: 'Engineering Block B',  description: 'Fire alarm activated on 2nd floor. Smoke detected near electrical room.',       status: 'Resolved',    validated: 1, verified: 1, reportedById: responderId, assignedToId: deltaId, createdAt: '2024-12-03 14:00:00' },
    { title: 'Vandalism Reported',              type: 'Security',       priority: 'Low',      location: 'Parking Lot C',        description: 'Multiple vehicles had windows broken overnight.',                              status: 'Open',        validated: 0, verified: 0, reportedById: officerId,   assignedToId: null,    createdAt: '2024-12-04 08:00:00' },
    { title: 'Power Outage',                    type: 'Infrastructure', priority: 'Medium',   location: 'Admin Building',       description: 'Power outage on 3rd floor affecting 5 offices.',                              status: 'In Progress', validated: 1, verified: 0, reportedById: officerId,   assignedToId: alphaId, createdAt: '2024-12-05 10:00:00' },
    { title: 'Flood in Basement',               type: 'Infrastructure', priority: 'High',     location: 'Science Building',     description: 'Water pipe burst in basement lab. Equipment at risk.',                         status: 'Open',        validated: 0, verified: 0, reportedById: officerId,   assignedToId: null,    createdAt: '2024-12-06 07:30:00' },
    { title: 'Theft Incident',                  type: 'Security',       priority: 'Medium',   location: 'Dormitory Block A',    description: 'Laptop stolen from student room. Door lock reportedly tampered.',               status: 'Resolved',    validated: 1, verified: 1, reportedById: officerId,   assignedToId: alphaId, createdAt: '2024-11-28 16:00:00' },
    { title: 'Protest Gathering',               type: 'Security',       priority: 'Medium',   location: 'Central Plaza',        description: 'Unauthorized student gathering blocking main entrance.',                       status: 'In Progress', validated: 1, verified: 1, reportedById: officerId,   assignedToId: betaId,  createdAt: '2024-12-06 09:00:00' },
    { title: 'Broken Classroom Door Lock',      type: 'Infrastructure', priority: 'Low',      location: 'Room 204, Main Bldg',  description: 'Door lock broken, room cannot be secured after class.',                        status: 'Open',        validated: 0, verified: 0, reportedById: student1Id,  assignedToId: null,    createdAt: '2024-12-05 13:00:00' },
    { title: 'Harassment Near Canteen',         type: 'Security',       priority: 'High',     location: 'North Canteen',        description: 'Student reported verbal harassment by unidentified individual near canteen.',   status: 'Open',        validated: 0, verified: 0, reportedById: student2Id,  assignedToId: null,    createdAt: '2024-12-06 11:30:00' },
    { title: 'Slip and Fall at Hallway',        type: 'Medical',        priority: 'Medium',   location: 'College of Eng. Bldg', description: 'Student slipped on wet floor due to roof leak. Minor injury sustained.',        status: 'In Progress', validated: 1, verified: 0, reportedById: student3Id,  assignedToId: betaId,  createdAt: '2024-12-07 08:45:00' },
  ]

  for (const inc of incidentsData) {
    await conn.execute(
      `INSERT INTO Incident (title, type, priority, location, description, status, validated, verified, media, reportedById, assignedToId, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, '[]', ?, ?, ?)`,
      [inc.title, inc.type, inc.priority, inc.location, inc.description, inc.status, inc.validated, inc.verified, inc.reportedById, inc.assignedToId, new Date(inc.createdAt)]
    )
  }
  console.log(`  ✔ ${incidentsData.length} incidents created`)

  // ── Notifications ──────────────────────────────────────────────────────────
  await conn.execute('DELETE FROM Notification')
  const notifData = [
    { type: 'Web Push', title: 'Emergency Alert',    message: 'Fire alarm at Engineering Block B. Evacuate immediately.', target: 'All',        sentById: adminId, sentAt: '2024-12-03 14:05:00' },
    { type: 'SMS',      title: 'Incident Update',    message: 'Medical emergency resolved at cafeteria. Area is clear.',  target: 'Responders', sentById: adminId, sentAt: '2024-12-02 13:00:00' },
    { type: 'Email',    title: 'Weekly Report',      message: 'Please find attached the weekly incident summary report.', target: 'Admin',      sentById: adminId, sentAt: '2024-12-01 08:00:00' },
    { type: 'Web Push', title: 'System Maintenance', message: 'System will be down for maintenance tonight at 11pm.',     target: 'All',        sentById: adminId, sentAt: '2024-11-30 15:00:00' },
    { type: 'Web Push', title: 'Safety Reminder',    message: 'Always report suspicious activity immediately via SCARS.', target: 'Students',  sentById: adminId, sentAt: '2024-12-06 08:00:00' },
  ]

  for (const n of notifData) {
    await conn.execute(
      'INSERT INTO Notification (type, title, message, target, sentById, sentAt) VALUES (?, ?, ?, ?, ?, ?)',
      [n.type, n.title, n.message, n.target, n.sentById, new Date(n.sentAt)]
    )
  }
  console.log(`  ✔ ${notifData.length} notifications created`)

  // ── System & Backup config ─────────────────────────────────────────────────
  await conn.execute(
    `INSERT IGNORE INTO SystemConfig (id) VALUES (1)`
  )
  await conn.execute(
    `INSERT IGNORE INTO BackupConfig (id) VALUES (1)`
  )
  console.log('  ✔ System config and backup config initialized')

  await conn.end()
  console.log('\n✅ Seeding complete!')
}

main().catch(e => { console.error('❌ Seed failed:', e); process.exit(1) })
