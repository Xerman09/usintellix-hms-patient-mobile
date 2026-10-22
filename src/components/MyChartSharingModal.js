import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform
} from 'react-native';
import { THEME } from '../constants/theme';
import { MyChartService } from '../api/mychart';
import {
  CloseIcon,
  ShareIcon,
  ProxyIcon,
  ShieldCheckIcon,
  CopyIcon,
  TrashIcon,
  ClockIcon,
  CheckinIcon,
  ChevronRightIcon
} from './Icons';

export default function MyChartSharingModal({ visible, onClose }) {
  const [activeTab, setActiveTab] = useState('shares'); // 'shares' | 'proxy' | 'audit' | 'pack'
  const [loading, setLoading] = useState(false);
  const [accountData, setAccountData] = useState(null);
  const [auditLogData, setAuditLogData] = useState(null);
  const [auditDays, setAuditDays] = useState(90);
  const [auditFilter, setAuditFilter] = useState('all'); // 'all' | 'staff' | 'you' | 'outside' | 'refused'

  // New Share Link Form State
  const [showShareForm, setShowShareForm] = useState(false);
  const [shareLabel, setShareLabel] = useState('');
  const [shareDays, setShareDays] = useState(14);
  const [shareScope, setShareScope] = useState(['allergies', 'problems', 'medications']);
  const [submittingShare, setSubmittingShare] = useState(false);

  // New Proxy Request Form State
  const [showProxyForm, setShowProxyForm] = useState(false);
  const [reqPatientNo, setReqPatientNo] = useState('');
  const [reqLastName, setReqLastName] = useState('');
  const [reqDob, setReqDob] = useState('');
  const [reqRelationship, setReqRelationship] = useState('Parent');
  const [reqNote, setReqNote] = useState('');
  const [submittingProxy, setSubmittingProxy] = useState(false);

  // Digital Record Summary Pack State
  const [recordPackData, setRecordPackData] = useState(null);
  const [loadingPack, setLoadingPack] = useState(false);

  useEffect(() => {
    if (visible) {
      loadAccountData();
    }
  }, [visible]);

  useEffect(() => {
    if (visible && activeTab === 'audit') {
      loadAuditLog(auditDays);
    } else if (visible && activeTab === 'pack' && !recordPackData) {
      loadRecordPack();
    }
  }, [visible, activeTab, auditDays]);

  const loadAccountData = async () => {
    setLoading(true);
    try {
      const res = await MyChartService.getAccount();
      if (res && res.success && res.data) {
        setAccountData(res.data);
        if (res.data.default_scope && res.data.default_scope.length > 0) {
          setShareScope(res.data.default_scope);
        }
      }
    } catch (e) {
      console.warn('Failed to load MyChart account data:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLog = async (days) => {
    setLoading(true);
    try {
      const res = await MyChartService.getAccessLog(days);
      if (res && res.success && res.data) {
        setAuditLogData(res.data);
      }
    } catch (e) {
      console.warn('Failed to load audit log:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadRecordPack = async () => {
    setLoadingPack(true);
    try {
      const res = await MyChartService.getRecordPack();
      if (res && res.success && res.data) {
        setRecordPackData(res.data);
      }
    } catch (e) {
      console.warn('Failed to load record pack:', e);
    } finally {
      setLoadingPack(false);
    }
  };

  const handleCopy = (text, label = 'Link') => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      Alert.alert('Copied!', `${label} copied to clipboard.`);
    } else {
      Alert.alert(`${label}`, text, [{ text: 'OK' }]);
    }
  };

  const handleToggleScope = (key) => {
    if (shareScope.includes(key)) {
      if (shareScope.length === 1) {
        Alert.alert('Selection required', 'Choose at least one section to share.');
        return;
      }
      setShareScope(shareScope.filter((s) => s !== key));
    } else {
      setShareScope([...shareScope, key]);
    }
  };

  const handleCreateShare = async () => {
    if (!shareLabel.trim()) {
      Alert.alert('Required', 'Please specify who this link is for (e.g. Dr. Reyes).');
      return;
    }
    if (shareScope.length === 0) {
      Alert.alert('Required', 'Select at least one health section to share.');
      return;
    }

    setSubmittingShare(true);
    try {
      const res = await MyChartService.createShare({
        label: shareLabel.trim(),
        days: Number(shareDays),
        scope: shareScope
      });

      if (res && res.success) {
        Alert.alert(
          'Share Link Created',
          'Your secure doctor link is ready. Anyone with this link can view the selected sections until expiration.',
          [{ text: 'OK' }]
        );
        setShowShareForm(false);
        setShareLabel('');
        loadAccountData();
      } else {
        Alert.alert('Error', res?.message || 'Failed to generate link.');
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Network request failed.');
    } finally {
      setSubmittingShare(false);
    }
  };

  const handleRevokeShare = (shareId, label) => {
    Alert.alert(
      'Revoke Shared Link',
      `Are you sure you want to switch off access for "${label}"? Outside visitors will no longer be able to view your record.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch Off',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await MyChartService.revokeShare(shareId);
              if (res && res.success) {
                Alert.alert('Revoked', 'The link has been deactivated.');
                loadAccountData();
              } else {
                Alert.alert('Error', res?.message || 'Failed to revoke link.');
              }
            } catch (e) {
              Alert.alert('Error', e.message || 'Request failed.');
            }
          }
        }
      ]
    );
  };

  const handleRevokeProxy = (relatedPersonId, name) => {
    Alert.alert(
      'Revoke Family Access',
      `Remove access for ${name}? They will immediately lose permission to view your chart in MyChart.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove Access',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await MyChartService.revokeProxyAccess(relatedPersonId);
              if (res && res.success) {
                Alert.alert('Removed', `${name} can no longer access your chart.`);
                loadAccountData();
              } else {
                Alert.alert('Error', res?.message || 'Failed to revoke proxy access.');
              }
            } catch (e) {
              Alert.alert('Error', e.message || 'Request failed.');
            }
          }
        }
      ]
    );
  };

  const handleSubmitProxyRequest = async () => {
    if (!reqPatientNo.trim() || !reqLastName.trim() || !reqDob.trim()) {
      Alert.alert('Missing Details', 'Hospital number, family last name, and date of birth are required.');
      return;
    }

    setSubmittingProxy(true);
    try {
      const res = await MyChartService.requestProxyAccess({
        patient_no: reqPatientNo.trim(),
        last_name: reqLastName.trim(),
        birthdate: reqDob.trim(),
        relationship: reqRelationship,
        note: reqNote.trim()
      });

      if (res && res.success) {
        Alert.alert(
          'Request Submitted',
          'The hospital records desk will verify identity and relationship before granting access.',
          [{ text: 'OK' }]
        );
        setShowProxyForm(false);
        setReqPatientNo('');
        setReqLastName('');
        setReqDob('');
        setReqNote('');
        loadAccountData();
      } else {
        Alert.alert('Unable to Request', res?.message || 'Could not submit proxy request.');
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Request failed.');
    } finally {
      setSubmittingProxy(false);
    }
  };

  // Section labels from backend or standard fallbacks
  const availableSections = accountData?.sections || [
    { key: 'allergies', label: 'Allergies' },
    { key: 'problems', label: 'Conditions & Problems' },
    { key: 'medications', label: 'Active Medicines' },
    { key: 'immunizations', label: 'Immunisations' },
    { key: 'results', label: 'Test Results' },
    { key: 'visits', label: 'Visits & Encounters' },
    { key: 'care_team', label: 'My Care Team' }
  ];

  const relationships = accountData?.relationships || [
    'Parent',
    'Spouse',
    'Child',
    'Legal Guardian',
    'Caregiver',
    'Other'
  ];

  // Filtered audit items
  const auditItems = (auditLogData?.items || []).filter((item) => {
    if (auditFilter === 'all') return true;
    if (auditFilter === 'staff') return item.who_kind === 'staff';
    if (auditFilter === 'you') return item.who_kind === 'you';
    if (auditFilter === 'outside') return item.who_kind === 'outside' || item.kind === 'share';
    if (auditFilter === 'refused') return item.refused;
    return true;
  });

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIconBox}>
              <ShareIcon color="#0284c7" size={22} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Sharing & Audit Log</Text>
              <Text style={styles.headerSub}>Share Everywhere, Proxy & Access History</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <CloseIcon color="#64748b" size={20} />
          </TouchableOpacity>
        </View>

        {/* Segmented Top Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'shares' && styles.tabButtonActive]}
            onPress={() => setActiveTab('shares')}
            activeOpacity={0.8}
          >
            <ShareIcon color={activeTab === 'shares' ? '#0284c7' : '#64748b'} size={15} />
            <Text style={[styles.tabText, activeTab === 'shares' && styles.tabTextActive]}>
              Share Links
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'proxy' && styles.tabButtonActive]}
            onPress={() => setActiveTab('proxy')}
            activeOpacity={0.8}
          >
            <ProxyIcon color={activeTab === 'proxy' ? '#0284c7' : '#64748b'} size={15} />
            <Text style={[styles.tabText, activeTab === 'proxy' && styles.tabTextActive]}>
              Family Proxy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'audit' && styles.tabButtonActive]}
            onPress={() => setActiveTab('audit')}
            activeOpacity={0.8}
          >
            <ShieldCheckIcon color={activeTab === 'audit' ? '#0284c7' : '#64748b'} size={16} />
            <Text style={[styles.tabText, activeTab === 'audit' && styles.tabTextActive]}>
              Audit Log
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'pack' && styles.tabButtonActive]}
            onPress={() => setActiveTab('pack')}
            activeOpacity={0.8}
          >
            <CheckinIcon color={activeTab === 'pack' ? '#0284c7' : '#64748b'} size={15} />
            <Text style={[styles.tabText, activeTab === 'pack' && styles.tabTextActive]}>
              Summary Pack
            </Text>
          </TouchableOpacity>
        </View>

        {loading && !accountData && !auditLogData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0284c7" />
            <Text style={styles.loadingText}>Loading sharing settings…</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.contentScrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* ======================================================== */}
            {/* TAB 1: SHARE EVERYWHERE (OUTSIDE DOCTOR LINKS)            */}
            {/* ======================================================== */}
            {activeTab === 'shares' && (
              <View>
                {/* Banner Info */}
                <View style={styles.infoBanner}>
                  <ShareIcon color="#0284c7" size={18} />
                  <Text style={styles.infoBannerText}>
                    A secure share link lets an outside clinic or specialist view specific parts of your chart without an account. It expires automatically and can be switched off at any time.
                  </Text>
                </View>

                {/* Make a Link Action Button */}
                <TouchableOpacity
                  style={[styles.actionPrimaryBtn, showShareForm && styles.actionCancelBtn]}
                  onPress={() => setShowShareForm(!showShareForm)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.actionPrimaryBtnText, showShareForm && styles.actionCancelBtnText]}>
                    {showShareForm ? 'Cancel Link Creator' : '+ Make a Secure Share Link'}
                  </Text>
                </TouchableOpacity>

                {/* Inline Form: Create Share Link */}
                {showShareForm && (
                  <View style={styles.formCard}>
                    <Text style={styles.formCardTitle}>Generate Outside Doctor Link</Text>

                    <Text style={styles.inputLabel}>Who is this link for? *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Dr. John Reyes (City Medical)"
                      placeholderTextColor="#94a3b8"
                      value={shareLabel}
                      onChangeText={setShareLabel}
                      maxLength={150}
                    />

                    <Text style={styles.inputLabel}>Duration</Text>
                    <View style={styles.chipRow}>
                      {[7, 14, 30, 60, 90].map((d) => (
                        <TouchableOpacity
                          key={d}
                          style={[styles.durationChip, shareDays === d && styles.durationChipActive]}
                          onPress={() => setShareDays(d)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.durationChipText, shareDays === d && styles.durationChipTextActive]}>
                            {d} days {d === 14 ? '(Default)' : ''}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.inputLabel}>Choose Health Sections to Include</Text>
                    <View style={styles.scopeChecksContainer}>
                      {availableSections.map((sec) => {
                        const isChecked = shareScope.includes(sec.key);
                        return (
                          <TouchableOpacity
                            key={sec.key}
                            style={[styles.scopeCheckRow, isChecked && styles.scopeCheckRowActive]}
                            onPress={() => handleToggleScope(sec.key)}
                            activeOpacity={0.7}
                          >
                            <View style={[styles.checkboxBox, isChecked && styles.checkboxBoxActive]}>
                              {isChecked && <Text style={styles.checkboxCheck}>✓</Text>}
                            </View>
                            <Text style={[styles.scopeCheckText, isChecked && styles.scopeCheckTextActive]}>
                              {sec.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <TouchableOpacity
                      style={styles.submitFormBtn}
                      onPress={handleCreateShare}
                      disabled={submittingShare}
                      activeOpacity={0.8}
                    >
                      {submittingShare ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.submitFormBtnText}>Generate &amp; Activate Link</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* Section Header: Active and Past Links */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Shared Links ({accountData?.shares?.length || 0})</Text>
                  <Text style={styles.sectionSub}>Active and previously created physician links</Text>
                </View>

                {(!accountData?.shares || accountData.shares.length === 0) ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyCardEmoji}>🔗</Text>
                    <Text style={styles.emptyCardTitle}>No shared links yet</Text>
                    <Text style={styles.emptyCardSub}>
                      When you generate a link for an external physician, it will appear here with live access metrics.
                    </Text>
                  </View>
                ) : (
                  accountData.shares.map((share) => {
                    const isLive = share.live;
                    const isRevoked = share.revoked;
                    const isExpired = share.expired;

                    let statusBadge = { bg: '#ecfdf5', text: '#059669', label: 'Live' };
                    if (isRevoked) statusBadge = { bg: '#fef2f2', text: '#dc2626', label: 'Switched Off' };
                    else if (isExpired) statusBadge = { bg: '#f1f5f9', text: '#64748b', label: 'Expired' };

                    return (
                      <View key={share.id} style={[styles.shareCard, !isLive && styles.cardDimmed]}>
                        <View style={styles.shareCardHeader}>
                          <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.shareLabel}>{share.label}</Text>
                            <Text style={styles.shareDate}>
                              Expires {share.expires_at ? share.expires_at.split(' ')[0] : 'N/A'}
                            </Text>
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
                            <Text style={[styles.statusBadgeText, { color: statusBadge.text }]}>
                              {statusBadge.label}
                            </Text>
                          </View>
                        </View>

                        {/* Scope words tags */}
                        <View style={styles.scopeTagsRow}>
                          {(share.scope_words || []).map((w, idx) => (
                            <View key={idx} style={styles.scopeTag}>
                              <Text style={styles.scopeTagText}>{w}</Text>
                            </View>
                          ))}
                        </View>

                        {/* Metrics: access count */}
                        <View style={styles.metricsRow}>
                          <ClockIcon color="#64748b" size={13} />
                          <Text style={styles.metricsText}>
                            Viewed {share.access_count || 0} {share.access_count === 1 ? 'time' : 'times'}
                            {share.last_viewed_at ? ` · Last: ${share.last_viewed_at}` : ''}
                          </Text>
                        </View>

                        {/* URL box if live */}
                        {isLive && share.url && (
                          <View style={styles.urlBox}>
                            <Text style={styles.urlText} numberOfLines={1} ellipsizeMode="middle">
                              {share.url}
                            </Text>
                          </View>
                        )}

                        {/* Actions Row */}
                        {isLive && (
                          <View style={styles.shareActionsRow}>
                            <TouchableOpacity
                              style={styles.copyLinkBtn}
                              onPress={() => handleCopy(share.url, 'Share Link')}
                              activeOpacity={0.7}
                            >
                              <CopyIcon color="#0284c7" size={15} />
                              <Text style={styles.copyLinkBtnText}>Copy Link</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.revokeLinkBtn}
                              onPress={() => handleRevokeShare(share.id, share.label)}
                              activeOpacity={0.7}
                            >
                              <TrashIcon color="#dc2626" size={15} />
                              <Text style={styles.revokeLinkBtnText}>Switch Off</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* ======================================================== */}
            {/* TAB 2: FAMILY PROXY ACCESS                               */}
            {/* ======================================================== */}
            {activeTab === 'proxy' && (
              <View>
                {/* Banner Info */}
                <View style={styles.infoBanner}>
                  <ProxyIcon color="#0284c7" size={18} />
                  <Text style={styles.infoBannerText}>
                    Manage family members who can view your chart, or submit a request to link a dependent family member (child, spouse, or elderly parent).
                  </Text>
                </View>

                {/* Who has access to my chart */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Who Can View My Chart</Text>
                  <Text style={styles.sectionSub}>Delegates with authorized access to your records</Text>
                </View>

                {(!accountData?.access?.granted || accountData.access.granted.length === 0) ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyCardEmoji}>🔒</Text>
                    <Text style={styles.emptyCardTitle}>Only you have access</Text>
                    <Text style={styles.emptyCardSub}>
                      No outside family members or proxy delegates are currently authorized to view your chart.
                    </Text>
                  </View>
                ) : (
                  accountData.access.granted.map((g) => (
                    <View key={g.related_person_id} style={styles.proxyCard}>
                      <View style={styles.proxyCardAvatar}>
                        <Text style={styles.proxyCardAvatarText}>
                          {(g.name || 'P')[0].toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.proxyCardInfo}>
                        <Text style={styles.proxyCardName}>{g.name}</Text>
                        <Text style={styles.proxyCardMeta}>
                          {g.relationship} {g.since ? `· Active since ${g.since.split(' ')[0]}` : ''}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.revokeProxyBtn}
                        onPress={() => handleRevokeProxy(g.related_person_id, g.name)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.revokeProxyBtnText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}

                {/* Pending Requests on my chart */}
                {accountData?.access?.pending && accountData.access.pending.length > 0 && (
                  <View style={styles.pendingAlertBox}>
                    <Text style={styles.pendingAlertTitle}>Pending Inbound Requests</Text>
                    {accountData.access.pending.map((p, idx) => (
                      <Text key={idx} style={styles.pendingAlertItem}>
                        • {p.name} has requested access as your {p.relationship}. The hospital verification desk is reviewing proof.
                      </Text>
                    ))}
                  </View>
                )}

                {/* Section Header: Request access to someone else */}
                <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                  <Text style={styles.sectionTitle}>Request Access to Family Member</Text>
                  <Text style={styles.sectionSub}>Link a child, spouse, or elderly parent to your account</Text>
                </View>

                <TouchableOpacity
                  style={[styles.actionPrimaryBtn, showProxyForm && styles.actionCancelBtn]}
                  onPress={() => setShowProxyForm(!showProxyForm)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.actionPrimaryBtnText, showProxyForm && styles.actionCancelBtnText]}>
                    {showProxyForm ? 'Cancel Request Form' : '+ Request Access to a Family Chart'}
                  </Text>
                </TouchableOpacity>

                {showProxyForm && (
                  <View style={styles.formCard}>
                    <Text style={styles.formCardTitle}>Proxy Access Application</Text>
                    <Text style={styles.formCardSub}>
                      You will need their hospital patient number, family name, and date of birth.
                    </Text>

                    <Text style={styles.inputLabel}>Their Hospital Patient No. *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. PAT-000045"
                      placeholderTextColor="#94a3b8"
                      value={reqPatientNo}
                      onChangeText={setReqPatientNo}
                    />

                    <Text style={styles.inputLabel}>Their Family / Last Name *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Smith"
                      placeholderTextColor="#94a3b8"
                      value={reqLastName}
                      onChangeText={setReqLastName}
                    />

                    <Text style={styles.inputLabel}>Their Date of Birth (YYYY-MM-DD) *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94a3b8"
                      value={reqDob}
                      onChangeText={setReqDob}
                    />

                    <Text style={styles.inputLabel}>Your Relationship to Patient *</Text>
                    <View style={styles.chipRow}>
                      {relationships.map((rel) => (
                        <TouchableOpacity
                          key={rel}
                          style={[styles.durationChip, reqRelationship === rel && styles.durationChipActive]}
                          onPress={() => setReqRelationship(rel)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.durationChipText, reqRelationship === rel && styles.durationChipTextActive]}>
                            {rel}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.inputLabel}>Notes for Clinical Desk (Optional)</Text>
                    <TextInput
                      style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
                      placeholder="e.g. I am the legal guardian and accompany patient to appointments."
                      placeholderTextColor="#94a3b8"
                      multiline
                      value={reqNote}
                      onChangeText={setReqNote}
                    />

                    <TouchableOpacity
                      style={styles.submitFormBtn}
                      onPress={handleSubmitProxyRequest}
                      disabled={submittingProxy}
                      activeOpacity={0.8}
                    >
                      {submittingProxy ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.submitFormBtnText}>Submit Proxy Application</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* List of my submitted requests */}
                {accountData?.requests && accountData.requests.length > 0 && (
                  <View style={{ marginTop: 16 }}>
                    <Text style={styles.subSectionTitle}>My Submitted Applications</Text>
                    {accountData.requests.map((r, idx) => {
                      let badge = { bg: '#fef3c7', text: '#b45309', label: 'Being Reviewed' };
                      if (r.status === 'approved') badge = { bg: '#ecfdf5', text: '#059669', label: 'Granted' };
                      else if (r.status === 'denied') badge = { bg: '#fef2f2', text: '#dc2626', label: 'Refused' };

                      return (
                        <View key={idx} style={styles.appCard}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.appCardTitle}>{r.about}</Text>
                            <Text style={styles.appCardSub}>
                              Requested as {r.relationship} · {r.created_at ? r.created_at.split(' ')[0] : ''}
                            </Text>
                            {r.reason ? <Text style={styles.appCardReason}>{r.reason}</Text> : null}
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                            <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* ======================================================== */}
            {/* TAB 3: AUDIT LOG (WHO ACCESSED MY CHART)                  */}
            {/* ======================================================== */}
            {activeTab === 'audit' && (
              <View>
                {/* Banner Info */}
                <View style={styles.infoBanner}>
                  <ShieldCheckIcon color="#0284c7" size={18} />
                  <Text style={styles.infoBannerText}>
                    Full security accounting of every view, download, and external link access to your health chart in the portal.
                  </Text>
                </View>

                {/* Audit Stats Summary Bar */}
                {auditLogData?.counts && (
                  <View style={styles.statsBarGrid}>
                    <View style={styles.statBox}>
                      <Text style={styles.statBoxNum}>{auditLogData.counts.staff || 0}</Text>
                      <Text style={styles.statBoxLabel}>Hospital Staff</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statBoxNum}>{auditLogData.counts.you || 0}</Text>
                      <Text style={styles.statBoxLabel}>You (Self)</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statBoxNum}>{auditLogData.counts.outside || 0}</Text>
                      <Text style={styles.statBoxLabel}>External Links</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={[styles.statBoxNum, { color: '#dc2626' }]}>
                        {auditLogData.counts.refused || 0}
                      </Text>
                      <Text style={styles.statBoxLabel}>Refused</Text>
                    </View>
                  </View>
                )}

                {/* Timeframe Chips */}
                <View style={styles.timeframeRow}>
                  {[7, 30, 90, 365].map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.timeChip, auditDays === d && styles.timeChipActive]}
                      onPress={() => setAuditDays(d)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.timeChipText, auditDays === d && styles.timeChipTextActive]}>
                        Last {d === 365 ? '1 Year' : `${d} Days`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Filter Pills */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterPillsScroll}>
                  {[
                    { id: 'all', label: 'All Events' },
                    { id: 'staff', label: 'Hospital Staff' },
                    { id: 'you', label: 'You' },
                    { id: 'outside', label: 'External Links' },
                    { id: 'refused', label: 'Refused Attempts' }
                  ].map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      style={[styles.filterPill, auditFilter === f.id && styles.filterPillActive]}
                      onPress={() => setAuditFilter(f.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterPillText, auditFilter === f.id && styles.filterPillTextActive]}>
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Audit Items List */}
                {auditItems.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyCardEmoji}>🛡️</Text>
                    <Text style={styles.emptyCardTitle}>No access records</Text>
                    <Text style={styles.emptyCardSub}>
                      No access events recorded matching this timeframe and filter.
                    </Text>
                  </View>
                ) : (
                  auditItems.map((item, idx) => {
                    let whoKindBadge = { bg: '#e0f2fe', text: '#0284c7', label: 'Hospital Staff' };
                    if (item.who_kind === 'you') whoKindBadge = { bg: '#ecfdf5', text: '#059669', label: 'You' };
                    else if (item.who_kind === 'outside') whoKindBadge = { bg: '#f5f3ff', text: '#7c3aed', label: 'External Link' };
                    else if (item.who_kind === 'proxy') whoKindBadge = { bg: '#fffbeb', text: '#b45309', label: 'Proxy Delegate' };

                    return (
                      <View key={idx} style={[styles.auditCard, item.refused && styles.auditCardRefused]}>
                        <View style={styles.auditCardHeader}>
                          <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.auditWho}>{item.who}</Text>
                            <Text style={styles.auditTime}>{item.at}</Text>
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: whoKindBadge.bg }]}>
                            <Text style={[styles.statusBadgeText, { color: whoKindBadge.text }]}>
                              {whoKindBadge.label}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.auditWhat}>{item.what}</Text>
                        {item.detail ? <Text style={styles.auditDetail}>{item.detail}</Text> : null}

                        {item.refused && (
                          <View style={styles.refusedNotice}>
                            <Text style={styles.refusedNoticeText}>⚠️ Access was blocked &amp; denied by security policy</Text>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* ======================================================== */}
            {/* TAB 4: DIGITAL SUMMARY PACK (EXPORT/PRINT SUMMARY)        */}
            {/* ======================================================== */}
            {activeTab === 'pack' && (
              <View>
                <View style={styles.infoBanner}>
                  <CheckinIcon color="#0284c7" size={18} />
                  <Text style={styles.infoBannerText}>
                    A complete digital health record summary. Copy, review, or print your health information for your personal records or another clinic.
                  </Text>
                </View>

                {loadingPack ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0284c7" />
                    <Text style={styles.loadingText}>Compiling health summary pack…</Text>
                  </View>
                ) : recordPackData ? (
                  <View>
                    <View style={styles.packHeaderCard}>
                      <Text style={styles.packPatientName}>
                        {recordPackData.patient?.name || 'Patient Summary'}
                      </Text>
                      <Text style={styles.packMeta}>
                        DOB: {recordPackData.patient?.birthdate || 'N/A'} · MRN: {recordPackData.patient?.patient_no || 'N/A'}
                      </Text>
                      <Text style={styles.packGeneratedAt}>
                        Generated: {new Date().toLocaleDateString()}
                      </Text>

                      <TouchableOpacity
                        style={styles.copyPackBtn}
                        onPress={() => handleCopy(JSON.stringify(recordPackData, null, 2), 'Summary Pack Data')}
                        activeOpacity={0.7}
                      >
                        <CopyIcon color="#0284c7" size={16} />
                        <Text style={styles.copyPackBtnText}>Copy Digital Pack JSON</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Allergies Section */}
                    <View style={styles.packSection}>
                      <Text style={styles.packSectionTitle}>⚠️ Allergies</Text>
                      {(!recordPackData.allergies || recordPackData.allergies.length === 0) ? (
                        <Text style={styles.packEmptyText}>No known drug allergies reported.</Text>
                      ) : (
                        recordPackData.allergies.map((a, i) => (
                          <View key={i} style={styles.packItemRow}>
                            <Text style={styles.packItemMain}>{a.allergen || a.substance || a.name}</Text>
                            <Text style={styles.packItemSub}>{a.reaction || a.severity || 'Recorded allergy'}</Text>
                          </View>
                        ))
                      )}
                    </View>

                    {/* Conditions Section */}
                    <View style={styles.packSection}>
                      <Text style={styles.packSectionTitle}>🩺 Conditions &amp; Problems</Text>
                      {(!recordPackData.problems || recordPackData.problems.length === 0) ? (
                        <Text style={styles.packEmptyText}>No chronic conditions on file.</Text>
                      ) : (
                        recordPackData.problems.map((p, i) => (
                          <View key={i} style={styles.packItemRow}>
                            <Text style={styles.packItemMain}>{p.condition_name || p.name || p.icd10_code}</Text>
                            <Text style={styles.packItemSub}>{p.status || 'Active'} · Diagnosed {p.diagnosed_date || 'N/A'}</Text>
                          </View>
                        ))
                      )}
                    </View>

                    {/* Active Medications Section */}
                    <View style={styles.packSection}>
                      <Text style={styles.packSectionTitle}>💊 Active Medications</Text>
                      {(!recordPackData.medications || recordPackData.medications.length === 0) ? (
                        <Text style={styles.packEmptyText}>No active prescription orders.</Text>
                      ) : (
                        recordPackData.medications.map((m, i) => (
                          <View key={i} style={styles.packItemRow}>
                            <Text style={styles.packItemMain}>{m.drug_name || m.name}</Text>
                            <Text style={styles.packItemSub}>{m.dosage || ''} {m.frequency || ''} - {m.directions || ''}</Text>
                          </View>
                        ))
                      )}
                    </View>

                    {/* Recent Lab Results */}
                    <View style={styles.packSection}>
                      <Text style={styles.packSectionTitle}>🧪 Released Test Results</Text>
                      {(!recordPackData.results || recordPackData.results.length === 0) ? (
                        <Text style={styles.packEmptyText}>No released lab orders on file.</Text>
                      ) : (
                        recordPackData.results.slice(0, 10).map((r, i) => (
                          <View key={i} style={styles.packItemRow}>
                            <Text style={styles.packItemMain}>{r.test_name || r.order_name || 'Lab Order'}</Text>
                            <Text style={styles.packItemSub}>Released {r.collection_date || r.verified_at || 'Recently'}</Text>
                          </View>
                        ))
                      )}
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyCardEmoji}>📄</Text>
                    <Text style={styles.emptyCardTitle}>Unable to compile summary</Text>
                    <TouchableOpacity style={styles.actionPrimaryBtn} onPress={loadRecordPack}>
                      <Text style={styles.actionPrimaryBtnText}>Retry Summary Compile</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
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
    backgroundColor: '#f8fafc'
  },
  headerBar: {
    height: 65,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  headerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  headerTextContainer: {
    flex: 1
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a'
  },
  headerSub: {
    fontSize: 12,
    color: '#64748b'
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 3,
    borderRadius: 8,
    backgroundColor: '#f8fafc'
  },
  tabButtonActive: {
    backgroundColor: '#e0f2fe'
  },
  tabText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 4
  },
  tabTextActive: {
    color: '#0284c7'
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b'
  },
  contentScroll: {
    flex: 1
  },
  contentScrollContainer: {
    padding: 16,
    paddingBottom: 40
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    alignItems: 'flex-start'
  },
  infoBannerText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#0369a1',
    lineHeight: 19
  },
  actionPrimaryBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  actionPrimaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  },
  actionCancelBtn: {
    backgroundColor: '#f1f5f9'
  },
  actionCancelBtnText: {
    color: '#475569'
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20
  },
  formCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4
  },
  formCardSub: {
    fontSize: 12.5,
    color: '#64748b',
    marginBottom: 14,
    lineHeight: 18
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 12
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a'
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6
  },
  durationChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  durationChipActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0284c7'
  },
  durationChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569'
  },
  durationChipTextActive: {
    color: '#0284c7'
  },
  scopeChecksContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14
  },
  scopeCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6
  },
  scopeCheckRowActive: {
    backgroundColor: '#ffffff'
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  checkboxBoxActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7'
  },
  checkboxCheck: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800'
  },
  scopeCheckText: {
    fontSize: 13.5,
    color: '#475569'
  },
  scopeCheckTextActive: {
    fontWeight: '600',
    color: '#0f172a'
  },
  submitFormBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8
  },
  submitFormBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  },
  sectionHeader: {
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a'
  },
  sectionSub: {
    fontSize: 12.5,
    color: '#64748b'
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginVertical: 8
  },
  emptyCardEmoji: {
    fontSize: 32,
    marginBottom: 8
  },
  emptyCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4
  },
  emptyCardSub: {
    fontSize: 12.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18
  },
  shareCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12
  },
  cardDimmed: {
    backgroundColor: '#f8fafc',
    opacity: 0.75
  },
  shareCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  shareLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a'
  },
  shareDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700'
  },
  scopeTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10
  },
  scopeTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  scopeTagText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600'
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  metricsText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 5
  },
  urlBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10
  },
  urlText: {
    fontSize: 12,
    color: '#0284c7',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  shareActionsRow: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10
  },
  copyLinkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingVertical: 8,
    borderRadius: 8
  },
  copyLinkBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0284c7',
    marginLeft: 5
  },
  revokeLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  revokeLinkBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#dc2626',
    marginLeft: 4
  },
  proxyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10
  },
  proxyCardAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f5f3ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  proxyCardAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7c3aed'
  },
  proxyCardInfo: {
    flex: 1
  },
  proxyCardName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0f172a'
  },
  proxyCardMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  revokeProxyBtn: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca'
  },
  revokeProxyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626'
  },
  pendingAlertBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 10,
    padding: 12,
    marginVertical: 10
  },
  pendingAlertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4
  },
  pendingAlertItem: {
    fontSize: 12,
    color: '#b45309',
    lineHeight: 18
  },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8
  },
  appCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a'
  },
  appCardSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  appCardReason: {
    fontSize: 11.5,
    color: '#475569',
    fontStyle: 'italic',
    marginTop: 4
  },
  statsBarGrid: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16
  },
  statBox: {
    flex: 1,
    alignItems: 'center'
  },
  statBoxNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a'
  },
  statBoxLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  timeframeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  timeChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  timeChipActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0284c7'
  },
  timeChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748b'
  },
  timeChipTextActive: {
    color: '#0284c7'
  },
  filterPillsScroll: {
    marginBottom: 14
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8
  },
  filterPillActive: {
    backgroundColor: '#0284c7'
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b'
  },
  filterPillTextActive: {
    color: '#ffffff'
  },
  auditCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10
  },
  auditCardRefused: {
    borderColor: '#fca5a5',
    backgroundColor: '#fff5f5'
  },
  auditCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  auditWho: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a'
  },
  auditTime: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2
  },
  auditWhat: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginTop: 4
  },
  auditDetail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 16
  },
  refusedNotice: {
    marginTop: 8,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  refusedNoticeText: {
    fontSize: 11.5,
    color: '#991b1b',
    fontWeight: '600'
  },
  packHeaderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16
  },
  packPatientName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a'
  },
  packMeta: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4
  },
  packGeneratedAt: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 12
  },
  copyPackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingVertical: 9,
    borderRadius: 8
  },
  copyPackBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284c7',
    marginLeft: 6
  },
  packSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12
  },
  packSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10
  },
  packEmptyText: {
    fontSize: 12.5,
    color: '#94a3b8',
    fontStyle: 'italic'
  },
  packItemRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 8
  },
  packItemMain: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1e293b'
  },
  packItemSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  }
});
