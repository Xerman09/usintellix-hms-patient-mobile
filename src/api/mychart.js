import { apiRequest } from './client';

/**
 * MyChart API Client Service
 * Connects React Native Patient Mobile App to the backend MyChart endpoints
 */
export const MyChartService = {
  // -------------------------------------------------------------
  // 1. Proxy & Acting Patient Context
  // -------------------------------------------------------------

  /**
   * List all patient charts the logged-in user may act as (self + active proxy grants)
   */
  async getAccessiblePatients() {
    return apiRequest('/proxy-access/mine');
  },

  /**
   * Switch active patient context (session 'acting_patient_id')
   */
  async switchActingPatient(patientId) {
    return apiRequest('/proxy-access/switch', {
      method: 'POST',
      body: JSON.stringify({ patient_id: Number(patientId) })
    });
  },

  // -------------------------------------------------------------
  // 2. To-Do Action Items & Notifications
  // -------------------------------------------------------------

  /**
   * Fetch aggregated to-do items (unread results, questionnaires, billing due, checkins)
   */
  async getTodo() {
    return apiRequest('/mychart/todo');
  },

  /**
   * Fetch in-app notifications
   */
  async getNotifications(unreadOnly = false) {
    return apiRequest(`/mychart/notifications${unreadOnly ? '?unread=1' : ''}`);
  },

  /**
   * Mark a single notification or all as read
   */
  async markNotificationRead(notificationId = null) {
    return apiRequest('/mychart/notifications/read', {
      method: 'POST',
      body: JSON.stringify(notificationId ? { id: Number(notificationId) } : { all: true })
    });
  },

  /**
   * Notification channel preferences
   */
  async getNotificationPreferences() {
    return apiRequest('/mychart/notification-preferences');
  },

  async saveNotificationPreference(payload) {
    return apiRequest('/mychart/notification-preferences', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // -------------------------------------------------------------
  // 3. Test Results (Phase M1 & M2)
  // -------------------------------------------------------------

  /**
   * List released laboratory and imaging results
   * @param {Object} filters - { kind: 'lab'|'imaging'|'', from: '', to: '', q: '' }
   */
  async getResults(filters = {}) {
    const params = new URLSearchParams();
    if (filters.kind) params.append('kind', filters.kind);
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.q) params.append('q', filters.q);
    const qs = params.toString();
    return apiRequest(`/mychart/results${qs ? `?${qs}` : ''}`);
  },

  /**
   * Get single test result order details (analytes, ranges, impressions)
   */
  async getResultDetail(orderId) {
    return apiRequest(`/mychart/results/show?order_id=${Number(orderId)}`);
  },

  /**
   * Get historical trend for an analyte over time
   */
  async getResultTrend(name, code) {
    const params = new URLSearchParams();
    if (name) params.append('name', name);
    if (code) params.append('code', code);
    return apiRequest(`/mychart/results/trend?${params.toString()}`);
  },

  /**
   * Ask ordering physician a question about this result
   */
  async askAboutResult(payload) {
    return apiRequest('/mychart/results/ask', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // -------------------------------------------------------------
  // 4. Visits & After-Visit Summaries (Phase M3)
  // -------------------------------------------------------------

  /**
   * List upcoming appointments (with prep) & past encounters/admissions
   */
  async getVisits() {
    return apiRequest('/mychart/visits');
  },

  /**
   * Get After-Visit Summary (AVS) for an encounter
   */
  async getAfterVisitSummary(encounterId) {
    return apiRequest(`/mychart/visits/avs?encounter_id=${Number(encounterId)}`);
  },

  /**
   * Get Discharge Summary for an inpatient stay
   */
  async getDischargeSummary(admissionId) {
    return apiRequest(`/mychart/visits/discharge-summary?admission_id=${Number(admissionId)}`);
  },

  /**
   * Plain-language guides for the patient's own diagnoses: what the condition is,
   * what to do, what not to do, and when to get help the same day.
   *
   * A POST because it carries the list of diagnoses on screen. The server only
   * answers for diagnoses this patient actually has, so an item it does not
   * recognise simply comes back absent.
   *
   * @param {Array<{code?: string, text: string}>} items
   */
  async getDiagnosisGuides(items) {
    return apiRequest('/mychart/diagnosis-guides', {
      method: 'POST',
      body: JSON.stringify({ items })
    });
  },

  // -------------------------------------------------------------
  // 4b. Appointment self-service (Phase M10)
  // -------------------------------------------------------------

  /**
   * The patient's own upcoming appointments. Each item carries can_reschedule,
   * can_cancel, can_confirm and, where an action is not allowed, blocked_reason —
   * show that sentence rather than a dead button.
   */
  async getMyAppointments() {
    return apiRequest('/mychart/appointments');
  },

  /** Free times with the same doctor, grouped by day: [{ date, times: [...] }]. */
  async getAppointmentSlots(appointmentId) {
    return apiRequest(`/mychart/appointments/slots?appointment_id=${Number(appointmentId)}`);
  },

  /** Move an appointment. The doctor stays the same; only date and time change. */
  async rescheduleAppointment(appointmentId, date, time) {
    return apiRequest('/mychart/appointments/reschedule', {
      method: 'POST',
      body: JSON.stringify({ appointment_id: Number(appointmentId), date, time })
    });
  },

  /** Cancel an appointment. A reason is required — the clinic reuses the slot. */
  async cancelAppointment(appointmentId, reason) {
    return apiRequest('/mychart/appointments/cancel', {
      method: 'POST',
      body: JSON.stringify({ appointment_id: Number(appointmentId), reason })
    });
  },

  /** "I am coming." Stays available inside the cut-off, when changes have closed. */
  async confirmAppointment(appointmentId) {
    return apiRequest('/mychart/appointments/confirm', {
      method: 'POST',
      body: JSON.stringify({ appointment_id: Number(appointmentId) })
    });
  },

  // -------------------------------------------------------------
  // 4c. Insurance self-service (Phase M12)
  // -------------------------------------------------------------

  /**
   * The cover the hospital holds, this patient's own change requests, and the
   * insurer list to choose from. Each coverage row carries `status_text`, which
   * says in words whether it is active or expired — show that rather than a date.
   */
  async getMyInsurance() {
    return apiRequest('/mychart/insurance');
  },

  /**
   * Ask for cover to be added, corrected or removed. This does not change the
   * record: the desk applies it after checking the card.
   *
   * @param {Object} payload { action: 'add'|'update'|'remove', patient_insurance_id?,
   *   insurance_id?, insurer_name_text?, insurance_type?, policy_number?,
   *   group_number?, subscriber_name?, effective_date?, note?, upload_id? }
   */
  async requestInsuranceChange(payload) {
    return apiRequest('/mychart/insurance/request', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /** Cancel a request the clinic has not looked at yet. */
  async withdrawInsuranceRequest(requestId) {
    return apiRequest('/mychart/insurance/withdraw', {
      method: 'POST',
      body: JSON.stringify({ id: Number(requestId) })
    });
  },

  // -------------------------------------------------------------
  // 5. Billing & Statements (Phase M4)
  // -------------------------------------------------------------

  /**
   * Current statement & ledger breakdown
   */
  async getBilling() {
    return apiRequest('/mychart/billing');
  },

  /**
   * Past settled payment history
   */
  async getBillingHistory() {
    return apiRequest('/mychart/billing/history');
  },

  /**
   * Specific payment receipt
   */
  async getBillingReceipt(paymentId) {
    return apiRequest(`/mychart/billing/receipt?payment_id=${Number(paymentId)}`);
  },

  /**
   * Initiate online payment or record counter intent
   */
  async payBilling(payload) {
    return apiRequest('/mychart/billing/pay', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async cancelPaymentAttempt(attemptId) {
    return apiRequest('/mychart/billing/cancel', {
      method: 'POST',
      body: JSON.stringify({ attempt_id: attemptId })
    });
  },

  // -------------------------------------------------------------
  // 6. e-Check-In Wizard (Phase M5)
  // -------------------------------------------------------------

  /**
   * List appointments open for e-check-in (within 48 hours)
   */
  async getCheckinOpen() {
    return apiRequest('/mychart/checkin');
  },

  /**
   * Start check-in wizard for an appointment
   */
  async startCheckin(appointmentId) {
    return apiRequest(`/mychart/checkin/start?appointment_id=${Number(appointmentId)}`);
  },

  /**
   * Submit step response (demographics, insurance, consent, questionnaire)
   */
  async submitCheckinStep(payload) {
    return apiRequest('/mychart/checkin/step', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Finalize and complete e-check-in
   */
  async completeCheckin(appointmentId) {
    return apiRequest('/mychart/checkin/complete', {
      method: 'POST',
      body: JSON.stringify({
        appointment_id: Number(appointmentId),
        checkin_id: Number(appointmentId)
      })
    });
  },

  // -------------------------------------------------------------
  // 7. Track My Health - Vitals Self-Readings (Phase M7)
  // -------------------------------------------------------------

  /**
   * Get historical self-readings and configured goal bands
   */
  async getReadings(kind = '', days = 90) {
    const params = new URLSearchParams();
    if (kind) params.append('kind', kind);
    if (days) params.append('days', String(days));
    const qs = params.toString();
    return apiRequest(`/mychart/readings${qs ? `?${qs}` : ''}`);
  },

  /**
   * Record a new reading (bp, weight, glucose, temp, etc.)
   */
  async recordReading(payload) {
    return apiRequest('/mychart/readings', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Delete an inaccurate self-reading
   */
  async deleteReading(readingId) {
    return apiRequest('/mychart/readings/delete', {
      method: 'POST',
      body: JSON.stringify({ id: Number(readingId) })
    });
  },

  /**
   * Set a personal reading target goal
   */
  async saveReadingGoal(payload) {
    return apiRequest('/mychart/reading-goals', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // -------------------------------------------------------------
  // 8. Account, Proxy & Record Sharing (Phase M8)
  // -------------------------------------------------------------

  /**
   * Proxy access list, pending requests, and shared links
   */
  async getAccount() {
    return apiRequest('/mychart/account');
  },

  /**
   * Access audit log ("who has accessed my record")
   */
  async getAccessLog(days = 90) {
    return apiRequest(`/mychart/access-log?days=${Number(days)}`);
  },

  /**
   * Get formatted digital health record summary pack
   */
  async getRecordPack(scope = []) {
    const query = scope.length > 0 ? `?scope=${scope.join(',')}` : '';
    return apiRequest(`/mychart/record-pack${query}`);
  },

  /**
   * Generate an outside doctor share link
   */
  async createShare(payload) {
    return apiRequest('/mychart/shares', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Revoke an active share link
   */
  async revokeShare(shareId) {
    return apiRequest('/mychart/shares/revoke', {
      method: 'POST',
      body: JSON.stringify({ id: Number(shareId) })
    });
  },

  /**
   * Request proxy access to another patient (e.g. child or elderly parent)
   */
  async requestProxyAccess(payload) {
    return apiRequest('/mychart/proxy-requests', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Revoke someone's proxy access to my chart
   */
  async revokeProxyAccess(relatedPersonId) {
    return apiRequest('/mychart/proxy-access/revoke', {
      method: 'POST',
      body: JSON.stringify({ id: Number(relatedPersonId) })
    });
  }
};
