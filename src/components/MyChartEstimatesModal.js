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
  ReceiptIcon,
  InfoCircleIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ChevronRightIcon
} from './Icons';
import { myChartApi } from '../api/mychart';

/**
 * What this will cost (Phase M16).
 *
 * Three screens in one sheet: the estimates issued to this patient, the
 * hospital's priced packages, and one estimate opened in full.
 *
 * Money is never formatted here. Every estimate carries the currency it was
 * issued in and a `quoted_display` string built from it, because an estimate
 * from last year must not re-read in this year's currency. Where only a raw
 * amount is available -- the catalogue, which is current by definition -- the
 * `money` block that came with it is used, not a hardcoded symbol.
 *
 * Nothing here computes or adjusts a figure. If a breakdown is absent that is
 * the server's decision: most packages are priced as one bundle and their
 * itemised lists do not sum to the price quoted, so showing one would invite a
 * patient to check arithmetic that does not work. The inclusions and exclusions
 * text is shown in every case, and it is the part that is reliably right.
 */
export default function MyChartEstimatesModal({ visible, onClose }) {
  const [view, setView] = useState('mine');       // mine | catalogue | detail
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);         // mine()
  const [catalogue, setCatalogue] = useState(null);
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);

  // The "ask about this" form, opened from a catalogue row or on its own.
  const [askOpen, setAskOpen] = useState(false);
  const [askPackage, setAskPackage] = useState(null);
  const [askText, setAskText] = useState('');
  const [askNote, setAskNote] = useState('');

  const loadMine = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await myChartApi.getEstimates();
      if (res?.success) setData(res.data);
      else setError(res?.message || 'Could not load your estimates.');
    } catch (e) {
      setError('Could not load your estimates.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCatalogue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await myChartApi.getEstimateCatalogue();
      if (res?.success) setCatalogue(res.data);
      else setError(res?.message || 'Could not load the price list.');
    } catch (e) {
      setError('Could not load the price list.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    setView('mine');
    setDetail(null);
    setAskOpen(false);
    loadMine();
  }, [visible, loadMine]);

  const openDetail = async (estimateId) => {
    setBusy(true);
    try {
      const res = await myChartApi.getEstimate(estimateId);
      if (res?.success) {
        setDetail(res.data);
        setView('detail');
      }
    } finally {
      setBusy(false);
    }
  };

  const goCatalogue = () => {
    setView('catalogue');
    if (!catalogue) loadCatalogue();
  };

  const submitAsk = async () => {
    setBusy(true);
    try {
      const payload = {};
      if (askPackage) payload.package_id = askPackage.package_id;
      if (askText.trim()) payload.asked_about = askText.trim();
      if (askNote.trim()) payload.note = askNote.trim();

      const res = await myChartApi.requestEstimate(payload);

      if (res?.success) {
        setAskOpen(false);
        setAskPackage(null);
        setAskText('');
        setAskNote('');
        setView('mine');
        await loadMine();
      } else {
        setError(res?.message || 'That could not be sent.');
      }
    } catch (e) {
      setError('That could not be sent.');
    } finally {
      setBusy(false);
    }
  };

  const withdrawAsk = async (requestId) => {
    setBusy(true);
    try {
      await myChartApi.withdrawEstimateRequest(requestId);
      await loadMine();
    } finally {
      setBusy(false);
    }
  };

  const moneyOf = (amount, m) => {
    const places = Math.max(0, Math.min(4, Number(m?.decimal_places ?? 2)));
    const n = Number(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: places,
      maximumFractionDigits: places
    });
    const symbol = m?.currency_symbol ?? '$';

    return m?.currency_position === 'suffix' ? `${n}${symbol}` : `${symbol}${n}`;
  };

  const caveatBlock = (caveats) => (
    <View style={styles.caveatCard}>
      <View style={styles.rowIcon}>
        <InfoCircleIcon color="#64748b" size={15} />
        <Text style={styles.caveatTitle}>Worth knowing</Text>
      </View>
      {(caveats || []).map((c, i) => (
        <Text key={`cav-${i}`} style={styles.caveatText}>• {c}</Text>
      ))}
    </View>
  );

  // --------------------------------------------------------------- my estimates
  const renderMine = () => {
    if (!data) return null;

    const { estimates = [], requests = [], allow_requests: allowRequests, blocked_reason: blocked } = data;
    const pending = requests.filter((r) => r.status === 'pending');
    const decided = requests.filter((r) => r.status !== 'pending');

    return (
      <>
        {blocked ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>{blocked}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.browseRow} onPress={goCatalogue} activeOpacity={0.7}>
          <View style={{ flex: 1 }}>
            <Text style={styles.browseTitle}>See what things cost</Text>
            <Text style={styles.browseSub}>Prices for planned treatments and health checks</Text>
          </View>
          <ChevronRightIcon color="#64748b" size={18} />
        </TouchableOpacity>

        {estimates.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No estimates yet</Text>
            <Text style={styles.emptyText}>
              If you have been told you need something and want to know what it will cost,
              you can ask and the billing desk will put it in writing here.
            </Text>
          </View>
        ) : (
          estimates.map((e) => (
            <TouchableOpacity
              key={`est-${e.id}`}
              style={[styles.estCard, e.expired && styles.estCardExpired]}
              onPress={() => openDetail(e.id)}
              activeOpacity={0.7}
            >
              <View style={styles.estTop}>
                <Text style={styles.estTitle} numberOfLines={2}>{e.title}</Text>
                <Text style={styles.estAmount}>{e.quoted_display}</Text>
              </View>
              <Text style={styles.estRef}>{e.estimate_no}</Text>
              <Text style={[styles.estStatus, e.expired && styles.estStatusExpired]}>{e.status_text}</Text>
              {e.valid_until ? (
                <Text style={styles.estMeta}>
                  {e.expired ? 'Was good until ' : 'Good until '}{String(e.valid_until).slice(0, 10)}
                </Text>
              ) : null}
              <View style={styles.openRow}>
                <Text style={styles.openText}>See what is included</Text>
                <ChevronRightIcon color="#2563eb" size={15} />
              </View>
            </TouchableOpacity>
          ))
        )}

        {pending.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>WAITING WITH THE BILLING DESK</Text>
            {pending.map((r) => (
              <View key={`req-${r.id}`} style={styles.reqCard}>
                <Text style={styles.reqAbout}>{r.about}</Text>
                {r.note ? <Text style={styles.reqNote}>“{r.note}”</Text> : null}
                <Text style={styles.reqStatus}>{r.status_text}</Text>
                <TouchableOpacity
                  style={styles.withdrawBtn}
                  onPress={() => withdrawAsk(r.id)}
                  disabled={busy}
                >
                  <Text style={styles.withdrawText}>Take this question back</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {decided.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>ANSWERED</Text>
            {decided.map((r) => (
              <View key={`dreq-${r.id}`} style={styles.reqCardQuiet}>
                <Text style={styles.reqAbout}>{r.about}</Text>
                <Text style={styles.reqStatus}>{r.status_text}</Text>
                {r.review_note ? <Text style={styles.reqReview}>{r.review_note}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {allowRequests && !askOpen ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={() => { setAskPackage(null); setAskOpen(true); }}>
            <Text style={styles.primaryBtnText}>Ask what something will cost</Text>
          </TouchableOpacity>
        ) : null}

        {askOpen ? renderAskForm() : null}

        {estimates.length > 0 ? caveatBlock(estimates[0].caveats || data.caveats) : caveatBlock(data.caveats)}
      </>
    );
  };

  // ------------------------------------------------------------------ ask form
  const renderAskForm = () => (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>
        {askPackage ? `Ask about: ${askPackage.label}` : 'What would you like the cost of?'}
      </Text>

      {!askPackage ? (
        <>
          <Text style={styles.formLabel}>WHAT YOU NEED</Text>
          <TextInput
            style={styles.input}
            value={askText}
            onChangeText={setAskText}
            placeholder="For example: the scope my doctor mentioned"
            placeholderTextColor="#94a3b8"
            maxLength={255}
          />
        </>
      ) : null}

      <Text style={styles.formLabel}>ANYTHING ELSE THEY SHOULD KNOW (OPTIONAL)</Text>
      <TextInput
        style={[styles.input, styles.inputMulti]}
        value={askNote}
        onChangeText={setAskNote}
        placeholder="For example: my surgeon said I might need an extra night."
        placeholderTextColor="#94a3b8"
        maxLength={500}
        multiline
      />

      <Text style={styles.formHint}>
        The billing desk prepares this by hand, so it is not instant. You will get a
        message when it is ready.
      </Text>

      <View style={styles.formRow}>
        <TouchableOpacity
          style={[styles.primaryBtn, styles.formBtn, busy && styles.btnDisabled]}
          onPress={submitAsk}
          disabled={busy || (!askPackage && !askText.trim())}
        >
          <Text style={styles.primaryBtnText}>{busy ? 'Sending…' : 'Send'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryBtn, styles.formBtn]}
          onPress={() => { setAskOpen(false); setAskPackage(null); }}
        >
          <Text style={styles.secondaryBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ----------------------------------------------------------------- catalogue
  const renderCatalogue = () => {
    if (!catalogue) return null;

    const { items = [], money: m, allow_requests: allowRequests, blocked_reason: blocked } = catalogue;

    return (
      <>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            These are bundled prices for planned care. They cover what is listed and nothing
            else — if you need to stay longer, or need tests beyond what is included, those
            are charged on top.
          </Text>
        </View>

        {blocked ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>{blocked}</Text>
          </View>
        ) : null}

        {items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No prices published</Text>
            <Text style={styles.emptyText}>The billing desk can tell you what something costs.</Text>
          </View>
        ) : (
          items.map((p) => (
            <View key={`pkg-${p.package_id}`} style={styles.pkgCard}>
              <Text style={styles.pkgTitle}>{p.label}</Text>
              {p.blurb ? <Text style={styles.pkgBlurb}>{p.blurb}</Text> : null}

              <View style={styles.priceRow}>
                <View style={styles.priceBox}>
                  <Text style={styles.priceLabel}>USUAL PRICE</Text>
                  <Text style={styles.priceValue}>{moneyOf(p.standard_total, m)}</Text>
                </View>
                {Number(p.discounted_total) > 0 && Number(p.discounted_total) !== Number(p.standard_total) ? (
                  <View style={styles.priceBox}>
                    <Text style={styles.priceLabel}>PACKAGE PRICE</Text>
                    <Text style={[styles.priceValue, styles.priceValueAlt]}>{moneyOf(p.discounted_total, m)}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.priceNote}>
                Which price applies depends on your cover and the arrangements for your stay.
                The billing desk will confirm it.
              </Text>

              {p.nights_included > 0 ? (
                <Text style={styles.pkgMeta}>
                  Includes {p.nights_included} night{p.nights_included === 1 ? '' : 's'}
                  {p.room_included ? ` in a ${String(p.room_included).toLowerCase()}` : ''}.
                </Text>
              ) : null}

              {p.includes_text ? (
                <View style={styles.inclCard}>
                  <View style={styles.rowIcon}>
                    <CheckCircleIcon color="#16a34a" size={14} />
                    <Text style={styles.inclTitle}>What it covers</Text>
                  </View>
                  <Text style={styles.inclText}>{p.includes_text}</Text>
                </View>
              ) : null}

              {p.excludes_text ? (
                <View style={styles.exclCard}>
                  <View style={styles.rowIcon}>
                    <AlertTriangleIcon color="#ea580c" size={14} />
                    <Text style={styles.exclTitle}>What it does not cover</Text>
                  </View>
                  <Text style={styles.exclText}>{p.excludes_text}</Text>
                </View>
              ) : null}

              {allowRequests ? (
                <TouchableOpacity
                  style={styles.askRow}
                  onPress={() => {
                    setAskPackage(p);
                    setAskText('');
                    setAskNote('');
                    setAskOpen(true);
                    setView('mine');
                  }}
                >
                  <Text style={styles.askRowText}>Ask for this in writing</Text>
                  <ChevronRightIcon color="#2563eb" size={15} />
                </TouchableOpacity>
              ) : null}
            </View>
          ))
        )}

        {caveatBlock(catalogue.caveats)}
      </>
    );
  };

  // -------------------------------------------------------------------- detail
  const renderDetail = () => {
    if (!detail) return null;

    return (
      <>
        <View style={styles.detailHead}>
          <Text style={styles.detailTitle}>{detail.title}</Text>
          <Text style={styles.detailAmount}>{detail.quoted_display}</Text>
          <Text style={styles.detailRef}>{detail.estimate_no}</Text>
          {detail.tax_amount && Number(detail.tax_amount) > 0 ? (
            <Text style={styles.detailMeta}>Includes {detail.tax_name} of {detail.tax_amount}.</Text>
          ) : null}
        </View>

        <View style={[styles.infoCard, detail.expired && styles.expiredCard]}>
          <Text style={[styles.infoText, detail.expired && styles.expiredText]}>{detail.status_text}</Text>
          {detail.valid_until ? (
            <Text style={styles.infoMeta}>
              {detail.expired ? 'Was good until ' : 'Good until '}{String(detail.valid_until).slice(0, 10)}
              {detail.issued_at ? ` · prepared ${String(detail.issued_at).slice(0, 10)}` : ''}
            </Text>
          ) : null}
        </View>

        {detail.note_to_patient ? (
          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>From the billing desk</Text>
            <Text style={styles.noteText}>{detail.note_to_patient}</Text>
          </View>
        ) : null}

        {detail.breakdown_state === 'reconciled' && (detail.lines || []).length > 0 ? (
          <View style={styles.linesCard}>
            <Text style={styles.sectionLabelTight}>WHAT MAKES UP THIS FIGURE</Text>
            {detail.lines.map((l, i) => (
              <View key={`line-${i}`} style={styles.lineRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lineLabel}>{l.label}</Text>
                  {Number(l.quantity) > 1 ? (
                    <Text style={styles.lineQty}>× {String(l.quantity).replace(/\.00$/, '')}</Text>
                  ) : null}
                  {l.detail ? <Text style={styles.lineQty}>{l.detail}</Text> : null}
                </View>
                <Text style={styles.lineAmount}>{l.line_display}</Text>
              </View>
            ))}
            <View style={styles.lineTotalRow}>
              <Text style={styles.lineTotalLabel}>Total</Text>
              <Text style={styles.lineTotalAmount}>{detail.quoted_display}</Text>
            </View>
          </View>
        ) : detail.breakdown_note ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>{detail.breakdown_note}</Text>
          </View>
        ) : null}

        {detail.includes_text ? (
          <View style={styles.inclCard}>
            <View style={styles.rowIcon}>
              <CheckCircleIcon color="#16a34a" size={14} />
              <Text style={styles.inclTitle}>What it covers</Text>
            </View>
            <Text style={styles.inclText}>{detail.includes_text}</Text>
          </View>
        ) : null}

        {detail.excludes_text ? (
          <View style={styles.exclCard}>
            <View style={styles.rowIcon}>
              <AlertTriangleIcon color="#ea580c" size={14} />
              <Text style={styles.exclTitle}>What it does not cover</Text>
            </View>
            <Text style={styles.exclText}>{detail.excludes_text}</Text>
          </View>
        ) : null}

        <View style={styles.insCard}>
          <Text style={styles.insTitle}>Your insurance</Text>
          <Text style={styles.insText}>{detail.insurance_text}</Text>
        </View>

        {caveatBlock(detail.caveats)}
      </>
    );
  };

  const headerTitle = view === 'catalogue' ? 'What things cost' : view === 'detail' ? 'Your estimate' : 'Costs';
  const headerSub = view === 'catalogue'
    ? 'Prices for planned care'
    : view === 'detail'
      ? 'What we expect this to cost'
      : 'Estimates prepared for you';

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.iconCircle}>
              <ReceiptIcon color="#2563eb" size={18} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.headerTitle}>{headerTitle}</Text>
              <Text style={styles.headerSubtitle}>{headerSub}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={view === 'mine' ? onClose : () => { setView('mine'); setDetail(null); }}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {view === 'mine'
              ? <CloseIcon color="#64748b" size={18} />
              : <Text style={styles.backText}>Back</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.loadingText}>Loading…</Text>
            </View>
          ) : error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.secondaryBtn} onPress={view === 'catalogue' ? loadCatalogue : loadMine}>
                <Text style={styles.secondaryBtnText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : view === 'catalogue' ? renderCatalogue()
            : view === 'detail' ? renderDetail()
            : renderMine()}
        </ScrollView>
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
  backText: { fontSize: 13, fontWeight: '800', color: '#2563eb' },

  body: { flex: 1 },

  loadingBox: { alignItems: 'center', paddingVertical: 50 },
  loadingText: { marginTop: 10, fontSize: 13, color: '#64748b' },

  errorCard: {
    backgroundColor: '#fef2f2', borderRadius: 14, borderWidth: 1, borderColor: '#fecaca',
    padding: 18, alignItems: 'center'
  },
  errorText: { fontSize: 13.5, color: '#991b1b', textAlign: 'center', marginBottom: 12 },

  browseRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#eff6ff', borderRadius: 14, borderWidth: 1, borderColor: '#bfdbfe',
    padding: 15, marginBottom: 14
  },
  browseTitle: { fontSize: 14, fontWeight: '800', color: '#1e40af', letterSpacing: -0.2 },
  browseSub: { fontSize: 11.5, color: '#3b82f6', marginTop: 2 },

  emptyCard: {
    backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 20, marginBottom: 14, alignItems: 'center'
  },
  emptyTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 5, letterSpacing: -0.3 },
  emptyText: { fontSize: 12.5, color: '#64748b', textAlign: 'center', lineHeight: 18.5 },

  estCard: {
    backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 16, marginBottom: 12,
    shadowColor: '#000000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 2, elevation: 1
  },
  estCardExpired: { backgroundColor: '#fafbfc', borderColor: '#e2e8f0' },
  estTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  estTitle: { flex: 1, fontSize: 14.5, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3, paddingRight: 10 },
  estAmount: { fontSize: 17, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  estRef: { fontSize: 11, color: '#94a3b8', marginTop: 3, fontWeight: '700' },
  estStatus: { fontSize: 12.5, color: '#475569', marginTop: 7, lineHeight: 18 },
  estStatusExpired: { color: '#92400e' },
  estMeta: { fontSize: 11.5, color: '#94a3b8', marginTop: 5 },
  openRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  openText: { fontSize: 12.5, fontWeight: '800', color: '#2563eb', marginRight: 3 },

  sectionBlock: { marginTop: 6 },
  sectionLabel: {
    fontSize: 10.5, fontWeight: '800', color: '#64748b',
    letterSpacing: 0.8, marginBottom: 8, marginTop: 8
  },
  sectionLabelTight: {
    fontSize: 10.5, fontWeight: '800', color: '#64748b',
    letterSpacing: 0.8, marginBottom: 10
  },

  reqCard: {
    backgroundColor: '#fffbeb', borderRadius: 12, borderWidth: 1, borderColor: '#fde68a',
    padding: 14, marginBottom: 10
  },
  reqCardQuiet: {
    backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 14, marginBottom: 10
  },
  reqAbout: { fontSize: 13.5, fontWeight: '800', color: '#0f172a', letterSpacing: -0.2 },
  reqNote: { fontSize: 12.5, color: '#475569', marginTop: 4, fontStyle: 'italic' },
  reqStatus: { fontSize: 12, color: '#64748b', marginTop: 5, lineHeight: 17.5 },
  reqReview: { fontSize: 12.5, color: '#334155', marginTop: 6, lineHeight: 18 },
  withdrawBtn: { marginTop: 9, alignSelf: 'flex-start' },
  withdrawText: { fontSize: 12, fontWeight: '800', color: '#b45309' },

  primaryBtn: {
    backgroundColor: '#2563eb', borderRadius: 11, paddingVertical: 12,
    alignItems: 'center', marginTop: 14
  },
  primaryBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 13.5 },
  secondaryBtn: {
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 11, paddingVertical: 12,
    paddingHorizontal: 16, alignItems: 'center', backgroundColor: '#ffffff', marginTop: 14
  },
  secondaryBtnText: { color: '#334155', fontWeight: '800', fontSize: 13 },
  btnDisabled: { opacity: 0.55 },

  formCard: {
    backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 16, marginTop: 14
  },
  formTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3, marginBottom: 4 },
  formLabel: {
    fontSize: 10.5, fontWeight: '800', color: '#64748b',
    letterSpacing: 0.8, marginTop: 11, marginBottom: 5
  },
  input: {
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 11,
    paddingVertical: 11, paddingHorizontal: 13, fontSize: 13.5,
    color: '#0f172a', backgroundColor: '#fafbfc'
  },
  inputMulti: { minHeight: 70, textAlignVertical: 'top' },
  formHint: { fontSize: 11.5, color: '#64748b', marginTop: 10, lineHeight: 17 },
  formRow: { flexDirection: 'row', gap: 10 },
  formBtn: { flex: 1 },

  pkgCard: {
    backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 16, marginBottom: 14
  },
  pkgTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 },
  pkgBlurb: { fontSize: 12.5, color: '#475569', marginTop: 5, lineHeight: 18.5 },
  pkgMeta: { fontSize: 12, color: '#64748b', marginTop: 9 },

  priceRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  priceBox: {
    flex: 1, backgroundColor: '#fafbfc', borderRadius: 11, borderWidth: 1,
    borderColor: '#e2e8f0', padding: 11
  },
  priceLabel: { fontSize: 9.5, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.6 },
  priceValue: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginTop: 3, letterSpacing: -0.4 },
  priceValueAlt: { color: '#15803d' },
  priceNote: { fontSize: 11, color: '#94a3b8', marginTop: 7, lineHeight: 16 },

  inclCard: {
    backgroundColor: '#f0fdf4', borderRadius: 12, borderWidth: 1, borderColor: '#bbf7d0',
    padding: 13, marginTop: 11
  },
  inclTitle: { fontSize: 11.5, fontWeight: '800', color: '#166534', marginLeft: 5, letterSpacing: 0.3 },
  inclText: { fontSize: 12.5, color: '#14532d', lineHeight: 18.5, marginTop: 6 },

  exclCard: {
    backgroundColor: '#fff7ed', borderRadius: 12, borderWidth: 1, borderColor: '#fed7aa',
    padding: 13, marginTop: 11
  },
  exclTitle: { fontSize: 11.5, fontWeight: '800', color: '#9a3412', marginLeft: 5, letterSpacing: 0.3 },
  exclText: { fontSize: 12.5, color: '#7c2d12', lineHeight: 18.5, marginTop: 6 },

  askRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  askRowText: { fontSize: 12.5, fontWeight: '800', color: '#2563eb', marginRight: 3 },

  detailHead: {
    backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 18, marginBottom: 14
  },
  detailTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', letterSpacing: -0.4, lineHeight: 22 },
  detailAmount: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginTop: 8, letterSpacing: -1 },
  detailRef: { fontSize: 11.5, color: '#94a3b8', marginTop: 4, fontWeight: '700' },
  detailMeta: { fontSize: 11.5, color: '#64748b', marginTop: 6 },

  infoCard: {
    backgroundColor: '#eff6ff', borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe',
    padding: 13, marginBottom: 14
  },
  infoText: { fontSize: 12.5, color: '#1e40af', lineHeight: 18.5 },
  infoMeta: { fontSize: 11.5, color: '#3b82f6', marginTop: 5 },
  expiredCard: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  expiredText: { color: '#92400e' },

  noteCard: {
    backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 14, marginBottom: 14
  },
  noteTitle: { fontSize: 10.5, fontWeight: '800', color: '#64748b', letterSpacing: 0.8 },
  noteText: { fontSize: 13, color: '#334155', lineHeight: 19, marginTop: 6 },

  linesCard: {
    backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 16, marginBottom: 14
  },
  lineRow: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
  },
  lineLabel: { fontSize: 13, color: '#0f172a', fontWeight: '600' },
  lineQty: { fontSize: 11.5, color: '#94a3b8', marginTop: 2 },
  lineAmount: { fontSize: 13, color: '#0f172a', fontWeight: '800', marginLeft: 10 },
  lineTotalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 11, marginTop: 3
  },
  lineTotalLabel: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  lineTotalAmount: { fontSize: 15.5, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 },

  insCard: {
    backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 14, marginBottom: 14
  },
  insTitle: { fontSize: 10.5, fontWeight: '800', color: '#64748b', letterSpacing: 0.8 },
  insText: { fontSize: 12.5, color: '#334155', lineHeight: 18.5, marginTop: 6 },

  caveatCard: {
    backgroundColor: '#f1f5f9', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 15, marginTop: 4
  },
  rowIcon: { flexDirection: 'row', alignItems: 'center' },
  caveatTitle: { fontSize: 11.5, fontWeight: '800', color: '#475569', marginLeft: 6, letterSpacing: 0.4 },
  caveatText: { fontSize: 12, color: '#64748b', lineHeight: 18, marginTop: 7 }
});
