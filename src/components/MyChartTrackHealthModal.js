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
  Alert,
  SafeAreaView
} from 'react-native';
import { MyChartService } from '../api/mychart';
import {
  TrackHealthIcon,
  CloseIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  TrendIcon,
  TrashIcon,
  ClockIcon
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

const VITAL_KINDS = [
  { id: 'bp', label: 'Blood Pressure', emoji: '🩺', units: 'mmHg', pair: true },
  { id: 'glucose', label: 'Blood Sugar', emoji: '🩸', units: 'mg/dL', pair: false },
  { id: 'weight', label: 'Weight', emoji: '⚖️', units: 'lbs', pair: false },
  { id: 'temperature', label: 'Temperature', emoji: '🌡️', units: '°F', pair: false },
  { id: 'spo2', label: 'Oxygen (SpO2)', emoji: '🫁', units: '%', pair: false },
  { id: 'steps', label: 'Daily Steps', emoji: '🚶', units: 'steps', pair: false },
  { id: 'pain', label: 'Pain Score', emoji: '⚡', units: '0-10', pair: false }
];

export default function MyChartTrackHealthModal({
  visible,
  onClose
}) {
  const [selectedKind, setSelectedKind] = useState('bp');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Loaded Data
  const [metaData, setMetaData] = useState(null);
  const [readingsList, setReadingsList] = useState([]);

  // New Reading Entry Sheet State
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [val1, setVal1] = useState('');
  const [val2, setVal2] = useState('');
  const [noteTag, setNoteTag] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTrackData = async (kind = selectedKind) => {
    try {
      const res = await MyChartService.getReadings(kind, 90);
      if (res && res.success && res.data) {
        setMetaData(res.data);
        setReadingsList(res.data.readings || []);
      }
    } catch (err) {
      console.warn('Failed to load health track readings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (visible) {
      setLoading(true);
      fetchTrackData(selectedKind);
      setShowEntryModal(false);
    }
  }, [visible, selectedKind]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrackData(selectedKind);
  };

  const handleSelectKind = (kindId) => {
    setSelectedKind(kindId);
    setLoading(true);
    fetchTrackData(kindId);
  };

  const currentKindConfig = VITAL_KINDS.find((k) => k.id === selectedKind) || VITAL_KINDS[0];
  const activeGoal = metaData?.goals?.[selectedKind];
  const activeBand = metaData?.bands?.[selectedKind];

  const handleOpenEntry = () => {
    setVal1('');
    setVal2('');
    setNoteTag('');
    setShowEntryModal(true);
  };

  const handleSubmitReading = async () => {
    if (!val1.trim()) {
      Alert.alert('Value Required', `Please enter your ${currentKindConfig.label} reading.`);
      return;
    }
    if (currentKindConfig.pair && !val2.trim()) {
      Alert.alert('Diastolic Required', 'Please enter your bottom (diastolic) number.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        kind: selectedKind,
        value_1: parseFloat(val1),
        note: noteTag.trim() || null
      };
      if (currentKindConfig.pair) {
        payload.value_2 = parseFloat(val2);
      }

      const res = await MyChartService.recordReading(payload);
      if (res && res.success) {
        setShowEntryModal(false);
        fetchTrackData(selectedKind);
        if (res.data?.out_of_band) {
          Alert.alert(
            'Safety Range Advisory',
            res.message || 'This reading is outside your customary target. Your care team has been informed.'
          );
        }
      } else {
        Alert.alert('Notice', res?.message || 'Could not record your reading.');
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to record reading. Please check your network connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReading = (readingId) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to remove this reading?',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await MyChartService.deleteReading(readingId);
              if (res && res.success) {
                fetchTrackData(selectedKind);
              }
            } catch (e) {
              console.warn(e);
            }
          }
        }
      ]
    );
  };

  // Sparkline calculation
  const latestReading = readingsList[0] || null;
  const numericPoints = [...readingsList].reverse(); // chronological

  const minV = numericPoints.length > 0 ? Math.min(...numericPoints.map((p) => p.value_1)) : 0;
  const maxV = numericPoints.length > 0 ? Math.max(...numericPoints.map((p) => p.value_1)) : 100;
  const spanV = maxV - minV || 1;

  const quickTags =
    selectedKind === 'glucose'
      ? ['Fasting', 'Post-Meal', 'Bedtime']
      : selectedKind === 'bp'
      ? ['Resting', 'Morning', 'Evening']
      : ['Morning', 'After Exercise', 'Bedtime'];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Top Bar */}
          <View style={styles.topNav}>
            <View style={styles.titleColumn}>
              <View style={styles.titleRow}>
                <View style={styles.titleIconBox}>
                  <TrackHealthIcon color="#e11d48" size={20} />
                </View>
                <Text style={styles.screenTitle}>Track My Health</Text>
              </View>
              <Text style={styles.screenSubtitle}>
                Home vitals, trends &amp; remote monitoring
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <CloseIcon color="#64748b" size={18} />
            </TouchableOpacity>
          </View>

          {/* Horizontal Vitals Category Selector */}
          <View style={styles.categoryScrollBox}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryPillRow}
            >
              {VITAL_KINDS.map((cat) => {
                const isSelected = selectedKind === cat.id;
                const count = metaData?.counts?.[cat.id]?.count || 0;
                return (
                  <TouchableOpacity
                    key={`cat-${cat.id}`}
                    style={[styles.catPill, isSelected && styles.catPillSelected]}
                    onPress={() => handleSelectKind(cat.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.catEmoji}>{cat.emoji}</Text>
                    <Text style={[styles.catLabel, isSelected && styles.catLabelSelected]}>
                      {cat.label}
                    </Text>
                    {count > 0 && (
                      <View style={[styles.countBadge, isSelected && styles.countBadgeSelected]}>
                        <Text style={[styles.countBadgeText, isSelected && styles.countBadgeTextSelected]}>
                          {count}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e11d48']} />}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color="#e11d48" />
                <Text style={styles.loadingText}>Fetching self-readings...</Text>
              </View>
            ) : (
              <>
                {/* Hero Summary Card */}
                <View style={styles.heroCard}>
                  <View style={styles.heroTopRow}>
                    <View>
                      <Text style={styles.heroKindLabel}>
                        LATEST {currentKindConfig.label.toUpperCase()}
                      </Text>
                      <Text style={styles.heroValue}>
                        {latestReading
                          ? currentKindConfig.pair
                            ? `${latestReading.value_1}/${latestReading.value_2}`
                            : `${latestReading.value_1}`
                          : '—'}{' '}
                        <Text style={styles.heroUnits}>{currentKindConfig.units}</Text>
                      </Text>
                      {latestReading && (
                        <Text style={styles.heroDate}>
                          Recorded: {formatDate(latestReading.taken_at)}
                        </Text>
                      )}
                    </View>

                    {/* Log New Reading Button */}
                    <TouchableOpacity
                      style={styles.logBtn}
                      activeOpacity={0.8}
                      onPress={handleOpenEntry}
                    >
                      <Text style={styles.logBtnText}>+ Log Reading</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Target Goal Banner */}
                  {activeGoal && (
                    <View style={styles.goalBanner}>
                      <Text style={styles.goalBannerText}>
                        🎯 Target Goal: {activeGoal.target_low ? `${activeGoal.target_low}` : ''}
                        {activeGoal.target_low && activeGoal.target_high ? ' – ' : ''}
                        {activeGoal.target_high ? `${activeGoal.target_high}` : ''} {currentKindConfig.units}
                        {activeGoal.set_by === 'doctor' ? ' (Prescribed by Doctor)' : ''}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Trend Visualizer */}
                <View style={styles.chartCard}>
                  <View style={styles.chartHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <TrendIcon color="#e11d48" size={16} />
                      <Text style={styles.chartTitle}>Historical Trend (Last 90 Days)</Text>
                    </View>
                    <Text style={styles.chartCountText}>{readingsList.length} Entries</Text>
                  </View>

                  {numericPoints.length === 0 ? (
                    <View style={styles.emptyChart}>
                      <Text style={styles.emptyChartText}>
                        No {currentKindConfig.label} readings recorded yet. Tap "+ Log Reading" to start monitoring your trends.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.sparklineContainer}>
                      <View style={styles.sparklinePointsArea}>
                        {numericPoints.slice(-8).map((pt, idx) => {
                          const yPct = Math.max(10, Math.min(90, ((pt.value_1 - minV) / spanV) * 100));
                          const isLatest = idx === Math.min(7, numericPoints.length - 1);

                          return (
                            <View key={`pt-${idx}`} style={styles.sparklineCol}>
                              <View style={[styles.sparklineMarker, { bottom: `${yPct}%` }]}>
                                <View
                                  style={[
                                    styles.sparkDot,
                                    pt.out_of_band && styles.sparkDotAbnormal,
                                    isLatest && styles.sparkDotLatest
                                  ]}
                                />
                                <View style={styles.valPill}>
                                  <Text style={styles.valPillText}>
                                    {currentKindConfig.pair ? `${pt.value_1}/${pt.value_2}` : pt.value_1}
                                  </Text>
                                </View>
                              </View>
                              <Text style={styles.sparkDateText}>
                                {String(pt.taken_at).slice(5, 10)}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>

                {/* Recorded Timeline Table */}
                <View style={styles.logCard}>
                  <Text style={styles.logCardTitle}>Recorded Vitals History</Text>
                  {readingsList.length === 0 ? (
                    <Text style={styles.emptyLogText}>No recorded entries on file.</Text>
                  ) : (
                    readingsList.map((item) => (
                      <View key={`reading-${item.id}`} style={styles.logRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.logValue}>
                            {currentKindConfig.pair
                              ? `${item.value_1}/${item.value_2}`
                              : `${item.value_1}`}{' '}
                            <Text style={styles.logUnits}>{item.units}</Text>
                          </Text>
                          <Text style={styles.logDate}>{formatDate(item.taken_at)}</Text>
                          {item.note ? <Text style={styles.logNote}>Note: {item.note}</Text> : null}
                        </View>

                        {item.out_of_band && (
                          <View style={styles.alertedPill}>
                            <AlertTriangleIcon color="#dc2626" size={12} />
                            <Text style={styles.alertedPillText}>Safety Range</Text>
                          </View>
                        )}

                        <TouchableOpacity
                          style={styles.trashBtn}
                          onPress={() => handleDeleteReading(item.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <TrashIcon color="#94a3b8" size={15} />
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>

                {/* Safety Disclaimer */}
                <View style={styles.disclaimerCard}>
                  <Text style={styles.disclaimerTitle}>Clinical Remote Monitoring Notice</Text>
                  <Text style={styles.disclaimerText}>
                    Values entered here are labeled as patient self-reported in your medical record. They allow your care team to evaluate long-term blood pressure, glycemic, and weight trends. For acute medical distress, please contact emergency services immediately.
                  </Text>
                </View>
              </>
            )}
          </ScrollView>

          {/* ================= RECORD READING MODAL ================= */}
          <Modal
            visible={showEntryModal}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setShowEntryModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.entryDialog}>
                <View style={styles.dialogHeader}>
                  <Text style={styles.dialogTitle}>
                    Log {currentKindConfig.label} {currentKindConfig.emoji}
                  </Text>
                  <TouchableOpacity onPress={() => setShowEntryModal(false)} style={styles.closeBtn}>
                    <CloseIcon color="#64748b" size={18} />
                  </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.dialogContent}>
                  {currentKindConfig.pair ? (
                    <View style={styles.pairRow}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.inputLabel}>Systolic (Top)</Text>
                        <TextInput
                          style={styles.inputBox}
                          value={val1}
                          onChangeText={setVal1}
                          placeholder="120"
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>Diastolic (Bottom)</Text>
                        <TextInput
                          style={styles.inputBox}
                          value={val2}
                          onChangeText={setVal2}
                          placeholder="80"
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  ) : (
                    <View>
                      <Text style={styles.inputLabel}>
                        Measurement ({currentKindConfig.units})
                      </Text>
                      <TextInput
                        style={styles.inputBox}
                        value={val1}
                        onChangeText={setVal1}
                        placeholder={`Enter ${currentKindConfig.units}`}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  )}

                  {/* Quick Tags */}
                  <Text style={styles.inputLabel}>Context / Tag</Text>
                  <View style={styles.quickTagsRow}>
                    {quickTags.map((tag, tIdx) => (
                      <TouchableOpacity
                        key={`tag-${tIdx}`}
                        style={[styles.tagPill, noteTag === tag && styles.tagPillSelected]}
                        onPress={() => setNoteTag(noteTag === tag ? '' : tag)}
                      >
                        <Text style={[styles.tagText, noteTag === tag && styles.tagTextSelected]}>
                          {tag}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Memo Note */}
                  <Text style={styles.inputLabel}>Notes / Circumstances (Optional)</Text>
                  <TextInput
                    style={styles.noteBox}
                    value={noteTag}
                    onChangeText={setNoteTag}
                    placeholder="e.g., Felt dizzy after walking"
                    placeholderTextColor="#94a3b8"
                  />

                  <TouchableOpacity
                    style={[styles.submitBtn, submitting && styles.btnDisabled]}
                    onPress={handleSubmitReading}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.submitBtnText}>Save Reading ✓</Text>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  container: {
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
    backgroundColor: '#ffe4e6',
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
  categoryScrollBox: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  categoryPillRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  catPillSelected: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48'
  },
  catEmoji: {
    fontSize: 13
  },
  catLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569'
  },
  catLabelSelected: {
    color: '#ffffff',
    fontWeight: '700'
  },
  countBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10
  },
  countBadgeSelected: {
    backgroundColor: '#be123c'
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569'
  },
  countBadgeTextSelected: {
    color: '#ffffff'
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40
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
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    gap: 12
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  heroKindLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5
  },
  heroValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 4
  },
  heroUnits: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748b'
  },
  heroDate: {
    fontSize: 11.5,
    color: '#94a3b8',
    marginTop: 2
  },
  logBtn: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10
  },
  logBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff'
  },
  goalBanner: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  goalBannerText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#15803d'
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  chartTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a'
  },
  chartCountText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#e11d48'
  },
  emptyChart: {
    paddingVertical: 24,
    alignItems: 'center'
  },
  emptyChartText: {
    fontSize: 12.5,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18
  },
  sparklineContainer: {
    height: 150,
    justifyContent: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    marginBottom: 20
  },
  sparklinePointsArea: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: '100%'
  },
  sparklineCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    position: 'relative'
  },
  sparklineMarker: {
    position: 'absolute',
    alignItems: 'center'
  },
  sparkDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff'
  },
  sparkDotAbnormal: {
    backgroundColor: '#ef4444'
  },
  sparkDotLatest: {
    transform: [{ scale: 1.2 }],
    borderWidth: 2,
    borderColor: '#0f172a'
  },
  valPill: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2
  },
  valPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff'
  },
  sparkDateText: {
    position: 'absolute',
    bottom: -20,
    fontSize: 9.5,
    color: '#94a3b8'
  },
  logCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10
  },
  logCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a'
  },
  emptyLogText: {
    fontSize: 12.5,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 14
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  logValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a'
  },
  logUnits: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b'
  },
  logDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2
  },
  logNote: {
    fontSize: 11.5,
    color: '#334155',
    fontStyle: 'italic',
    marginTop: 2
  },
  alertedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 10
  },
  alertedPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#dc2626'
  },
  trashBtn: {
    padding: 6
  },
  disclaimerCard: {
    backgroundColor: '#fff1f2',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fecdd3',
    gap: 4
  },
  disclaimerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9f1239'
  },
  disclaimerText: {
    fontSize: 11,
    color: '#881337',
    lineHeight: 16
  },

  /* Entry Dialog */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 20
  },
  entryDialog: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden'
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a'
  },
  dialogContent: {
    padding: 18,
    gap: 10
  },
  pairRow: {
    flexDirection: 'row'
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569'
  },
  inputBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a'
  },
  quickTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  tagPillSelected: {
    backgroundColor: '#ffe4e6',
    borderColor: '#e11d48'
  },
  tagText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569'
  },
  tagTextSelected: {
    color: '#e11d48',
    fontWeight: '700'
  },
  noteBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a'
  },
  submitBtn: {
    backgroundColor: '#e11d48',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff'
  },
  btnDisabled: {
    opacity: 0.6
  }
});
