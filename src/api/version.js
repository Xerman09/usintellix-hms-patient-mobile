import { apiRequest } from './client';
import { CONFIG } from '../constants/config';

export const VersionService = {
  /**
   * Compare two semantic version strings (e.g., "1.0.0" vs "1.0.1")
   * Returns:
   *  1 if v1 > v2
   * -1 if v1 < v2
   *  0 if v1 === v2
   */
  compareVersions(v1, v2) {
    if (!v1 || !v2) return 0;
    const parts1 = v1.toString().split('.').map(n => parseInt(n, 10) || 0);
    const parts2 = v2.toString().split('.').map(n => parseInt(n, 10) || 0);
    const maxLen = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < maxLen; i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p1 > p2) return 1;
        if (p1 < p2) return -1;
    }
    return 0;
  },

  /**
   * Fetch latest application release information from hospital backend
   */
  async checkLatestVersion() {
    try {
      const res = await apiRequest('/portal/app-version', { method: 'GET' });
      if (res && res.success && res.data) {
        const latest = res.data.latest_version;
        const current = CONFIG.VERSION || '1.0.0';
        const hasUpdate = this.compareVersions(latest, current) > 0;

        return {
          success: true,
          hasUpdate,
          currentVersion: current,
          latestVersion: latest,
          versionCode: res.data.version_code || 1,
          isCritical: !!res.data.is_critical,
          downloadUrl: res.data.download_url,
          fileSizeMb: res.data.file_size_mb || 0,
          releaseDate: res.data.release_date || '',
          releaseNotes: Array.isArray(res.data.release_notes)
            ? res.data.release_notes
            : ['General security improvements and performance updates.'],
          data: res.data
        };
      }
      return {
        success: false,
        message: res.message || 'Unable to check for updates at this time.'
      };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Network error while checking for updates.'
      };
    }
  }
};
