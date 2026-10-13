import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView
} from 'react-native';
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
  LogOutIcon
} from './Icons';

export default function SidebarDrawer({
  visible,
  onClose,
  user,
  onNavigate,
  onLogout
}) {
  if (!visible) return null;

  const firstName = user?.first_name || 'Patient';
  const lastName = user?.last_name || 'User';
  const middleName = user?.middle_name ? ` ${user.middle_name}` : '';
  const fullName = `${firstName}${middleName} ${lastName}`.trim();
  const initials = `${firstName[0] || 'P'}${lastName[0] || ''}`.toUpperCase();

  const roleText = (user?.role || 'PATIENT').toUpperCase();
  const orgText = 'ENTERPRISE';

  // System-aligned navigation items with pure vector SVG icons
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      IconComponent: HomeIcon
    },
    {
      id: 'appointments',
      label: 'Appointments',
      IconComponent: CalendarIcon
    },
    {
      id: 'prescriptions',
      label: 'Prescriptions',
      IconComponent: PillIcon
    },
    {
      id: 'health_records',
      label: 'Health Records (CCD)',
      IconComponent: RecordsIcon
    },
    {
      id: 'medical_reports',
      label: 'Medical Reports',
      IconComponent: ClipboardIcon
    },
    {
      id: 'messages',
      label: 'Care Team Messages',
      IconComponent: ChatIcon
    },
    {
      id: 'reminders',
      label: 'Clinical Reminders',
      IconComponent: BellIcon
    },
    {
      id: 'recalls',
      label: 'Preventive Recalls',
      IconComponent: ClipboardIcon
    },
    {
      id: 'policies',
      label: 'Portal Policies & NPP',
      IconComponent: ShieldIcon
    },
    {
      id: 'settings',
      label: 'Profile & Settings',
      IconComponent: SettingsIcon
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
            <Text style={styles.avatarText}>{initials}</Text>
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

        {/* Section Heading: PORTAL NAVIGATION */}
        <View style={styles.sectionHeaderWrap}>
          <Text style={styles.sectionHeaderText}>PORTAL NAVIGATION</Text>
        </View>

        {/* Navigation Item List */}
        <ScrollView
          style={styles.navScroll}
          contentContainerStyle={styles.navScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {navItems.map((item) => {
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
                {/* Clean, soft cyan square icon frame matching web screenshot */}
                <View style={styles.navIconBox}>
                  <IconComp color="#0d9488" size={17} />
                </View>

                {/* Navigation Item Label */}
                <Text style={styles.navItemLabel}>{item.label}</Text>

                {/* Right Chevron */}
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
    marginRight: 12
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
