import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { THEME } from '../constants/theme';
import { MyChartService } from '../api/mychart';
import {
  ProxyIcon,
  CloseIcon,
  CheckCircleIcon,
  UserIcon
} from './Icons';

export default function ProxySwitcherModal({
  visible,
  onClose,
  accessiblePatients = [],
  currentPatientId,
  onPatientSwitched
}) {
  const [switching, setSwitching] = useState(false);

  const handleSelectPatient = async (patient) => {
    if (patient.patient_id === currentPatientId) {
      onClose();
      return;
    }

    try {
      setSwitching(true);
      const res = await MyChartService.switchActingPatient(patient.patient_id);
      if (res && res.success) {
        if (onPatientSwitched) {
          onPatientSwitched(patient);
        }
        onClose();
      } else {
        Alert.alert('Unable to Switch', res?.message || 'Failed to switch patient record.');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error occurred while switching account.');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleBox}>
              <View style={styles.iconCircle}>
                <ProxyIcon color="#7c3aed" size={20} />
              </View>
              <View>
                <Text style={styles.title}>Switch Patient Chart</Text>
                <Text style={styles.subtitle}>Select whose health record you want to view</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <CloseIcon color="#64748b" size={18} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {switching ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#7c3aed" />
                <Text style={styles.loadingText}>Switching patient context...</Text>
              </View>
            ) : accessiblePatients.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No other family or proxy accounts linked.</Text>
              </View>
            ) : (
              accessiblePatients.map((p) => {
                const isActive = p.patient_id === currentPatientId;
                const isSelf = p.relationship?.toLowerCase() === 'self';

                return (
                  <TouchableOpacity
                    key={p.patient_id}
                    style={[
                      styles.patientCard,
                      isActive && styles.activePatientCard
                    ]}
                    onPress={() => handleSelectPatient(p)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.avatarBox, isActive && styles.activeAvatarBox]}>
                      <UserIcon color={isActive ? '#ffffff' : '#7c3aed'} size={20} />
                    </View>

                    <View style={styles.patientInfo}>
                      <View style={styles.nameRow}>
                        <Text style={[styles.patientName, isActive && styles.activePatientName]}>
                          {p.first_name} {p.last_name}
                        </Text>
                        <View style={[styles.badge, isSelf ? styles.selfBadge : styles.proxyBadge]}>
                          <Text style={[styles.badgeText, isSelf ? styles.selfBadgeText : styles.proxyBadgeText]}>
                            {p.relationship || 'Proxy'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.patientSub}>Patient ID: #{p.patient_id}</Text>
                    </View>

                    {isActive && (
                      <View style={styles.checkIcon}>
                        <CheckCircleIcon color="#10b981" size={22} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* Footer note */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              All views and actions are scoped to the active patient chart with full audit tracking.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end'
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 24
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f3ff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a'
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc'
  },
  scrollContent: {
    padding: 20,
    gap: 12
  },
  loadingBox: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 12
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b'
  },
  emptyBox: {
    paddingVertical: 32,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8'
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0'
  },
  activePatientCard: {
    backgroundColor: '#f5f3ff',
    borderColor: '#7c3aed'
  },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  activeAvatarBox: {
    backgroundColor: '#7c3aed'
  },
  patientInfo: {
    flex: 1
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap'
  },
  patientName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b'
  },
  activePatientName: {
    color: '#5b21b6',
    fontWeight: '700'
  },
  patientSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12
  },
  selfBadge: {
    backgroundColor: '#dbeafe'
  },
  selfBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1d4ed8'
  },
  proxyBadge: {
    backgroundColor: '#ede9fe'
  },
  proxyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6d28d9'
  },
  checkIcon: {
    marginLeft: 8
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 4
  },
  footerText: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 16
  }
});
