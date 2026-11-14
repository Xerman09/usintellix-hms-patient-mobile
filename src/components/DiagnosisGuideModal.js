import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar
} from 'react-native';
import {
  CloseIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  InfoCircleIcon,
  MedicalClipboardIcon
} from './Icons';

/**
 * What a diagnosis means, and what to do about it.
 *
 * Opened from any diagnosis the patient has been given -- the After-Visit Summary,
 * the problem list, a discharge summary, an ER visit. The content is the hospital's
 * own wording, authored under Diagnosis Guides and matched to the diagnosis on the
 * server, so nothing here is generated or guessed on the device.
 *
 * The order of the sections is deliberate and should not be rearranged: the doctor's
 * own instructions for this visit come first, before any general information, so the
 * guide can never read as though it outranks what the patient was actually told. The
 * footer says the same thing in words.
 */
export default function DiagnosisGuideModal({
  visible,
  onClose,
  diagnosis,        // the diagnosis as the doctor wrote it
  code,             // ICD-10 code, when the source had one
  guide,            // the matched guide, already split into lists by the server
  doctorInstructions = []   // this visit's own instructions, when the caller has them
}) {
  const g = guide || {};
  const dos = g.dos || [];
  const donts = g.donts || [];
  const urgent = g.when_to_seek_help || [];
  const instructions = (doctorInstructions || []).filter(Boolean);

  const bulletList = (items, color, Icon) =>
    items.map((line, idx) => (
      <View key={`li-${idx}`} style={styles.bulletRow}>
        <View style={styles.bulletIcon}>
          <Icon color={color} size={14} />
        </View>
        <Text style={styles.bulletText}>{line}</Text>
      </View>
    ));

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.iconCircle}>
              <MedicalClipboardIcon color="#2563eb" size={20} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.headerTitle} numberOfLines={2}>
                {g.title || diagnosis || 'About this diagnosis'}
              </Text>
              <Text style={styles.headerSubtitle}>Understanding your diagnosis</Text>
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
        >
          {/* What the doctor actually recorded, in their words. */}
          <View style={styles.dxCard}>
            <Text style={styles.dxLabel}>YOUR DIAGNOSIS</Text>
            <Text style={styles.dxText}>{diagnosis || g.title}</Text>
            {code ? <Text style={styles.dxCode}>ICD-10: {code}</Text> : null}
          </View>

          {/* The doctor's own instructions outrank everything below them. */}
          {instructions.length > 0 && (
            <View style={[styles.sectionCard, styles.instructionCard]}>
              <Text style={[styles.sectionTitle, { color: '#166534' }]}>
                Your doctor&apos;s instructions for this visit
              </Text>
              {instructions.map((line, idx) => (
                <Text key={`inst-${idx}`} style={styles.instructionText}>
                  {line}
                </Text>
              ))}
              <Text style={styles.instructionNote}>
                These are for you specifically. Where they differ from the general information
                below, follow these.
              </Text>
            </View>
          )}

          {g.about ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>What it is</Text>
              <Text style={styles.bodyText}>{g.about}</Text>
            </View>
          ) : null}

          {g.why_it_happens ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Why it happens</Text>
              <Text style={styles.bodyText}>{g.why_it_happens}</Text>
            </View>
          ) : null}

          {g.common_symptoms ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Common signs</Text>
              <Text style={styles.bodyText}>{g.common_symptoms}</Text>
            </View>
          ) : null}

          {dos.length > 0 && (
            <View style={[styles.sectionCard, styles.doCard]}>
              <Text style={[styles.sectionTitle, { color: '#166534' }]}>What to do</Text>
              {bulletList(dos, '#16a34a', CheckCircleIcon)}
            </View>
          )}

          {donts.length > 0 && (
            <View style={[styles.sectionCard, styles.dontCard]}>
              <Text style={[styles.sectionTitle, { color: '#9a3412' }]}>What not to do</Text>
              {bulletList(donts, '#ea580c', CloseIcon)}
            </View>
          )}

          {urgent.length > 0 && (
            <View style={[styles.sectionCard, styles.urgentCard]}>
              <Text style={[styles.sectionTitle, { color: '#991b1b' }]}>
                Get help right away if
              </Text>
              {bulletList(urgent, '#dc2626', AlertTriangleIcon)}
              <Text style={styles.urgentNote}>
                Do not wait for your next appointment if any of these happen.
              </Text>
            </View>
          )}

          {/* The standing disclaimer. Every guide ends here. */}
          <View style={styles.footerCard}>
            <View style={styles.footerIconRow}>
              <InfoCircleIcon color="#64748b" size={15} />
              <Text style={styles.footerTitle}>About this information</Text>
            </View>
            <Text style={styles.footerText}>
              This is general information about the condition, not advice about your own case.
              Your treatment is what your doctor told you — follow that first. If anything here
              does not match what you were told, ask your doctor.
            </Text>
            {g.source ? <Text style={styles.footerSource}>Source: {g.source}</Text> : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Matches the app's redesigned surfaces: #fafbfc page, 14pt cards with a hairline
  // border and a barely-there shadow, 800-weight headings with tightened tracking.
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 11.5, color: '#64748b', marginTop: 1 },
  closeBtn: { padding: 6, marginLeft: 8 },

  body: { flex: 1 },

  dxCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  dxLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.8 },
  dxText: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginTop: 5, lineHeight: 22, letterSpacing: -0.3 },
  dxCode: { fontSize: 11.5, color: '#94a3b8', marginTop: 5 },

  sectionCard: {
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
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 0.8, marginBottom: 10, textTransform: 'uppercase' },
  bodyText: { fontSize: 14, color: '#334155', lineHeight: 21 },

  instructionCard: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  instructionText: { fontSize: 13.5, color: '#14532d', lineHeight: 20, marginBottom: 6 },
  instructionNote: {
    fontSize: 11.5,
    color: '#15803d',
    marginTop: 4,
    fontStyle: 'italic',
    lineHeight: 16
  },

  doCard: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  dontCard: { backgroundColor: '#fff7ed', borderColor: '#fed7aa' },
  urgentCard: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  urgentNote: { fontSize: 12, fontWeight: '700', color: '#991b1b', marginTop: 6 },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 9 },
  bulletIcon: { width: 20, paddingTop: 2, alignItems: 'flex-start' },
  bulletText: { flex: 1, fontSize: 14, color: '#334155', lineHeight: 21 },

  footerCard: {
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginTop: 4
  },
  footerIconRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  footerTitle: { fontSize: 12, fontWeight: '700', color: '#475569', marginLeft: 6, letterSpacing: 0.4 },
  footerText: { fontSize: 12.5, color: '#64748b', lineHeight: 18.5 },
  footerSource: { fontSize: 11, color: '#94a3b8', marginTop: 7 }
});
