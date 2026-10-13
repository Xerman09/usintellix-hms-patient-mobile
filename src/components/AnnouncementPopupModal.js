import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Dimensions
} from 'react-native';
import { getMediaUrl } from '../constants/config';
import {
  MegaphoneIcon,
  CloseIcon,
  AlertTriangleIcon,
  ChevronRightIcon,
  ChevronLeftIcon
} from './Icons';

export default function AnnouncementPopupModal({ visible, announcements = [], onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!visible || !announcements || announcements.length === 0) {
    return null;
  }

  const total = announcements.length;
  // Ensure index is within range
  const safeIndex = Math.min(Math.max(0, currentIndex), total - 1);
  const item = announcements[safeIndex];

  const handleNext = () => {
    if (safeIndex < total - 1) {
      setCurrentIndex(safeIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (safeIndex > 0) {
      setCurrentIndex(safeIndex - 1);
    }
  };

  // Format priority styling
  const priority = (item?.priority || 'normal').toLowerCase();
  const isUrgent = priority === 'urgent';
  const isImportant = priority === 'important';

  const badgeTheme = isUrgent
    ? { bg: '#fee2e2', border: '#fecaca', text: '#dc2626', label: 'URGENT ANNOUNCEMENT' }
    : isImportant
    ? { bg: '#fef3c7', border: '#fde68a', text: '#b45309', label: 'IMPORTANT NOTICE' }
    : { bg: '#e0f2fe', border: '#bae6fd', text: '#0284c7', label: 'HOSPITAL NOTICE' };

  // Image URL
  const imageUrl = getMediaUrl(item?.image_url);

  // Format date
  const dateStr = item?.formatted_start || item?.start_date || '';
  let formattedDateDisplay = '';
  if (dateStr) {
    try {
      const d = new Date(dateStr.replace(' ', 'T'));
      if (!isNaN(d.getTime())) {
        formattedDateDisplay = d.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      } else {
        formattedDateDisplay = dateStr;
      }
    } catch (e) {
      formattedDateDisplay = dateStr;
    }
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header Accent Bar */}
          <View
            style={[
              styles.topAccentBar,
              {
                backgroundColor: isUrgent
                  ? '#dc2626'
                  : isImportant
                  ? '#f59e0b'
                  : '#2563eb'
              }
            ]}
          />

          {/* Modal Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.iconSquircle,
                  { backgroundColor: badgeTheme.bg, borderColor: badgeTheme.border }
                ]}
              >
                {isUrgent ? (
                  <AlertTriangleIcon color={badgeTheme.text} size={20} />
                ) : (
                  <MegaphoneIcon color={badgeTheme.text} size={20} />
                )}
              </View>
              <View style={styles.headerTitleBox}>
                <View
                  style={[
                    styles.priorityPill,
                    { backgroundColor: badgeTheme.bg, borderColor: badgeTheme.border }
                  ]}
                >
                  <Text style={[styles.priorityPillText, { color: badgeTheme.text }]}>
                    {badgeTheme.label}
                  </Text>
                </View>
                {formattedDateDisplay ? (
                  <Text style={styles.dateSubtext}>{formattedDateDisplay}</Text>
                ) : null}
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <CloseIcon color="#64748b" size={18} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content Body */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Optional Banner Image */}
            {imageUrl ? (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
              </View>
            ) : null}

            {/* Title */}
            <Text style={styles.announcementTitle}>
              {item?.title || 'Hospital Announcement'}
            </Text>

            {/* Body Content */}
            <Text style={styles.announcementBody}>
              {item?.content || ''}
            </Text>
          </ScrollView>

          {/* Footer Controls */}
          <View style={styles.footerContainer}>
            {/* Dots / Paging indicator if multiple */}
            {total > 1 ? (
              <View style={styles.paginationRow}>
                <View style={styles.dotsWrap}>
                  {announcements.map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.dot,
                        idx === safeIndex ? styles.dotActive : styles.dotInactive
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.pageCountText}>
                  {safeIndex + 1} of {total}
                </Text>
              </View>
            ) : null}

            <View style={styles.actionButtonsRow}>
              {total > 1 && safeIndex > 0 ? (
                <TouchableOpacity
                  style={styles.prevBtn}
                  onPress={handlePrev}
                  activeOpacity={0.7}
                >
                  <ChevronLeftIcon color="#475569" size={16} />
                  <Text style={styles.prevBtnText}>Previous</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.dismissBtn}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dismissBtnText}>Dismiss</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.primaryActionBtn,
                  {
                    backgroundColor: isUrgent
                      ? '#dc2626'
                      : '#2563eb'
                  }
                ]}
                onPress={handleNext}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryActionText}>
                  {safeIndex < total - 1 ? 'Next Notice' : 'Got It'}
                </Text>
                {safeIndex < total - 1 ? (
                  <ChevronRightIcon color="#ffffff" size={15} />
                ) : null}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
    display: 'flex',
    flexDirection: 'column'
  },
  topAccentBar: {
    height: 4,
    width: '100%'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12
  },
  iconSquircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  headerTitleBox: {
    flex: 1
  },
  priorityPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 3
  },
  priorityPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  dateSubtext: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500'
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  scrollBody: {
    flexGrow: 1,
    flexShrink: 1
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 18
  },
  imageContainer: {
    width: '100%',
    height: 170,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  bannerImage: {
    width: '100%',
    height: '100%'
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 24,
    marginBottom: 10
  },
  announcementBody: {
    fontSize: 14.5,
    color: '#334155',
    lineHeight: 22,
    letterSpacing: 0.1
  },
  footerContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff'
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  dotsWrap: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginRight: 6
  },
  dotActive: {
    width: 20,
    backgroundColor: '#2563eb'
  },
  dotInactive: {
    width: 6,
    backgroundColor: '#cbd5e1'
  },
  pageCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b'
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  dismissBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  dismissBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748b'
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  prevBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#475569',
    marginLeft: 4
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 12,
    flex: 1,
    marginLeft: 12
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginRight: 4
  }
});
