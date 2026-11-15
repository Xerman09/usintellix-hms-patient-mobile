import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
  TextInput
} from 'react-native';
import {
  CloseIcon,
  ChatIcon,
  InfoCircleIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon
} from './Icons';
import { myChartApi } from '../api/mychart';

/**
 * Online visits (Phase M15a).
 *
 * A patient picks what is wrong, answers a questionnaire, and a clinician
 * replies in writing. No video.
 *
 * THE REFUSAL SCREEN IS THE MOST IMPORTANT THING IN THIS FILE.
 *
 * When an answer trips a red flag the server returns HTTP 200 with
 * success: false, refused: true, and an `urgent` block. That is not a validation
 * error and it is not shown as a toast -- it takes over the whole sheet, because
 * the failure this guards against is a patient reading "thank you, a doctor will
 * reply" after typing that they have chest pain, and then waiting at home.
 *
 * The refusal screen says, in this order: get help now, why, and that nobody is
 * reading the message so do not wait for a reply. It offers no "try again" and
 * no way back into the form, because there is nothing to retry -- the answer is
 * to be seen in person.
 *
 * The safety questions are asked first, on their own step, before the patient
 * invests any effort in describing the problem. Someone who has to be turned
 * away should be turned away before typing out a history nobody will read.
 */
export default function MyChartEvisitsModal({ visible, onClose }) {
  const [view, setView] = useState('list');   // list | reasons | form | detail | refused
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [data, setData] = useState(null);
  const [reasons, setReasons] = useState(null);
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState('safety');  // safety | problem
  const [detail, setDetail] = useState(null);
  const [refusal, setRefusal] = useState(null);
  const [followUpText, setFollowUpText] = useState('');

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await myChartApi.getEvisits();
      if (res?.success) setData(res.data);
      else setError(res?.message || 'Could not load your online visits.');
    } catch (e) {
      setError('Could not load your online visits.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    setView('list');
    setDetail(null);
    setRefusal(null);
    setForm(null);
    setAnswers({});
    loadList();
  }, [visible, loadList]);

  const openReasons = async () => {
    setLoading(true);
    try {
      const res = await myChartApi.getEvisitReasons();
      if (res?.success) {
        setReasons(res.data);
        setView('reasons');
      } else {
        setError(res?.message || 'Could not load that.');
      }
    } finally {
      setLoading(false);
    }
  };

  const openForm = async (reasonCode) => {
    setLoading(true);
    try {
      const res = await myChartApi.getEvisitForm(reasonCode);
      if (res?.success) {
        setForm(res.data);
        setAnswers({});
        setStep('safety');
        setView('form');
      } else {
        setError(res?.message || 'Could not load that form.');
      }
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (evisitId) => {
    setBusy(true);
    try {
      const res = await myChartApi.getEvisit(evisitId);
      if (res?.success) {
        setDetail(res.data);
        setFollowUpText('');
        setView('detail');
      }
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await myChartApi.submitEvisit({
        reason_code: form.reason_code,
        answers
      });

      // Checked BEFORE success, deliberately: a refusal is a 200 with
      // success false, and treating it as an ordinary failure would bury the
      // one message that matters.
      if (res?.refused) {
        setRefusal(res.urgent || null);
        setView('refused');
        return;
      }

      if (res?.success) {
        setForm(null);
        setAnswers({});
        setView('list');
        await loadList();
      } else {
        setError(res?.message || 'That could not be sent.');
      }
    } catch (e) {
      setError('That could not be sent.');
    } finally {
      setBusy(false);
    }
  };

  const sendFollowUp = async () => {
    if (!followUpText.trim()) return;
    setBusy(true);
    try {
      const res = await myChartApi.followUpEvisit(detail.id, followUpText.trim());
      if (res?.success) {
        setFollowUpText('');
        await openDetail(detail.id);
        await loadList();
      } else {
        setError(res?.message || 'That could not be sent.');
      }
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async (evisitId) => {
    setBusy(true);
    try {
      await myChartApi.withdrawEvisit(evisitId);
      setView('list');
      await loadList();
    } finally {
      setBusy(false);
    }
  };

  const setAnswer = (key, value) => setAnswers((prev) => ({ ...prev, [key]: value }));

  // -------------------------------------------------------------- the refusal
  const renderRefused = () => (
    <View style={styles.refuseWrap}>
      <View style={styles.refuseIcon}>
        <AlertTriangleIcon color="#dc2626" size={34} />
      </View>
      <Text style={styles.refuseHead}>{refusal?.headline || 'Please get help now'}</Text>

      {(refusal?.because || []).map((b, i) => (
        <Text key={`why-${i}`} style={styles.refuseWhy}>{b}</Text>
      ))}

      <View style={styles.refuseTerms}>
        {(refusal?.terms || []).map((t, i) => (
          <Text key={`t-${i}`} style={styles.refuseTerm}>• {t}</Text>
        ))}
      </View>

      {/* No "try again". There is nothing to retry: the answer is to be seen. */}
      <TouchableOpacity style={styles.refuseBtn} onPress={onClose}>
        <Text style={styles.refuseBtnText}>I understand</Text>
      </TouchableOpacity>
    </View>
  );

  // ------------------------------------------------------------------- list
  const renderList = () => {
    if (!data) return null;

    const { items = [], can_raise: canRaise, blocked_reason: blocked, reply_hours: replyHours, terms } = data;

    return (
      <>
        {blocked ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>{blocked}</Text>
          </View>
        ) : null}

        {items.length === 0 && !blocked ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No online visits</Text>
            <Text style={styles.emptyText}>
              You can describe a problem here and a doctor or nurse will reply, usually
              within {replyHours} hours. It is not for anything urgent.
            </Text>
          </View>
        ) : null}

        {items.map((e) => (
          <TouchableOpacity
            key={`ev-${e.id}`}
            style={[styles.evCard, e.overdue && styles.evCardLate]}
            onPress={() => openDetail(e.id)}
            activeOpacity={0.7}
          >
            <View style={styles.evTop}>
              <Text style={styles.evTitle} numberOfLines={2}>{e.reason}</Text>
              <View style={[styles.chip, chipStyleFor(e.status)]}>
                <Text style={[styles.chipText, chipTextFor(e.status)]}>{statusWord(e.status)}</Text>
              </View>
            </View>
            <Text style={styles.evRef}>{e.evisit_no}</Text>
            <Text style={styles.evStatus}>{e.status_text}</Text>
            {e.status === 'submitted' && e.due_by ? (
              <View style={styles.rowIcon}>
                <ClockIcon color="#94a3b8" size={13} />
                <Text style={styles.evMeta}>  Reply expected by {String(e.due_by).slice(0, 16)}</Text>
              </View>
            ) : null}
            <View style={styles.openRow}>
              <Text style={styles.openText}>{e.status === 'answered' ? 'Read the reply' : 'See what you sent'}</Text>
              <ChevronRightIcon color="#2563eb" size={15} />
            </View>
          </TouchableOpacity>
        ))}

        {canRaise ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={openReasons}>
            <Text style={styles.primaryBtnText}>Describe a new problem</Text>
          </TouchableOpacity>
        ) : !blocked && items.length > 0 ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              You have an online visit open already. We will reply to that one first.
            </Text>
          </View>
        ) : null}

        {termsBlock(terms)}
      </>
    );
  };

  // ---------------------------------------------------------------- reasons
  const renderReasons = () => {
    if (!reasons) return null;

    return (
      <>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Pick what is closest. Read the "not for this" line on each one first — some
            problems have to be looked at in person, and this is not the way to get seen
            quickly.
          </Text>
        </View>

        {(reasons.items || []).map((r) => (
          <TouchableOpacity
            key={`rs-${r.code}`}
            style={styles.reasonCard}
            onPress={() => openForm(r.code)}
            activeOpacity={0.7}
          >
            <Text style={styles.reasonTitle}>{r.label}</Text>
            {r.blurb ? <Text style={styles.reasonBlurb}>{r.blurb}</Text> : null}
            {r.not_for ? (
              <View style={styles.notForCard}>
                <View style={styles.rowIcon}>
                  <AlertTriangleIcon color="#ea580c" size={13} />
                  <Text style={styles.notForTitle}>  Not for this</Text>
                </View>
                <Text style={styles.notForText}>{r.not_for}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}

        {termsBlock(reasons.terms)}
      </>
    );
  };

  // ------------------------------------------------------------------- form
  const renderForm = () => {
    if (!form) return null;

    const safety = (form.questions || []).filter((q) => q.is_safety_check);
    const problem = (form.questions || []).filter((q) => !q.is_safety_check);
    const shown = step === 'safety' ? safety : problem;

    const safetyDone = safety.every((q) => !q.required || (answers[q.key] || '').trim() !== '');
    const problemDone = problem.every((q) => !q.required || (answers[q.key] || '').trim() !== '');

    return (
      <>
        <Text style={styles.formHeading}>{form.reason_label}</Text>

        {step === 'safety' ? (
          <View style={styles.safetyIntro}>
            <Text style={styles.safetyIntroTitle}>First, a few safety questions</Text>
            <Text style={styles.safetyIntroText}>
              These decide whether this is safe to deal with online. Answer them honestly —
              if any of them apply, we will tell you to get help in person instead, which is
              the right answer.
            </Text>
          </View>
        ) : (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>{form.intro}</Text>
          </View>
        )}

        {shown.map((q) => (
          <View key={q.key} style={styles.qCard}>
            <Text style={styles.qLabel}>
              {q.label}{q.required ? <Text style={styles.qReq}> *</Text> : null}
            </Text>

            {q.type === 'yesno' ? (
              <View style={styles.yesnoRow}>
                {['Yes', 'No'].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.optBtn, answers[q.key] === opt && styles.optBtnOn]}
                    onPress={() => setAnswer(q.key, opt)}
                  >
                    <Text style={[styles.optText, answers[q.key] === opt && styles.optTextOn]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : q.type === 'choice' && Array.isArray(q.options) ? (
              <View>
                {q.options.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.choiceRow, answers[q.key] === opt && styles.choiceRowOn]}
                    onPress={() => setAnswer(q.key, opt)}
                  >
                    <View style={[styles.radio, answers[q.key] === opt && styles.radioOn]} />
                    <Text style={styles.choiceText}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <TextInput
                style={[styles.input, styles.inputMulti]}
                value={answers[q.key] || ''}
                onChangeText={(v) => setAnswer(q.key, v)}
                placeholder="Type your answer"
                placeholderTextColor="#94a3b8"
                multiline
                maxLength={2000}
              />
            )}
          </View>
        ))}

        {step === 'safety' ? (
          <TouchableOpacity
            style={[styles.primaryBtn, !safetyDone && styles.btnDisabled]}
            onPress={() => setStep('problem')}
            disabled={!safetyDone}
          >
            <Text style={styles.primaryBtnText}>Continue</Text>
          </TouchableOpacity>
        ) : (
          <>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                We aim to reply within {form.reply_hours} hours. Nobody is reading this minute
                by minute — if things get worse while you wait, call the clinic or go in.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.primaryBtn, (!problemDone || busy) && styles.btnDisabled]}
              onPress={submit}
              disabled={!problemDone || busy}
            >
              <Text style={styles.primaryBtnText}>{busy ? 'Sending…' : 'Send to the clinic'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep('safety')}>
              <Text style={styles.secondaryBtnText}>Back to the safety questions</Text>
            </TouchableOpacity>
          </>
        )}

        {termsBlock(form.terms)}
      </>
    );
  };

  // ----------------------------------------------------------------- detail
  const renderDetail = () => {
    if (!detail) return null;

    return (
      <>
        <View style={styles.detailHead}>
          <Text style={styles.detailTitle}>{detail.reason}</Text>
          <Text style={styles.detailRef}>{detail.evisit_no}</Text>
          <Text style={styles.detailStatus}>{detail.status_text}</Text>
        </View>

        {(detail.messages || []).map((m, i) => (
          <View key={`m-${i}`} style={[styles.msgCard, m.from === 'clinician' ? styles.msgClinician : styles.msgPatient]}>
            <Text style={styles.msgWho}>{m.from === 'clinician' ? m.author : 'You'} · {String(m.at || '').slice(0, 16)}</Text>
            <Text style={styles.msgBody}>{m.body}</Text>
          </View>
        ))}

        {detail.can_follow_up ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Ask one follow-up question</Text>
            <Text style={styles.formHint}>
              You can ask once about this reply, until {detail.follow_up_until}. For anything
              new, start a new online visit.
            </Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={followUpText}
              onChangeText={setFollowUpText}
              placeholder="Your question"
              placeholderTextColor="#94a3b8"
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              style={[styles.primaryBtn, (busy || !followUpText.trim()) && styles.btnDisabled]}
              onPress={sendFollowUp}
              disabled={busy || !followUpText.trim()}
            >
              <Text style={styles.primaryBtnText}>{busy ? 'Sending…' : 'Send'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {(detail.what_you_told_us || []).length > 0 ? (
          <View style={styles.toldCard}>
            <Text style={styles.sectionLabel}>WHAT YOU TOLD US</Text>
            {detail.what_you_told_us.map((a, i) => (
              <View key={`a-${i}`} style={styles.toldRow}>
                <Text style={styles.toldQ}>{a.label}</Text>
                <Text style={styles.toldA}>{a.answer}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {detail.can_withdraw ? (
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => withdraw(detail.id)} disabled={busy}>
            <Text style={styles.secondaryBtnText}>Take this back</Text>
          </TouchableOpacity>
        ) : null}

        {termsBlock(detail.terms)}
      </>
    );
  };

  const termsBlock = (terms) => (
    <View style={styles.termsCard}>
      <View style={styles.rowIcon}>
        <InfoCircleIcon color="#64748b" size={15} />
        <Text style={styles.termsTitle}>  How this works</Text>
      </View>
      {(terms || []).map((t, i) => (
        <Text key={`tm-${i}`} style={styles.termsText}>• {t}</Text>
      ))}
    </View>
  );

  const headerTitle = view === 'refused' ? 'Get help now'
    : view === 'form' ? 'New online visit'
      : view === 'reasons' ? 'What is wrong?'
        : view === 'detail' ? 'Your online visit'
          : 'Online visits';

  const canGoBack = ['reasons', 'form', 'detail'].includes(view);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={[styles.iconCircle, view === 'refused' && styles.iconCircleAlarm]}>
              {view === 'refused'
                ? <AlertTriangleIcon color="#dc2626" size={18} />
                : <ChatIcon color="#2563eb" size={18} />}
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.headerTitle}>{headerTitle}</Text>
              <Text style={styles.headerSubtitle}>
                {view === 'refused' ? 'This needs to be seen in person' : 'Ask a doctor or nurse in writing'}
              </Text>
            </View>
          </View>
          {/* No back button on the refusal screen: there is nothing to go back to. */}
          <TouchableOpacity
            onPress={canGoBack ? () => { setView('list'); setDetail(null); } : onClose}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {canGoBack ? <Text style={styles.backText}>Back</Text> : <CloseIcon color="#64748b" size={18} />}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {view === 'refused' ? renderRefused()
            : loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text style={styles.loadingText}>Loading…</Text>
              </View>
            ) : (
              <>
                {error ? (
                  <View style={styles.errorCard}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}
                {view === 'reasons' ? renderReasons()
                  : view === 'form' ? renderForm()
                    : view === 'detail' ? renderDetail()
                      : renderList()}
              </>
            )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function statusWord(status) {
  return {
    submitted: 'Waiting',
    answered: 'Replied',
    closed: 'Finished',
    withdrawn: 'Taken back'
  }[status] || status;
}

function chipStyleFor(status) {
  if (status === 'answered') return styles.chipGreen;
  if (status === 'submitted') return styles.chipAmber;
  return styles.chipGrey;
}

function chipTextFor(status) {
  if (status === 'answered') return styles.chipTextGreen;
  if (status === 'submitted') return styles.chipTextAmber;
  return styles.chipTextGrey;
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
  iconCircleAlarm: { backgroundColor: '#fef2f2' },
  headerTitle: { fontSize: 15.5, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 11.5, color: '#64748b', marginTop: 1 },
  closeBtn: { padding: 6, marginLeft: 8 },
  backText: { fontSize: 13, fontWeight: '800', color: '#2563eb' },

  body: { flex: 1 },
  rowIcon: { flexDirection: 'row', alignItems: 'center' },

  loadingBox: { alignItems: 'center', paddingVertical: 50 },
  loadingText: { marginTop: 10, fontSize: 13, color: '#64748b' },

  errorCard: {
    backgroundColor: '#fef2f2', borderRadius: 12, borderWidth: 1, borderColor: '#fecaca',
    padding: 14, marginBottom: 14
  },
  errorText: { fontSize: 13, color: '#991b1b', lineHeight: 19 },

  // ---- the refusal screen ----
  refuseWrap: { alignItems: 'center', paddingTop: 18 },
  refuseIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#fef2f2',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    borderWidth: 2, borderColor: '#fecaca'
  },
  refuseHead: {
    fontSize: 23, fontWeight: '800', color: '#991b1b',
    textAlign: 'center', letterSpacing: -0.6, marginBottom: 14
  },
  refuseWhy: {
    fontSize: 15, color: '#0f172a', textAlign: 'center',
    lineHeight: 22, marginBottom: 10, paddingHorizontal: 4
  },
  refuseTerms: {
    backgroundColor: '#fef2f2', borderRadius: 14, borderWidth: 1, borderColor: '#fecaca',
    padding: 16, marginTop: 10, width: '100%'
  },
  refuseTerm: { fontSize: 13.5, color: '#991b1b', lineHeight: 20, marginBottom: 7, fontWeight: '600' },
  refuseBtn: {
    marginTop: 22, backgroundColor: '#dc2626', borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 40
  },
  refuseBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 14.5 },

  infoCard: {
    backgroundColor: '#eff6ff', borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe',
    padding: 13, marginBottom: 14
  },
  infoText: { fontSize: 12.5, color: '#1e40af', lineHeight: 18.5 },

  emptyCard: {
    backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 20, marginBottom: 14, alignItems: 'center'
  },
  emptyTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 5, letterSpacing: -0.3 },
  emptyText: { fontSize: 12.5, color: '#64748b', textAlign: 'center', lineHeight: 18.5 },

  evCard: {
    backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 16, marginBottom: 12
  },
  evCardLate: { borderColor: '#fde68a', backgroundColor: '#fffdf7' },
  evTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  evTitle: { flex: 1, fontSize: 14.5, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3, paddingRight: 10 },
  evRef: { fontSize: 11, color: '#94a3b8', marginTop: 3, fontWeight: '700' },
  evStatus: { fontSize: 12.5, color: '#475569', marginTop: 7, lineHeight: 18 },
  evMeta: { fontSize: 11.5, color: '#94a3b8' },
  openRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  openText: { fontSize: 12.5, fontWeight: '800', color: '#2563eb', marginRight: 3 },

  chip: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 2 },
  chipText: { fontSize: 10.5, fontWeight: '800' },
  chipGreen: { backgroundColor: '#dcfce7' },
  chipTextGreen: { color: '#166534' },
  chipAmber: { backgroundColor: '#fffbeb' },
  chipTextAmber: { color: '#92400e' },
  chipGrey: { backgroundColor: '#f1f5f9' },
  chipTextGrey: { color: '#64748b' },

  reasonCard: {
    backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 16, marginBottom: 12
  },
  reasonTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 },
  reasonBlurb: { fontSize: 12.5, color: '#475569', marginTop: 5, lineHeight: 18.5 },
  notForCard: {
    backgroundColor: '#fff7ed', borderRadius: 11, borderWidth: 1, borderColor: '#fed7aa',
    padding: 11, marginTop: 10
  },
  notForTitle: { fontSize: 11, fontWeight: '800', color: '#9a3412', letterSpacing: 0.3 },
  notForText: { fontSize: 12, color: '#7c2d12', lineHeight: 17.5, marginTop: 5 },

  formHeading: { fontSize: 17, fontWeight: '800', color: '#0f172a', letterSpacing: -0.4, marginBottom: 12 },
  safetyIntro: {
    backgroundColor: '#fffbeb', borderRadius: 12, borderWidth: 1, borderColor: '#fde68a',
    padding: 14, marginBottom: 14
  },
  safetyIntroTitle: { fontSize: 13.5, fontWeight: '800', color: '#92400e', marginBottom: 5 },
  safetyIntroText: { fontSize: 12.5, color: '#92400e', lineHeight: 18.5 },

  qCard: {
    backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 14, marginBottom: 10
  },
  qLabel: { fontSize: 13.5, color: '#0f172a', fontWeight: '600', lineHeight: 19.5 },
  qReq: { color: '#dc2626' },
  yesnoRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  optBtn: {
    flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 11,
    paddingVertical: 11, alignItems: 'center', backgroundColor: '#fafbfc'
  },
  optBtnOn: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  optText: { fontSize: 13.5, fontWeight: '800', color: '#334155' },
  optTextOn: { color: '#ffffff' },
  choiceRow: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 11, paddingVertical: 11, paddingHorizontal: 13, marginTop: 8, backgroundColor: '#fafbfc'
  },
  choiceRowOn: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  radio: { width: 19, height: 19, borderRadius: 10, borderWidth: 2, borderColor: '#cbd5e1', marginRight: 11 },
  radioOn: { borderColor: '#2563eb', backgroundColor: '#2563eb' },
  choiceText: { flex: 1, fontSize: 13, color: '#0f172a' },

  input: {
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 11,
    paddingVertical: 11, paddingHorizontal: 13, fontSize: 13.5,
    color: '#0f172a', backgroundColor: '#fafbfc', marginTop: 9
  },
  inputMulti: { minHeight: 76, textAlignVertical: 'top' },

  primaryBtn: {
    backgroundColor: '#2563eb', borderRadius: 11, paddingVertical: 13,
    alignItems: 'center', marginTop: 14
  },
  primaryBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 13.5 },
  secondaryBtn: {
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 11, paddingVertical: 12,
    alignItems: 'center', backgroundColor: '#ffffff', marginTop: 10
  },
  secondaryBtnText: { color: '#334155', fontWeight: '800', fontSize: 13 },
  btnDisabled: { opacity: 0.5 },

  detailHead: {
    backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 16, marginBottom: 14
  },
  detailTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', letterSpacing: -0.4, lineHeight: 22 },
  detailRef: { fontSize: 11.5, color: '#94a3b8', marginTop: 4, fontWeight: '700' },
  detailStatus: { fontSize: 13, color: '#475569', marginTop: 8, lineHeight: 19 },

  msgCard: { borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1 },
  msgPatient: { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
  msgClinician: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  msgWho: { fontSize: 10.5, fontWeight: '800', color: '#64748b', letterSpacing: 0.4, marginBottom: 5 },
  msgBody: { fontSize: 13.5, color: '#0f172a', lineHeight: 20 },

  formCard: {
    backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 16, marginTop: 4, marginBottom: 14
  },
  formTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 },
  formHint: { fontSize: 11.5, color: '#64748b', marginTop: 5, lineHeight: 17 },

  toldCard: {
    backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 16, marginBottom: 14
  },
  sectionLabel: { fontSize: 10.5, fontWeight: '800', color: '#64748b', letterSpacing: 0.8, marginBottom: 10 },
  toldRow: { paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  toldQ: { fontSize: 11.5, color: '#94a3b8' },
  toldA: { fontSize: 13, color: '#0f172a', marginTop: 2, fontWeight: '600' },

  termsCard: {
    backgroundColor: '#f1f5f9', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 15, marginTop: 4
  },
  termsTitle: { fontSize: 11.5, fontWeight: '800', color: '#475569', letterSpacing: 0.4 },
  termsText: { fontSize: 12, color: '#64748b', lineHeight: 18, marginTop: 7 }
});
