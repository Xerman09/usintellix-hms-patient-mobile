import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { MessagingService } from '../api/messages';
import { ChatIcon } from './Icons';

export default function MessagesModal({ visible, onClose, currentUser }) {
  // Navigation tabs: 'messages' | 'reminders' | 'recalls'
  const [activeTab, setActiveTab] = useState('messages');
  const [scopeFilter, setScopeFilter] = useState('active'); // 'active' | 'all' | 'inactive'

  // Data states
  const [myMessages, setMyMessages] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [recalls, setRecalls] = useState([]);
  const [loading, setLoading] = useState(false);

  // Selected row IDs for deletion
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Conversation thread view
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyText, setReplyText] = useState('');

  // Add New Message Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [messageTypes, setMessageTypes] = useState([]);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const chatScrollRef = useRef(null);

  useEffect(() => {
    if (visible) {
      loadTabData(activeTab, scopeFilter);
    } else {
      setActiveConversationId(null);
      setActiveConversation(null);
      setThreadMessages([]);
      setShowAddModal(false);
      setSelectedIds(new Set());
    }
  }, [visible, activeTab, scopeFilter]);

  const loadTabData = async (tab, scope) => {
    setLoading(true);
    try {
      if (tab === 'messages') {
        const res = await MessagingService.getMyMessages(scope);
        if (res.success && Array.isArray(res.data)) {
          setMyMessages(res.data);
        } else {
          setMyMessages([]);
        }
      } else if (tab === 'reminders') {
        const res = await MessagingService.getMyReminders();
        if (res.success && Array.isArray(res.data)) {
          setReminders(res.data);
        } else {
          setReminders([]);
        }
      } else if (tab === 'recalls') {
        const res = await MessagingService.getMyRecalls();
        if (res.success && Array.isArray(res.data)) {
          setRecalls(res.data);
        } else {
          setRecalls([]);
        }
      }
    } catch (e) {
      console.error('Error loading messaging data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddMessage = async () => {
    setShowAddModal(true);
    setSubject('');
    setMessageBody('');
    try {
      const [recRes, typesRes] = await Promise.all([
        MessagingService.getRecipients(),
        MessagingService.getMessageTypes()
      ]);
      if (recRes.success && Array.isArray(recRes.data)) {
        setRecipients(recRes.data);
        if (recRes.data.length > 0) {
          setSelectedRecipientId(recRes.data[0].id.toString());
        }
      }
      if (typesRes.success && Array.isArray(typesRes.data)) {
        setMessageTypes(typesRes.data);
        if (typesRes.data.length > 0) {
          setSelectedTypeId(typesRes.data[0].id.toString());
        }
      }
    } catch (e) {
      console.error('Error opening compose dialog:', e);
    }
  };

  const handleSendNewMessage = async () => {
    if (!selectedRecipientId) {
      Alert.alert('Required', 'Please select a recipient from your care team.');
      return;
    }
    if (!messageBody.trim()) {
      Alert.alert('Required', 'Please write your message body.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await MessagingService.startConversation(
        [parseInt(selectedRecipientId, 10)],
        subject.trim() || 'Portal Message',
        messageBody.trim(),
        {
          type_id: selectedTypeId ? parseInt(selectedTypeId, 10) : null
        }
      );

      if (res.success) {
        Alert.alert('Success', 'Message sent successfully.');
        setShowAddModal(false);
        setMessageBody('');
        setSubject('');
        await loadTabData('messages', scopeFilter);
      } else {
        Alert.alert('Error', res.message || 'Failed to send message.');
      }
    } catch (e) {
      console.error('Send error:', e);
      Alert.alert('Error', 'Failed to send message.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenThread = async (msg) => {
    if (!msg.conversation_id) return;
    setActiveConversationId(msg.conversation_id);
    setThreadLoading(true);

    try {
      const [convRes, msgsRes] = await Promise.all([
        MessagingService.getConversation(msg.conversation_id),
        MessagingService.getConversationMessages(msg.conversation_id)
      ]);

      if (convRes.success && convRes.data) {
        setActiveConversation(convRes.data);
      }
      if (msgsRes.success && Array.isArray(msgsRes.data)) {
        setThreadMessages(msgsRes.data);
      } else {
        setThreadMessages([]);
      }

      await MessagingService.markRead(msg.conversation_id);
      setMyMessages((prev) =>
        prev.map((m) =>
          m.conversation_id === msg.conversation_id ? { ...m, is_unread: 0 } : m
        )
      );
    } catch (e) {
      console.error('Error opening thread:', e);
    } finally {
      setThreadLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeConversationId) return;

    const bodyToSend = replyText.trim();
    setReplyText('');
    setSubmitting(true);

    try {
      const res = await MessagingService.sendMessage(activeConversationId, bodyToSend);
      if (res.success && res.data) {
        setThreadMessages((prev) => [...prev, res.data]);
        loadTabData('messages', scopeFilter);
      } else {
        Alert.alert('Error', res.message || 'Failed to send reply.');
        setReplyText(bodyToSend);
      }
    } catch (e) {
      console.error('Error replying:', e);
      Alert.alert('Error', 'Failed to send reply.');
      setReplyText(bodyToSend);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    Alert.alert(
      'Delete Messages',
      `Delete ${selectedIds.size} selected message(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              for (const id of Array.from(selectedIds)) {
                await MessagingService.deleteMessage(id);
              }
              setSelectedIds(new Set());
              await loadTabData('messages', scopeFilter);
            } catch (e) {
              console.error('Delete error:', e);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.sheetContainer}>
        
        {/* ================= CLEAN MODAL HEADER ================= */}
        <View style={styles.sheetHeader}>
          <View style={styles.headerTitleRow}>
            <View style={styles.iconBadge}>
              <ChatIcon color="#2563eb" size={18} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Messages</Text>
              <Text style={styles.headerSub}>
                Send and manage messages, reminders, and recalls.
              </Text>
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

        {/* ================= 3 TABS: Messages | Reminders | Recalls ================= */}
        <View style={styles.tabBarWrapper}>
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'messages' && styles.tabBtnActive]}
              onPress={() => {
                setActiveTab('messages');
                setActiveConversationId(null);
              }}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'messages' && styles.tabBtnTextActive
                ]}
              >
                Messages
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'reminders' && styles.tabBtnActive]}
              onPress={() => {
                setActiveTab('reminders');
                setActiveConversationId(null);
              }}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'reminders' && styles.tabBtnTextActive
                ]}
              >
                Reminders
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'recalls' && styles.tabBtnActive]}
              onPress={() => {
                setActiveTab('recalls');
                setActiveConversationId(null);
              }}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'recalls' && styles.tabBtnTextActive
                ]}
              >
                Recalls
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ================= ACTIVE VIEW ================= */}
        {activeConversationId ? (
          /* ================= CHAT THREAD VIEW ================= */
          <View style={styles.threadContainer}>
            <View style={styles.threadHeader}>
              <TouchableOpacity
                onPress={() => {
                  setActiveConversationId(null);
                  setActiveConversation(null);
                  loadTabData('messages', scopeFilter);
                }}
                style={styles.backBtn}
              >
                <Text style={styles.backBtnText}>‹ Back</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.threadSubject} numberOfLines={1}>
                  {activeConversation?.subject || 'Message Thread'}
                </Text>
                <Text style={styles.threadParticipants} numberOfLines={1}>
                  {activeConversation?.participants
                    ?.map((p) => p.display_name)
                    .join(', ') || 'Care Team'}
                </Text>
              </View>
            </View>

            {threadLoading ? (
              <View style={styles.loadingArea}>
                <ActivityIndicator size="small" color="#2563eb" />
              </View>
            ) : (
              <ScrollView
                ref={chatScrollRef}
                style={styles.threadMessagesScroll}
                contentContainerStyle={styles.threadMessagesContent}
                onContentSizeChange={() =>
                  chatScrollRef.current?.scrollToEnd({ animated: true })
                }
              >
                {threadMessages.length === 0 ? (
                  <Text style={styles.emptyDesc}>No messages in this thread.</Text>
                ) : (
                  threadMessages.map((m, idx) => {
                    const isMe = m.sender_id === (currentUser?.id || 7);
                    return (
                      <View
                        key={m.id || idx}
                        style={[
                          styles.bubbleWrap,
                          isMe ? styles.bubbleWrapRight : styles.bubbleWrapLeft
                        ]}
                      >
                        <Text style={styles.bubbleSender}>
                          {isMe ? 'You' : m.sender_name || 'Care Team'}
                        </Text>
                        <View
                          style={[
                            styles.bubbleBox,
                            isMe ? styles.bubbleBoxMe : styles.bubbleBoxThem
                          ]}
                        >
                          <Text
                            style={[
                              styles.bubbleText,
                              isMe ? styles.bubbleTextMe : styles.bubbleTextThem
                            ]}
                          >
                            {m.body}
                          </Text>
                        </View>
                        <Text style={styles.bubbleTime}>
                          {m.created_at
                            ? new Date(m.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : ''}
                        </Text>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            )}

            {/* Thread Reply Bar */}
            <View style={styles.replyBar}>
              <TextInput
                style={styles.replyInput}
                placeholder="Type reply..."
                placeholderTextColor="#94a3b8"
                value={replyText}
                onChangeText={setReplyText}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.replyBtn,
                  !replyText.trim() && { opacity: 0.5 }
                ]}
                onPress={handleSendReply}
                disabled={submitting || !replyText.trim()}
              >
                <Text style={styles.replyBtnText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : activeTab === 'messages' ? (
          /* ================= MY MESSAGES TAB ================= */
          <View style={styles.panelContainer}>
            
            {/* Top Row: My Messages Title & Scope Pills */}
            <View style={styles.panelHeaderRow}>
              <Text style={styles.panelTitle}>My Messages</Text>
              <View style={styles.scopeFilterRow}>
                {['active', 'all', 'inactive'].map((sc) => (
                  <TouchableOpacity
                    key={sc}
                    style={[
                      styles.scopeFilterBtn,
                      scopeFilter === sc && styles.scopeFilterBtnActive
                    ]}
                    onPress={() => setScopeFilter(sc)}
                  >
                    <Text
                      style={[
                        styles.scopeFilterBtnText,
                        scopeFilter === sc && styles.scopeFilterBtnTextActive
                      ]}
                    >
                      {sc === 'active' ? 'Show Active' : sc === 'all' ? 'All' : 'Inactive'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Action Bar: Count Pill & Buttons */}
            <View style={styles.toolbarRow}>
              <View style={styles.countPill}>
                <ChatIcon color="#2563eb" size={13} />
                <Text style={styles.countPillText}>
                  {myMessages.length} {myMessages.length === 1 ? 'message' : 'messages'}
                </Text>
              </View>

              <View style={styles.toolbarActions}>
                <TouchableOpacity
                  style={styles.addMessageBtn}
                  onPress={handleOpenAddMessage}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addMessageBtnText}>+ Add New Message</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.deleteMessageBtn,
                    selectedIds.size === 0 && styles.deleteMessageBtnDisabled
                  ]}
                  onPress={handleDeleteSelected}
                  disabled={selectedIds.size === 0}
                  activeOpacity={0.8}
                >
                  <Text style={styles.deleteMessageBtnText}>Delete Message</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Mobile Card-List View (Clean, responsive, never truncated) */}
            {loading ? (
              <View style={styles.loadingArea}>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text style={styles.loadingText}>Loading messages...</Text>
              </View>
            ) : myMessages.length === 0 ? (
              <View style={styles.emptyArea}>
                <Text style={styles.emptyTitle}>No messages found</Text>
                <Text style={styles.emptyDesc}>
                  Try adjusting your filters, or tap "+ Add New Message" to contact your doctor.
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.cardsScroll}
                contentContainerStyle={{ paddingBottom: 30 }}
                showsVerticalScrollIndicator={false}
              >
                {myMessages.map((m) => {
                  const isSelected = selectedIds.has(m.id);
                  const isUnread = Boolean(Number(m.is_unread));
                  const isInactive = m.deleted_at !== null;
                  const fromLabel =
                    m.sender_id === (currentUser?.id || 7)
                      ? 'You'
                      : m.sender_name || 'Care Team';

                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[
                        styles.msgCard,
                        isSelected && styles.msgCardSelected,
                        isUnread && styles.msgCardUnread
                      ]}
                      onPress={() => handleOpenThread(m)}
                      activeOpacity={0.7}
                    >
                      {/* Top Card Row: Checkbox, Sender & Status / Date */}
                      <View style={styles.cardTopRow}>
                        <TouchableOpacity
                          style={styles.checkboxTouch}
                          onPress={() => toggleSelectRow(m.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <View
                            style={[
                              styles.checkboxSquare,
                              isSelected && styles.checkboxSquareChecked
                            ]}
                          >
                            {isSelected && <Text style={styles.checkboxCheckText}>✓</Text>}
                          </View>
                        </TouchableOpacity>

                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            {isUnread && <View style={styles.unreadDot} />}
                            <Text style={[styles.cardSender, isUnread && styles.cardSenderBold]}>
                              {fromLabel}
                            </Text>
                          </View>
                          {m.type_name && (
                            <Text style={styles.cardType}>{m.type_name}</Text>
                          )}
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.cardDate}>
                            {m.created_at
                              ? new Date(m.created_at).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric'
                                })
                              : ''}
                          </Text>
                          <View
                            style={[
                              styles.statusBadge,
                              isInactive ? styles.statusBadgeInactive : styles.statusBadgeActive
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusBadgeText,
                                isInactive
                                  ? styles.statusBadgeTextInactive
                                  : styles.statusBadgeTextActive
                              ]}
                            >
                              {isInactive ? 'Inactive' : m.status_name || 'Active'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Message Content Preview */}
                      <Text style={styles.cardBody} numberOfLines={2}>
                        {m.body}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

          </View>
        ) : activeTab === 'reminders' ? (
          /* ================= REMINDERS TAB ================= */
          <ScrollView contentContainerStyle={styles.subTabScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.panelHeaderRow}>
              <Text style={styles.panelTitle}>Dated Reminders</Text>
            </View>

            {loading ? (
              <ActivityIndicator size="small" color="#2563eb" style={{ marginTop: 20 }} />
            ) : reminders.length === 0 ? (
              <View style={styles.emptyArea}>
                <Text style={styles.emptyTitle}>No Reminders</Text>
                <Text style={styles.emptyDesc}>
                  No dated clinical reminders recorded for this account.
                </Text>
              </View>
            ) : (
              reminders.map((r) => (
                <View key={r.id} style={styles.miniCard}>
                  <View style={styles.miniCardHeader}>
                    <Text style={styles.miniCardTitle}>
                      {r.title || r.body || 'Clinical Reminder'}
                    </Text>
                    <Text style={styles.miniCardDate}>
                      {r.due_date || r.created_at?.slice(0, 10)}
                    </Text>
                  </View>
                  <Text style={styles.miniCardDesc}>{r.notes || r.body || ''}</Text>
                </View>
              ))
            )}
          </ScrollView>
        ) : (
          /* ================= RECALLS TAB ================= */
          <ScrollView contentContainerStyle={styles.subTabScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.panelHeaderRow}>
              <Text style={styles.panelTitle}>Upcoming Recalls</Text>
            </View>

            {loading ? (
              <ActivityIndicator size="small" color="#2563eb" style={{ marginTop: 20 }} />
            ) : recalls.length === 0 ? (
              <View style={styles.emptyArea}>
                <Text style={styles.emptyTitle}>No Upcoming Recalls</Text>
                <Text style={styles.emptyDesc}>
                  No pending recall visits or preventive health checks due.
                </Text>
              </View>
            ) : (
              recalls.map((rec) => (
                <View key={rec.id} style={styles.miniCard}>
                  <View style={styles.miniCardHeader}>
                    <Text style={styles.miniCardTitle}>
                      {rec.reason || rec.recall_reason || 'Follow-up Screening'}
                    </Text>
                    <Text style={styles.miniCardDate}>
                      {rec.recall_date || rec.due_date || ''}
                    </Text>
                  </View>
                  <Text style={styles.miniCardDesc}>
                    {rec.notes || 'Routine healthcare recall schedule.'}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {/* ================= ADD MESSAGE MODAL OVERLAY ================= */}
        {showAddModal && (
          <View style={styles.innerModalOverlay}>
            <View style={styles.innerModalCard}>
              <View style={styles.innerModalHeader}>
                <Text style={styles.innerModalTitle}>New Message</Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.innerModalBody}>
                {/* Recipient Picker */}
                <Text style={styles.inputLabel}>RECIPIENT *</Text>
                <View style={styles.recipientSelectorList}>
                  {recipients.map((rec) => {
                    const isSel = selectedRecipientId === rec.id.toString();
                    return (
                      <TouchableOpacity
                        key={rec.id}
                        style={[
                          styles.recipientSelectChip,
                          isSel && styles.recipientSelectChipActive
                        ]}
                        onPress={() => setSelectedRecipientId(rec.id.toString())}
                      >
                        <Text
                          style={[
                            styles.recipientSelectText,
                            isSel && styles.recipientSelectTextActive
                          ]}
                        >
                          {rec.display_name} ({rec.role})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Message Type */}
                {messageTypes.length > 0 && (
                  <>
                    <Text style={styles.inputLabel}>MESSAGE TYPE</Text>
                    <View style={styles.typeChipsRow}>
                      {messageTypes.map((t) => {
                        const isSel = selectedTypeId === t.id.toString();
                        return (
                          <TouchableOpacity
                            key={t.id}
                            style={[styles.typeChip, isSel && styles.typeChipActive]}
                            onPress={() => setSelectedTypeId(t.id.toString())}
                          >
                            <Text
                              style={[
                                styles.typeChipText,
                                isSel && styles.typeChipTextActive
                              ]}
                            >
                              {t.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                )}

                {/* Subject */}
                <Text style={styles.inputLabel}>SUBJECT</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Subject or reason..."
                  placeholderTextColor="#94a3b8"
                  value={subject}
                  onChangeText={setSubject}
                />

                {/* Message Body */}
                <Text style={styles.inputLabel}>MESSAGE BODY *</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="Enter message details..."
                  placeholderTextColor="#94a3b8"
                  value={messageBody}
                  onChangeText={setMessageBody}
                  multiline
                  numberOfLines={4}
                />

                <View style={styles.innerModalFooter}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setShowAddModal(false)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                    onPress={handleSendNewMessage}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.submitBtnText}>Send Message</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        )}

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
    height: '88%',
    width: '100%',
    maxWidth: 500,
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
    paddingBottom: 12,
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
    backgroundColor: '#eff6ff',
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
  tabBarWrapper: {
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 6
  },
  tabBar: {
    flexDirection: 'row',
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
    color: '#2563eb',
    fontWeight: '800'
  },
  panelContainer: {
    flex: 1,
    padding: 14,
    display: 'flex',
    flexDirection: 'column'
  },
  panelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a'
  },
  scopeFilterRow: {
    flexDirection: 'row',
    gap: 4
  },
  scopeFilterBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  scopeFilterBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb'
  },
  scopeFilterBtnText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600'
  },
  scopeFilterBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700'
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  countPillText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700'
  },
  toolbarActions: {
    flexDirection: 'row',
    gap: 8
  },
  addMessageBtn: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  addMessageBtnText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700'
  },
  deleteMessageBtn: {
    backgroundColor: '#ef4444',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  deleteMessageBtnDisabled: {
    backgroundColor: '#f1f5f9',
    opacity: 0.6
  },
  deleteMessageBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  cardsScroll: {
    flex: 1
  },
  msgCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8
  },
  msgCardSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#f8fafc'
  },
  msgCardUnread: {
    borderColor: '#93c5fd',
    backgroundColor: '#eff6ff'
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6
  },
  checkboxTouch: {
    paddingTop: 2
  },
  checkboxSquare: {
    width: 17,
    height: 17,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxSquareChecked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb'
  },
  checkboxCheckText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900'
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563eb'
  },
  cardSender: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0f172a'
  },
  cardSenderBold: {
    fontWeight: '800'
  },
  cardType: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1
  },
  cardDate: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 3
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999
  },
  statusBadgeActive: {
    backgroundColor: '#eff6ff'
  },
  statusBadgeInactive: {
    backgroundColor: '#f1f5f9'
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700'
  },
  statusBadgeTextActive: {
    color: '#2563eb'
  },
  statusBadgeTextInactive: {
    color: '#94a3b8'
  },
  cardBody: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
    marginTop: 2
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
    padding: 36
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
    textAlign: 'center',
    lineHeight: 18
  },
  threadContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 10
  },
  backBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2563eb'
  },
  threadSubject: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a'
  },
  threadParticipants: {
    fontSize: 11.5,
    color: '#64748b'
  },
  threadMessagesScroll: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  threadMessagesContent: {
    padding: 14,
    paddingBottom: 20
  },
  bubbleWrap: {
    marginBottom: 12,
    maxWidth: '82%'
  },
  bubbleWrapRight: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end'
  },
  bubbleWrapLeft: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start'
  },
  bubbleSender: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 3
  },
  bubbleBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12
  },
  bubbleBoxMe: {
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 2
  },
  bubbleBoxThem: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderBottomLeftRadius: 2
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 18
  },
  bubbleTextMe: {
    color: '#ffffff'
  },
  bubbleTextThem: {
    color: '#0f172a'
  },
  bubbleTime: {
    fontSize: 9.5,
    color: '#94a3b8',
    marginTop: 2
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 8
  },
  replyInput: {
    flex: 1,
    minHeight: 38,
    maxHeight: 80,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
    color: '#0f172a'
  },
  replyBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center'
  },
  replyBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700'
  },
  subTabScroll: {
    padding: 16
  },
  miniCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10
  },
  miniCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  miniCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a'
  },
  miniCardDate: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: '600'
  },
  miniCardDesc: {
    fontSize: 12,
    color: '#64748b'
  },
  innerModalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  innerModalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden'
  },
  innerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  innerModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a'
  },
  innerModalBody: {
    padding: 16
  },
  inputLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 6
  },
  recipientSelectorList: {
    flexDirection: 'column',
    gap: 6,
    marginBottom: 14
  },
  recipientSelectChip: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  recipientSelectChipActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff'
  },
  recipientSelectText: {
    fontSize: 12.5,
    color: '#475569'
  },
  recipientSelectTextActive: {
    color: '#2563eb',
    fontWeight: '700'
  },
  typeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  typeChipActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff'
  },
  typeChipText: {
    fontSize: 11.5,
    color: '#64748b'
  },
  typeChipTextActive: {
    color: '#2563eb',
    fontWeight: '700'
  },
  formInput: {
    height: 40,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 14
  },
  formTextArea: {
    height: 90,
    paddingTop: 8,
    textAlignVertical: 'top'
  },
  innerModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f1f5f9'
  },
  cancelBtnText: {
    fontSize: 12.5,
    color: '#64748b',
    fontWeight: '600'
  },
  submitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#2563eb'
  },
  submitBtnText: {
    fontSize: 12.5,
    color: '#ffffff',
    fontWeight: '700'
  }
});
