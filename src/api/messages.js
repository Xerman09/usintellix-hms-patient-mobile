import { apiRequest } from './client';

export const MessagingService = {
  /**
   * "My Messages" inbox list: ?scope=all|active|inactive
   * Returns flat list matching web table: sender_name, type_name, patient_name, body, created_at, status_name, is_unread, deleted_at, etc.
   */
  async getMyMessages(scope = 'active') {
    return await apiRequest(`/messages/mine?scope=${encodeURIComponent(scope)}`, {
      method: 'GET'
    });
  },

  /**
   * List conversations the logged-in patient participates in
   */
  async getConversations() {
    return await apiRequest('/messages', {
      method: 'GET'
    });
  },

  /**
   * Get single conversation details with participants
   */
  async getConversation(conversationId) {
    return await apiRequest(`/messages/conversation?conversation_id=${conversationId}`, {
      method: 'GET'
    });
  },

  /**
   * Get messages inside a conversation thread
   */
  async getConversationMessages(conversationId) {
    return await apiRequest(`/messages/conversation/messages?conversation_id=${conversationId}`, {
      method: 'GET'
    });
  },

  /**
   * Send a message inside an existing conversation
   */
  async sendMessage(conversationId, body, extra = {}) {
    return await apiRequest('/messages/conversation/messages', {
      method: 'POST',
      body: JSON.stringify({
        conversation_id: conversationId,
        body,
        ...extra
      })
    });
  },

  /**
   * Mark a conversation as read
   */
  async markRead(conversationId) {
    return await apiRequest('/messages/conversation/read', {
      method: 'POST',
      body: JSON.stringify({
        conversation_id: conversationId
      })
    });
  },

  /**
   * Soft-delete a message
   */
  async deleteMessage(messageId) {
    return await apiRequest('/messages/conversation/messages', {
      method: 'DELETE',
      body: JSON.stringify({
        message_id: messageId
      })
    });
  },

  /**
   * Get care team members / recipients available for the patient
   */
  async getRecipients() {
    return await apiRequest('/messages/recipients', {
      method: 'GET'
    });
  },

  /**
   * Get message types
   */
  async getMessageTypes() {
    return await apiRequest('/messages/types', {
      method: 'GET'
    });
  },

  /**
   * Get message statuses
   */
  async getMessageStatuses() {
    return await apiRequest('/messages/statuses', {
      method: 'GET'
    });
  },

  /**
   * Start a new conversation thread with participant IDs and optional subject
   */
  async startConversation(participantIds, subject, initialMessage, extra = {}) {
    const res = await apiRequest('/messages', {
      method: 'POST',
      body: JSON.stringify({
        participant_ids: participantIds,
        subject
      })
    });

    if (res.success && res.data?.conversation_id && initialMessage) {
      await this.sendMessage(res.data.conversation_id, initialMessage, extra);
    }

    return res;
  },

  /**
   * Dated Reminders
   */
  async getMyReminders() {
    return await apiRequest('/reminders/mine', {
      method: 'GET'
    });
  },

  /**
   * Upcoming Recalls
   */
  async getMyRecalls() {
    return await apiRequest('/recalls/mine', {
      method: 'GET'
    });
  }
};
