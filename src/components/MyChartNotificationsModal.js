import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Switch,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { MyChartService } from '../api/mychart';
import {
  BellIcon,
  CloseIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  LabIcon,
  VisitsIcon,
  BillingIcon,
  CheckinIcon,
  ChatIcon
} from './Icons';

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr.replace(/-/g, '/'));
    const now = new Date();
    const diffSec = Math.floor((now - d) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  } catch (e) {
    return String(dateStr).slice(0, 10);
  }
};

const getEventIcon = (eventType, linkTab) => {
  if (linkTab === 'results' || eventType?.includes('result')) {
    return { icon: <LabIcon color="#2563eb" size={18} />, bg: '#eff6ff' };
  }
  if (linkTab === 'billing' || eventType?.includes('statement') || eventType?.includes('payment')) {
    return { icon: <BillingIcon color="#059669" size={18} />, bg: '#ecfdf5' };
  }
  if (linkTab === 'checkin' || eventType?.includes('checkin')) {
    return { icon: <CheckinIcon color="#d97706" size={18} />, bg: '#fffbeb' };
  }
  if (linkTab === 'messages' || eventType?.includes('message')) {
    return { icon: <ChatIcon color="#0284c7" size={18} />, bg: '#f0f9ff' };
  }
  return { icon: <VisitsIcon color="#7c3aed" size={18} />, bg: '#f5f3ff' };
};

export default function MyChartNotificationsModal({
  visible,
  onClose,
  onNavigateTab,
  onUnreadCountChange
}) {
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'preferences'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Feed State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Preferences State
  const [prefItems, setPrefItems] = useState([]);
  const [masterSwitches, setMasterSwitches] = useState({ in_app: true, email: true, sms: false });
  const [prefLoading, setPrefLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await MyChartService.getNotifications(false);
      if (res && res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.items || []);
        setNotifications(list);
        const count = list.filter((n) => !n.read_at && n.status !== 'read').length;
        setUnreadCount(count);
        if (onUnreadCountChange) onUnreadCountChange(count);
      }
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPreferences = async () => {
    setPrefLoading(true);
    try {
      const res = await MyChartService.getNotificationPreferences();
      if (res && res.success && res.data) {
        setPrefItems(res.data.items || []);
        if (res.data.master) setMasterSwitches(res.data.master);
      }
    } catch (err) {
      console.warn('Failed to load notification preferences:', err);
    } finally {
      setPrefLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      setLoading(true);
      fetchNotifications();
      if (activeTab === 'preferences') {
        fetchPreferences();
      }
    }
  }, [visible, activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    if (activeTab === 'feed') {
      fetchNotifications();
    } else {
      fetchPreferences().then(() => setRefreshing(false));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await MyChartService.markNotificationRead(null);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
      if (onUnreadCountChange) onUnreadCountChange(0);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleNotificationPress = async (item) => {
    if (!item.read_at) {
      MyChartService.markNotificationRead(item.id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (onUnreadCountChange) onUnreadCountChange(Math.max(0, unreadCount - 1));
    }

    if (item.link_tab && onNavigateTab) {
      onClose();
      if (item.link_tab === 'results') onNavigateTab('mychart_results');
      else if (item.link_tab === 'billing') onNavigateTab('mychart_billing');
      else if (item.link_tab === 'visits') onNavigateTab('mychart_visits');
      else if (item.link_tab === 'checkin') onNavigateTab('mychart_checkin');
      else if (item.link_tab === 'messages') onNavigateTab('messages');
    }
  };

  const handleTogglePreference = async (eventType, channel, currentValue) => {
    const newValue = !currentValue;

    // Optimistically update UI
    setPrefItems((prev) =>
      prev.map((item) => {
        if (item.event_type === eventType) {
          return {
            ...item,
            channels: {
              ...item.channels,
              [channel]: {
                ...item.channels[channel],
                enabled: newValue,
                chosen: newValue
              }
            }
          };
        }
        return item;
      })
    );

    try {
      await MyChartService.saveNotificationPreference({
        event_type: eventType,
        channel,
        enabled: newValue ? 1 : 0
      });
    } catch (err) {
      console.warn('Failed to save preference:', err);
      // Revert if error
      fetchPreferences();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Top Bar */}
          <View style={styles.topNav}>
            <View style={styles.titleColumn}>
              <View style={styles.titleRow}>
                <View style={styles.titleIconBox}>
                  <BellIcon color="#0284c7" size={20} />
                </View>
                <Text style={styles.screenTitle}>Notifications &amp; Alerts</Text>
              </View>
              <Text style={styles.screenSubtitle}>
                Clinical alerts, visit notices &amp; delivery preferences
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <CloseIcon color="#64748b" size={18} />
            </TouchableOpacity>
          </View>

          {/* Segmented Tab Bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'feed' && styles.tabBtnActive]}
              onPress={() => setActiveTab('feed')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabBtnText, activeTab === 'feed' && styles.tabBtnTextActive]}>
                Alerts Feed {unreadCount > 0 ? `(${unreadCount})` : ''}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'preferences' && styles.tabBtnActive]}
              onPress={() => setActiveTab('preferences')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabBtnText, activeTab === 'preferences' && styles.tabBtnTextActive]}>
                Delivery Preferences
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'feed' ? (
            /* ================= NOTIFICATIONS FEED TAB ================= */
            <ScrollView
              contentContainerStyle={styles.listContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284c7']} />}
              showsVerticalScrollIndicator={false}
            >
              {unreadCount > 0 && (
                <View style={styles.markAllRow}>
                  <Text style={styles.unreadNote}>
                    You have <Text style={{ fontWeight: '800' }}>{unreadCount}</Text> unread alerts
                  </Text>
                  <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
                    <Text style={styles.markAllBtnText}>Mark all as read</Text>
                  </TouchableOpacity>
                </View>
              )}

              {loading ? (
                <View style={styles.centerBox}>
                  <ActivityIndicator size="large" color="#0284c7" />
                  <Text style={styles.loadingText}>Fetching recent notifications...</Text>
                </View>
              ) : notifications.length === 0 ? (
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIconCircle}>
                    <BellIcon color="#94a3b8" size={32} />
                  </View>
                  <Text style={styles.emptyTitle}>All Caught Up!</Text>
                  <Text style={styles.emptyDesc}>
                    You have no new alerts. Important notifications about released test results, upcoming appointment check-ins, and messages will appear here.
                  </Text>
                </View>
              ) : (
                notifications.map((n, idx) => {
                  const isUnread = !n.read_at && n.status !== 'read';
                  const eventCfg = getEventIcon(n.event_type, n.link_tab);

                  return (
                    <TouchableOpacity
                      key={`notif-${n.id || idx}`}
                      style={[styles.notifCard, isUnread && styles.notifCardUnread]}
                      activeOpacity={0.7}
                      onPress={() => handleNotificationPress(n)}
                    >
                      <View style={[styles.notifIconCircle, { backgroundColor: eventCfg.bg }]}>
                        {eventCfg.icon}
                      </View>

                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={styles.notifTopRow}>
                          <Text style={[styles.notifTitle, isUnread && styles.notifTitleUnread]}>
                            {n.title}
                          </Text>
                          <Text style={styles.notifTime}>{formatTimeAgo(n.created_at)}</Text>
                        </View>

                        <Text style={styles.notifBody}>{n.body}</Text>

                        {n.link_tab && (
                          <View style={styles.actionRow}>
                            <Text style={styles.actionLinkText}>
                              {n.link_tab === 'results'
                                ? 'View released results →'
                                : n.link_tab === 'billing'
                                ? 'View billing statement →'
                                : n.link_tab === 'checkin'
                                ? 'Open e-Check-In →'
                                : n.link_tab === 'messages'
                                ? 'Open conversation →'
                                : 'View details →'}
                            </Text>
                          </View>
                        )}
                      </View>

                      {isUnread && <View style={styles.unreadDot} />}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          ) : (
            /* ================= PREFERENCES TAB ================= */
            <ScrollView
              contentContainerStyle={styles.listContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284c7']} />}
              showsVerticalScrollIndicator={false}
            >
              {/* Privacy Notice Banner */}
              <View style={styles.privacyBanner}>
                <Text style={styles.privacyBannerTitle}>🔒 Privacy &amp; Clinical Safety</Text>
                <Text style={styles.privacyBannerText}>
                  To protect your medical privacy, automated notifications will inform you that an update is ready without transmitting sensitive clinical diagnostics over unencrypted email or SMS.
                </Text>
              </View>

              {prefLoading ? (
                <View style={styles.centerBox}>
                  <ActivityIndicator size="large" color="#0284c7" />
                  <Text style={styles.loadingText}>Loading notification settings...</Text>
                </View>
              ) : prefItems.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyDesc}>No customizable preference channels available.</Text>
                </View>
              ) : (
                prefItems.map((item) => (
                  <View key={`pref-${item.event_type}`} style={styles.prefCard}>
                    <Text style={styles.prefLabel}>{item.label}</Text>
                    {item.description ? (
                      <Text style={styles.prefDesc}>{item.description}</Text>
                    ) : null}

                    <View style={styles.prefChannelsGroup}>
                      {/* In-App Channel */}
                      {item.channels?.in_app && (
                        <View style={styles.channelRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.channelName}>📱 In-App Portal Bell</Text>
                            <Text style={styles.channelSub}>Instant notification in the mobile app</Text>
                          </View>
                          <Switch
                            value={!!item.channels.in_app.enabled}
                            onValueChange={() =>
                              handleTogglePreference(item.event_type, 'in_app', item.channels.in_app.enabled)
                            }
                            trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
                            thumbColor={item.channels.in_app.enabled ? '#2563eb' : '#f1f5f9'}
                          />
                        </View>
                      )}

                      {/* Email Channel */}
                      {item.channels?.email && (
                        <View style={styles.channelRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.channelName}>📧 Email Notification</Text>
                            <Text style={styles.channelSub}>
                              {masterSwitches.email
                                ? 'Alert sent to your verified email'
                                : 'Disabled globally by hospital admin'}
                            </Text>
                          </View>
                          <Switch
                            value={!!item.channels.email.enabled && masterSwitches.email}
                            disabled={!masterSwitches.email}
                            onValueChange={() =>
                              handleTogglePreference(item.event_type, 'email', item.channels.email.enabled)
                            }
                            trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
                            thumbColor={item.channels.email.enabled && masterSwitches.email ? '#2563eb' : '#f1f5f9'}
                          />
                        </View>
                      )}

                      {/* SMS Channel */}
                      {item.channels?.sms && (
                        <View style={styles.channelRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.channelName}>💬 SMS Text Message</Text>
                            <Text style={styles.channelSub}>
                              {masterSwitches.sms
                                ? 'Sent to your mobile phone number'
                                : 'SMS gateway currently offline'}
                            </Text>
                          </View>
                          <Switch
                            value={!!item.channels.sms.enabled && masterSwitches.sms}
                            disabled={!masterSwitches.sms}
                            onValueChange={() =>
                              handleTogglePreference(item.event_type, 'sms', item.channels.sms.enabled)
                            }
                            trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
                            thumbColor={item.channels.sms.enabled && masterSwitches.sms ? '#2563eb' : '#f1f5f9'}
                          />
                        </View>
                      )}
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  container: {
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
    backgroundColor: '#e0f2fe',
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 10
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#f1f5f9'
  },
  tabBtnActive: {
    backgroundColor: '#0284c7'
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b'
  },
  tabBtnTextActive: {
    color: '#ffffff'
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
  markAllRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 4
  },
  unreadNote: {
    fontSize: 12,
    color: '#475569'
  },
  markAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#e0f2fe'
  },
  markAllBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0284c7'
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
    backgroundColor: '#f1f5f9',
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
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12
  },
  notifCardUnread: {
    backgroundColor: '#f8fafc',
    borderColor: '#bae6fd'
  },
  notifIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  notifTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1
  },
  notifTitleUnread: {
    fontWeight: '800',
    color: '#0f172a'
  },
  notifTime: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 6
  },
  notifBody: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 17,
    marginTop: 2
  },
  actionRow: {
    marginTop: 6
  },
  actionLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7'
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0284c7',
    marginTop: 6
  },

  /* Preferences Styles */
  privacyBanner: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    gap: 4
  },
  privacyBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e40af'
  },
  privacyBannerText: {
    fontSize: 11.5,
    color: '#1e3a8a',
    lineHeight: 16
  },
  prefCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10
  },
  prefLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a'
  },
  prefDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16
  },
  prefChannelsGroup: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
    gap: 10
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  channelName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b'
  },
  channelSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1
  }
});
