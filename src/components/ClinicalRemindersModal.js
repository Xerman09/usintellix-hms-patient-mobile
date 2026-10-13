import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { ClinicalRemindersService } from '../api/reminders';
import { BellIcon, ChevronRightIcon, ShieldIcon, CalendarIcon } from './Icons';

export default function ClinicalRemindersModal({ visible, onClose }) {
  const [activeTab, setActiveTab] = useState('clinical'); // 'clinical' | 'dated'
  const [clinicalReminders, setClinicalReminders] = useState([]);
  const [datedReminders, setDatedReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);

  useEffect(() => {
    if (visible) {
      loadReminders();
    } else {
      setSelectedReminder(null);
    }
  }, [visible]);

  const loadReminders = async () => {
    setLoading(true);
    try {
      const [clinicalRes, datedRes] = await Promise.all([
        ClinicalRemindersService.getMyReminders(),
        ClinicalRemindersService.getDatedReminders()
      ]);

      if (clinicalRes.success && Array.isArray(clinicalRes.data)) {
        setClinicalReminders(clinicalRes.data);
      } else {
        setClinicalReminders([]);
      }

      if (datedRes.success && Array.isArray(datedRes.data)) {
        setDatedReminders(datedRes.data);
      } else {
        setDatedReminders([]);
      }
    } catch (e) {
      console.error('Failed to load reminders:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  const parseCategory = (label) => {
    const l = String(label || '').toLowerCase();
    if (l.startsWith('assessment')) return 'Assessment';
    if (l.startsWith('measurement')) return 'Measurement';
    if (l.startsWith('treatment') || l.startsWith('immunization')) return 'Treatment';
    return 'Preventive Care';
  };

  const parseShortLabel = (label) => {
    const m = String(label || '').match(/^[^:\-]+(?::\s*|\s+-\s+)(.+)$/);
    return m ? m[1] : label;
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.sheetContainer}>
        {/* Header */}
        <View style={styles.sheetHeader}>
          <View style={styles.headerTitleRow}>
            <View style={styles.iconBadge}>
              <BellIcon color="#0d9488" size={18} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Clinical Reminders</Text>
              <Text style={styles.headerSub}>
                Preventive health guidelines &amp; clinical alerts
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabBarWrapper}>
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'clinical' && styles.tabBtnActive]}
              onPress={() => {
                setActiveTab('clinical');
                setSelectedReminder(null);
              }}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'clinical' && styles.tabBtnTextActive
                ]}
              >
                Health Guidelines ({clinicalReminders.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'dated' && styles.tabBtnActive]}
              onPress={() => {
                setActiveTab('dated');
                setSelectedReminder(null);
              }}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'dated' && styles.tabBtnTextActive
                ]}
              >
                Dated Reminders ({datedReminders.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Body */}
        {loading ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator color="#0d9488" size="large" />
            <Text style={styles.loadingText}>Syncing clinical reminders...</Text>
          </View>
        ) : selectedReminder ? (
          /* ================= REMINDER DETAILS VIEW ================= */
          <ScrollView contentContainerStyle={styles.detailsScroll} showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              style={styles.backRow}
              onPress={() => setSelectedReminder(null)}
            >
              <Text style={styles.backText}>‹ Back to Reminders</Text>
            </TouchableOpacity>

            <View style={styles.detailCard}>
              <View style={styles.detailBadgeRow}>
                <View
                  style={[
                    styles.statusPill,
                    selectedReminder.due_status === 'past_due'
                      ? styles.statusPillPastDue
                      : styles.statusPillDue
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      selectedReminder.due_status === 'past_due'
                        ? styles.statusPillTextPastDue
                        : styles.statusPillTextDue
                    ]}
                  >
                    {selectedReminder.due_status === 'past_due' ? 'Past Due' : 'Due for Checkup'}
                  </Text>
                </View>
                <Text style={styles.categoryPill}>
                  {parseCategory(selectedReminder.item_label)}
                </Text>
              </View>

              <Text style={styles.detailTitle}>
                {parseShortLabel(selectedReminder.item_label)}
              </Text>

              <View style={styles.infoDivider} />

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Item Reference:</Text>
                <Text style={styles.metaVal}>{selectedReminder.item_label}</Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Evaluated Date:</Text>
                <Text style={styles.metaVal}>
                  {selectedReminder.date_created
                    ? new Date(selectedReminder.date_created).toLocaleDateString([], {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : 'Current clinical cycle'}
                </Text>
              </View>

              {selectedReminder.action_type && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Action Type:</Text>
                  <Text style={styles.metaVal}>{selectedReminder.action_type}</Text>
                </View>
              )}

              <View style={styles.guidelineAlertBox}>
                <Text style={styles.guidelineAlertTitle}>Clinical Practice Standard</Text>
                <Text style={styles.guidelineAlertDesc}>
                  This recommendation is generated automatically based on standard national
                  preventive healthcare guidelines (USPSTF) considering your age, sex, and health record history.
                </Text>
              </View>
            </View>
          </ScrollView>
        ) : activeTab === 'clinical' ? (
          /* ================= CLINICAL HEALTH GUIDELINES TAB ================= */
          <ScrollView
            contentContainerStyle={styles.listScroll}
            showsVerticalScrollIndicator={false}
          >
            {clinicalReminders.length === 0 ? (
              <View style={styles.emptyArea}>
                <View style={styles.emptyIconCircle}>
                  <ShieldIcon color="#0d9488" size={28} />
                </View>
                <Text style={styles.emptyTitle}>Up to Date!</Text>
                <Text style={styles.emptyDesc}>
                  You have no pending or past-due preventive care clinical reminders.
                </Text>
              </View>
            ) : (
              clinicalReminders.map((rem) => {
                const category = parseCategory(rem.item_label);
                const shortLabel = parseShortLabel(rem.item_label);
                const isPastDue = rem.due_status === 'past_due';

                return (
                  <TouchableOpacity
                    key={rem.id}
                    style={styles.reminderCard}
                    activeOpacity={0.7}
                    onPress={() => setSelectedReminder(rem)}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.catBox}>
                        <Text style={styles.catText}>{category}</Text>
                      </View>
                      <View
                        style={[
                          styles.statusPill,
                          isPastDue ? styles.statusPillPastDue : styles.statusPillDue
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusPillText,
                            isPastDue
                              ? styles.statusPillTextPastDue
                              : styles.statusPillTextDue
                          ]}
                        >
                          {isPastDue ? 'Past Due' : 'Due'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.cardTitle}>{shortLabel}</Text>

                    <View style={styles.cardFooter}>
                      <Text style={styles.cardDate}>
                        Cycle: {rem.date_created ? rem.date_created.slice(0, 10) : 'Current'}
                      </Text>
                      <View style={styles.viewRow}>
                        <Text style={styles.viewDetailsText}>View guideline</Text>
                        <ChevronRightIcon color="#0d9488" size={13} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        ) : (
          /* ================= DATED REMINDERS TAB ================= */
          <ScrollView
            contentContainerStyle={styles.listScroll}
            showsVerticalScrollIndicator={false}
          >
            {datedReminders.length === 0 ? (
              <View style={styles.emptyArea}>
                <View style={styles.emptyIconCircle}>
                  <CalendarIcon color="#0d9488" size={28} />
                </View>
                <Text style={styles.emptyTitle}>No Dated Reminders</Text>
                <Text style={styles.emptyDesc}>
                  No dated appointments or scheduled reminders on file.
                </Text>
              </View>
            ) : (
              datedReminders.map((dr) => (
                <View key={dr.id} style={styles.reminderCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{dr.title || dr.body || 'Clinical Alert'}</Text>
                    <Text style={styles.datedDateText}>
                      {dr.due_date || dr.created_at?.slice(0, 10)}
                    </Text>
                  </View>
                  {dr.notes ? <Text style={styles.datedNotesText}>{dr.notes}</Text> : null}
                </View>
              ))
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
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '88%',
    width: '100%',
    maxWidth: 500,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#ccfbf1',
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
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 1
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
    paddingHorizontal: 14,
    paddingVertical: 6
  },
  tabBar: {
    flexDirection: 'row',
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
    color: '#0d9488',
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
  listScroll: {
    padding: 16,
    paddingBottom: 40
  },
  emptyArea: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
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
    textAlign: 'center',
    lineHeight: 18
  },
  reminderCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  catBox: {
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#ccfbf1',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6
  },
  catText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0d9488'
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 999
  },
  statusPillDue: {
    backgroundColor: '#fef3c7'
  },
  statusPillPastDue: {
    backgroundColor: '#fee2e2'
  },
  statusPillText: {
    fontSize: 10.5,
    fontWeight: '800'
  },
  statusPillTextDue: {
    color: '#b45309'
  },
  statusPillTextPastDue: {
    color: '#b91c1c'
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    lineHeight: 19
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 8
  },
  cardDate: {
    fontSize: 11,
    color: '#94a3b8'
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3
  },
  viewDetailsText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0d9488'
  },
  datedDateText: {
    fontSize: 11.5,
    color: '#0d9488',
    fontWeight: '700'
  },
  datedNotesText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4
  },
  detailsScroll: {
    padding: 16,
    paddingBottom: 40
  },
  backRow: {
    marginBottom: 12
  },
  backText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0d9488'
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 16
  },
  detailBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10
  },
  categoryPill: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b'
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 22,
    marginBottom: 12
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 12
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    width: '35%'
  },
  metaVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    textAlign: 'right'
  },
  guidelineAlertBox: {
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#ccfbf1',
    borderRadius: 8,
    padding: 12,
    marginTop: 14
  },
  guidelineAlertTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4
  },
  guidelineAlertDesc: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16
  }
});
