import { useState } from 'react'
import {
  HelpCircle, ChevronDown, ChevronUp, Shield, AlertTriangle,
  Users, Bell, FileText, Phone, Mail, BookOpen,
  Lock, Clock, CheckCircle, Settings, User, Zap
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import Header from '../components/Header'
import p from '../components/Page.module.css'

const roleName = (u) => typeof u?.role === 'object' ? u?.role?.name ?? '' : (u?.role ?? '')

// roles: which roles see this section. Empty/missing = all roles.
const FAQ_SECTIONS = [

  // ── General ────────────────────────────────────────────────────────────────
  {
    title: 'General',
    icon: BookOpen,
    roles: ['Student', 'Officer', 'Responder', 'Admin'],
    items: [
      {
        q: 'What is SCARS?',
        a: 'SCARS (Smart Campus Alert & Response System) is a real-time campus safety and incident management platform for UV Toledo Campus. It enables students to report emergencies, officers to validate and dispatch response teams, responders to handle and resolve incidents, and admins to oversee the entire system — all in one place with live updates.',
      },
      {
        q: 'How do I log in?',
        a: 'Open the SCARS login page and enter your registered email address and password. The system will automatically redirect you to the dashboard for your assigned role (Admin, Officer, Responder, or Student). If your account is inactive or your credentials are wrong, you will see an error message.',
      },
      {
        q: 'How do I change my password or update my profile?',
        a: 'Click your account avatar or name in the top-right corner of any page and select "My Profile". From there you can update your display name, email address, password, and profile photo. Password changes take effect immediately — you will not be logged out.',
      },
      {
        q: 'Can I upload a profile photo?',
        a: 'Yes. Go to My Profile and click the avatar/photo area to upload an image. Supported formats are JPG and PNG. The photo appears in the header, sidebar, and anywhere your account is referenced. You can also enable optional Face++ face verification from the same page.',
      },
      {
        q: 'What does "real-time" mean in SCARS?',
        a: 'SCARS uses Socket.io to push live updates to all connected users. When any incident, team assignment, notification, or status changes, every logged-in user sees the change instantly without needing to refresh the page.',
      },
      {
        q: 'What browsers and devices are supported?',
        a: 'SCARS works on any modern browser (Chrome, Edge, Firefox, Safari) on desktop, tablet, and mobile. The interface is mobile-responsive with touch-friendly controls. For audio alerts, make sure your browser allows sound playback on the site.',
      },
      {
        q: 'What do I do if the page is not loading or something looks wrong?',
        a: 'First try refreshing the page. If the issue persists: (1) clear your browser cache, (2) check your internet connection, (3) try a different browser. If you are still experiencing problems, contact the SCARS support email at scars@uv.edu.ph with a description of the issue.',
      },
    ],
  },

  // ── Profile & Account ─────────────────────────────────────────────────────
  {
    title: 'Profile & Account',
    icon: User,
    roles: ['Student', 'Officer', 'Responder', 'Admin'],
    items: [
      {
        q: 'How do I access my profile settings?',
        a: 'Click your avatar or name in the top-right corner of any page and select "My Profile", or navigate to /profile from the sidebar.',
      },
      {
        q: 'Can I change my email address?',
        a: 'Yes. Go to My Profile, update the email field, and save. Your new email will be used for login on your next session.',
      },
      {
        q: 'What is Face++ verification?',
        a: 'Face++ is an optional face-recognition feature that adds an extra layer of identity verification to your profile. If your admin has configured API keys, you can enroll your face from the My Profile page. This is not required for regular use.',
      },
      {
        q: 'I forgot my password — what do I do?',
        a: 'Contact your system administrator or Officer. Currently, password resets are handled by an Admin through User Management. There is no self-service password reset link.',
      },
      {
        q: 'Why do I not see certain menu items?',
        a: 'The sidebar navigation is dynamically built from your role\'s permissions. If a page is not visible, your role does not have access to it. Contact your Admin if you believe you should have access to a specific feature.',
      },
    ],
  },

  // ── Student Dashboard & Reporting ─────────────────────────────────────────
  {
    title: 'Reporting Incidents',
    icon: AlertTriangle,
    roles: ['Student'],
    items: [
      {
        q: 'How do I report an incident?',
        a: 'From your Student Dashboard, click the large "Report Now" button. Fill in:\n• Title — a short, clear description (e.g. "Broken glass near canteen")\n• Type — choose the category that best fits (Fire, Medical, Security, Theft, Accident, Natural Disaster, Vandalism, Infrastructure, or Other)\n• Priority — how urgent the situation is (see priority guide below)\n• Location — be as specific as possible (building, floor, room number)\n• Description — provide all relevant details to help responders\n\nClick "Submit Report". Campus security is notified immediately.',
      },
      {
        q: 'What priority level should I choose?',
        a: 'Use this guide:\n• Critical — Immediate threat to life (active fire, medical collapse, violence in progress)\n• High — Serious situation requiring urgent response (injury, dangerous structural damage, major theft)\n• Medium — Significant issue but not immediately life-threatening (vandalism, minor injury, access problem)\n• Low — Minor issue that needs attention but is not urgent (broken equipment, minor facilities issue)\n\nWhen in doubt, choose a higher priority — officers will re-evaluate.',
      },
      {
        q: 'What types of incidents can I report?',
        a: 'Fire · Medical Emergency · Security Threat · Theft · Accident · Natural Disaster · Vandalism · Infrastructure (broken facilities, leaks, power issues) · Other (anything that does not fit the above categories).',
      },
      {
        q: 'Can I track the status of my report?',
        a: 'Yes. Your Student Dashboard shows a table of all your submitted reports with real-time status updates:\n• Open — received and awaiting officer review\n• In Progress — validated, approved, and a response team is handling it\n• Resolved — the incident has been handled and closed\n• Rejected — the report was reviewed and found to be inaccurate or a false alarm',
      },
      {
        q: 'What happens after I submit a report?',
        a: 'Your report appears immediately in the Officer and Admin dashboards with an alert sound. An Officer will:\n1. Validate the report (confirm it is legitimate)\n2. Verify the incident details (second approval step)\n3. Assign a response team (status changes to "In Progress")\n\nYou will see each status change on your dashboard in real-time. You do not need to refresh.',
      },
      {
        q: 'Can I edit or delete a report after submitting it?',
        a: 'No. Once submitted, reports cannot be edited or deleted by Students. If you made a mistake, contact an Officer or Admin — they can update the details or reject the report if it was submitted in error.',
      },
      {
        q: 'What are Campus Alerts on my dashboard?',
        a: 'Campus Alerts are official notifications sent by Admins to the campus community. They appear on your dashboard and in the bell notification panel in the top-right corner. Alerts can be Emergency, Alert, Warning, or informational — read them carefully as they may require you to take action (evacuate, shelter in place, etc.).',
      },
      {
        q: 'I reported an emergency — should I call security too?',
        a: 'For life-threatening emergencies, call the Campus Security Office at (032) 234-5678 or the National Emergency Hotline (911) immediately. Do not rely solely on the app for critical emergencies. SCARS is a supplement to, not a replacement for, direct emergency communication.',
      },
    ],
  },

  // ── Incident Management ────────────────────────────────────────────────────
  {
    title: 'Incident Management',
    icon: Shield,
    roles: ['Officer', 'Admin'],
    items: [
      {
        q: 'What is the incident workflow?',
        a: 'The full lifecycle is:\nReport (Student or Officer) → Validate (Officer/Admin confirms legitimacy) → Verify (Officer/Admin approves details) → Assign Team → In Progress → Resolve\n\nAn incident cannot be resolved until it is both validated and verified and has a response team assigned.',
      },
      {
        q: 'What does "Validate" mean?',
        a: 'Validation is the first step in processing a report. It confirms the incident is legitimate and requires a response — not a test, duplicate, or false alarm. Click the "Validate" button on the incident card or in the detail view. A validated incident shows a green "✓ Validated" badge.',
      },
      {
        q: 'What does "Verify" mean?',
        a: 'Verification (also shown as "Approve") is the second review step after validation. It confirms the incident details (location, type, priority, description) are accurate and the response should proceed. Only after both validation and verification can a response team be assigned and the incident resolved.',
      },
      {
        q: 'How do I assign a response team?',
        a: 'There are two ways:\n1. Manual: In Incident Management or Response Management → Assignments, click the team button next to an incident. Teams labeled green are Available; amber/grey are On Duty.\n2. Auto-Assign: In Response Management → Assignments, click "Auto Assign All" — the system automatically matches team specialty to incident type, then fills by availability.',
      },
      {
        q: 'How do I reject an incident?',
        a: 'Click the "Reject" button on an incident that has been validated but found to be inaccurate, a false alarm, or a duplicate. The status changes to "Rejected" and the incident is removed from the active queue. Rejected incidents cannot be acted on further without Admin intervention.',
      },
      {
        q: 'Can I delete an incident?',
        a: 'Yes, with restrictions. Incidents can be soft-deleted (moved to a "Deleted" tab) and restored at any time. However, once an incident is both validated AND verified, the delete button is locked. This protects the record integrity of confirmed incidents.',
      },
      {
        q: 'What is soft delete?',
        a: 'When you delete an incident it is not permanently removed — it moves to the Deleted tab in Incident Management. From there, an Admin can restore it at any time. This prevents accidental data loss.',
      },
      {
        q: 'How do I reopen a Resolved incident?',
        a: 'Only Admins can reopen resolved incidents. In Response Management → Status Tracking → Resolved tab, click "Reopen Incident". A password confirmation dialog will appear — the Admin must enter their password to confirm. This extra step prevents accidental reopens.',
      },
      {
        q: 'Why can\'t I resolve an incident even though it\'s assigned?',
        a: 'Resolve requires all three conditions to be met:\n1. ✓ Validated\n2. ✓ Verified (Approved)\n3. ✓ Assigned to a response team\n\nThe resolve button will show a note listing which conditions are still missing.',
      },
    ],
  },

  // ── Responder Dashboard ────────────────────────────────────────────────────
  {
    title: 'Responder Dashboard',
    icon: Users,
    roles: ['Responder'],
    items: [
      {
        q: 'What are the three tabs on my dashboard?',
        a: 'Your dashboard is organized into three tabs:\n• My Incidents — active incidents (Open and In Progress) assigned to your team, sorted by priority. This is your main work queue.\n• All Reports — full history of all incidents assigned to your team, including resolved ones, sorted newest first.\n• My Team — your team\'s details, member list, and recent campus notifications.',
      },
      {
        q: 'What do the badge numbers on the tabs mean?',
        a: '• My Incidents badge — the count of active (Open + In Progress) incidents that need your attention.\n• All Reports badge — the total number of incidents ever assigned to your team (including resolved).\n• My Team badge — the number of members currently in your team.\n\nThe numbers differ because My Incidents only counts active ones, while All Reports counts everything including completed work.',
      },
      {
        q: 'How do I see my team\'s assigned incidents?',
        a: 'Open the "My Incidents" tab. All active incidents assigned to your team are displayed as cards sorted by priority (Critical first). Each card shows the title, location, type, priority, status, ETA (if set), and action buttons.',
      },
      {
        q: 'Can I resolve an incident?',
        a: 'Yes — if the incident is both validated and verified by an Officer/Admin. When both conditions are met, a green "Mark as Resolved" button appears on the incident card and in the detail modal.\n\nIf the incident is not yet validated or verified, the action area shows "Awaiting validation" with a lock icon — you cannot resolve it until an Officer approves it first.',
      },
      {
        q: 'What does "Awaiting validation" mean on an incident?',
        a: 'It means the incident has not yet been validated and/or verified by an Officer or Admin. You cannot resolve it in this state. Notify your supervising Officer if an urgent incident is stuck awaiting approval.',
      },
      {
        q: 'What is the ETA shown on incident cards?',
        a: 'ETA (Estimated Time of Arrival) is set by an Admin to indicate when your team is expected to respond. It is displayed as a color-coded countdown:\n• Green — plenty of time remaining (more than 10 minutes)\n• Amber — respond soon (10 minutes or less remaining)\n• Red with "!" — ETA is overdue\n\nETA is set in Response Management by an Admin. You cannot set it yourself.',
      },
      {
        q: 'Can I view full incident details?',
        a: 'Yes. Click the "View Detail" button (eye icon) on any incident card in any tab. The detail panel shows the full incident: title, type, priority, location, description, reporter, assigned team, validation/verification status, ETA, and timestamps.',
      },
      {
        q: 'Can I see incidents not assigned to my team?',
        a: 'No. Both the "My Incidents" and "All Reports" tabs only show incidents assigned to your team. This keeps your view focused on your responsibilities.',
      },
      {
        q: 'What if I\'m not assigned to any team?',
        a: 'You will see an alert banner at the top of your dashboard: "You are not assigned to any response team yet." Contact your supervising Officer or Admin — they can add you to a team through Response Management → Teams.',
      },
      {
        q: 'What shows in the My Team tab?',
        a: 'The My Team tab shows:\n• Your team name and specialty\n• List of all team members with their roles and avatars\n• Recent campus notifications (last 10) filtered from the notification system',
      },
      {
        q: 'What do the stats at the top of my dashboard mean?',
        a: 'The four stat cards show counts based on ALL incidents assigned to your team (including resolved):\n• Assigned — total incidents ever assigned to your team\n• Open — incidents not yet being handled\n• In Progress — incidents actively being handled\n• Resolved — incidents your team has completed\n\nThese give you a picture of your team\'s total workload and performance.',
      },
    ],
  },

  // ── Response Management ───────────────────────────────────────────────────
  {
    title: 'Response Management',
    icon: Zap,
    roles: ['Admin', 'Officer'],
    items: [
      {
        q: 'What are the four tabs in Response Management?',
        a: '• Personnel — view all Officers and Responders with their team assignment and status\n• Teams — manage response teams: create, edit, delete, and view members\n• Assignments — assign unassigned incidents to teams, or reassign already-assigned incidents\n• Status Tracking — monitor active incident statuses and manage resolved incidents',
      },
      {
        q: 'How does Auto Assign work?',
        a: 'In Assignments → Unassigned, click "Auto Assign All". The system:\n1. Finds all Available teams\n2. Distributes unassigned incidents across them in round-robin order\n3. Updates each incident status to "In Progress" automatically\n\nIf no Available teams exist, you will see an error. Manually assign to an On Duty team if needed.',
      },
      {
        q: 'How do I reassign an incident to a different team?',
        a: 'In Assignments → Assigned, find the incident card and click "Reassign Team". The card expands to show all other teams — click the team you want to move it to. The current team is excluded from the list.',
      },
      {
        q: 'How do I set an ETA for an incident?',
        a: 'ETA can be set in two places:\n1. Assignments tab — on any assigned incident card, find the "ETA:" row and click "Set ETA"\n2. Status Tracking → Active tab — same "ETA:" row on each active incident card\n\nChoose a quick preset (ASAP, 5 min, 10 min, 15 min, 30 min, 1 hr) or pick a custom date/time. Past dates are not allowed.',
      },
      {
        q: 'Can I edit or clear an ETA?',
        a: 'Yes. On any incident with an ETA set, click "Edit" next to the countdown to reopen the ETA editor and choose a new time. Click the × (X) button to clear the ETA entirely.',
      },
      {
        q: 'What do the ETA colors mean?',
        a: '• Green — more than 10 minutes remaining (on track)\n• Amber — 10 minutes or less remaining (respond soon)\n• Red — ETA has passed and the incident is not yet resolved (overdue)\n\nOverdue ETAs show an "!" indicator.',
      },
      {
        q: 'How do I reopen a resolved incident?',
        a: 'In Status Tracking → Resolved tab, click "Reopen Incident" on the incident you want to reopen. A password dialog will appear — enter your Admin password to confirm. Only Admins can reopen resolved incidents; Officers and Responders see a disabled "Admin only — locked" button.',
      },
      {
        q: 'What is dynamic team status?',
        a: 'Team status updates automatically based on incident assignments:\n• "On Duty" — the team currently has one or more active (non-resolved) incidents assigned to it\n• "Available" — no active incidents assigned; ready for new assignments\n\nThis dynamic status is shown in Personnel, Teams, and Assignments tabs so you can quickly see team availability.',
      },
    ],
  },

  // ── Teams ────────────────────────────────────────────────────────────────
  {
    title: 'Teams & Personnel',
    icon: Users,
    roles: ['Admin', 'Officer'],
    items: [
      {
        q: 'How do I create a new response team?',
        a: 'Go to Response Management → Teams → click "New Team". Fill in:\n• Team name (must be unique)\n• Specialty — the type of incidents this team handles (e.g. Medical Emergency, Fire Safety, General Security)\n• Status — Available or Inactive\n• Members — check each Officer/Responder to add them\n\nClick "Save Team" when done.',
      },
      {
        q: 'How do I add or remove members from a team?',
        a: 'Go to Response Management → Teams, click the edit (pencil) icon on the team. In the member picker, check users to add them and uncheck to remove them. Click "Save Team".',
      },
      {
        q: 'Can one person be on multiple teams?',
        a: 'Technically yes — the system does not prevent it. However, for clarity and accurate status tracking, it is recommended to assign each person to one primary team.',
      },
      {
        q: 'How do I view the members of a team?',
        a: 'In Response Management → Teams, click the expand (chevron) button on any team card to see the full member list with avatars and roles.',
      },
      {
        q: 'Can I delete a team?',
        a: 'Yes. Click the trash icon next to a team in Response Management → Teams. If the team has active incidents assigned, those incidents will become unassigned. Confirm before deleting.',
      },
      {
        q: 'What does "specialty" mean for a team?',
        a: 'Specialty is a label describing what the team is trained for (e.g. "Medical Emergency", "Fire Safety", "General Security"). It appears on team chips in the Assignments view and is used as a hint when auto-assigning to match team specialty with incident type.',
      },
    ],
  },

  // ── Notification System ──────────────────────────────────────────────────
  {
    title: 'Notification System',
    icon: Bell,
    roles: ['Admin'],
    items: [
      {
        q: 'How do I send a notification to the campus?',
        a: 'Go to Notification System from the sidebar. Fill in:\n1. Urgency Type — Emergency, Alert, Warning, or Info (affects the icon and color shown to recipients)\n2. Title — up to 60 characters\n3. Message — up to 280 characters\n4. Target Audience — All, Admin, Responders, Officers, or Students\n\nClick "Send Notification". Recipients see it instantly in their bell panel.',
      },
      {
        q: 'What are the four urgency types?',
        a: '• Emergency (red / lightning bolt) — immediate danger requiring urgent campus-wide action\n• Alert (amber / triangle) — important situation requiring attention\n• Warning (yellow / triangle) — caution advisory; users should be aware\n• Info (blue / info circle) — general announcements, updates, or reminders\n\nThe type determines the color and icon shown in the recipient\'s bell dropdown.',
      },
      {
        q: 'What is the bell preview?',
        a: 'As you type the title and message, a live preview appears below the form showing exactly how the notification will look in a recipient\'s bell dropdown — including the icon color, type badge, and target label. This helps you verify appearance before sending.',
      },
      {
        q: 'Can I target specific groups?',
        a: 'Yes. Choose from: All, Admin, Responders, Officers, or Students. Only users whose role matches the selected target will see the notification in their bell. Selecting "All" sends to every logged-in user.',
      },
      {
        q: 'How do I delete notification history?',
        a: 'In the History panel on the right side of the Notification System page, Admin controls are available:\n• Individual delete — click the trash icon on any notification row\n• Checkbox select — tick the checkbox on one or more rows\n• Delete selected — click "Delete (N)" in the header to remove checked items\n• Delete all — click "All" in the header to clear the entire history\n\nDeletions are permanent and broadcast to all clients via socket.',
      },
      {
        q: 'Can non-Admin users delete notifications?',
        a: 'No. The delete controls (checkboxes, trash icons, Delete Selected, Delete All) are only visible to Admin users. Other roles can only dismiss notifications from their bell panel.',
      },
      {
        q: 'Is there a limit to how many notifications I can send?',
        a: 'There is no hard limit. However, sending too many notifications can cause notification fatigue — users may begin ignoring them. Use Emergency and Alert types sparingly for genuinely urgent situations.',
      },
    ],
  },

  // ── Notifications & Bell ──────────────────────────────────────────────────
  {
    title: 'Notifications & Bell Panel',
    icon: Bell,
    roles: ['Student', 'Officer', 'Responder', 'Admin'],
    items: [
      {
        q: 'Where can I see notifications?',
        a: 'Click the bell icon in the top-right corner of any page. A dropdown shows all recent notifications targeted to your role. The bell shows a red badge with the count of unread items.',
      },
      {
        q: 'What types of alerts appear in the bell?',
        a: 'The bell shows two types of entries:\n1. Incident alerts — automatic alerts for new incidents (visible to Officers, Responders, Admins with link to Incident Management)\n2. DB notifications — messages sent by Admins via the Notification System (visible based on your role)\n\nStudents only see DB notifications (no incident alerts).',
      },
      {
        q: 'How do I dismiss a notification?',
        a: 'Each notification in the bell dropdown has a small × (dismiss) button on the right side. Click it to remove the notification from your view. The dismiss is stored locally so it persists across page refreshes.',
      },
      {
        q: 'How do I clear all notifications at once?',
        a: 'Click the bell icon to open the dropdown, then click the "Clear all" button in the header area of the panel. This dismisses all currently visible notifications at once.',
      },
      {
        q: 'Will my dismissed notifications come back after I refresh?',
        a: 'No. Dismissed notification IDs are saved in your browser\'s localStorage so they stay dismissed across refreshes. Incident alerts are also saved in sessionStorage and survive page refreshes — but are cleared when you log out or a new session starts.',
      },
      {
        q: 'Are there sound alerts?',
        a: 'Yes — for Officers, Responders, and Admins. When a new incident is reported, an audio alert plays:\n• Critical priority — urgent triple tone (high-frequency square wave)\n• High priority — double tone (sawtooth wave)\n• Medium / Low priority — single tone (sine wave)\n\nMake sure your browser allows audio on this site. Sound plays only when the page is open.',
      },
      {
        q: 'Why am I not seeing certain notifications?',
        a: 'Notifications are filtered by your role. If a notification was sent to "Responders" and your role is "Student", you will not see it. Also, if you already dismissed a notification, it will not reappear. If you believe you are missing critical alerts, check with your Admin.',
      },
    ],
  },

  // ── Reports & Analytics ──────────────────────────────────────────────────
  {
    title: 'Reports & Analytics',
    icon: FileText,
    roles: ['Admin', 'Officer'],
    items: [
      {
        q: 'What sections are in Reporting & Analytics?',
        a: '• Overview — high-level KPIs, pipeline progress bar (Open → In Progress → Resolved), monthly area chart, priority bar chart, and a recent incidents table\n• Incident Reports — detailed charts: by type (bar), status (donut), monthly trend, day-of-week frequency, top locations, and validation funnel\n• Response Metrics — team performance table, resolution rate progress bars, personnel directory\n• Export — filter and download incident data as CSV',
      },
      {
        q: 'Can I export incident data?',
        a: 'Yes. Go to Reporting & Analytics → Export tab. Set your filters:\n• Date range (From / To)\n• Incident type\n• Status (Open, In Progress, Resolved, Rejected)\n• Priority (Critical, High, Medium, Low)\n\nThen click "Download CSV". The file includes all matched incidents with all fields.',
      },
      {
        q: 'What does the validation funnel show?',
        a: 'The validation funnel chart shows how incidents flow through the approval pipeline: total reported → validated → verified → resolved. It highlights where incidents are getting stuck — for example, if many are validated but not verified, that is a bottleneck.',
      },
      {
        q: 'What is the "Resolution Rate" in Response Metrics?',
        a: 'Resolution Rate is the percentage of assigned incidents that a team has successfully resolved. A team with 8 resolved out of 10 assigned has an 80% resolution rate. Higher is better.',
      },
      {
        q: 'Are Critical and High priority incidents highlighted?',
        a: 'Yes. In the incident data table in Incident Reports, rows for Critical and High priority incidents are visually highlighted so they stand out from Medium and Low priority records.',
      },
    ],
  },

  // ── System Administration ─────────────────────────────────────────────────
  {
    title: 'System Administration',
    icon: Settings,
    roles: ['Admin'],
    items: [
      {
        q: 'How do I manage user accounts?',
        a: 'Go to User Management from the sidebar. You can:\n• Create new users — set name, email, password, role, and phone\n• Edit existing users — update any field\n• Deactivate users — set status to Inactive (they cannot log in)\n• Delete users — permanently removes the account\n\nEach user must be assigned a role. The role determines their dashboard, sidebar access, and permissions.',
      },
      {
        q: 'How do I manage roles and permissions?',
        a: 'Go to Role Management. Each role has five permission toggles:\n• Incidents — access to Incident Management\n• Response — access to Response Management\n• Notifications — access to the Notification System\n• Reports — access to Reporting & Analytics\n• Admin — access to User Management and System Administration\n\nToggling a permission updates the sidebar and page access for all users with that role instantly — no re-login required.',
      },
      {
        q: 'Why can\'t I edit the Admin role?',
        a: 'The Admin role is protected and cannot be edited or deleted. This prevents accidentally locking out all administrators from the system.',
      },
      {
        q: 'How do I update the campus logo and site name?',
        a: 'Go to System Administration → Site Settings. You can:\n• Upload a logo image — updates the sidebar, login screen, browser tab favicon, and loading screen\n• Change the site name — shown in the browser tab title\n• Update the timezone\n\nChanges take effect immediately for all connected users.',
      },
      {
        q: 'What is the Backup Configuration section?',
        a: 'Backup Configuration lets you set the auto-backup schedule (frequency, time, retention days) and backup location. The last backup status and timestamp are shown. Note: this configures the settings — actual backup execution depends on your server setup.',
      },
      {
        q: 'How do I manage backup settings?',
        a: 'In System Administration → Backup Configuration, you can set:\n• Auto Backup on/off\n• Frequency (Daily, Weekly, Monthly)\n• Backup time\n• Retention period (how many days to keep backups)\n• Backup storage location path',
      },
      {
        q: 'What does the Admin password confirmation do when reopening incidents?',
        a: 'When reopening a Resolved incident in Response Management → Status Tracking, Admins are required to enter their account password in a confirmation dialog. This two-step confirmation prevents accidental reopens of closed incidents. Non-Admin users see a disabled button and cannot reopen resolved incidents at all.',
      },
      {
        q: 'How are schema migrations handled?',
        a: 'New database columns are applied automatically every time the server starts using idempotent ALTER TABLE IF NOT EXISTS statements. You do not need to run manual migration scripts after deployment — simply restart the server.',
      },
    ],
  },

  // ── Security & Privacy ────────────────────────────────────────────────────
  {
    title: 'Security & Privacy',
    icon: Lock,
    roles: ['Student', 'Officer', 'Responder', 'Admin'],
    items: [
      {
        q: 'Is my data safe?',
        a: 'SCARS uses JWT (JSON Web Tokens) for authentication and bcrypt password hashing. Passwords are never stored in plain text. All API requests require a valid authentication token. The system is intended for use within the UV Toledo Campus network.',
      },
      {
        q: 'Who can see my incident reports?',
        a: 'Incident reports are visible to Officers and Admins who manage the system. Responders can see incidents assigned to their team. Other Students cannot see your specific reports.',
      },
      {
        q: 'What happens to my data when I log out?',
        a: 'When you log out, your session token is cleared and you are redirected to the login page. Incident alerts stored in sessionStorage are cleared to prevent them from appearing to the next user on the same device.',
      },
      {
        q: 'Can I see other users\' profiles or data?',
        a: 'No. You can only view and edit your own profile. User account management is restricted to Admins.',
      },
    ],
  },

]

const EMERGENCY_CONTACTS = [
  { label: 'Campus Security Office',    number: '(032) 234-5678', icon: Shield },
  { label: 'UV Medical Unit',           number: '(032) 234-5679', icon: Phone },
  { label: 'UV Toledo Administration',  number: '(032) 234-5670', icon: Phone },
  { label: 'Bureau of Fire Protection', number: '160',            icon: Phone },
  { label: 'Philippine National Police', number: '117',           icon: Phone },
  { label: 'National Emergency Hotline', number: '911',           icon: Phone },
  { label: 'NDRRMC Hotline',            number: '8-1406',         icon: Phone },
  { label: 'SCARS Support Email',       number: 'scars@uv.edu.ph', icon: Mail },
]

const QUICK_HELP = {
  Student: [
    'Click <strong>Report Now</strong> on your dashboard to submit an incident report',
    'Choose a priority level carefully — Critical means immediate life threat',
    'Track your reports in the <strong>My Incident Reports</strong> table below the form',
    'Check <strong>Campus Alerts</strong> for important notices from campus administration',
    'For life-threatening emergencies, <strong>call 911 or Campus Security directly</strong> — do not rely solely on this app',
    'Update your profile photo and contact info via the <strong>avatar</strong> in the top-right corner',
    'Scroll down to <strong>Emergency Contacts</strong> on this page for direct call links',
  ],
  Officer: [
    '<strong>Validate</strong> an incident first to confirm it is legitimate',
    '<strong>Verify (Approve)</strong> after validation to authorize a response dispatch',
    '<strong>Assign</strong> a response team — green buttons = Available, grey = On Duty',
    'Use <strong>Auto Assign All</strong> in Response Management to distribute all unassigned incidents quickly',
    'New incidents trigger a <strong>sound alert</strong> and appear in your bell notification panel instantly',
    'Check the bell panel for team assignment updates and status changes',
    'Go to <strong>Reporting & Analytics</strong> to review incident trends and team performance',
  ],
  Responder: [
    'Check <strong>My Incidents</strong> tab for your active work queue (Open + In Progress)',
    'The badge number on My Incidents = count of incidents still needing your response',
    'Click <strong>View Detail</strong> on any card to see the full incident report',
    'A green <strong>Mark as Resolved</strong> button appears once the incident is validated + verified by an Officer',
    'If you see <strong>Awaiting validation</strong>, the Officer/Admin has not yet approved the incident — you cannot resolve it yet',
    'Check the <strong>ETA badge</strong> on incident cards — red means your response is overdue',
    'Go to <strong>All Reports</strong> to see the full history of your team\'s incidents',
    'Contact your Officer if you are not yet assigned to a team',
  ],
  Admin: [
    'Monitor all active incidents from your <strong>Dashboard</strong> and <strong>Incident Management</strong>',
    'Use <strong>Response Management → Assignments</strong> to assign teams and set ETAs',
    'Set ETA with quick presets (ASAP, 5 min, 15 min…) or a custom date/time — past dates are blocked',
    '<strong>Reopening resolved incidents requires your password</strong> — enter it in the confirmation dialog',
    'Manage users, roles, and teams from their respective sidebar pages',
    'Use <strong>Notification System</strong> to send Emergency/Alert/Warning/Info notifications to targeted roles',
    'Only Admins can <strong>delete notification history</strong> — use checkboxes to select and delete in bulk',
    'Team status updates <strong>automatically</strong> to "On Duty" when active incidents are assigned',
    'Configure branding and backup settings in <strong>System Administration</strong>',
    'View analytics and export CSV data in <strong>Reporting & Analytics</strong>',
  ],
}

export default function FaqHelp() {
  const { currentUser } = useApp()
  const [openItems, setOpenItems]   = useState({})
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

  const quickHelp = QUICK_HELP[role] ?? []

  return (
    <div className={p.page}>
      <Header title="FAQ & Help" subtitle="Frequently asked questions and support resources" />
      <div className={p.content}>

        {/* Search */}
        <div className={p.card} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <HelpCircle size={20} color="#2E7D32" />
            <input
              placeholder="Search FAQs…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ flex: 1, border: '1px solid #C8E6C9', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 20, lineHeight: 1, padding: 4 }}
              >×</button>
            )}
          </div>
        </div>

        {/* Quick Help */}
        {quickHelp.length > 0 && !searchQuery && (
          <div className={p.card} style={{ marginBottom: 20, background: 'linear-gradient(135deg, #E8F5E9, #fff)' }}>
            <div className={p.sectionHeader}>
              <span className={p.sectionTitle}>
                <CheckCircle size={15} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
                Quick Help for {role}
              </span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#1a2e1c', lineHeight: 1.9 }}>
              {quickHelp.map((tip, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: tip }} />
              ))}
            </ul>
          </div>
        )}

        {/* FAQ Sections */}
        {filteredSections.map((section, sIdx) => {
          const Icon = section.icon
          return (
            <div key={sIdx} className={p.card} style={{ marginBottom: 16 }}>
              <div className={p.sectionHeader}>
                <span className={p.sectionTitle}><Icon size={15} /> {section.title}</span>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                  {section.items.length} {section.items.length === 1 ? 'topic' : 'topics'}
                </span>
              </div>
              {section.items.map((item, iIdx) => {
                const key = `${sIdx}-${iIdx}`
                const isOpen = openItems[key]
                return (
                  <div key={iIdx} style={{ borderBottom: iIdx < section.items.length - 1 ? '1px solid #f0f7f0' : 'none' }}>
                    <button
                      onClick={() => toggleItem(sIdx, iIdx)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 4px', background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 13, fontWeight: 600, color: '#1a2e1c', textAlign: 'left', gap: 10,
                      }}
                    >
                      <span>{item.q}</span>
                      {isOpen ? <ChevronUp size={16} color="#4a7a52" style={{ flexShrink: 0 }} /> : <ChevronDown size={16} color="#4a7a52" style={{ flexShrink: 0 }} />}
                    </button>
                    {isOpen && (
                      <div style={{ padding: '0 4px 14px', fontSize: 13, color: '#4a7a52', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', gap: 12 }}>
            {EMERGENCY_CONTACTS.map((contact, i) => {
              const CIcon = contact.icon
              const isEmail = contact.number.includes('@')
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', background: '#F6FCF6', borderRadius: 10,
                  border: '1px solid #e2ede3',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', background: '#E8F5E9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <CIcon size={16} color="#2E7D32" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1a2e1c', marginBottom: 2 }}>{contact.label}</div>
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
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 14, marginBottom: 0, lineHeight: 1.6 }}>
            For life-threatening emergencies, <strong style={{ color: '#dc2626' }}>call 911 immediately</strong> — do not rely solely on this application.
          </p>
        </div>

      </div>
    </div>
  )
}
