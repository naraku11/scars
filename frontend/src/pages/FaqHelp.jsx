import { useState } from 'react'
import {
  HelpCircle, ChevronDown, ChevronUp, Shield, AlertTriangle,
  Users, Bell, FileText, Phone, Mail, BookOpen
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import Header from '../components/Header'
import p from '../components/Page.module.css'

const roleName = (u) => typeof u?.role === 'object' ? u?.role?.name ?? '' : (u?.role ?? '')

// roles: which roles see this section. Admin always sees everything.
const FAQ_SECTIONS = [
  {
    title: 'General',
    icon: BookOpen,
    roles: ['Student', 'Officer', 'Responder', 'Admin'],
    items: [
      {
        q: 'What is SCARS?',
        a: 'SCARS (Smart Campus Alert & Response System) is a campus safety incident management system for UV Toledo Campus. It allows students to report incidents, officers to validate and assign response teams, and responders to handle emergencies in real-time.',
      },
      {
        q: 'How do I log in?',
        a: 'Go to the SCARS login page and enter your registered email and password. You will be automatically directed to the dashboard for your assigned role.',
      },
      {
        q: 'How do I change my password?',
        a: 'Click your account avatar in the top-right corner of any page and select "My Profile". You can update your password, name, email, and profile photo from there.',
      },
    ],
  },
  {
    title: 'Reporting Incidents',
    icon: AlertTriangle,
    roles: ['Student'],
    items: [
      {
        q: 'How do I report an incident?',
        a: 'From your Student Dashboard, click the "Report Now" button. Fill in the incident title, type, priority level, location, and a detailed description. Click "Submit Report" when done. Campus security will be notified immediately.',
      },
      {
        q: 'What types of incidents can I report?',
        a: 'You can report: Fire, Medical emergencies, Security threats, Theft, Accidents, Natural Disasters, Vandalism, and Other incidents.',
      },
      {
        q: 'What priority levels are available?',
        a: 'There are four priority levels:\n- Critical: Immediate life-threatening danger\n- High: Serious threat requiring urgent response\n- Medium: Significant but not immediately dangerous\n- Low: Minor issues that need attention',
      },
      {
        q: 'Can I track the status of my report?',
        a: 'Yes. Your Student Dashboard shows all your submitted reports with real-time status updates: Open (pending review), In Progress (being handled), and Resolved (completed).',
      },
      {
        q: 'What happens after I submit a report?',
        a: 'Your report is instantly visible to Officers and Admins. An Officer will validate the report, verify it, and assign a response team. You will see the status change in real-time on your dashboard.',
      },
    ],
  },
  {
    title: 'Incident Management',
    icon: Shield,
    roles: ['Officer', 'Admin'],
    items: [
      {
        q: 'What does "Validate" mean?',
        a: 'Validation is the first step in processing a report. Confirm the incident is legitimate and requires attention by clicking the "Validate" button.',
      },
      {
        q: 'What does "Verify" mean?',
        a: 'After validation, verification confirms the incident details are accurate. This is the second approval step before a response team can be assigned.',
      },
      {
        q: 'How do I assign a response team?',
        a: 'After validating and verifying an incident, select a team from the dropdown in the "Assign" column and click "Assign". The incident status will update and the response team will be notified.',
      },
      {
        q: 'Can I send alerts to the campus?',
        a: 'Yes. Use the "Quick Alert" section on your Officer Dashboard to send notifications. Choose the alert type, write the title and message, select the target audience, and click "Send Alert".',
      },
      {
        q: 'How do I reject an incident?',
        a: 'After validating an incident, if the report is found to be inaccurate or a false alarm, click the "Reject" button. The incident status will change to "Rejected" and will be moved out of the active queue.',
      },
    ],
  },
  {
    title: 'Response Management',
    icon: Users,
    roles: ['Responder', 'Admin'],
    items: [
      {
        q: 'How do I see incidents assigned to my team?',
        a: 'Your Responder Dashboard automatically shows all incidents assigned to your team under "Assigned Incidents". You can also see all recent campus reports in the "All Recent Reports" section.',
      },
      {
        q: 'Why is the incident status read-only on my dashboard?',
        a: 'As a Responder, incident status is managed by Officers and Admins through the Response Management page. Your dashboard is view-only so you can monitor your assigned tasks.',
      },
      {
        q: 'Why can\'t I mark an incident as Resolved?',
        a: 'An incident can only be resolved when it has been validated, verified, and assigned to a team. All three conditions must be met before the "Resolved" status becomes available.',
      },
      {
        q: 'What if I\'m not assigned to any team?',
        a: 'Contact your supervising Officer or Admin. They can assign you to a response team through the Response Management page.',
      },
    ],
  },
  {
    title: 'Teams & Assignments',
    icon: Users,
    roles: ['Admin', 'Officer'],
    items: [
      {
        q: 'How does team status work?',
        a: 'Team status is dynamic. A team automatically shows "On Duty" when it has active incidents assigned to it. When all incidents are resolved or reassigned, the status returns to its configured value (Available or Inactive).',
      },
      {
        q: 'How do I create or edit a team?',
        a: 'Go to Response Management → Teams → Manage Teams. Click "New Team" to create one, or the edit icon next to an existing team. You can set the team name, specialty, status, and assign members.',
      },
      {
        q: 'How do I assign an incident to a team?',
        a: 'In Response Management → Assignments → Unassigned, click "Assign to [Team Name]" on any incident card. You can also use "Auto Assign All" to distribute all unassigned incidents across available teams.',
      },
    ],
  },
  {
    title: 'Notifications & Alerts',
    icon: Bell,
    roles: ['Student', 'Officer', 'Responder', 'Admin'],
    items: [
      {
        q: 'Where can I see my notifications?',
        a: 'Click the bell icon in the top-right corner of any page. A dropdown shows all recent notifications. Clicking a notification takes you directly to the relevant page.',
      },
      {
        q: 'What are incident alerts in the bell panel?',
        a: 'When a new incident is reported, Officers and Admins receive an instant in-app alert in the bell dropdown. The alert shows the incident type, location, and priority. Clicking it navigates to Incident Management.',
      },
      {
        q: 'Are there sound alerts?',
        a: 'Yes. When a new incident is created, Officers and Admins hear an audio alert. The sound differs by priority — Critical plays an urgent triple tone, High plays a double tone, and lower priorities play a single tone.',
      },
      {
        q: 'How do I send a notification to the campus?',
        a: 'Admins can use the Notification System page. Officers can use the "Quick Alert" panel on their dashboard. You can target All users, or specific groups: Students, Responders, or Officers.',
      },
    ],
  },
  {
    title: 'Reports & Analytics',
    icon: FileText,
    roles: ['Admin', 'Officer'],
    items: [
      {
        q: 'What data is shown in reports?',
        a: 'The Reporting & Analytics page shows Critical and High priority incidents. It includes overview KPIs, incident charts (by type, status, priority, location, trend), response team metrics, and a data export feature.',
      },
      {
        q: 'Can I export incident data?',
        a: 'Yes. Go to Reporting & Analytics → Export tab. Filter by date range, type, status, and priority, then download the data as a CSV file.',
      },
    ],
  },
  {
    title: 'System Administration',
    icon: Shield,
    roles: ['Admin'],
    items: [
      {
        q: 'How do I manage user accounts?',
        a: 'Go to User Management from the sidebar. You can create, edit, or deactivate accounts and assign roles. Each user must have a role (Admin, Officer, Responder, or Student).',
      },
      {
        q: 'How do I update the campus logo or site name?',
        a: 'Go to System Administration → Site Settings. Upload a logo image and update the site name. Changes take effect immediately across the sidebar, login screen, and browser tab.',
      },
      {
        q: 'How does the Admin password bypass work?',
        a: 'When reopening a Resolved incident in Status Tracking, Officers and Responders must enter their password to confirm. Admins bypass this check entirely — resolved incidents can be reopened with a single click.',
      },
    ],
  },
]

const EMERGENCY_CONTACTS = [
  { label: 'Campus Security Office', number: '(032) 234-5678', icon: Shield },
  { label: 'UV Medical Unit', number: '(032) 234-5679', icon: Phone },
  { label: 'Bureau of Fire Protection', number: '160', icon: Phone },
  { label: 'Philippine National Police', number: '117', icon: Phone },
  { label: 'National Emergency Hotline', number: '911', icon: Phone },
  { label: 'SCARS Support Email', number: 'scars@uv.edu.ph', icon: Mail },
]

export default function FaqHelp() {
  const { currentUser } = useApp()
  const [openItems, setOpenItems] = useState({})
  const [searchQuery, setSearchQuery] = useState('')

  const role = roleName(currentUser)

  const toggleItem = (sectionIdx, itemIdx) => {
    const key = `${sectionIdx}-${itemIdx}`
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const filteredSections = FAQ_SECTIONS
    .filter(section => section.roles.includes(role) || !role)
    .map(section => ({
      ...section,
      items: section.items.filter(item =>
        !searchQuery ||
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter(section => section.items.length > 0)

  return (
    <div className={p.page}>
      <Header title="FAQ & Help" subtitle="Frequently asked questions and support resources" />
      <div className={p.content}>

        {/* Search */}
        <div className={p.card} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <HelpCircle size={20} color="#2E7D32" />
            <input
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ flex: 1, border: '1px solid #C8E6C9', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none' }}
            />
          </div>
        </div>

        {/* Quick help based on role */}
        <div className={p.card} style={{ marginBottom: 20, background: 'linear-gradient(135deg, #E8F5E9, #fff)' }}>
          <div className={p.sectionHeader}>
            <span className={p.sectionTitle}>Quick Help for {role || 'Your Role'}</span>
          </div>
          <div style={{ fontSize: 13, color: '#1a2e1c', lineHeight: 1.7 }}>
            {role === 'Student' && (
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>To report an incident, click <strong>"Report Now"</strong> on your dashboard</li>
                <li>Track your reports in the <strong>"My Incident Reports"</strong> table</li>
                <li>Check <strong>"Campus Alerts"</strong> on your dashboard for important notices</li>
                <li>Use <strong>Emergency Contacts</strong> at the bottom of this page for immediate help</li>
                <li>Update your profile via the <strong>account avatar</strong> in the top-right corner</li>
              </ul>
            )}
            {role === 'Officer' && (
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li><strong>Validate</strong> pending incidents to confirm they are legitimate</li>
                <li><strong>Verify</strong> validated incidents to approve them for response dispatch</li>
                <li><strong>Assign</strong> a response team to dispatch help — team status updates automatically</li>
                <li>Use <strong>Quick Alert</strong> on your dashboard to notify the campus</li>
                <li>New incidents trigger a <strong>sound alert</strong> and appear in your bell notification panel</li>
              </ul>
            )}
            {role === 'Responder' && (
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>Check <strong>Assigned Incidents</strong> on your dashboard to see your team's tasks</li>
                <li>Incident status is <strong>read-only</strong> — updates are managed by Officers and Admins</li>
                <li>View <strong>All Recent Reports</strong> to stay informed of all campus activity</li>
                <li>New incidents trigger a <strong>sound alert</strong> and appear in the bell panel</li>
                <li>Contact your Officer if you are not yet assigned to a team</li>
              </ul>
            )}
            {role === 'Admin' && (
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>Manage users, roles, and teams from their respective sidebar pages</li>
                <li>Monitor all incidents from the <strong>Dashboard</strong> and <strong>Incident Management</strong></li>
                <li>You can <strong>reopen resolved incidents instantly</strong> — no password required for Admin</li>
                <li>Team status updates <strong>automatically</strong> to "On Duty" when active incidents are assigned</li>
                <li>View analytics in <strong>Reporting & Analytics</strong> (Critical & High priority incidents)</li>
                <li>Configure branding and system settings in <strong>System Administration</strong></li>
              </ul>
            )}
          </div>
        </div>

        {/* FAQ Sections */}
        {filteredSections.map((section, sIdx) => {
          const Icon = section.icon
          return (
            <div key={sIdx} className={p.card} style={{ marginBottom: 16 }}>
              <div className={p.sectionHeader}>
                <span className={p.sectionTitle}><Icon size={15} /> {section.title}</span>
              </div>
              {section.items.map((item, iIdx) => {
                const key = `${sIdx}-${iIdx}`
                const isOpen = openItems[key]
                return (
                  <div key={iIdx} style={{ borderBottom: '1px solid #f0f7f0' }}>
                    <button
                      onClick={() => toggleItem(sIdx, iIdx)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 4px', background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 13, fontWeight: 600, color: '#1a2e1c', textAlign: 'left', gap: 10,
                      }}
                    >
                      <span>{item.q}</span>
                      {isOpen ? <ChevronUp size={16} color="#4a7a52" /> : <ChevronDown size={16} color="#4a7a52" />}
                    </button>
                    {isOpen && (
                      <div style={{ padding: '0 4px 14px', fontSize: 13, color: '#4a7a52', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                        {item.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}

        {!filteredSections.length && (
          <div className={p.card}>
            <div className={p.empty}>
              <HelpCircle size={24} color="#C8E6C9" />
              No results found for "{searchQuery}".
            </div>
          </div>
        )}

        {/* Emergency Contacts */}
        <div className={p.card} style={{ marginTop: 4 }}>
          <div className={p.sectionHeader}>
            <span className={p.sectionTitle}><Phone size={15} /> Emergency Contacts & Support</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {EMERGENCY_CONTACTS.map((contact, i) => {
              const CIcon = contact.icon
              const isEmail = contact.number.includes('@')
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', background: '#F6FCF6', borderRadius: 10,
                  border: '1px solid #e2ede3',
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CIcon size={16} color="#2E7D32" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1a2e1c' }}>{contact.label}</div>
                    {isEmail ? (
                      <a href={`mailto:${contact.number}`} style={{ fontSize: 13, fontWeight: 700, color: '#2E7D32', textDecoration: 'none' }}>{contact.number}</a>
                    ) : (
                      <a href={`tel:${contact.number.replace(/\D/g, '')}`} style={{ fontSize: 13, fontWeight: 700, color: '#2E7D32', textDecoration: 'none' }}>{contact.number}</a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
