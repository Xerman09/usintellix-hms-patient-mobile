import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { MyChartService } from '../api/mychart';
import {
  TodoIcon,
  CloseIcon,
  ChevronRightIcon,
  AlertTriangleIcon,
  LabIcon,
  CheckinIcon,
  BillingIcon,
  CalendarIcon,
  ChatIcon,
  RecordsIcon
} from './Icons';

export default function MyChartTodoModal({
  visible,
  onClose,
  onNavigateTab
}) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todoData, setTodoData] = useState({ items: [], counts: { total: 0, overdue: 0, todo: 0 } });

  const fetchTodo = async () => {
    try {
      const res = await MyChartService.getTodo();
      if (res && res.success && res.data) {
        setTodoData(res.data);
      }
    } catch (e) {
      console.log('Error fetching todo:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (visible) {
      setLoading(true);
      fetchTodo();
    }
  }, [visible]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTodo();
  };

  const getKindIcon = (kind) => {
    switch (kind) {
      case 'results':
        return <LabIcon color="#2563eb" size={18} />;
      case 'checkin':
        return <CheckinIcon color="#d97706" size={18} />;
      case 'balance':
        return <BillingIcon color="#059669" size={18} />;
      case 'appointments':
        return <CalendarIcon color="#0284c7" size={18} />;
      case 'messages':
        return <ChatIcon color="#7c3aed" size={18} />;
      default:
        return <RecordsIcon color="#64748b" size={18} />;
    }
  };

  const getUrgencyBadge = (urgency) => {
    if (urgency === 'overdue') {
      return (
        <View style={[styles.urgencyBadge, styles.overdueBadge]}>
          <Text style={[styles.urgencyText, styles.overdueText]}>Overdue</Text>
        </View>
      );
    }
    if (urgency === 'todo') {
      return (
        <View style={[styles.urgencyBadge, styles.todoBadge]}>
          <Text style={[styles.urgencyText, styles.todoText]}>Action Required</Text>
        </View>
      );
    }
    return (
      <View style={[styles.urgencyBadge, styles.infoBadge]}>
        <Text style={[styles.urgencyText, styles.infoText]}>Notice</Text>
      </View>
    );
  };

  const handleItemPress = (item) => {
    onClose();
    if (onNavigateTab && item.tab) {
      onNavigateTab(item.tab, item.link_id);
    }
  };

  const items = todoData.items || [];
  const counts = todoData.counts || { total: 0, overdue: 0, todo: 0 };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleBox}>
              <View style={styles.iconCircle}>
                <TodoIcon color="#0891b2" size={20} />
              </View>
              <View>
                <Text style={styles.title}>MyChart Action Center</Text>
                <Text style={styles.subtitle}>
                  {counts.total === 0
                    ? 'All caught up! No pending tasks.'
                    : `${counts.total} item${counts.total > 1 ? 's' : ''} waiting for your review`}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <CloseIcon color="#64748b" size={18} />
            </TouchableOpacity>
          </View>

          {/* Quick Stats Pill */}
          {counts.total > 0 && (
            <View style={styles.statsRow}>
              {counts.overdue > 0 && (
                <View style={[styles.statChip, styles.statChipRed]}>
                  <AlertTriangleIcon color="#dc2626" size={14} />
                  <Text style={styles.statChipRedText}>{counts.overdue} Overdue</Text>
                </View>
              )}
              {counts.todo > 0 && (
                <View style={[styles.statChip, styles.statChipAmber]}>
                  <Text style={styles.statChipAmberText}>{counts.todo} Action Required</Text>
                </View>
              )}
            </View>
          )}

          {/* List Content */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0891b2']} />}
          >
            {loading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color="#0891b2" />
                <Text style={styles.loadingText}>Loading action items...</Text>
              </View>
            ) : items.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <TodoIcon color="#10b981" size={28} />
                </View>
                <Text style={styles.emptyTitle}>You're all caught up!</Text>
                <Text style={styles.emptyDesc}>
                  No unread results, pending check-ins, or outstanding payments at this time.
                </Text>
              </View>
            ) : (
              items.map((item, index) => (
                <TouchableOpacity
                  key={`todo-${index}`}
                  style={[
                    styles.todoCard,
                    item.urgency === 'overdue' && styles.todoCardOverdue
                  ]}
                  onPress={() => handleItemPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.iconAndBadge}>
                      <View style={styles.cardIconBox}>
                        {getKindIcon(item.kind)}
                      </View>
                      {getUrgencyBadge(item.urgency)}
                    </View>
                  </View>

                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemDetail}>{item.detail}</Text>

                  {item.action && (
                    <View style={styles.cardActionRow}>
                      <Text style={styles.cardActionText}>{item.action}</Text>
                      <ChevronRightIcon color="#0891b2" size={14} />
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end'
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '45%',
    paddingBottom: 24
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ecfeff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a'
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc'
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  statChipRed: {
    backgroundColor: '#fef2f2'
  },
  statChipRedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626'
  },
  statChipAmber: {
    backgroundColor: '#fef3c7'
  },
  statChipAmberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b45309'
  },
  scrollContent: {
    padding: 20,
    gap: 12
  },
  centerBox: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b'
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
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
  todoCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6
  },
  todoCardOverdue: {
    backgroundColor: '#fff5f5',
    borderColor: '#fecaca'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  iconAndBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  cardIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8
  },
  overdueBadge: {
    backgroundColor: '#fee2e2'
  },
  overdueText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626'
  },
  todoBadge: {
    backgroundColor: '#e0f2fe'
  },
  todoText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284c7'
  },
  infoBadge: {
    backgroundColor: '#f1f5f9'
  },
  infoText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b'
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a'
  },
  itemDetail: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6
  },
  cardActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0891b2'
  }
});
