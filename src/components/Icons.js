import React from 'react';
import { View, Platform } from 'react-native';

/**
 * Universal SVG Icon component for React Native Web & Native
 * Renders standard scalable vector paths matching Lucide/Heroicons
 */
export function SvgIcon({ paths, size = 18, color = '#0284c7', viewBox = '0 0 24 24', strokeWidth = 2, fill = 'none' }) {
  if (Platform.OS === 'web') {
    return (
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        fill={fill}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ display: 'block', flexShrink: 0 }}
      >
        {paths}
      </svg>
    );
  }

  // Fallback for native view rendering if needed
  return <View style={{ width: size, height: size }} />;
}

// 1. Dashboard / Home Icon
export function HomeIcon({ color = '#0284c7', size = 18 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      paths={
        <>
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </>
      }
    />
  );
}

// 2. Calendar / Appointments Icon
export function CalendarIcon({ color = '#0284c7', size = 18 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      paths={
        <>
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
        </>
      }
    />
  );
}

// 3. Pill / Medication Icon
export function PillIcon({ color = '#0284c7', size = 18 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      paths={
        <>
          <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
          <path d="m8.5 8.5 7 7" />
        </>
      }
    />
  );
}

// 4. Folder / Records / CCD Icon
export function RecordsIcon({ color = '#0284c7', size = 18 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      paths={
        <>
          <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
        </>
      }
    />
  );
}

// 5. Chat / Message Bubble Icon
export function ChatIcon({ color = '#0284c7', size = 18 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      paths={
        <>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </>
      }
    />
  );
}

// 6. Bell / Reminder Icon
export function BellIcon({ color = '#0284c7', size = 18 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      paths={
        <>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </>
      }
    />
  );
}

// 7. Clipboard / Document / Recalls Icon
export function ClipboardIcon({ color = '#0284c7', size = 18 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      paths={
        <>
          <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="M9 12h6" />
          <path d="M9 16h6" />
        </>
      }
    />
  );
}

// 8. Shield / Policy / NPP Icon
export function ShieldIcon({ color = '#0284c7', size = 18 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      paths={
        <>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        </>
      }
    />
  );
}

// 9. Settings / Gear Icon
export function SettingsIcon({ color = '#0284c7', size = 18 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      paths={
        <>
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </>
      }
    />
  );
}

// 10. Hamburger Menu Icon
export function MenuIcon({ color = '#0f172a', size = 20 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      paths={
        <>
          <line x1="4" x2="20" y1="12" y2="12" />
          <line x1="4" x2="20" y1="6" y2="6" />
          <line x1="4" x2="20" y1="18" y2="18" />
        </>
      }
    />
  );
}

// 11. Chevron Right Icon
export function ChevronRightIcon({ color = '#94a3b8', size = 16 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      strokeWidth={2.2}
      paths={
        <>
          <polyline points="9 18 15 12 9 6" />
        </>
      }
    />
  );
}

// 12. Logout / Exit Icon
export function LogOutIcon({ color = '#dc2626', size = 16 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      paths={
        <>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" x2="9" y1="12" y2="12" />
        </>
      }
    />
  );
}

// 13. Mail Icon
export function MailIcon({ color = '#94a3b8', size = 18 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      paths={
        <>
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </>
      }
    />
  );
}

// 14. Lock Icon
export function LockIcon({ color = '#94a3b8', size = 18 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      paths={
        <>
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </>
      }
    />
  );
}

// 15. Eye Off Icon
export function EyeOffIcon({ color = '#94a3b8', size = 18 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      paths={
        <>
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
          <line x1="2" x2="22" y1="2" y2="22" />
        </>
      }
    />
  );
}
