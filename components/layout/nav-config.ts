// components/layout/nav-config.ts

// ============= TYPES =============
import { PERMISSIONS, type Permission } from '@/lib/permissions';

export type NavItem = {
  id: string;
  label: string;
  href?: string;
  iconName: string;          // String name — looked up to lucide-react in the component
  requires?: Permission;
  position?: 'top' | 'bottom';
  children?: NavItem[];
};

// ============= NAVIGATION TREE =============
export const NAV: NavItem[] = [
  { id: 'home', label: 'Home', href: '/home', iconName: 'Home' },
  { id: 'engage', label: 'Engage', href: '/engage', iconName: 'Sparkles' },
  {
    id: 'worklife', label: 'My Worklife', iconName: 'User',
    children: [
      { id: 'profile', label: 'Profile', href: '/my-worklife/profile', iconName: 'IdCard' },
      { id: 'goals', label: 'Goals', href: '/my-worklife/goals', iconName: 'Target' },
      { id: 'reviews', label: 'Reviews', href: '/my-worklife/reviews', iconName: 'Star' },
    ],
  },
  {
    id: 'todo', label: 'To do', iconName: 'CheckSquare',
    children: [
      { id: 'tasks', label: 'Tasks', href: '/todo/tasks', iconName: 'ListTodo' },
      { id: 'approvals', label: 'Approvals', href: '/todo/approvals', iconName: 'CheckCircle',
        requires: PERMISSIONS.APPROVE_REQUESTS },
    ],
  },
  {
    id: 'salary', label: 'Salary', iconName: 'Wallet',
    children: [
      { id: 'payslips', label: 'Payslips', href: '/salary/payslips', iconName: 'FileText' },
      { id: 'tax', label: 'Tax Documents', href: '/salary/tax-documents', iconName: 'Receipt' },
    ],
  },
  {
    id: 'leave', label: 'Leave', iconName: 'Calendar',
    children: [
      { id: 'balance', label: 'Balance', href: '/leave/balance', iconName: 'PieChart' },
      { id: 'request', label: 'Request Time Off', href: '/leave/request', iconName: 'CalendarPlus' },
      { id: 'approvals', label: 'Approvals', href: '/leave/approvals', iconName: 'CheckCircle',
        requires: PERMISSIONS.APPROVE_LEAVE },
    ],
  },
  {
    id: 'attendance', label: 'Attendance', iconName: 'Clock',
    children: [
      { id: 'timesheet', label: 'Timesheet', href: '/attendance/timesheet', iconName: 'CalendarRange' },
      { id: 'clock', label: 'Clock In/Out', href: '/attendance/clock', iconName: 'Timer' },
      { id: 'projects', label: 'Projects', href: '/attendance/timesheet/projects', iconName: 'FolderKanban',
        requires: PERMISSIONS.MANAGE_PROJECTS },
    ],
  },
  { id: 'documents', label: 'Document Center', href: '/document-center', iconName: 'Folder' },
  { id: 'people', label: 'People', href: '/people', iconName: 'Users' },
  { id: 'helpdesk', label: 'Helpdesk', href: '/helpdesk', iconName: 'HelpCircle' },
  { id: 'requests', label: 'Request Hub', href: '/request-hub', iconName: 'Inbox' },
  { id: 'delegates', label: 'Workflow Delegates', href: '/workflow-delegates', iconName: 'Shuffle',
    requires: PERMISSIONS.MANAGE_DELEGATES },
  { id: 'settings', label: 'Settings', href: '/settings', iconName: 'Settings',
    requires: PERMISSIONS.MANAGE_SETTINGS, position: 'bottom' },
];
