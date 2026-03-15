import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding UV Toledo Campus SCARS database...')

  // ── Roles ──────────────────────────────────────────────────────────
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'Admin' },
      update: { level: 1 },
      create: {
        name: 'Admin', description: 'Full system access', color: '#dc3545', level: 1,
        permissions: { incidents: true, response: true, notifications: true, reports: true, admin: true },
      },
    }),
    prisma.role.upsert({
      where: { name: 'Officer' },
      update: { level: 2 },
      create: {
        name: 'Officer', description: 'Campus security officer', color: '#28a745', level: 2,
        permissions: { incidents: true, response: true, notifications: false, reports: true, admin: false },
      },
    }),
    prisma.role.upsert({
      where: { name: 'Responder' },
      update: { level: 3 },
      create: {
        name: 'Responder', description: 'Handle incident responses', color: '#2E7D32', level: 3,
        permissions: { incidents: true, response: true, notifications: true, reports: false, admin: false },
      },
    }),
    prisma.role.upsert({
      where: { name: 'Student' },
      update: { level: 4 },
      create: {
        name: 'Student', description: 'Student — can report incidents', color: '#0288D1', level: 4,
        permissions: { incidents: true, response: false, notifications: false, reports: false, admin: false },
      },
    }),
  ])
  console.log(`  ✔ ${roles.length} roles created`)

  // ── Users ──────────────────────────────────────────────────────────
  const adminRole     = roles.find(r => r.name === 'Admin')
  const officerRole   = roles.find(r => r.name === 'Officer')
  const responderRole = roles.find(r => r.name === 'Responder')
  const studentRole   = roles.find(r => r.name === 'Student')

  const usersData = [
    // Staff
    { name: 'John Admin',      email: 'admin@uv.edu.ph',     password: 'admin123', avatar: 'JA', roleId: adminRole.id,     joined: new Date('2024-01-15') },
    { name: 'Mike Officer',    email: 'officer@uv.edu.ph',   password: 'off123',   avatar: 'MO', roleId: officerRole.id,   joined: new Date('2024-03-01') },
    { name: 'Sarah Responder', email: 'responder@uv.edu.ph', password: 'resp123',  avatar: 'SR', roleId: responderRole.id, joined: new Date('2024-02-20') },
    // Students
    { name: 'Ana Santos',      email: 'ana.santos@uv.edu.ph',    password: 'student123', avatar: 'AS', roleId: studentRole.id,  joined: new Date('2024-06-10') },
    { name: 'Carlo Reyes',     email: 'carlo.reyes@uv.edu.ph',   password: 'student123', avatar: 'CR', roleId: studentRole.id,  joined: new Date('2024-06-10') },
    { name: 'Maria Cruz',      email: 'maria.cruz@uv.edu.ph',    password: 'student123', avatar: 'MC', roleId: studentRole.id,  joined: new Date('2024-06-11') },
    { name: 'Jose Dela Torre', email: 'jose.delatorre@uv.edu.ph',password: 'student123', avatar: 'JD', roleId: studentRole.id,  joined: new Date('2024-06-11') },
    { name: 'Lea Villanueva',  email: 'lea.villanueva@uv.edu.ph', password: 'student123', avatar: 'LV', roleId: studentRole.id, joined: new Date('2024-06-12') },
  ]

  const users = []
  for (const u of usersData) {
    const hashed = await bcrypt.hash(u.password, 10)
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password: hashed },
    })
    users.push(user)
  }
  console.log(`  ✔ ${users.length} users created`)

  const [admin, officer, responder, student1, student2, student3] = users

  // ── Teams ──────────────────────────────────────────────────────────
  const teamsData = [
    { name: 'Alpha Team', status: 'Available', specialty: 'General Security',  memberIds: [responder.id, officer.id] },
    { name: 'Beta Team',  status: 'On Duty',   specialty: 'Medical Emergency', memberIds: [officer.id] },
    { name: 'Delta Team', status: 'Available', specialty: 'Fire Safety',        memberIds: [responder.id, officer.id] },
  ]

  const teams = []
  for (const t of teamsData) {
    const { memberIds, ...data } = t
    const team = await prisma.team.upsert({
      where: { name: t.name },
      update: {},
      create: {
        ...data,
        members: { create: memberIds.map(userId => ({ userId })) },
      },
    })
    teams.push(team)
  }
  console.log(`  ✔ ${teams.length} teams created`)

  const [alpha, beta, delta] = teams

  // ── Incidents ──────────────────────────────────────────────────────
  await prisma.incident.deleteMany()
  const incidentsData = [
    { title: 'Suspicious Person in Library',    type: 'Security',       priority: 'High',     location: 'Main Library',         description: 'A suspicious individual was seen loitering near the restricted archives.',      status: 'Open',        validated: false, verified: false, reportedById: officer.id,   assignedToId: alpha.id,  createdAt: new Date('2024-12-01T09:00:00') },
    { title: 'Medical Emergency at Cafeteria',  type: 'Medical',        priority: 'Critical', location: 'Main Cafeteria',       description: 'Student collapsed after lunch. Possible allergic reaction.',                    status: 'In Progress', validated: true,  verified: true,  reportedById: officer.id,   assignedToId: beta.id,   createdAt: new Date('2024-12-02T12:15:00') },
    { title: 'Fire Alarm Triggered',            type: 'Fire',           priority: 'Critical', location: 'Engineering Block B',  description: 'Fire alarm activated on 2nd floor. Smoke detected near electrical room.',       status: 'Resolved',    validated: true,  verified: true,  reportedById: responder.id, assignedToId: delta.id,  createdAt: new Date('2024-12-03T14:00:00') },
    { title: 'Vandalism Reported',              type: 'Security',       priority: 'Low',      location: 'Parking Lot C',        description: 'Multiple vehicles had windows broken overnight.',                              status: 'Open',        validated: false, verified: false, reportedById: officer.id,   assignedToId: null,      createdAt: new Date('2024-12-04T08:00:00') },
    { title: 'Power Outage',                    type: 'Infrastructure', priority: 'Medium',   location: 'Admin Building',       description: 'Power outage on 3rd floor affecting 5 offices.',                              status: 'In Progress', validated: true,  verified: false, reportedById: officer.id,   assignedToId: alpha.id,  createdAt: new Date('2024-12-05T10:00:00') },
    { title: 'Flood in Basement',               type: 'Infrastructure', priority: 'High',     location: 'Science Building',     description: 'Water pipe burst in basement lab. Equipment at risk.',                         status: 'Open',        validated: false, verified: false, reportedById: officer.id,   assignedToId: null,      createdAt: new Date('2024-12-06T07:30:00') },
    { title: 'Theft Incident',                  type: 'Security',       priority: 'Medium',   location: 'Dormitory Block A',    description: 'Laptop stolen from student room. Door lock reportedly tampered.',               status: 'Resolved',    validated: true,  verified: true,  reportedById: officer.id,   assignedToId: alpha.id,  createdAt: new Date('2024-11-28T16:00:00') },
    { title: 'Protest Gathering',               type: 'Security',       priority: 'Medium',   location: 'Central Plaza',        description: 'Unauthorized student gathering blocking main entrance.',                       status: 'In Progress', validated: true,  verified: true,  reportedById: officer.id,   assignedToId: beta.id,   createdAt: new Date('2024-12-06T09:00:00') },
    // Student-reported incidents
    { title: 'Broken Classroom Door Lock',      type: 'Infrastructure', priority: 'Low',      location: 'Room 204, Main Bldg',  description: 'Door lock broken, room cannot be secured after class.',                        status: 'Open',        validated: false, verified: false, reportedById: student1.id,  assignedToId: null,      createdAt: new Date('2024-12-05T13:00:00') },
    { title: 'Harassment Near Canteen',         type: 'Security',       priority: 'High',     location: 'North Canteen',        description: 'Student reported verbal harassment by unidentified individual near canteen.',   status: 'Open',        validated: false, verified: false, reportedById: student2.id,  assignedToId: null,      createdAt: new Date('2024-12-06T11:30:00') },
    { title: 'Slip and Fall at Hallway',        type: 'Medical',        priority: 'Medium',   location: 'College of Eng. Bldg', description: 'Student slipped on wet floor due to roof leak. Minor injury sustained.',        status: 'In Progress', validated: true,  verified: false, reportedById: student3.id,  assignedToId: beta.id,   createdAt: new Date('2024-12-07T08:45:00') },
  ]

  for (const inc of incidentsData) {
    await prisma.incident.create({ data: { ...inc, media: [] } })
  }
  console.log(`  ✔ ${incidentsData.length} incidents created`)

  // ── Notifications ──────────────────────────────────────────────────
  await prisma.notification.deleteMany()
  const notifData = [
    { type: 'Web Push', title: 'Emergency Alert',    message: 'Fire alarm at Engineering Block B. Evacuate immediately.', target: 'All',        sentById: admin.id, sentAt: new Date('2024-12-03T14:05:00') },
    { type: 'SMS',      title: 'Incident Update',    message: 'Medical emergency resolved at cafeteria. Area is clear.',  target: 'Responders', sentById: admin.id, sentAt: new Date('2024-12-02T13:00:00') },
    { type: 'Email',    title: 'Weekly Report',      message: 'Please find attached the weekly incident summary report.', target: 'Admin',      sentById: admin.id, sentAt: new Date('2024-12-01T08:00:00') },
    { type: 'Web Push', title: 'System Maintenance', message: 'System will be down for maintenance tonight at 11pm.',     target: 'All',        sentById: admin.id, sentAt: new Date('2024-11-30T15:00:00') },
    { type: 'Web Push', title: 'Safety Reminder',    message: 'Always report suspicious activity immediately via SCARS.', target: 'Students',  sentById: admin.id, sentAt: new Date('2024-12-06T08:00:00') },
  ]

  for (const n of notifData) {
    await prisma.notification.create({ data: n })
  }
  console.log(`  ✔ ${notifData.length} notifications created`)

  // ── Backup Config & System Config ──────────────────────────────────
  await prisma.backupConfig.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } })
  await prisma.systemConfig.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } })
  console.log('  ✔ System config and backup config initialized')

  console.log('\n✅ Seeding complete!')
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
