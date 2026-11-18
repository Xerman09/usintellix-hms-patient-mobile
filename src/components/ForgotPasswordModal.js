import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { CloseIcon, LockIcon, MailIcon, CheckCircleIcon, InfoCircleIcon } from './Icons';
import { AuthService } from '../api/auth';

/**
 * Forgot Password.
 *
 * Replaces the alert that used to say "contact your organization administrator",
 * which was the whole feature until now.
 *
 * A six-digit code by email, not a reset link. A link needs a URL that resolves
 * back into this app, which means a registered deep-link scheme configured per
 * deployment, and a reset link that opens nothing is a locked-out user with no
 * way back. The hospital already sends 2FA codes this way and they already
 * arrive.
 *
 * THE SERVER NEVER SAYS WHETHER THE ACCOUNT EXISTS, AND NEITHER DOES THIS
 * SCREEN. The reply to "send me a code" is the same for a real account, one
 * that does not exist, a suspended one, and one with no address on file. So
 * step one cannot confirm anything, and the wording is careful to promise
 * nothing: "if we recognise it". Anything more definite would be inventing a
 * confirmation the server deliberately withheld, and would turn this screen
 * into a way of finding out which usernames are real.
 *
 * It is two steps rather than one for that reason too -- putting the new
 * password box on the first screen would imply the account had been found.
 */
export default function ForgotPasswordModal({ visible, onClose, initialUsername = '' }) {
  const [step, setStep] = useState('ask');       // ask | code | done
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (!visible) return;

    setStep('ask');
    setUsername(initialUsername || '');
    setCode('');
    setPassword('');
    setConfirm('');
    setError(null);
    setNotice(null);
    setResendIn(0);
  }, [visible, initialUsername]);

  // Counts the resend cooldown down so the button is not simply dead with no
  // explanation of when it will work again.
  useEffect(() => {
    if (resendIn <= 0) return undefined;

    const t = setTimeout(() => setResendIn((n) => n - 1), 1000);

    return () => clearTimeout(t);
  }, [resendIn]);

  const askForCode = async (isResend = false) => {
    const name = username.trim();

    if (!name) {
      setError('Enter the username or email you sign in with.');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const res = await AuthService.requestPasswordReset(name);

      if (!res?.success) {
        // Only reachable when the hospital has switched the feature off, or
        // the field was empty. There is no "no such user" answer to handle.
        setError(res?.message || 'That did not work. Please try again.');
        return;
      }

      setNotice(res.message);
      setResendIn(Number(res?.data?.resend_in) || 60);

      if (!isResend) setStep('code');
    } catch (e) {
      setError('We could not reach the hospital system. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const submitNewPassword = async () => {
    setError(null);

    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the six-digit code from the email.');
      return;
    }

    if (!password) {
      setError('Choose a new password.');
      return;
    }

    // Caught here rather than on the server: a mistyped confirmation is the one
    // mistake worth stopping before it spends an attempt on the code.
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }

    setBusy(true);

    try {
      const res = await AuthService.completePasswordReset(username.trim(), code.trim(), password);

      if (!res?.success) {
        setError(res?.message || 'That did not work.');
        return;
      }

      setStep('done');
    } catch (e) {
      setError('We could not reach the hospital system. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const renderAsk = () => (
    <>
      <Text style={styles.lead}>
        Enter the username or email you sign in with. If we recognise it, we will send a
        six-digit code to the address on your record.
      </Text>

      <Text style={styles.label}>Username or email</Text>
      <View style={styles.field}>
        <MailIcon color="#94a3b8" size={17} />
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="you@example.com"
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, busy && styles.btnOff]}
        onPress={() => askForCode(false)}
        disabled={busy}
      >
        <Text style={styles.primaryBtnText}>{busy ? 'Sending…' : 'Send me a code'}</Text>
      </TouchableOpacity>
    </>
  );

  const renderCode = () => (
    <>
      {notice ? (
        <View style={styles.noticeBox}>
          <InfoCircleIcon color="#1d4ed8" size={15} />
          <Text style={styles.noticeText}>  {notice}</Text>
        </View>
      ) : null}

      <Text style={styles.label}>Six-digit code</Text>
      <View style={styles.field}>
        <LockIcon color="#94a3b8" size={17} />
        <TextInput
          style={[styles.input, styles.codeInput]}
          value={code}
          onChangeText={(v) => setCode(v.replace(/[^0-9]/g, '').slice(0, 6))}
          placeholder="000000"
          placeholderTextColor="#94a3b8"
          keyboardType="number-pad"
          maxLength={6}
          autoComplete="one-time-code"
        />
      </View>

      <Text style={styles.label}>New password</Text>
      <View style={styles.field}>
        <LockIcon color="#94a3b8" size={17} />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="New password"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          autoCapitalize="none"
        />
      </View>

      <Text style={styles.label}>Confirm new password</Text>
      <View style={styles.field}>
        <LockIcon color="#94a3b8" size={17} />
        <TextInput
          style={styles.input}
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Type it again"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          autoCapitalize="none"
        />
      </View>

      <Text style={styles.hint}>
        At least 8 characters, with an uppercase letter, a lowercase letter, a number and a
        symbol. It cannot be one you have used on this account recently.
      </Text>

      <TouchableOpacity
        style={[styles.primaryBtn, busy && styles.btnOff]}
        onPress={submitNewPassword}
        disabled={busy}
      >
        <Text style={styles.primaryBtnText}>{busy ? 'Setting…' : 'Set my new password'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkBtn}
        onPress={() => askForCode(true)}
        disabled={busy || resendIn > 0}
      >
        <Text style={[styles.linkBtnText, (busy || resendIn > 0) && styles.linkOff]}>
          {resendIn > 0 ? `Send another in ${resendIn}s` : 'Send another code'}
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderDone = () => (
    <View style={styles.doneWrap}>
      <CheckCircleIcon color="#15803d" size={34} />
      <Text style={styles.doneTitle}>Your password has been changed</Text>
      <Text style={styles.doneText}>
        You can sign in with it now. We have also emailed the address on your record to say it
        changed — if that was not you, tell the service desk straight away.
      </Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={onClose}>
        <Text style={styles.primaryBtnText}>Back to sign in</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.iconCircle}>
              <LockIcon color="#2563eb" size={18} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.headerTitle}>Reset your password</Text>
              <Text style={styles.headerSub}>
                {step === 'done' ? 'All done' : 'We will email you a code'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <CloseIcon color="#64748b" size={18} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {busy && step === 'ask' ? <ActivityIndicator size="small" color="#2563eb" style={{ marginBottom: 12 }} /> : null}

          {step === 'ask' ? renderAsk() : step === 'code' ? renderCode() : renderDone()}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fafbfc',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconCircle: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#eff6ff',
    alignItems: 'center', justifyContent: 'center'
  },
  headerTitle: { fontSize: 15.5, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 },
  headerSub: { fontSize: 11.5, color: '#64748b', marginTop: 1 },
  closeBtn: { padding: 6, marginLeft: 8 },

  body: { flex: 1 },
  lead: { fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 18 },
  label: { fontSize: 11.5, fontWeight: '800', color: '#64748b', marginBottom: 6, marginTop: 4 },

  field: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff',
    borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10,
    paddingHorizontal: 11, marginBottom: 12
  },
  input: { flex: 1, paddingVertical: 11, paddingHorizontal: 8, fontSize: 14, color: '#0f172a' },
  codeInput: { letterSpacing: 6, fontWeight: '700' },

  hint: { fontSize: 11.5, color: '#64748b', lineHeight: 17, marginTop: 2, marginBottom: 6 },

  primaryBtn: {
    backgroundColor: '#15803d', borderRadius: 10, paddingVertical: 13,
    alignItems: 'center', marginTop: 10
  },
  btnOff: { opacity: 0.6 },
  primaryBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },

  linkBtn: { alignSelf: 'center', marginTop: 14, padding: 6 },
  linkBtnText: { fontSize: 13, fontWeight: '700', color: '#2563eb' },
  linkOff: { color: '#94a3b8' },

  noticeBox: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#eff6ff',
    borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 10, padding: 12, marginBottom: 16
  },
  noticeText: { flex: 1, fontSize: 12.5, color: '#1e40af', lineHeight: 18 },

  errorBox: {
    backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca',
    borderRadius: 10, padding: 12, marginBottom: 14
  },
  errorText: { fontSize: 12.5, color: '#991b1b', lineHeight: 18 },

  doneWrap: { alignItems: 'center', paddingTop: 24 },
  doneTitle: { fontSize: 16.5, fontWeight: '800', color: '#14532d', marginTop: 12, textAlign: 'center' },
  doneText: { fontSize: 13, color: '#475569', lineHeight: 20, textAlign: 'center', marginTop: 8, marginBottom: 6 }
});
