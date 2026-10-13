import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { ProfileService } from '../api/profile';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  SettingsIcon,
  EditIcon,
  CheckCircleIcon,
  LogOutIcon,
  ShieldIcon,
  LockIcon,
  MailIcon
} from '../components/Icons';

export default function ProfileSettingsScreen({
  user,
  onBack,
  onLogout
}) {
  // 'menu' (first page with list) | 'profile' | 'settings'
  const [currentSection, setCurrentSection] = useState('menu');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Profile Edit Form State
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    contact_email: '',
    mobile_phone: '',
    home_phone: '',
    work_phone: '',
    address_line: '',
    city: '',
    province: '',
    zip_code: ''
  });

  // Password Change Form State
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  // Notification Preferences State
  const [preferences, setPreferences] = useState({
    smsAlerts: true,
    emailSummaries: true,
    clinicalGuidelines: true,
    careTeamMessages: true
  });

  // Load profile upon mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await ProfileService.getProfile();
      if (res && res.success && res.data) {
        setProfileData(res.data);
        populateFormData(res.data);
      } else {
        // Fallback to logged-in user session data
        const fallback = {
          first_name: user?.first_name || 'Patient',
          middle_name: user?.middle_name || '',
          last_name: user?.last_name || 'User',
          patient_no: user?.patient_no || user?.id || '1',
          username: user?.username || 'patient',
          contact_email: user?.email || '',
          mobile_phone: user?.phone || '',
          address_line: '',
          city: '',
          province: '',
          zip_code: ''
        };
        setProfileData(fallback);
        populateFormData(fallback);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const populateFormData = (data) => {
    setFormData({
      first_name: data.first_name || '',
      middle_name: data.middle_name || '',
      last_name: data.last_name || '',
      suffix: data.suffix || '',
      contact_email: data.contact_email || data.email || '',
      mobile_phone: data.mobile_phone || data.phone || '',
      home_phone: data.home_phone || '',
      work_phone: data.work_phone || '',
      address_line: data.address_line || '',
      city: data.city || '',
      province: data.province || '',
      zip_code: data.zip_code || ''
    });
  };

  const handleSaveProfile = async () => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setStatusMessage({ type: 'error', text: 'First name and last name are required.' });
      return;
    }

    setLoading(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const res = await ProfileService.updateProfile(formData);
      if (res && res.success) {
        setStatusMessage({ type: 'success', text: 'Profile updated successfully.' });
        setIsEditing(false);
        setProfileData((prev) => ({
          ...prev,
          ...formData
        }));
      } else {
        setStatusMessage({
          type: 'error',
          text: res?.message || 'Failed to update profile. Please verify all inputs.'
        });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Network error while saving profile.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMessage({ type: '', text: '' });

    if (!passwordData.current_password || !passwordData.new_password) {
      setPasswordMessage({ type: 'error', text: 'Please enter both current and new passwords.' });
      return;
    }

    if (passwordData.new_password.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordMessage({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await ProfileService.changePassword(
        passwordData.current_password,
        passwordData.new_password
      );

      if (res && res.success) {
        setPasswordMessage({ type: 'success', text: 'Password successfully updated!' });
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        setPasswordMessage({
          type: 'error',
          text: res?.message || 'Password update failed. Verify your current password.'
        });
      }
    } catch (err) {
      setPasswordMessage({ type: 'error', text: 'Network error while changing password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const firstName = profileData?.first_name || user?.first_name || 'Patient';
  const lastName = profileData?.last_name || user?.last_name || 'User';
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = `${firstName[0] || 'P'}${lastName[0] || ''}`.toUpperCase();
  const patientNo = profileData?.patient_no || user?.id || '1';

  return (
    <SafeAreaView style={styles.container}>
      {/* ================= TOP NAVIGATION BAR ================= */}
      <View style={styles.topNavBar}>
        {/* Left: Back Arrow Button */}
        {currentSection === 'menu' ? (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <ChevronLeftIcon color="#0f172a" size={18} />
            <Text style={styles.backBtnText}>Dashboard</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              setCurrentSection('menu');
              setIsEditing(false);
              setStatusMessage({ type: '', text: '' });
              setPasswordMessage({ type: '', text: '' });
            }}
            activeOpacity={0.7}
          >
            <ChevronLeftIcon color="#0f172a" size={18} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        )}

        {/* Center: Title */}
        <View style={styles.titleColumn}>
          <Text style={styles.portalTagText}>USINTELLIX PATIENT PORTAL</Text>
          <Text style={styles.pageTitleText}>
            {currentSection === 'menu'
              ? 'Profile & Settings'
              : currentSection === 'profile'
              ? 'Profile'
              : 'Setting and privacy'}
          </Text>
        </View>

        {/* Right: Initials Badge */}
        <View style={styles.avatarBadge}>
          <Text style={styles.avatarInitialsText}>{initials}</Text>
        </View>
      </View>

      {/* Page Body Scrollable Area */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentScrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageMaxContainer}>
          {/* ================= VIEW 1: FIRST MENU LIST ================= */}
          {currentSection === 'menu' && (
            <View>
              {/* Patient Identity Top Card */}
              <View style={styles.menuHeaderCard}>
                <View style={styles.avatarLargeCircle}>
                  <Text style={styles.avatarLargeText}>{initials}</Text>
                </View>
                <View style={styles.menuIdentityCol}>
                  <Text style={styles.menuFullName}>{fullName}</Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.patientIdBadge}>
                      <Text style={styles.patientIdText}>MRN #{patientNo}</Text>
                    </View>
                    <View style={styles.activeStatusBadge}>
                      <Text style={styles.activeStatusText}>Active Patient</Text>
                    </View>
                  </View>
                  <Text style={styles.menuContactText}>
                    {profileData?.contact_email || profileData?.email || user?.email || 'patient@hospital.org'}
                  </Text>
                </View>
              </View>

              {/* Section Tag */}
              <Text style={styles.listSectionTitle}>ACCOUNT &amp; PREFERENCES</Text>

              {/* The List: Profile, Setting and privacy, logout */}
              <View style={styles.menuListCard}>
                {/* Item 1: Profile */}
                <TouchableOpacity
                  style={styles.menuListItem}
                  onPress={() => {
                    setCurrentSection('profile');
                    setIsEditing(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuListItemIconBox, { backgroundColor: '#eff6ff' }]}>
                    <UserIcon color="#2563eb" size={20} />
                  </View>
                  <View style={styles.menuListItemTextCol}>
                    <Text style={styles.menuListItemTitle}>Profile</Text>
                    <Text style={styles.menuListItemDesc}>
                      Personal demographics, contact info, insurance &amp; care choices
                    </Text>
                  </View>
                  <ChevronRightIcon color="#94a3b8" size={16} />
                </TouchableOpacity>

                <View style={styles.menuItemDivider} />

                {/* Item 2: Setting and privacy */}
                <TouchableOpacity
                  style={styles.menuListItem}
                  onPress={() => {
                    setCurrentSection('settings');
                    setPasswordMessage({ type: '', text: '' });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuListItemIconBox, { backgroundColor: '#f0fdfa' }]}>
                    <SettingsIcon color="#0d9488" size={20} />
                  </View>
                  <View style={styles.menuListItemTextCol}>
                    <Text style={styles.menuListItemTitle}>Setting and privacy</Text>
                    <Text style={styles.menuListItemDesc}>
                      Password credentials, notification alerts &amp; HIPAA security
                    </Text>
                  </View>
                  <ChevronRightIcon color="#94a3b8" size={16} />
                </TouchableOpacity>

                <View style={styles.menuItemDivider} />

                {/* Item 3: logout */}
                <TouchableOpacity
                  style={styles.menuListItem}
                  onPress={onLogout}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuListItemIconBox, { backgroundColor: '#fef2f2' }]}>
                    <LogOutIcon color="#dc2626" size={19} />
                  </View>
                  <View style={styles.menuListItemTextCol}>
                    <Text style={[styles.menuListItemTitle, { color: '#dc2626' }]}>logout</Text>
                    <Text style={styles.menuListItemDesc}>
                      Sign out of your active workstation session
                    </Text>
                  </View>
                  <ChevronRightIcon color="#f87171" size={16} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ================= VIEW 2: PROFILE PAGE ================= */}
          {currentSection === 'profile' && (
            <View>
              {/* Patient Identity Banner */}
              <View style={styles.profileHeaderCard}>
                <View style={styles.avatarLargeCircle}>
                  <Text style={styles.avatarLargeText}>{initials}</Text>
                </View>

                <View style={styles.profileIdentityCol}>
                  <Text style={styles.profileFullName}>{fullName}</Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.patientIdBadge}>
                      <Text style={styles.patientIdText}>MRN #{patientNo}</Text>
                    </View>
                    <View style={styles.activeStatusBadge}>
                      <Text style={styles.activeStatusText}>Active Patient</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.editToggleBtn, isEditing && styles.editToggleBtnActive]}
                  onPress={() => {
                    if (isEditing) {
                      populateFormData(profileData || {});
                    }
                    setIsEditing(!isEditing);
                  }}
                  activeOpacity={0.7}
                >
                  <EditIcon color={isEditing ? '#ffffff' : '#2563eb'} size={15} />
                  <Text style={[styles.editToggleBtnText, isEditing && styles.editToggleBtnTextActive]}>
                    {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Status Message Alert */}
              {statusMessage.text ? (
                <View
                  style={[
                    styles.alertBox,
                    statusMessage.type === 'error' ? styles.alertBoxError : styles.alertBoxSuccess
                  ]}
                >
                  <Text
                    style={[
                      styles.alertText,
                      statusMessage.type === 'error' ? styles.alertTextError : styles.alertTextSuccess
                    ]}
                  >
                    {statusMessage.text}
                  </Text>
                </View>
              ) : null}

              {/* Loading Indicator */}
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#2563eb" />
                  <Text style={styles.loadingText}>Syncing patient records...</Text>
                </View>
              )}

              {/* EDIT MODE FORM */}
              {isEditing ? (
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionCardHeader}>Edit Personal &amp; Contact Details</Text>

                  <View style={styles.formRow}>
                    <View style={styles.formCol}>
                      <Text style={styles.inputLabel}>First Name *</Text>
                      <TextInput
                        style={styles.textInput}
                        value={formData.first_name}
                        onChangeText={(t) => setFormData({ ...formData, first_name: t })}
                        placeholder="First Name"
                      />
                    </View>
                    <View style={styles.formCol}>
                      <Text style={styles.inputLabel}>Middle Name</Text>
                      <TextInput
                        style={styles.textInput}
                        value={formData.middle_name}
                        onChangeText={(t) => setFormData({ ...formData, middle_name: t })}
                        placeholder="Middle Name"
                      />
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={styles.formCol}>
                      <Text style={styles.inputLabel}>Last Name *</Text>
                      <TextInput
                        style={styles.textInput}
                        value={formData.last_name}
                        onChangeText={(t) => setFormData({ ...formData, last_name: t })}
                        placeholder="Last Name"
                      />
                    </View>
                    <View style={styles.formCol}>
                      <Text style={styles.inputLabel}>Suffix</Text>
                      <TextInput
                        style={styles.textInput}
                        value={formData.suffix}
                        onChangeText={(t) => setFormData({ ...formData, suffix: t })}
                        placeholder="e.g. Jr., Sr., III"
                      />
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={styles.formCol}>
                      <Text style={styles.inputLabel}>Mobile Phone</Text>
                      <TextInput
                        style={styles.textInput}
                        value={formData.mobile_phone}
                        onChangeText={(t) => setFormData({ ...formData, mobile_phone: t })}
                        placeholder="555-123-4567"
                        keyboardType="phone-pad"
                      />
                    </View>
                    <View style={styles.formCol}>
                      <Text style={styles.inputLabel}>Contact Email</Text>
                      <TextInput
                        style={styles.textInput}
                        value={formData.contact_email}
                        onChangeText={(t) => setFormData({ ...formData, contact_email: t })}
                        placeholder="patient@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={styles.formCol}>
                      <Text style={styles.inputLabel}>Home Phone</Text>
                      <TextInput
                        style={styles.textInput}
                        value={formData.home_phone}
                        onChangeText={(t) => setFormData({ ...formData, home_phone: t })}
                        placeholder="Home Phone"
                        keyboardType="phone-pad"
                      />
                    </View>
                    <View style={styles.formCol}>
                      <Text style={styles.inputLabel}>Work Phone</Text>
                      <TextInput
                        style={styles.textInput}
                        value={formData.work_phone}
                        onChangeText={(t) => setFormData({ ...formData, work_phone: t })}
                        placeholder="Work Phone"
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>

                  <View style={styles.formFullCol}>
                    <Text style={styles.inputLabel}>Street Address</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.address_line}
                      onChangeText={(t) => setFormData({ ...formData, address_line: t })}
                      placeholder="Street Address"
                    />
                  </View>

                  <View style={styles.formRow}>
                    <View style={styles.formCol}>
                      <Text style={styles.inputLabel}>City</Text>
                      <TextInput
                        style={styles.textInput}
                        value={formData.city}
                        onChangeText={(t) => setFormData({ ...formData, city: t })}
                        placeholder="City"
                      />
                    </View>
                    <View style={styles.formCol}>
                      <Text style={styles.inputLabel}>State / Province</Text>
                      <TextInput
                        style={styles.textInput}
                        value={formData.province}
                        onChangeText={(t) => setFormData({ ...formData, province: t })}
                        placeholder="State"
                      />
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={styles.formCol}>
                      <Text style={styles.inputLabel}>Postal / Zip Code</Text>
                      <TextInput
                        style={styles.textInput}
                        value={formData.zip_code}
                        onChangeText={(t) => setFormData({ ...formData, zip_code: t })}
                        placeholder="Zip Code"
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.saveProfileBtn}
                    onPress={handleSaveProfile}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.saveProfileBtnText}>
                      {loading ? 'Saving Changes...' : 'Save Profile Changes'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* VIEW MODE: SYSTEM EHR SECTIONS */
                <View style={styles.viewSectionsCol}>
                  {/* SECTION 1: WHO / DEMOGRAPHICS */}
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionCardHeader}>Demographics (Who)</Text>
                    <View style={styles.gridFields}>
                      <View style={styles.gridField}>
                        <Text style={styles.fieldLabel}>Full Name</Text>
                        <Text style={styles.fieldValue}>{fullName}</Text>
                      </View>
                      <View style={styles.gridField}>
                        <Text style={styles.fieldLabel}>External ID / MRN</Text>
                        <Text style={styles.fieldValue}>{profileData?.patient_no || user?.id || '1'}</Text>
                      </View>
                      <View style={styles.gridField}>
                        <Text style={styles.fieldLabel}>Date of Birth</Text>
                        <Text style={styles.fieldValue}>{profileData?.birthdate || '1972-02-09'}</Text>
                      </View>
                      <View style={styles.gridField}>
                        <Text style={styles.fieldLabel}>Birth Sex</Text>
                        <Text style={styles.fieldValue}>{profileData?.sex || 'Male'}</Text>
                      </View>
                      <View style={styles.gridField}>
                        <Text style={styles.fieldLabel}>Civil Status</Text>
                        <Text style={styles.fieldValue}>{profileData?.civil_status || 'Single'}</Text>
                      </View>
                      <View style={styles.gridField}>
                        <Text style={styles.fieldLabel}>Blood Type</Text>
                        <Text style={styles.fieldValue}>{profileData?.blood_type || 'O+'}</Text>
                      </View>
                    </View>
                  </View>

                  {/* SECTION 2: CONTACT INFORMATION */}
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionCardHeader}>Contact Information</Text>
                    <View style={styles.gridFields}>
                      <View style={styles.gridField}>
                        <Text style={styles.fieldLabel}>Street Address</Text>
                        <Text style={styles.fieldValue}>
                          {profileData?.address_line || '6666 String Street'}
                        </Text>
                      </View>
                      <View style={styles.gridField}>
                        <Text style={styles.fieldLabel}>City, State &amp; Zip</Text>
                        <Text style={styles.fieldValue}>
                          {`${profileData?.city || 'Longview'}, ${profileData?.province || 'FL'} ${profileData?.zip_code || '44433'}`}
                        </Text>
                      </View>
                      <View style={styles.gridField}>
                        <Text style={styles.fieldLabel}>Mobile Phone</Text>
                        <Text style={styles.fieldValue}>
                          {profileData?.mobile_phone || user?.phone || '222-444-2222'}
                        </Text>
                      </View>
                      <View style={styles.gridField}>
                        <Text style={styles.fieldLabel}>Contact Email</Text>
                        <Text style={styles.fieldValue}>
                          {profileData?.contact_email || profileData?.email || user?.email || 'patient@example.com'}
                        </Text>
                      </View>
                      <View style={styles.gridField}>
                        <Text style={styles.fieldLabel}>Home Phone</Text>
                        <Text style={styles.fieldValue}>{profileData?.home_phone || '333-444-2222'}</Text>
                      </View>
                      <View style={styles.gridField}>
                        <Text style={styles.fieldLabel}>Emergency Contact</Text>
                        <Text style={styles.fieldValue}>Wilma (222-333-4444)</Text>
                      </View>
                    </View>
                  </View>

                  {/* SECTION 3: CARE CHOICES & HIPAA */}
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionCardHeader}>Care Choices &amp; HIPAA Consent</Text>
                    <View style={styles.gridFields}>
                      <View style={styles.gridField}>
                        <Text style={styles.fieldLabel}>Assigned Provider</Text>
                        <Text style={styles.fieldValue}>Dr. Charlie Sullivan, MD</Text>
                      </View>
                      <View style={styles.gridField}>
                        <Text style={styles.fieldLabel}>HIPAA Notice Received</Text>
                        <Text style={[styles.fieldValue, { color: '#16a34a' }]}>YES (Acknowledged)</Text>
                      </View>
                      <View style={styles.gridField}>
                        <Text style={styles.fieldLabel}>Allow SMS Reminders</Text>
                        <Text style={styles.fieldValue}>YES</Text>
                      </View>
                      <View style={styles.gridField}>
                        <Text style={styles.fieldLabel}>Allow Email Alerts</Text>
                        <Text style={styles.fieldValue}>YES</Text>
                      </View>
                      <View style={styles.gridField}>
                        <Text style={styles.fieldLabel}>Health Info Exchange (HIE)</Text>
                        <Text style={styles.fieldValue}>YES</Text>
                      </View>
                      <View style={styles.gridField}>
                        <Text style={styles.fieldLabel}>Patient Portal Access</Text>
                        <Text style={[styles.fieldValue, { color: '#2563eb' }]}>YES (Active)</Text>
                      </View>
                    </View>
                  </View>

                  {/* SECTION 4: PRIMARY INSURANCE */}
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionCardHeader}>Primary Insurance</Text>
                    <View style={styles.gridFields}>
                      <View style={styles.gridField}>
                        <Text style={styles.fieldLabel}>Insurance Provider</Text>
                        <Text style={styles.fieldValue}>Aetna Health</Text>
                      </View>
                      <View style={styles.gridField}>
                        <Text style={styles.fieldLabel}>Plan Name</Text>
                        <Text style={styles.fieldValue}>Choice POS II</Text>
                      </View>
                      <View style={styles.gridField}>
                        <Text style={styles.fieldLabel}>Policy / Member ID</Text>
                        <Text style={styles.fieldValue}>555-982103</Text>
                      </View>
                      <View style={styles.gridField}>
                        <Text style={styles.fieldLabel}>Group Number</Text>
                        <Text style={styles.fieldValue}>GRP-44490</Text>
                      </View>
                      <View style={styles.gridField}>
                        <Text style={styles.fieldLabel}>Subscriber</Text>
                        <Text style={styles.fieldValue}>{fullName} (Self)</Text>
                      </View>
                      <View style={styles.gridField}>
                        <Text style={styles.fieldLabel}>Coverage Status</Text>
                        <Text style={[styles.fieldValue, { color: '#16a34a' }]}>Active • In-Network</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* ================= VIEW 3: SETTING AND PRIVACY ================= */}
          {currentSection === 'settings' && (
            <View style={styles.viewSectionsCol}>
              {/* 1. PASSWORD UPDATE SECTION */}
              <View style={styles.sectionCard}>
                <View style={styles.cardHeaderRow}>
                  <LockIcon color="#2563eb" size={19} />
                  <Text style={styles.sectionCardHeaderInline}>Security Credentials</Text>
                </View>
                <Text style={styles.sectionCardSubtitle}>
                  Update your patient portal login password. Password must be at least 8 characters.
                </Text>

                {passwordMessage.text ? (
                  <View
                    style={[
                      styles.alertBox,
                      passwordMessage.type === 'error' ? styles.alertBoxError : styles.alertBoxSuccess
                    ]}
                  >
                    <Text
                      style={[
                        styles.alertText,
                        passwordMessage.type === 'error' ? styles.alertTextError : styles.alertTextSuccess
                      ]}
                    >
                      {passwordMessage.text}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.formFullCol}>
                  <Text style={styles.inputLabel}>Current Password *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={passwordData.current_password}
                    onChangeText={(t) => setPasswordData({ ...passwordData, current_password: t })}
                    placeholder="••••••••"
                    secureTextEntry={true}
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>New Password *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={passwordData.new_password}
                      onChangeText={(t) => setPasswordData({ ...passwordData, new_password: t })}
                      placeholder="At least 8 characters"
                      secureTextEntry={true}
                    />
                  </View>
                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Confirm New Password *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={passwordData.confirm_password}
                      onChangeText={(t) => setPasswordData({ ...passwordData, confirm_password: t })}
                      placeholder="Confirm new password"
                      secureTextEntry={true}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.updatePasswordBtn}
                  onPress={handleChangePassword}
                  disabled={passwordLoading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.updatePasswordBtnText}>
                    {passwordLoading ? 'Updating Password...' : 'Update Password'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 2. NOTIFICATION PREFERENCES */}
              <View style={styles.sectionCard}>
                <View style={styles.cardHeaderRow}>
                  <MailIcon color="#0d9488" size={19} />
                  <Text style={styles.sectionCardHeaderInline}>Notification Preferences</Text>
                </View>
                <Text style={styles.sectionCardSubtitle}>
                  Choose how USIntellix communicates appointment updates and clinical notices.
                </Text>

                <TouchableOpacity
                  style={styles.preferenceRow}
                  onPress={() => setPreferences({ ...preferences, smsAlerts: !preferences.smsAlerts })}
                  activeOpacity={0.7}
                >
                  <View style={styles.prefTextCol}>
                    <Text style={styles.prefTitle}>SMS Appointment Reminders</Text>
                    <Text style={styles.prefSub}>Automated SMS reminders 24 hours prior to visit</Text>
                  </View>
                  <View style={[styles.togglePill, preferences.smsAlerts && styles.togglePillActive]}>
                    <View style={[styles.toggleDot, preferences.smsAlerts && styles.toggleDotActive]} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.preferenceRow}
                  onPress={() => setPreferences({ ...preferences, emailSummaries: !preferences.emailSummaries })}
                  activeOpacity={0.7}
                >
                  <View style={styles.prefTextCol}>
                    <Text style={styles.prefTitle}>Email Care Summaries</Text>
                    <Text style={styles.prefSub}>Secure email notice when CCD/Clinical summaries are updated</Text>
                  </View>
                  <View style={[styles.togglePill, preferences.emailSummaries && styles.togglePillActive]}>
                    <View style={[styles.toggleDot, preferences.emailSummaries && styles.toggleDotActive]} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.preferenceRow}
                  onPress={() => setPreferences({ ...preferences, clinicalGuidelines: !preferences.clinicalGuidelines })}
                  activeOpacity={0.7}
                >
                  <View style={styles.prefTextCol}>
                    <Text style={styles.prefTitle}>Preventive USPSTF Guidelines</Text>
                    <Text style={styles.prefSub}>Alerts for annual wellness visits and age-based screenings</Text>
                  </View>
                  <View style={[styles.togglePill, preferences.clinicalGuidelines && styles.togglePillActive]}>
                    <View style={[styles.toggleDot, preferences.clinicalGuidelines && styles.toggleDotActive]} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.preferenceRow}
                  onPress={() => setPreferences({ ...preferences, careTeamMessages: !preferences.careTeamMessages })}
                  activeOpacity={0.7}
                >
                  <View style={styles.prefTextCol}>
                    <Text style={styles.prefTitle}>Care Team Direct Messages</Text>
                    <Text style={styles.prefSub}>Notice when your physician or nurse care coordinator replies</Text>
                  </View>
                  <View style={[styles.togglePill, preferences.careTeamMessages && styles.togglePillActive]}>
                    <View style={[styles.toggleDot, preferences.careTeamMessages && styles.toggleDotActive]} />
                  </View>
                </TouchableOpacity>
              </View>

              {/* 3. SECURITY & COMPLIANCE */}
              <View style={styles.sectionCard}>
                <View style={styles.cardHeaderRow}>
                  <ShieldIcon color="#16a34a" size={19} />
                  <Text style={styles.sectionCardHeaderInline}>Security &amp; Compliance</Text>
                </View>
                <View style={styles.complianceList}>
                  <View style={styles.complianceRow}>
                    <CheckCircleIcon color="#16a34a" size={17} />
                    <Text style={styles.complianceText}>Two-Factor Authentication (2FA) is enabled &amp; enforced</Text>
                  </View>
                  <View style={styles.complianceRow}>
                    <CheckCircleIcon color="#16a34a" size={17} />
                    <Text style={styles.complianceText}>HIPAA § 164.312 End-to-End TLS 256-bit encryption</Text>
                  </View>
                  <View style={styles.complianceRow}>
                    <CheckCircleIcon color="#16a34a" size={17} />
                    <Text style={styles.complianceText}>Notice of Privacy Practices (NPP) electronically signed</Text>
                  </View>
                </View>
              </View>

              {/* 4. SIGN OUT BUTTON */}
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={onLogout}
                activeOpacity={0.8}
              >
                <LogOutIcon color="#dc2626" size={18} />
                <Text style={styles.logoutBtnText}>Sign Out Workstation</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
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
    height: 68,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 8
  },
  backBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0f172a'
  },
  titleColumn: {
    alignItems: 'center'
  },
  portalTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284c7',
    letterSpacing: 0.8
  },
  pageTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 1
  },
  avatarBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0d9488',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarInitialsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff'
  },
  contentScroll: {
    flex: 1,
    width: '100%'
  },
  contentScrollContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16
  },
  pageMaxContainer: {
    width: '100%',
    maxWidth: 760
  },
  // Menu First View Styles
  menuHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  menuIdentityCol: {
    flex: 1,
    marginLeft: 16
  },
  menuFullName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a'
  },
  menuContactText: {
    fontSize: 12.5,
    color: '#64748b',
    marginTop: 4
  },
  listSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingHorizontal: 4
  },
  menuListCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 24
  },
  menuListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18
  },
  menuListItemIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  menuListItemTextCol: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10
  },
  menuListItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a'
  },
  menuListItemDesc: {
    fontSize: 12.5,
    color: '#64748b',
    marginTop: 2
  },
  menuItemDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginLeft: 76
  },
  // Profile Detail & Edit Styles
  profileHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  avatarLargeCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#0d9488',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarLargeText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff'
  },
  profileIdentityCol: {
    flex: 1,
    marginLeft: 16
  },
  profileFullName: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0f172a'
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6
  },
  patientIdBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  patientIdText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0369a1'
  },
  activeStatusBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  activeStatusText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#15803d'
  },
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8
  },
  editToggleBtnActive: {
    backgroundColor: '#64748b',
    borderColor: '#64748b'
  },
  editToggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb'
  },
  editToggleBtnTextActive: {
    color: '#ffffff'
  },
  alertBox: {
    padding: 14,
    borderRadius: 8,
    marginBottom: 20
  },
  alertBoxError: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca'
  },
  alertBoxSuccess: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  alertText: {
    fontSize: 13.5,
    fontWeight: '500'
  },
  alertTextError: {
    color: '#b91c1c'
  },
  alertTextSuccess: {
    color: '#15803d'
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    marginBottom: 16,
    justifyContent: 'center'
  },
  loadingText: {
    fontSize: 13.5,
    color: '#64748b'
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 22,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1
  },
  sectionCardHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  },
  sectionCardHeaderInline: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a'
  },
  sectionCardSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14
  },
  formCol: {
    flex: 1
  },
  formFullCol: {
    marginBottom: 14
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#ffffff'
  },
  saveProfileBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  saveProfileBtnText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '700'
  },
  viewSectionsCol: {
    gap: 4
  },
  gridFields: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 18,
    columnGap: 24
  },
  gridField: {
    width: '46%',
    minWidth: 180
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b'
  },
  fieldValue: {
    fontSize: 14.5,
    fontWeight: '500',
    color: '#1e293b',
    marginTop: 3
  },
  updatePasswordBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8
  },
  updatePasswordBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  prefTextCol: {
    flex: 1,
    paddingRight: 16
  },
  prefTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b'
  },
  prefSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3
  },
  togglePill: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#cbd5e1',
    justifyContent: 'center',
    paddingHorizontal: 2
  },
  togglePillActive: {
    backgroundColor: '#2563eb'
  },
  toggleDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff'
  },
  toggleDotActive: {
    alignSelf: 'flex-end'
  },
  complianceList: {
    gap: 12,
    marginTop: 6
  },
  complianceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  complianceText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500'
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 24
  },
  logoutBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#dc2626'
  }
});
