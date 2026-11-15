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
  StatusBar,
  Alert
} from 'react-native';
import { MyChartService } from '../api/mychart';
import {
  CloseIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  InfoCircleIcon,
  ClockIcon,
  CalendarIcon
} from './Icons';

/**
 * What you are due for (Phase M14): screenings and vaccinations, when they were
 * last done, and when the next one is due.
 *
 * What this screen is careful about:
 *
 *   It never says a patient is at risk of anything. An item is due or it is
 *   not. "Due" is a date arriving, not a finding about them, and the wording
 *   stays on what the test is and how to arrange it.
 *
 *   "No record of this" is said plainly rather than hidden. Most of these will
 *   have no completion history at all, and a panel that quietly showed nothing
 *   would read as "you are up to date" -- the one wrong impression that matters
 *   here.
 *
 *   Telling us it was done elsewhere does not change the record. It stays
 *   showing as due until somebody at the clinic accepts the claim, and the
 *   screen says so, because a patient who thinks they have closed their own
 *   cervical screening reminder will stop expecting to be chased.
 *
 * Status, the sentence under each item, and whether a button is offered all
 * come from the server, so this screen cannot offer something it would refuse.
 */
export default function MyChartHealthMaintenanceModal({ visible, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);     // { item, action } while asking
  const [note, setNote] = useState('');
  const [doneOn, setDoneOn] = useState('');
  const [doneWhere, setDoneWhere] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showDone, setShowDone] = useState(false);

  useEffect(() => {
    if (visible) {
      load();
    } else {
      setData(null);
      closeForm();
      setShowDone(false);
    }
  }, [visible]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await MyChartService.getHealthMaintenance();
      setData(res?.success ? res.data : null);
    } catch (e) {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const closeForm = () => {
    setForm(null);
    setNote('');
    setDoneOn('');
    setDoneWhere('');
    setError(null);
  };

  const openForm = (item, action) => {
    setForm({ item, action });
    setNote('');
    setDoneOn('');
    setDoneWhere('');
    setError(null);
  };

  const submit = async () => {
    if (!form) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload = { id: form.item.id, action: form.action, note };

      if (form.action === 'report_done') {
        payload.done_on = doneOn.trim();
        payload.done_where = doneWhere.trim();
      }

      const res = await MyChartService.requestCareGap(payload);

      if (!res?.success) {
        const first = res?.errors ? Object.values(res.errors)[0] : null;
        setError(first || res?.message || 'That could not be sent. Please try again.');
        return;
      }

      closeForm();
      await load();
      Alert.alert('Sent', res.message);
    } catch (e) {
      setError('That could not be sent. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const withdraw = (request) => {
    Alert.alert(
      'Take this back?',
      `This cancels what you sent about "${request.item_label}".`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Take it back',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await MyChartService.withdrawCareGapRequest(request.id);
              if (!res?.success) {
                Alert.alert('Cannot take it back', res?.message || 'Please try again.');
              }
              await load();
            } catch (e) {
              Alert.alert('Cannot take it back', 'Please check your connection and try again.');
            }
          }
        }
      ]
    );
  };

  const items = data?.items || [];
  const needsDoing = items.filter((i) => i.status !== 'up_to_date');
  const upToDate = items.filter((i) => i.status === 'up_to_date');
  const decided = (data?.requests || []).filter((r) => r.status !== 'pending');

  const statusChip = (status) => {
    if (status === 'overdue') {
      return (
        <View style={[styles.chip, styles.chipOverdue]}>
          <ClockIcon color="#92400e" size={10} />
          <Text style={[styles.chipText, { color: '#92400e' }]}>Overdue</Text>
        </View>
      );
    }
    if (status === 'due') {
      return (
        <View style={[styles.chip, styles.chipDue]}>
          <CalendarIcon color="#1e40af" size={10} />
          <Text style={[styles.chipText, { color: '#1e40af' }]}>Due</Text>
        </View>
      );
    }
    return (
      <View style={[styles.chip, styles.chipOk]}>
        <CheckCircleIcon color="#166534" size={10} />
        <Text style={[styles.chipText, { color: '#166534' }]}>Up to date</Text>
      </View>
    );
  };

  const renderItem = (item) => (
    <View
      key={item.id}
      style={[styles.card, item.status === 'overdue' && styles.cardOverdue]}
    >
      <View style={styles.cardTopRow}>
        <Text style={styles.cardTitle}>{item.label}</Text>
        {statusChip(item.status)}
      </View>

      <Text style={styles.statusLine}>{item.status_text}</Text>

      {item.what_it_is ? <Text style={styles.bodyText}>{item.what_it_is}</Text> : null}
      {item.why_it_matters ? <Text style={styles.bodyText}>{item.why_it_matters}</Text> : null}

      <Text style={styles.metaText}>
        Offered {item.every}
        {item.how_to_get_it ? `  ·  ${item.how_to_get_it}` : ''}
      </Text>

      {item.pending_request ? (
        <View style={styles.pendingBox}>
          <InfoCircleIcon color="#1e40af" size={13} />
          <Text style={styles.pendingText}>{item.pending_request.text}</Text>
        </View>
      ) : item.can_request ? (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryChip} activeOpacity={0.8} onPress={() => openForm(item, 'book')}>
            <Text style={styles.primaryChipText}>Ask us to arrange it</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryChip} activeOpacity={0.8} onPress={() => openForm(item, 'report_done')}>
            <Text style={styles.secondaryChipText}>I had this done</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={form ? closeForm : onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.iconCircle}>
              <ShieldCheckIcon color="#2563eb" size={17} />
            </View>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {form ? (form.action === 'book' ? 'Ask us to arrange it' : 'Tell us it was done') : 'Staying well'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {form ? form.item.label : 'Checks and vaccinations offered to you'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={form ? closeForm : onClose}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <CloseIcon color="#64748b" size={18} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
            keyboardShouldPersistTaps="handled"
          >
            {form ? (
              <>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>{form.item.label}</Text>

                  {form.action === 'report_done' ? (
                    <>
                      <Text style={styles.bodyText}>
                        Tell us roughly when and where, and the clinic will check it and update your record.
                      </Text>

                      <Text style={styles.fieldLabel}>WHEN WAS IT DONE? (YYYY-MM-DD)</Text>
                      <TextInput
                        style={styles.input}
                        value={doneOn}
                        onChangeText={setDoneOn}
                        placeholder="An approximate date is fine"
                        placeholderTextColor="#94a3b8"
                        maxLength={10}
                      />

                      <Text style={styles.fieldLabel}>WHERE WAS IT DONE?</Text>
                      <TextInput
                        style={styles.input}
                        value={doneWhere}
                        onChangeText={setDoneWhere}
                        placeholder="The clinic or hospital, if you remember"
                        placeholderTextColor="#94a3b8"
                        maxLength={255}
                      />

                      <Text style={styles.fieldLabel}>ANYTHING ELSE?</Text>
                      <TextInput
                        style={styles.textArea}
                        value={note}
                        onChangeText={setNote}
                        placeholder="Optional"
                        placeholderTextColor="#94a3b8"
                        multiline
                        maxLength={500}
                      />
                    </>
                  ) : (
                    <>
                      <Text style={styles.bodyText}>
                        The clinic will contact you to arrange a time. Nothing is booked yet.
                      </Text>

                      <Text style={styles.fieldLabel}>ANYTHING THEY SHOULD KNOW?</Text>
                      <TextInput
                        style={styles.textArea}
                        value={note}
                        onChangeText={setNote}
                        placeholder="For example, which days suit you"
                        placeholderTextColor="#94a3b8"
                        multiline
                        maxLength={500}
                      />
                    </>
                  )}

                  {error ? (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  <View style={styles.noticeBox}>
                    <InfoCircleIcon color="#92400e" size={14} />
                    <Text style={styles.noticeText}>
                      {form.action === 'report_done'
                        ? 'This does not change your record. It will keep showing as due until the clinic has checked it.'
                        : 'This is a request, not a booking. The clinic will be in touch with a time.'}
                    </Text>
                  </View>

                  <View style={styles.formBtnRow}>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={closeForm} disabled={submitting}>
                      <Text style={styles.secondaryBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.primaryBtn, submitting && styles.btnDisabled]}
                      onPress={submit}
                      disabled={submitting}
                    >
                      {submitting
                        ? <ActivityIndicator color="#ffffff" size="small" />
                        : <Text style={styles.primaryBtnText}>Send to the clinic</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : (
              <>
                {data?.blocked_reason ? (
                  <View style={styles.noticeBox}>
                    <AlertTriangleIcon color="#92400e" size={14} />
                    <Text style={styles.noticeText}>{data.blocked_reason}</Text>
                  </View>
                ) : null}

                {items.length === 0 ? (
                  <View style={styles.card}>
                    <Text style={styles.emptyTitle}>Nothing to show yet</Text>
                    <Text style={styles.bodyText}>
                      When there is a check or a vaccination offered to you, it will appear here with
                      when it is due. Your care team tracks these either way.
                    </Text>
                  </View>
                ) : (
                  <>
                    {needsDoing.length > 0 && (
                      <>
                        <Text style={styles.sectionLabel}>WORTH SORTING OUT</Text>
                        {needsDoing.map(renderItem)}
                      </>
                    )}

                    {upToDate.length > 0 && (
                      <>
                        <TouchableOpacity
                          style={styles.collapseRow}
                          activeOpacity={0.7}
                          onPress={() => setShowDone((v) => !v)}
                        >
                          <Text style={styles.sectionLabel}>
                            UP TO DATE ({upToDate.length})
                          </Text>
                          <Text style={styles.collapseHint}>{showDone ? 'Hide' : 'Show'}</Text>
                        </TouchableOpacity>
                        {showDone ? upToDate.map(renderItem) : null}
                      </>
                    )}
                  </>
                )}

                {decided.length > 0 && (
                  <>
                    <Text style={[styles.sectionLabel, { marginTop: 18 }]}>WHAT YOU ASKED BEFORE</Text>
                    {decided.map((r) => (
                      <View key={`d-${r.id}`} style={styles.card}>
                        <Text style={styles.metaText}>
                          {String(r.created_at || '').slice(0, 10)} · {r.item_label}
                        </Text>
                        <Text style={styles.cardTitle}>
                          {r.action === 'book' ? 'You asked us to arrange it' : 'You told us it was done'}
                        </Text>
                        <Text style={[styles.statusLine, { color: r.status === 'accepted' ? '#166534' : '#991b1b' }]}>
                          {r.status === 'accepted'
                            ? (r.action === 'book'
                              ? 'The clinic took this on.'
                              : 'The clinic accepted this and your record is updated.')
                            : 'The clinic did not accept this.'}
                        </Text>
                        {r.review_note ? <Text style={styles.bodyText}>{r.review_note}</Text> : null}
                      </View>
                    ))}
                  </>
                )}

                {(data?.requests || []).filter((r) => r.status === 'pending').length > 0 && (
                  <>
                    <Text style={[styles.sectionLabel, { marginTop: 18 }]}>WAITING FOR THE CLINIC</Text>
                    {(data.requests || []).filter((r) => r.status === 'pending').map((r) => (
                      <View key={`p-${r.id}`} style={[styles.card, styles.cardPending]}>
                        <Text style={styles.cardTitle}>{r.item_label}</Text>
                        <Text style={styles.statusLine}>
                          {r.action === 'book'
                            ? 'You asked us to arrange this. The clinic will contact you.'
                            : `You told us this was done${r.done_on ? ` on ${r.done_on}` : ''}. It stays showing as due until the clinic checks it.`}
                        </Text>
                        <TouchableOpacity style={styles.linkBtn} onPress={() => withdraw(r)}>
                          <Text style={styles.linkBtnText}>Take this back</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </>
                )}
              </>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#eff6ff',
    alignItems: 'center', justifyContent: 'center'
  },
  headerTitle: { fontSize: 15.5, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 11.5, color: '#64748b', marginTop: 1 },
  closeBtn: { padding: 6, marginLeft: 8 },

  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: '#64748b',
    letterSpacing: 0.8, marginBottom: 8, marginTop: 4
  },
  collapseRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 14
  },
  collapseHint: { fontSize: 12, fontWeight: '700', color: '#2563eb', marginBottom: 8, marginTop: 4 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 18,
    marginBottom: 14
  },
  cardOverdue: { borderColor: '#fde68a', backgroundColor: '#fffdf5' },
  cardPending: { borderColor: '#bfdbfe', backgroundColor: '#f8fbff' },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: {
    fontSize: 14.5, fontWeight: '800', color: '#0f172a',
    letterSpacing: -0.3, flex: 1, marginRight: 8
  },
  emptyTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 5, letterSpacing: -0.3 },
  bodyText: { fontSize: 13, color: '#334155', lineHeight: 19, marginTop: 7 },
  metaText: { fontSize: 11.5, color: '#64748b', marginTop: 9, lineHeight: 17 },
  statusLine: { fontSize: 12.5, color: '#475569', marginTop: 7, lineHeight: 18, fontWeight: '600' },

  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3
  },
  chipText: { fontSize: 10.5, fontWeight: '800' },
  chipOverdue: { backgroundColor: '#fef3c7' },
  chipDue: { backgroundColor: '#eff6ff' },
  chipOk: { backgroundColor: '#dcfce7' },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 13, flexWrap: 'wrap' },
  primaryChip: {
    backgroundColor: '#2563eb', borderRadius: 999,
    paddingVertical: 9, paddingHorizontal: 15
  },
  primaryChipText: { color: '#ffffff', fontWeight: '800', fontSize: 12.5 },
  secondaryChip: {
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 999,
    paddingVertical: 9, paddingHorizontal: 15, backgroundColor: '#ffffff'
  },
  secondaryChipText: { color: '#475569', fontWeight: '700', fontSize: 12.5 },

  pendingBox: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: '#eff6ff', borderRadius: 10, borderWidth: 1,
    borderColor: '#bfdbfe', padding: 11, marginTop: 12
  },
  pendingText: { flex: 1, fontSize: 12, color: '#1e3a8a', lineHeight: 18 },

  linkBtn: { marginTop: 11, alignSelf: 'flex-start' },
  linkBtnText: { fontSize: 12.5, fontWeight: '700', color: '#2563eb' },

  fieldLabel: {
    fontSize: 10.5, fontWeight: '800', color: '#64748b',
    letterSpacing: 0.7, marginTop: 15
  },
  input: {
    marginTop: 7, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 11,
    paddingHorizontal: 13, paddingVertical: 11, fontSize: 13.5,
    color: '#0f172a', backgroundColor: '#fafbfc'
  },
  textArea: {
    marginTop: 7, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 11,
    paddingHorizontal: 13, paddingVertical: 11, fontSize: 13.5,
    color: '#0f172a', backgroundColor: '#fafbfc',
    minHeight: 80, textAlignVertical: 'top'
  },

  errorBox: {
    backgroundColor: '#fef2f2', borderRadius: 11, borderWidth: 1,
    borderColor: '#fecaca', padding: 13, marginTop: 14
  },
  errorText: { fontSize: 12.5, color: '#991b1b', lineHeight: 18, fontWeight: '600' },

  noticeBox: {
    flexDirection: 'row', gap: 9, alignItems: 'flex-start',
    backgroundColor: '#fffbeb', borderRadius: 11, borderWidth: 1,
    borderColor: '#fde68a', padding: 13, marginTop: 14, marginBottom: 14
  },
  noticeText: { flex: 1, fontSize: 12, color: '#92400e', lineHeight: 18 },

  formBtnRow: { flexDirection: 'row', gap: 10 },
  secondaryBtn: {
    flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 11,
    paddingVertical: 13, alignItems: 'center', backgroundColor: '#ffffff'
  },
  secondaryBtnText: { fontSize: 13.5, fontWeight: '700', color: '#475569' },
  primaryBtn: {
    flex: 2, backgroundColor: '#2563eb', borderRadius: 11,
    paddingVertical: 13, alignItems: 'center'
  },
  primaryBtnText: { fontSize: 13.5, fontWeight: '800', color: '#ffffff', letterSpacing: -0.2 },
  btnDisabled: { opacity: 0.6 }
});
