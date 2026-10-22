import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { MyChartService } from '../api/mychart';
import { CloseIcon, TrendIcon, AlertTriangleIcon, CheckCircleIcon } from './Icons';

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
      return `${day} ${month} ${year}`;
    }
  } catch (e) {}
  return String(dateStr).slice(0, 10);
};

export default function MyChartTrendModal({
  visible,
  onClose,
  analyteName,
  analyteCode,
  currentValue,
  units,
  referenceRange
}) {
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState(null);

  useEffect(() => {
    if (visible && analyteName) {
      setLoading(true);
      MyChartService.getResultTrend(analyteName, analyteCode)
        .then((res) => {
          if (res && res.success && res.data) {
            setTrendData(res.data);
          } else {
            setTrendData(null);
          }
        })
        .catch((err) => {
          console.warn('Failed to fetch trend:', err);
          setTrendData(null);
        })
        .finally(() => setLoading(false));
    } else {
      setTrendData(null);
    }
  }, [visible, analyteName, analyteCode]);

  const points = trendData?.points || [];
  const rangeLow = trendData?.range_low;
  const rangeHigh = trendData?.range_high;
  const displayUnits = trendData?.units || units || '';

  // Determine min & max for chart scaling
  const allValues = points.map((p) => p.value);
  if (rangeLow !== null && rangeLow !== undefined) allValues.push(rangeLow);
  if (rangeHigh !== null && rangeHigh !== undefined) allValues.push(rangeHigh);

  const minVal = allValues.length > 0 ? Math.min(...allValues) : 0;
  const maxVal = allValues.length > 0 ? Math.max(...allValues) : 100;
  const paddingVal = (maxVal - minVal) * 0.2 || 1;
  const chartMin = Math.max(0, minVal - paddingVal);
  const chartMax = maxVal + paddingVal;
  const chartSpan = chartMax - chartMin || 1;

  // Calculate delta between newest and previous point
  let deltaText = null;
  let deltaColor = '#64748b';
  if (points.length >= 2) {
    const latest = points[points.length - 1].value;
    const previous = points[points.length - 2].value;
    const diff = latest - previous;
    const rounded = Math.round(diff * 100) / 100;
    if (diff > 0) {
      deltaText = `+${rounded} ${displayUnits} from previous reading`;
      deltaColor = '#2563eb';
    } else if (diff < 0) {
      deltaText = `${rounded} ${displayUnits} from previous reading`;
      deltaColor = '#475569';
    } else {
      deltaText = `Unchanged from previous reading`;
      deltaColor = '#10b981';
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.iconCircle}>
              <TrendIcon color="#2563eb" size={20} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {analyteName || 'Result Trend'}
              </Text>
              <Text style={styles.headerSubtitle}>
                Longitudinal Test History &amp; Trajectory
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <CloseIcon color="#64748b" size={18} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Loading historical measurements...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Overview Banner Card */}
            <View style={styles.overviewCard}>
              <View style={styles.overviewTopRow}>
                <View>
                  <Text style={styles.overviewLabel}>LATEST VALUE</Text>
                  <Text style={styles.overviewValue}>
                    {points.length > 0 ? points[points.length - 1].value : currentValue || '—'}{' '}
                    <Text style={styles.overviewUnits}>{displayUnits}</Text>
                  </Text>
                </View>

                {rangeLow !== null && rangeHigh !== null ? (
                  <View style={styles.refRangeBox}>
                    <Text style={styles.refRangeLabel}>STANDARD RANGE</Text>
                    <Text style={styles.refRangeValue}>
                      {rangeLow} – {rangeHigh} {displayUnits}
                    </Text>
                  </View>
                ) : referenceRange ? (
                  <View style={styles.refRangeBox}>
                    <Text style={styles.refRangeLabel}>REFERENCE</Text>
                    <Text style={styles.refRangeValue}>{referenceRange}</Text>
                  </View>
                ) : null}
              </View>

              {deltaText && (
                <View style={styles.deltaRow}>
                  <Text style={[styles.deltaText, { color: deltaColor }]}>{deltaText}</Text>
                </View>
              )}
            </View>

            {/* Visual Sparkline Chart */}
            <View style={styles.chartCard}>
              <View style={styles.chartTitleRow}>
                <Text style={styles.chartTitle}>Historical Trend Chart</Text>
                <Text style={styles.chartCount}>
                  {points.length} {points.length === 1 ? 'Reading' : 'Readings'}
                </Text>
              </View>

              {points.length === 0 ? (
                <View style={styles.emptyChartBox}>
                  <Text style={styles.emptyChartText}>
                    No previous numeric values on file to plot for this test.
                  </Text>
                </View>
              ) : (
                <View style={styles.chartCanvasContainer}>
                  {/* Shaded Normal Range Band (if low & high known) */}
                  {rangeLow !== null && rangeHigh !== null && (
                    <View
                      style={[
                        styles.normalRangeBand,
                        {
                          bottom: `${Math.max(0, ((rangeLow - chartMin) / chartSpan) * 100)}%`,
                          height: `${Math.min(100, ((rangeHigh - rangeLow) / chartSpan) * 100)}%`
                        }
                      ]}
                    >
                      <Text style={styles.normalBandLabel}>Normal Zone</Text>
                    </View>
                  )}

                  {/* Horizontal Guideline */}
                  <View style={styles.chartMidLine} />

                  {/* Plotted Data Points */}
                  <View style={styles.pointsPlotArea}>
                    {points.map((pt, idx) => {
                      const yPercent = Math.max(6, Math.min(94, ((pt.value - chartMin) / chartSpan) * 100));
                      const isLatest = idx === points.length - 1;

                      return (
                        <View key={`pt-${idx}`} style={styles.pointColumn}>
                          {/* Point Dot */}
                          <View
                            style={[
                              styles.pointMarkerContainer,
                              { bottom: `${yPercent}%` }
                            ]}
                          >
                            <View
                              style={[
                                styles.pointDot,
                                pt.abnormal ? styles.pointDotAbnormal : styles.pointDotNormal,
                                isLatest && styles.pointDotLatest
                              ]}
                            >
                              {pt.abnormal && <Text style={styles.pointDotExcl}>!</Text>}
                            </View>

                            <View style={styles.pointValuePill}>
                              <Text style={styles.pointValuePillText}>{pt.value}</Text>
                            </View>
                          </View>

                          {/* Date Stamp Under Column */}
                          <View style={styles.pointDateBox}>
                            <Text style={styles.pointDateText} numberOfLines={1}>
                              {formatDate(pt.taken_at)}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* Historical Readings Log Table */}
            {points.length > 0 && (
              <View style={styles.logCard}>
                <Text style={styles.logCardTitle}>Recorded Results Timeline</Text>
                <View style={styles.logTableHeader}>
                  <Text style={[styles.logTh, { flex: 1.5 }]}>DATE</Text>
                  <Text style={[styles.logTh, { flex: 1.2, textAlign: 'right' }]}>VALUE</Text>
                  <Text style={[styles.logTh, { flex: 1.3, textAlign: 'right' }]}>EVALUATION</Text>
                </View>

                {/* Show in reverse chronological order (newest first) */}
                {[...points].reverse().map((pt, idx) => (
                  <View key={`log-row-${idx}`} style={[styles.logRow, idx % 2 === 1 && styles.logRowAlt]}>
                    <Text style={[styles.logTd, { flex: 1.5 }]}>
                      {formatDate(pt.taken_at)}
                    </Text>

                    <Text style={[styles.logTdBold, { flex: 1.2, textAlign: 'right' }]}>
                      {pt.value} <Text style={styles.logTdSub}>{displayUnits}</Text>
                    </Text>

                    <View style={{ flex: 1.3, alignItems: 'flex-end' }}>
                      {pt.abnormal ? (
                        <View style={styles.statusBadgeAbnormal}>
                          <Text style={styles.statusBadgeAbnormalText}>Out of Range</Text>
                        </View>
                      ) : (
                        <View style={styles.statusBadgeNormal}>
                          <Text style={styles.statusBadgeNormalText}>Standard</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Informational Guidance Notice */}
            <View style={styles.guidanceBox}>
              <Text style={styles.guidanceTitle}>Why Doctors Look at Trends</Text>
              <Text style={styles.guidanceText}>
                A single measurement reflects your body at one exact moment. Tracking values across visits helps your physician evaluate your response to medication, lifestyle changes, and long-term health stability.
              </Text>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a'
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9'
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 12
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  overviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16
  },
  overviewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  overviewLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5
  },
  overviewValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 4
  },
  overviewUnits: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b'
  },
  refRangeBox: {
    alignItems: 'flex-end'
  },
  refRangeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5
  },
  refRangeValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
    marginTop: 4
  },
  deltaRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  deltaText: {
    fontSize: 12,
    fontWeight: '600'
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16
  },
  chartTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a'
  },
  chartCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb'
  },
  emptyChartBox: {
    paddingVertical: 32,
    alignItems: 'center'
  },
  emptyChartText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center'
  },
  chartCanvasContainer: {
    height: 180,
    position: 'relative',
    justifyContent: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    marginBottom: 24
  },
  normalRangeBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#ecfdf5',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#a7f3d0',
    justifyContent: 'center',
    paddingLeft: 6
  },
  normalBandLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
    textTransform: 'uppercase'
  },
  chartMidLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 0.5,
    borderColor: '#e2e8f0'
  },
  pointsPlotArea: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '100%'
  },
  pointColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    position: 'relative'
  },
  pointMarkerContainer: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 2
  },
  pointDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff'
  },
  pointDotNormal: {
    backgroundColor: '#10b981'
  },
  pointDotAbnormal: {
    backgroundColor: '#ef4444'
  },
  pointDotLatest: {
    transform: [{ scale: 1.2 }],
    borderWidth: 2,
    borderColor: '#0f172a'
  },
  pointDotExcl: {
    fontSize: 8,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 9
  },
  pointValuePill: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2
  },
  pointValuePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff'
  },
  pointDateBox: {
    position: 'absolute',
    bottom: -22,
    alignItems: 'center'
  },
  pointDateText: {
    fontSize: 10,
    color: '#64748b'
  },
  logCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16
  },
  logCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12
  },
  logTableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  logTh: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8'
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  logRowAlt: {
    backgroundColor: '#f8fafc'
  },
  logTd: {
    fontSize: 13,
    color: '#334155'
  },
  logTdBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a'
  },
  logTdSub: {
    fontSize: 11,
    fontWeight: '400',
    color: '#64748b'
  },
  statusBadgeNormal: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6
  },
  statusBadgeNormalText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669'
  },
  statusBadgeAbnormal: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6
  },
  statusBadgeAbnormalText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#dc2626'
  },
  guidanceBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#dbeafe'
  },
  guidanceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1d4ed8',
    marginBottom: 4
  },
  guidanceText: {
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 18
  }
});
