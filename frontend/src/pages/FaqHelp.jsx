import { useState } from 'react'
import {
  HelpCircle, ChevronDown, ChevronUp, Shield, AlertTriangle,
  Users, Bell, FileText, Phone, Mail, BookOpen
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import Header from '../components/Header'
import p from '../components/Page.module.css'

const roleName = (u) => typeof u?.role === 'object' ? u?.role?.name ?? '' : (u?.role ?? '')

const FAQ_SECTIONS = [
  {
    title: 'General',
    icon: BookOpen,
    items: [
      {
        q: 'What is SCARS?',
        a: 'SCARS (Smart Campus Alert & Response System) is a campus safety incident management system for UV Toledo Campus. It allows students to report incidents, officers to validate and assign response teams, and responders to handle emergencies in real-time.',
      },
      {
        q: 'Who can use SCARS?',
        a: 'SCARS is available to all campus members with an assigned account. There are four roles: Students (report incidents), Officers (validate and manage incidents), Responders (handle assigned incidents), and Admins (system management).',
      },
      {
        q: 'How do I log in?',
        a: 'Go to the SCARS login page and enter your registered email and password. You will be automatically directed to the dashboard for your assigned role.',
      },
      {
        q: 'How do I change my password?',
        a: 'Navigate to "My Profile" from the sidebar menu. You can update your password, name, email, and profile photo from there.',
      },
    ],
  },
  {
    title: 'Reporting Incidents (Students)',
    icon: AlertTriangle,
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
    title: 'Incident Management (Officers)',
    icon: Shield,
    items: [
      {
        q: 'What does "Validate" mean?',
        a: 'Validation is the first step in processing a report. As an Officer, you confirm the incident is legitimate and requires attention by clicking the "Validate" button.',
      },
      {
        q: 'What does "Verify" mean?',
        a: 'After validation, verification confirms the incident details are accurate. This is the second approval step before a response team can be assigned.',
      },
      {
        q: 'How do I assign a response team?',
        a: 'After validating and verifying an incident, select a team from the dropdown in the "Assign" column and click "Assign". The incident status will change to "In Progress" and the response team will be notified.',
      },
      {
        q: 'Can I send alerts to the campus?',
        a: 'Yes. Use the "Quick Alert" section on your Officer Dashboard to send notifications. Choose the alert type, write the title and message, select the target audience, and click "Send Alert".',
      },
    ],
  },
  {
    title: 'Response Management (Responders)',
    icon: Users,
    items: [
      {
        q: 'How do I see incidents assigned to my team?',
        a: 'Your Responder Dashboard automatically shows all incidents assigned to your team. You can also see all recent campus reports in the "All Recent Reports" section.',
      },
      {
        q: 'How do I update an incident\'s status?',
        a: 'Use the status dropdown next to each assigned incident to change its status. You can move incidents through: Open → In Progress → Resolved.',
      },
      {
        q: 'Why can\'t I mark an incident as Resolved?',
        a: 'An incident can only be resolved when it has been validated, verified, and assigned to a team. If the "Resolved" option appears locked, check which requirements are still pending — they are shown below the dropdown.',
      },
      {
        q: 'What if I\'m not assigned to any team?',
        a: 'Contact your supervising Officer or Admin. They can assign you to a response team through the Response Management page.',
      },
    ],
  },
  {
    title: 'Notifications & Alerts',
    icon: Bell,
    items: [
      {
        q: 'How do notifications work?',
        a: 'SCARS sends real-time notifications when incidents are created, updated, or resolved. Admins and Officers can also send manual alerts to specific groups (Students, Responders, Officers, or All).',
      },
      {
        q: 'Where can I see my notifications?',
        a: 'Click the bell icon in the top-right corner of any page. You will see a dropdown with recent notifications. Campus alerts also appear on your dashboard.',
      },
    ],
  },
  {
    title: 'Reports & Analytics',
    icon: FileText,
    items: [
      {
        q: 'What data is shown in reports?',
        a: 'The Reporting & Analytics page shows Critical and High priority incidents. It includes overview KPIs, incident charts (by type, status, priority, location, trend), response team metrics, and a data export feature.',
      },
      {
        q: 'Can I export incident data?',
        a: 'Yes. Go to Reporting & Analytics → Export tab. You can filter by date range, type, status, and priority, then download the data as a CSV file.',
      },
      {
        q: 'Who can access reports?',
        a: 'Admins and Officers have access to the full Reporting & Analytics page.',
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

  const filteredSections = FAQ_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item =>
      !searchQuery ||
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(section => section.items.length > 0)

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
                <li>Check <strong>"Campus Alerts"</strong> for important notifications</li>
                <li>Use <strong>Emergency Contacts</strong> for immediate assistance</li>
              </ul>
            )}
            {role === 'Officer' && (
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li><strong>Validate</strong> pending incidents to confirm they are legitimate</li>
                <li><strong>Verify</strong> validated incidents to approve them for response</li>
                <li><strong>Assign</strong> a response team from the dropdown to dispatch help</li>
                <li>Use <strong>Quick Alert</strong> to notify the campus community</li>
              </ul>
            )}
            {role === 'Responder' && (
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>Check your <strong>Assigned Incidents</strong> for team tasks</li>
                <li>Update incident status using the <strong>dropdown</strong> in the table</li>
                <li>View <strong>All Recent Reports</strong> to stay informed of campus activity</li>
                <li>Contact your Officer if you need to be assigned to a team</li>
              </ul>
            )}
            {role === 'Admin' && (
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>Manage users, roles, and teams in their respective pages</li>
                <li>Monitor all incidents from the <strong>Dashboard</strong> and <strong>Incident Management</strong></li>
                <li>View analytics in <strong>Reporting & Analytics</strong> (Critical & High priority)</li>
                <li>Configure system settings in <strong>System Administration</strong></li>
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
