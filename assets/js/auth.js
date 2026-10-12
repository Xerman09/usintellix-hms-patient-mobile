import { apiRequest } from "./api.js";

const PATIENT_SESSION_KEY = "usintellix_patient_session";

export const AuthService = {
    /**
     * Submit login credentials.
     * Note: Non-patient roles (e.g. admin, doctor, nurse) are strictly disallowed on this mobile portal.
     */
    async login(username, password) {
        const response = await apiRequest("/login", {
            method: "POST",
            body: JSON.stringify({ username, password })
        });

        if (response.success && response.data?.user) {
            const user = response.data.user;
            
            // Security verification: Ensure the user is a patient
            if (user.role && user.role !== "patient") {
                // Terminate session immediately on server
                await this.logout();
                return {
                    success: false,
                    isStaffAttempt: true,
                    message: "Access restricted: This mobile portal is reserved exclusively for Patients. Healthcare staff must sign in via the Staff Management portal."
                };
            }

            this.savePatientSession(user);
        }

        return response;
    },

    /**
     * Verify 2FA OTP Code
     */
    async verify2FA(code) {
        const response = await apiRequest("/verify-2fa", {
            method: "POST",
            body: JSON.stringify({ code })
        });

        if (response.success && response.data?.user) {
            const user = response.data.user;
            if (user.role && user.role !== "patient") {
                await this.logout();
                return {
                    success: false,
                    isStaffAttempt: true,
                    message: "Access restricted: Staff accounts cannot access the patient mobile app."
                };
            }
            this.savePatientSession(user);
        }

        return response;
    },

    /**
     * Request a fresh 2FA code
     */
    async resend2FA() {
        return await apiRequest("/resend-2fa", {
            method: "POST"
        });
    },

    /**
     * Complete first login password change
     */
    async completeFirstLogin(data) {
        return await apiRequest("/auth/first-login", {
            method: "PUT",
            body: JSON.stringify(data)
        });
    },

    /**
     * Update expired password (HIPAA 90-day requirement)
     */
    async updateExpiredPassword(data) {
        return await apiRequest("/auth/expired-password", {
            method: "PUT",
            body: JSON.stringify(data)
        });
    },

    /**
     * Acknowledge HIPAA Notice of Privacy Practices
     */
    async acknowledgeNpp(signatureName) {
        return await apiRequest("/auth/npp-acknowledge", {
            method: "POST",
            body: JSON.stringify({
                signature_data: signatureName,
                signature_type: "electronic",
                npp_version: "2026-09"
            })
        });
    },

    /**
     * Logout and destroy session
     */
    async logout() {
        try {
            await apiRequest("/logout", { method: "POST" });
        } catch (e) {
            // ignore network issues during logout
        } finally {
            this.clearPatientSession();
        }
    },

    /**
     * Check current session / ping
     */
    async checkSession() {
        const response = await apiRequest("/auth/me", { method: "GET" });
        if (response.success && response.data) {
            if (response.data.role && response.data.role !== "patient") {
                this.clearPatientSession();
                return null;
            }
            this.savePatientSession(response.data);
            return response.data;
        }
        this.clearPatientSession();
        return null;
    },

    savePatientSession(user) {
        try {
            localStorage.setItem(PATIENT_SESSION_KEY, JSON.stringify(user));
        } catch (e) {}
    },

    getStoredPatient() {
        try {
            const data = localStorage.getItem(PATIENT_SESSION_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    },

    clearPatientSession() {
        try {
            localStorage.removeItem(PATIENT_SESSION_KEY);
        } catch (e) {}
    }
};
