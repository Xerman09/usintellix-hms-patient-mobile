import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image
} from 'react-native';
import { getAvatarUrl } from '../constants/config';
import {
  HomeIcon,
  CalendarIcon,
  PillIcon,
  RecordsIcon,
  ChatIcon,
  BellIcon,
  ClipboardIcon,
  ShieldIcon,
  SettingsIcon,
  ChevronRightIcon,
  LogOutIcon,
  MegaphoneIcon,
  LabIcon,
  VisitsIcon,
  BillingIcon,
  CheckinIcon,
  TrackHealthIcon,
  ProxyIcon,
  TodoIcon
} from './Icons';

export default function SidebarDrawer({
  visible,
  onClose,
  user,
  onNavigate,
  onLogout
}) {
  const [avatarError, setAvatarError] = useState(false);
  if (!visible) return null;

  const firstName = user?.first_name || 'Patient';
  const lastName = user?.last_name || 'User';
  const middleName = user?.middle_name ? ` ${user.middle_name}` : '';
  const fullName = `${firstName}${middleName} ${lastName}`.trim();
  const initials = `${firstName[0] || 'P'}${lastName[0] || ''}`.toUpperCase();

  const roleText = (user?.role || 'PATIENT').toUpperCase();
  const orgText = 'ENTERPRISE';

  const rawAvatar = user?.avatarUrl || user?.avatar || user?.photo;
  const avatarUrl = getAvatarUrl(rawAvatar);

  // MyChart specific primary modules
  const myChartItems = [
    {
      id: 'mychart_todo',
      label: 'To-Do & Action Center',
      IconComponent: TodoIcon,
      color: '#0891b2'
    },
    {
      id: 'mychart_notifications',
      label: 'Notifications & Alerts',
      IconComponent: BellIcon,
      color: '#0284c7'
    },
    {
      id: 'mychart_results',
      label: 'Test Results (Lab & Imaging)',
      IconComponent: LabIcon,
      color: '#2563eb'
    },
    {
      id: 'mychart_visits',
      label: 'Visits & Discharge AVS',
      IconComponent: VisitsIcon,
      color: '#0284c7'
    },
    {
      id: 'mychart_billing',
      label: 'Statements & Payments',
      IconComponent: BillingIcon,
      color: '#059669'
    },
    {
      id: 'mychart_checkin',
      label: 'e-Check-In Wizard',
      IconComponent: CheckinIcon,
      color: '#d97706'
    },
    {
      id: 'mychart_track',
      label: 'Track My Health (Vitals)',
      IconComponent: TrackHealthIcon,
      color: '#e11d48'
    },
    {
      id: 'mychart_account',
      label: 'Family Proxy & Sharing',
      IconComponent: ProxyIcon,
      color: '#7c3aed'
    }
  ];

  // Core clinical records & services
  const clinicalItems = [
    {
      id: 'dashboard',
      label: 'Home Dashboard',
      IconComponent: HomeIcon,
      color: '#2563eb'
    },
    {
      id: 'appointments',
      label: 'Appointments',
      IconComponent: CalendarIcon,
      color: '#2563eb'
    },
    {
      id: 'prescriptions',
      label: 'Prescriptions',
      IconComponent: PillIcon,
      color: '#7c3aed'
    },
    {
      id: 'health_records',
      label: 'Health Records (CCD)',
      IconComponent: RecordsIcon,
      color: '#059669'
    },
    {
      id: 'medical_reports',
      label: 'Medical Reports',
      IconComponent: ClipboardIcon,
      color: '#4f46e5'
    },
    {
      id: 'messages',
      label: 'Care Team Messages',
      IconComponent: ChatIcon,
      color: '#0284c7'
    },
    {
      id: 'reminders',
      label: 'Clinical Reminders',
      IconComponent: BellIcon,
      color: '#0d9488'
    },
    {
      id: 'announcements',
      label: 'Announcements & Alerts',
      IconComponent: MegaphoneIcon,
      color: '#e11d48'
    },
    {
      id: 'policies',
      label: 'Portal Policies & NPP',
      IconComponent: ShieldIcon,
      color: '#64748b'
    },
    {
      id: 'settings',
      label: 'Profile & Settings',
      IconComponent: SettingsIcon,
      color: '#475569'
    }
  ];

  return (
    <View style={styles.overlay}>
      {/* Backdrop touch area to dismiss */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Sidebar Content Panel */}
      <SafeAreaView style={styles.drawerPanel}>
        {/* Top Header: Square Teal Initials Badge, Full Name, Badges & Close X */}
        <TouchableOpacity
          style={styles.drawerHeader}
          onPress={() => {
            onClose();
            onNavigate('settings');
          }}
          activeOpacity={0.8}
        >
          {/* Avatar Square */}
          <View style={styles.avatarSquare}>
            {avatarUrl && !avatarError ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarDrawerImg}
                onError={() => setAvatarError(true)}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </View>

          {/* User Details */}
          <View style={styles.userInfoCol}>
            <Text style={styles.userName} numberOfLines={2}>
              {fullName}
            </Text>
            <View style={styles.badgeRow}>
              <Text style={styles.roleBadge}>{roleText}</Text>
              <Text style={styles.dotSeparator}>•</Text>
              <Text style={styles.orgBadge}>{orgText}</Text>
            </View>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Section Heading: MYCHART CARE MODULES */}
        <View style={styles.sectionHeaderWrap}>
          <Text style={styles.sectionHeaderText}>MYCHART HEALTHCARE</Text>
        </View>

        {/* Navigation Item List */}
        <ScrollView
          style={styles.navScroll}
          contentContainerStyle={styles.navScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {myChartItems.map((item) => {
            const IconComp = item.IconComponent;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.navItem}
                activeOpacity={0.7}
                onPress={() => {
                  onClose();
                  onNavigate(item.id);
                }}
              >
                <View style={[styles.navIconBox, { backgroundColor: '#f0fdf4' }]}>
                  <IconComp color={item.color || '#0d9488'} size={17} />
                </View>

                <Text style={styles.navLabel}>{item.label}</Text>
                <ChevronRightIcon color="#94a3b8" size={13} />
              </TouchableOpacity>
            );
          })}

          <View style={[styles.sectionHeaderWrap, { marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' }]}>
            <Text style={styles.sectionHeaderText}>CLINICAL SERVICES</Text>
          </View>

          {clinicalItems.map((item) => {
            const IconComp = item.IconComponent;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.navItem}
                activeOpacity={0.7}
                onPress={() => {
                  onClose();
                  onNavigate(item.id);
                }}
              >
                <View style={styles.navIconBox}>
                  <IconComp color={item.color || '#0d9488'} size={17} />
                </View>

                <Text style={styles.navLabel}>{item.label}</Text>
                <ChevronRightIcon color="#94a3b8" size={13} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Bottom Workstation Signout Button */}
        <View style={styles.bottomFooter}>
          <TouchableOpacity
            style={styles.signOutBtn}
            activeOpacity={0.8}
            onPress={() => {
              onClose();
              onLogout();
            }}
          >
            <LogOutIcon color="#dc2626" size={16} />
            <Text style={styles.signOutText}>Sign Out Workstation</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    flexDirection: 'row'
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(30, 41, 59, 0.65)'
  },
  drawerPanel: {
    width: '82%',
    maxWidth: 320,
    height: '100%',
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 20,
    display: 'flex',
    flexDirection: 'column'
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  avatarSquare: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#007b83', // Exact solid dark teal from screenshot
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden'
  },
  avatarDrawerImg: {
    width: '100%',
    height: '100%',
    borderRadius: 6
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  userInfoCol: {
    flex: 1,
    justifyContent: 'center'
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 18,
    marginBottom: 3
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  roleBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284c7', // Cyan/blue
    letterSpacing: 0.4
  },
  dotSeparator: {
    fontSize: 10,
    color: '#0d9488',
    marginHorizontal: 1
  },
  orgBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0d9488', // Teal
    letterSpacing: 0.4
  },
  closeBtn: {
    padding: 6,
    marginLeft: 4
  },
  closeBtnText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600'
  },
  sectionHeaderWrap: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 8
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8
  },
  navScroll: {
    flex: 1
  },
  navScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 2
  },
  navIconBox: {
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccfbf1',
    backgroundColor: '#f0fdfa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  navItemLabel: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1e293b'
  },
  bottomFooter: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff'
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 6,
    height: 44,
    gap: 8
  },
  signOutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#dc2626'
  }
});
