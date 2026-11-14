import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar
} from 'react-native';
import { MyChartService } from '../api/mychart';
import { CloseIcon, CalendarIcon, AlertTriangleIcon, CheckCircleIcon } from './Icons';

/**
 * Moving or cancelling one appointment (Phase M10).
 *
 * `mode` is 'reschedule' or 'cancel'. Both live here because they are the same
 * decision from the patient's side -- "I cannot make this one" -- and keeping them
 * together means one place where the clinic's cut-off and refusals are explained.
 *
 * The times offered come from the server, which only returns free slots with the
 * same doctor and already excludes anything inside the cut-off. The app never
 * computes availability itself: two patients can be looking at the same slot, so
 * the server settles it on submit and may still refuse.
 */
export default function AppointmentChangeModal({
  visible,
  onClose,
  onDone,          // called after a successful change, so the list can reload
  mode = 'reschedule',
  appointment      // one item from MyChartService.getMyAppointments()
}) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [days, setDays] = useState([]);
  const [blockedReason, setBlockedReason] = useState(null);
  const [picked, setPicked] = useState(null);     // { date, time }
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);

  const isCancel = mode === 'cancel';

  useEffect(() => {
    if (!visible) {
      setDays([]);
      setPicked(null);
      setReason('');
      setError(null);
      setBlockedReason(null);
      return;
    }

    if (isCancel || !appointment?.id) return;

    setLoading(true);
    MyChartService.getAppointmentSlots(appointment.id)
      .then((res) => {
        if (res?.success && res.data) {
          setDays(res.data.days || []);
          setBlockedReason(res.data.blocked_reason || null);
        } else {
          setError(res?.message || 'Could not load available times.');
        }
      })
      .catch(() => setError('Could not load available times. Please check your connection.'))
      .finally(() => setLoading(false));
  }, [visible, mode, appointment?.id]);

  const submit = async () => {
    setError(null);

    if (isCancel && reason.trim() === '') {
      setError('Please say why you are cancelling.');
      return;
    }

    if (!isCancel && !picked) {
      setError('Please choose a new time.');
      return;
    }

    setSubmitting(true);
    try {
      const res = isCancel
        ? await MyChartService.cancelAppointment(appointment.id, reason.trim())
        : await MyChartService.rescheduleAppointment(appointment.id, picked.date, picked.time);

      if (res?.success) {
        onDone?.(res.message);
        onClose?.();
        return;
      }

      // The server refuses a slot that went while the patient was choosing, so
      // the times are reloaded rather than leaving a stale list on screen.
      setError(res?.message || 'That did not work.');
      if (!isCancel) {
        setPicked(null);
        const again = await MyChartService.getAppointmentSlots(appointment.id).catch(() => null);
        if (again?.success && again.data) setDays(again.data.days || []);
      }
    } catch (e) {
      setError('Could not reach the clinic. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const when = appointment
    ? `${appointment.date}${appointment.time ? `  ·  ${String(appointment.time).slice(0, 5)}` : ''}`
    : '';

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={[styles.iconCircle, isCancel && { backgroundColor: '#fef2f2' }]}>
              {isCancel
                ? <AlertTriangleIcon color="#dc2626" size={19} />
                : <CalendarIcon color="#2563eb" size={19} />}
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.headerTitle}>
                {isCancel ? 'Cancel appointment' : 'Move appointment'}
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>{when}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <CloseIcon color="#64748b" size={18} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.currentCard}>
            <Text style={styles.currentLabel}>CURRENT APPOINTMENT</Text>
            <Text style={styles.currentWhen}>{when}</Text>
            {appointment?.doctor ? <Text style={styles.currentMeta}>Dr. {appointment.doctor}</Text> : null}
            {appointment?.facility ? <Text style={styles.currentMeta}>{appointment.facility}</Text> : null}
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {isCancel ? (
            <>
              <Text style={styles.fieldLabel}>WHY ARE YOU CANCELLING?</Text>
              <TextInput
                style={styles.textArea}
                value={reason}
                onChangeText={setReason}
                placeholder="e.g. I am away that week"
                placeholderTextColor="#94a3b8"
                multiline
                maxLength={255}
              />
              <Text style={styles.hint}>
                This helps the clinic offer your slot to someone else who is waiting.
              </Text>
              <View style={styles.warnBox}>
                <Text style={styles.warnText}>
                  Cancelling cannot be undone from the app. You would need to book a new
                  appointment, and the same time may not be free.
                </Text>
              </View>
            </>
          ) : loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.centerText}>Finding available times…</Text>
            </View>
          ) : blockedReason ? (
            <View style={styles.warnBox}>
              <Text style={styles.warnText}>{blockedReason}</Text>
            </View>
          ) : days.length === 0 ? (
            <View style={styles.centerBox}>
              <Text style={styles.centerText}>
                Dr. {appointment?.doctor || 'your doctor'} has no free times in the next few weeks.
                Please call the clinic to arrange something.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.fieldLabel}>CHOOSE A NEW TIME</Text>
              <Text style={styles.hint}>
                These are {appointment?.doctor ? `Dr. ${appointment.doctor}'s` : 'your doctor’s'} free
                times. Your doctor stays the same.
              </Text>
              {days.map((day) => (
                <View key={day.date} style={styles.dayBlock}>
                  <Text style={styles.dayLabel}>{day.date}</Text>
                  <View style={styles.timeRow}>
                    {day.times.map((t) => {
                      const isPicked = picked && picked.date === day.date && picked.time === t;
                      return (
                        <TouchableOpacity
                          key={`${day.date}-${t}`}
                          style={[styles.timeChip, isPicked && styles.timeChipOn]}
                          onPress={() => setPicked({ date: day.date, time: t })}
                          accessibilityRole="button"
                          accessibilityState={{ selected: !!isPicked }}
                        >
                          <Text style={[styles.timeChipText, isPicked && styles.timeChipTextOn]}>{t}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onClose} disabled={submitting}>
            <Text style={styles.secondaryBtnText}>Keep it</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              isCancel && styles.dangerBtn,
              (submitting || (!isCancel && !picked) || (isCancel && reason.trim() === '')) && styles.btnDisabled
            ]}
            onPress={submit}
            disabled={submitting || (!isCancel && !picked) || (isCancel && reason.trim() === '')}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                {!isCancel && picked ? <CheckCircleIcon color="#ffffff" size={15} /> : null}
                <Text style={styles.primaryBtnText}>
                  {isCancel
                    ? 'Cancel appointment'
                    : picked
                      ? `Move to ${picked.date} ${picked.time}`
                      : 'Choose a time'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Same surfaces as the rest of the redesigned app: #fafbfc page, 14pt cards.
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
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: { fontSize: 15.5, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 11.5, color: '#64748b', marginTop: 1 },
  closeBtn: { padding: 6, marginLeft: 8 },

  currentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  currentLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.8 },
  currentWhen: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginTop: 5, letterSpacing: -0.3 },
  currentMeta: { fontSize: 12.5, color: '#64748b', marginTop: 3 },

  fieldLabel: { fontSize: 11, fontWeight: '800', color: '#64748b', letterSpacing: 0.8, marginBottom: 7 },
  hint: { fontSize: 12, color: '#64748b', lineHeight: 17, marginBottom: 10 },

  textArea: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0f172a',
    minHeight: 86,
    textAlignVertical: 'top',
    marginBottom: 8
  },

  dayBlock: { marginBottom: 14 },
  dayLabel: { fontSize: 12.5, fontWeight: '700', color: '#334155', marginBottom: 6 },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap' },
  timeChip: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 13,
    marginRight: 7,
    marginBottom: 7
  },
  timeChipOn: { backgroundColor: '#1d4ed8', borderColor: '#1d4ed8' },
  timeChipText: { fontSize: 13, fontWeight: '600', color: '#334155' },
  timeChipTextOn: { color: '#ffffff' },

  centerBox: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 10 },
  centerText: { fontSize: 13, color: '#64748b', marginTop: 10, textAlign: 'center', lineHeight: 19 },

  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 11,
    marginBottom: 12
  },
  errorText: { fontSize: 12.5, color: '#991b1b', lineHeight: 18 },

  warnBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    padding: 11,
    marginTop: 4
  },
  warnText: { fontSize: 12.5, color: '#92400e', lineHeight: 18 },

  footer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0'
  },
  secondaryBtn: {
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginRight: 10,
    justifyContent: 'center'
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '700', color: '#334155' },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1d4ed8',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dangerBtn: { backgroundColor: '#dc2626' },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { fontSize: 14, fontWeight: '700', color: '#ffffff', marginLeft: 6 }
});
