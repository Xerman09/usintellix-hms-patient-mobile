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
  // 4d. Questionnaires between visits (Phase M13)
  // -------------------------------------------------------------

  /**
   * Questionnaires the care team has sent to answer at home: `waiting` (each with
   * can_answer and a status_text to show instead of a dead button) and `answered`.
   *
   * No score ever comes back here. PHQ-9 and GAD-7 are scored on the server and
   * read by the care team; showing a patient a number they cannot interpret is
   * worse than showing none.
   */
  async getMyQuestionnaires() {
    return apiRequest('/mychart/questionnaires');
  },

  /**
   * The questions of one of them. Question types are text, textarea, yesno,
   * choice, checkboxes and `scale` — a scale question's answer is the INDEX of
   * the chosen option (0 to 3), not its label.
   */
  async getQuestionnaireForm(assignmentId) {
    return apiRequest(`/mychart/questionnaires/form?id=${Number(assignmentId)}`);
  },

  /**
   * Send the answers. `answers` is keyed by each question's `key`. The reply's
   * data.team_notified is true when a scored answer crossed the instrument's
   * band and the care team was alerted today — say so, do not say the score.
   */
  async submitQuestionnaire(assignmentId, answers) {
    return apiRequest('/mychart/questionnaires/submit', {
      method: 'POST',
      body: JSON.stringify({ id: Number(assignmentId), answers })
    });
  },

  // -------------------------------------------------------------
  // 4e. What you are due for (Phase M14)
  // -------------------------------------------------------------

  /**
   * Screenings and vaccinations this patient is due for, overdue on, or up to
   * date with, plus their own requests about them.
   *
   * Each item carries `status` (overdue | due | up_to_date), a `status_text`
   * sentence to show instead of working one out from dates, `can_request`, and
   * `pending_request` when they have already asked. Only items the hospital has
   * approved for patients come back at all -- the rules engine matches on age
   * and sex alone, so it is the server that decides what is safe to show.
   */
  async getHealthMaintenance() {
    return apiRequest('/mychart/health-maintenance');
  },

  /**
   * Ask about one of them. Neither action changes the record.
   *
   * @param {Object} payload { id, action: 'book'|'report_done', note?,
   *   done_on? (YYYY-MM-DD, report_done only), done_where? }
   */
  async requestCareGap(payload) {
    return apiRequest('/mychart/health-maintenance/request', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /** Take back a request the clinic has not looked at yet. */
  async withdrawCareGapRequest(requestId) {
    return apiRequest('/mychart/health-maintenance/withdraw', {
      method: 'POST',
      body: JSON.stringify({ id: Number(requestId) })
    });
  },

  // -------------------------------------------------------------
  // 4f. What this will cost (Phase M16)
  // -------------------------------------------------------------

  /**
   * The estimates issued to this patient, and any cost questions they have
   * outstanding.
   *
   * Every figure on an estimate was snapshotted when it was issued -- including
   * the currency -- so an estimate re-read later shows what the patient was
   * told, not today's price list. Use `quoted_display` rather than formatting
   * `quoted_total` here: the server formats with the currency recorded on that
   * estimate, which may not be the hospital's current one.
   *
   * `expired` is computed on read from valid_until, and `status_text` is the
   * sentence to show for it. An expired estimate is still returned, because a
   * patient should be able to see what they were quoted and that it has lapsed.
   */
  async getEstimates() {
    return apiRequest('/mychart/estimates');
  },

  /**
   * The hospital's priced packages, for browsing before asking.
   *
   * Both prices come back (`standard_total` and `discounted_total`) because
   * which one applies is a billing decision, and `has_breakdown` says whether
   * an item-by-item view exists for that package at all -- most are priced as
   * one bundle, so the inclusions and exclusions text is the useful part.
   */
  async getEstimateCatalogue() {
    return apiRequest('/mychart/estimates/catalogue');
  },

  /**
   * One estimate in full, including its lines when it has any.
   *
   * A POST because it carries an id; the server resolves the patient itself and
   * will not return somebody else's estimate.
   */
  async getEstimate(estimateId) {
    return apiRequest('/mychart/estimates/show', {
      method: 'POST',
      body: JSON.stringify({ id: Number(estimateId) })
    });
  },

  /**
   * Ask the billing desk what something will cost.
   *
   * Either a package from the catalogue or free text -- the most common
   * question is about something with no package at all.
   *
   * @param {Object} payload { package_id?, asked_about?, note? }
   */
  async requestEstimate(payload) {
    return apiRequest('/mychart/estimates/request', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /** Take back a cost question the desk has not answered yet. */
  async withdrawEstimateRequest(requestId) {
    return apiRequest('/mychart/estimates/withdraw', {
      method: 'POST',
      body: JSON.stringify({ id: Number(requestId) })
    });
  },

  // -------------------------------------------------------------
  // 4g. Online visits (Phase M15a)
  // -------------------------------------------------------------

  /**
   * This patient's online visits.
   *
   * `can_raise` is false when they already have one open, and `blocked_reason`
   * explains when the whole feature is switched off -- it ships off, because an
   * e-visit puts clinical triage in front of a patient.
   *
   * Refused e-visits are never in this list. A red-flag answer is refused on
   * screen at the moment of submission; listing it afterwards as though it were
   * in progress is the exact confusion the refusal exists to prevent.
   */
  async getEvisits() {
    return apiRequest('/mychart/evisits');
  },

  /** What an online visit can be raised about, with each one's "not for this" warning. */
  async getEvisitReasons() {
    return apiRequest('/mychart/evisits/reasons');
  },

  /**
   * The questions for one reason.
   *
   * Items with `is_safety_check` are the red-flag screening and must be asked
   * FIRST, before the rest. What answer trips a flag is deliberately not sent
   * to the device -- screening happens on the server, so a client that knew the
   * triggers could not be made to route around them.
   */
  async getEvisitForm(reasonCode) {
    return apiRequest(`/mychart/evisits/form?reason=${encodeURIComponent(reasonCode)}`);
  },

  /**
   * Raise one.
   *
   * IMPORTANT: a red-flag answer comes back as HTTP 200 with
   * `success: false, refused: true` and an `urgent` block. That is not a
   * validation error and must not be shown as a toast -- render `urgent` as a
   * full-screen "get help now", including its `terms`, which say in plain words
   * that nobody is reading the message and not to wait for a reply.
   *
   * @param {Object} payload { reason_code, answers: { [key]: string } }
   */
  async submitEvisit(payload) {
    return apiRequest('/mychart/evisits', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /** One of mine, with the thread and what I told them. */
  async getEvisit(evisitId) {
    return apiRequest('/mychart/evisits/show', {
      method: 'POST',
      body: JSON.stringify({ id: Number(evisitId) })
    });
  },

  /** One follow-up question after a reply, inside the follow-up window. */
  async followUpEvisit(evisitId, body) {
    return apiRequest('/mychart/evisits/follow-up', {
      method: 'POST',
      body: JSON.stringify({ id: Number(evisitId), body })
    });
  },

  /** Take back one nobody has replied to yet. */
  async withdrawEvisit(evisitId) {
    return apiRequest('/mychart/evisits/withdraw', {
      method: 'POST',
      body: JSON.stringify({ id: Number(evisitId) })
    });
  },

  // -------------------------------------------------------------
  // 4h. Fast Pass -- being offered an earlier appointment (Phase M18)
  // -------------------------------------------------------------

  /**
   * Any live offer, which of my appointments are on the list, and which could be.
   *
   * `offers` comes first in the payload because it is the only time-limited thing
   * in My Chart: each one carries `deadline` and `minutes_left`, and a patient who
   * has to scroll past a list to find it may miss it.
   *
   * Note what is NOT here: a queue position. The desk can see it, the patient
   * cannot, because it moves for reasons that have nothing to do with them.
   */
  async getFastPass() {
    return apiRequest('/mychart/fastpass');
  },

  /**
   * Ask to be offered anything earlier for an appointment I already hold.
   *
   * `earliest_date` is optional and is a hard constraint, not a preference -- "I
   * am away until the 20th". An offer that breaks it would be useless.
   *
   * @param {number} appointmentId
   * @param {string} [earliestDate] YYYY-MM-DD
   */
  async joinFastPass(appointmentId, earliestDate) {
    return apiRequest('/mychart/fastpass/join', {
      method: 'POST',
      body: JSON.stringify({
        appointment_id: Number(appointmentId),
        earliest_date: earliestDate || ''
      })
    });
  },

  /** Come off the list. The appointment is not touched. */
  async leaveFastPass(waitlistId) {
    return apiRequest('/mychart/fastpass/leave', {
      method: 'POST',
      body: JSON.stringify({ waitlist_id: Number(waitlistId) })
    });
  },

  /**
   * Take the offered slot, which MOVES the appointment named on the offer.
   *
   * Takes an offer id and nothing else -- the appointment, the slot and the
   * patient all come from the offer row on the server.
   *
   * A failure here is usually not an error: a few patients are offered the same
   * slot and somebody else may have answered first. The message says so, and the
   * right thing to do is show it and reload, not retry.
   */
  async acceptFastPass(offerId) {
    return apiRequest('/mychart/fastpass/accept', {
      method: 'POST',
      body: JSON.stringify({ offer_id: Number(offerId) })
    });
  },

  /** Turn this one down and stay on the list. */
  async declineFastPass(offerId, reason) {
    return apiRequest('/mychart/fastpass/decline', {
      method: 'POST',
      body: JSON.stringify({ offer_id: Number(offerId), reason: reason || '' })
    });
  },

  // -------------------------------------------------------------
  // 4i. The chart itself -- allergies, conditions, medicines,
  //     operations, implants, vaccinations (Phase M19)
  // -------------------------------------------------------------

  /**
   * The patient's own clinical lists, already filtered for what they may see.
   *
   * USE THIS RATHER THAN /health-summary FOR THESE SIX LISTS.
   *
   * /health-summary is the shared CCD endpoint staff read too. It returns rows
   * straight from the tables, including ones whose verification_status is
   * `Refuted` (a clinician decided the patient does NOT have this) or
   * `Entered in Error`. Rendering those tells a patient they have something that
   * was ruled out.
   *
   * This endpoint applies that gate, marks unconfirmed items as unconfirmed,
   * carries the hospital's own wording for each list -- including what an EMPTY
   * list means, which is not the same as "you have none" -- and goes through
   * PortalGuard, so it is capability-gated and appears in the patient's own
   * access log. /health-summary is none of those things.
   */
  async getChart() {
    return apiRequest('/mychart/chart');
  },

  /**
   * Say that one item on the chart is wrong.
   *
   * Never an edit: the patient does not write to their own clinical record.
   * This raises a request a clinician answers either way.
   *
   * @param {Object} payload { section, item_id, says, asks }
   *   asks is one of remove | correct | add_detail | unsure
   */
  async raiseChartCorrection(payload) {
    return apiRequest('/mychart/chart/correction', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /** Take one back while it is still waiting. */
  async withdrawChartCorrection(id) {
    return apiRequest('/mychart/chart/correction/withdraw', {
      method: 'POST',
      body: JSON.stringify({ id: Number(id) })
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
