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
  ClipboardIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  InfoCircleIcon,
  ClockIcon
} from './Icons';

/**
 * Questionnaires between visits (Phase M13).
 *
 * The care team sends a questionnaire with a due date; this is where the patient
 * answers it. Three things this screen is careful about:
 *
 *   No score, ever. PHQ-9 and GAD-7 are scored on the server and read by the
 *   care team. A patient shown "19 of 27" has been handed a number they cannot
 *   interpret and nobody to interpret it with, at the exact moment they are
 *   least able to. After submitting they are told their team can see it, and —
 *   when it crossed the band — that the team was told today.
 *
 *   Whether an answer can still be sent is the server's call. can_answer and
 *   status_text come down with each item, so this screen never offers a button
 *   the server would then refuse.
 *
 *   Answers are not kept on the device between opens. A half-finished
 *   questionnaire that reappears days later invites someone to submit stale
 *   answers about how they feel today.
 */
export default function MyChartQuestionnairesModal({ visible, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(null);        // the questionnaire being answered
  const [answers, setAnswers] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [opening, setOpening] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

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
      const res = await MyChartService.getMyQuestionnaires();
      setData(res?.success ? res.data : null);
    } catch (e) {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const closeForm = () => {
    setOpen(null);
    setAnswers({});
    setFieldErrors({});
    setError(null);
  };

  const openQuestionnaire = async (item) => {
    setOpening(true);
    setError(null);
    try {
      const res = await MyChartService.getQuestionnaireForm(item.id);

      if (!res?.success) {
        Alert.alert('Cannot open this', res?.message || 'Please try again in a moment.');
        await load();
        return;
      }

      setOpen(res.data);
      setAnswers({});
      setFieldErrors({});
    } catch (e) {
      Alert.alert('Cannot open this', 'Please check your connection and try again.');
    } finally {
      setOpening(false);
    }
  };

  const setAnswer = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[`answers.${key}`]) return prev;
      const next = { ...prev };
      delete next[`answers.${key}`];
      return next;
    });
  };

  const toggleCheckbox = (key, option) => {
    const current = Array.isArray(answers[key]) ? answers[key] : [];
    setAnswer(key, current.includes(option) ? current.filter((o) => o !== option) : [...current, option]);
  };

  /** How many of the questions that must be answered still are not. */
  const missingCount = () => {
    if (!open) return 0;

    return open.questions.filter((q) => {
      if (!q.required) return false;
      const v = answers[q.key];
      if (q.type === 'checkboxes') return !Array.isArray(v) || v.length === 0;
      if (q.type === 'scale') return v === undefined || v === null || v === '';
      return v === undefined || v === null || String(v).trim() === '';
    }).length;
  };

  const submit = async () => {
    if (!open) return;

    const missing = missingCount();

    if (missing > 0) {
      setError(missing === 1
        ? 'One question still needs an answer.'
        : `${missing} questions still need an answer.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await MyChartService.submitQuestionnaire(open.id, answers);

      if (!res?.success) {
        setFieldErrors(res?.errors || {});
        setError(res?.message || 'Your answers could not be saved. Please try again.');
        return;
      }

      const told = res?.data?.team_notified;

      closeForm();
      await load();

      Alert.alert(
        'Thank you',
        told
          ? 'Your answers are saved. Someone from your care team has been told about them today and may get in touch.\n\nIf you need help before then, contact the clinic or go to the nearest emergency department.'
          : 'Your answers are saved, and your care team can see them.'
      );
    } catch (e) {
      setError('Your answers could not be sent. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const waiting = data?.waiting || [];
  const answered = data?.answered || [];

  // ---------------------------------------------------------------- one question
  const renderQuestion = (q, index) => {
    const err = fieldErrors[`answers.${q.key}`];
    const value = answers[q.key];

    return (
      <View key={q.key} style={[styles.qBlock, err ? styles.qBlockError : null]}>
        <Text style={styles.qLabel}>
          <Text style={styles.qNum}>{index + 1}. </Text>
          {q.label}
          {q.required ? <Text style={styles.qRequired}>  ·  needed</Text> : null}
        </Text>

        {q.type === 'scale' || q.type === 'choice' || q.type === 'yesno' ? (
          <View style={styles.optionWrap}>
            {(q.type === 'yesno' ? ['Yes', 'No'] : q.options).map((opt, i) => {
              // A scale answer is the index; a choice answer is the label itself.
              const optValue = q.type === 'scale' ? i : opt;
              const chosen = q.type === 'scale' ? value === i : value === opt;

              return (
                <TouchableOpacity
                  key={`${q.key}-${i}`}
                  style={[styles.option, chosen && styles.optionOn]}
                  activeOpacity={0.7}
                  onPress={() => setAnswer(q.key, optValue)}
                >
                  <View style={[styles.radio, chosen && styles.radioOn]}>
                    {chosen ? <View style={styles.radioDot} /> : null}
                  </View>
                  <Text style={[styles.optionText, chosen && styles.optionTextOn]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : q.type === 'checkboxes' ? (
          <View style={styles.optionWrap}>
            {q.options.map((opt, i) => {
              const chosen = Array.isArray(value) && value.includes(opt);

              return (
                <TouchableOpacity
                  key={`${q.key}-${i}`}
                  style={[styles.option, chosen && styles.optionOn]}
                  activeOpacity={0.7}
                  onPress={() => toggleCheckbox(q.key, opt)}
                >
                  <View style={[styles.checkbox, chosen && styles.checkboxOn]}>
                    {chosen ? <CheckCircleIcon color="#ffffff" size={11} /> : null}
                  </View>
                  <Text style={[styles.optionText, chosen && styles.optionTextOn]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <TextInput
            style={q.type === 'textarea' ? styles.textArea : styles.input}
            value={value === undefined || value === null ? '' : String(value)}
            onChangeText={(t) => setAnswer(q.key, t)}
            placeholder={q.type === 'textarea' ? 'In your own words' : 'Your answer'}
            placeholderTextColor="#94a3b8"
            multiline={q.type === 'textarea'}
            maxLength={2000}
          />
        )}

        {err ? <Text style={styles.qError}>{err}</Text> : null}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={open ? closeForm : onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.iconCircle}>
              <ClipboardIcon color="#2563eb" size={17} />
            </View>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {open ? open.title : 'Questionnaires'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {open
                  ? `${open.questions.length} question${open.questions.length === 1 ? '' : 's'}`
                  : 'Asked by your care team'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={open ? closeForm : onClose}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <CloseIcon color="#64748b" size={18} />
          </TouchableOpacity>
        </View>

        {loading || opening ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
            keyboardShouldPersistTaps="handled"
          >
            {open ? (
              <>
                {open.reason ? (
                  <View style={styles.reasonBox}>
                    <Text style={styles.reasonLabel}>WHY YOU WERE ASKED</Text>
                    <Text style={styles.reasonText}>{open.reason}</Text>
                  </View>
                ) : null}

                {open.intro ? <Text style={styles.introText}>{open.intro}</Text> : null}

                {open.questions.map(renderQuestion)}

                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.noticeBox}>
                  <InfoCircleIcon color="#92400e" size={14} />
                  <Text style={styles.noticeText}>
                    Your answers go to the team looking after you. This is not a way to get help
                    urgently — if you need someone today, contact the clinic or go to the nearest
                    emergency department.
                  </Text>
                </View>

                <View style={styles.formBtnRow}>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={closeForm} disabled={submitting}>
                    <Text style={styles.secondaryBtnText}>Not now</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryBtn, submitting && styles.btnDisabled]}
                    onPress={submit}
                    disabled={submitting}
                  >
                    {submitting
                      ? <ActivityIndicator color="#ffffff" size="small" />
                      : <Text style={styles.primaryBtnText}>Send my answers</Text>}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {data && !data.allow_answering ? (
                  <View style={styles.noticeBox}>
                    <AlertTriangleIcon color="#92400e" size={14} />
                    <Text style={styles.noticeText}>
                      Answering questionnaires from home is switched off at the moment. Please bring
                      anything you were asked about to your next visit.
                    </Text>
                  </View>
                ) : null}

                <Text style={styles.sectionLabel}>WAITING FOR YOU</Text>

                {waiting.length === 0 ? (
                  <View style={styles.card}>
                    <Text style={styles.emptyTitle}>Nothing to fill in</Text>
                    <Text style={styles.bodyText}>
                      When someone from your care team asks you to answer something between visits,
                      it will appear here and in your To-Do list.
                    </Text>
                  </View>
                ) : (
                  waiting.map((item) => (
                    <View key={item.id} style={[styles.card, item.overdue && styles.cardOverdue]}>
                      <View style={styles.cardTopRow}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        {item.overdue ? (
                          <View style={styles.overduePill}>
                            <ClockIcon color="#92400e" size={10} />
                            <Text style={styles.overduePillText}>Overdue</Text>
                          </View>
                        ) : null}
                      </View>

                      {item.reason ? <Text style={styles.bodyText}>{item.reason}</Text> : null}

                      <Text style={styles.metaText}>
                        {item.question_count} question{item.question_count === 1 ? '' : 's'}
                        {item.assigned_by ? `  ·  from ${item.assigned_by}` : ''}
                      </Text>
                      <Text style={styles.statusLine}>{item.status_text}</Text>

                      {item.can_answer ? (
                        <TouchableOpacity
                          style={styles.answerBtn}
                          activeOpacity={0.8}
                          onPress={() => openQuestionnaire(item)}
                        >
                          <Text style={styles.answerBtnText}>
                            {item.started ? 'Carry on' : 'Answer this'}
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ))
                )}

                {answered.length > 0 && (
                  <>
                    <Text style={[styles.sectionLabel, { marginTop: 18 }]}>ALREADY ANSWERED</Text>
                    {answered.map((item) => (
                      <View key={`a-${item.id}`} style={styles.card}>
                        <View style={styles.cardTopRow}>
                          <Text style={styles.cardTitle}>{item.title}</Text>
                          <CheckCircleIcon color="#16a34a" size={15} />
                        </View>
                        <Text style={styles.statusLine}>{item.status_text}</Text>
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
    marginBottom: 14
  },
  cardOverdue: { borderColor: '#fde68a', backgroundColor: '#fffdf5' },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: {
    fontSize: 14.5, fontWeight: '800', color: '#0f172a',
    letterSpacing: -0.3, flex: 1, marginRight: 8
  },
  emptyTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 5, letterSpacing: -0.3 },
  bodyText: { fontSize: 13, color: '#334155', lineHeight: 19, marginTop: 5 },
  metaText: { fontSize: 11.5, color: '#64748b', marginTop: 7 },
  statusLine: { fontSize: 12.5, color: '#475569', marginTop: 5, lineHeight: 18 },

  overduePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fef3c7', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3
  },
  overduePillText: { fontSize: 10.5, fontWeight: '800', color: '#92400e' },

  answerBtn: {
    marginTop: 13, backgroundColor: '#2563eb', borderRadius: 11,
    paddingVertical: 11, alignItems: 'center'
  },
  answerBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 13.5, letterSpacing: -0.2 },

  reasonBox: {
    backgroundColor: '#eff6ff', borderRadius: 12, borderWidth: 1,
    borderColor: '#bfdbfe', padding: 14, marginBottom: 14
  },
  reasonLabel: { fontSize: 10.5, fontWeight: '800', color: '#1e40af', letterSpacing: 0.8 },
  reasonText: { fontSize: 13, color: '#1e3a8a', lineHeight: 19, marginTop: 5 },

  introText: { fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 16 },

  qBlock: {
    backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1,
    borderColor: '#e2e8f0', padding: 16, marginBottom: 12
  },
  qBlockError: { borderColor: '#fca5a5' },
  qLabel: { fontSize: 13.5, color: '#0f172a', fontWeight: '700', lineHeight: 20, letterSpacing: -0.2 },
  qNum: { color: '#94a3b8', fontWeight: '800' },
  qRequired: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  qError: { fontSize: 12, color: '#b91c1c', marginTop: 8, fontWeight: '600' },

  optionWrap: { marginTop: 11, gap: 7 },
  option: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 11,
    paddingVertical: 11, paddingHorizontal: 13, backgroundColor: '#fafbfc'
  },
  optionOn: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  optionText: { fontSize: 13, color: '#334155', flex: 1, marginLeft: 11, lineHeight: 18 },
  optionTextOn: { color: '#1e3a8a', fontWeight: '700' },

  radio: {
    width: 19, height: 19, borderRadius: 10, borderWidth: 2,
    borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center'
  },
  radioOn: { borderColor: '#2563eb' },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#2563eb' },

  checkbox: {
    width: 19, height: 19, borderRadius: 5, borderWidth: 2,
    borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center'
  },
  checkboxOn: { borderColor: '#2563eb', backgroundColor: '#2563eb' },

  input: {
    marginTop: 11, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 11,
    paddingHorizontal: 13, paddingVertical: 11, fontSize: 13.5,
    color: '#0f172a', backgroundColor: '#fafbfc'
  },
  textArea: {
    marginTop: 11, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 11,
    paddingHorizontal: 13, paddingVertical: 11, fontSize: 13.5,
    color: '#0f172a', backgroundColor: '#fafbfc',
    minHeight: 86, textAlignVertical: 'top'
  },

  errorBox: {
    backgroundColor: '#fef2f2', borderRadius: 11, borderWidth: 1,
    borderColor: '#fecaca', padding: 13, marginBottom: 12
  },
  errorText: { fontSize: 12.5, color: '#991b1b', lineHeight: 18, fontWeight: '600' },

  noticeBox: {
    flexDirection: 'row', gap: 9, alignItems: 'flex-start',
    backgroundColor: '#fffbeb', borderRadius: 11, borderWidth: 1,
    borderColor: '#fde68a', padding: 13, marginBottom: 14
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
