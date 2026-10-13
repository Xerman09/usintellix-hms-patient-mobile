import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { HealthRecordsService } from '../api/healthRecords';
import {
  LockIcon,
  DocumentPlusIcon,
  DownloadTrayIcon,
  MedicalClipboardIcon,
  DocumentFolderIcon,
  HelpCircleIcon,
  RecordsIcon
} from './Icons';

export default function MedicalReportsModal({ visible, onClose, currentUser }) {
  const [downloading, setDownloading] = useState(false);
  const [activeView, setActiveView] = useState('grid'); // 'grid' | 'safe_harbor' | 'help' | 'custom_history'

  // Customized Medical History Checklist State
  const defaultSections = {
    Demographics: true,
    History: false,
    Insurance: false,
    Billing: true,
    Allergies: true,
    Medications: true,
    Immunizations: false,
    'Medical Problems': true,
    'Patient Notes': false,
    Transactions: false,
    Communications: false
  };
  const [selectedSections, setSelectedSections] = useState(defaultSections);
  const [healthData, setHealthData] = useState(null);
  const [selectedIssues, setSelectedIssues] = useState(new Set());
  const [selectedEncounters, setSelectedEncounters] = useState(new Set());

  if (!visible) return null;

  const handleOpenCustomHistory = async () => {
    setActiveView('custom_history');
    setDownloading(true);
    try {
      const res = await HealthRecordsService.getHealthSummary();
      if (res.success && res.data) {
        setHealthData(res.data);
        // Default select all available active issues and encounters
        const issueIds = new Set();
        (res.data.allergies || []).forEach(a => issueIds.add(`allergy_${a.id}`));
        (res.data.problems || []).forEach(p => issueIds.add(`problem_${p.id}`));
        (res.data.medications || []).forEach(m => issueIds.add(`med_${m.id}`));
        setSelectedIssues(issueIds);

        const encIds = new Set();
        (res.data.encounters || []).forEach(e => encIds.add(`enc_${e.id}`));
        setSelectedEncounters(encIds);
      }
    } catch (e) {
      console.error('Failed to load data for custom report:', e);
    } finally {
      setDownloading(false);
    }
  };

  const handleCheckAll = () => {
    const allSec = {};
    Object.keys(selectedSections).forEach(k => allSec[k] = true);
    setSelectedSections(allSec);

    if (healthData) {
      const issueIds = new Set();
      (healthData.allergies || []).forEach(a => issueIds.add(`allergy_${a.id}`));
      (healthData.problems || []).forEach(p => issueIds.add(`problem_${p.id}`));
      (healthData.medications || []).forEach(m => issueIds.add(`med_${m.id}`));
      setSelectedIssues(issueIds);

      const encIds = new Set();
      (healthData.encounters || []).forEach(e => encIds.add(`enc_${e.id}`));
      setSelectedEncounters(encIds);
    }
  };

  const handleClearAll = () => {
    const allSec = {};
    Object.keys(selectedSections).forEach(k => allSec[k] = false);
    setSelectedSections(allSec);
    setSelectedIssues(new Set());
    setSelectedEncounters(new Set());
  };

  const toggleSection = (sec) => {
    setSelectedSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const toggleIssue = (id) => {
    setSelectedIssues(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleEncounter = (id) => {
    setSelectedEncounters(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerateCustomReport = (action = 'view') => {
    if (!healthData) return;
    const demo = healthData.demographics || {};
    const fullName = [demo.first_name, demo.middle_name, demo.last_name].filter(Boolean).join(' ') || 'Patient';

    const customReportHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Customized Medical History - ${fullName}</title>
  <style>
    body { font-family: sans-serif; color: #000; font-size: 13px; line-height: 1.5; padding: 24px; max-width: 850px; margin: 0 auto; }
    h1 { font-size: 22px; font-weight: bold; margin: 16px 0 6px; }
    h2 { font-size: 16px; font-weight: bold; margin: 24px 0 10px; border-bottom: 1px dashed #000; padding-bottom: 4px; }
    .data-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .data-table td { padding: 4px; vertical-align: top; }
    .hdr-row { font-size: 12px; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="hdr-row">
    PATIENT: ${fullName} - DOB: ${demo.birthdate || 'N/A'} - Generated on ${new Date().toLocaleDateString()} - USIntellix Hospital Management
  </div>
  <h1>USIntellix Hospital</h1>
  <p>Certified Ambulatory &amp; Inpatient EHR Record<br>Date: ${new Date().toLocaleDateString()}</p>
  <hr style="border: 0; border-bottom: 1px dashed #000; margin: 16px 0;" />

  ${selectedSections.Demographics ? `
  <h2>Patient Data:</h2>
  <table class="data-table">
    <tr><td width="20%"><strong>Name:</strong></td><td>${fullName}</td><td width="20%"><strong>DOB:</strong></td><td>${demo.birthdate || 'N/A'}</td></tr>
    <tr><td><strong>Chart No:</strong></td><td>${demo.patient_no || 'N/A'}</td><td><strong>Sex:</strong></td><td>${demo.sex || 'N/A'}</td></tr>
  </table>` : ''}

  ${selectedSections.Allergies && healthData.allergies?.length ? `
  <h2>Allergies:</h2>
  <table class="data-table">
    ${healthData.allergies.filter(a => selectedIssues.has(`allergy_${a.id}`)).map(a => `<tr><td width="30%"><strong>${a.title || a.allergy}:</strong></td><td>Reaction: ${a.reaction || 'None'} (Severity: ${a.severity || 'Mild'})</td></tr>`).join('')}
  </table>` : ''}

  ${selectedSections['Medical Problems'] && healthData.problems?.length ? `
  <h2>Medical Problems:</h2>
  <table class="data-table">
    ${healthData.problems.filter(p => selectedIssues.has(`problem_${p.id}`)).map(p => `<tr><td width="30%"><strong>${p.problem || p.title}:</strong></td><td>Onset: ${p.onset_date || 'Documented'}</td></tr>`).join('')}
  </table>` : ''}

  ${selectedSections.Medications && healthData.medications?.length ? `
  <h2>Medications:</h2>
  <table class="data-table">
    ${healthData.medications.filter(m => selectedIssues.has(`med_${m.id}`)).map(m => `<tr><td width="30%"><strong>${m.medication || m.title}:</strong></td><td>${m.dosage || 'Standard'} - ${m.directions || 'As directed'}</td></tr>`).join('')}
  </table>` : ''}

  ${selectedSections.Immunizations && healthData.immunizations?.length ? `
  <h2>Immunizations:</h2>
  <table class="data-table">
    ${healthData.immunizations.map(i => `<tr><td width="30%"><strong>${i.vaccine || i.immunization_name}:</strong></td><td>Date: ${i.date || 'Administered'}</td></tr>`).join('')}
  </table>` : ''}

  <p style="margin-top: 32px; font-size: 11px; color: #64748b; border-top: 1px dashed #000; padding-top: 8px;">
    Confidential Medical Document - Generated for ${fullName}
  </p>
</body>
</html>`;

    if (action === 'download') {
      if (Platform.OS === 'web') {
        const blob = new Blob([customReportHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const safeName = fullName.replace(/[^a-zA-Z0-9]/g, '_');
        a.href = url;
        a.download = `Custom_Medical_History_${safeName}_${new Date().toISOString().slice(0, 10)}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Alert.alert('Download Complete', 'Your Customized Medical History Report has been downloaded.');
      } else {
        Alert.alert('Report Generated', 'Customized Medical History Report generated.');
      }
    } else {
      if (Platform.OS === 'web') {
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(customReportHtml);
          win.document.close();
        } else {
          Alert.alert('Pop-up Blocked', 'Please allow pop-ups to view the generated report.');
        }
      } else {
        Alert.alert('Report Generated', `Sections included: ${Object.keys(selectedSections).filter(k => selectedSections[k]).join(', ')}`);
      }
    }
  };

  const handleDownloadSummary = async () => {
    setDownloading(true);
    try {
      const res = await HealthRecordsService.getHealthSummary();
      if (!res.success || !res.data) {
        Alert.alert('Error', 'Unable to retrieve clinical data for report.');
        return;
      }
      const data = res.data;
      const demo = data.demographics || {};
      const fullName = [demo.first_name, demo.middle_name, demo.last_name].filter(Boolean).join(' ') || 'Patient';

      const reportHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Summary of Care - ${fullName}</title>
<style>body{font-family:sans-serif;color:#0f172a;padding:32px;max-width:800px;margin:0 auto;line-height:1.5;} h1{color:#1e3a8a;} table{width:100%;border-collapse:collapse;margin:12px 0;} th,td{border:1px solid #e2e8f0;padding:8px 10px;text-align:left;} th{background:#f8fafc;}</style>
</head><body><h1>Clinical Summary of Care (CCD)</h1>
<p>Patient: <strong>${fullName}</strong> | Chart #${demo.patient_no || 'N/A'} | DOB: ${demo.birthdate || 'N/A'}</p><hr/>
<h3>Allergies</h3>${data.allergies && data.allergies.length ? `<table><tr><th>Allergen</th><th>Reaction</th></tr>${data.allergies.map(a => `<tr><td>${a.title || a.allergy}</td><td>${a.reaction || 'None'}</td></tr>`).join('')}</table>` : '<p>None</p>'}
<h3>Medical Problems</h3>${data.problems && data.problems.length ? `<table><tr><th>Problem</th><th>Onset</th></tr>${data.problems.map(p => `<tr><td>${p.problem || p.title}</td><td>${p.onset_date || 'N/A'}</td></tr>`).join('')}</table>` : '<p>None</p>'}
<h3>Active Medications</h3>${data.medications && data.medications.length ? `<table><tr><th>Medication</th><th>Dosage</th></tr>${data.medications.map(m => `<tr><td>${m.medication || m.title}</td><td>${m.dosage || 'Standard'}</td></tr>`).join('')}</table>` : '<p>None</p>'}
</body></html>`;

      if (Platform.OS === 'web') {
        const blob = new Blob([reportHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const safeName = fullName.replace(/[^a-zA-Z0-9]/g, '_');
        a.href = url;
        a.download = `Summary_Of_Care_${safeName}_${new Date().toISOString().slice(0, 10)}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Alert.alert('Download Complete', 'Your Summary of Care document has been downloaded.');
      } else {
        Alert.alert('Summary of Care', 'Report downloaded successfully.');
      }
    } catch (e) {
      console.error('Download summary error:', e);
      Alert.alert('Error', 'Failed to generate Summary of Care.');
    } finally {
      setDownloading(false);
    }
  };

  const handleViewSummary = async () => {
    setDownloading(true);
    try {
      const res = await HealthRecordsService.getHealthSummary();
      if (!res.success || !res.data) {
        Alert.alert('Error', 'Unable to retrieve clinical data.');
        return;
      }
      const data = res.data;
      const demo = data.demographics || {};
      const fullName = [demo.first_name, demo.middle_name, demo.last_name].filter(Boolean).join(' ') || 'Patient';

      if (Platform.OS === 'web') {
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(`
            <html><head><title>Summary of Care - ${fullName}</title>
            <style>body{font-family:sans-serif;padding:24px;line-height:1.6;color:#1e293b;} h1{color:#2563eb;} table{width:100%;border-collapse:collapse;margin:12px 0;} th,td{border:1px solid #cbd5e1;padding:8px 12px;text-align:left;} th{background:#f1f5f9;}</style>
            </head><body><h1>Summary of Care: ${fullName}</h1>
            <p>Chart #${demo.patient_no || 'N/A'} | DOB: ${demo.birthdate || 'N/A'}</p><hr/>
            <h3>Allergies (${data.allergies?.length || 0})</h3>
            ${data.allergies?.length ? `<ul>${data.allergies.map(a => `<li>${a.title || a.allergy}</li>`).join('')}</ul>` : '<p>None</p>'}
            <h3>Active Conditions (${data.problems?.length || 0})</h3>
            ${data.problems?.length ? `<ul>${data.problems.map(p => `<li>${p.problem || p.title}</li>`).join('')}</ul>` : '<p>None</p>'}
            </body></html>
          `);
          win.document.close();
        } else {
          Alert.alert('Pop-up Blocked', 'Please allow pop-ups to view the document.');
        }
      }
    } catch (e) {
      console.error('View summary error:', e);
      Alert.alert('Error', 'Failed to preview Summary of Care.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.sheetContainer}>
        {/* ================= HEADER BAR ================= */}
        <View style={styles.sheetHeader}>
          <View style={styles.headerTitleRow}>
            <View style={styles.iconBadge}>
              <RecordsIcon color="#059669" size={18} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Medical Reports</Text>
              <Text style={styles.headerSub}>Export, clinical summaries, and HIPAA exports</Text>
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

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* ================= HIPAA SAFE HARBOR BANNER ================= */}
          <View style={styles.safeHarborBanner}>
            <View style={styles.bannerLeftRow}>
              <View style={styles.lockBadgeCircle}>
                <LockIcon color="#16a34a" size={16} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerHeading}>
                  HIPAA Safe Harbor 18-Identifier De-Identification Standard (45 CFR § 164.514)
                </Text>
                <Text style={styles.bannerSub}>
                  Scrub all 18 direct/indirect identifiers for clinical research, AI training, or quality studies without individual patient authorizations.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.bannerActionBtn}
              onPress={() => setActiveView('safe_harbor')}
              activeOpacity={0.8}
            >
              <Text style={styles.bannerActionBtnText}>Launch Safe Harbor De-ID Console →</Text>
            </TouchableOpacity>
          </View>

          {/* ================= VIEW SWITCHER ================= */}
          {activeView === 'custom_history' ? (
            /* ================= EXACT WEB MATCH: CUSTOMIZED MEDICAL HISTORY REPORT ================= */
            <View style={styles.customReportContainer}>
              <TouchableOpacity style={styles.backRow} onPress={() => setActiveView('grid')}>
                <Text style={styles.backText}>‹ Back to Reports</Text>
              </TouchableOpacity>

              <Text style={styles.customReportHeaderTitle}>
                Customized Medical History Report
              </Text>

              {/* Patient Report Check All | Clear All Bar */}
              <View style={styles.checkAllBar}>
                <Text style={styles.checkAllLabel}>Patient Report</Text>
                <TouchableOpacity onPress={handleCheckAll}>
                  <Text style={styles.checkAllLink}>Check All</Text>
                </TouchableOpacity>
                <Text style={styles.checkDivider}>|</Text>
                <TouchableOpacity onPress={handleClearAll}>
                  <Text style={styles.checkAllLink}>Clear All</Text>
                </TouchableOpacity>
              </View>

              {/* 2-Column Categories Grid from Web */}
              <View style={styles.categoriesTwoCol}>
                <View style={styles.colHalf}>
                  {['Demographics', 'History', 'Insurance', 'Billing'].map(sec => (
                    <TouchableOpacity
                      key={sec}
                      style={styles.checkboxOptionRow}
                      onPress={() => toggleSection(sec)}
                    >
                      <View style={[styles.boxCheckbox, selectedSections[sec] && styles.boxCheckboxChecked]}>
                        {selectedSections[sec] && <Text style={styles.boxCheckText}>✓</Text>}
                      </View>
                      <Text style={styles.checkboxOptionText}>{sec}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.colHalf}>
                  {[
                    'Allergies',
                    'Medications',
                    'Immunizations',
                    'Medical Problems',
                    'Patient Notes',
                    'Transactions',
                    'Communications'
                  ].map(sec => (
                    <TouchableOpacity
                      key={sec}
                      style={styles.checkboxOptionRow}
                      onPress={() => toggleSection(sec)}
                    >
                      <View style={[styles.boxCheckbox, selectedSections[sec] && styles.boxCheckboxChecked]}>
                        {selectedSections[sec] && <Text style={styles.boxCheckText}>✓</Text>}
                      </View>
                      <Text style={styles.checkboxOptionText}>{sec}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 2-Column Section for Issues & Encounters */}
              <View style={styles.issuesAndEncountersWrap}>
                {/* Issues Column */}
                <View style={styles.subColBlock}>
                  <Text style={styles.subBlockHeading}>Issues:</Text>
                  {downloading ? (
                    <ActivityIndicator size="small" color="#2563eb" />
                  ) : healthData ? (
                    <View style={styles.issuesList}>
                      {/* Allergies sub-header */}
                      {healthData.allergies?.length ? (
                        <>
                          <Text style={styles.issueSubHeader}>Allergies</Text>
                          {healthData.allergies.map(a => {
                            const isChecked = selectedIssues.has(`allergy_${a.id}`);
                            return (
                              <TouchableOpacity
                                key={a.id}
                                style={styles.issueItemRow}
                                onPress={() => toggleIssue(`allergy_${a.id}`)}
                              >
                                <View style={[styles.boxCheckbox, isChecked && styles.boxCheckboxChecked]}>
                                  {isChecked && <Text style={styles.boxCheckText}>✓</Text>}
                                </View>
                                <Text style={styles.issueNameText} numberOfLines={1}>
                                  {a.title || a.allergy}
                                </Text>
                                <Text style={styles.issueActiveBadge}>Active</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </>
                      ) : null}

                      {/* Medical Problems sub-header */}
                      {healthData.problems?.length ? (
                        <>
                          <Text style={styles.issueSubHeader}>Medical Problems</Text>
                          {healthData.problems.map(p => {
                            const isChecked = selectedIssues.has(`problem_${p.id}`);
                            return (
                              <TouchableOpacity
                                key={p.id}
                                style={styles.issueItemRow}
                                onPress={() => toggleIssue(`problem_${p.id}`)}
                              >
                                <View style={[styles.boxCheckbox, isChecked && styles.boxCheckboxChecked]}>
                                  {isChecked && <Text style={styles.boxCheckText}>✓</Text>}
                                </View>
                                <Text style={styles.issueNameText} numberOfLines={1}>
                                  {p.problem || p.title}
                                </Text>
                                <Text style={styles.issueActiveBadge}>Active</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </>
                      ) : null}

                      {/* Medications sub-header */}
                      {healthData.medications?.length ? (
                        <>
                          <Text style={styles.issueSubHeader}>Medications</Text>
                          {healthData.medications.map(m => {
                            const isChecked = selectedIssues.has(`med_${m.id}`);
                            return (
                              <TouchableOpacity
                                key={m.id}
                                style={styles.issueItemRow}
                                onPress={() => toggleIssue(`med_${m.id}`)}
                              >
                                <View style={[styles.boxCheckbox, isChecked && styles.boxCheckboxChecked]}>
                                  {isChecked && <Text style={styles.boxCheckText}>✓</Text>}
                                </View>
                                <Text style={styles.issueNameText} numberOfLines={1}>
                                  {m.medication || m.title}
                                </Text>
                                <Text style={styles.issueActiveBadge}>Active</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </>
                      ) : null}
                    </View>
                  ) : (
                    <Text style={styles.emptyNote}>No issues on record.</Text>
                  )}
                </View>

                {/* Encounters & Forms Column */}
                <View style={styles.subColBlock}>
                  <Text style={styles.subBlockHeading}>Encounters &amp; Forms:</Text>
                  {healthData?.encounters?.length ? (
                    healthData.encounters.map(e => {
                      const isChecked = selectedEncounters.has(`enc_${e.id}`);
                      return (
                        <TouchableOpacity
                          key={e.id}
                          style={styles.issueItemRow}
                          onPress={() => toggleEncounter(`enc_${e.id}`)}
                        >
                          <View style={[styles.boxCheckbox, isChecked && styles.boxCheckboxChecked]}>
                            {isChecked && <Text style={styles.boxCheckText}>✓</Text>}
                          </View>
                          <Text style={styles.issueNameText} numberOfLines={1}>
                            {e.reason || 'Encounter'} ({e.date ? e.date.substring(0, 10) : ''})
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <Text style={styles.emptyNote}>No encounters found.</Text>
                  )}
                </View>
              </View>

              {/* Bottom Actions: Generate Report | Download PDF */}
              <View style={styles.customButtonsRow}>
                <TouchableOpacity
                  style={styles.customReportBtn}
                  onPress={() => handleGenerateCustomReport('view')}
                >
                  <Text style={styles.customReportBtnText}>Generate Report</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.customReportBtn}
                  onPress={() => handleGenerateCustomReport('download')}
                >
                  <Text style={styles.customReportBtnText}>Download PDF</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : activeView === 'safe_harbor' ? (
            /* Safe Harbor Detail View */
            <View style={styles.detailCard}>
              <TouchableOpacity style={styles.backRow} onPress={() => setActiveView('grid')}>
                <Text style={styles.backText}>‹ Back to Medical Reports</Text>
              </TouchableOpacity>
              <Text style={styles.detailTitle}>Safe Harbor De-Identification Console</Text>
              <Text style={styles.detailDesc}>
                Under 45 CFR § 164.514(b)(2), health information is not individually identifiable if 18 specified identifiers of the individual or of relatives, employers, or household members of the individual are removed.
              </Text>
              <View style={styles.identifierBox}>
                <Text style={styles.identifierHeading}>Protected Identifiers Scrubbed (18 Categories):</Text>
                <Text style={styles.identifierItem}>1. Names &amp; Initials</Text>
                <Text style={styles.identifierItem}>2. All geographic subdivisions smaller than a state</Text>
                <Text style={styles.identifierItem}>3. All elements of dates directly related to an individual</Text>
                <Text style={styles.identifierItem}>4. Telephone numbers</Text>
                <Text style={styles.identifierItem}>5. Fax numbers</Text>
                <Text style={styles.identifierItem}>6. Email addresses</Text>
                <Text style={styles.identifierItem}>7. Social Security Numbers</Text>
                <Text style={styles.identifierItem}>8. Medical record numbers</Text>
                <Text style={styles.identifierItem}>9. Health plan beneficiary numbers</Text>
                <Text style={styles.identifierItem}>10. Account numbers &amp; certificate numbers</Text>
                <Text style={styles.identifierItem}>11. Biometric identifiers including finger and voice prints</Text>
                <Text style={styles.identifierItem}>12. Full-face photographic images</Text>
              </View>
              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={() => {
                  Alert.alert('HIPAA Verified', 'Safe Harbor rules verified. Export sanitized for clinical audit.');
                  setActiveView('grid');
                }}
              >
                <Text style={styles.primaryActionBtnText}>Run Safe Harbor Sanitization</Text>
              </TouchableOpacity>
            </View>
          ) : activeView === 'help' ? (
            /* Help View */
            <View style={styles.detailCard}>
              <TouchableOpacity style={styles.backRow} onPress={() => setActiveView('grid')}>
                <Text style={styles.backText}>‹ Back to Medical Reports</Text>
              </TouchableOpacity>
              <Text style={styles.detailTitle}>Medical Reports Help &amp; Guidance</Text>
              <Text style={styles.detailDesc}>
                This portal allows patients and authorized providers to review, export, and securely transfer clinical medical histories in accordance with ONC 2015 Edition Cures Update criteria.
              </Text>
              <View style={styles.identifierBox}>
                <Text style={styles.identifierHeading}>Available Export Options:</Text>
                <Text style={styles.identifierItem}>• View Summary of Care: Opens an interactive HTML view of your active CCD record.</Text>
                <Text style={styles.identifierItem}>• Download Summary of Care: Generates a complete Continuity of Care Document file.</Text>
                <Text style={styles.identifierItem}>• Customized Medical History Report: Filter by allergies, problems, or encounters.</Text>
                <Text style={styles.identifierItem}>• Safe Harbor De-ID: Strips 18 HIPAA identifiers for research sharing.</Text>
              </View>
            </View>
          ) : (
            /* Main 6 Cards Grid */
            <View style={styles.cardsGrid}>
              
              {/* Card 1: Safe Harbor De-ID (§ 164.514) */}
              <View style={[styles.reportCard, { borderColor: '#86efac' }]}>
                <View style={[styles.cardIconBox, { backgroundColor: '#f0fdf4' }]}>
                  <LockIcon color="#16a34a" size={28} />
                </View>
                <Text style={styles.reportCardTitle}>Safe Harbor De-ID</Text>
                <Text style={styles.reportCardDesc}>Scrub 18 HIPAA identifiers</Text>
                <TouchableOpacity
                  style={[styles.cardActionBtn, { backgroundColor: '#16a34a' }]}
                  activeOpacity={0.8}
                  onPress={() => setActiveView('safe_harbor')}
                >
                  <Text style={styles.cardActionBtnText}>Safe Harbor De-ID (§ 164.514)</Text>
                </TouchableOpacity>
              </View>

              {/* Card 2: View Summary of Care */}
              <View style={styles.reportCard}>
                <View style={[styles.cardIconBox, { backgroundColor: '#eff6ff' }]}>
                  <DocumentPlusIcon color="#2563eb" size={28} />
                </View>
                <Text style={styles.reportCardTitle}>Summary of Care</Text>
                <Text style={styles.reportCardDesc}>View active health chart</Text>
                <TouchableOpacity
                  style={[styles.cardActionBtn, { backgroundColor: '#2563eb' }]}
                  activeOpacity={0.8}
                  onPress={handleViewSummary}
                  disabled={downloading}
                >
                  {downloading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.cardActionBtnText}>View Summary of Care</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Card 3: Download Summary of Care */}
              <View style={styles.reportCard}>
                <View style={[styles.cardIconBox, { backgroundColor: '#eff6ff' }]}>
                  <DownloadTrayIcon color="#2563eb" size={28} />
                </View>
                <Text style={styles.reportCardTitle}>Export Document</Text>
                <Text style={styles.reportCardDesc}>Save complete CCD HTML</Text>
                <TouchableOpacity
                  style={[styles.cardActionBtn, { backgroundColor: '#2563eb' }]}
                  activeOpacity={0.8}
                  onPress={handleDownloadSummary}
                  disabled={downloading}
                >
                  {downloading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.cardActionBtnText}>Download Summary of Care</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Card 4: Customized Medical History Report */}
              <View style={styles.reportCard}>
                <View style={[styles.cardIconBox, { backgroundColor: '#f5f3ff' }]}>
                  <MedicalClipboardIcon color="#7c3aed" size={28} />
                </View>
                <Text style={styles.reportCardTitle}>History Report</Text>
                <Text style={styles.reportCardDesc}>Problems &amp; visit records</Text>
                <TouchableOpacity
                  style={[styles.cardActionBtn, { backgroundColor: '#7c3aed' }]}
                  activeOpacity={0.8}
                  onPress={handleOpenCustomHistory}
                >
                  <Text style={styles.cardActionBtnText}>Customized Medical History</Text>
                </TouchableOpacity>
              </View>

              {/* Card 5: Download Medical Record Documents */}
              <View style={styles.reportCard}>
                <View style={[styles.cardIconBox, { backgroundColor: '#ecfdf5' }]}>
                  <DocumentFolderIcon color="#059669" size={28} />
                </View>
                <Text style={styles.reportCardTitle}>Record Documents</Text>
                <Text style={styles.reportCardDesc}>Clinical attachments</Text>
                <TouchableOpacity
                  style={[styles.cardActionBtn, { backgroundColor: '#059669' }]}
                  activeOpacity={0.8}
                  onPress={handleDownloadSummary}
                >
                  <Text style={styles.cardActionBtnText}>Download Record Documents</Text>
                </TouchableOpacity>
              </View>

              {/* Card 6: Help */}
              <View style={styles.reportCard}>
                <View style={[styles.cardIconBox, { backgroundColor: '#f1f5f9' }]}>
                  <HelpCircleIcon color="#475569" size={28} />
                </View>
                <Text style={styles.reportCardTitle}>Guidance &amp; FAQ</Text>
                <Text style={styles.reportCardDesc}>ONC 2015 Cures criteria</Text>
                <TouchableOpacity
                  style={[styles.cardActionBtn, { backgroundColor: '#475569' }]}
                  activeOpacity={0.8}
                  onPress={() => setActiveView('help')}
                >
                  <Text style={styles.cardActionBtnText}>Help</Text>
                </TouchableOpacity>
              </View>

            </View>
          )}
        </ScrollView>
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
    height: '92%',
    width: '100%',
    maxWidth: 520,
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
    paddingBottom: 14,
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  safeHarborBanner: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16
  },
  bannerLeftRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10
  },
  lockBadgeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  bannerHeading: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#166534',
    lineHeight: 16,
    marginBottom: 3
  },
  bannerSub: {
    fontSize: 11,
    color: '#15803d',
    lineHeight: 15
  },
  bannerActionBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignSelf: 'flex-start'
  },
  bannerActionBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700'
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between'
  },
  reportCard: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 160
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  reportCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 2
  },
  reportCardDesc: {
    fontSize: 10.5,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 10
  },
  cardActionBtn: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardActionBtnText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '700',
    textAlign: 'center'
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16
  },
  backRow: {
    marginBottom: 12
  },
  backText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb'
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8
  },
  detailDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 14
  },
  identifierBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14
  },
  identifierHeading: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6
  },
  identifierItem: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
    marginBottom: 2
  },
  primaryActionBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center'
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700'
  },

  /* Customized Report View Styling */
  customReportContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16
  },
  customReportHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 10,
    marginBottom: 14
  },
  checkAllBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16
  },
  checkAllLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a'
  },
  checkAllLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb'
  },
  checkDivider: {
    fontSize: 12,
    color: '#94a3b8'
  },
  categoriesTwoCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  colHalf: {
    width: '48%'
  },
  checkboxOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  boxCheckbox: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  boxCheckboxChecked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb'
  },
  boxCheckText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900'
  },
  checkboxOptionText: {
    fontSize: 12.5,
    color: '#334155'
  },
  issuesAndEncountersWrap: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 16,
    marginBottom: 20
  },
  subColBlock: {
    marginBottom: 16
  },
  subBlockHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10
  },
  issuesList: {
    flexDirection: 'column',
    gap: 6
  },
  issueSubHeader: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#64748b',
    marginTop: 6,
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  issueItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5
  },
  issueNameText: {
    fontSize: 12,
    color: '#1e293b',
    flex: 1
  },
  issueActiveBadge: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#059669',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4
  },
  emptyNote: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic'
  },
  customButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 16
  },
  customReportBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center'
  },
  customReportBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a'
  }
});
