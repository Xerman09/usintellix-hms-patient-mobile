import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Image
} from 'react-native';
import { THEME } from '../constants/theme';
import { AuthService } from '../api/auth';
import { ProfileService } from '../api/profile';
import { getAvatarUrl } from '../constants/config';
import {
  MenuIcon,
  CalendarIcon,
  PillIcon,
  RecordsIcon,
  BellIcon,
  ChatIcon,
  ClipboardIcon,
  ChevronRightIcon,
  LabIcon,
  VisitsIcon,
  BillingIcon,
  CheckinIcon,
  TrackHealthIcon,
  ProxyIcon,
  TodoIcon
} from '../components/Icons';
import AppointmentsModal from '../components/AppointmentsModal';
import PrescriptionsModal from '../components/PrescriptionsModal';
import HealthRecordsModal from '../components/HealthRecordsModal';
import MessagesModal from '../components/MessagesModal';
import ClinicalRemindersModal from '../components/ClinicalRemindersModal';
import MedicalReportsModal from '../components/MedicalReportsModal';
import AnnouncementPopupModal from '../components/AnnouncementPopupModal';
import ProxySwitcherModal from '../components/ProxySwitcherModal';
import MyChartTodoModal from '../components/MyChartTodoModal';
import ProfileSettingsScreen from './ProfileSettingsScreen';
import SidebarDrawer from '../components/SidebarDrawer';
import { AnnouncementsService } from '../api/announcements';
import { MyChartService } from '../api/mychart';

export default function PatientDashboardScreen({ user, onLogout }) {
  const [currentView, setCurrentView] = useState('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reminderSet, setReminderSet] = useState(false);
  const [showAppointments, setShowAppointments] = useState(false);
  const [showPrescriptions, setShowPrescriptions] = useState(false);
  const [showHealthRecords, setShowHealthRecords] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showClinicalReminders, setShowClinicalReminders] = useState(false);
  const [showMedicalReports, setShowMedicalReports] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [avatarError, setAvatarError] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncementPopup, setShowAnnouncementPopup] = useState(false);

  // Phase M0: MyChart Core Context & Switcher State
  const [accessiblePatients, setAccessiblePatients] = useState([]);
  const [activePatient, setActivePatient] = useState(null);
  const [showProxySwitcher, setShowProxySwitcher] = useState(false);
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [todoCounts, setTodoCounts] = useState({ total: 0, overdue: 0, todo: 0 });

  const loadMyChartData = async () => {
    try {
      const [proxyRes, todoRes] = await Promise.all([
        MyChartService.getAccessiblePatients(),
        MyChartService.getTodo()
      ]);
      if (proxyRes && proxyRes.success && Array.isArray(proxyRes.data)) {
        setAccessiblePatients(proxyRes.data);
        const active = proxyRes.data.find((p) => p.is_active) || proxyRes.data[0];
        setActivePatient(active);
      }
      if (todoRes && todoRes.success && todoRes.data) {
        setTodoCounts(todoRes.data.counts || { total: 0, overdue: 0, todo: 0 });
      }
    } catch (e) {
      console.warn('Failed to load MyChart data:', e);
    }
  };

  useEffect(() => {
    ProfileService.getProfile().then((res) => {
      if (res && res.success && res.data) {
        setProfileData(res.data);
      }
    }).catch(() => {});

    // Automatically check for active announcements after login
    AnnouncementsService.getActiveAnnouncements().then((res) => {
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        setAnnouncements(res.data);
        setShowAnnouncementPopup(true);
      }
    }).catch((err) => {
      console.warn('Failed to fetch announcements:', err);
    });

    // Phase M0: Load accessible proxy charts & To-Do count
    loadMyChartData();
  }, []);

  const handlePatientSwitched = (patient) => {
    setActivePatient(patient);
    loadMyChartData();
    ProfileService.getProfile().then((res) => {
      if (res && res.success && res.data) {
        setProfileData(res.data);
      }
    });
  };

  const handleMyChartNavigate = (targetTab) => {
    switch (targetTab) {
      case 'mychart_todo':
        setShowTodoModal(true);
        break;
      case 'mychart_account':
        setShowProxySwitcher(true);
        break;
      case 'mychart_results':
        Alert.alert(
          'Phase M1: Test Results',
          'Ready to connect Phase M1! The release gate endpoint /mychart/results is primed.',
          [{ text: 'OK' }]
        );
        break;
      case 'mychart_visits':
        Alert.alert(
          'Phase M3: Visits & Discharge',
          'Visits endpoint /mychart/visits is connected.',
          [{ text: 'OK' }]
        );
        break;
      case 'mychart_billing':
        Alert.alert(
          'Phase M4: Statements & Payments',
          'Billing statement endpoint /mychart/billing is connected.',
          [{ text: 'OK' }]
        );
        break;
      case 'mychart_checkin':
        Alert.alert(
          'Phase M5: e-Check-In',
          'Fast-track e-check-in endpoint /mychart/checkin is connected.',
          [{ text: 'OK' }]
        );
        break;
      case 'mychart_track':
        Alert.alert(
          'Phase M7: Track My Health',
          'Vitals tracking endpoint /mychart/readings is connected.',
          [{ text: 'OK' }]
        );
        break;
      default:
        break;
    }
  };

  const rawAvatar = profileData?.avatar || profileData?.photo || user?.avatar || user?.photo;
  const avatarUrl = getAvatarUrl(rawAvatar);



  // Compute display names and initials
  const currentFirstName = profileData?.first_name || user?.first_name || 'Patient';
  const currentLastName = profileData?.last_name || user?.last_name || 'User';
  const fullName = `${currentFirstName} ${currentLastName}`.trim();
  const initials = `${currentFirstName[0] || 'P'}${currentLastName[0] || ''}`.toUpperCase();
  const patientNo = profileData?.patient_no || user?.patient_no || user?.id || 'PAT-000003';

  const handleLogout = async () => {
    await AuthService.logout();
    onLogout();
  };

  if (currentView === 'profile') {
    return (
      <ProfileSettingsScreen
        user={user}
        onBack={() => setCurrentView('dashboard')}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ================= TOP NAVIGATION BAR ================= */}
      <View style={styles.topNavBar}>
        {/* Left: Hamburger Menu Icon in soft square frame */}
        <TouchableOpacity
          style={styles.hamburgerBtn}
          onPress={() => setDrawerOpen(!drawerOpen)}
          activeOpacity={0.7}
        >
          <MenuIcon color="#0f172a" size={19} />
        </TouchableOpacity>

        {/* Center: Top Portal Label & Bold User Name */}
        <View style={styles.userIdentityColumn}>
          <Text style={styles.portalTagText}>USINTELLIX PATIENT PORTAL</Text>
          <Text style={styles.userFullNameText} numberOfLines={1}>
            {fullName}
          </Text>
        </View>

        {/* Right: Modern Circular Avatar with Online Dot */}
        <TouchableOpacity
          style={styles.avatarBadge}
          onPress={() => setCurrentView('profile')}
          activeOpacity={0.8}
        >
          {avatarUrl && !avatarError ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatarImg}
              onError={() => setAvatarError(true)}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.avatarInitialsText}>{initials}</Text>
          )}
          <View style={styles.onlineStatusDot} />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={styles.contentScroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= PATIENT HERO STATUS BANNER ================= */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroStatusPill}>
              <View style={styles.statusLiveDot} />
              <Text style={styles.heroStatusText}>LIVE EHR SYNCED</Text>
            </View>
            <View style={styles.headerRightBadges}>
              {activePatient && (
                <TouchableOpacity
                  style={styles.proxySwitchChip}
                  onPress={() => setShowProxySwitcher(true)}
                  activeOpacity={0.7}
                >
                  <ProxyIcon color="#5b21b6" size={13} />
                  <Text style={styles.proxySwitchChipText} numberOfLines={1}>
                    {activePatient.first_name} ({activePatient.relationship || 'Self'}) ▾
                  </Text>
                </TouchableOpacity>
              )}
              <View style={styles.mrnBadge}>
                <Text style={styles.mrnBadgeText}>MRN #{patientNo}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.heroGreetingText}>Welcome, {currentFirstName}</Text>
          <Text style={styles.heroSubText}>
            Your health records, prescriptions, and lab charts are synchronized.
          </Text>

          {/* Quick Metrics / Clinical Snapshot Bar */}
          <View style={styles.heroMetricsBar}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>PRIMARY CARE</Text>
              <Text style={styles.metricValue} numberOfLines={1}>Dr. C. Sullivan</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>PORTAL STATUS</Text>
              <Text style={[styles.metricValue, { color: '#059669' }]}>Verified Patient</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>RECORDS</Text>
              <Text style={styles.metricValue}>CCD Active</Text>
            </View>
          </View>
        </View>

        {/* ================= TO-DO & ACTION CENTER ALERT BANNER ================= */}
        {todoCounts.total > 0 && (
          <TouchableOpacity
            style={styles.todoHeroBanner}
            onPress={() => setShowTodoModal(true)}
            activeOpacity={0.8}
          >
            <View style={styles.todoHeroIconBox}>
              <TodoIcon color="#ffffff" size={20} />
            </View>
            <View style={styles.todoHeroTextBox}>
              <View style={styles.todoHeroTitleRow}>
                <Text style={styles.todoHeroTitle}>Action Center</Text>
                {todoCounts.overdue > 0 ? (
                  <View style={styles.todoBadgeRed}>
                    <Text style={styles.todoBadgeRedText}>{todoCounts.overdue} Overdue</Text>
                  </View>
                ) : (
                  <View style={styles.todoBadgeBlue}>
                    <Text style={styles.todoBadgeBlueText}>{todoCounts.total} Tasks</Text>
                  </View>
                )}
              </View>
              <Text style={styles.todoHeroSub} numberOfLines={2}>
                {todoCounts.total} item{todoCounts.total > 1 ? 's' : ''} waiting: unread results, check-in, or payments.
              </Text>
            </View>
            <ChevronRightIcon color="#0891b2" size={16} />
          </TouchableOpacity>
        )}

        {/* ================= MYCHART HEALTHCARE PORTAL SECTION ================= */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionHeaderTitle}>MyChart Portal</Text>
            <Text style={styles.sectionHeaderSub}>Connected Care & EHR</Text>
          </View>
          <TouchableOpacity
            style={styles.todoPillBtn}
            onPress={() => setShowTodoModal(true)}
            activeOpacity={0.7}
          >
            <TodoIcon color="#0891b2" size={14} />
            <Text style={styles.todoPillBtnText}>
              {todoCounts.total > 0 ? `${todoCounts.total} Actions` : 'Action Center'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.myChartGrid}>
          {/* Card 1: Test Results */}
          <TouchableOpacity
            style={styles.myChartCard}
            activeOpacity={0.7}
            onPress={() => handleMyChartNavigate('mychart_results')}
          >
            <View style={[styles.myChartIconBox, { backgroundColor: '#eff6ff' }]}>
              <LabIcon color="#2563eb" size={22} />
            </View>
            <Text style={styles.myChartCardTitle}>Test Results</Text>
            <Text style={styles.myChartCardSub}>Lab & Imaging</Text>
          </TouchableOpacity>

          {/* Card 2: Visits & Summaries */}
          <TouchableOpacity
            style={styles.myChartCard}
            activeOpacity={0.7}
            onPress={() => handleMyChartNavigate('mychart_visits')}
          >
            <View style={[styles.myChartIconBox, { backgroundColor: '#f0f9ff' }]}>
              <VisitsIcon color="#0284c7" size={22} />
            </View>
            <Text style={styles.myChartCardTitle}>Visits & AVS</Text>
            <Text style={styles.myChartCardSub}>Prep & Summaries</Text>
          </TouchableOpacity>

          {/* Card 3: Billing Statements */}
          <TouchableOpacity
            style={styles.myChartCard}
            activeOpacity={0.7}
            onPress={() => handleMyChartNavigate('mychart_billing')}
          >
            <View style={[styles.myChartIconBox, { backgroundColor: '#ecfdf5' }]}>
              <BillingIcon color="#059669" size={22} />
            </View>
            <Text style={styles.myChartCardTitle}>Statements</Text>
            <Text style={styles.myChartCardSub}>Bills & Receipts</Text>
          </TouchableOpacity>

          {/* Card 4: e-Check-In */}
          <TouchableOpacity
            style={styles.myChartCard}
            activeOpacity={0.7}
            onPress={() => handleMyChartNavigate('mychart_checkin')}
          >
            <View style={[styles.myChartIconBox, { backgroundColor: '#fffbeb' }]}>
              <CheckinIcon color="#d97706" size={22} />
            </View>
            <Text style={styles.myChartCardTitle}>e-Check-In</Text>
            <Text style={styles.myChartCardSub}>Fast-Track Pass</Text>
          </TouchableOpacity>

          {/* Card 5: Track Health */}
          <TouchableOpacity
            style={styles.myChartCard}
            activeOpacity={0.7}
            onPress={() => handleMyChartNavigate('mychart_track')}
          >
            <View style={[styles.myChartIconBox, { backgroundColor: '#fff1f2' }]}>
              <TrackHealthIcon color="#e11d48" size={22} />
            </View>
            <Text style={styles.myChartCardTitle}>Track Health</Text>
            <Text style={styles.myChartCardSub}>Vitals & Goals</Text>
          </TouchableOpacity>

          {/* Card 6: Family & Share */}
          <TouchableOpacity
            style={styles.myChartCard}
            activeOpacity={0.7}
            onPress={() => handleMyChartNavigate('mychart_account')}
          >
            <View style={[styles.myChartIconBox, { backgroundColor: '#f5f3ff' }]}>
              <ProxyIcon color="#7c3aed" size={22} />
            </View>
            <Text style={styles.myChartCardTitle}>Family & Share</Text>
            <Text style={styles.myChartCardSub}>Proxy & Links</Text>
          </TouchableOpacity>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Services &amp; Actions</Text>
          <Text style={styles.sectionHeaderSub}>Self-service care</Text>
        </View>

        {/* 4 Interactive Service Action Cards (2x2 Grid) */}
        <View style={styles.cardsGrid}>
          {/* Card 1: Appointments */}
          <TouchableOpacity
            style={styles.gridCard}
            activeOpacity={0.7}
            onPress={() => setShowAppointments(true)}
          >
            <View style={styles.gridCardTopRow}>
              <View style={[styles.cardIconCircle, { backgroundColor: '#eff6ff' }]}>
                <CalendarIcon color="#2563eb" size={20} />
              </View>
              <View style={styles.cardArrowCircle}>
                <ChevronRightIcon color="#94a3b8" size={13} />
              </View>
            </View>
            <Text style={styles.gridCardTitle}>Appointments</Text>
            <Text style={styles.gridCardDesc}>View upcoming visits &amp; schedule</Text>
            <View style={styles.gridCardActionRow}>
              <Text style={[styles.gridCardActionText, { color: '#2563eb' }]}>Manage visits →</Text>
            </View>
          </TouchableOpacity>

          {/* Card 2: Prescriptions */}
          <TouchableOpacity
            style={styles.gridCard}
            activeOpacity={0.7}
            onPress={() => setShowPrescriptions(true)}
          >
            <View style={styles.gridCardTopRow}>
              <View style={[styles.cardIconCircle, { backgroundColor: '#f5f3ff' }]}>
                <PillIcon color="#7c3aed" size={20} />
              </View>
              <View style={styles.cardArrowCircle}>
                <ChevronRightIcon color="#94a3b8" size={13} />
              </View>
            </View>
            <Text style={styles.gridCardTitle}>Prescriptions</Text>
            <Text style={styles.gridCardDesc}>Active medications &amp; refills</Text>
            <View style={styles.gridCardActionRow}>
              <Text style={[styles.gridCardActionText, { color: '#7c3aed' }]}>Active Rx →</Text>
            </View>
          </TouchableOpacity>

          {/* Card 3: Health Records */}
          <TouchableOpacity
            style={styles.gridCard}
            activeOpacity={0.7}
            onPress={() => setShowHealthRecords(true)}
          >
            <View style={styles.gridCardTopRow}>
              <View style={[styles.cardIconCircle, { backgroundColor: '#ecfdf5' }]}>
                <RecordsIcon color="#059669" size={20} />
              </View>
              <View style={styles.cardArrowCircle}>
                <ChevronRightIcon color="#94a3b8" size={13} />
              </View>
            </View>
            <Text style={styles.gridCardTitle}>Health Records</Text>
            <Text style={styles.gridCardDesc}>Lab results &amp; CCD charts</Text>
            <View style={styles.gridCardActionRow}>
              <Text style={[styles.gridCardActionText, { color: '#059669' }]}>View chart →</Text>
            </View>
          </TouchableOpacity>

          {/* Card 4: Messages */}
          <TouchableOpacity
            style={styles.gridCard}
            activeOpacity={0.7}
            onPress={() => setShowMessages(true)}
          >
            <View style={styles.gridCardTopRow}>
              <View style={[styles.cardIconCircle, { backgroundColor: '#f0f9ff' }]}>
                <ChatIcon color="#0284c7" size={20} />
              </View>
              <View style={styles.cardArrowCircle}>
                <ChevronRightIcon color="#94a3b8" size={13} />
              </View>
            </View>
            <Text style={styles.gridCardTitle}>Messages</Text>
            <Text style={styles.gridCardDesc}>Direct secure care team chat</Text>
            <View style={styles.gridCardActionRow}>
              <Text style={[styles.gridCardActionText, { color: '#0284c7' }]}>Open chat →</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ================= CLINICAL REMINDERS CARD ================= */}
        <TouchableOpacity
          style={styles.featuredRemindCard}
          onPress={() => setShowClinicalReminders(true)}
          activeOpacity={0.8}
        >
          <View style={styles.featuredRemindIconBox}>
            <BellIcon color="#0d9488" size={20} />
          </View>
          <View style={styles.featuredRemindContent}>
            <View style={styles.featuredRemindHeaderRow}>
              <Text style={styles.featuredRemindTitle}>Clinical Reminders &amp; Guidelines</Text>
              <View style={styles.preventiveBadge}>
                <Text style={styles.preventiveBadgeText}>USPSTF</Text>
              </View>
            </View>
            <Text style={styles.featuredRemindDesc}>
              Preventive care guidelines, wellness alerts &amp; screenings
            </Text>
          </View>
          <ChevronRightIcon color="#0d9488" size={16} />
        </TouchableOpacity>

        {/* ================= MEDICAL REPORTS CARD ================= */}
        <TouchableOpacity
          style={styles.featuredReportCard}
          onPress={() => setShowMedicalReports(true)}
          activeOpacity={0.8}
        >
          <View style={styles.featuredReportIconBox}>
            <ClipboardIcon color="#4f46e5" size={20} />
          </View>
          <View style={styles.featuredReportContent}>
            <Text style={styles.featuredReportTitle}>Medical Reports &amp; Summaries</Text>
            <Text style={styles.featuredReportDesc}>
              Safe Harbor de-identification &amp; Summary of Care exports
            </Text>
          </View>
          <ChevronRightIcon color="#94a3b8" size={16} />
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

      {/* Automatic Announcement Broadcast Popup Modal */}
      <AnnouncementPopupModal
        visible={showAnnouncementPopup}
        announcements={announcements}
        onClose={() => setShowAnnouncementPopup(false)}
      />

      {/* Proxy / Family Switcher Bottom Sheet */}
      <ProxySwitcherModal
        visible={showProxySwitcher}
        onClose={() => setShowProxySwitcher(false)}
        accessiblePatients={accessiblePatients}
        currentPatientId={activePatient?.patient_id}
        onPatientSwitched={handlePatientSwitched}
      />

      {/* MyChart Action Center To-Do Modal */}
      <MyChartTodoModal
        visible={showTodoModal}
        onClose={() => setShowTodoModal(false)}
        onNavigateTab={(tab) => {
          if (tab === 'mychart_results') handleMyChartNavigate('mychart_results');
          else if (tab === 'mychart_checkin') handleMyChartNavigate('mychart_checkin');
          else if (tab === 'mychart_billing') handleMyChartNavigate('mychart_billing');
          else if (tab === 'mychart_visits') handleMyChartNavigate('mychart_visits');
          else if (tab === 'messages') setShowMessages(true);
        }}
      />

      {/* Full-Height Modern Sidebar Navigation Drawer */}
      <SidebarDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={{ ...user, ...(profileData || {}), avatarUrl }}
        onNavigate={(navId) => {
          if (navId === 'mychart_todo') setShowTodoModal(true);
          else if (navId === 'mychart_account') setShowProxySwitcher(true);
          else if (navId.startsWith('mychart_')) handleMyChartNavigate(navId);
          else if (navId === 'appointments') setShowAppointments(true);
          else if (navId === 'prescriptions') setShowPrescriptions(true);
          else if (navId === 'health_records') setShowHealthRecords(true);
          else if (navId === 'medical_reports') setShowMedicalReports(true);
          else if (navId === 'messages') setShowMessages(true);
          else if (navId === 'reminders') setShowClinicalReminders(true);
          else if (navId === 'recalls') setShowClinicalReminders(true);
          else if (navId === 'announcements') {
            if (announcements.length > 0) {
              setShowAnnouncementPopup(true);
            } else {
              AnnouncementsService.getActiveAnnouncements().then((res) => {
                if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
                  setAnnouncements(res.data);
                  setShowAnnouncementPopup(true);
                } else {
                  Alert.alert('Announcements', 'No active hospital announcements at this time.');
                }
              });
            }
          }
          else if (navId === 'settings' || navId === 'profile') setCurrentView('profile');
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
    backgroundColor: '#f8fafc'
  },
  topNavBar: {
    width: '100%',
    height: 70,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10
  },
  hamburgerBtn: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  userIdentityColumn: {
    flex: 1,
    justifyContent: 'center'
  },
  portalTagText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0284c7',
    letterSpacing: 0.8,
    marginBottom: 2
  },
  userFullNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3
  },
  avatarBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
    position: 'relative'
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 21
  },
  avatarInitialsText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  onlineStatusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff'
  },
  contentScroll: {
    padding: 20,
    paddingBottom: 40
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  heroStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20
  },
  statusLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10b981'
  },
  heroStatusText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.5
  },
  mrnBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6
  },
  mrnBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb'
  },
  heroGreetingText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 3,
    letterSpacing: -0.3
  },
  heroSubText: {
    fontSize: 12.5,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 14
  },
  heroMetricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    paddingVertical: 9,
    paddingHorizontal: 12
  },
  metricItem: {
    flex: 1,
    alignItems: 'center'
  },
  metricLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 2
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b'
  },
  metricDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#e2e8f0'
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
    paddingHorizontal: 2
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3
  },
  sectionHeaderSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94a3b8'
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  gridCard: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1
  },
  gridCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  cardIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardArrowCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center'
  },
  gridCardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 3
  },
  gridCardDesc: {
    fontSize: 11.5,
    color: '#64748b',
    lineHeight: 16,
    marginBottom: 10
  },
  gridCardActionRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  gridCardActionText: {
    fontSize: 11.5,
    fontWeight: '700'
  },
  featuredRemindCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#ccfbf1',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1
  },
  featuredRemindIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  featuredRemindContent: {
    flex: 1,
    marginRight: 8
  },
  featuredRemindHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3
  },
  featuredRemindTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f766e'
  },
  preventiveBadge: {
    backgroundColor: '#0d9488',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4
  },
  preventiveBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#ffffff'
  },
  featuredRemindDesc: {
    fontSize: 11.5,
    color: '#115e59',
    lineHeight: 16
  },
  featuredReportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1
  },
  featuredReportIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  featuredReportContent: {
    flex: 1,
    marginRight: 8
  },
  featuredReportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2
  },
  featuredReportDesc: {
    fontSize: 11.5,
    color: '#64748b',
    lineHeight: 16
  },
  headerRightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  proxySwitchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ede9fe',
    borderWidth: 1,
    borderColor: '#ddd6fe',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: 130
  },
  proxySwitchChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#6d28d9'
  },
  todoHeroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0891b2',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#0891b2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2
  },
  todoHeroIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  todoHeroTextBox: {
    flex: 1,
    marginRight: 8
  },
  todoHeroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2
  },
  todoHeroTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff'
  },
  todoBadgeRed: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6
  },
  todoBadgeRedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff'
  },
  todoBadgeBlue: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6
  },
  todoBadgeBlueText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff'
  },
  todoHeroSub: {
    fontSize: 11.5,
    color: '#cffafe',
    lineHeight: 15
  },
  todoPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfeff',
    borderWidth: 1,
    borderColor: '#cffafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  todoPillBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0891b2'
  },
  myChartGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20
  },
  myChartCard: {
    width: '31.3%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1
  },
  myChartIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  myChartCardTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center'
  },
  myChartCardSub: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 2
  }
});
