const orgData = {
  id: 'root',
  label: 'Smart Campus Response System',
  children: [
    {
      id: 'um',
      label: 'User Management',
      children: [
        { id: 'ua', label: 'User Authentication' },
        { id: 'rm', label: 'Role Management' },
      ],
    },
    {
      id: 'im',
      label: 'Incident Management',
      children: [
        {
          id: 'ir',
          label: 'Incident Report',
          children: [
            { id: 'fe', label: 'Form Entry' },
            { id: 'mu', label: 'Media Upload' },
          ],
        },
        {
          id: 'iv',
          label: 'Incident Validation',
          children: [
            { id: 'cf', label: 'Check Fields' },
            { id: 'vd', label: 'Verify Data' },
          ],
        },
      ],
    },
    {
      id: 'resp',
      label: 'Response Management',
      children: [
        {
          id: 'rt',
          label: 'Response Team',
          children: [
            { id: 'vd2', label: 'Verify Data' },
            { id: 'aa', label: 'Auto Assign' },
          ],
        },
        {
          id: 'st',
          label: 'Status Tracking',
          children: [
            { id: 'manu', label: 'Manual Update' },
          ],
        },
      ],
    },
    {
      id: 'ns',
      label: 'Notification System',
      children: [
        {
          id: 'as',
          label: 'Alert Send',
          children: [
            { id: 'wp', label: 'Web Push' },
          ],
        },
        {
          id: 'mc',
          label: 'Multi Channel',
          children: [
            { id: 'sms', label: 'SMS Text' },
            { id: 'ea', label: 'Email Alert' },
          ],
        },
      ],
    },
    {
      id: 'ra',
      label: 'Reporting and Analytics',
      children: [
        {
          id: 'irep',
          label: 'Incident Reports',
          children: [
            { id: 'pdf', label: 'PDF Generation' },
            { id: 'cg', label: 'Chart Generation' },
          ],
        },
        {
          id: 'rmet',
          label: 'Response Metric',
          children: [
            { id: 'uman', label: 'User Management' },
          ],
        },
      ],
    },
    {
      id: 'sa',
      label: 'System Administration',
      children: [
        {
          id: 'sc',
          label: 'System Config',
          children: [
            { id: 'rp', label: 'Role Permission' },
          ],
        },
        {
          id: 'db',
          label: 'Database Backup',
          children: [
            { id: 'ab', label: 'Auto Backup' },
            { id: 'sb', label: 'Schedule Backup' },
          ],
        },
      ],
    },
  ],
}

export default orgData
