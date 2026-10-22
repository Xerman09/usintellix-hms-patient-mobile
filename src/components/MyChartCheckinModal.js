import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Alert,
  SafeAreaView
} from 'react-native';
import { MyChartService } from '../api/mychart';
import {
  CheckinIcon,
  CloseIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ShieldCheckIcon,
  HospitalIcon,
  ClockIcon,
  UserIcon
} from './Icons';

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
      const time = parts.length >= 5 ? `, ${parts[3]}:${parts[4]}` : '';
      return `${day} ${month} ${year}${time}`;
    }
  } catch (e) {}
  return String(dateStr).slice(0, 16);
};

export default function MyChartCheckinModal({
  visible,
  onClose
}) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkinItems, setCheckinItems] = useState([]);
  const [opensHours, setOpensHours] = useState(48);

  // Active Wizard States
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [wizardLoading, setWizardLoading] = useState(false);
  const [wizardData, setWizardData] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0); // 0: demo, 1: insurance, 2: consents, 3: questionnaire, 4: complete pass
  const [submittingStep, setSubmittingStep] = useState(false);

  // Step 1: Demographics Form State
  const [demoAddress, setDemoAddress] = useState('');
  const [demoCity, setDemoCity] = useState('');
  const [demoProvince, setDemoProvince] = useState('');
  const [demoZip, setDemoZip] = useState('');
  const [demoMobile, setDemoMobile] = useState('');
  const [demoEmail, setDemoEmail] = useState('');

  // Step 2: Insurance Form State
  const [insuranceUnchanged, setInsuranceUnchanged] = useState(true);
  const [insuranceNote, setInsuranceNote] = useState('');

  // Step 3: Consents Form State
  const [consentNpp, setConsentNpp] = useState(false);
  const [consentTreatment, setConsentTreatment] = useState(false);
  const [signatureName, setSignatureName] = useState('');

  // Step 4: Questionnaire State
  const [questionAnswers, setQuestionAnswers] = useState({});

  const fetchCheckinList = async () => {
    try {
      const res = await MyChartService.getCheckinOpen();
      if (res && res.success && res.data) {
        setCheckinItems(res.data.items || []);
        if (res.data.opens_hours) setOpensHours(res.data.opens_hours);
      }
    } catch (err) {
      console.warn('Failed to load checkin items:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (visible) {
      setLoading(true);
      fetchCheckinList();
      setActiveAppointment(null);
      setWizardData(null);
      setCurrentStepIndex(0);
    }
  }, [visible]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCheckinList();
  };

  // Launch the multi-step check-in wizard
  const handleStartWizard = async (item) => {
    setActiveAppointment(item);
    setWizardLoading(true);
    try {
      const res = await MyChartService.startCheckin(item.appointment_id);
      if (res && res.success && res.data) {
        setWizardData(res.data);
        const contact = res.data.contact || {};
        setDemoAddress(contact.address_line || '');
        setDemoCity(contact.city || '');
        setDemoProvince(contact.province || '');
        setDemoZip(contact.zip_code || '');
        setDemoMobile(contact.mobile_phone || contact.home_phone || '');
        setDemoEmail(contact.email || '');

        setInsuranceUnchanged(true);
        setInsuranceNote('');
        setConsentNpp(!!res.data.consents?.npp_acknowledged_at);
        setConsentTreatment(false);
        setSignatureName('');
        setQuestionAnswers({});

        // Determine resume step based on completed timestamps
        const steps = res.data.checkin?.steps || {};
        if (res.data.checkin?.status === 'completed') {
          setCurrentStepIndex(4); // Express pass view
        } else if (!steps.demographics) {
          setCurrentStepIndex(0);
        } else if (!steps.insurance) {
          setCurrentStepIndex(1);
        } else if (!steps.consents) {
          setCurrentStepIndex(2);
        } else if (!steps.questionnaire) {
          setCurrentStepIndex(3);
        } else {
          setCurrentStepIndex(4);
        }
      } else {
        Alert.alert('Notice', res?.message || 'Unable to open check-in for this visit.');
        setActiveAppointment(null);
      }
    } catch (err) {
      console.warn('Failed to start checkin:', err);
      Alert.alert('Error', 'Could not start check-in. Please try again.');
      setActiveAppointment(null);
    } finally {
      setWizardLoading(false);
    }
  };

  // Save Step 1: Demographics
  const handleSaveDemographics = async () => {
    if (!demoMobile.trim()) {
      Alert.alert('Phone Required', 'Please provide a valid contact telephone number.');
      return;
    }

    setSubmittingStep(true);
    try {
      const res = await MyChartService.submitCheckinStep({
        appointment_id: activeAppointment.appointment_id,
        step: 'demographics',
        address_line: demoAddress.trim(),
        city: demoCity.trim(),
        province: demoProvince.trim(),
        zip_code: demoZip.trim(),
        mobile_phone: demoMobile.trim(),
        email: demoEmail.trim()
      });

      if (res && res.success) {
        setCurrentStepIndex(1);
      } else {
        Alert.alert('Notice', res?.message || 'Could not save contact details.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to save contact information.');
    } finally {
      setSubmittingStep(false);
    }
  };

  // Save Step 2: Insurance
  const handleSaveInsurance = async () => {
    if (!insuranceUnchanged && !insuranceNote.trim()) {
      Alert.alert('Notes Required', 'Please enter a brief note describing the change to your insurance.');
      return;
    }

    setSubmittingStep(true);
    try {
      const res = await MyChartService.submitCheckinStep({
        appointment_id: activeAppointment.appointment_id,
        step: 'insurance',
        has_changes: !insuranceUnchanged,
        note: insuranceNote.trim()
      });

      if (res && res.success) {
        setCurrentStepIndex(2);
      } else {
        Alert.alert('Notice', res?.message || 'Could not verify insurance step.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to submit insurance verification.');
    } finally {
      setSubmittingStep(false);
    }
  };

  // Save Step 3: Consents
  const handleSaveConsents = async () => {
    if (!consentNpp || !consentTreatment) {
      Alert.alert('Consent Required', 'Please read and agree to both consent policies.');
      return;
    }
    if (!signatureName.trim()) {
      Alert.alert('Signature Required', 'Please type your full legal name to electronically sign.');
      return;
    }

    setSubmittingStep(true);
    try {
      const res = await MyChartService.submitCheckinStep({
        appointment_id: activeAppointment.appointment_id,
        step: 'consents',
        npp: 1,
        treatment: 1,
        signature: signatureName.trim()
      });

      if (res && res.success) {
        setCurrentStepIndex(3);
      } else {
        Alert.alert('Notice', res?.message || 'Could not save electronic consents.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to save electronic consents.');
    } finally {
      setSubmittingStep(false);
    }
  };

  // Save Step 4: Questionnaire
  const handleSaveQuestionnaire = async () => {
    const questions = wizardData?.questionnaire?.questions || [];
    const missing = questions.find((q) => q.required && !questionAnswers[q.key]?.trim());
    if (missing) {
      Alert.alert('Question Required', `Please answer: "${missing.label || missing.key}"`);
      return;
    }

    setSubmittingStep(true);
    try {
      // 1. Submit questionnaire answers
      const stepRes = await MyChartService.submitCheckinStep({
        appointment_id: activeAppointment.appointment_id,
        step: 'questionnaire',
        answers: questionAnswers
      });

      if (stepRes && stepRes.success) {
        // 2. Finalize completion
        const completeRes = await MyChartService.completeCheckin(activeAppointment.appointment_id);
        if (completeRes && completeRes.success) {
          fetchCheckinList();
          setCurrentStepIndex(4);
        } else {
          setCurrentStepIndex(4);
        }
      } else {
        Alert.alert('Notice', stepRes?.message || 'Could not save questionnaire responses.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to complete e-check-in.');
    } finally {
      setSubmittingStep(false);
    }
  };

  const handleCloseWizard = () => {
    setActiveAppointment(null);
    setWizardData(null);
    fetchCheckinList();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={activeAppointment ? handleCloseWizard : onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* ================= ACTIVE CHECK-IN WIZARD ================= */}
        {activeAppointment ? (
          <View style={styles.wizardContainer}>
            {/* Header */}
            <View style={styles.wizardHeader}>
              <TouchableOpacity onPress={handleCloseWizard} style={styles.backBtn}>
                <Text style={styles.backBtnText}>✕ Exit Check-In</Text>
              </TouchableOpacity>
              <View style={styles.wizardStepBadge}>
                <Text style={styles.wizardStepBadgeText}>
                  {currentStepIndex === 4 ? 'Express Pass' : `Step ${currentStepIndex + 1} of 4`}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <CloseIcon color="#64748b" size={18} />
              </TouchableOpacity>
            </View>

            {wizardLoading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color="#d97706" />
                <Text style={styles.loadingText}>Preparing e-Check-In...</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.wizardScroll} showsVerticalScrollIndicator={false}>
                {/* Appointment Context Card */}
                <View style={styles.contextCard}>
                  <View style={styles.contextTopRow}>
                    <View style={styles.contextBadge}>
                      <Text style={styles.contextBadgeText}>FAST-TRACK CHECK-IN</Text>
                    </View>
                    <Text style={styles.contextDate}>{formatDate(activeAppointment.when)}</Text>
                  </View>
                  <Text style={styles.contextTitle}>{activeAppointment.title}</Text>
                  {activeAppointment.doctor ? (
                    <Text style={styles.contextDoctor}>With {activeAppointment.doctor}</Text>
                  ) : null}
                  {activeAppointment.facility ? (
                    <Text style={styles.contextLocation}>
                      {activeAppointment.facility} {activeAppointment.department ? `(${activeAppointment.department})` : ''}
                    </Text>
                  ) : null}
                </View>

                {/* Progress Indicators Bar */}
                {currentStepIndex < 4 && (
                  <View style={styles.progressBarRow}>
                    {['Contact', 'Insurance', 'Consents', 'Health Survey'].map((stepName, sIdx) => {
                      const isComplete = currentStepIndex > sIdx;
                      const isCurrent = currentStepIndex === sIdx;
                      return (
                        <View key={`step-${sIdx}`} style={styles.stepProgressCol}>
                          <View
                            style={[
                              styles.stepProgressBar,
                              isComplete && styles.stepProgressBarDone,
                              isCurrent && styles.stepProgressBarCurrent
                            ]}
                          />
                          <Text
                            style={[
                              styles.stepProgressLabel,
                              isCurrent && styles.stepProgressLabelCurrent,
                              isComplete && styles.stepProgressLabelDone
                            ]}
                            numberOfLines={1}
                          >
                            {stepName}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* ================= STEP 0: DEMOGRAPHICS ================= */}
                {currentStepIndex === 0 && (
                  <View style={styles.stepContentCard}>
                    <Text style={styles.stepTitle}>1. Confirm Contact &amp; Address</Text>
                    <Text style={styles.stepDesc}>
                      Verify your residential address and telephone numbers on file so clinical staff can reach you.
                    </Text>

                    <Text style={styles.inputLabel}>Mobile Phone *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={demoMobile}
                      onChangeText={setDemoMobile}
                      placeholder="e.g., 0917-123-4567"
                      placeholderTextColor="#94a3b8"
                      keyboardType="phone-pad"
                    />

                    <Text style={styles.inputLabel}>Email Address</Text>
                    <TextInput
                      style={styles.textInput}
                      value={demoEmail}
                      onChangeText={setDemoEmail}
                      placeholder="patient@example.com"
                      placeholderTextColor="#94a3b8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />

                    <Text style={styles.inputLabel}>Street Address</Text>
                    <TextInput
                      style={styles.textInput}
                      value={demoAddress}
                      onChangeText={setDemoAddress}
                      placeholder="Street address line"
                      placeholderTextColor="#94a3b8"
                    />

                    <View style={styles.splitInputRow}>
                      <View style={{ flex: 1.5, marginRight: 8 }}>
                        <Text style={styles.inputLabel}>City</Text>
                        <TextInput
                          style={styles.textInput}
                          value={demoCity}
                          onChangeText={setDemoCity}
                          placeholder="City"
                          placeholderTextColor="#94a3b8"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>Postal Code</Text>
                        <TextInput
                          style={styles.textInput}
                          value={demoZip}
                          onChangeText={setDemoZip}
                          placeholder="ZIP"
                          placeholderTextColor="#94a3b8"
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.nextBtn, submittingStep && styles.btnDisabled]}
                      onPress={handleSaveDemographics}
                      disabled={submittingStep}
                    >
                      {submittingStep ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <Text style={styles.nextBtnText}>Save &amp; Continue →</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* ================= STEP 1: INSURANCE ================= */}
                {currentStepIndex === 1 && (
                  <View style={styles.stepContentCard}>
                    <Text style={styles.stepTitle}>2. Verify Insurance Coverage</Text>
                    <Text style={styles.stepDesc}>
                      Confirm that your coverage on file is active and up to date for this encounter.
                    </Text>

                    {wizardData?.insurance && wizardData.insurance.length > 0 ? (
                      wizardData.insurance.map((ins, iIdx) => (
                        <View key={`ins-${iIdx}`} style={styles.insuranceBox}>
                          <Text style={styles.insuranceName}>{ins.insurer || 'Primary Insurance'}</Text>
                          <Text style={styles.insuranceDetail}>Policy #: {ins.policy_number || 'N/A'}</Text>
                          {ins.group_number ? (
                            <Text style={styles.insuranceDetail}>Group #: {ins.group_number}</Text>
                          ) : null}
                          <Text style={styles.insuranceDetail}>Subscriber: {ins.subscriber_name || 'Self'}</Text>
                        </View>
                      ))
                    ) : (
                      <View style={styles.noInsuranceBox}>
                        <Text style={styles.noInsuranceText}>
                          No active insurance policy currently on file. (Self-Pay Account)
                        </Text>
                      </View>
                    )}

                    <View style={styles.radioGroup}>
                      <TouchableOpacity
                        style={[styles.radioOption, insuranceUnchanged && styles.radioOptionSelected]}
                        onPress={() => setInsuranceUnchanged(true)}
                      >
                        <View style={[styles.radioCircle, insuranceUnchanged && styles.radioCircleSelected]} />
                        <Text style={styles.radioLabel}>My insurance details are unchanged</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.radioOption, !insuranceUnchanged && styles.radioOptionSelected]}
                        onPress={() => setInsuranceUnchanged(false)}
                      >
                        <View style={[styles.radioCircle, !insuranceUnchanged && styles.radioCircleSelected]} />
                        <Text style={styles.radioLabel}>I have a new insurance card or changes</Text>
                      </TouchableOpacity>
                    </View>

                    {!insuranceUnchanged && (
                      <View style={{ marginTop: 8 }}>
                        <Text style={styles.inputLabel}>Describe the change</Text>
                        <TextInput
                          style={styles.textInput}
                          value={insuranceNote}
                          onChangeText={setInsuranceNote}
                          placeholder="e.g., Changed provider to PhilHealth/HMO, card in hand"
                          placeholderTextColor="#94a3b8"
                        />
                      </View>
                    )}

                    <TouchableOpacity
                      style={[styles.nextBtn, submittingStep && styles.btnDisabled]}
                      onPress={handleSaveInsurance}
                      disabled={submittingStep}
                    >
                      {submittingStep ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.nextBtnText}>Confirm Insurance →</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* ================= STEP 2: CONSENTS ================= */}
                {currentStepIndex === 2 && (
                  <View style={styles.stepContentCard}>
                    <Text style={styles.stepTitle}>3. Electronic Consents</Text>
                    <Text style={styles.stepDesc}>
                      Please review the hospital privacy policies and consent to outpatient medical examination.
                    </Text>

                    <TouchableOpacity
                      style={[styles.consentCheckRow, consentNpp && styles.consentCheckRowActive]}
                      onPress={() => setConsentNpp(!consentNpp)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.checkbox, consentNpp && styles.checkboxActive]}>
                        {consentNpp && <Text style={styles.checkmarkText}>✓</Text>}
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.consentItemTitle}>Notice of Privacy Practices</Text>
                        <Text style={styles.consentItemDesc}>
                          I acknowledge receipt of the USIntellix Notice of Privacy Practices detailing how medical data is safeguarded under health privacy regulations.
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.consentCheckRow, consentTreatment && styles.consentCheckRowActive]}
                      onPress={() => setConsentTreatment(!consentTreatment)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.checkbox, consentTreatment && styles.checkboxActive]}>
                        {consentTreatment && <Text style={styles.checkmarkText}>✓</Text>}
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.consentItemTitle}>Consent for Clinical Evaluation</Text>
                        <Text style={styles.consentItemDesc}>
                          I consent to routine physical examination, diagnostic testing, and healthcare services by attending clinical staff.
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <Text style={styles.inputLabel}>Type Full Legal Name (Electronic Signature) *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={signatureName}
                      onChangeText={setSignatureName}
                      placeholder="e.g., Johnathan Q. Doe"
                      placeholderTextColor="#94a3b8"
                    />

                    <TouchableOpacity
                      style={[styles.nextBtn, submittingStep && styles.btnDisabled]}
                      onPress={handleSaveConsents}
                      disabled={submittingStep}
                    >
                      {submittingStep ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.nextBtnText}>Sign &amp; Agree →</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* ================= STEP 3: QUESTIONNAIRE ================= */}
                {currentStepIndex === 3 && (
                  <View style={styles.stepContentCard}>
                    <Text style={styles.stepTitle}>4. Pre-Visit Health Survey</Text>
                    <Text style={styles.stepDesc}>
                      {wizardData?.questionnaire?.intro ||
                        'Help your care team prepare by answering these preliminary wellness questions.'}
                    </Text>

                    {wizardData?.questionnaire?.questions && wizardData.questionnaire.questions.length > 0 ? (
                      wizardData.questionnaire.questions.map((q, qIdx) => (
                        <View key={`q-${qIdx}`} style={styles.questionBlock}>
                          <Text style={styles.questionLabel}>
                            {q.label || q.text || q.key} {q.required ? '*' : ''}
                          </Text>
                          <TextInput
                            style={styles.textInput}
                            value={questionAnswers[q.key] || ''}
                            onChangeText={(val) =>
                              setQuestionAnswers((prev) => ({ ...prev, [q.key]: val }))
                            }
                            placeholder={q.placeholder || 'Type your response here...'}
                            placeholderTextColor="#94a3b8"
                          />
                        </View>
                      ))
                    ) : (
                      /* Default general wellness survey if department questionnaire is empty */
                      <View style={{ gap: 10 }}>
                        <View style={styles.questionBlock}>
                          <Text style={styles.questionLabel}>Primary reason or symptoms today?</Text>
                          <TextInput
                            style={styles.textInput}
                            value={questionAnswers['chief_complaint'] || ''}
                            onChangeText={(v) =>
                              setQuestionAnswers((p) => ({ ...p, chief_complaint: v }))
                            }
                            placeholder="e.g., Follow-up on blood pressure and fatigue"
                            placeholderTextColor="#94a3b8"
                          />
                        </View>

                        <View style={styles.questionBlock}>
                          <Text style={styles.questionLabel}>Any recent medication allergies or reactions?</Text>
                          <TextInput
                            style={styles.textInput}
                            value={questionAnswers['allergies'] || ''}
                            onChangeText={(v) =>
                              setQuestionAnswers((p) => ({ ...p, allergies: v }))
                            }
                            placeholder="e.g., Penicillin (rash), or None"
                            placeholderTextColor="#94a3b8"
                          />
                        </View>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[styles.nextBtn, submittingStep && styles.btnDisabled]}
                      onPress={handleSaveQuestionnaire}
                      disabled={submittingStep}
                    >
                      {submittingStep ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.nextBtnText}>Submit &amp; Complete e-Check-In ✓</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* ================= STEP 4: EXPRESS ARRIVAL PASS ================= */}
                {currentStepIndex === 4 && (
                  <View style={styles.expressPassCard}>
                    <View style={styles.passHeader}>
                      <View style={styles.passIconCircle}>
                        <CheckCircleIcon color="#059669" size={36} />
                      </View>
                      <Text style={styles.passHeaderTitle}>You're Checked In!</Text>
                      <Text style={styles.passHeaderSub}>Express Arrival Fast-Track Active</Text>
                    </View>

                    {/* Barcode Ticket Simulator */}
                    <View style={styles.ticketBarcodeBox}>
                      <View style={styles.simulatedBarcode}>
                        {[...Array(28)].map((_, bIdx) => (
                          <View
                            key={`bar-${bIdx}`}
                            style={[
                              styles.barcodeBar,
                              { width: bIdx % 3 === 0 ? 3 : bIdx % 2 === 0 ? 2 : 1 }
                            ]}
                          />
                        ))}
                      </View>
                      <Text style={styles.barcodeText}>
                        PASS #{activeAppointment.appointment_id}-EXP-{new Date().getFullYear()}
                      </Text>
                    </View>

                    <View style={styles.passDetailsGrid}>
                      <View style={styles.passDetailCol}>
                        <Text style={styles.passLabel}>PATIENT</Text>
                        <Text style={styles.passValueBold}>Ready for Desk</Text>
                      </View>
                      <View style={[styles.passDetailCol, { alignItems: 'flex-end' }]}>
                        <Text style={styles.passLabel}>APPOINTMENT TIME</Text>
                        <Text style={styles.passValueBold}>{formatDate(activeAppointment.when)}</Text>
                      </View>
                    </View>

                    <View style={styles.passInstructionBox}>
                      <Text style={styles.passInstructionTitle}>When You Arrive:</Text>
                      <Text style={styles.passInstructionText}>
                        1. Proceed directly to the clinic reception desk.{'\n'}
                        2. Give your name or show this mobile express pass.{'\n'}
                        3. All paperwork, consents, and questionnaires are already completed!
                      </Text>
                    </View>

                    <TouchableOpacity style={styles.doneBtn} onPress={handleCloseWizard}>
                      <Text style={styles.doneBtnText}>Return to Portal</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        ) : (
          /* ================= MAIN CHECK-IN LIST VIEW ================= */
          <View style={styles.mainContainer}>
            {/* Top Bar */}
            <View style={styles.topNav}>
              <View style={styles.titleColumn}>
                <View style={styles.titleRow}>
                  <View style={styles.titleIconBox}>
                    <CheckinIcon color="#d97706" size={20} />
                  </View>
                  <Text style={styles.screenTitle}>e-Check-In</Text>
                </View>
                <Text style={styles.screenSubtitle}>
                  Fast-track arrival for visits in the next {opensHours} hours
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <CloseIcon color="#64748b" size={18} />
              </TouchableOpacity>
            </View>

            {/* Content List */}
            <ScrollView
              contentContainerStyle={styles.listContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#d97706']} />}
              showsVerticalScrollIndicator={false}
            >
              {loading ? (
                <View style={styles.centerBox}>
                  <ActivityIndicator size="large" color="#d97706" />
                  <Text style={styles.loadingText}>Checking upcoming appointments...</Text>
                </View>
              ) : checkinItems.length === 0 ? (
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIconCircle}>
                    <CheckinIcon color="#94a3b8" size={32} />
                  </View>
                  <Text style={styles.emptyTitle}>No Appointments Ready for Check-In</Text>
                  <Text style={styles.emptyDesc}>
                    e-Check-In opens 48 hours before your scheduled appointment time. Once eligible, your visit will appear here so you can complete your paperwork from home.
                  </Text>
                </View>
              ) : (
                checkinItems.map((item) => {
                  const isCompleted = item.checkin_status === 'completed';
                  const stepsDone = item.done || 0;
                  const totalSteps = item.of || 4;

                  return (
                    <View key={`checkin-${item.appointment_id}`} style={styles.itemCard}>
                      <View style={styles.itemCardTop}>
                        <View style={styles.kindPill}>
                          <Text style={styles.kindPillText}>UPCOMING APPOINTMENT</Text>
                        </View>
                        <View style={styles.timePill}>
                          <ClockIcon color="#d97706" size={13} />
                          <Text style={styles.timePillText}>{formatDate(item.when)}</Text>
                        </View>
                      </View>

                      <Text style={styles.itemTitle}>{item.title}</Text>

                      {item.doctor ? (
                        <View style={styles.metaRow}>
                          <UserIcon color="#64748b" size={14} />
                          <Text style={styles.metaDoctorText}>{item.doctor}</Text>
                        </View>
                      ) : null}

                      {item.facility ? (
                        <View style={styles.metaRow}>
                          <HospitalIcon color="#64748b" size={14} />
                          <Text style={styles.metaLocationText}>
                            {item.facility} {item.department ? `(${item.department})` : ''}
                          </Text>
                        </View>
                      ) : null}

                      {/* Progress / Status Bar */}
                      <View style={styles.itemProgressSection}>
                        <View style={styles.progressTextRow}>
                          <Text style={styles.progressLabel}>
                            {isCompleted ? 'Check-In Complete ✓' : `${stepsDone} of ${totalSteps} Steps Complete`}
                          </Text>
                          <Text style={styles.progressPercent}>
                            {isCompleted ? '100%' : `${Math.round((stepsDone / totalSteps) * 100)}%`}
                          </Text>
                        </View>
                        <View style={styles.progressTrack}>
                          <View
                            style={[
                              styles.progressFill,
                              { width: isCompleted ? '100%' : `${(stepsDone / totalSteps) * 100}%` },
                              isCompleted && { backgroundColor: '#059669' }
                            ]}
                          />
                        </View>
                      </View>

                      {/* Action Button */}
                      <TouchableOpacity
                        style={[styles.startCheckinBtn, isCompleted && styles.viewPassBtn]}
                        activeOpacity={0.8}
                        onPress={() => handleStartWizard(item)}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircleIcon color="#059669" size={18} />
                            <Text style={styles.viewPassBtnText}>View Express Arrival Pass</Text>
                          </>
                        ) : (
                          <>
                            <CheckinIcon color="#ffffff" size={18} />
                            <Text style={styles.startCheckinBtnText}>
                              {stepsDone > 0 ? 'Continue e-Check-In' : 'Start e-Check-In'}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  titleColumn: {
    flex: 1
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  titleIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a'
  },
  screenSubtitle: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc'
  },
  listContent: {
    padding: 16,
    gap: 12
  },
  centerBox: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b'
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 10
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a'
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    gap: 8
  },
  itemCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  kindPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  kindPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569'
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8
  },
  timePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d97706'
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a'
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  metaDoctorText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155'
  },
  metaLocationText: {
    fontSize: 12,
    color: '#64748b'
  },
  itemProgressSection: {
    marginTop: 6,
    gap: 4
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  progressLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748b'
  },
  progressPercent: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0f172a'
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#d97706',
    borderRadius: 3
  },
  startCheckinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#d97706',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 6
  },
  startCheckinBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff'
  },
  viewPassBtn: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0'
  },
  viewPassBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669'
  },

  /* Wizard Styles */
  wizardContainer: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  wizardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9'
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b'
  },
  wizardStepBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  wizardStepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b45309'
  },
  wizardScroll: {
    padding: 16,
    paddingBottom: 40,
    gap: 14
  },
  contextCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4
  },
  contextTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  contextBadge: {
    backgroundColor: '#fffbeb',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6
  },
  contextBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#d97706'
  },
  contextDate: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748b'
  },
  contextTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2
  },
  contextDoctor: {
    fontSize: 12.5,
    color: '#334155',
    fontWeight: '600'
  },
  contextLocation: {
    fontSize: 12,
    color: '#64748b'
  },
  progressBarRow: {
    flexDirection: 'row',
    gap: 6
  },
  stepProgressCol: {
    flex: 1,
    gap: 4
  },
  stepProgressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2
  },
  stepProgressBarCurrent: {
    backgroundColor: '#d97706'
  },
  stepProgressBarDone: {
    backgroundColor: '#059669'
  },
  stepProgressLabel: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center'
  },
  stepProgressLabelCurrent: {
    color: '#d97706',
    fontWeight: '700'
  },
  stepProgressLabelDone: {
    color: '#059669',
    fontWeight: '600'
  },
  stepContentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  stepDesc: {
    fontSize: 12.5,
    color: '#64748b',
    lineHeight: 18
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginTop: 2
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    color: '#0f172a'
  },
  splitInputRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  nextBtn: {
    backgroundColor: '#d97706',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff'
  },
  btnDisabled: {
    opacity: 0.6
  },

  /* Step 2 Insurance */
  insuranceBox: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 3
  },
  insuranceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a'
  },
  insuranceDetail: {
    fontSize: 12,
    color: '#475569'
  },
  noInsuranceBox: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  noInsuranceText: {
    fontSize: 12.5,
    color: '#64748b'
  },
  radioGroup: {
    gap: 8,
    marginTop: 4
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10
  },
  radioOptionSelected: {
    borderColor: '#d97706',
    backgroundColor: '#fffbeb'
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94a3b8'
  },
  radioCircleSelected: {
    borderColor: '#d97706',
    borderWidth: 5
  },
  radioLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b'
  },

  /* Step 3 Consents */
  consentCheckRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  consentCheckRowActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe'
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  checkboxActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb'
  },
  checkmarkText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '800'
  },
  consentItemTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a'
  },
  consentItemDesc: {
    fontSize: 11.5,
    color: '#64748b',
    lineHeight: 16,
    marginTop: 2
  },

  /* Step 4 Questionnaire */
  questionBlock: {
    gap: 4
  },
  questionLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155'
  },

  /* Step 5 Express Pass */
  expressPassCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    gap: 16
  },
  passHeader: {
    alignItems: 'center',
    gap: 6
  },
  passIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center'
  },
  passHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a'
  },
  passHeaderSub: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669'
  },
  ticketBarcodeBox: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    gap: 8
  },
  simulatedBarcode: {
    flexDirection: 'row',
    height: 38,
    alignItems: 'center',
    gap: 3
  },
  barcodeBar: {
    height: '100%',
    backgroundColor: '#1e293b'
  },
  barcodeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 1.5
  },
  passDetailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9'
  },
  passDetailCol: {
    flex: 1
  },
  passLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8'
  },
  passValueBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2
  },
  passInstructionBox: {
    backgroundColor: '#f0fdf4',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: 4
  },
  passInstructionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534'
  },
  passInstructionText: {
    fontSize: 12,
    color: '#15803d',
    lineHeight: 18
  },
  doneBtn: {
    backgroundColor: '#059669',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center'
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff'
  }
});
