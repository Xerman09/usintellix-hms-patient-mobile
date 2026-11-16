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
  ClockIcon,
  InfoCircleIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  CalendarIcon
} from './Icons';
import { myChartApi } from '../api/mychart';

/**
 * Fast Pass (Phase M18) -- being offered an earlier appointment.
 *
 * The patient already holds an appointment. If they ask, and something earlier
 * comes free with the same doctor, they are offered it; accepting MOVES the
 * appointment they have. Nothing here creates a booking and nothing moves
 * without the patient tapping Accept.
 *
 * THE LIVE OFFER COMES FIRST, ALWAYS.
 *
 * It is the only thing in My Chart with a deadline on it, and a patient who has
 * to scroll past a list of their appointments to find it may miss it. So an open
 * offer renders above everything else, with the deadline spelled out and the
 * minutes left where they can be read at a glance.
 *
 * TWO PIECES OF HONESTY THAT ARE NOT OPTIONAL.
 *
 * First, the offer says that a few patients get the same slot and it may already
 * be gone. A screen that implied the slot was reserved would turn an ordinary
 * near miss into a broken promise, and the message the server sends says the
 * same thing -- they have to agree.
 *
 * Second, when an accept fails because somebody answered first, that is NOT
 * rendered as an error. It is the expected outcome for everybody but one person
 * in each round. The patient is told plainly that it went, and that they are
 * still on the list, in the same calm register as a success.
 *
 * No queue position is shown. The desk can see it; the patient cannot. It moves
 * for reasons that have nothing to do with them -- somebody ahead leaves, or is
 * offered a slot this patient could not have taken anyway -- and a number that
 * goes backwards with no explanation is worse than no number at all.
 */
export default function MyChartFastPassModal({ visible, onClose }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // A near miss is its own state, not an error: "somebody took it" is the
  // normal result of a round for everybody but one person.
  const [nearMiss, setNearMiss] = useState(null);
  const [moved, setMoved] = useState(null);

  const [joining, setJoining] = useState(null);     // the appointment being added
  const [earliest, setEarliest] = useState('');
  const [decliningId, setDecliningId] = useState(null);
  const [declineWhy, setDeclineWhy] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await myChartApi.getFastPass();
      if (res?.success) setData(res.data);
      else setError(res?.message || 'Could not load this.');
    } catch (e) {
      setError('Could not load this.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    setNearMiss(null);
    setMoved(null);
    setJoining(null);
    setEarliest('');
    setDecliningId(null);
    setDeclineWhy('');
    load();
  }, [visible, load]);

  const accept = async (offerId) => {
    setBusy(true);
    setError(null);
    try {
      const res = await myChartApi.acceptFastPass(offerId);

      if (res?.success) {
        setMoved(res.message || 'Your appointment has been moved.');
        await load();
        return;
      }

      // Not an error card. The server's message already says what happened and
      // that they are still on the list, so it is shown as it was written.
      setNearMiss(res?.message || 'That slot is no longer available. You are still on the list.');
      await load();
    } catch (e) {
      setError('That could not be done just now. Your appointment has not changed.');
    } finally {
      setBusy(false);
    }
  };

  const decline = async (offerId) => {
    setBusy(true);
    try {
      const res = await myChartApi.declineFastPass(offerId, declineWhy.trim());
      setDecliningId(null);
      setDeclineWhy('');

      if (!res?.success) {
        setError(res?.message || 'That could not be done.');
      }

      await load();
    } catch (e) {
      setError('That could not be done.');
    } finally {
      setBusy(false);
    }
  };

  const join = async (appointmentId) => {
    setBusy(true);
    try {
      const res = await myChartApi.joinFastPass(appointmentId, earliest.trim());

      if (!res?.success) {
        setError(res?.message || 'That could not be done.');
        return;
      }

      setJoining(null);
      setEarliest('');
      await load();
    } catch (e) {
      setError('That could not be done.');
    } finally {
      setBusy(false);
    }
  };

  const leave = async (waitlistId) => {
    setBusy(true);
    try {
      await myChartApi.leaveFastPass(waitlistId);
      await load();
    } finally {
      setBusy(false);
    }
  };

  // ------------------------------------------------------- the near miss
  const renderNearMiss = () => (
    <View style={styles.missCard}>
      <View style={styles.missIcon}>
        <InfoCircleIcon color="#2563eb" size={22} />
      </View>
      <Text style={styles.missTitle}>That one has gone</Text>
      <Text style={styles.missText}>{nearMiss}</Text>
      <TouchableOpacity style={styles.missBtn} onPress={() => setNearMiss(null)}>
        <Text style={styles.missBtnText}>All right</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMoved = () => (
    <View style={styles.movedCard}>
      <View style={styles.movedIcon}>
        <CheckCircleIcon color="#15803d" size={22} />
      </View>
      <Text style={styles.movedTitle}>Your appointment has moved</Text>
      <Text style={styles.movedText}>{moved}</Text>
      <Text style={styles.movedSub}>
        Nothing else about it has changed, and you will get the usual reminder before the
        new date.
      </Text>
      <TouchableOpacity style={styles.movedBtn} onPress={() => setMoved(null)}>
        <Text style={styles.movedBtnText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  // ----------------------------------------------------------- live offers
  const renderOffer = (o) => {
    const urgent = o.minutes_left <= 60;

    return (
      <View key={`of-${o.id}`} style={[styles.offerCard, urgent && styles.offerCardUrgent]}>
        <View style={styles.offerTopRow}>
          <View style={styles.rowIcon}>
            <ClockIcon color={urgent ? '#b45309' : '#1d4ed8'} size={14} />
            <Text style={[styles.offerFlag, urgent && styles.offerFlagUrgent]}>
              {'  '}An earlier appointment is free
            </Text>
          </View>
        </View>

        <Text style={styles.offerWhen}>{o.offered}</Text>
        {o.doctor ? <Text style={styles.offerDoctor}>with {o.doctor}</Text> : null}

        <View style={styles.offerSwap}>
          <Text style={styles.offerSwapText}>
            Instead of <Text style={styles.offerSwapStrong}>{o.instead_of}</Text>
          </Text>
        </View>

        <View style={styles.offerDeadline}>
          <Text style={[styles.offerDeadlineText, urgent && styles.offerDeadlineUrgent]}>
            Please answer by {o.deadline}
            {o.minutes_left > 0 ? ` — about ${formatLeft(o.minutes_left)} left` : ''}
          </Text>
        </View>

        {/* Said on the offer itself, not only in the terms at the bottom. This
            is the screen where somebody decides, and it is the thing they most
            need to know before they start rearranging their day. */}
        <Text style={styles.offerCaveat}>{o.caveat}</Text>

        {decliningId === o.id ? (
          <View style={styles.declineBox}>
            <Text style={styles.declineLabel}>
              If you want, say why — it helps the clinic. You can leave it blank.
            </Text>
            <TextInput
              style={styles.declineInput}
              value={declineWhy}
              onChangeText={setDeclineWhy}
              placeholder="e.g. I am working that morning"
              placeholderTextColor="#94a3b8"
              maxLength={200}
            />
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => { setDecliningId(null); setDeclineWhy(''); }}
                disabled={busy}
              >
                <Text style={styles.secondaryBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.declineBtn} onPress={() => decline(o.id)} disabled={busy}>
                <Text style={styles.declineBtnText}>No thank you</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => setDecliningId(o.id)}
              disabled={busy}
            >
              <Text style={styles.secondaryBtnText}>No thank you</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, styles.offerAcceptBtn]}
              onPress={() => accept(o.id)}
              disabled={busy}
            >
              <Text style={styles.primaryBtnText}>{busy ? 'Just a moment…' : 'Take this time'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // ------------------------------------------------------------- my entries
  const renderEntry = (e) => (
    <View key={`en-${e.id}`} style={styles.entryCard}>
      <View style={styles.entryTopRow}>
        <Text style={styles.entryWhen}>{e.appointment || 'Appointment'}</Text>
        <View style={[styles.chip, e.status === 'dormant' ? styles.chipPaused : styles.chipWaiting]}>
          <Text style={[styles.chipText, e.status === 'dormant' ? styles.chipTextPaused : styles.chipTextWaiting]}>
            {e.status === 'dormant' ? 'Paused' : 'On the list'}
          </Text>
        </View>
      </View>
      {e.doctor ? <Text style={styles.entryDoctor}>with {e.doctor}</Text> : null}
      <Text style={styles.entryNote}>{e.note}</Text>
      {e.earliest_date ? (
        <Text style={styles.entryMeta}>Nothing before {e.earliest_date}</Text>
      ) : null}

      <TouchableOpacity style={styles.linkBtn} onPress={() => leave(e.id)} disabled={busy}>
        <Text style={styles.linkBtnText}>Take me off the list</Text>
      </TouchableOpacity>
    </View>
  );

  // ----------------------------------------------------------- joinable
  const renderJoinable = (a) => (
    <View key={`jn-${a.id}`} style={styles.joinCard}>
      <View style={styles.rowIcon}>
        <CalendarIcon color="#64748b" size={14} />
        <Text style={styles.joinWhen}>{'  '}{a.when}</Text>
      </View>
      <Text style={styles.joinTitle}>{a.title}{a.doctor ? ` · ${a.doctor}` : ''}</Text>

      {joining === a.id ? (
        <View style={styles.joinBox}>
          <Text style={styles.joinLabel}>
            Is there a date you could not come before? Leave it blank if anything sooner
            would do.
          </Text>
          <TextInput
            style={styles.joinInput}
            value={earliest}
            onChangeText={setEarliest}
            placeholder="YYYY-MM-DD (optional)"
            placeholderTextColor="#94a3b8"
            maxLength={10}
            autoCapitalize="none"
          />
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => { setJoining(null); setEarliest(''); }}
              disabled={busy}
            >
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => join(a.id)} disabled={busy}>
              <Text style={styles.primaryBtnText}>Put me on the list</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.joinBtn}
          onPress={() => { setJoining(a.id); setEarliest(''); }}
          disabled={busy}
        >
          <Text style={styles.joinBtnText}>Let me know if something earlier comes free</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderBody = () => {
    if (!data) return null;

    const {
      enabled,
      offers = [],
      entries = [],
      eligible = [],
      terms = [],
      min_lead_hours: minLead
    } = data;

    if (!enabled) {
      return (
        <View style={styles.infoCard}>
          <View style={styles.rowIcon}>
            <InfoCircleIcon color="#64748b" size={15} />
            <Text style={styles.infoTitle}>  Not available here</Text>
          </View>
          <Text style={styles.infoText}>
            This clinic is not offering earlier appointments through My Chart at the moment.
            Telephone the desk if you would like to come in sooner.
          </Text>
        </View>
      );
    }

    return (
      <>
        {offers.map(renderOffer)}

        {entries.length > 0 ? (
          <>
            <Text style={styles.sectionHead}>On the list</Text>
            {entries.map(renderEntry)}
          </>
        ) : null}

        {eligible.length > 0 ? (
          <>
            <Text style={styles.sectionHead}>
              {entries.length > 0 ? 'Your other appointments' : 'Your appointments'}
            </Text>
            {eligible.map(renderJoinable)}
          </>
        ) : null}

        {offers.length === 0 && entries.length === 0 && eligible.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nothing to offer yet</Text>
            <Text style={styles.emptyText}>
              This is where you would ask to be told if an earlier appointment comes free.
              It needs an appointment already booked, so there is nothing to put on the list
              just now.
            </Text>
          </View>
        ) : null}

        {entries.length > 0 || eligible.length > 0 ? (
          <View style={styles.termsCard}>
            <Text style={styles.termsHead}>What this does</Text>
            {terms.map((t, i) => (
              <Text key={`tm-${i}`} style={styles.termsLine}>• {t}</Text>
            ))}
            <Text style={styles.termsFoot}>
              We will not offer you anything less than {minLead} hours away — there would not
              be time to get here.
            </Text>
          </View>
        ) : null}
      </>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.iconCircle}>
              <ClockIcon color="#2563eb" size={18} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.headerTitle}>An earlier appointment</Text>
              <Text style={styles.headerSubtitle}>If something comes free, we will ask you</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <CloseIcon color="#64748b" size={18} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.loadingText}>Loading…</Text>
            </View>
          ) : (
            <>
              {moved ? renderMoved() : null}
              {nearMiss ? renderNearMiss() : null}
              {error ? (
                <View style={styles.errorCard}>
                  <View style={styles.rowIcon}>
                    <AlertTriangleIcon color="#991b1b" size={14} />
                    <Text style={styles.errorText}>  {error}</Text>
                  </View>
                </View>
              ) : null}
              {renderBody()}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/** "2 hours 10 minutes" rather than "130 minutes", which nobody reads as a time. */
function formatLeft(minutes) {
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return rest === 0
    ? `${hours} ${hours === 1 ? 'hour' : 'hours'}`
    : `${hours}h ${rest}m`;
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

  body: { flex: 1 },
  rowIcon: { flexDirection: 'row', alignItems: 'center' },

  loadingBox: { alignItems: 'center', paddingVertical: 50 },
  loadingText: { marginTop: 10, fontSize: 13, color: '#64748b' },

  errorCard: {
    backgroundColor: '#fef2f2', borderRadius: 12, borderWidth: 1, borderColor: '#fecaca',
    padding: 14, marginBottom: 14
  },
  errorText: { fontSize: 13, color: '#991b1b', lineHeight: 19, flex: 1 },

  sectionHead: {
    fontSize: 11.5, fontWeight: '800', color: '#64748b', letterSpacing: 0.4,
    textTransform: 'uppercase', marginTop: 8, marginBottom: 8
  },

  // ---- a live offer ----
  offerCard: {
    backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1.5, borderColor: '#bfdbfe',
    padding: 16, marginBottom: 16
  },
  offerCardUrgent: { borderColor: '#fcd34d', backgroundColor: '#fffdf5' },
  offerTopRow: { marginBottom: 8 },
  offerFlag: { fontSize: 11.5, fontWeight: '800', color: '#1d4ed8', letterSpacing: 0.2, textTransform: 'uppercase' },
  offerFlagUrgent: { color: '#b45309' },
  offerWhen: { fontSize: 19, fontWeight: '800', color: '#0f172a', letterSpacing: -0.4 },
  offerDoctor: { fontSize: 13, color: '#475569', marginTop: 2 },
  offerSwap: {
    backgroundColor: '#f1f5f9', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 11,
    marginTop: 12
  },
  offerSwapText: { fontSize: 12.5, color: '#475569', lineHeight: 18 },
  offerSwapStrong: { fontWeight: '800', color: '#0f172a' },
  offerDeadline: { marginTop: 10 },
  offerDeadlineText: { fontSize: 12.5, fontWeight: '700', color: '#1d4ed8' },
  offerDeadlineUrgent: { color: '#b45309' },
  offerCaveat: { fontSize: 11.5, color: '#64748b', lineHeight: 17, marginTop: 8 },
  offerAcceptBtn: { flex: 1.3 },

  btnRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  primaryBtn: {
    flex: 1, backgroundColor: '#15803d', borderRadius: 10, paddingVertical: 12,
    alignItems: 'center'
  },
  primaryBtnText: { color: '#ffffff', fontSize: 13.5, fontWeight: '800' },
  secondaryBtn: {
    flex: 1, backgroundColor: '#ffffff', borderRadius: 10, paddingVertical: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1'
  },
  secondaryBtnText: { color: '#475569', fontSize: 13.5, fontWeight: '700' },

  declineBox: {
    marginTop: 12, backgroundColor: '#f8fafc', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#e2e8f0'
  },
  declineLabel: { fontSize: 12, color: '#475569', lineHeight: 17, marginBottom: 8 },
  declineInput: {
    borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 10,
    paddingVertical: 9, fontSize: 13, color: '#0f172a', backgroundColor: '#ffffff'
  },
  declineBtn: {
    flex: 1, backgroundColor: '#ffffff', borderRadius: 10, paddingVertical: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#fecaca'
  },
  declineBtnText: { color: '#991b1b', fontSize: 13.5, fontWeight: '700' },

  // ---- the near miss ----
  missCard: {
    backgroundColor: '#eff6ff', borderRadius: 14, borderWidth: 1, borderColor: '#bfdbfe',
    padding: 16, marginBottom: 16, alignItems: 'center'
  },
  missIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#dbeafe',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10
  },
  missTitle: { fontSize: 15.5, fontWeight: '800', color: '#1e3a8a' },
  missText: { fontSize: 13, color: '#1e40af', lineHeight: 19, textAlign: 'center', marginTop: 6 },
  missBtn: {
    marginTop: 14, backgroundColor: '#ffffff', borderRadius: 10, paddingVertical: 10,
    paddingHorizontal: 26, borderWidth: 1, borderColor: '#bfdbfe'
  },
  missBtnText: { color: '#1d4ed8', fontSize: 13.5, fontWeight: '800' },

  // ---- moved ----
  movedCard: {
    backgroundColor: '#f0fdf4', borderRadius: 14, borderWidth: 1, borderColor: '#bbf7d0',
    padding: 16, marginBottom: 16, alignItems: 'center'
  },
  movedIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#dcfce7',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10
  },
  movedTitle: { fontSize: 15.5, fontWeight: '800', color: '#14532d' },
  movedText: { fontSize: 13.5, color: '#166534', lineHeight: 20, textAlign: 'center', marginTop: 6, fontWeight: '700' },
  movedSub: { fontSize: 12, color: '#15803d', lineHeight: 18, textAlign: 'center', marginTop: 8 },
  movedBtn: {
    marginTop: 14, backgroundColor: '#15803d', borderRadius: 10, paddingVertical: 10,
    paddingHorizontal: 30
  },
  movedBtnText: { color: '#ffffff', fontSize: 13.5, fontWeight: '800' },

  // ---- my entries ----
  entryCard: {
    backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 14, marginBottom: 10
  },
  entryTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  entryWhen: { fontSize: 14, fontWeight: '800', color: '#0f172a', flex: 1, paddingRight: 8 },
  entryDoctor: { fontSize: 12.5, color: '#475569', marginTop: 2 },
  entryNote: { fontSize: 12.5, color: '#64748b', lineHeight: 18, marginTop: 8 },
  entryMeta: { fontSize: 11.5, color: '#94a3b8', marginTop: 5 },

  chip: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 2 },
  chipWaiting: { backgroundColor: '#dbeafe' },
  chipPaused: { backgroundColor: '#fef3c7' },
  chipText: { fontSize: 10.5, fontWeight: '800' },
  chipTextWaiting: { color: '#1e40af' },
  chipTextPaused: { color: '#92400e' },

  linkBtn: { marginTop: 10, alignSelf: 'flex-start' },
  linkBtnText: { fontSize: 12.5, fontWeight: '700', color: '#2563eb' },

  // ---- joinable ----
  joinCard: {
    backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 14, marginBottom: 10
  },
  joinWhen: { fontSize: 13.5, fontWeight: '800', color: '#0f172a' },
  joinTitle: { fontSize: 12.5, color: '#64748b', marginTop: 3 },
  joinBtn: {
    marginTop: 11, backgroundColor: '#f1f5f9', borderRadius: 10, paddingVertical: 10,
    alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0'
  },
  joinBtnText: { fontSize: 12.5, fontWeight: '800', color: '#1d4ed8' },
  joinBox: {
    marginTop: 11, backgroundColor: '#f8fafc', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#e2e8f0'
  },
  joinLabel: { fontSize: 12, color: '#475569', lineHeight: 17, marginBottom: 8 },
  joinInput: {
    borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 10,
    paddingVertical: 9, fontSize: 13, color: '#0f172a', backgroundColor: '#ffffff'
  },

  // ---- static blocks ----
  infoCard: {
    backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 14, marginBottom: 14
  },
  infoTitle: { fontSize: 13, fontWeight: '800', color: '#334155' },
  infoText: { fontSize: 12.5, color: '#64748b', lineHeight: 19, marginTop: 6 },

  emptyCard: {
    backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 20, alignItems: 'center'
  },
  emptyTitle: { fontSize: 14.5, fontWeight: '800', color: '#334155' },
  emptyText: { fontSize: 12.5, color: '#64748b', lineHeight: 19, textAlign: 'center', marginTop: 6 },

  termsCard: {
    backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 14, marginTop: 14
  },
  termsHead: {
    fontSize: 11.5, fontWeight: '800', color: '#64748b', letterSpacing: 0.4,
    textTransform: 'uppercase', marginBottom: 8
  },
  termsLine: { fontSize: 12, color: '#475569', lineHeight: 18, marginBottom: 4 },
  termsFoot: { fontSize: 11.5, color: '#94a3b8', lineHeight: 17, marginTop: 6 }
});
