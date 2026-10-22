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
  BillingIcon,
  CloseIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  CreditCardIcon,
  ReceiptIcon,
  ClockIcon
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
      return `${day} ${month} ${year}`;
    }
  } catch (e) {}
  return String(dateStr).slice(0, 10);
};

export default function MyChartBillingModal({
  visible,
  onClose
}) {
  const [activeTab, setActiveTab] = useState('statement'); // 'statement' | 'history'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Statement & Ledger Data
  const [statementData, setStatementData] = useState(null);

  // Payment History Data
  const [historyData, setHistoryData] = useState(null);

  // Payment Attempt / Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('online'); // 'online' | 'card' | 'cashier'
  const [payNote, setPayNote] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);

  // Digital Receipt Modal State
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const fetchBillingData = async () => {
    try {
      const [stmtRes, histRes] = await Promise.all([
        MyChartService.getBilling(),
        MyChartService.getBillingHistory()
      ]);

      if (stmtRes && stmtRes.success && stmtRes.data) {
        setStatementData(stmtRes.data);
      }
      if (histRes && histRes.success && histRes.data) {
        setHistoryData(histRes.data);
      }
    } catch (err) {
      console.warn('Failed to load billing data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (visible) {
      setLoading(true);
      fetchBillingData();
      setShowPayModal(false);
      setPaymentSuccessData(null);
      setActiveReceipt(null);
    }
  }, [visible]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBillingData();
  };

  const currencySymbol = statementData?.money?.symbol || '₱';
  const outstandingBalance = statementData?.outstanding || 0;

  const handleOpenPayModal = () => {
    setPayAmount(String(outstandingBalance));
    setPayNote('');
    setPaymentSuccessData(null);
    setShowPayModal(true);
  };

  const handleSubmitPayment = async () => {
    const amountNum = parseFloat(payAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }
    if (amountNum > outstandingBalance && outstandingBalance > 0) {
      Alert.alert('Amount Exceeds Balance', `The maximum payment allowed is ${currencySymbol} ${outstandingBalance.toFixed(2)}.`);
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await MyChartService.payBilling({
        amount: amountNum,
        note: payNote.trim() ? `${payMethod.toUpperCase()}: ${payNote.trim()}` : payMethod.toUpperCase()
      });

      if (res && res.success && res.data) {
        setPaymentSuccessData(res.data);
        fetchBillingData();
      } else {
        Alert.alert('Payment Notice', res?.message || 'Payment attempt could not be processed.');
      }
    } catch (err) {
      console.warn('Payment failed:', err);
      Alert.alert('Error', 'Unable to initiate payment. Please verify your connection.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleCancelPendingAttempt = async (attemptId) => {
    Alert.alert(
      'Cancel Payment Request',
      'Are you sure you want to cancel this pending payment attempt?',
      [
        { text: 'Keep It', style: 'cancel' },
        {
          text: 'Cancel Payment',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await MyChartService.cancelPaymentAttempt(attemptId);
              if (res && res.success) {
                fetchBillingData();
              } else {
                Alert.alert('Notice', res?.message || 'Could not cancel payment.');
              }
            } catch (e) {
              console.warn(e);
            }
          }
        }
      ]
    );
  };

  const handleOpenReceipt = async (paymentId) => {
    setReceiptLoading(true);
    try {
      const res = await MyChartService.getBillingReceipt(paymentId);
      if (res && res.success && res.data) {
        setActiveReceipt(res.data);
      } else {
        Alert.alert('Receipt', 'Unable to generate receipt for this payment.');
      }
    } catch (err) {
      console.warn('Failed to load receipt:', err);
    } finally {
      setReceiptLoading(false);
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
        {/* ================= DIGITAL RECEIPT MODAL ================= */}
        {activeReceipt ? (
          <View style={styles.detailContainer}>
            <View style={styles.detailHeader}>
              <TouchableOpacity onPress={() => setActiveReceipt(null)} style={styles.backBtn}>
                <Text style={styles.backBtnText}>← Back to Billing</Text>
              </TouchableOpacity>
              <View style={styles.detailHeaderBadge}>
                <Text style={styles.detailHeaderBadgeText}>Official Receipt</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <CloseIcon color="#64748b" size={18} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.receiptScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.receiptSheet}>
                {/* Hospital Header */}
                <View style={styles.receiptHeader}>
                  <Text style={styles.receiptHospitalName}>USIntellix Healthcare System</Text>
                  <Text style={styles.receiptSubtitle}>Official Electronic Payment Receipt</Text>
                  <View style={styles.receiptDivider} />
                </View>

                {/* Receipt Metadata */}
                <View style={styles.receiptMetaGrid}>
                  <View style={styles.receiptMetaCol}>
                    <Text style={styles.receiptLabel}>RECEIPT NO.</Text>
                    <Text style={styles.receiptValueBold}>{activeReceipt.reference_no}</Text>
                  </View>
                  <View style={[styles.receiptMetaCol, { alignItems: 'flex-end' }]}>
                    <Text style={styles.receiptLabel}>PAYMENT DATE</Text>
                    <Text style={styles.receiptValue}>{formatDate(activeReceipt.date)}</Text>
                  </View>
                </View>

                <View style={styles.receiptMetaGrid}>
                  <View style={styles.receiptMetaCol}>
                    <Text style={styles.receiptLabel}>PATIENT NAME</Text>
                    <Text style={styles.receiptValue}>{activeReceipt.patient?.name || 'Patient'}</Text>
                  </View>
                  <View style={[styles.receiptMetaCol, { alignItems: 'flex-end' }]}>
                    <Text style={styles.receiptLabel}>PATIENT NO.</Text>
                    <Text style={styles.receiptValue}>{activeReceipt.patient?.patient_no || 'N/A'}</Text>
                  </View>
                </View>

                {/* Amount Box */}
                <View style={styles.receiptAmountCard}>
                  <Text style={styles.receiptAmountLabel}>TOTAL AMOUNT PAID</Text>
                  <Text style={styles.receiptAmountValue}>
                    {activeReceipt.money?.symbol || '₱'} {Number(activeReceipt.amount).toFixed(2)}
                  </Text>
                  <View style={styles.settledBadge}>
                    <CheckCircleIcon color="#059669" size={14} />
                    <Text style={styles.settledBadgeText}>PAID &amp; SETTLED</Text>
                  </View>
                </View>

                {/* Method & Balance Breakdown */}
                <View style={styles.receiptBreakdown}>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Payment Method</Text>
                    <Text style={styles.breakdownValue}>{activeReceipt.how || 'Online'}</Text>
                  </View>
                  {activeReceipt.tax && (
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>
                        {activeReceipt.tax.name} ({activeReceipt.tax.rate}% included)
                      </Text>
                      <Text style={styles.breakdownValue}>
                        {activeReceipt.money?.symbol} {activeReceipt.tax.included}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.breakdownRow, { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8 }]}>
                    <Text style={styles.breakdownLabelBold}>Remaining Balance</Text>
                    <Text style={styles.breakdownValueBold}>
                      {activeReceipt.money?.symbol} {Number(activeReceipt.balance_after || 0).toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Footer Disclaimer */}
                <Text style={styles.receiptFooterText}>
                  This electronic receipt is automatically generated and recorded in your permanent patient ledger. Thank you for your payment.
                </Text>
              </View>
            </ScrollView>
          </View>
        ) : (
          /* ================= MAIN BILLING VIEW ================= */
          <View style={styles.mainContainer}>
            {/* Top Navigation */}
            <View style={styles.topNav}>
              <View style={styles.titleColumn}>
                <View style={styles.titleRow}>
                  <View style={styles.titleIconBox}>
                    <BillingIcon color="#059669" size={20} />
                  </View>
                  <Text style={styles.screenTitle}>Billing &amp; Statements</Text>
                </View>
                <Text style={styles.screenSubtitle}>
                  Current balances, visit charges &amp; payment receipts
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <CloseIcon color="#64748b" size={18} />
              </TouchableOpacity>
            </View>

            {/* Segmented Tab Bar */}
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'statement' && styles.tabBtnActive]}
                onPress={() => setActiveTab('statement')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabBtnText, activeTab === 'statement' && styles.tabBtnTextActive]}>
                  Statement &amp; Balance
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
                onPress={() => setActiveTab('history')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabBtnText, activeTab === 'history' && styles.tabBtnTextActive]}>
                  Payment History ({historyData?.payments?.length || 0})
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.listContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />}
              showsVerticalScrollIndicator={false}
            >
              {loading ? (
                <View style={styles.centerBox}>
                  <ActivityIndicator size="large" color="#059669" />
                  <Text style={styles.loadingText}>Fetching patient ledger statement...</Text>
                </View>
              ) : activeTab === 'statement' ? (
                /* ================= STATEMENT TAB ================= */
                <View style={{ gap: 14 }}>
                  {/* Balance Hero Card */}
                  <View style={styles.balanceHeroCard}>
                    <View style={styles.balanceTopRow}>
                      <View>
                        <Text style={styles.balanceLabel}>CURRENT OUTSTANDING BALANCE</Text>
                        <Text style={styles.balanceAmount}>
                          {currencySymbol} {Number(outstandingBalance).toFixed(2)}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.balanceStatusPill,
                          outstandingBalance > 0 ? styles.balanceStatusDue : styles.balanceStatusPaid
                        ]}
                      >
                        {outstandingBalance > 0 ? (
                          <AlertTriangleIcon color="#d97706" size={13} />
                        ) : (
                          <CheckCircleIcon color="#059669" size={13} />
                        )}
                        <Text
                          style={[
                            styles.balanceStatusText,
                            outstandingBalance > 0 ? { color: '#b45309' } : { color: '#059669' }
                          ]}
                        >
                          {outstandingBalance > 0 ? 'Balance Due' : 'All Paid Up'}
                        </Text>
                      </View>
                    </View>

                    {/* Totals Summary Row */}
                    {statementData?.totals && (
                      <View style={styles.totalsRow}>
                        <View style={styles.totalCol}>
                          <Text style={styles.totalColLabel}>Total Charges</Text>
                          <Text style={styles.totalColValue}>
                            {currencySymbol} {Number(statementData.totals.charge || 0).toFixed(2)}
                          </Text>
                        </View>
                        <View style={styles.totalDivider} />
                        <View style={styles.totalCol}>
                          <Text style={styles.totalColLabel}>Payments</Text>
                          <Text style={[styles.totalColValue, { color: '#059669' }]}>
                            {currencySymbol} {Number(statementData.totals.payment || 0).toFixed(2)}
                          </Text>
                        </View>
                        <View style={styles.totalDivider} />
                        <View style={styles.totalCol}>
                          <Text style={styles.totalColLabel}>Discounts</Text>
                          <Text style={styles.totalColValue}>
                            {currencySymbol} {Number(statementData.totals.adjustment || 0).toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Pay Now Action Button */}
                    {outstandingBalance > 0 ? (
                      <TouchableOpacity
                        style={styles.payBtn}
                        activeOpacity={0.8}
                        onPress={handleOpenPayModal}
                      >
                        <CreditCardIcon color="#ffffff" size={18} />
                        <Text style={styles.payBtnText}>
                          Pay {currencySymbol} {Number(outstandingBalance).toFixed(2)} Now
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.paidNoticeBox}>
                        <CheckCircleIcon color="#059669" size={16} />
                        <Text style={styles.paidNoticeText}>
                          Your account has no outstanding balances. Thank you!
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Visit-by-Visit Itemized Breakdown */}
                  <View style={styles.breakdownCard}>
                    <Text style={styles.breakdownCardTitle}>Charges by Visit &amp; Service</Text>
                    {statementData?.visits && statementData.visits.length > 0 ? (
                      statementData.visits.map((v, idx) => (
                        <View key={`visit-${idx}`} style={styles.visitGroup}>
                          <View style={styles.visitGroupHeader}>
                            <Text style={styles.visitGroupDate}>{formatDate(v.date)}</Text>
                            <Text style={styles.visitGroupTotal}>
                              Total: {currencySymbol} {Number(v.charge).toFixed(2)}
                            </Text>
                          </View>

                          {v.rows && v.rows.map((row, rIdx) => (
                            <View key={`charge-${rIdx}`} style={styles.chargeRow}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.chargeDesc}>{row.description}</Text>
                                {row.type ? (
                                  <Text style={styles.chargeType}>{row.type.toUpperCase()}</Text>
                                ) : null}
                              </View>
                              <Text style={styles.chargeAmount}>
                                {currencySymbol} {Number(row.charge).toFixed(2)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyNoticeText}>No charges recorded in this period.</Text>
                    )}
                  </View>
                </View>
              ) : (
                /* ================= PAYMENT HISTORY TAB ================= */
                <View style={{ gap: 14 }}>
                  {/* Pending / Waiting Attempts */}
                  {historyData?.waiting && historyData.waiting.length > 0 && (
                    <View style={styles.waitingCard}>
                      <Text style={styles.waitingCardTitle}>Pending Cashier Payment Requests</Text>
                      {historyData.waiting.map((attempt) => (
                        <View key={`attempt-${attempt.attempt_id}`} style={styles.attemptBox}>
                          <View style={styles.attemptTop}>
                            <View>
                              <Text style={styles.attemptRef}>Ref: {attempt.reference_no}</Text>
                              <Text style={styles.attemptDate}>
                                Initiated: {formatDate(attempt.started_at)}
                              </Text>
                            </View>
                            <Text style={styles.attemptAmount}>
                              {currencySymbol} {Number(attempt.amount).toFixed(2)}
                            </Text>
                          </View>
                          <Text style={styles.attemptDesc}>
                            Show this reference number at the hospital cashier to complete settlement.
                          </Text>
                          <TouchableOpacity
                            style={styles.cancelAttemptBtn}
                            onPress={() => handleCancelPendingAttempt(attempt.attempt_id)}
                          >
                            <Text style={styles.cancelAttemptBtnText}>Cancel Request</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Settled Payments */}
                  <View style={styles.settledCard}>
                    <Text style={styles.settledCardTitle}>Settled Receipts</Text>
                    {historyData?.payments && historyData.payments.length > 0 ? (
                      historyData.payments.map((p) => (
                        <View key={`pay-${p.id}`} style={styles.paymentRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.payDate}>{formatDate(p.date)}</Text>
                            <Text style={styles.payMethod}>
                              {p.how} • Ref: {p.reference_no || 'N/A'}
                            </Text>
                          </View>

                          <View style={{ alignItems: 'flex-end', marginRight: 12 }}>
                            <Text style={styles.payAmount}>
                              {currencySymbol} {Number(p.amount).toFixed(2)}
                            </Text>
                            <Text style={styles.payStatus}>Settled</Text>
                          </View>

                          <TouchableOpacity
                            style={styles.receiptPillBtn}
                            onPress={() => handleOpenReceipt(p.id)}
                            activeOpacity={0.7}
                          >
                            <ReceiptIcon color="#0284c7" size={14} />
                            <Text style={styles.receiptPillBtnText}>Receipt</Text>
                          </TouchableOpacity>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyNoticeText}>No settled payments on record yet.</Text>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {/* ================= IN-APP PAYMENT MODAL ================= */}
        <Modal
          visible={showPayModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowPayModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.payDialog}>
              <View style={styles.payDialogHeader}>
                <Text style={styles.payDialogTitle}>Online Payment</Text>
                <TouchableOpacity onPress={() => setShowPayModal(false)} style={styles.closeBtn}>
                  <CloseIcon color="#64748b" size={18} />
                </TouchableOpacity>
              </View>

              {paymentSuccessData ? (
                <View style={styles.successDialogBox}>
                  <View style={styles.successIconCircle}>
                    <CheckCircleIcon color="#059669" size={36} />
                  </View>
                  <Text style={styles.successTitle}>Payment Recorded!</Text>
                  <Text style={styles.successRef}>
                    Reference No: {paymentSuccessData.reference_no}
                  </Text>
                  <Text style={styles.successDesc}>
                    Amount: {currencySymbol} {Number(paymentSuccessData.amount).toFixed(2)}
                  </Text>
                  <Text style={styles.successSub}>
                    Your payment request is logged. Present this reference number at the hospital cashier or use it for digital gateway verification.
                  </Text>
                  <TouchableOpacity
                    style={styles.doneBtn}
                    onPress={() => {
                      setShowPayModal(false);
                      setPaymentSuccessData(null);
                    }}
                  >
                    <Text style={styles.doneBtnText}>Close</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView contentContainerStyle={styles.payFormContent}>
                  <Text style={styles.inputLabel}>Payment Amount ({currencySymbol})</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={payAmount}
                    onChangeText={setPayAmount}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                  />

                  <Text style={styles.inputLabel}>Payment Method</Text>
                  <View style={styles.methodsRow}>
                    {[
                      { id: 'online', label: '🏦 e-Wallet / Bank' },
                      { id: 'card', label: '💳 Credit/Debit' },
                      { id: 'cashier', label: '🏢 Cashier Intent' }
                    ].map((m) => (
                      <TouchableOpacity
                        key={m.id}
                        style={[styles.methodPill, payMethod === m.id && styles.methodPillActive]}
                        onPress={() => setPayMethod(m.id)}
                      >
                        <Text style={[styles.methodText, payMethod === m.id && styles.methodTextActive]}>
                          {m.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Memo / Notes (Optional)</Text>
                  <TextInput
                    style={styles.noteInput}
                    value={payNote}
                    onChangeText={setPayNote}
                    placeholder="e.g., Payment for lab & consultation"
                    placeholderTextColor="#94a3b8"
                  />

                  <TouchableOpacity
                    style={[styles.submitPayBtn, submittingPayment && styles.btnDisabled]}
                    onPress={handleSubmitPayment}
                    disabled={submittingPayment}
                  >
                    {submittingPayment ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <CreditCardIcon color="#ffffff" size={18} />
                        <Text style={styles.submitPayBtnText}>Confirm &amp; Pay Now</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
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
    backgroundColor: '#ecfdf5',
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
    backgroundColor: '#059669'
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
  balanceHeroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 14
  },
  balanceTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 4
  },
  balanceStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10
  },
  balanceStatusDue: {
    backgroundColor: '#fef3c7'
  },
  balanceStatusPaid: {
    backgroundColor: '#ecfdf5'
  },
  balanceStatusText: {
    fontSize: 11.5,
    fontWeight: '800'
  },
  totalsRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  totalCol: {
    flex: 1,
    alignItems: 'center'
  },
  totalDivider: {
    width: 1,
    backgroundColor: '#e2e8f0'
  },
  totalColLabel: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '600'
  },
  totalColValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 2
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2
  },
  payBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff'
  },
  paidNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 10
  },
  paidNoticeText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#065f46'
  },
  breakdownCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12
  },
  breakdownCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a'
  },
  visitGroup: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
    gap: 6
  },
  visitGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  visitGroupDate: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a'
  },
  visitGroupTotal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669'
  },
  chargeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  chargeDesc: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500'
  },
  chargeType: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1
  },
  chargeAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a'
  },
  emptyNoticeText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 20
  },

  /* Payment History Styles */
  waitingCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fef3c7',
    gap: 10
  },
  waitingCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#b45309'
  },
  attemptBox: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: 6
  },
  attemptTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  attemptRef: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a'
  },
  attemptDate: {
    fontSize: 11,
    color: '#64748b'
  },
  attemptAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#b45309'
  },
  attemptDesc: {
    fontSize: 11.5,
    color: '#78350f',
    lineHeight: 16
  },
  cancelAttemptBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#fef2f2'
  },
  cancelAttemptBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626'
  },
  settledCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12
  },
  settledCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a'
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  payDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a'
  },
  payMethod: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2
  },
  payAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669'
  },
  payStatus: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '700'
  },
  receiptPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd'
  },
  receiptPillBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0284c7'
  },

  /* Detail / Receipt Styles */
  detailContainer: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  detailHeader: {
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
    color: '#059669'
  },
  detailHeaderBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  detailHeaderBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669'
  },
  receiptScroll: {
    padding: 16,
    paddingBottom: 40
  },
  receiptSheet: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 14
  },
  receiptHeader: {
    alignItems: 'center'
  },
  receiptHospitalName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  receiptSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    width: '100%',
    marginTop: 12
  },
  receiptMetaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  receiptMetaCol: {
    flex: 1
  },
  receiptLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8'
  },
  receiptValue: {
    fontSize: 13,
    color: '#334155',
    marginTop: 2
  },
  receiptValueBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2
  },
  receiptAmountCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginVertical: 4
  },
  receiptAmountLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534'
  },
  receiptAmountValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#15803d',
    marginTop: 2
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 6
  },
  settledBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669'
  },
  receiptBreakdown: {
    gap: 8,
    paddingTop: 6
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  breakdownLabel: {
    fontSize: 12.5,
    color: '#64748b'
  },
  breakdownValue: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1e293b'
  },
  breakdownLabelBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a'
  },
  breakdownValueBold: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a'
  },
  receiptFooterText: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 8
  },

  /* In-App Pay Dialog */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 20
  },
  payDialog: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden'
  },
  payDialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  payDialogTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a'
  },
  payFormContent: {
    padding: 18,
    gap: 10
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569'
  },
  amountInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a'
  },
  methodsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  methodPill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  methodPillActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#059669'
  },
  methodText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748b'
  },
  methodTextActive: {
    color: '#059669',
    fontWeight: '700'
  },
  noteInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a'
  },
  submitPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 8
  },
  submitPayBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff'
  },
  btnDisabled: {
    opacity: 0.6
  },
  successDialogBox: {
    padding: 24,
    alignItems: 'center',
    gap: 8
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center'
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a'
  },
  successRef: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669'
  },
  successDesc: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155'
  },
  successSub: {
    fontSize: 11.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16
  },
  doneBtn: {
    backgroundColor: '#059669',
    paddingVertical: 11,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 10
  },
  doneBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff'
  }
});
