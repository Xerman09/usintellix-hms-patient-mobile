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
  ShieldIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  InfoCircleIcon,
  EditIcon
} from './Icons';

/**
 * My insurance (Phase M12): the cover the hospital holds, and asking for it to be
 * added, corrected or removed.
 *
 * What this screen must not imply: that editing here changes anything. It does
 * not — a request goes to the desk, who check the card and apply it. The wording
 * throughout says "ask" and "the clinic will check", and a pending request is
 * shown as waiting rather than as the new truth, because a patient who believes
 * their cover is updated will arrive expecting to be billed against it.
 */
export default function MyChartInsuranceModal({ visible, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);   // { action, coverage } once a form is open
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fields for the add/correct form.
  const [insurerId, setInsurerId] = useState('');
  const [insurerText, setInsurerText] = useState('');
  const [policy, setPolicy] = useState('');
  const [group, setGroup] = useState('');
  const [subscriber, setSubscriber] = useState('');
  const [effective, setEffective] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (visible) {
      load();
    } else {
      setData(null);
      closeForm();
    }
  }, [visible]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await MyChartService.getMyInsurance();
      setData(res?.success ? res.data : null);
    } catch (e) {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const closeForm = () => {
    setForm(null);
    setError(null);
    setInsurerId('');
    setInsurerText('');
    setPolicy('');
    setGroup('');
    setSubscriber('');
    setEffective('');
    setNote('');
  };

  /** Open the form, pre-filled from the cover being corrected. */
  const openForm = (action, coverage = null) => {
    closeForm();
    setForm({ action, coverage });

    if (coverage) {
      setPolicy(coverage.policy_number || '');
      setGroup(coverage.group_number || '');
      setSubscriber(coverage.subscriber_name || '');
      setEffective(coverage.effective_date || '');
      // The insurer is matched by name, since the coverage row carries the name
      // rather than the id the picker needs.
      const match = (data?.insurers || []).find((i) => i.name === coverage.insurer);
      if (match) setInsurerId(String(match.id));
      else setInsurerText(coverage.insurer || '');
    }
  };

  const submit = async () => {
    setError(null);

    const payload = { action: form.action, note: note.trim() };

    if (form.action === 'remove') {
      payload.patient_insurance_id = form.coverage.id;
    } else {
      if (form.action === 'update') payload.patient_insurance_id = form.coverage.id;
      if (insurerId) payload.insurance_id = Number(insurerId);
      else payload.insurer_name_text = insurerText.trim();
      payload.insurance_type = form.coverage?.type || 'primary';
      payload.policy_number = policy.trim();
      payload.group_number = group.trim();
      payload.subscriber_name = subscriber.trim();
      payload.effective_date = effective.trim();
    }

    setSubmitting(true);
    try {
      const res = await MyChartService.requestInsuranceChange(payload);

      if (res?.success) {
        closeForm();
        await load();
        Alert.alert('Sent', res.message);
        return;
      }

      // The server returns a field-level reason where it has one; its message is
      // already written for the patient, so it is shown as-is.
      setError(res?.message || 'That could not be sent.');
    } catch (e) {
      setError('Could not reach the clinic. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const withdraw = (req) => {
    Alert.alert(
      'Cancel this request?',
      'The clinic will not see it any more. Your record is unchanged either way.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel request',
          style: 'destructive',
          onPress: async () => {
            const res = await MyChartService.withdrawInsuranceRequest(req.id).catch(() => null);
            if (res?.success) await load();
            else Alert.alert('Could not cancel', res?.message || 'Please try again.');
          }
        }
      ]
    );
  };

  const coverage = data?.coverage || [];
  const requests = data?.requests || [];
  const pending = requests.filter((r) => r.status === 'pending');

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.iconCircle}>
              <ShieldIcon color="#2563eb" size={19} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.headerTitle}>My insurance</Text>
              <Text style={styles.headerSubtitle}>What the hospital has on file</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* The form takes over the view while open, so there is no doubt what is being changed. */}
            {form ? (
              <>
                <Text style={styles.sectionLabel}>
                  {form.action === 'add' ? 'ASK TO ADD COVER'
                    : form.action === 'update' ? 'ASK US TO CORRECT THIS'
                      : 'ASK US TO REMOVE THIS'}
                </Text>

                <View style={styles.card}>
                  {form.action === 'remove' ? (
                    <>
                      <Text style={styles.bodyText}>
                        You are asking the clinic to take this cover off your record:
                      </Text>
                      <Text style={styles.removeTarget}>
                        {form.coverage.insurer || 'Insurer not named'}
                        {form.coverage.policy_number ? `  ·  ${form.coverage.policy_number}` : ''}
                      </Text>
                      <Text style={styles.fieldLabel}>WHY SHOULD IT COME OFF?</Text>
                      <TextInput
                        style={styles.textArea}
                        value={note}
                        onChangeText={setNote}
                        placeholder="e.g. I changed employer and this policy has ended"
                        placeholderTextColor="#94a3b8"
                        multiline
                        maxLength={500}
                      />
                    </>
                  ) : (
                    <>
                      <Text style={styles.fieldLabel}>INSURER</Text>
                      {(data?.insurers || []).length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                          {data.insurers.map((i) => (
                            <TouchableOpacity
                              key={i.id}
                              style={[styles.chip, String(i.id) === insurerId && styles.chipOn]}
                              onPress={() => {
                                setInsurerId(String(i.id));
                                setInsurerText('');
                              }}
                            >
                              <Text style={[styles.chipText, String(i.id) === insurerId && styles.chipTextOn]}>
                                {i.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      ) : null}
                      <TextInput
                        style={styles.input}
                        value={insurerText}
                        onChangeText={(v) => {
                          setInsurerText(v);
                          if (v) setInsurerId('');
                        }}
                        placeholder="Not listed? Type the name here"
                        placeholderTextColor="#94a3b8"
                        maxLength={255}
                      />

                      <Text style={styles.fieldLabel}>POLICY OR MEMBER NUMBER</Text>
                      <TextInput
                        style={styles.input}
                        value={policy}
                        onChangeText={setPolicy}
                        placeholder="The number on your card"
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="characters"
                        maxLength={100}
                      />

                      <Text style={styles.fieldLabel}>GROUP NUMBER (IF ANY)</Text>
                      <TextInput style={styles.input} value={group} onChangeText={setGroup}
                        placeholder="Optional" placeholderTextColor="#94a3b8" maxLength={100} />

                      <Text style={styles.fieldLabel}>WHOSE NAME IS THE POLICY IN?</Text>
                      <TextInput style={styles.input} value={subscriber} onChangeText={setSubscriber}
                        placeholder="Leave blank if it is yours" placeholderTextColor="#94a3b8" maxLength={255} />

                      <Text style={styles.fieldLabel}>START DATE (YYYY-MM-DD)</Text>
                      <TextInput style={styles.input} value={effective} onChangeText={setEffective}
                        placeholder="Optional" placeholderTextColor="#94a3b8" maxLength={10} />

                      <Text style={styles.fieldLabel}>ANYTHING ELSE?</Text>
                      <TextInput style={styles.textArea} value={note} onChangeText={setNote}
                        placeholder="Optional" placeholderTextColor="#94a3b8" multiline maxLength={500} />
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
                      This does not change your record. The clinic will check it against your card
                      first — bring the card to your next visit.
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
                {/* Anything waiting comes first: it explains why the cover below may look wrong. */}
                {pending.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>WAITING FOR THE CLINIC</Text>
                    {pending.map((r) => (
                      <View key={`p-${r.id}`} style={[styles.card, styles.pendingCard]}>
                        <Text style={styles.pendingTitle}>
                          {r.action === 'add' ? 'You asked to add cover'
                            : r.action === 'update' ? 'You asked us to correct cover'
                              : 'You asked us to remove cover'}
                        </Text>
                        {r.insurer_shown ? <Text style={styles.bodyText}>{r.insurer_shown}</Text> : null}
                        {r.policy_number ? <Text style={styles.metaText}>Policy {r.policy_number}</Text> : null}
                        {r.note ? <Text style={styles.metaText}>“{r.note}”</Text> : null}
                        <Text style={styles.metaText}>Sent {String(r.created_at || '').slice(0, 10)}</Text>
                        <Text style={styles.pendingNote}>
                          Your record is unchanged until the clinic checks this.
                        </Text>
                        <TouchableOpacity style={styles.linkBtn} onPress={() => withdraw(r)}>
                          <Text style={styles.linkBtnText}>Cancel this request</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </>
                )}

                <Text style={styles.sectionLabel}>COVER ON FILE</Text>

                {coverage.length === 0 ? (
                  <View style={styles.card}>
                    <Text style={styles.bodyText}>
                      The hospital has no insurance on file for you. If you are covered, send the
                      details so your bills can be claimed correctly.
                    </Text>
                  </View>
                ) : (
                  coverage.map((c) => (
                    <View key={c.id} style={styles.card}>
                      <View style={styles.cardTopRow}>
                        <Text style={styles.insurerName}>{c.insurer || 'Insurer not named'}</Text>
                        <View style={[styles.pill, c.is_active ? styles.pillOk : styles.pillWarn]}>
                          <Text style={[styles.pillText, c.is_active ? styles.pillTextOk : styles.pillTextWarn]}>
                            {c.type}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.statusRow}>
                        {c.is_active
                          ? <CheckCircleIcon color="#16a34a" size={14} />
                          : <AlertTriangleIcon color="#b45309" size={14} />}
                        <Text style={[styles.statusText, !c.is_active && { color: '#b45309' }]}>
                          {c.status_text}
                        </Text>
                      </View>

                      {c.policy_number ? <Text style={styles.metaText}>Policy {c.policy_number}</Text> : null}
                      {c.group_number ? <Text style={styles.metaText}>Group {c.group_number}</Text> : null}
                      {c.subscriber_name ? <Text style={styles.metaText}>In the name of {c.subscriber_name}</Text> : null}
                      {c.insurer_phone ? <Text style={styles.metaText}>Insurer {c.insurer_phone}</Text> : null}

                      {data?.can_request ? (
                        <View style={styles.actionRow}>
                          <TouchableOpacity style={styles.actionChip} onPress={() => openForm('update', c)}>
                            <EditIcon color="#1d4ed8" size={12} />
                            <Text style={[styles.actionChipText, { color: '#1d4ed8' }]}>Something is wrong</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.actionChip, styles.actionChipDanger]} onPress={() => openForm('remove', c)}>
                            <CloseIcon color="#b91c1c" size={11} />
                            <Text style={[styles.actionChipText, { color: '#b91c1c' }]}>No longer have it</Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </View>
                  ))
                )}

                {data?.can_request ? (
                  <TouchableOpacity style={styles.addBtn} onPress={() => openForm('add')}>
                    <Text style={styles.addBtnText}>+ Add another cover</Text>
                  </TouchableOpacity>
                ) : data?.blocked_reason ? (
                  <View style={styles.noticeBox}>
                    <InfoCircleIcon color="#92400e" size={14} />
                    <Text style={styles.noticeText}>{data.blocked_reason}</Text>
                  </View>
                ) : null}

                {/* Decided requests, so a decline and its reason do not vanish. */}
                {requests.filter((r) => r.status !== 'pending').length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>EARLIER REQUESTS</Text>
                    {requests.filter((r) => r.status !== 'pending').map((r) => (
                      <View key={`d-${r.id}`} style={styles.card}>
                        <Text style={styles.metaText}>
                          {String(r.created_at || '').slice(0, 10)} ·{' '}
                          {r.action === 'add' ? 'Add cover' : r.action === 'update' ? 'Correct cover' : 'Remove cover'}
                        </Text>
                        <Text style={[styles.statusText, { color: r.status === 'applied' ? '#166534' : '#991b1b' }]}>
                          {r.status === 'applied' ? 'Applied to your record' : 'Not applied'}
                        </Text>
                        {r.review_note ? <Text style={styles.bodyText}>{r.review_note}</Text> : null}
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

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  insurerName: { flex: 1, fontSize: 15.5, fontWeight: '800', color: '#0f172a', letterSpacing: -0.2 },

  pill: { borderRadius: 999, paddingVertical: 2, paddingHorizontal: 9, marginLeft: 8 },
  pillOk: { backgroundColor: '#f0fdf4' },
  pillWarn: { backgroundColor: '#fffbeb' },
  pillText: { fontSize: 10.5, fontWeight: '800', textTransform: 'capitalize' },
  pillTextOk: { color: '#166534' },
  pillTextWarn: { color: '#92400e' },

  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  statusText: { flex: 1, fontSize: 12.5, fontWeight: '600', color: '#166534', marginLeft: 6, lineHeight: 18 },

  bodyText: { fontSize: 14, color: '#334155', lineHeight: 21 },
  metaText: { fontSize: 12.5, color: '#64748b', marginTop: 4 },

  pendingCard: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  pendingTitle: { fontSize: 14, fontWeight: '700', color: '#92400e', marginBottom: 4 },
  pendingNote: { fontSize: 12, color: '#92400e', marginTop: 8, fontStyle: 'italic', lineHeight: 17 },

  linkBtn: { marginTop: 10, alignSelf: 'flex-start' },
  linkBtnText: { fontSize: 12.5, fontWeight: '700', color: '#b91c1c' },

  actionRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  actionChip: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#bfdbfe', backgroundColor: '#eff6ff',
    borderRadius: 999, paddingVertical: 6, paddingHorizontal: 11, marginRight: 7, marginBottom: 6
  },
  actionChipDanger: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  actionChipText: { fontSize: 11.5, fontWeight: '700', marginLeft: 5 },

  addBtn: {
    borderWidth: 1, borderColor: '#cbd5e1', borderStyle: 'dashed', borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', marginBottom: 16, backgroundColor: '#ffffff'
  },
  addBtnText: { fontSize: 13.5, fontWeight: '700', color: '#1d4ed8' },

  fieldLabel: { fontSize: 11, fontWeight: '800', color: '#64748b', letterSpacing: 0.8, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0f172a'
  },
  textArea: {
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10,
    padding: 12, fontSize: 14, color: '#0f172a', minHeight: 80, textAlignVertical: 'top'
  },
  removeTarget: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginTop: 8 },

  chip: {
    borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#ffffff', borderRadius: 999,
    paddingVertical: 7, paddingHorizontal: 13, marginRight: 7
  },
  chipOn: { backgroundColor: '#1d4ed8', borderColor: '#1d4ed8' },
  chipText: { fontSize: 12.5, fontWeight: '600', color: '#334155' },
  chipTextOn: { color: '#ffffff' },

  errorBox: {
    backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca',
    borderRadius: 10, padding: 11, marginTop: 12
  },
  errorText: { fontSize: 12.5, color: '#991b1b', lineHeight: 18 },

  noticeBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a',
    borderRadius: 10, padding: 11, marginTop: 12, marginBottom: 4
  },
  noticeText: { flex: 1, fontSize: 12.5, color: '#92400e', marginLeft: 7, lineHeight: 18 },

  formBtnRow: { flexDirection: 'row', marginTop: 14 },
  secondaryBtn: {
    paddingVertical: 13, paddingHorizontal: 18, borderRadius: 10,
    borderWidth: 1, borderColor: '#cbd5e1', marginRight: 10, justifyContent: 'center'
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '700', color: '#334155' },
  primaryBtn: {
    flex: 1, backgroundColor: '#1d4ed8', paddingVertical: 13, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center'
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { fontSize: 14, fontWeight: '700', color: '#ffffff' }
});
