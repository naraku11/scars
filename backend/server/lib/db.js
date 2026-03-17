import 'dotenv/config'
import mysql from 'mysql2/promise'

function getConfig() {
  const user     = process.env.MYSQL_USER     || 'root'
  const password = process.env.MYSQL_PASSWORD || ''
  const database = process.env.MYSQL_DATABASE || 'scars_db'
  const socket   = process.env.MYSQL_SOCKET

  // Unix socket connection — required on Hostinger shared hosting
  if (socket) {
    return { socketPath: socket, user, password, database }
  }

  // TCP connection — local dev (XAMPP) or explicit host override
  return {
    host:     process.env.MYSQL_HOST || '127.0.0.1',
    port:     Number(process.env.MYSQL_PORT) || 3306,
    user, password, database,
  }
}

const pool = mysql.createPool({
  ...getConfig(),
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
})

export default pool

// ── Shared SELECT fragments ──────────────────────────────────────────────────

export const USER_ROLE_SELECT = `
  SELECT u.id, u.name, u.email, u.password, u.avatar, u.profileImage,
         u.phone, u.status, u.joined, u.createdAt, u.updatedAt, u.roleId,
         r.id AS role_id, r.name AS role_name, r.description AS role_desc,
         r.color AS role_color, r.level AS role_level, r.permissions AS role_perms
  FROM User u
  INNER JOIN Role r ON u.roleId = r.id`

export const INCIDENT_SELECT = `
  SELECT i.id, i.title, i.type, i.priority, i.location, i.description,
         i.status, i.validated, i.verified, i.media,
         i.createdAt, i.updatedAt, i.reportedById, i.assignedToId,
         rb.id AS rb_id, rb.name AS rb_name, rb.avatar AS rb_avatar,
         t.id AS t_id, t.name AS t_name, t.status AS t_status, t.specialty AS t_specialty
  FROM Incident i
  INNER JOIN User rb ON i.reportedById = rb.id
  LEFT JOIN Team t ON i.assignedToId = t.id`

// ── Helpers ──────────────────────────────────────────────────────────────────

export function parseJson(v) {
  if (v == null) return v
  if (typeof v === 'object') return v
  try { return JSON.parse(v) } catch { return null }
}

export const bool = (v) => v === 1 || v === true

// ── Row mappers ──────────────────────────────────────────────────────────────

export function mapUser(row) {
  if (!row?.id) return null
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar,
    profileImage: row.profileImage ?? null,
    phone: row.phone ?? null,
    status: row.status,
    joined: row.joined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    roleId: row.roleId,
    role: row.role_id != null ? {
      id: row.role_id,
      name: row.role_name,
      description: row.role_desc,
      color: row.role_color,
      level: row.role_level,
      permissions: parseJson(row.role_perms),
    } : undefined,
  }
}

export function mapIncident(row) {
  if (!row?.id) return null
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    priority: row.priority,
    location: row.location,
    description: row.description,
    status: row.status,
    validated: bool(row.validated),
    verified: bool(row.verified),
    media: parseJson(row.media) ?? [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    reportedById: row.reportedById,
    assignedToId: row.assignedToId ?? null,
    reportedBy: { id: row.rb_id, name: row.rb_name, avatar: row.rb_avatar },
    assignedTo: row.t_id != null ? {
      id: row.t_id,
      name: row.t_name,
      status: row.t_status,
      specialty: row.t_specialty,
    } : null,
  }
}

export function mapNotification(row) {
  if (!row?.id) return null
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    target: row.target,
    status: row.status,
    sentAt: row.sentAt,
    sentById: row.sentById,
    sentBy: row.sb_id != null ? { id: row.sb_id, name: row.sb_name, avatar: row.sb_avatar } : undefined,
  }
}
