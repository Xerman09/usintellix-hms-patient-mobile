import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { MyChartService } from '../api/mychart';
import {
  VisitsIcon,
  CloseIcon,
  ChevronRightIcon,
  CalendarIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  UserIcon,
  HospitalIcon,
  ClockIcon,
  PillIcon
} from './Icons';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const s = String(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const parts = s.split(/[- :T]/);
    if (parts.length >= 3) {
      const year = parts[0];
      const month = months[parseInt(parts[1], 10) - 1] || parts[1];
      const day = parseInt(parts[2], 10);
      const time = parts.length >= 5 ? `, ${parts[3]}:${parts[4]}` : '';
      return `${day} ${month} ${year}${time}`;
    }
  } catch (e) {}
  return String(dateStr).slice(0, 16);
};

export default function MyChartVisitsModal({
  visible,
  onClose,
  initialTab = 'upcoming' // 'upcoming' | 'past'
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upcomingVisits, setUpcomingVisits] = useState([]);
  const [pastVisits, setPastVisits] = useState([]);

  // Detail Inspection States
  const [selectedEncounterId, setSelectedEncounterId] = useState(null);
  const [avsDetail, setAvsDetail] = useState(null);
  const [avsLoading, setAvsLoading] = useState(false);

  const [selectedAdmissionId, setSelectedAdmissionId] = useState(null);
  const [dischargeDetail, setDischargeDetail] = useState(null);
  const [dischargeLoading, setDischargeLoading] = useState(false);

  const fetchVisits = async () => {
    try {
      const res = await MyChartService.getVisits();
      if (res && res.success && res.data) {
        setUpcomingVisits(res.data.upcoming || []);
        setPastVisits(res.data.past || []);
      }
    } catch (err) {
      console.warn('Failed to load MyChart visits:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (visible) {
      setLoading(true);
      fetchVisits();
      setSelectedEncounterId(null);
      setAvsDetail(null);
      setSelectedAdmissionId(null);
      setDischargeDetail(null);
    }
  }, [visible]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVisits();
  };

  const handleOpenAvs = async (encounterId) => {
    setSelectedEncounterId(encounterId);
    setAvsLoading(true);
    try {
      const res = await MyChartService.getAfterVisitSummary(encounterId);
      if (res && res.success && res.data) {
        setAvsDetail(res.data);
      }
    } catch (err) {
      console.warn('Failed to load AVS:', err);
    } finally {
      setAvsLoading(false);
    }
  };

  const handleOpenDischarge = async (admissionId) => {
    setSelectedAdmissionId(admissionId);
    setDischargeLoading(true);
    try {
      const res = await MyChartService.getDischargeSummary(admissionId);
      if (res && res.success && res.data) {
        setDischargeDetail(res.data);
      }
    } catch (err) {
      console.warn('Failed to load Discharge Summary:', err);
    } finally {
      setDischargeLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedEncounterId(null);
    setAvsDetail(null);
    setSelectedAdmissionId(null);
    setDischargeDetail(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={selectedEncounterId || selectedAdmissionId ? handleCloseDetail : onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* ================= AFTER-VISIT SUMMARY (AVS) DETAIL ================= */}
        {selectedEncounterId ? (
          <View style={styles.detailContainer}>
            <View style={styles.detailHeader}>
              <TouchableOpacity onPress={handleCloseDetail} style={styles.backBtn}>
                <Text style={styles.backBtnText}>← All Visits</Text>
              </TouchableOpacity>
              <View style={styles.detailHeaderBadge}>
                <Text style={styles.detailHeaderBadgeText}>After-Visit Summary</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <CloseIcon color="#64748b" size={18} />
              </TouchableOpacity>
            </View>

            {avsLoading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Loading After-Visit Summary...</Text>
              </View>
            ) : avsDetail ? (
              <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
                {/* Header Banner */}
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>{avsDetail.title || 'Clinic Visit Summary'}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Date of Service:</Text>
                    <Text style={styles.metaValue}>{formatDate(avsDetail.date)}</Text>
                  </View>
                  {avsDetail.doctor ? (
                    <View style={styles.metaRow}>
                      <Text style={styles.metaLabel}>Care Provider:</Text>
                      <Text style={styles.metaValue}>{avsDetail.doctor}</Text>
                    </View>
                  ) : null}
                  {avsDetail.facility ? (
                    <View style={styles.metaRow}>
                      <Text style={styles.metaLabel}>Location:</Text>
                      <Text style={styles.metaValue}>
                        {avsDetail.facility} {avsDetail.department ? `(${avsDetail.department})` : ''}
                      </Text>
                    </View>
                  ) : null}
                  {avsDetail.reason ? (
                    <View style={styles.metaRow}>
                      <Text style={styles.metaLabel}>Reason for Visit:</Text>
                      <Text style={styles.metaValue}>{avsDetail.reason}</Text>
                    </View>
                  ) : null}
                  {avsDetail.sent_home_as ? (
                    <View style={styles.metaRow}>
                      <Text style={styles.metaLabel}>Disposition:</Text>
                      <Text style={styles.metaValue}>{avsDetail.sent_home_as}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Diagnoses Section */}
                {avsDetail.diagnoses && avsDetail.diagnoses.length > 0 && (
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Diagnoses Addressed</Text>
                    {avsDetail.diagnoses.map((d, idx) => (
                      <View key={`diag-${idx}`} style={styles.bulletItem}>
                        <View style={styles.bulletDot} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.bulletText}>{d.description}</Text>
                          {d.code ? <Text style={styles.bulletSubText}>ICD: {d.code}</Text> : null}
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Clinical Instructions / Patient Plan */}
                {avsDetail.instructions && avsDetail.instructions.length > 0 && (
                  <View style={[styles.sectionCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                    <Text style={[styles.sectionTitle, { color: '#166534' }]}>
                      Instructions for Home Care
                    </Text>
                    {avsDetail.instructions.map((inst, idx) => (
                      <View key={`inst-${idx}`} style={styles.instructionBox}>
                        <Text style={styles.instructionText}>{inst}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Provider Plan & Assessment */}
                {avsDetail.plan ? (
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Treatment Plan</Text>
                    <Text style={styles.bodyText}>{avsDetail.plan}</Text>
                  </View>
                ) : null}

                {/* Vitals Recorded */}
                {avsDetail.vitals && avsDetail.vitals.length > 0 && (
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Vitals Recorded During Visit</Text>
                    <View style={styles.vitalsGrid}>
                      {avsDetail.vitals.map((v, idx) => (
                        <View key={`vital-${idx}`} style={styles.vitalBox}>
                          <Text style={styles.vitalLabel}>{v.label}</Text>
                          <Text style={styles.vitalValue}>{v.value}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Medications Started / Stopped */}
                {avsDetail.medicines && avsDetail.medicines.length > 0 && (
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Medication Changes</Text>
                    {avsDetail.medicines.map((m, idx) => (
                      <View key={`med-${idx}`} style={styles.medCard}>
                        <View style={styles.medTopRow}>
                          <Text style={styles.medTitle}>{m.name} {m.dosage || ''}</Text>
                          <View
                            style={[
                              styles.medTag,
                              m.change === 'started' ? styles.medTagStarted : styles.medTagStopped
                            ]}
                          >
                            <Text
                              style={[
                                styles.medTagText,
                                m.change === 'started' ? styles.medTagTextStarted : styles.medTagTextStopped
                              ]}
                            >
                              {m.change === 'started' ? 'Started at Visit' : 'Stopped'}
                            </Text>
                          </View>
                        </View>
                        {m.directions ? (
                          <Text style={styles.medDirections}>{m.directions}</Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                )}

                {/* Follow-Up Appointment */}
                {avsDetail.follow_up && (
                  <View style={[styles.sectionCard, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                    <Text style={[styles.sectionTitle, { color: '#1e40af' }]}>Next Follow-Up</Text>
                    <View style={styles.followUpRow}>
                      <CalendarIcon color="#2563eb" size={18} />
                      <View style={{ marginLeft: 8, flex: 1 }}>
                        <Text style={styles.followUpDate}>
                          {formatDate(avsDetail.follow_up.appointment_date)} at {avsDetail.follow_up.appointment_time?.slice(0, 5) || 'TBD'}
                        </Text>
                        <Text style={styles.followUpDoctor}>
                          With {avsDetail.follow_up.doctor || 'Provider'} {avsDetail.follow_up.facility ? `at ${avsDetail.follow_up.facility}` : ''}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>
            ) : null}
          </View>
        ) : selectedAdmissionId ? (
          /* ================= INPATIENT DISCHARGE SUMMARY DETAIL ================= */
          <View style={styles.detailContainer}>
            <View style={styles.detailHeader}>
              <TouchableOpacity onPress={handleCloseDetail} style={styles.backBtn}>
                <Text style={styles.backBtnText}>← All Visits</Text>
              </TouchableOpacity>
              <View style={[styles.detailHeaderBadge, { backgroundColor: '#fef3c7' }]}>
                <Text style={[styles.detailHeaderBadgeText, { color: '#b45309' }]}>
                  Discharge Summary
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <CloseIcon color="#64748b" size={18} />
              </TouchableOpacity>
            </View>

            {dischargeLoading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Loading Inpatient Discharge Summary...</Text>
              </View>
            ) : dischargeDetail ? (
              <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Inpatient Hospital Stay</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Admission #:</Text>
                    <Text style={styles.metaValue}>{dischargeDetail.admission_number || 'N/A'}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Admitted:</Text>
                    <Text style={styles.metaValue}>{formatDate(dischargeDetail.admitted_on)}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Discharged:</Text>
                    <Text style={styles.metaValue}>{formatDate(dischargeDetail.discharged_on)}</Text>
                  </View>
                  {dischargeDetail.ward ? (
                    <View style={styles.metaRow}>
                      <Text style={styles.metaLabel}>Ward &amp; Bed:</Text>
                      <Text style={styles.metaValue}>
                        {dischargeDetail.ward} {dischargeDetail.bed ? `(${dischargeDetail.bed})` : ''}
                      </Text>
                    </View>
                  ) : null}
                  {dischargeDetail.attending ? (
                    <View style={styles.metaRow}>
                      <Text style={styles.metaLabel}>Attending Physician:</Text>
                      <Text style={styles.metaValue}>{dischargeDetail.attending}</Text>
                    </View>
                  ) : null}
                </View>

                {dischargeDetail.discharge_diagnosis && (
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Discharge Diagnosis</Text>
                    <Text style={styles.bodyText}>{dischargeDetail.discharge_diagnosis}</Text>
                  </View>
                )}

                {dischargeDetail.hospital_course && (
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Summary of Hospital Course</Text>
                    <Text style={styles.bodyText}>{dischargeDetail.hospital_course}</Text>
                  </View>
                )}

                {dischargeDetail.medicines && (
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Discharge Medications</Text>
                    <Text style={styles.bodyText}>{dischargeDetail.medicines}</Text>
                  </View>
                )}

                {dischargeDetail.diet || dischargeDetail.activity ? (
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Diet &amp; Activity Instructions</Text>
                    {dischargeDetail.diet ? (
                      <View style={{ marginBottom: 6 }}>
                        <Text style={styles.instructionLabel}>DIET:</Text>
                        <Text style={styles.bodyText}>{dischargeDetail.diet}</Text>
                      </View>
                    ) : null}
                    {dischargeDetail.activity ? (
                      <View>
                        <Text style={styles.instructionLabel}>ACTIVITY RESTRICTIONS:</Text>
                        <Text style={styles.bodyText}>{dischargeDetail.activity}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {/* Signed Doctor Pill */}
                {dischargeDetail.signed_at && (
                  <View style={styles.signedCard}>
                    <CheckCircleIcon color="#059669" size={18} />
                    <View style={{ marginLeft: 8, flex: 1 }}>
                      <Text style={styles.signedAttendingText}>
                        Signed by {dischargeDetail.attending}
                      </Text>
                      <Text style={styles.signedDateText}>
                        License: {dischargeDetail.license_no || 'MD'} • {formatDate(dischargeDetail.signed_at)}
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>
            ) : null}
          </View>
        ) : (
          /* ================= MAIN VISITS LIST VIEW ================= */
          <View style={styles.mainContainer}>
            {/* Top Bar */}
            <View style={styles.topNav}>
              <View style={styles.titleColumn}>
                <View style={styles.titleRow}>
                  <View style={styles.titleIconBox}>
                    <VisitsIcon color="#0284c7" size={20} />
                  </View>
                  <Text style={styles.screenTitle}>Visits &amp; Encounters</Text>
                </View>
                <Text style={styles.screenSubtitle}>
                  Upcoming schedule, instructions &amp; past summaries
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <CloseIcon color="#64748b" size={18} />
              </TouchableOpacity>
            </View>

            {/* Segmented Tab Selector */}
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'upcoming' && styles.tabBtnActive]}
                onPress={() => setActiveTab('upcoming')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabBtnText, activeTab === 'upcoming' && styles.tabBtnTextActive]}>
                  Upcoming ({upcomingVisits.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'past' && styles.tabBtnActive]}
                onPress={() => setActiveTab('past')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabBtnText, activeTab === 'past' && styles.tabBtnTextActive]}>
                  Past Visits ({pastVisits.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Visits Scroll List */}
            <ScrollView
              contentContainerStyle={styles.listContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284c7']} />}
              showsVerticalScrollIndicator={false}
            >
              {loading ? (
                <View style={styles.centerBox}>
                  <ActivityIndicator size="large" color="#0284c7" />
                  <Text style={styles.loadingText}>Fetching visits and prep guides...</Text>
                </View>
              ) : activeTab === 'upcoming' ? (
                /* ================= UPCOMING TAB ================= */
                upcomingVisits.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <View style={styles.emptyIconCircle}>
                      <CalendarIcon color="#94a3b8" size={32} />
                    </View>
                    <Text style={styles.emptyTitle}>No Upcoming Visits</Text>
                    <Text style={styles.emptyDesc}>
                      You have no upcoming appointments, radiology studies, or laboratory sample collections scheduled.
                    </Text>
                  </View>
                ) : (
                  upcomingVisits.map((v, idx) => {
                    const isRad = v.kind === 'imaging';
                    const isLab = v.kind === 'lab';
                    const kindBadge = isRad ? '🩻 RADIOLOGY' : isLab ? '🧪 LAB SAMPLE' : '📅 CLINIC';

                    return (
                      <View key={`upcoming-${idx}`} style={styles.visitCard}>
                        <View style={styles.cardHeaderRow}>
                          <View style={styles.kindBadge}>
                            <Text style={styles.kindBadgeText}>{kindBadge}</Text>
                          </View>
                          <View style={styles.dateBadge}>
                            <ClockIcon color="#0284c7" size={13} />
                            <Text style={styles.dateBadgeText}>{formatDate(v.when)}</Text>
                          </View>
                        </View>

                        <Text style={styles.visitTitle}>{v.title}</Text>

                        {v.facility || v.where ? (
                          <View style={styles.metaRow}>
                            <HospitalIcon color="#64748b" size={14} />
                            <Text style={styles.metaLocationText}>
                              {v.facility || v.where} {v.department ? `• ${v.department}` : ''}
                            </Text>
                          </View>
                        ) : null}

                        {v.doctor ? (
                          <View style={styles.metaRow}>
                            <UserIcon color="#64748b" size={14} />
                            <Text style={styles.metaDoctorText}>{v.doctor}</Text>
                          </View>
                        ) : null}

                        {v.reason ? (
                          <Text style={styles.reasonText}>Reason: {v.reason}</Text>
                        ) : null}

                        {/* Pre-Visit Preparation Instructions */}
                        {v.prepare && v.prepare.length > 0 && (
                          <View style={styles.prepCard}>
                            <View style={styles.prepHeaderRow}>
                              <AlertTriangleIcon color="#d97706" size={14} />
                              <Text style={styles.prepHeaderTitle}>How to Prepare</Text>
                            </View>
                            {v.prepare.map((instruction, pIdx) => (
                              <Text key={`prep-${pIdx}`} style={styles.prepInstructionText}>
                                • {instruction}
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })
                )
              ) : (
                /* ================= PAST VISITS TAB ================= */
                pastVisits.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <View style={styles.emptyIconCircle}>
                      <VisitsIcon color="#94a3b8" size={32} />
                    </View>
                    <Text style={styles.emptyTitle}>No Past Visits</Text>
                    <Text style={styles.emptyDesc}>
                      Past visits, encounter notes, and discharge summaries will appear here once finalized.
                    </Text>
                  </View>
                ) : (
                  pastVisits.map((v, idx) => {
                    const isAdmission = v.kind === 'admission';
                    const isER = v.kind === 'er';
                    const badgeText = isAdmission
                      ? '🏥 HOSPITAL STAY'
                      : isER
                      ? '🚨 EMERGENCY'
                      : '🩺 CLINIC ENCOUNTER';

                    return (
                      <View key={`past-${idx}`} style={styles.visitCard}>
                        <View style={styles.cardHeaderRow}>
                          <View style={[styles.kindBadge, isAdmission && { backgroundColor: '#fef3c7' }]}>
                            <Text
                              style={[
                                styles.kindBadgeText,
                                isAdmission && { color: '#b45309' }
                              ]}
                            >
                              {badgeText}
                            </Text>
                          </View>
                          <Text style={styles.dateStampText}>{formatDate(v.when)}</Text>
                        </View>

                        <Text style={styles.visitTitle}>{v.title}</Text>

                        {v.facility || v.department ? (
                          <View style={styles.metaRow}>
                            <HospitalIcon color="#64748b" size={14} />
                            <Text style={styles.metaLocationText}>
                              {v.facility || v.department}
                            </Text>
                          </View>
                        ) : null}

                        {v.doctor ? (
                          <View style={styles.metaRow}>
                            <UserIcon color="#64748b" size={14} />
                            <Text style={styles.metaDoctorText}>{v.doctor}</Text>
                          </View>
                        ) : null}

                        {v.reason ? (
                          <Text style={styles.reasonText} numberOfLines={2}>
                            {v.reason}
                          </Text>
                        ) : null}

                        {/* Interactive Action: View AVS or Discharge Summary */}
                        {v.kind === 'encounter' && v.has_summary && (
                          <TouchableOpacity
                            style={styles.summaryBtn}
                            activeOpacity={0.7}
                            onPress={() => handleOpenAvs(v.id)}
                          >
                            <Text style={styles.summaryBtnText}>View After-Visit Summary (AVS)</Text>
                            <ChevronRightIcon color="#0284c7" size={14} />
                          </TouchableOpacity>
                        )}

                        {v.kind === 'admission' && v.has_summary && (
                          <TouchableOpacity
                            style={[styles.summaryBtn, { borderColor: '#fde68a', backgroundColor: '#fffbeb' }]}
                            activeOpacity={0.7}
                            onPress={() => handleOpenDischarge(v.id)}
                          >
                            <Text style={[styles.summaryBtnText, { color: '#b45309' }]}>
                              View Discharge Summary
                            </Text>
                            <ChevronRightIcon color="#b45309" size={14} />
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })
                )
              )}
            </ScrollView>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  titleColumn: {
    flex: 1
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  titleIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center'
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a'
  },
  screenSubtitle: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc'
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 10
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#f1f5f9'
  },
  tabBtnActive: {
    backgroundColor: '#0284c7'
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b'
  },
  tabBtnTextActive: {
    color: '#ffffff'
  },
  listContent: {
    padding: 16,
    gap: 12
  },
  centerBox: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b'
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 10
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a'
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18
  },
  visitCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    gap: 8
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  kindBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  kindBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#475569'
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  dateBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0284c7'
  },
  dateStampText: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '600'
  },
  visitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 22
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  metaLocationText: {
    fontSize: 12.5,
    color: '#64748b'
  },
  metaDoctorText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155'
  },
  reasonText: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 2
  },
  prepCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
    marginTop: 6,
    gap: 4
  },
  prepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  prepHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b45309'
  },
  prepInstructionText: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 17
  },
  summaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginTop: 6
  },
  summaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284c7'
  },

  /* ================= DETAIL VIEW STYLES ================= */
  detailContainer: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9'
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284c7'
  },
  detailHeaderBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  detailHeaderBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7'
  },
  detailScroll: {
    padding: 16,
    gap: 14,
    paddingBottom: 40
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6
  },
  metaLabel: {
    fontSize: 12.5,
    color: '#64748b'
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b'
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a'
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 4
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0284c7',
    marginTop: 6
  },
  bulletText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1e293b'
  },
  bulletSubText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1
  },
  instructionBox: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginTop: 4
  },
  instructionText: {
    fontSize: 13,
    color: '#166534',
    lineHeight: 18
  },
  bodyText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4
  },
  vitalBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: '45%',
    flex: 1
  },
  vitalLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b'
  },
  vitalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2
  },
  medCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4
  },
  medTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  medTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a'
  },
  medTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6
  },
  medTagStarted: {
    backgroundColor: '#ecfdf5'
  },
  medTagStopped: {
    backgroundColor: '#fef2f2'
  },
  medTagText: {
    fontSize: 10,
    fontWeight: '800'
  },
  medTagTextStarted: {
    color: '#059669'
  },
  medTagTextStopped: {
    color: '#dc2626'
  },
  medDirections: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  followUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6
  },
  followUpDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e40af'
  },
  followUpDoctor: {
    fontSize: 12,
    color: '#3b82f6',
    marginTop: 1
  },
  instructionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b'
  },
  signedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0'
  },
  signedAttendingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065f46'
  },
  signedDateText: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2
  }
});
