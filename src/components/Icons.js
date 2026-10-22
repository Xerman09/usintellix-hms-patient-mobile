import React from 'react';
import { View, Text, Platform } from 'react-native';

/**
 * Universal SVG Icon component for React Native Web & Native
 * Renders standard scalable vector paths matching Lucide/Heroicons
 */
export function SvgIcon({ paths, size = 18, color = '#0284c7', viewBox = '0 0 24 24', strokeWidth = 2, fill = 'none', fallback = '' }) {
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

  // Fallback for native view rendering
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {fallback ? (
        <Text style={{ fontSize: Math.max(12, Math.round(size * 0.85)), color, textAlign: 'center', lineHeight: size }}>
          {fallback}
        </Text>
      ) : (
        <View style={{ width: size * 0.45, height: size * 0.45, borderRadius: (size * 0.45) / 2, backgroundColor: color }} />
      )}
    </View>
  );
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

// 11b. Chevron Left / Back Icon
export function ChevronLeftIcon({ color = '#0f172a', size = 18 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      strokeWidth={2.2}
      paths={
        <>
          <polyline points="15 18 9 12 15 6" />
        </>
      }
    />
  );
}

export function ArrowLeftIcon({ color = '#0f172a', size = 18 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      strokeWidth={2}
      paths={
        <>
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
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

// 16. Document Plus Icon (View Summary of Care)
export function DocumentPlusIcon({ color = '#ffffff', size = 32 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      paths={
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </>
      }
    />
  );
}

// 17. Download Care / Tray Icon (Download Summary of Care)
export function DownloadTrayIcon({ color = '#ffffff', size = 32 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      paths={
        <>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </>
      }
    />
  );
}

// 18. Medical Clipboard Icon (Customized Medical History Report)
export function MedicalClipboardIcon({ color = '#ffffff', size = 32 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      paths={
        <>
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
          <line x1="9" y1="14" x2="15" y2="14" />
        </>
      }
    />
  );
}

// 19. Document Folder Icon (Download Medical Record Documents)
export function DocumentFolderIcon({ color = '#ffffff', size = 32 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      paths={
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M10 12v4" />
          <path d="M14 12v4" />
          <path d="M10 16h4" />
        </>
      }
    />
  );
}

// 20. Help Circle Icon (Help)
export function HelpCircleIcon({ color = '#ffffff', size = 32 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      paths={
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </>
      }
    />
  );
}

// 21. User Icon
export function UserIcon({ color = '#0284c7', size = 18 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      paths={
        <>
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </>
      }
    />
  );
}

// 22. Edit Pencil Icon
export function EditIcon({ color = '#0284c7', size = 16 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      paths={
        <>
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </>
      }
    />
  );
}

// 23. Check Circle Icon
export function CheckCircleIcon({ color = '#10b981', size = 18 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      paths={
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </>
      }
    />
  );
}

// 24. Close / X Icon
export function CloseIcon({ color = '#64748b', size = 18 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      strokeWidth={2.2}
      paths={
        <>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </>
      }
    />
  );
}

// 25. Megaphone / Broadcast Icon
export function MegaphoneIcon({ color = '#0284c7', size = 20 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      paths={
        <>
          <path d="m3 11 18-5v12L3 14v-3z" />
          <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
        </>
      }
    />
  );
}

// 26. Alert Triangle Icon
export function AlertTriangleIcon({ color = '#eab308', size = 20 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      fallback="⚠️"
      paths={
        <>
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </>
      }
    />
  );
}

// 27. MyChart Lab / Test Results Icon
export function LabIcon({ color = '#2563eb', size = 20 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      fallback="🧪"
      paths={
        <>
          <path d="M10 2v7.31L4.1 20.3a2 2 0 0 0 1.74 2.7h12.32a2 2 0 0 0 1.74-2.7L14 9.31V2" />
          <path d="M8.5 2h7" />
          <path d="M14 9.3a6.5 6.5 0 0 0-4 0" />
        </>
      }
    />
  );
}

// 28. MyChart Visits & Clinic Icon
export function VisitsIcon({ color = '#0284c7', size = 20 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      fallback="🏥"
      paths={
        <>
          <path d="M18 21V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16" />
          <path d="M2 21h20" />
          <path d="M10 9h4" />
          <path d="M12 7v4" />
        </>
      }
    />
  );
}

// 29. MyChart Billing & Payments Icon
export function BillingIcon({ color = '#059669', size = 20 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      fallback="💳"
      paths={
        <>
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" x2="22" y1="10" y2="10" />
        </>
      }
    />
  );
}

// 30. MyChart e-Check-In Icon
export function CheckinIcon({ color = '#d97706', size = 20 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      fallback="📋"
      paths={
        <>
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
          <path d="m9 14 2 2 4-4" />
        </>
      }
    />
  );
}

// 31. MyChart Track Health Icon
export function TrackHealthIcon({ color = '#e11d48', size = 20 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      fallback="🩺"
      paths={
        <>
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
        </>
      }
    />
  );
}

// 32. MyChart Proxy & Family Sharing Icon
export function ProxyIcon({ color = '#7c3aed', size = 20 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      fallback="👥"
      paths={
        <>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      }
    />
  );
}

// 33. MyChart To-Do Checklist Icon
export function TodoIcon({ color = '#0891b2', size = 20 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      fallback="✅"
      paths={
        <>
          <path d="m9 11 3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </>
      }
    />
  );
}

// 34. Shield Security / Capability Icon
export function ShieldCheckIcon({ color = '#10b981', size = 20 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      fallback="🛡️"
      paths={
        <>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </>
      }
    />
  );
}

// 35. Trend / Sparkline Chart Icon
export function TrendIcon({ color = '#2563eb', size = 18 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      fallback="📈"
      paths={
        <>
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </>
      }
    />
  );
}

// 36. Info Circle Icon
export function InfoCircleIcon({ color = '#0284c7', size = 18 }) {
  return (
    <SvgIcon
      size={size}
      color={color}
      fallback="ℹ️"
      paths={
        <>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </>
      }
    />
  );
}




