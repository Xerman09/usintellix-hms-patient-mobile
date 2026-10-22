import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { MyChartService } from '../api/mychart';
import {
  LabIcon,
  CloseIcon,
  ChevronRightIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ChatIcon,
  UserIcon,
  TrendIcon,
  InfoCircleIcon
} from './Icons';
import { getAnalyteExplanation, parseRangeAndValue } from '../utils/analyteDictionary';
import MyChartTrendModal from './MyChartTrendModal';
import MyChartAskDoctorModal from './MyChartAskDoctorModal';

const CATEGORY_NAMES = {
  hematology: 'Blood count',
  coagulation: 'Blood clotting',
  chemistry: 'Blood chemistry',
  blood_gas: 'Blood gas',
  urinalysis: 'Urine',
  microbiology: 'Culture',
  serology: 'Antibody test',
  blood_bank: 'Blood bank',
  xray: 'X-Ray',
  ultrasound: 'Ultrasound',
  ct: 'CT Scan',
  mri: 'MRI Scan',
  fluoroscopy: 'Fluoroscopy',
  mammography: 'Mammogram'
};

const getCategoryLabel = (cat) => {
  if (!cat) return 'General';
  const key = String(cat).toLowerCase();
  return CATEGORY_NAMES[key] || cat.toUpperCase();
};

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

export default function MyChartResultsModal({
  visible,
  onClose,
  onAskDoctor
}) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resultsData, setResultsData] = useState([]);
  const [filterKind, setFilterKind] = useState(''); // '' | 'lab' | 'imaging' | 'abnormal'
  const [searchQuery, setSearchQuery] = useState('');

  // Order Detail Inspection State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [orderDetail, setOrderDetail] = useState(null);

  // Phase M2: Plain-Language & Trend Modals
  const [expandedExplanation, setExpandedExplanation] = useState({});
  const [activeTrendAnalyte, setActiveTrendAnalyte] = useState(null);
  const [showAskModal, setShowAskModal] = useState(false);

  const fetchResults = async () => {
    try {
      const filters = {};
      if (filterKind === 'lab' || filterKind === 'imaging') {
        filters.kind = filterKind;
      }
      if (searchQuery.trim()) {
        filters.q = searchQuery.trim();
      }

      const res = await MyChartService.getResults(filters);
      if (res && res.success && res.data) {
        setResultsData(res.data.items || []);
      }
    } catch (e) {
      console.warn('Failed to load test results:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (visible) {
      setLoading(true);
      fetchResults();
    } else {
      setSelectedOrder(null);
      setOrderDetail(null);
      setExpandedExplanation({});
    }
  }, [visible, filterKind]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchResults();
  };

  const handleOpenDetail = async (item) => {
    setSelectedOrder(item);
    setDetailLoading(true);
    setExpandedExplanation({});
    try {
      const res = await MyChartService.getResultDetail(item.order_id);
      if (res && res.success && res.data) {
        setOrderDetail(res.data);
      }
    } catch (e) {
      console.warn('Failed to load result details:', e);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedOrder(null);
    setOrderDetail(null);
    setExpandedExplanation({});
  };

  const toggleExplanation = (key) => {
    setExpandedExplanation((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Filter abnormal in-memory if filterKind === 'abnormal'
  const displayedItems = resultsData.filter((item) => {
    if (filterKind === 'abnormal') {
      return item.abnormal > 0;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.test_name?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.ordering_doctor?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={selectedOrder ? handleCloseDetail : onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* ================= DETAIL INSPECTION VIEW ================= */}
        {selectedOrder ? (
          <View style={styles.detailContainer}>
            {/* Detail Navigation Header */}
            <View style={styles.detailHeader}>
              <TouchableOpacity
                onPress={handleCloseDetail}
                style={styles.backBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.backBtnText}>← All Results</Text>
              </TouchableOpacity>
              <View style={styles.detailHeaderBadge}>
                <Text style={styles.detailHeaderBadgeText}>
                  {selectedOrder.kind === 'imaging' ? '🩻 Imaging' : '🧪 Laboratory'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <CloseIcon color="#64748b" size={18} />
              </TouchableOpacity>
            </View>

            {detailLoading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Loading report details...</Text>
              </View>
            ) : orderDetail ? (
              <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
                {/* Order Summary Card */}
                <View style={styles.summaryCard}>
                  <Text style={styles.orderTestName}>{orderDetail.test_name}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Section:</Text>
                    <Text style={styles.metaValue}>{getCategoryLabel(orderDetail.category)}</Text>
                  </View>
                  {orderDetail.specimen ? (
                    <View style={styles.metaRow}>
                      <Text style={styles.metaLabel}>Specimen:</Text>
                      <Text style={styles.metaValue}>{orderDetail.specimen}</Text>
                    </View>
                  ) : null}
                  {orderDetail.ordering_doctor ? (
                    <View style={styles.metaRow}>
                      <Text style={styles.metaLabel}>Ordering Doctor:</Text>
                      <Text style={styles.metaValue}>{orderDetail.ordering_doctor}</Text>
                    </View>
                  ) : null}
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Date Resulted:</Text>
                    <Text style={styles.metaValue}>{formatDate(orderDetail.resulted_at)}</Text>
                  </View>
                </View>

                {/* IMAGING REPORT SECTION */}
                {orderDetail.kind === 'imaging' && orderDetail.report ? (
                  <View style={styles.imagingReportBox}>
                    <View style={styles.imagingHeaderRow}>
                      <Text style={styles.imagingTitle}>Radiology Impression &amp; Findings</Text>
                      {orderDetail.report.signed_at && (
                        <View style={styles.signedPill}>
                          <CheckCircleIcon color="#10b981" size={13} />
                          <Text style={styles.signedText}>Signed</Text>
                        </View>
                      )}
                    </View>

                    {orderDetail.report.impression ? (
                      <View style={styles.impressionBox}>
                        <Text style={styles.impressionLabel}>IMPRESSION</Text>
                        <Text style={styles.impressionText}>{orderDetail.report.impression}</Text>
                      </View>
                    ) : null}

                    {orderDetail.report.findings ? (
                      <View style={styles.findingsBox}>
                        <Text style={styles.findingsLabel}>FINDINGS</Text>
                        <Text style={styles.findingsText}>{orderDetail.report.findings}</Text>
                      </View>
                    ) : null}

                    {orderDetail.report.recommendation ? (
                      <View style={styles.findingsBox}>
                        <Text style={styles.findingsLabel}>RECOMMENDATION</Text>
                        <Text style={styles.findingsText}>{orderDetail.report.recommendation}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {/* LABORATORY ANALYTES & PLAIN-LANGUAGE SECTION (PHASE M2) */}
                {orderDetail.results && orderDetail.results.length > 0 ? (
                  <View style={styles.analytesContainer}>
                    <View style={styles.analytesHeaderRow}>
                      <Text style={styles.analytesHeaderTitle}>Test Components &amp; Measurements</Text>
                      <Text style={styles.analytesCount}>{orderDetail.results.length} items</Text>
                    </View>

                    {orderDetail.results.map((row, idx) => {
                      const parsedRange = parseRangeAndValue(row.value, row.reference_range);
                      const explanation = getAnalyteExplanation(row.name, row.code, orderDetail.explanations);
                      const isExpanded = !!expandedExplanation[row.name];
                      const isNumeric = parsedRange.value !== null;

                      return (
                        <View
                          key={`analyte-${idx}`}
                          style={[
                            styles.analyteCard,
                            row.abnormal && styles.analyteCardAbnormal,
                            idx % 2 === 1 && !row.abnormal && styles.analyteCardAlt
                          ]}
                        >
                          {/* Top Row: Name, Value, Standard Range */}
                          <View style={styles.analyteTopRow}>
                            <View style={{ flex: 1.8 }}>
                              <Text style={[styles.analyteName, row.abnormal && styles.analyteNameAbnormal]}>
                                {row.name}
                              </Text>
                              {row.code ? <Text style={styles.analyteCode}>{row.code}</Text> : null}
                            </View>

                            <View style={styles.analyteValueCol}>
                              <View style={styles.valueRow}>
                                <Text style={[styles.analyteValue, row.abnormal && styles.analyteValueAbnormal]}>
                                  {row.value}
                                </Text>
                                {row.abnormal && (
                                  <View style={styles.abnormalDot}>
                                    <Text style={styles.abnormalDotText}>!</Text>
                                  </View>
                                )}
                              </View>
                              {row.units ? <Text style={styles.analyteUnits}>{row.units}</Text> : null}
                            </View>

                            <View style={styles.refRangeCol}>
                              <Text style={styles.refRangeLabel}>Standard</Text>
                              <Text style={styles.refRangeText}>{row.reference_range || 'Ref Range'}</Text>
                            </View>
                          </View>

                          {/* Phase M2: Horizontal Visual Range Bar (if range available) */}
                          {parsedRange.hasRange && (
                            <View style={styles.rangeBarBox}>
                              <View style={styles.rangeBarTrack}>
                                <View style={styles.rangeBarNormalZone} />
                                {/* Marker Pointer Needle */}
                                <View
                                  style={[
                                    styles.rangeBarMarker,
                                    { left: `${parsedRange.percent}%` },
                                    parsedRange.status === 'high' && { backgroundColor: '#dc2626' },
                                    parsedRange.status === 'low' && { backgroundColor: '#2563eb' }
                                  ]}
                                />
                              </View>
                              <View style={styles.rangeBarLegend}>
                                <Text style={styles.rangeLegendText}>
                                  {parsedRange.low !== null ? `${parsedRange.low}` : ''}
                                </Text>
                                <View
                                  style={[
                                    styles.rangeStatusBadge,
                                    parsedRange.status === 'normal'
                                      ? styles.rangeStatusBadgeNormal
                                      : styles.rangeStatusBadgeAbnormal
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.rangeStatusText,
                                      parsedRange.status === 'normal'
                                        ? styles.rangeStatusTextNormal
                                        : styles.rangeStatusTextAbnormal
                                    ]}
                                  >
                                    {parsedRange.status === 'normal'
                                      ? 'In Standard Range'
                                      : parsedRange.status === 'high'
                                      ? 'Elevated Above Range'
                                      : 'Below Range'}
                                  </Text>
                                </View>
                                <Text style={styles.rangeLegendText}>
                                  {parsedRange.high !== null ? `${parsedRange.high}` : ''}
                                </Text>
                              </View>
                            </View>
                          )}

                          {/* Action Buttons: Trend & Explanation Accordion */}
                          <View style={styles.analyteActionsRow}>
                            {/* Trend Button (for numeric values) */}
                            {isNumeric && (
                              <TouchableOpacity
                                style={styles.actionBtnTrend}
                                activeOpacity={0.7}
                                onPress={() =>
                                  setActiveTrendAnalyte({
                                    name: row.name,
                                    code: row.code,
                                    value: row.value,
                                    units: row.units,
                                    referenceRange: row.reference_range
                                  })
                                }
                              >
                                <TrendIcon color="#2563eb" size={13} />
                                <Text style={styles.actionBtnTrendText}>View Trend</Text>
                              </TouchableOpacity>
                            )}

                            {/* What this means accordion toggle */}
                            {explanation && (
                              <TouchableOpacity
                                style={[styles.actionBtnExpl, isExpanded && styles.actionBtnExplActive]}
                                activeOpacity={0.7}
                                onPress={() => toggleExplanation(row.name)}
                              >
                                <InfoCircleIcon color={isExpanded ? '#1d4ed8' : '#0891b2'} size={13} />
                                <Text
                                  style={[
                                    styles.actionBtnExplText,
                                    isExpanded && styles.actionBtnExplTextActive
                                  ]}
                                >
                                  {isExpanded ? 'Hide Details' : 'What does this mean?'}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>

                          {/* Plain-Language Explanation Card (Collapsible) */}
                          {explanation && isExpanded && (
                            <View style={styles.explanationBox}>
                              <View style={styles.explanationHeaderRow}>
                                <Text style={styles.explanationTitle}>
                                  Understanding {row.name}
                                </Text>
                                <View style={styles.libraryBadge}>
                                  <Text style={styles.libraryBadgeText}>Medical Guide</Text>
                                </View>
                              </View>

                              {explanation.what_it_measures ? (
                                <View style={styles.explanationSection}>
                                  <Text style={styles.explanationSectionLabel}>WHAT IT MEASURES</Text>
                                  <Text style={styles.explanationSectionBody}>
                                    {explanation.what_it_measures}
                                  </Text>
                                </View>
                              ) : null}

                              {explanation.why_ordered ? (
                                <View style={styles.explanationSection}>
                                  <Text style={styles.explanationSectionLabel}>WHY DOCTORS CHECK THIS</Text>
                                  <Text style={styles.explanationSectionBody}>
                                    {explanation.why_ordered}
                                  </Text>
                                </View>
                              ) : null}

                              {explanation.high_means && (
                                <View style={styles.explanationSection}>
                                  <Text style={[styles.explanationSectionLabel, { color: '#b91c1c' }]}>
                                    IF ELEVATED / HIGH
                                  </Text>
                                  <Text style={styles.explanationSectionBody}>
                                    {explanation.high_means}
                                  </Text>
                                </View>
                              )}

                              {explanation.low_means && (
                                <View style={styles.explanationSection}>
                                  <Text style={[styles.explanationSectionLabel, { color: '#0369a1' }]}>
                                    IF LOW / DECREASED
                                  </Text>
                                  <Text style={styles.explanationSectionBody}>
                                    {explanation.low_means}
                                  </Text>
                                </View>
                              )}

                              {explanation.source ? (
                                <Text style={styles.explanationSource}>
                                  Source: {explanation.source}
                                </Text>
                              ) : null}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ) : null}

                {/* Patient Advisory Box */}
                <View style={styles.disclaimerCard}>
                  <Text style={styles.disclaimerTitle}>About Your Results</Text>
                  <Text style={styles.disclaimerText}>
                    These results have been verified and released into your health chart. Reference ranges indicate normal values for most healthy adults. Your doctor evaluates your results in context with your medical history.
                  </Text>
                </View>

                {/* "Ask Doctor" Button (Phase M2 in-app sheet) */}
                {orderDetail.ordering_doctor ? (
                  <TouchableOpacity
                    style={styles.askDoctorBtn}
                    activeOpacity={0.8}
                    onPress={() => setShowAskModal(true)}
                  >
                    <ChatIcon color="#ffffff" size={18} />
                    <Text style={styles.askDoctorBtnText}>
                      Ask Doctor about {orderDetail.test_name}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </ScrollView>
            ) : null}
          </View>
        ) : (
          /* ================= MAIN RESULTS LIST VIEW ================= */
          <View style={styles.mainContainer}>
            {/* Top Navigation */}
            <View style={styles.topNav}>
              <View style={styles.titleColumn}>
                <View style={styles.titleRow}>
                  <View style={styles.titleIconBox}>
                    <LabIcon color="#2563eb" size={20} />
                  </View>
                  <Text style={styles.screenTitle}>Test Results</Text>
                </View>
                <Text style={styles.screenSubtitle}>
                  Checked and released laboratory &amp; imaging reports
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <CloseIcon color="#64748b" size={18} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchBarBox}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by test, panel, or analyte..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                onSubmitEditing={fetchResults}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                  <Text style={styles.clearSearchText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Pills */}
            <View style={styles.filterPillsRow}>
              {[
                { id: '', label: 'All Results' },
                { id: 'lab', label: '🧪 Laboratory' },
                { id: 'imaging', label: '🩻 Imaging' },
                { id: 'abnormal', label: '⚠️ Abnormal' }
              ].map((pill) => {
                const isSelected = filterKind === pill.id;
                return (
                  <TouchableOpacity
                    key={`filter-${pill.id}`}
                    style={[styles.filterPill, isSelected && styles.filterPillSelected]}
                    onPress={() => setFilterKind(pill.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterPillText, isSelected && styles.filterPillTextSelected]}>
                      {pill.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Results List */}
            <ScrollView
              contentContainerStyle={styles.listContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />}
              showsVerticalScrollIndicator={false}
            >
              {loading ? (
                <View style={styles.centerBox}>
                  <ActivityIndicator size="large" color="#2563eb" />
                  <Text style={styles.loadingText}>Fetching released reports...</Text>
                </View>
              ) : displayedItems.length === 0 ? (
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIconCircle}>
                    <LabIcon color="#94a3b8" size={32} />
                  </View>
                  <Text style={styles.emptyTitle}>No Released Results</Text>
                  <Text style={styles.emptyDesc}>
                    {searchQuery.trim()
                      ? `No results match "${searchQuery}". Try adjusting your search.`
                      : 'You do not have any released test results under this filter. Results appear here once verified by the clinic.'}
                  </Text>
                </View>
              ) : (
                displayedItems.map((item) => {
                  const hasAbnormal = item.abnormal > 0;
                  const isImaging = item.kind === 'imaging';

                  return (
                    <TouchableOpacity
                      key={`order-${item.order_id}`}
                      style={[styles.orderCard, hasAbnormal && styles.orderCardAbnormal]}
                      activeOpacity={0.7}
                      onPress={() => handleOpenDetail(item)}
                    >
                      <View style={styles.orderCardTop}>
                        <View style={styles.orderKindBadge}>
                          <Text style={styles.orderKindBadgeText}>
                            {isImaging ? '🩻 IMAGING' : '🧪 LAB'}
                          </Text>
                        </View>
                        <Text style={styles.orderCategoryText}>
                          {getCategoryLabel(item.category)}
                        </Text>
                        <Text style={styles.orderDateText}>
                          {formatDate(item.resulted_at || item.collected_at)}
                        </Text>
                      </View>

                      <Text style={styles.orderTitle} numberOfLines={2}>
                        {item.test_name}
                      </Text>

                      <View style={styles.orderCardBottom}>
                        {item.ordering_doctor ? (
                          <View style={styles.doctorRow}>
                            <UserIcon color="#64748b" size={13} />
                            <Text style={styles.doctorName} numberOfLines={1}>
                              {item.ordering_doctor}
                            </Text>
                          </View>
                        ) : <View />}

                        <View style={styles.statusChipRow}>
                          {hasAbnormal ? (
                            <View style={styles.abnormalChip}>
                              <AlertTriangleIcon color="#dc2626" size={12} />
                              <Text style={styles.abnormalChipText}>
                                {item.abnormal} Abnormal
                              </Text>
                            </View>
                          ) : (
                            <View style={styles.normalChip}>
                              <CheckCircleIcon color="#059669" size={12} />
                              <Text style={styles.normalChipText}>Normal</Text>
                            </View>
                          )}
                          <ChevronRightIcon color="#94a3b8" size={14} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        )}

        {/* Phase M2: Longitudinal Trend Modal */}
        <MyChartTrendModal
          visible={!!activeTrendAnalyte}
          onClose={() => setActiveTrendAnalyte(null)}
          analyteName={activeTrendAnalyte?.name}
          analyteCode={activeTrendAnalyte?.code}
          currentValue={activeTrendAnalyte?.value}
          units={activeTrendAnalyte?.units}
          referenceRange={activeTrendAnalyte?.referenceRange}
        />

        {/* Phase M2: In-App Ask Doctor Modal */}
        <MyChartAskDoctorModal
          visible={showAskModal}
          onClose={() => setShowAskModal(false)}
          order={orderDetail}
          onSuccessGoToMessages={() => {
            setShowAskModal(false);
            if (onAskDoctor) onAskDoctor(orderDetail);
          }}
        />
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
    backgroundColor: '#eff6ff',
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
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: 13.5,
    color: '#0f172a'
  },
  clearSearchBtn: {
    padding: 6
  },
  clearSearchText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '700'
  },
  filterPillsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  filterPillSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb'
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569'
  },
  filterPillTextSelected: {
    color: '#ffffff',
    fontWeight: '700'
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
  orderCard: {
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
  orderCardAbnormal: {
    borderColor: '#fca5a5',
    backgroundColor: '#fffdfd'
  },
  orderCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  orderKindBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6
  },
  orderKindBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#475569'
  },
  orderCategoryText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748b'
  },
  orderDateText: {
    fontSize: 11.5,
    color: '#94a3b8',
    marginLeft: 'auto'
  },
  orderTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 20
  },
  orderCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1
  },
  doctorName: {
    fontSize: 12,
    color: '#64748b'
  },
  statusChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  normalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12
  },
  normalChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#059669'
  },
  abnormalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca'
  },
  abnormalChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#dc2626'
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
    color: '#2563eb'
  },
  detailHeaderBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  detailHeaderBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8'
  },
  detailScroll: {
    padding: 16,
    gap: 14,
    paddingBottom: 36
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6
  },
  orderTestName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
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
  imagingReportBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12
  },
  imagingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  imagingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a'
  },
  signedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  signedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669'
  },
  impressionBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
    gap: 4
  },
  impressionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1d4ed8',
    letterSpacing: 0.5
  },
  impressionText: {
    fontSize: 13.5,
    color: '#1e293b',
    lineHeight: 19,
    fontWeight: '600'
  },
  findingsBox: {
    gap: 4
  },
  findingsLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5
  },
  findingsText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19
  },

  /* ================= PHASE M2 ANALYTE STYLES ================= */
  analytesContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12
  },
  analytesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: '#f1f5f9'
  },
  analytesHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a'
  },
  analytesCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b'
  },
  analyteCard: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10
  },
  analyteCardAlt: {
    backgroundColor: '#fafbfc'
  },
  analyteCardAbnormal: {
    borderColor: '#fca5a5',
    backgroundColor: '#fffdfd'
  },
  analyteTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  analyteName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a'
  },
  analyteNameAbnormal: {
    color: '#991b1b'
  },
  analyteCode: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1
  },
  analyteValueCol: {
    flex: 1.2,
    alignItems: 'flex-end'
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  analyteValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a'
  },
  analyteValueAbnormal: {
    color: '#dc2626'
  },
  abnormalDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center'
  },
  abnormalDotText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ffffff'
  },
  analyteUnits: {
    fontSize: 11,
    color: '#64748b'
  },
  refRangeCol: {
    flex: 1.3,
    alignItems: 'flex-end'
  },
  refRangeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5
  },
  refRangeText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
    marginTop: 1
  },

  /* Visual Range Bar */
  rangeBarBox: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  rangeBarTrack: {
    height: 7,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    position: 'relative',
    overflow: 'visible',
    justifyContent: 'center'
  },
  rangeBarNormalZone: {
    position: 'absolute',
    left: '20%',
    width: '60%',
    height: '100%',
    backgroundColor: '#a7f3d0',
    borderRadius: 4
  },
  rangeBarMarker: {
    position: 'absolute',
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#059669',
    borderWidth: 2,
    borderColor: '#ffffff',
    marginLeft: -5.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2
  },
  rangeBarLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6
  },
  rangeLegendText: {
    fontSize: 10,
    color: '#94a3b8'
  },
  rangeStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  rangeStatusBadgeNormal: {
    backgroundColor: '#ecfdf5'
  },
  rangeStatusBadgeAbnormal: {
    backgroundColor: '#fef2f2'
  },
  rangeStatusText: {
    fontSize: 10.5,
    fontWeight: '700'
  },
  rangeStatusTextNormal: {
    color: '#059669'
  },
  rangeStatusTextAbnormal: {
    color: '#dc2626'
  },

  /* Action Buttons Row */
  analyteActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6
  },
  actionBtnTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe'
  },
  actionBtnTrendText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2563eb'
  },
  actionBtnExpl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#ccfbf1'
  },
  actionBtnExplActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe'
  },
  actionBtnExplText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0891b2'
  },
  actionBtnExplTextActive: {
    color: '#1d4ed8'
  },

  /* Plain-Language Explanation Details */
  explanationBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 4,
    gap: 8
  },
  explanationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  explanationTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a'
  },
  libraryBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  libraryBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#0369a1'
  },
  explanationSection: {
    gap: 2
  },
  explanationSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5
  },
  explanationSectionBody: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17
  },
  explanationSource: {
    fontSize: 10,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 2
  },

  /* Patient Advisory & Ask Doctor */
  disclaimerCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4
  },
  disclaimerTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569'
  },
  disclaimerText: {
    fontSize: 11.5,
    color: '#64748b',
    lineHeight: 16
  },
  askDoctorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2
  },
  askDoctorBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff'
  }
});
