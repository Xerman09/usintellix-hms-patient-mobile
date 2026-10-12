import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { PrescriptionService } from '../api/prescriptions';
import { PillIcon } from '../components/Icons';

export default function PrescriptionsModal({ visible, onClose }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refillLoadingId, setRefillLoadingId] = useState(null);

  useEffect(() => {
    if (visible) {
      loadPrescriptions();
    }
  }, [visible]);

  const loadPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await PrescriptionService.getPrescriptions();
      if (res.success && Array.isArray(res.data)) {
        setPrescriptions(res.data);
      } else {
        setPrescriptions([]);
      }
    } catch (e) {
      console.error('Failed to load prescriptions:', e);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefillRequest = async (item) => {
    setRefillLoadingId(item.id);
    try {
      const res = await PrescriptionService.requestRefill(item.id);
      setRefillLoadingId(null);
      if (res.success) {
        Alert.alert(
          'Refill Requested',
          `Your refill request for ${item.drug_name || item.title || 'medication'} has been submitted to your physician.`
        );
        loadPrescriptions();
      } else {
        Alert.alert('Refill Request', res.message || 'Unable to submit refill request.');
      }
    } catch (e) {
      setRefillLoadingId(null);
      Alert.alert('Error', 'Network error while requesting refill.');
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
              <PillIcon color="#7c3aed" size={18} />
            </View>
            <Text style={styles.headerTitle}>Prescriptions &amp; Meds</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Prescription List Body */}
        {loading ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator color="#7c3aed" size="large" />
            <Text style={styles.loadingText}>Loading prescribed medications...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
            {prescriptions.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>💊</Text>
                <Text style={styles.emptyTitle}>No Active Prescriptions</Text>
                <Text style={styles.emptyDesc}>
                  You do not have any active clinical medication records at this time.
                </Text>
              </View>
            ) : (
              prescriptions.map((rx, idx) => {
                const medTitle = rx.drug_name || rx.title || 'Medication';
                const dosage = [rx.dosage, rx.drug_strength, rx.drug_unit_name].filter(Boolean).join(' ') || (rx.dosage || 'As directed');
                const frequency = rx.frequency || 'Daily';
                const directions = rx.directions || rx.comments || 'Take according to physician instructions';
                const refillsRemaining = rx.refills ?? 0;

                return (
                  <View key={rx.id || idx} style={styles.rxCard}>
                    <View style={styles.rxCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rxTitleText}>{medTitle}</Text>
                        <Text style={styles.rxDosageText}>{dosage}  •  {frequency}</Text>
                      </View>
                      <View style={styles.rxStatusPill}>
                        <Text style={styles.rxStatusPillText}>
                          {rx.prescription_status || 'Active'}
                        </Text>
                      </View>
                    </View>

                    {/* Directions / Instructions */}
                    <View style={styles.directionsBox}>
                      <Text style={styles.directionsLabel}>DIRECTIONS:</Text>
                      <Text style={styles.directionsText}>{directions}</Text>
                    </View>

                    {/* Footer with Refills & Refill CTA */}
                    <View style={styles.rxFooterRow}>
                      <View>
                        <Text style={styles.refillsCountText}>
                          Refills Available: <Text style={{ fontWeight: '800', color: '#0f172a' }}>{refillsRemaining}</Text>
                        </Text>
                        {rx.prescribed_date && (
                          <Text style={styles.prescribedDateText}>
                            Prescribed: {rx.prescribed_date}
                          </Text>
                        )}
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.refillBtn,
                          refillsRemaining <= 0 && styles.refillBtnDisabled
                        ]}
                        onPress={() => handleRefillRequest(rx)}
                        disabled={refillLoadingId === rx.id || refillsRemaining <= 0}
                        activeOpacity={0.8}
                      >
                        {refillLoadingId === rx.id ? (
                          <ActivityIndicator color="#ffffff" size="small" />
                        ) : (
                          <Text style={styles.refillBtnText}>
                            {refillsRemaining > 0 ? 'Request Refill' : 'No Refills'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
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
    backgroundColor: '#f5f3ff',
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
    paddingVertical: 50
  },
  emptyEmoji: {
    fontSize: 38,
    marginBottom: 10
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
    maxWidth: 280
  },
  rxCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 15,
    marginBottom: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1
  },
  rxCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  rxTitleText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2
  },
  rxDosageText: {
    fontSize: 12.5,
    color: '#7c3aed',
    fontWeight: '600'
  },
  rxStatusPill: {
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 999
  },
  rxStatusPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#7c3aed',
    textTransform: 'capitalize'
  },
  directionsBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12
  },
  directionsLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 3
  },
  directionsText: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 17
  },
  rxFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10
  },
  refillsCountText: {
    fontSize: 11.5,
    color: '#64748b'
  },
  prescribedDateText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2
  },
  refillBtn: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6
  },
  refillBtnDisabled: {
    backgroundColor: '#cbd5e1'
  },
  refillBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  }
});
