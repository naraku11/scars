export const mockUsers = [
  { id: 1,  name: 'John Admin',       email: 'admin@uv.edu.ph',          password: 'admin123',   role: 'Admin',     roleId: 1, status: 'Active', avatar: 'JA', joined: '2024-01-15' },
  { id: 2,  name: 'Mike Officer',     email: 'officer@uv.edu.ph',        password: 'off123',     role: 'Officer',   roleId: 2, status: 'Active', avatar: 'MO', joined: '2024-03-01' },
  { id: 3,  name: 'Sarah Responder',  email: 'responder@uv.edu.ph',      password: 'resp123',    role: 'Responder', roleId: 3, status: 'Active', avatar: 'SR', joined: '2024-02-20' },
  { id: 4,  name: 'Ana Santos',       email: 'ana.santos@uv.edu.ph',     password: 'student123', role: 'Student',   roleId: 4, status: 'Active', avatar: 'AS', joined: '2024-06-10' },
  { id: 5,  name: 'Carlo Reyes',      email: 'carlo.reyes@uv.edu.ph',    password: 'student123', role: 'Student',   roleId: 4, status: 'Active', avatar: 'CR', joined: '2024-06-10' },
  { id: 6,  name: 'Maria Cruz',       email: 'maria.cruz@uv.edu.ph',     password: 'student123', role: 'Student',   roleId: 4, status: 'Active', avatar: 'MC', joined: '2024-06-11' },
  { id: 7,  name: 'Jose Dela Torre',  email: 'jose.delatorre@uv.edu.ph', password: 'student123', role: 'Student',   roleId: 4, status: 'Active', avatar: 'JD', joined: '2024-06-11' },
  { id: 8,  name: 'Lea Villanueva',   email: 'lea.villanueva@uv.edu.ph', password: 'student123', role: 'Student',   roleId: 4, status: 'Active', avatar: 'LV', joined: '2024-06-12' },
]

export const mockRoles = [
  { id: 1, name: 'Admin',     description: 'Full system access',             color: '#dc3545', level: 1, permissions: { incidents: true,  response: true,  notifications: true,  reports: true,  admin: true  } },
  { id: 2, name: 'Officer',   description: 'Campus security officer',        color: '#28a745', level: 2, permissions: { incidents: true,  response: true,  notifications: false, reports: true,  admin: false } },
  { id: 3, name: 'Responder', description: 'Handle incident responses',      color: '#2E7D32', level: 3, permissions: { incidents: true,  response: true,  notifications: true,  reports: false, admin: false } },
  { id: 4, name: 'Student',   description: 'Student — can report incidents', color: '#0288D1', level: 4, permissions: { incidents: true,  response: false, notifications: false, reports: false, admin: false } },
]

export const mockTeams = [
  { id: 1, name: 'Alpha Team', members: [2, 3], status: 'Available', specialty: 'General Security' },
  { id: 2, name: 'Beta Team',  members: [2],    status: 'On Duty',   specialty: 'Medical Emergency' },
  { id: 3, name: 'Delta Team', members: [2, 3], status: 'Available', specialty: 'Fire Safety' },
]

export const mockIncidents = [
  { id: 1,  title: 'Suspicious Person in Library',  type: 'Security',       priority: 'High',     location: 'Main Library',         description: 'A suspicious individual was seen loitering near the restricted archives. Staff reported unusual behavior.', status: 'Open',        reportedBy: 2, assignedTo: 1,    media: [], createdAt: '2024-12-01T09:00:00', updatedAt: '2024-12-01T09:30:00', validated: false, verified: false },
  { id: 2,  title: 'Medical Emergency at Cafeteria', type: 'Medical',       priority: 'Critical', location: 'Main Cafeteria',       description: 'Student collapsed after lunch. Possible allergic reaction. Paramedics called.',                          status: 'In Progress', reportedBy: 2, assignedTo: 2,    media: [], createdAt: '2024-12-02T12:15:00', updatedAt: '2024-12-02T12:20:00', validated: true,  verified: true  },
  { id: 3,  title: 'Fire Alarm Triggered',           type: 'Fire',          priority: 'Critical', location: 'Engineering Block B',  description: 'Fire alarm activated on 2nd floor. Smoke detected near electrical room.',                               status: 'Resolved',    reportedBy: 3, assignedTo: 3,    media: [], createdAt: '2024-12-03T14:00:00', updatedAt: '2024-12-03T15:30:00', validated: true,  verified: true  },
  { id: 4,  title: 'Vandalism Reported',             type: 'Security',      priority: 'Low',      location: 'Parking Lot C',        description: 'Multiple vehicles had windows broken overnight. CCTV footage requested.',                               status: 'Open',        reportedBy: 2, assignedTo: null, media: [], createdAt: '2024-12-04T08:00:00', updatedAt: '2024-12-04T08:00:00', validated: false, verified: false },
  { id: 5,  title: 'Power Outage',                   type: 'Infrastructure',priority: 'Medium',   location: 'Admin Building',       description: 'Power outage on 3rd floor affecting 5 offices. Generator not responding.',                               status: 'In Progress', reportedBy: 2, assignedTo: 1,    media: [], createdAt: '2024-12-05T10:00:00', updatedAt: '2024-12-05T10:30:00', validated: true,  verified: false },
  { id: 6,  title: 'Flood in Basement',              type: 'Infrastructure',priority: 'High',     location: 'Science Building',     description: 'Water pipe burst in basement lab. Equipment at risk.',                                                   status: 'Open',        reportedBy: 2, assignedTo: null, media: [], createdAt: '2024-12-06T07:30:00', updatedAt: '2024-12-06T07:30:00', validated: false, verified: false },
  { id: 7,  title: 'Theft Incident',                 type: 'Security',      priority: 'Medium',   location: 'Dormitory Block A',    description: 'Laptop stolen from student room. Door lock reportedly tampered.',                                        status: 'Resolved',    reportedBy: 2, assignedTo: 1,    media: [], createdAt: '2024-11-28T16:00:00', updatedAt: '2024-11-29T11:00:00', validated: true,  verified: true  },
  { id: 8,  title: 'Protest Gathering',              type: 'Security',      priority: 'Medium',   location: 'Central Plaza',        description: 'Unauthorized student gathering blocking main entrance.',                                                 status: 'In Progress', reportedBy: 2, assignedTo: 2,    media: [], createdAt: '2024-12-06T09:00:00', updatedAt: '2024-12-06T09:30:00', validated: true,  verified: true  },
  { id: 9,  title: 'Broken Classroom Door Lock',     type: 'Infrastructure',priority: 'Low',      location: 'Room 204, Main Bldg',  description: 'Door lock broken, room cannot be secured after class.',                                                  status: 'Open',        reportedBy: 4, assignedTo: null, media: [], createdAt: '2024-12-05T13:00:00', updatedAt: '2024-12-05T13:00:00', validated: false, verified: false },
  { id: 10, title: 'Harassment Near Canteen',        type: 'Security',      priority: 'High',     location: 'North Canteen',        description: 'Student reported verbal harassment by unidentified individual near canteen.',                             status: 'Open',        reportedBy: 5, assignedTo: null, media: [], createdAt: '2024-12-06T11:30:00', updatedAt: '2024-12-06T11:30:00', validated: false, verified: false },
  { id: 11, title: 'Slip and Fall at Hallway',       type: 'Medical',       priority: 'Medium',   location: 'College of Eng. Bldg', description: 'Student slipped on wet floor due to roof leak. Minor injury sustained.',                                  status: 'In Progress', reportedBy: 6, assignedTo: 2,    media: [], createdAt: '2024-12-07T08:45:00', updatedAt: '2024-12-07T08:50:00', validated: true,  verified: false },
]

export const mockNotifications = [
  { id: 1, type: 'Web Push', title: 'Emergency Alert', message: 'Fire alarm at Engineering Block B. Evacuate immediately.', target: 'All', sentBy: 1, sentAt: '2024-12-03T14:05:00', status: 'Sent' },
  { id: 2, type: 'SMS', title: 'Incident Update', message: 'Medical emergency resolved at cafeteria. Area is clear.', target: 'Responders', sentBy: 1, sentAt: '2024-12-02T13:00:00', status: 'Sent' },
  { id: 3, type: 'Email', title: 'Weekly Report', message: 'Please find attached the weekly incident summary report.', target: 'Admin', sentBy: 1, sentAt: '2024-12-01T08:00:00', status: 'Sent' },
  { id: 4, type: 'Web Push', title: 'System Maintenance', message: 'System will be down for maintenance tonight at 11pm.',     target: 'All',      sentBy: 1, sentAt: '2024-11-30T15:00:00', status: 'Sent' },
  { id: 5, type: 'Web Push', title: 'Safety Reminder',    message: 'Always report suspicious activity immediately via SCARS.', target: 'Students', sentBy: 1, sentAt: '2024-12-06T08:00:00', status: 'Sent' },
]

export const mockBackupConfig = {
  autoBackup: true,
  backupLocation: '/var/backups/scars',
  lastBackup: '2024-12-06T02:00:00',
  lastBackupStatus: 'Success',
  retentionDays: 30,
  schedule: {
    frequency: 'Daily',
    time: '02:00',
    retention: '30',
  },
}
