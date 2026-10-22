import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView
} from 'react-native';
import { MyChartService } from '../api/mychart';
import { CloseIcon, ChatIcon, CheckCircleIcon, UserIcon } from './Icons';

export default function MyChartAskDoctorModal({
  visible,
  onClose,
  order,
  onSuccessGoToMessages
}) {
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const suggestedQuestions = [
    'Are these results within normal limits for my health?',
    'Do I need to make any medication or diet adjustments based on these numbers?',
    'When should I repeat this test or schedule a follow-up visit?'
  ];

  const handleSend = async () => {
    if (!question.trim()) {
      Alert.alert('Question Required', 'Please enter your question before sending.');
      return;
    }

    setSending(true);
    try {
      const res = await MyChartService.askAboutResult({
        order_id: order?.order_id,
        test_name: order?.test_name,
        question: question.trim()
      });

      if (res && res.success) {
        setSentSuccess(true);
      } else {
        Alert.alert(
          'Notice',
          res?.message || 'Could not send question directly to doctor. Please use the Messages section.'
        );
      }
    } catch (err) {
      console.warn('Failed to send question:', err);
      Alert.alert('Error', 'Unable to send question. Please check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  const handleResetAndClose = () => {
    setQuestion('');
    setSentSuccess(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleResetAndClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.safeContainer}>
          <View style={styles.dialogCard}>
            {/* Modal Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.iconCircle}>
                  <ChatIcon color="#2563eb" size={18} />
                </View>
                <Text style={styles.headerTitle}>Ask Doctor</Text>
              </View>
              <TouchableOpacity onPress={handleResetAndClose} style={styles.closeBtn}>
                <CloseIcon color="#64748b" size={18} />
              </TouchableOpacity>
            </View>

            {sentSuccess ? (
              /* Success Confirmation View */
              <View style={styles.successBox}>
                <View style={styles.successIconCircle}>
                  <CheckCircleIcon color="#10b981" size={36} />
                </View>
                <Text style={styles.successTitle}>Question Sent Successfully</Text>
                <Text style={styles.successDesc}>
                  Your inquiry regarding <Text style={{ fontWeight: '700' }}>{order?.test_name}</Text> has been routed to {order?.ordering_doctor || 'your care provider'}.
                </Text>
                <Text style={styles.successSub}>
                  You will receive a notification and reply in your secure Messages inbox.
                </Text>

                <View style={styles.successActions}>
                  {onSuccessGoToMessages && (
                    <TouchableOpacity
                      style={styles.goToMessagesBtn}
                      onPress={() => {
                        handleResetAndClose();
                        onSuccessGoToMessages();
                      }}
                    >
                      <Text style={styles.goToMessagesBtnText}>Go to Messages</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.doneBtn}
                    onPress={handleResetAndClose}
                  >
                    <Text style={styles.doneBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Question Composition Form */
              <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
                {/* Order Summary Context */}
                <View style={styles.orderContextCard}>
                  <Text style={styles.contextLabel}>REFERENCED TEST</Text>
                  <Text style={styles.contextTestName}>{order?.test_name || 'Test Result'}</Text>
                  {order?.ordering_doctor ? (
                    <View style={styles.doctorRow}>
                      <UserIcon color="#2563eb" size={14} />
                      <Text style={styles.doctorName}>Recipient: {order.ordering_doctor}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Suggested Questions */}
                <Text style={styles.suggestionsHeader}>Quick Suggestions:</Text>
                <View style={styles.suggestionsRow}>
                  {suggestedQuestions.map((q, idx) => (
                    <TouchableOpacity
                      key={`suggestion-${idx}`}
                      style={styles.suggestionPill}
                      onPress={() => setQuestion(q)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.suggestionText} numberOfLines={2}>
                        "{q}"
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Question Input */}
                <Text style={styles.inputLabel}>Your Question</Text>
                <TextInput
                  style={styles.questionInput}
                  placeholder="Type your question or concern here..."
                  placeholderTextColor="#94a3b8"
                  value={question}
                  onChangeText={setQuestion}
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                <Text style={styles.privacyNote}>
                  🔒 Messages sent through MyChart are encrypted and logged in your clinical record. For immediate emergencies, please call emergency services.
                </Text>

                {/* Send Button */}
                <TouchableOpacity
                  style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
                  onPress={handleSend}
                  disabled={sending}
                  activeOpacity={0.8}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <ChatIcon color="#ffffff" size={18} />
                      <Text style={styles.sendBtnText}>Send to Doctor</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end'
  },
  safeContainer: {
    maxHeight: '92%'
  },
  dialogCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    paddingBottom: 24
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a'
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9'
  },
  formScroll: {
    padding: 20
  },
  orderContextCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16
  },
  contextLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5
  },
  contextTestName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  doctorName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
    marginLeft: 6
  },
  suggestionsHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8
  },
  suggestionsRow: {
    marginBottom: 16
  },
  suggestionPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  suggestionText: {
    fontSize: 12,
    color: '#334155'
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6
  },
  questionInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0f172a',
    minHeight: 100,
    marginBottom: 10
  },
  privacyNote: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
    marginBottom: 18
  },
  sendBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2
  },
  sendBtnDisabled: {
    opacity: 0.6
  },
  sendBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 8
  },
  successBox: {
    padding: 24,
    alignItems: 'center'
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center'
  },
  successDesc: {
    fontSize: 14,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8
  },
  successSub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24
  },
  successActions: {
    width: '100%'
  },
  goToMessagesBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10
  },
  goToMessagesBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff'
  },
  doneBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569'
  }
});
