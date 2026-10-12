import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { HealthRecordsService } from '../api/healthRecords';
import { RecordsIcon } from '../components/Icons';

const TABS = [
  { id: 'summary', label: 'Summary' },
  { id: 'allergies', label: 'Allergies' },
  { id: 'problems', label: 'Conditions' },
  { id: 'medications', label: 'Medications' },
  { id: 'immunizations', label: 'Vaccines' },
  { id: 'results', label: 'Lab Results' },
  { id: 'encounters', label: 'Visits' },
  { id: 'demographics', label: 'Demographics' }
];

export default function HealthRecordsModal({ visible, onClose }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadHealthSummary();
    }
  }, [visible]);

  const loadHealthSummary = async () => {
    setLoading(true);
    try {
      const res = await HealthRecordsService.getHealthSummary();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setData(null);
      }
    } catch (e) {
      console.error('Failed to load health summary:', e);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  const demographics = data?.demographics || {};
  const careProvider = data?.care_provider;
  const allergies = data?.allergies || [];
  const problems = data?.problems || [];
  const medications = data?.medications || [];
  const prescriptions = data?.prescriptions || [];
  const results = data?.results || [];
  const immunizations = data?.immunizations || [];
  const encounters = data?.encounters || [];

  return (
    <View style={styles.overlay}>
      <View style={styles.sheetContainer}>
        {/* Header Bar */}
        <View style={styles.sheetHeader}>
          <View style={styles.headerTitleRow}>
            <View style={styles.iconBadge}>
              <RecordsIcon color="#059669" size={18} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Health Records Summary</Text>
              <Text style={styles.headerSub}>Complete Clinical Continuity of Care (CCD)</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Switcher - Horizontal Scroll */}
        <View style={styles.tabBarWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBar}
          >
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={[styles.tabBtnText, activeTab === tab.id && styles.tabBtnTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content Body */}
        {loading ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator color="#059669" size="large" />
            <Text style={styles.loadingText}>Syncing medical records...</Text>
          </View>
        ) : !data ? (
          <View style={styles.emptyArea}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>Unable to Load Records</Text>
            <Text style={styles.emptyDesc}>Could not retrieve medical charts from hospital database.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
            
            {/* ================= TAB 1: SUMMARY ================= */}
            {activeTab === 'summary' && (
              <>
                {/* Patient Profile Card */}
                <View style={styles.profileCard}>
                  <View style={styles.profileAvatar}>
                    <Text style={styles.profileAvatarText}>
                      {(demographics.first_name || 'P')[0]?.toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.profileName}>
                      {[demographics.first_name, demographics.middle_name, demographics.last_name].filter(Boolean).join(' ')}
                    </Text>
                    <Text style={styles.profileMeta}>
                      Chart #{demographics.patient_no || 'N/A'}  •  {demographics.sex || 'Not Specified'}
                    </Text>
                    <Text style={styles.profileMeta}>DOB: {demographics.birthdate || 'N/A'}</Text>
                  </View>
                </View>

                {/* Primary Care Provider */}
                <View style={styles.sectionCard}>
                  <Text style={styles.cardHeaderTitle}>Primary Care Provider</Text>
                  {careProvider ? (
                    <View style={styles.providerBox}>
                      <Text style={styles.providerName}>
                        Dr. {careProvider.first_name} {careProvider.last_name}
                      </Text>
                      <Text style={styles.providerMeta}>
                        {careProvider.specialty || 'General Practitioner'}  •  {careProvider.department_name || 'Hospital Staff'}
                      </Text>
                      {careProvider.npi_number && (
                        <Text style={styles.providerMeta}>NPI: {careProvider.npi_number}</Text>
                      )}
                      {careProvider.phone && (
                        <Text style={styles.providerContact}>Tel: {careProvider.phone}</Text>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.emptyText}>No care provider assigned.</Text>
                  )}
                </View>

                {/* Health Metrics Snapshot Grid */}
                <Text style={styles.sectionTitle}>Medical Snapshot</Text>
                <View style={styles.snapshotGrid}>
                  <TouchableOpacity style={styles.snapshotTile} onPress={() => setActiveTab('allergies')}>
                    <Text style={styles.snapshotNum}>{allergies.length}</Text>
                    <Text style={styles.snapshotLabel}>Allergies</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.snapshotTile} onPress={() => setActiveTab('problems')}>
                    <Text style={styles.snapshotNum}>{problems.length}</Text>
                    <Text style={styles.snapshotLabel}>Conditions</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.snapshotTile} onPress={() => setActiveTab('medications')}>
                    <Text style={styles.snapshotNum}>{medications.length || prescriptions.length}</Text>
                    <Text style={styles.snapshotLabel}>Medicines</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.snapshotTile} onPress={() => setActiveTab('immunizations')}>
                    <Text style={styles.snapshotNum}>{immunizations.length}</Text>
                    <Text style={styles.snapshotLabel}>Vaccines</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.snapshotGrid, { marginTop: 8 }]}>
                  <TouchableOpacity style={styles.snapshotTile} onPress={() => setActiveTab('results')}>
                    <Text style={styles.snapshotNum}>{results.length}</Text>
                    <Text style={styles.snapshotLabel}>Lab Tests</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.snapshotTile} onPress={() => setActiveTab('encounters')}>
                    <Text style={styles.snapshotNum}>{encounters.length}</Text>
                    <Text style={styles.snapshotLabel}>Visits</Text>
                  </TouchableOpacity>
                  <View style={styles.snapshotTile}>
                    <Text style={styles.snapshotNum}>{demographics.blood_type || '-'}</Text>
                    <Text style={styles.snapshotLabel}>Blood Type</Text>
                  </View>
                  <View style={styles.snapshotTile}>
                    <Text style={styles.snapshotNum}>{demographics.civil_status || 'Single'}</Text>
                    <Text style={styles.snapshotLabel}>Status</Text>
                  </View>
                </View>
              </>
            )}

            {/* ================= TAB 2: ALLERGIES ================= */}
            {activeTab === 'allergies' && (
              <View style={styles.sectionCard}>
                <Text style={styles.cardHeaderTitle}>Medication &amp; Environmental Allergies</Text>
                {allergies.length === 0 ? (
                  <View style={styles.cleanBadge}>
                    <Text style={styles.cleanBadgeText}>✓ No known allergies on record (NKDA)</Text>
                  </View>
                ) : (
                  allergies.map((item, idx) => (
                    <View key={item.id || idx} style={styles.recordItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.recordTitle}>{item.title || item.name || 'Allergy'}</Text>
                        <Text style={styles.recordDesc}>Reported Date: {item.begin_date || item.created_at?.slice(0, 10) || 'On record'}</Text>
                        {item.referred_by && <Text style={styles.recordDesc}>Referred By: {item.referred_by}</Text>}
                      </View>
                      <View style={[styles.pillAlert, { backgroundColor: '#fef2f2' }]}>
                        <Text style={[styles.pillAlertText, { color: '#dc2626' }]}>
                          {item.severity || 'Reported'}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* ================= TAB 3: MEDICAL PROBLEMS / CONDITIONS ================= */}
            {activeTab === 'problems' && (
              <View style={styles.sectionCard}>
                <Text style={styles.cardHeaderTitle}>Current Problems &amp; Diagnoses</Text>
                {problems.length === 0 ? (
                  <Text style={styles.emptyText}>No records found.</Text>
                ) : (
                  problems.map((p, idx) => (
                    <View key={p.id || idx} style={styles.recordItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.recordTitle}>{p.title || p.diagnosis || 'Diagnosis'}</Text>
                        <Text style={styles.recordDesc}>Reported Date: {p.created_at?.slice(0, 10) || '-'}</Text>
                        {p.begin_date && <Text style={styles.recordDesc}>Start Date: {p.begin_date}</Text>}
                        {p.end_date && <Text style={styles.recordDesc}>End Date: {p.end_date}</Text>}
                      </View>
                      <View style={[styles.pillAlert, { backgroundColor: '#f0fdf4' }]}>
                        <Text style={[styles.pillAlertText, { color: '#16a34a' }]}>
                          {p.status || 'Active'}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* ================= TAB 4: MEDICATIONS & PRESCRIPTIONS ================= */}
            {activeTab === 'medications' && (
              <>
                <View style={styles.sectionCard}>
                  <Text style={styles.cardHeaderTitle}>Current Medications</Text>
                  {medications.length === 0 ? (
                    <Text style={styles.emptyText}>No records found.</Text>
                  ) : (
                    medications.map((m, idx) => (
                      <View key={m.id || idx} style={styles.recordItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.recordTitle}>{m.title || m.name || 'Medication'}</Text>
                          <Text style={styles.recordDesc}>Start Date: {m.begin_date || '-'}</Text>
                          <Text style={styles.recordDesc}>End Date: {m.end_date || 'Ongoing'}</Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>

                <View style={styles.sectionCard}>
                  <Text style={styles.cardHeaderTitle}>Active Prescriptions</Text>
                  {prescriptions.length === 0 ? (
                    <Text style={styles.emptyText}>No Results</Text>
                  ) : (
                    prescriptions.map((rx, idx) => (
                      <View key={rx.id || idx} style={styles.recordItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.recordTitle}>{rx.title || rx.drug_name || 'Rx'}</Text>
                          <Text style={styles.recordDesc}>Dosage: {rx.dosage || '-'}</Text>
                          <Text style={styles.recordDesc}>Duration: {rx.begin_date || '-'} to {rx.end_date || '-'}</Text>
                          <Text style={styles.recordDesc}>Refills: {rx.refills_allowed ? `${rx.refills_remaining ?? rx.refills_allowed} of ${rx.refills_allowed} left` : 'None'}</Text>
                        </View>
                        <View style={[styles.pillAlert, { backgroundColor: '#f5f3ff' }]}>
                          <Text style={[styles.pillAlertText, { color: '#7c3aed' }]}>
                            {rx.prescription_status || 'Active'}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </>
            )}

            {/* ================= TAB 5: IMMUNIZATIONS ================= */}
            {activeTab === 'immunizations' && (
              <View style={styles.sectionCard}>
                <Text style={styles.cardHeaderTitle}>Patient Immunization History</Text>
                {immunizations.length === 0 ? (
                  <Text style={styles.emptyText}>No records found.</Text>
                ) : (
                  immunizations.map((imm, idx) => (
                    <View key={imm.id || idx} style={styles.recordItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.recordTitle}>{imm.vaccine_name || imm.cvx_code || 'Vaccine'}</Text>
                        <Text style={styles.recordDesc}>Date Administered: {imm.administered_at || '-'}</Text>
                        {imm.manufacturer && <Text style={styles.recordDesc}>Manufacturer: {imm.manufacturer}</Text>}
                        {imm.administered_by_provider_name && <Text style={styles.recordDesc}>Administered By: {imm.administered_by_provider_name}</Text>}
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* ================= TAB 6: LAB RESULTS ================= */}
            {activeTab === 'results' && (
              <View style={styles.sectionCard}>
                <Text style={styles.cardHeaderTitle}>Diagnostic &amp; Lab Results</Text>
                {results.length === 0 ? (
                  <Text style={styles.emptyText}>No Results</Text>
                ) : (
                  results.map((r, idx) => {
                    const isAbnormal = Number(r.is_abnormal) === 1;
                    return (
                      <View key={r.id || idx} style={styles.recordItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.recordTitle}>{r.name || r.test_name || 'Lab Test'}</Text>
                          <Text style={styles.recordDesc}>Result: {[r.value, r.units].filter(Boolean).join(' ') || '-'}</Text>
                          {r.reference_range && <Text style={styles.recordDesc}>Ref Range: {r.reference_range}</Text>}
                          {r.result_date && <Text style={styles.recordDesc}>Date: {r.result_date}</Text>}
                        </View>
                        <View style={[styles.pillAlert, isAbnormal && { backgroundColor: '#fef2f2' }]}>
                          <Text style={[styles.pillAlertText, isAbnormal && { color: '#dc2626' }]}>
                            {r.flag === 'critical' ? '⚠ Critical' : isAbnormal ? 'Abnormal' : (r.status || 'Verified')}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* ================= TAB 7: ENCOUNTERS / VISITS ================= */}
            {activeTab === 'encounters' && (
              <View style={styles.sectionCard}>
                <Text style={styles.cardHeaderTitle}>Clinical Encounters &amp; Appointments</Text>
                {encounters.length === 0 ? (
                  <Text style={styles.emptyText}>No encounters recorded.</Text>
                ) : (
                  encounters.map((enc, idx) => (
                    <View key={enc.id || idx} style={styles.recordItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.recordTitle}>
                          {enc.appointment_date}  •  {enc.appointment_time?.slice(0, 5) || ''}
                        </Text>
                        <Text style={styles.recordDesc}>
                          Provider: {enc.provider_first_name} {enc.provider_last_name}
                        </Text>
                        <Text style={styles.recordDesc}>Reason: {enc.reason || enc.title || '-'}</Text>
                      </View>
                      <View style={styles.pillAlert}>
                        <Text style={styles.pillAlertText}>{enc.status || 'Completed'}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* ================= TAB 8: DEMOGRAPHICS & CONTACT ================= */}
            {activeTab === 'demographics' && (
              <>
                <View style={styles.sectionCard}>
                  <Text style={styles.cardHeaderTitle}>About &amp; Identity</Text>
                  <View style={styles.infoRow}><Text style={styles.infoKey}>Full Name</Text><Text style={styles.infoVal}>{[demographics.first_name, demographics.middle_name, demographics.last_name, demographics.suffix].filter(Boolean).join(' ') || '-'}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoKey}>Patient ID</Text><Text style={styles.infoVal}>{demographics.patient_no || '-'}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoKey}>Sex</Text><Text style={styles.infoVal}>{demographics.sex || '-'}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoKey}>Birthdate</Text><Text style={styles.infoVal}>{demographics.birthdate || '-'}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoKey}>Civil Status</Text><Text style={styles.infoVal}>{demographics.civil_status || '-'}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoKey}>Blood Type</Text><Text style={styles.infoVal}>{demographics.blood_type || '-'}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoKey}>Height</Text><Text style={styles.infoVal}>{demographics.height ? `${demographics.height} cm` : '-'}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoKey}>Weight</Text><Text style={styles.infoVal}>{demographics.weight ? `${demographics.weight} kg` : '-'}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoKey}>Language</Text><Text style={styles.infoVal}>{demographics.language || '-'}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoKey}>Ethnicity</Text><Text style={styles.infoVal}>{demographics.ethnicity || '-'}</Text></View>
                </View>

                <View style={styles.sectionCard}>
                  <Text style={styles.cardHeaderTitle}>Contact Information</Text>
                  <View style={styles.infoRow}><Text style={styles.infoKey}>Address</Text><Text style={styles.infoVal}>{[demographics.address_line, demographics.city, demographics.province, demographics.zip_code].filter(Boolean).join(', ') || '-'}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoKey}>Mobile Phone</Text><Text style={styles.infoVal}>{demographics.mobile_phone || '-'}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoKey}>Home Phone</Text><Text style={styles.infoVal}>{demographics.home_phone || '-'}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoKey}>Email</Text><Text style={styles.infoVal}>{demographics.email || '-'}</Text></View>
                </View>
              </>
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
    height: '88%',
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
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0f172a'
  },
  headerSub: {
    fontSize: 11,
    color: '#64748b'
  },
  closeBtn: {
    padding: 6
  },
  closeBtnText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '700'
  },
  tabBarWrapper: {
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    height: 48
  },
  tabBar: {
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  tabBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748b'
  },
  tabBtnTextActive: {
    color: '#059669',
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
  emptyArea: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4
  },
  emptyDesc: {
    fontSize: 12.5,
    color: '#64748b',
    textAlign: 'center'
  },
  contentScroll: {
    padding: 16,
    paddingBottom: 40
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center'
  },
  profileAvatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800'
  },
  profileName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2
  },
  profileMeta: {
    fontSize: 11.5,
    color: '#64748b'
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14
  },
  cardHeaderTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10
  },
  providerBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8
  },
  providerName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2
  },
  providerMeta: {
    fontSize: 11.5,
    color: '#64748b',
    marginBottom: 2
  },
  providerContact: {
    fontSize: 11,
    color: '#059669',
    marginTop: 4,
    fontWeight: '600'
  },
  emptyText: {
    fontSize: 12.5,
    color: '#94a3b8',
    fontStyle: 'italic',
    paddingVertical: 8
  },
  snapshotGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  snapshotTile: {
    width: '23%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center'
  },
  snapshotNum: {
    fontSize: 17,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 2
  },
  snapshotLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600'
  },
  cleanBadge: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 8,
    padding: 10
  },
  cleanBadgeText: {
    color: '#059669',
    fontSize: 12.5,
    fontWeight: '700'
  },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  recordTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a'
  },
  recordDesc: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2
  },
  pillAlert: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999
  },
  pillAlertText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748b'
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  infoKey: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600'
  },
  infoVal: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
    maxWidth: '65%',
    textAlign: 'right'
  }
});
