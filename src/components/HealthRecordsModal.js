import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { HealthRecordsService } from '../api/healthRecords';
import { MyChartService } from '../api/mychart';
import { RecordsIcon, HelpCircleIcon, InfoCircleIcon, AlertTriangleIcon, CheckCircleIcon } from '../components/Icons';
import DiagnosisGuideModal from './DiagnosisGuideModal';
import { getFallbackGuides } from '../utils/diagnosisDictionary';

// The six clinical lists come from /mychart/chart (Phase M19), which applies the
// verification gate. The other three stay on the shared CCD summary, which M19
// does not cover.
const CHART_TABS = {
  allergies: 'allergies',
  problems: 'conditions',
  medications: 'medications',
  procedures: 'procedures',
  devices: 'devices',
  immunizations: 'immunizations'
};

const TABS = [
  { id: 'summary', label: 'Summary' },
  { id: 'allergies', label: 'Allergies' },
  { id: 'problems', label: 'Conditions' },
  { id: 'medications', label: 'Medications' },
  { id: 'procedures', label: 'Operations' },
  { id: 'devices', label: 'Implants' },
  { id: 'immunizations', label: 'Vaccines' },
  { id: 'results', label: 'Lab Results' },
  { id: 'encounters', label: 'Visits' },
  { id: 'demographics', label: 'Demographics' }
];

export default function HealthRecordsModal({ visible, onClose, initialTab = 'summary' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Guides for the conditions on the problem list. /health-summary is a shared CCD
  // endpoint that staff read too, so it is left alone and the guides are fetched
  // separately -- one request, the first time the Conditions tab is opened.
  const [guides, setGuides] = useState({});
  const [openGuide, setOpenGuide] = useState(null);

  // Phase M19. The six clinical lists come from here rather than from the CCD
  // summary, because this endpoint applies the verification gate: /health-summary
  // hands back rows whose status is `Refuted` (a clinician decided the patient
  // does NOT have this) or `Entered in Error`, and this screen used to render
  // them as facts.
  const [chart, setChart] = useState(null);
  const [correcting, setCorrecting] = useState(null);   // { section, item }
  const [says, setSays] = useState('');
  const [asks, setAsks] = useState('correct');
  const [busy, setBusy] = useState(false);
  const [saidThanks, setSaidThanks] = useState(null);

  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
      loadHealthSummary();
    } else {
      setGuides({});
      setOpenGuide(null);
      setCorrecting(null);
      setSaidThanks(null);
    }
  }, [visible, initialTab]);

  const loadChart = async () => {
    try {
      const res = await MyChartService.getChart();
      setChart(res?.success ? res.data : null);
    } catch (e) {
      // The CCD tabs still work without it; the clinical lists say so.
      setChart(null);
    }
  };

  const loadHealthSummary = async () => {
    setLoading(true);
    loadChart();
    try {
      const res = await HealthRecordsService.getHealthSummary();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setData(null);
      }
    } catch (e) {
      console.error('Failed to load health summary:', e);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetched once per opening, when the patient first looks at Conditions.
  useEffect(() => {
    if (!visible || activeTab !== 'problems') return;
    if (Object.keys(guides).length > 0) return;

    // Driven by the gated conditions list, not by the CCD summary: a refuted
    // condition is not shown, so it should not be fetching a guide either, and
    // the titles have to be the ones the list actually renders for
    // guideForProblem() to match them.
    const items = ((chart?.sections || []).find((x) => x.code === 'conditions')?.items || [])
      .map((p) => ({ code: '', text: p.title || '' }))
      .filter((i) => i.text !== '');

    if (items.length === 0) return;

    MyChartService.getDiagnosisGuides(items)
      .then((res) => {
        if (res?.success && res.data?.guides) setGuides(res.data.guides);
      })
      .catch((err) => {
        // A guide is an extra, never the record itself: the conditions list still
        // shows without it. The offline set is used only here, on a failed request
        // -- never when the server answered and had no guide, because that answer
        // is the hospital's decision. See src/utils/diagnosisDictionary.js.
        console.warn('Could not load diagnosis guides, falling back offline:', err);
        setGuides(getFallbackGuides(items));
      });
  }, [visible, activeTab, chart]);

  // ------------------------------------------------------------------
  // Phase M19: one renderer for all six clinical lists.
  //
  // Everything it shows comes from the server already filtered and already
  // worded. Nothing here decides what a patient may see -- that is the point.
  // ------------------------------------------------------------------
  const chartSection = (code) =>
    (chart?.sections || []).find((x) => x.code === code) || null;

  const sendCorrection = async () => {
    if (!correcting || !says.trim()) return;

    setBusy(true);
    try {
      const res = await MyChartService.raiseChartCorrection({
        section: correcting.section,
        item_id: correcting.item.id,
        says: says.trim(),
        asks
      });

      if (res?.success) {
        setCorrecting(null);
        setSays('');
        setAsks('correct');
        setSaidThanks(res.message || 'Thank you. Someone will look at this.');
        await loadChart();
      } else {
        setSaidThanks(res?.message || 'That could not be sent.');
        setCorrecting(null);
      }
    } finally {
      setBusy(false);
    }
  };

  const renderChartSection = (code, extraFor) => {
    const section = chartSection(code);

    if (!chart) {
      return (
        <View style={styles.sectionCard}>
          <Text style={styles.emptyText}>Loading your record…</Text>
        </View>
      );
    }

    if (!chart.enabled || !section) {
      return (
        <View style={styles.sectionCard}>
          <Text style={styles.emptyText}>
            {chart.message || 'This part of your record is not shown here.'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.sectionCard}>
        <Text style={styles.cardHeaderTitle}>{section.label}</Text>
        {section.blurb ? <Text style={styles.sectionBlurb}>{section.blurb}</Text> : null}

        {section.items.length === 0 ? (
          // NOT a tick and not "none". An empty list means nothing was written
          // down, which is a different statement from "you have none" -- and the
          // patient may repeat whichever one we show them to the next clinician
          // who asks.
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>{section.empty_text || 'Nothing has been written down here.'}</Text>
          </View>
        ) : (
          section.items.map((item) => (
            <View key={`${code}-${item.id}`} style={styles.recordItem}>
              <View style={{ flex: 1 }}>
                <View style={styles.itemTopRow}>
                  <Text style={styles.recordTitle}>{item.title}</Text>
                  {item.status === 'unconfirmed' ? (
                    <View style={styles.pillUnconfirmed}>
                      <Text style={styles.pillUnconfirmedText}>Not confirmed</Text>
                    </View>
                  ) : null}
                  {item.active === false ? (
                    <View style={styles.pillEnded}>
                      <Text style={styles.pillEndedText}>Ended</Text>
                    </View>
                  ) : null}
                </View>

                {item.detail ? <Text style={styles.recordDesc}>{item.detail}</Text> : null}
                <Text style={styles.recordDesc}>
                  {item.since || item.when}{item.until ? ` · ${item.until}` : ''}
                </Text>

                {item.status_note ? (
                  <View style={styles.rowIcon}>
                    <InfoCircleIcon color="#92400e" size={12} />
                    <Text style={styles.unconfirmedNote}>  {item.status_note}</Text>
                  </View>
                ) : null}

                {extraFor ? extraFor(item) : null}

                {item.correction ? (
                  <View style={styles.flaggedBox}>
                    <Text style={styles.flaggedText}>
                      You told us about this one. {item.correction.note}
                    </Text>
                  </View>
                ) : item.can_correct ? (
                  <TouchableOpacity
                    style={styles.correctChip}
                    onPress={() => { setCorrecting({ section: code, item }); setSays(''); setAsks('correct'); }}
                    accessibilityRole="button"
                    accessibilityLabel={`Tell us something is wrong with ${item.title}`}
                  >
                    <AlertTriangleIcon color="#b45309" size={12} />
                    <Text style={styles.correctChipText}>This does not look right</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  if (!visible) return null;

  const guideForProblem = (p) => guides[p.title || p.diagnosis || ''] || null;

  const demographics = data?.demographics || {};
  const careProvider = data?.care_provider;
  const prescriptions = data?.prescriptions || [];

  // The snapshot counts come from the GATED chart, not from the CCD summary, so
  // they agree with the lists underneath them. Counting the summary's rows would
  // tally items the lists correctly refuse to show -- "3 allergies" above a list
  // of two is the kind of mismatch a patient notices and cannot explain.
  const countOf = (code) => chartSection(code)?.count ?? 0;
  const results = data?.results || [];
  const encounters = data?.encounters || [];

  return (
    <View style={styles.overlay}>
      <View style={styles.sheetContainer}>
        {/* Header Bar */}
        <View style={styles.sheetHeader}>
          <View style={styles.headerTitleRow}>
            <View style={styles.iconBadge}>
              <RecordsIcon color="#059669" size={18} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Health Records Summary</Text>
              <Text style={styles.headerSub}>Complete Clinical Continuity of Care (CCD)</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Switcher - Horizontal Scroll */}
        <View style={styles.tabBarWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBar}
          >
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={[styles.tabBtnText, activeTab === tab.id && styles.tabBtnTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content Body */}
        {loading ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator color="#059669" size="large" />
            <Text style={styles.loadingText}>Syncing medical records...</Text>
          </View>
        ) : !data ? (
          <View style={styles.emptyArea}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>Unable to Load Records</Text>
            <Text style={styles.emptyDesc}>Could not retrieve medical charts from hospital database.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
            
            {/* ================= TAB 1: SUMMARY ================= */}
            {activeTab === 'summary' && (
              <>
                {/* Patient Profile Card */}
                <View style={styles.profileCard}>
                  <View style={styles.profileAvatar}>
                    <Text style={styles.profileAvatarText}>
                      {(demographics.first_name || 'P')[0]?.toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.profileName}>
                      {[demographics.first_name, demographics.middle_name, demographics.last_name].filter(Boolean).join(' ')}
                    </Text>
                    <Text style={styles.profileMeta}>
                      Chart #{demographics.patient_no || 'N/A'}  •  {demographics.sex || 'Not Specified'}
                    </Text>
                    <Text style={styles.profileMeta}>DOB: {demographics.birthdate || 'N/A'}</Text>
                  </View>
                </View>

                {/* Primary Care Provider */}
                <View style={styles.sectionCard}>
                  <Text style={styles.cardHeaderTitle}>Primary Care Provider</Text>
                  {careProvider ? (
                    <View style={styles.providerBox}>
                      <Text style={styles.providerName}>
                        Dr. {careProvider.first_name} {careProvider.last_name}
                      </Text>
                      <Text style={styles.providerMeta}>
                        {careProvider.specialty || 'General Practitioner'}  •  {careProvider.department_name || 'Hospital Staff'}
                      </Text>
                      {careProvider.npi_number && (
                        <Text style={styles.providerMeta}>NPI: {careProvider.npi_number}</Text>
                      )}
                      {careProvider.phone && (
                        <Text style={styles.providerContact}>Tel: {careProvider.phone}</Text>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.emptyText}>No care provider assigned.</Text>
                  )}
                </View>

                {/* Health Metrics Snapshot Grid */}
                <Text style={styles.sectionTitle}>Medical Snapshot</Text>
                <View style={styles.snapshotGrid}>
                  <TouchableOpacity style={styles.snapshotTile} onPress={() => setActiveTab('allergies')}>
                    <Text style={styles.snapshotNum}>{countOf('allergies')}</Text>
                    <Text style={styles.snapshotLabel}>Allergies</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.snapshotTile} onPress={() => setActiveTab('problems')}>
                    <Text style={styles.snapshotNum}>{countOf('conditions')}</Text>
                    <Text style={styles.snapshotLabel}>Conditions</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.snapshotTile} onPress={() => setActiveTab('medications')}>
                    <Text style={styles.snapshotNum}>{countOf('medications') || prescriptions.length}</Text>
                    <Text style={styles.snapshotLabel}>Medicines</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.snapshotTile} onPress={() => setActiveTab('immunizations')}>
                    <Text style={styles.snapshotNum}>{countOf('immunizations')}</Text>
                    <Text style={styles.snapshotLabel}>Vaccines</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.snapshotGrid, { marginTop: 8 }]}>
                  <TouchableOpacity style={styles.snapshotTile} onPress={() => setActiveTab('results')}>
                    <Text style={styles.snapshotNum}>{results.length}</Text>
                    <Text style={styles.snapshotLabel}>Lab Tests</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.snapshotTile} onPress={() => setActiveTab('encounters')}>
                    <Text style={styles.snapshotNum}>{encounters.length}</Text>
                    <Text style={styles.snapshotLabel}>Visits</Text>
                  </TouchableOpacity>
                  <View style={styles.snapshotTile}>
                    <Text style={styles.snapshotNum}>{demographics.blood_type || '-'}</Text>
                    <Text style={styles.snapshotLabel}>Blood Type</Text>
                  </View>
                  <View style={styles.snapshotTile}>
                    <Text style={styles.snapshotNum}>{demographics.civil_status || 'Single'}</Text>
                    <Text style={styles.snapshotLabel}>Status</Text>
                  </View>
                </View>
              </>
            )}

            {/* ================= TAB 2: ALLERGIES ================= */}
            {activeTab === 'allergies' && renderChartSection('allergies')}

            {activeTab === 'problems' && renderChartSection('conditions', (item) =>
              guideForProblem(item) ? (
                <TouchableOpacity
                  style={styles.guideChip}
                  onPress={() =>
                    setOpenGuide({
                      diagnosis: item.title,
                      // The chart payload deliberately carries no clinical
                      // coding, so guides resolve on the title. M9 falls back
                      // from exact code to keyword, which is this path.
                      code: null,
                      guide: guideForProblem(item)
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Learn about ${guideForProblem(item).title}`}
                >
                  <HelpCircleIcon color="#2563eb" size={13} />
                  <Text style={styles.guideChipText}>What this means, and what to do</Text>
                </TouchableOpacity>
              ) : null
            )}

            {/* ================= TAB 4: MEDICATIONS & PRESCRIPTIONS ================= */}
            {activeTab === 'medications' && (
              <>
                {renderChartSection('medications')}

                <View style={styles.sectionCard}>
                  <Text style={styles.cardHeaderTitle}>Active Prescriptions</Text>
                  {prescriptions.length === 0 ? (
                    <Text style={styles.emptyText}>No Results</Text>
                  ) : (
                    prescriptions.map((rx, idx) => (
                      <View key={rx.id || idx} style={styles.recordItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.recordTitle}>{rx.title || rx.drug_name || 'Rx'}</Text>
                          <Text style={styles.recordDesc}>Dosage: {rx.dosage || '-'}</Text>
                          <Text style={styles.recordDesc}>Duration: {rx.begin_date || '-'} to {rx.end_date || '-'}</Text>
                          <Text style={styles.recordDesc}>Refills: {rx.refills_allowed ? `${rx.refills_remaining ?? rx.refills_allowed} of ${rx.refills_allowed} left` : 'None'}</Text>
                        </View>
                        <View style={[styles.pillAlert, { backgroundColor: '#f5f3ff' }]}>
                          <Text style={[styles.pillAlertText, { color: '#7c3aed' }]}>
                            {rx.prescription_status || 'Active'}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </>
            )}

            {/* ===== Operations and implants: new in M19, not in the CCD summary ===== */}
            {activeTab === 'procedures' && renderChartSection('procedures')}

            {activeTab === 'devices' && renderChartSection('devices')}

            {/* ================= TAB 5: VACCINATIONS ================= */}
            {activeTab === 'immunizations' && renderChartSection('immunizations')}

            {/* ================= TAB 6: LAB RESULTS ================= */}
            {activeTab === 'results' && (
              <View style={styles.sectionCard}>
                <Text style={styles.cardHeaderTitle}>Diagnostic &amp; Lab Results</Text>
                {results.length === 0 ? (
                  <Text style={styles.emptyText}>No Results</Text>
                ) : (
                  results.map((r, idx) => {
                    const isAbnormal = Number(r.is_abnormal) === 1;
                    return (
                      <View key={r.id || idx} style={styles.recordItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.recordTitle}>{r.name || r.test_name || 'Lab Test'}</Text>
                          <Text style={styles.recordDesc}>Result: {[r.value, r.units].filter(Boolean).join(' ') || '-'}</Text>
                          {r.reference_range && <Text style={styles.recordDesc}>Ref Range: {r.reference_range}</Text>}
                          {r.result_date && <Text style={styles.recordDesc}>Date: {r.result_date}</Text>}
                        </View>
                        <View style={[styles.pillAlert, isAbnormal && { backgroundColor: '#fef2f2' }]}>
                          <Text style={[styles.pillAlertText, isAbnormal && { color: '#dc2626' }]}>
                            {r.flag === 'critical' ? '⚠ Critical' : isAbnormal ? 'Abnormal' : (r.status || 'Verified')}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* ================= TAB 7: ENCOUNTERS / VISITS ================= */}
            {activeTab === 'encounters' && (
              <View style={styles.sectionCard}>
                <Text style={styles.cardHeaderTitle}>Clinical Encounters &amp; Appointments</Text>
                {encounters.length === 0 ? (
                  <Text style={styles.emptyText}>No encounters recorded.</Text>
                ) : (
                  encounters.map((enc, idx) => (
                    <View key={enc.id || idx} style={styles.recordItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.recordTitle}>
                          {enc.appointment_date}  •  {enc.appointment_time?.slice(0, 5) || ''}
                        </Text>
                        <Text style={styles.recordDesc}>
                          Provider: {enc.provider_first_name} {enc.provider_last_name}
                        </Text>
                        <Text style={styles.recordDesc}>Reason: {enc.reason || enc.title || '-'}</Text>
                      </View>
                      <View style={styles.pillAlert}>
                        <Text style={styles.pillAlertText}>{enc.status || 'Completed'}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* ================= TAB 8: DEMOGRAPHICS & CONTACT ================= */}
            {activeTab === 'demographics' && (
              <>
                <View style={styles.sectionCard}>
                  <Text style={styles.cardHeaderTitle}>About &amp; Identity</Text>
                  <View style={styles.infoRow}><Text style={styles.infoKey}>Full Name</Text><Text style={styles.infoVal}>{[demographics.first_name, demographics.middle_name, demographics.last_name, demographics.suffix].filter(Boolean).join(' ') || '-'}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoKey}>Patient ID</Text><Text style={styles.infoVal}>{demographics.patient_no || '-'}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoKey}>Sex</Text><Text style={styles.infoVal}>{demographics.sex || '-'}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoKey}>Birthdate</Text><Text style={styles.infoVal}>{demographics.birthdate || '-'}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoKey}>Civil Status</Text><Text style={styles.infoVal}>{demographics.civil_status || '-'}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoKey}>Blood Type</Text><Text style={styles.infoVal}>{demographics.blood_type || '-'}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoKey}>Height</Text><Text style={styles.infoVal}>{demographics.height ? `${demographics.height} cm` : '-'}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoKey}>Weight</Text><Text style={styles.infoVal}>{demographics.weight ? `${demographics.weight} kg` : '-'}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoKey}>Language</Text><Text style={styles.infoVal}>{demographics.language || '-'}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoKey}>Ethnicity</Text><Text style={styles.infoVal}>{demographics.ethnicity || '-'}</Text></View>
                </View>

                <View style={styles.sectionCard}>
                  <Text style={styles.cardHeaderTitle}>Contact Information</Text>
                  <View style={styles.infoRow}><Text style={styles.infoKey}>Address</Text><Text style={styles.infoVal}>{[demographics.address_line, demographics.city, demographics.province, demographics.zip_code].filter(Boolean).join(', ') || '-'}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoKey}>Mobile Phone</Text><Text style={styles.infoVal}>{demographics.mobile_phone || '-'}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoKey}>Home Phone</Text><Text style={styles.infoVal}>{demographics.home_phone || '-'}</Text></View>
                  <View style={styles.infoRow}><Text style={styles.infoKey}>Email</Text><Text style={styles.infoVal}>{demographics.email || '-'}</Text></View>
                </View>
              </>
            )}

          </ScrollView>
        )}
      </View>

      <DiagnosisGuideModal
        visible={!!openGuide}
        onClose={() => setOpenGuide(null)}
        diagnosis={openGuide?.diagnosis}
        code={openGuide?.code}
        guide={openGuide?.guide}
      />

      {/* Phase M19. Saying something is wrong is NOT an edit -- the patient
          never writes to their own clinical record. It raises a request a
          clinician answers either way, which the wording here says plainly so
          nobody leaves expecting the list to have changed. */}
      {correcting ? (
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{correcting.item.title}</Text>
            <Text style={styles.sheetSub}>Tell us what is wrong with this.</Text>

            <View style={styles.sheetNote}>
              <Text style={styles.sheetNoteText}>
                This does not change your record by itself. Someone will read it and decide,
                and you will hear back either way.
              </Text>
            </View>

            <Text style={styles.sheetLabel}>What would you like to happen?</Text>
            <View style={styles.askRow}>
              {[
                { id: 'remove', label: 'Take it off' },
                { id: 'correct', label: 'It is wrong' },
                { id: 'add_detail', label: 'Add something' },
                { id: 'unsure', label: 'Not sure' }
              ].map((o) => (
                <TouchableOpacity
                  key={o.id}
                  style={[styles.askChip, asks === o.id && styles.askChipOn]}
                  onPress={() => setAsks(o.id)}
                  accessibilityRole="button"
                >
                  <Text style={[styles.askChipText, asks === o.id && styles.askChipTextOn]}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sheetLabel}>In your own words</Text>
            <TextInput
              style={styles.sheetInput}
              value={says}
              onChangeText={setSays}
              placeholder="e.g. I have never reacted to this"
              placeholderTextColor="#94a3b8"
              multiline
              maxLength={2000}
            />

            <View style={styles.sheetButtons}>
              <TouchableOpacity
                style={styles.sheetCancel}
                onPress={() => { setCorrecting(null); setSays(''); }}
                disabled={busy}
              >
                <Text style={styles.sheetCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sheetSend, (!says.trim() || busy) && styles.sheetSendOff]}
                onPress={sendCorrection}
                disabled={!says.trim() || busy}
              >
                <Text style={styles.sheetSendText}>{busy ? 'Sending…' : 'Send'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}

      {saidThanks ? (
        <View style={styles.sheetOverlay}>
          <View style={styles.thanksSheet}>
            <CheckCircleIcon color="#15803d" size={30} />
            <Text style={styles.thanksText}>{saidThanks}</Text>
            <TouchableOpacity style={styles.sheetSend} onPress={() => setSaidThanks(null)}>
              <Text style={styles.sheetSendText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // ---- Phase M19: the chart, and saying something in it is wrong ----
  sectionBlurb: { fontSize: 12, color: '#64748b', lineHeight: 18, marginBottom: 10, marginTop: -2 },
  itemTopRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  rowIcon: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 5 },

  // Deliberately plain. An empty list is not good news and must not be styled
  // as though it were -- this replaced a green tick reading "No known allergies
  // on record (NKDA)", which asserted a clinical finding the record never made.
  emptyCard: {
    backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 12, marginTop: 4
  },
  emptyCardText: { fontSize: 12.5, color: '#475569', lineHeight: 18 },

  pillUnconfirmed: { backgroundColor: '#fef3c7', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 1 },
  pillUnconfirmedText: { fontSize: 10, fontWeight: '800', color: '#92400e' },
  pillEnded: { backgroundColor: '#e2e8f0', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 1 },
  pillEndedText: { fontSize: 10, fontWeight: '800', color: '#475569' },
  unconfirmedNote: { fontSize: 11.5, color: '#92400e', lineHeight: 16, flex: 1 },

  correctChip: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: 8,
    backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5
  },
  correctChipText: { fontSize: 11.5, fontWeight: '700', color: '#b45309', marginLeft: 5 },

  flaggedBox: {
    marginTop: 8, backgroundColor: '#eff6ff', borderRadius: 8, borderWidth: 1,
    borderColor: '#bfdbfe', padding: 9
  },
  flaggedText: { fontSize: 11.5, color: '#1e40af', lineHeight: 17 },

  sheetOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15,23,42,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20
  },
  sheet: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 18, width: '100%', maxWidth: 420
  },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  sheetSub: { fontSize: 12.5, color: '#64748b', marginTop: 2 },
  sheetNote: {
    backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 11, marginTop: 12
  },
  sheetNoteText: { fontSize: 12, color: '#475569', lineHeight: 18 },
  sheetLabel: { fontSize: 11.5, fontWeight: '800', color: '#64748b', marginTop: 14, marginBottom: 6 },
  askRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  askChip: {
    borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6
  },
  askChipOn: { borderColor: '#15803d', backgroundColor: '#f0fdf4' },
  askChipText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  askChipTextOn: { color: '#15803d' },
  sheetInput: {
    borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 10, minHeight: 78,
    fontSize: 13, color: '#0f172a', textAlignVertical: 'top'
  },
  sheetButtons: { flexDirection: 'row', gap: 8, marginTop: 16 },
  sheetCancel: {
    flex: 1, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingVertical: 12, alignItems: 'center'
  },
  sheetCancelText: { fontSize: 13.5, fontWeight: '700', color: '#475569' },
  sheetSend: {
    flex: 1, backgroundColor: '#15803d', borderRadius: 10, paddingVertical: 12, alignItems: 'center'
  },
  sheetSendOff: { opacity: 0.5 },
  sheetSendText: { fontSize: 13.5, fontWeight: '800', color: '#ffffff' },
  thanksSheet: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 22, width: '100%', maxWidth: 380, alignItems: 'center'
  },
  thanksText: { fontSize: 13.5, color: '#334155', lineHeight: 20, textAlign: 'center', marginTop: 10, marginBottom: 16 },

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    zIndex: 999,
    justifyContent: 'flex-end'
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '88%',
    width: '100%',
    paddingTop: 16
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#ecfdf5',
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
    fontSize: 11,
    color: '#64748b'
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
    height: 48
  },
  tabBar: {
    paddingHorizontal: 12,
    alignItems: 'center',
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
    color: '#059669',
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
  emptyArea: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8
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
    textAlign: 'center'
  },
  contentScroll: {
    padding: 16,
    paddingBottom: 40
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center'
  },
  profileAvatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800'
  },
  profileName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2
  },
  profileMeta: {
    fontSize: 11.5,
    color: '#64748b'
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14
  },
  cardHeaderTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10
  },
  providerBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8
  },
  providerName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2
  },
  providerMeta: {
    fontSize: 11.5,
    color: '#64748b',
    marginBottom: 2
  },
  providerContact: {
    fontSize: 11,
    color: '#059669',
    marginTop: 4,
    fontWeight: '600'
  },
  emptyText: {
    fontSize: 12.5,
    color: '#94a3b8',
    fontStyle: 'italic',
    paddingVertical: 8
  },
  snapshotGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  snapshotTile: {
    width: '23%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center'
  },
  snapshotNum: {
    fontSize: 17,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 2
  },
  snapshotLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600'
  },
  cleanBadge: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 8,
    padding: 10
  },
  cleanBadgeText: {
    color: '#059669',
    fontSize: 12.5,
    fontWeight: '700'
  },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  recordTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a'
  },
  recordDesc: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2
  },
  guideChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginTop: 7
  },
  guideChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1d4ed8',
    marginLeft: 5
  },
  pillAlert: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999
  },
  pillAlertText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748b'
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  infoKey: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600'
  },
  infoVal: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
    maxWidth: '65%',
    textAlign: 'right'
  }
});
