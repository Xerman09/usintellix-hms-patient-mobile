import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert
} from 'react-native';
import { THEME } from '../constants/theme';
import { AuthService } from '../api/auth';
import {
  MenuIcon,
  CalendarIcon,
  PillIcon,
  RecordsIcon,
  BellIcon,
  ChatIcon,
  ChevronRightIcon
} from '../components/Icons';
import AppointmentsModal from '../components/AppointmentsModal';
import PrescriptionsModal from '../components/PrescriptionsModal';
import HealthRecordsModal from '../components/HealthRecordsModal';
import MessagesModal from '../components/MessagesModal';
import ClinicalRemindersModal from '../components/ClinicalRemindersModal';
import MedicalReportsModal from '../components/MedicalReportsModal';
import SidebarDrawer from '../components/SidebarDrawer';

export default function PatientDashboardScreen({ user, onLogout }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reminderSet, setReminderSet] = useState(false);
  const [showAppointments, setShowAppointments] = useState(false);
  const [showPrescriptions, setShowPrescriptions] = useState(false);
  const [showHealthRecords, setShowHealthRecords] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showClinicalReminders, setShowClinicalReminders] = useState(false);
  const [showMedicalReports, setShowMedicalReports] = useState(false);



  // Compute initials (e.g. "EA" for Erman Ace or from name)
  const firstName = user.first_name || 'Patient';
  const lastName = user.last_name || 'User';
  const fullName = `${firstName} ${lastName}`.trim();
  
  const initials = `${firstName[0] || 'P'}${lastName[0] || ''}`.toUpperCase();

  const handleLogout = async () => {
    await AuthService.logout();
    onLogout();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ================= EXACT MATCH TOP NAVIGATION BAR ================= */}
      <View style={styles.topNavBar}>
        
        {/* Left: Hamburger Menu Icon in soft square frame */}
        <TouchableOpacity
          style={styles.hamburgerBtn}
          onPress={() => setDrawerOpen(!drawerOpen)}
          activeOpacity={0.7}
        >
          <MenuIcon color="#0f172a" size={18} />
        </TouchableOpacity>

        {/* Center: Top Portal Label & Bold User Name */}
        <View style={styles.userIdentityColumn}>
          <Text style={styles.portalTagText}>USINTELLIX PATIENT PORTAL</Text>
          <Text style={styles.userFullNameText} numberOfLines={1}>
            {fullName}
          </Text>
        </View>

        {/* Right: Soft Blue Initials Avatar Badge */}
        <TouchableOpacity
          style={styles.avatarBadge}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.avatarInitialsText}>{initials}</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={styles.contentScroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Portal Status Banner */}
        <View style={styles.statusCard}>
          <Text style={styles.statusCardLabel}>PATIENT PORTAL</Text>
          <Text style={styles.statusDescription}>
            Welcome, {firstName}. Your medical portal is synced.
          </Text>
        </View>

        {/* Section Header */}
        <Text style={styles.sectionHeaderTitle}>Services &amp; Actions</Text>

        {/* 4 Clean Minimalist Action Boxes */}
        <View style={styles.cardsGrid}>
          
          {/* Card 1: Appointments */}
          <TouchableOpacity
            style={styles.gridCard}
            activeOpacity={0.7}
            onPress={() => setShowAppointments(true)}
          >
            <View style={[styles.cardIconCircle, { backgroundColor: '#eff6ff' }]}>
              <CalendarIcon color="#2563eb" size={20} />
            </View>
            <Text style={styles.gridCardTitle}>Appointments</Text>
            <Text style={styles.gridCardDesc}>View upcoming visits</Text>
          </TouchableOpacity>

          {/* Card 2: Prescriptions */}
          <TouchableOpacity
            style={styles.gridCard}
            activeOpacity={0.7}
            onPress={() => setShowPrescriptions(true)}
          >
            <View style={[styles.cardIconCircle, { backgroundColor: '#f5f3ff' }]}>
              <PillIcon color="#7c3aed" size={20} />
            </View>
            <Text style={styles.gridCardTitle}>Prescriptions</Text>
            <Text style={styles.gridCardDesc}>Active medications</Text>
          </TouchableOpacity>

          {/* Card 3: Health Records */}
          <TouchableOpacity
            style={styles.gridCard}
            activeOpacity={0.7}
            onPress={() => setShowHealthRecords(true)}
          >
            <View style={[styles.cardIconCircle, { backgroundColor: '#ecfdf5' }]}>
              <RecordsIcon color="#059669" size={20} />
            </View>
            <Text style={styles.gridCardTitle}>Health Records</Text>
            <Text style={styles.gridCardDesc}>Lab results &amp; charts</Text>
          </TouchableOpacity>

          {/* Card 4: Messages */}
          <TouchableOpacity
            style={styles.gridCard}
            activeOpacity={0.7}
            onPress={() => setShowMessages(true)}
          >
            <View style={[styles.cardIconCircle, { backgroundColor: '#f0f9ff' }]}>
              <ChatIcon color="#0284c7" size={20} />
            </View>
            <Text style={styles.gridCardTitle}>Messages</Text>
            <Text style={styles.gridCardDesc}>Care team chat</Text>
          </TouchableOpacity>

        </View>

        {/* Clean, Simple Clinical Reminders Button */}
        <TouchableOpacity
          style={styles.simpleRemindBtn}
          onPress={() => setShowClinicalReminders(true)}
          activeOpacity={0.8}
        >
          <BellIcon color="#0d9488" size={17} />
          <Text style={[styles.simpleRemindText, { color: '#0d9488' }]}>
            Clinical Reminders &amp; Guidelines
          </Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Appointments Interactive Bottom Sheet */}
      <AppointmentsModal
        visible={showAppointments}
        onClose={() => setShowAppointments(false)}
        patientId={user.id}
      />

      {/* Prescriptions Interactive Bottom Sheet */}
      <PrescriptionsModal
        visible={showPrescriptions}
        onClose={() => setShowPrescriptions(false)}
      />

      {/* Health Records Interactive Bottom Sheet */}
      <HealthRecordsModal
        visible={showHealthRecords}
        onClose={() => setShowHealthRecords(false)}
      />

      {/* Messages Interactive Bottom Sheet */}
      <MessagesModal
        visible={showMessages}
        onClose={() => setShowMessages(false)}
        currentUser={user}
      />

      {/* Clinical Reminders Interactive Bottom Sheet */}
      <ClinicalRemindersModal
        visible={showClinicalReminders}
        onClose={() => setShowClinicalReminders(false)}
      />

      {/* Medical Reports Interactive Bottom Sheet */}
      <MedicalReportsModal
        visible={showMedicalReports}
        onClose={() => setShowMedicalReports(false)}
        currentUser={user}
      />

      {/* Full-Height Modern Sidebar Navigation Drawer */}
      <SidebarDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        onNavigate={(navId) => {
          if (navId === 'appointments') setShowAppointments(true);
          else if (navId === 'prescriptions') setShowPrescriptions(true);
          else if (navId === 'health_records') setShowHealthRecords(true);
          else if (navId === 'medical_reports') setShowMedicalReports(true);
          else if (navId === 'messages') setShowMessages(true);
          else if (navId === 'reminders') setShowClinicalReminders(true);
          else if (navId === 'recalls') setShowClinicalReminders(true);
        }}
        onLogout={handleLogout}
      />
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff'
  },
  topNavBar: {
    width: '100%',
    height: 68,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10
  },
  hamburgerBtn: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  userIdentityColumn: {
    flex: 1,
    justifyContent: 'center'
  },
  portalTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.8,
    marginBottom: 2
  },
  userFullNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2
  },
  avatarBadge: {
    width: 38,
    height: 38,
    borderRadius: 6,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2
  },
  avatarInitialsText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  contentScroll: {
    padding: 20,
    paddingBottom: 36
  },
  statusCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20
  },
  statusCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 4
  },
  statusDescription: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 14
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  gridCard: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12
  },
  cardIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  gridCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 3
  },
  gridCardDesc: {
    fontSize: 12,
    color: '#64748b'
  },
  simpleRemindBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    height: 46,
    borderRadius: 10,
    gap: 8,
    marginTop: 4
  },
  simpleRemindBtnActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0'
  },
  simpleRemindText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '700'
  },
  simpleRemindTextActive: {
    color: '#059669'
  },
  drawerDropdown: {
    position: 'absolute',
    top: 68,
    left: 16,
    width: 220,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 99
  },
  drawerItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 4
  },
  drawerItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b'
  }
});
