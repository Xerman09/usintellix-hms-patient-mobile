import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { THEME } from '../constants/theme';
import { CloudDownloadIcon, CloseIcon, SparklesIcon, ShieldCheckIcon } from './Icons';

export default function UpdateNotificationModal({
  visible,
  updateInfo,
  onClose,
  isManualCheck = false
}) {
  const [downloading, setDownloading] = useState(false);

  if (!visible || !updateInfo) return null;

  const currentVersion = updateInfo.currentVersion || '1.0.0';
  const latestVersion = updateInfo.latestVersion || '1.0.1';
  const fileSizeMb = updateInfo.fileSizeMb ? `${updateInfo.fileSizeMb} MB` : '18.6 MB';
  const releaseNotes = updateInfo.releaseNotes || [];
  const isCritical = !!updateInfo.isCritical;
  const downloadUrl = updateInfo.downloadUrl;

  const handleDownloadInstall = async () => {
    if (!downloadUrl) {
      Alert.alert('Download Error', 'Download link is currently unavailable from the server.');
      return;
    }

    setDownloading(true);
    try {
      if (Platform.OS === 'web') {
        window.open(downloadUrl, '_blank');
      } else {
        const supported = await Linking.canOpenURL(downloadUrl);
        if (supported) {
          await Linking.openURL(downloadUrl);
        } else {
          await Linking.openURL(downloadUrl);
        }
      }
    } catch (err) {
      Alert.alert(
        'Unable to Open Download Link',
        `Could not automatically launch the package installer. Please open:\n${downloadUrl}`
      );
    } finally {
      setTimeout(() => {
        setDownloading(false);
      }, 2000);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        if (!isCritical) onClose();
      }}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header Banner */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <CloudDownloadIcon color="#2563eb" size={24} />
              </View>
              <View style={styles.headerTitles}>
                <View style={styles.titleBadgeRow}>
                  <Text style={styles.title}>Update Available</Text>
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>v{latestVersion}</Text>
                  </View>
                </View>
                <Text style={styles.subtitle}>
                  Current: v{currentVersion} • Size: ~{fileSizeMb}
                </Text>
              </View>
            </View>

            {!isCritical && (
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <CloseIcon color="#64748b" size={20} />
              </TouchableOpacity>
            )}
          </View>

          {/* Release Notes Content */}
          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.highlightBox}>
              <SparklesIcon color="#2563eb" size={18} />
              <Text style={styles.highlightText}>
                A new version of the USIntellix Patient Mobile App is ready for your device with improvements and fixes.
              </Text>
            </View>

            <Text style={styles.sectionLabel}>WHAT'S NEW IN THIS VERSION</Text>
            <View style={styles.notesList}>
              {releaseNotes.map((note, idx) => (
                <View key={idx} style={styles.noteItem}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.noteText}>{note}</Text>
                </View>
              ))}
            </View>

            {/* Verification Security Notice */}
            <View style={styles.securityNoticeRow}>
              <ShieldCheckIcon color="#10b981" size={16} />
              <Text style={styles.securityNoticeText}>
                Signed APK directly from Hospital Health Network
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            {!isCritical && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Later</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.updateBtn,
                isCritical && { flex: 1 },
                downloading && { opacity: 0.85 }
              ]}
              onPress={handleDownloadInstall}
              disabled={downloading}
              activeOpacity={0.8}
            >
              {downloading ? (
                <View style={styles.btnContentRow}>
                  <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.updateBtnText}>Opening Installer...</Text>
                </View>
              ) : (
                <View style={styles.btnContentRow}>
                  <CloudDownloadIcon color="#ffffff" size={18} />
                  <Text style={[styles.updateBtnText, { marginLeft: 8 }]}>
                    Download &amp; Install
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 12
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  headerTitles: {
    flex: 1
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap'
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a'
  },
  newBadge: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8'
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8
  },
  contentScroll: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxHeight: 320
  },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    gap: 10
  },
  highlightText: {
    flex: 1,
    fontSize: 13,
    color: '#166534',
    lineHeight: 18,
    fontWeight: '500'
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1.1,
    marginBottom: 10
  },
  notesList: {
    marginBottom: 16
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563eb',
    marginTop: 6,
    marginRight: 10
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    lineHeight: 19
  },
  securityNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    marginBottom: 6
  },
  securityNoticeText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500'
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12
  },
  cancelBtn: {
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b'
  },
  updateBtn: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  updateBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff'
  }
});
