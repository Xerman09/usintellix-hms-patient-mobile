import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { AppointmentService } from '../api/appointments';
import { CalendarIcon } from '../components/Icons';

export default function AppointmentsModal({ visible, onClose, patientId }) {
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'book'
  const [appointments, setAppointments] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('09:00:00');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [apptsRes, provRes] = await Promise.all([
        AppointmentService.getAppointments(),
        AppointmentService.getProviders()
      ]);

      console.log('Appointments API response:', apptsRes);
      console.log('Providers API response:', provRes);

      if (apptsRes.success && Array.isArray(apptsRes.data)) {
        setAppointments(apptsRes.data);
      } else {
        setAppointments([]);
      }

      if (provRes.success && Array.isArray(provRes.data)) {
        setProviders(provRes.data);
        if (provRes.data.length > 0) {
          setSelectedProviderId(provRes.data[0].id.toString());
        }
      }

      // Default tomorrow's date YYYY-MM-DD
      const tmrw = new Date();
      tmrw.setDate(tmrw.getDate() + 1);
      const yyyy = tmrw.getFullYear();
      const mm = String(tmrw.getMonth() + 1).padStart(2, '0');
      const dd = String(tmrw.getDate()).padStart(2, '0');
      setAppointmentDate(`${yyyy}-${mm}-${dd}`);
    } catch (e) {
      console.error('Failed to load appointments data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!appointmentDate.trim()) {
      Alert.alert('Required Field', 'Please enter a valid appointment date.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Required Field', 'Please specify the reason for consultation.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        provider_id: selectedProviderId ? parseInt(selectedProviderId, 10) : null,
        appointment_date: appointmentDate.trim(),
        appointment_time: appointmentTime.trim(),
        title: `Consultation: ${reason.trim().slice(0, 30)}`,
        reason: reason.trim(),
        status: 'scheduled'
      };

      const res = await AppointmentService.bookAppointment(payload);
      setSubmitting(false);

      if (res.success) {
        Alert.alert('Success', 'Your appointment has been scheduled successfully!');
        setReason('');
        setActiveTab('list');
        loadData();
      } else {
        Alert.alert('Booking Error', res.message || 'Unable to schedule appointment.');
      }
    } catch (e) {
      setSubmitting(false);
      Alert.alert('Error', 'Network error while scheduling appointment.');
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.sheetContainer}>
        {/* Header Bar */}
        <View style={styles.sheetHeader}>
          <View style={styles.headerTitleRow}>
            <View style={styles.iconBadge}>
              <CalendarIcon color="#2563eb" size={18} />
            </View>
            <Text style={styles.headerTitle}>Appointments</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'list' && styles.tabBtnActive]}
            onPress={() => setActiveTab('list')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'list' && styles.tabBtnTextActive]}>
              My Visits ({appointments.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'book' && styles.tabBtnActive]}
            onPress={() => setActiveTab('book')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'book' && styles.tabBtnTextActive]}>
              + Book New
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Body */}
        {loading ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator color="#2563eb" size="large" />
            <Text style={styles.loadingText}>Loading appointments...</Text>
          </View>
        ) : activeTab === 'list' ? (
          <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
            {appointments.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>📅</Text>
                <Text style={styles.emptyTitle}>No Scheduled Visits</Text>
                <Text style={styles.emptyDesc}>You have no upcoming or past appointments.</Text>
                <TouchableOpacity style={styles.bookFirstBtn} onPress={() => setActiveTab('book')}>
                  <Text style={styles.bookFirstBtnText}>Book An Appointment</Text>
                </TouchableOpacity>
              </View>
            ) : (
              appointments.map((appt, idx) => (
                <View key={appt.id || idx} style={styles.apptCard}>
                  <View style={styles.apptCardHeader}>
                    <Text style={styles.apptDateText}>
                      {appt.appointment_date}  •  {appt.appointment_time?.slice(0, 5) || '09:00'}
                    </Text>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusPillText}>{appt.status || 'Scheduled'}</Text>
                    </View>
                  </View>
                  <Text style={styles.apptTitleText}>{appt.title || 'Medical Consultation'}</Text>
                  {(appt.provider_first_name || appt.provider_last_name) ? (
                    <Text style={styles.apptDoctorText}>
                      Doctor: Dr. {appt.provider_first_name || ''} {appt.provider_last_name || ''}
                    </Text>
                  ) : appt.provider_name ? (
                    <Text style={styles.apptDoctorText}>Doctor: {appt.provider_name}</Text>
                  ) : null}
                  {appt.facility_name ? (
                    <Text style={styles.apptDoctorText}>Location: {appt.facility_name}</Text>
                  ) : null}
                  {appt.reason && (
                    <Text style={styles.apptReasonText}>Note: {appt.reason}</Text>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>DATE (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.inputField}
              value={appointmentDate}
              onChangeText={setAppointmentDate}
              placeholder="e.g. 2026-10-15"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.fieldLabel}>TIME</Text>
            <View style={styles.timeChipsRow}>
              {['09:00:00', '10:30:00', '14:00:00', '16:00:00'].map((tm) => (
                <TouchableOpacity
                  key={tm}
                  style={[styles.timeChip, appointmentTime === tm && styles.timeChipActive]}
                  onPress={() => setAppointmentTime(tm)}
                >
                  <Text style={[styles.timeChipText, appointmentTime === tm && styles.timeChipTextActive]}>
                    {tm.slice(0, 5)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {providers.length > 0 && (
              <>
                <Text style={styles.fieldLabel}>SELECT DOCTOR / SPECIALIST</Text>
                <View style={styles.providersList}>
                  {providers.slice(0, 4).map((p) => {
                    const isSelected = selectedProviderId === p.id.toString();
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[styles.providerItem, isSelected && styles.providerItemActive]}
                        onPress={() => setSelectedProviderId(p.id.toString())}
                      >
                        <Text style={[styles.providerName, isSelected && styles.providerNameActive]}>
                          Dr. {p.first_name} {p.last_name}
                        </Text>
                        <Text style={styles.providerSpecialty}>{p.specialty || 'General Practitioner'}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <Text style={styles.fieldLabel}>REASON FOR VISIT</Text>
            <TextInput
              style={[styles.inputField, { height: 75, textAlignVertical: 'top', paddingTop: 10 }]}
              value={reason}
              onChangeText={setReason}
              placeholder="Describe your symptoms or reason for consult..."
              placeholderTextColor="#94a3b8"
              multiline
            />

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={handleBook}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Confirm Appointment →</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    zIndex: 999,
    justifyContent: 'flex-end'
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '84%',
    width: '100%',
    paddingTop: 16
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a'
  },
  closeBtn: {
    padding: 6
  },
  closeBtnText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '700'
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b'
  },
  tabBtnTextActive: {
    color: '#2563eb',
    fontWeight: '800'
  },
  loadingArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748b'
  },
  scrollList: {
    padding: 18,
    paddingBottom: 36
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16
  },
  bookFirstBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8
  },
  bookFirstBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  apptCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12
  },
  apptCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  apptDateText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#2563eb'
  },
  statusPill: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 999
  },
  statusPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2563eb',
    textTransform: 'capitalize'
  },
  apptTitleText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4
  },
  apptDoctorText: {
    fontSize: 12.5,
    color: '#475569',
    marginBottom: 2
  },
  apptReasonText: {
    fontSize: 12,
    color: '#64748b'
  },
  formScroll: {
    padding: 18,
    paddingBottom: 40
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.6,
    marginBottom: 6
  },
  inputField: {
    height: 44,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 14
  },
  timeChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14
  },
  timeChip: {
    flex: 1,
    height: 38,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  timeChipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb'
  },
  timeChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569'
  },
  timeChipTextActive: {
    color: '#2563eb',
    fontWeight: '800'
  },
  providersList: {
    marginBottom: 14,
    gap: 8
  },
  providerItem: {
    padding: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8
  },
  providerItemActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb'
  },
  providerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a'
  },
  providerNameActive: {
    color: '#2563eb'
  },
  providerSpecialty: {
    fontSize: 11,
    color: '#64748b'
  },
  submitBtn: {
    height: 46,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  }
});
