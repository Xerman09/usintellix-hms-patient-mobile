import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Modal
} from 'react-native';
import { THEME } from '../constants/theme';
import { AuthService } from '../api/auth';
import { getServerHost, setServerHost, CONFIG } from '../constants/config';
import { MailIcon, LockIcon, EyeOffIcon, ShieldIcon } from '../components/Icons';
import logoImg from '../../assets/logo.png';

export default function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);

  // HIPAA step handling
  const [currentStep, setCurrentStep] = useState('login');
  const [tfaCode, setTfaCode] = useState('');
  const [tfaMessage, setTfaMessage] = useState('');

  const [firstLoginData, setFirstLoginData] = useState({
    user: null,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    confirmEmail: ''
  });

  const [expiredData, setExpiredData] = useState({
    userId: null,
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [nppUser, setNppUser] = useState(null);
  const [signatureName, setSignatureName] = useState('');
  const [nppAgreed, setNppAgreed] = useState(false);

  // Focus states
  const [userFocused, setUserFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  // Hospital Server Connection State
  const [serverHost, setLocalServerHost] = useState(getServerHost());
  const [showServerModal, setShowServerModal] = useState(false);
  const [inputHost, setInputHost] = useState(getServerHost());
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  const testServerConnection = async (hostToTest) => {
    const target = (hostToTest || inputHost || '').trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    if (!target) {
      setConnectionStatus({ success: false, message: 'Please enter a server IP or domain.' });
      return;
    }
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const testUrl = `http://${target}/ims/usintellix-hospital-management-system/backend/public/announcements/active`;
      const res = await fetch(testUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.status >= 200 && res.status < 500) {
        setConnectionStatus({
          success: true,
          message: `Connected successfully! (Server responded with HTTP ${res.status})`
        });
      } else {
        setConnectionStatus({
          success: false,
          message: `Server reached but responded with HTTP ${res.status}.`
        });
      }
    } catch (e) {
      setConnectionStatus({
        success: false,
        message: 'Could not connect. Verify PC IP and ensure phone is on same Wi-Fi.'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const saveServerHost = () => {
    const updated = setServerHost(inputHost);
    setLocalServerHost(updated);
    setShowServerModal(false);
    setAlertInfo(null);
    Alert.alert('Server Updated', `Active hospital server set to:\nhttp://${updated}/...`);
  };

  const handleLogin = async () => {
    setAlertInfo(null);

    if (!username.trim()) {
      setAlertInfo({ message: 'Corporate Email or Username is required.', type: 'error' });
      return;
    }
    if (!password) {
      setAlertInfo({ message: 'Password is required.', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      const result = await AuthService.login(username.trim(), password);
      setLoading(false);

      if (!result.success) {
        if (result.isStaffAttempt) {
          setAlertInfo({ message: result.message, type: 'warning' });
          return;
        }

        if (result.locked) {
          setAlertInfo({
            message: `Account Locked: ${result.message}`,
            type: 'error'
          });
          return;
        }

        if (result.password_expired) {
          setExpiredData({
            userId: result.user_id,
            username: result.username || username,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
          setCurrentStep('expiredPassword');
          setAlertInfo({
            message: 'Your password has expired. Please establish a new password.',
            type: 'warning'
          });
          return;
        }

        setAlertInfo({
          message: result.message || 'Invalid credentials provided.',
          type: 'error'
        });
        return;
      }

      if (result.data?.requires_2fa) {
        setTfaMessage(result.data.message || 'Enter your 6-digit verification code.');
        setCurrentStep('2fa');
        return;
      }

      handlePostLoginState(result.data.user);
    } catch (e) {
      setLoading(false);
      setAlertInfo({ message: 'Unable to reach the hospital authentication service.', type: 'error' });
    }
  };

  const handlePostLoginState = (user) => {
    if (!user) return;

    if (user.must_change_password) {
      setFirstLoginData({
        user,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        confirmEmail: ''
      });
      setCurrentStep('firstLogin');
      return;
    }

    if (!user.npp_acknowledged) {
      setNppUser(user);
      setSignatureName(`${user.first_name || ''} ${user.last_name || ''}`.trim());
      setCurrentStep('npp');
      return;
    }

    onLoginSuccess(user);
  };

  // 2FA
  const handleVerify2FA = async () => {
    if (!tfaCode.trim() || tfaCode.trim().length !== 6) {
      setAlertInfo({ message: 'Enter the 6-digit code.', type: 'error' });
      return;
    }

    setLoading(true);
    const res = await AuthService.verify2FA(tfaCode.trim());
    setLoading(false);

    if (!res.success) {
      setAlertInfo({ message: res.message || 'Invalid verification code.', type: 'error' });
      return;
    }

    handlePostLoginState(res.data.user);
  };

  // First Login Reset
  const handleFirstLoginSubmit = async () => {
    const { currentPassword, newPassword, confirmPassword, confirmEmail, user } = firstLoginData;
    if (!currentPassword || !newPassword || !confirmPassword || !confirmEmail) {
      setAlertInfo({ message: 'All fields are required.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setAlertInfo({ message: 'Passwords do not match.', type: 'error' });
      return;
    }

    setLoading(true);
    const res = await AuthService.completeFirstLogin({
      username: user.username,
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
      confirm_email: confirmEmail
    });
    setLoading(false);

    if (!res.success) {
      setAlertInfo({ message: res.message || 'Unable to update password.', type: 'error' });
      return;
    }

    handlePostLoginState({ ...user, must_change_password: false });
  };

  // Expired Password Reset
  const handleExpiredPasswordSubmit = async () => {
    const { userId, username: expUsername, currentPassword, newPassword, confirmPassword } = expiredData;
    if (!currentPassword || !newPassword || !confirmPassword) {
      setAlertInfo({ message: 'All fields are required.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setAlertInfo({ message: 'New passwords do not match.', type: 'error' });
      return;
    }

    setLoading(true);
    const res = await AuthService.updateExpiredPassword({
      user_id: userId,
      username: expUsername,
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword
    });
    setLoading(false);

    if (!res.success) {
      setAlertInfo({ message: res.message || 'Failed to renew password.', type: 'error' });
      return;
    }

    handlePostLoginState(res.data?.user);
  };

  // NPP
  const handleNppSubmit = async () => {
    if (!nppAgreed || !signatureName.trim()) {
      setAlertInfo({ message: 'Consent acknowledgment and legal signature are required.', type: 'error' });
      return;
    }

    setLoading(true);
    const res = await AuthService.acknowledgeNpp(signatureName.trim());
    setLoading(false);

    if (!res.success) {
      setAlertInfo({ message: res.message || 'Failed to submit consent.', type: 'error' });
      return;
    }

    onLoginSuccess({ ...nppUser, npp_acknowledged: true });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screenContainer}
    >
      <ScrollView
        contentContainerStyle={styles.scrollWrapper}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        
        {/* Soft Wave Header Area with USIntellix Logo Badge */}
        <View style={styles.topCurvedHeader}>
          <View style={styles.topIconBadge}>
            <Image
              source={logoImg}
              style={styles.brandLogoImg}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Content Body */}
        <View style={styles.contentBody}>

          {/* Clean Brand Title */}
          <View style={styles.brandTitleRow}>
            <Text style={styles.brandTitleTeal}>USINTELLIX </Text>
            <Text style={styles.brandTitleBlack}>PATIENT PORTAL</Text>
          </View>

          {/* Welcome back subtitle */}
          <Text style={styles.welcomeHeading}>Welcome back</Text>
          <Text style={styles.welcomeSubheading}>Sign in to your patient portal</Text>

          {/* Dynamic Alert Banner */}
          {alertInfo && (
            <View
              style={[
                styles.alertBox,
                alertInfo.type === 'error' && styles.alertError,
                alertInfo.type === 'warning' && styles.alertWarning,
                alertInfo.type === 'success' && styles.alertSuccess
              ]}
            >
              <Text style={styles.alertText}>{alertInfo.message}</Text>
              {alertInfo.message && (alertInfo.message.toLowerCase().includes('connect') || alertInfo.message.toLowerCase().includes('hospital')) && (
                <TouchableOpacity
                  style={styles.configServerErrorBtn}
                  onPress={() => {
                    setInputHost(serverHost);
                    setConnectionStatus(null);
                    setShowServerModal(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.configServerErrorBtnText}>⚙️ Change Hospital Server IP</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ================= STEP 1: LOGIN ================= */}
          {currentStep === 'login' && (
            <View style={styles.formContainer}>
              
              {/* Patient Username / ID Field */}
              <View style={styles.fieldSection}>
                <Text style={styles.fieldUpperLabel}>PATIENT USERNAME OR ID</Text>
                <View style={[styles.fieldRow, userFocused && styles.fieldRowFocused]}>
                  <View style={styles.fieldIconSlot}>
                    <MailIcon color="#94a3b8" size={17} />
                  </View>
                  <TextInput
                    style={styles.textInputField}
                    placeholder="e.g. testpatient1"
                    placeholderTextColor="#94a3b8"
                    value={username}
                    onChangeText={setUsername}
                    onFocus={() => setUserFocused(true)}
                    onBlur={() => setUserFocused(false)}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password Field */}
              <View style={styles.fieldSection}>
                <View style={styles.passwordLabelRow}>
                  <Text style={styles.fieldUpperLabel}>PASSWORD</Text>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert(
                        'Password Recovery',
                        'Please contact your organization administrator or clinical desk for password assistance.'
                      )
                    }
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.forgotPasswordTeal}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.fieldRow, passFocused && styles.fieldRowFocused]}>
                  <View style={styles.fieldIconSlot}>
                    <LockIcon color="#94a3b8" size={17} />
                  </View>
                  <TextInput
                    style={[styles.textInputField, { paddingRight: 40 }]}
                    placeholder="••••••••"
                    placeholderTextColor="#94a3b8"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setPassFocused(true)}
                    onBlur={() => setPassFocused(false)}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <EyeOffIcon color="#94a3b8" size={17} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sign In Primary Button */}
              <TouchableOpacity
                style={[styles.primarySignInBtn, loading && { opacity: 0.7 }]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.88}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <View style={styles.btnContentRow}>
                    <Text style={styles.primarySignInText}>Sign In</Text>
                    <Text style={styles.arrowIcon}> →</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* OR Divider */}
              <View style={styles.orDividerContainer}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.orLine} />
              </View>

              {/* Biometric Login Secondary Button */}
              <TouchableOpacity
                style={styles.biometricBtn}
                onPress={() =>
                  Alert.alert(
                    'Biometric Login',
                    'Biometric verification (Face ID / Fingerprint) is enabled for registered executive devices.'
                  )
                }
                activeOpacity={0.8}
              >
                <ShieldIcon color="#2563eb" size={16} />
                <Text style={styles.biometricBtnText}>Biometric Login</Text>
              </TouchableOpacity>

              {/* Server Connection Status Pill */}
              <TouchableOpacity
                style={styles.serverPill}
                onPress={() => {
                  setInputHost(serverHost);
                  setConnectionStatus(null);
                  setShowServerModal(true);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.serverStatusDot} />
                <Text style={styles.serverPillText}>Server: {serverHost}</Text>
                <Text style={styles.serverPillChange}> (Tap to change)</Text>
              </TouchableOpacity>

            </View>
          )}

          {/* ================= STEP 2: 2FA ================= */}
          {currentStep === '2fa' && (
            <View style={styles.formContainer}>
              <Text style={styles.stepTitle}>Security Verification</Text>
              <Text style={styles.stepSubtitle}>{tfaMessage}</Text>

              <View style={[styles.fieldRow, { justifyContent: 'center', marginBottom: 20 }]}>
                <TextInput
                  style={[styles.textInputField, styles.otpInput]}
                  placeholder="000000"
                  placeholderTextColor="#94a3b8"
                  value={tfaCode}
                  onChangeText={setTfaCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              <TouchableOpacity
                style={styles.primarySignInBtn}
                onPress={handleVerify2FA}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primarySignInText}>Verify & Continue →</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={{ alignItems: 'center', marginTop: 16 }}
                onPress={() => setCurrentStep('login')}
              >
                <Text style={styles.forgotPasswordTeal}>Return to Sign In</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ================= STEP 3: FIRST LOGIN ================= */}
          {currentStep === 'firstLogin' && (
            <View style={styles.formContainer}>
              <Text style={styles.stepTitle}>Set Personal Password</Text>
              <Text style={styles.stepSubtitle}>
                Initial login requires establishing your personal security credentials.
              </Text>

              <Text style={styles.fieldUpperLabel}>CURRENT TEMPORARY PASSWORD</Text>
              <View style={styles.fieldRow}>
                <TextInput
                  style={styles.textInputField}
                  secureTextEntry
                  value={firstLoginData.currentPassword}
                  onChangeText={(txt) => setFirstLoginData({ ...firstLoginData, currentPassword: txt })}
                />
              </View>

              <Text style={styles.fieldUpperLabel}>NEW PASSWORD</Text>
              <View style={styles.fieldRow}>
                <TextInput
                  style={styles.textInputField}
                  secureTextEntry
                  value={firstLoginData.newPassword}
                  onChangeText={(txt) => setFirstLoginData({ ...firstLoginData, newPassword: txt })}
                />
              </View>

              <Text style={styles.fieldUpperLabel}>CONFIRM NEW PASSWORD</Text>
              <View style={styles.fieldRow}>
                <TextInput
                  style={styles.textInputField}
                  secureTextEntry
                  value={firstLoginData.confirmPassword}
                  onChangeText={(txt) => setFirstLoginData({ ...firstLoginData, confirmPassword: txt })}
                />
              </View>

              <Text style={styles.fieldUpperLabel}>CONFIRM REGISTERED EMAIL</Text>
              <View style={styles.fieldRow}>
                <TextInput
                  style={styles.textInputField}
                  placeholder="name@company.com"
                  placeholderTextColor="#94a3b8"
                  value={firstLoginData.confirmEmail}
                  onChangeText={(txt) => setFirstLoginData({ ...firstLoginData, confirmEmail: txt })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={styles.primarySignInBtn}
                onPress={handleFirstLoginSubmit}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primarySignInText}>Save Credentials →</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* ================= STEP 4: EXPIRED PASSWORD ================= */}
          {currentStep === 'expiredPassword' && (
            <View style={styles.formContainer}>
              <Text style={styles.stepTitle}>90-Day Password Renewal</Text>
              <Text style={styles.stepSubtitle}>Your password has expired. Please enter a fresh password.</Text>

              <Text style={styles.fieldUpperLabel}>CURRENT PASSWORD</Text>
              <View style={styles.fieldRow}>
                <TextInput
                  style={styles.textInputField}
                  secureTextEntry
                  value={expiredData.currentPassword}
                  onChangeText={(txt) => setExpiredData({ ...expiredData, currentPassword: txt })}
                />
              </View>

              <Text style={styles.fieldUpperLabel}>NEW PASSWORD</Text>
              <View style={styles.fieldRow}>
                <TextInput
                  style={styles.textInputField}
                  secureTextEntry
                  value={expiredData.newPassword}
                  onChangeText={(txt) => setExpiredData({ ...expiredData, newPassword: txt })}
                />
              </View>

              <Text style={styles.fieldUpperLabel}>CONFIRM NEW PASSWORD</Text>
              <View style={styles.fieldRow}>
                <TextInput
                  style={styles.textInputField}
                  secureTextEntry
                  value={expiredData.confirmPassword}
                  onChangeText={(txt) => setExpiredData({ ...expiredData, confirmPassword: txt })}
                />
              </View>

              <TouchableOpacity
                style={styles.primarySignInBtn}
                onPress={handleExpiredPasswordSubmit}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primarySignInText}>Update Password →</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* ================= STEP 5: NPP PRIVACY CONSENT ================= */}
          {currentStep === 'npp' && (
            <View style={styles.formContainer}>
              <Text style={styles.stepTitle}>Notice of Privacy Practices</Text>
              <Text style={styles.stepSubtitle}>HIPAA § 164.520 Disclosure</Text>

              <View style={styles.nppScrollBox}>
                <Text style={styles.nppText}>
                  This notice describes how health information about you may be used and disclosed and how you can get access to this information. By proceeding, you acknowledge receiving the Notice of Privacy Practices and consent to access your digital dashboard.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setNppAgreed(!nppAgreed)}
              >
                <View style={[styles.checkboxCustom, nppAgreed && styles.checkboxCustomActive]}>
                  {nppAgreed && <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>✓</Text>}
                </View>
                <Text style={{ fontSize: 13, color: '#334155' }}>I acknowledge and accept the privacy disclosure.</Text>
              </TouchableOpacity>

              <Text style={styles.fieldUpperLabel}>FULL LEGAL NAME (ELECTRONIC SIGNATURE)</Text>
              <View style={styles.fieldRow}>
                <TextInput
                  style={styles.textInputField}
                  value={signatureName}
                  onChangeText={setSignatureName}
                  placeholder="e.g. John Doe"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <TouchableOpacity
                style={styles.primarySignInBtn}
                onPress={handleNppSubmit}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primarySignInText}>Sign & Continue →</Text>}
              </TouchableOpacity>
            </View>
          )}

        </View>
      </ScrollView>

      {/* Hospital Server Connection Settings Modal */}
      <Modal
        visible={showServerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowServerModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.serverModalCard}>
            <Text style={styles.serverModalTitle}>🏥 Hospital Server Settings</Text>
            <Text style={styles.serverModalSub}>
              Set the IP address or domain of the hospital system so your mobile phone can connect over Wi-Fi.
            </Text>

            <Text style={styles.serverInputLabel}>Server IP / Host</Text>
            <TextInput
              style={styles.serverTextInput}
              value={inputHost}
              onChangeText={(txt) => {
                setInputHost(txt);
                setConnectionStatus(null);
              }}
              placeholder="e.g. 192.168.100.31"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.serverPresetsLabel}>Quick Presets:</Text>
            <View style={styles.presetsRow}>
              {['192.168.100.31', '10.0.2.2', 'localhost'].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetChip,
                    inputHost === preset && styles.presetChipActive
                  ]}
                  onPress={() => {
                    setInputHost(preset);
                    setConnectionStatus(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      inputHost === preset && styles.presetChipTextActive
                    ]}
                  >
                    {preset === '192.168.100.31'
                      ? '192.168.100.31 (PC Wi-Fi)'
                      : preset === '10.0.2.2'
                      ? '10.0.2.2 (Emulator)'
                      : preset}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {connectionStatus && (
              <View
                style={[
                  styles.connStatusBox,
                  connectionStatus.success ? styles.connStatusSuccess : styles.connStatusError
                ]}
              >
                <Text
                  style={[
                    styles.connStatusText,
                    connectionStatus.success ? styles.connStatusSuccessText : styles.connStatusErrorText
                  ]}
                >
                  {connectionStatus.success ? '✅ ' : '❌ '}
                  {connectionStatus.message}
                </Text>
              </View>
            )}

            <View style={styles.serverModalActions}>
              <TouchableOpacity
                style={styles.testConnBtn}
                onPress={() => testServerConnection(inputHost)}
                disabled={testingConnection}
                activeOpacity={0.8}
              >
                {testingConnection ? (
                  <ActivityIndicator size="small" color="#0284c7" />
                ) : (
                  <Text style={styles.testConnBtnText}>Test Connection</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveConnBtn}
                onPress={saveServerHost}
                activeOpacity={0.8}
              >
                <Text style={styles.saveConnBtnText}>Save &amp; Apply</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.closeServerModalBtn}
              onPress={() => setShowServerModal(false)}
            >
              <Text style={styles.closeServerModalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff'
  },
  scrollWrapper: {
    flexGrow: 1,
    width: '100%'
  },
  topCurvedHeader: {
    width: '100%',
    height: 125,
    backgroundColor: '#eff6ff',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    alignItems: 'center',
    justifyContent: 'center'
  },
  topIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#dbeafe'
  },
  brandLogoImg: {
    width: 44,
    height: 44
  },
  contentBody: {
    paddingHorizontal: 26,
    paddingTop: 24,
    paddingBottom: 36
  },
  brandTitleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  brandTitleTeal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 2
  },
  brandTitleBlack: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 2
  },
  welcomeHeading: {
    fontSize: 27,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 6
  },
  welcomeSubheading: {
    fontSize: 13.5,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 26
  },
  formContainer: {
    width: '100%'
  },
  fieldSection: {
    marginBottom: 16
  },
  fieldUpperLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 8
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  forgotPasswordTeal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb'
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    height: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  fieldRowFocused: {
    borderColor: '#2563eb',
    backgroundColor: '#ffffff'
  },
  fieldIconSlot: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  textInputField: {
    flex: 1,
    height: '100%',
    color: '#0f172a',
    fontSize: 14.5,
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    ...(Platform.OS === 'web'
      ? {
          outlineWidth: 0,
          outlineStyle: 'none'
        }
      : {})
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 6
  },
  primarySignInBtn: {
    width: '100%',
    height: 50,
    backgroundColor: '#0f172a',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  primarySignInText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700'
  },
  arrowIcon: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 4
  },
  orDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0'
  },
  orText: {
    marginHorizontal: 14,
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.8
  },
  biometricBtn: {
    width: '100%',
    height: 48,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  biometricBtnText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600'
  },
  alertBox: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 16
  },
  alertError: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca'
  },
  alertWarning: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7'
  },
  alertSuccess: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0'
  },
  alertText: {
    fontSize: 12.5,
    color: '#0f172a',
    lineHeight: 17,
    textAlign: 'center'
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 6
  },
  stepSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 8
  },
  nppScrollBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 12,
    maxHeight: 120,
    marginBottom: 16
  },
  nppText: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  checkboxCustom: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxCustomActive: {
    backgroundColor: '#0d9488',
    borderColor: '#0d9488'
  },
  configServerErrorBtn: {
    marginTop: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'center'
  },
  configServerErrorBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b91c1c'
  },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignSelf: 'center'
  },
  serverStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 6
  },
  serverPillText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600'
  },
  serverPillChange: {
    fontSize: 11.5,
    color: '#0284c7',
    fontWeight: '700'
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  serverModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8
  },
  serverModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4
  },
  serverModalSub: {
    fontSize: 12.5,
    color: '#64748b',
    marginBottom: 14,
    lineHeight: 18
  },
  serverInputLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6
  },
  serverTextInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 10
  },
  serverPresetsLabel: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 6
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  presetChipActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0284c7'
  },
  presetChipText: {
    fontSize: 11.5,
    color: '#475569'
  },
  presetChipTextActive: {
    color: '#0284c7',
    fontWeight: '700'
  },
  connStatusBox: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 14
  },
  connStatusSuccess: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0'
  },
  connStatusError: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca'
  },
  connStatusText: {
    fontSize: 12,
    lineHeight: 16
  },
  connStatusSuccessText: {
    color: '#065f46'
  },
  connStatusErrorText: {
    color: '#991b1b'
  },
  serverModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4
  },
  testConnBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    alignItems: 'center',
    justifyContent: 'center'
  },
  testConnBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284c7'
  },
  saveConnBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  saveConnBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff'
  },
  closeServerModalBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 6
  },
  closeServerModalBtnText: {
    fontSize: 13,
    color: '#64748b'
  }
});
