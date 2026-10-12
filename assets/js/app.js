import { AuthService } from "./auth.js";
import { CONFIG } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
    initPatientMobileApp();
});

function initPatientMobileApp() {
    // DOM Elements - Forms & Steps
    const stepLogin = document.getElementById("stepLogin");
    const stepTwoFactor = document.getElementById("stepTwoFactor");
    const stepFirstLogin = document.getElementById("stepFirstLogin");
    const stepExpiredPassword = document.getElementById("stepExpiredPassword");
    const stepNpp = document.getElementById("stepNpp");
    const stepDashboard = document.getElementById("stepDashboard");

    const loginForm = document.getElementById("loginForm");
    const twoFactorForm = document.getElementById("twoFactorForm");
    const firstLoginForm = document.getElementById("firstLoginForm");
    const expiredPasswordForm = document.getElementById("expiredPasswordForm");
    const nppForm = document.getElementById("nppForm");

    const alertBox = document.getElementById("appAlert");
    const alertMessage = document.getElementById("alertMessage");

    // Inputs
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const rememberMeCheck = document.getElementById("rememberMe");
    const loginSubmitBtn = document.getElementById("loginSubmitBtn");

    // Initialize Remembered Username
    try {
        const savedUser = localStorage.getItem("usintellix_remembered_patient");
        if (savedUser) {
            usernameInput.value = savedUser;
            rememberMeCheck.checked = true;
            passwordInput.focus();
        }
    } catch (e) {}

    // Setup Password Visibility Toggles
    setupPasswordToggles();

    // Check if user is already logged in as a Patient
    checkExistingSession();

    // ----------------------------------------------------
    // Step Switcher Helper
    // ----------------------------------------------------
    function switchStep(activeStepEl) {
        clearAlert();
        clearFormErrors();
        [stepLogin, stepTwoFactor, stepFirstLogin, stepExpiredPassword, stepNpp, stepDashboard].forEach(el => {
            if (el) el.classList.remove("active");
        });
        if (activeStepEl) {
            activeStepEl.classList.add("active");
        }
    }

    // ----------------------------------------------------
    // Alert Display Helper
    // ----------------------------------------------------
    function showAlert(msg, type = "error") {
        if (!alertBox || !alertMessage) return;
        alertMessage.innerHTML = msg;
        alertBox.className = `alert-box show ${type}`;
        alertBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function clearAlert() {
        if (alertBox) {
            alertBox.className = "alert-box";
            alertMessage.innerHTML = "";
        }
    }

    function clearFormErrors() {
        document.querySelectorAll(".field-error").forEach(el => el.textContent = "");
    }

    function setBtnLoading(btn, isLoading, loadingText = "Processing...") {
        if (!btn) return;
        if (isLoading) {
            btn.dataset.origText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = `<div class="spinner"></div><span>${loadingText}</span>`;
        } else {
            btn.disabled = false;
            btn.innerHTML = btn.dataset.origText || "Submit";
        }
    }

    // ----------------------------------------------------
    // Check Existing Session
    // ----------------------------------------------------
    async function checkExistingSession() {
        const storedPatient = AuthService.getStoredPatient();
        if (storedPatient) {
            renderPatientDashboard(storedPatient);
            switchStep(stepDashboard);
            return;
        }

        // Check backend session via /auth/me
        const user = await AuthService.checkSession();
        if (user && user.role === "patient") {
            renderPatientDashboard(user);
            switchStep(stepDashboard);
        }
    }

    // ----------------------------------------------------
    // Login Submit Handler
    // ----------------------------------------------------
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearAlert();
        clearFormErrors();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        let hasError = false;
        if (!username) {
            document.getElementById("err-username").textContent = "Patient username is required.";
            hasError = true;
        }
        if (!password) {
            document.getElementById("err-password").textContent = "Password is required.";
            hasError = true;
        }
        if (hasError) return;

        // Save or clear remembered username
        if (rememberMeCheck.checked) {
            localStorage.setItem("usintellix_remembered_patient", username);
        } else {
            localStorage.removeItem("usintellix_remembered_patient");
        }

        setBtnLoading(loginSubmitBtn, true, "Verifying...");

        try {
            const result = await AuthService.login(username, password);
            setBtnLoading(loginSubmitBtn, false);

            if (!result.success) {
                // If staff account tried to login
                if (result.isStaffAttempt) {
                    showAlert(result.message, "warning");
                    return;
                }

                // HIPAA Account Lockout handling
                if (result.locked) {
                    showAlert(`
                        <strong>Account Locked</strong><br>
                        ${result.message}
                    `, "error");
                    return;
                }

                // Password Expired Handling (90-day HIPAA renewal)
                if (result.password_expired) {
                    setupExpiredPasswordStep(result);
                    return;
                }

                // General Error Message & Field Validation
                showAlert(result.message || "Invalid username or password.", "error");

                if (result.errors) {
                    if (result.errors.username) document.getElementById("err-username").textContent = result.errors.username;
                    if (result.errors.password) document.getElementById("err-password").textContent = result.errors.password;
                }
                return;
            }

            // Two-Factor Authentication Required
            if (result.data?.requires_2fa) {
                setupTwoFactorStep(result.data);
                return;
            }

            // Successful authentication -> Route based on HIPAA checks
            handlePostLoginState(result.data.user);

        } catch (err) {
            setBtnLoading(loginSubmitBtn, false);
            showAlert("A network error occurred. Please check your connection and try again.", "error");
        }
    });

    // ----------------------------------------------------
    // Post Login Routing (First login, Consent, Dashboard)
    // ----------------------------------------------------
    function handlePostLoginState(user) {
        if (!user) return;

        // 1. Mandatory First Login Password Setup
        if (user.must_change_password) {
            setupFirstLoginStep(user);
            return;
        }

        // 2. Mandatory HIPAA NPP (Notice of Privacy Practices) Acknowledgment
        if (!user.npp_acknowledged) {
            setupNppStep(user);
            return;
        }

        // 3. Normal Patient Dashboard
        renderPatientDashboard(user);
        switchStep(stepDashboard);
    }

    // ----------------------------------------------------
    // 2FA Verification Flow
    // ----------------------------------------------------
    let resendCountdownTimer = null;

    function setupTwoFactorStep(data) {
        switchStep(stepTwoFactor);
        const codeInput = document.getElementById("tfa_code");
        codeInput.value = "";
        codeInput.focus();

        const instructions = document.getElementById("tfaInstructions");
        if (instructions) {
            instructions.textContent = data.message || "A 6-digit verification code was sent to your contact on file.";
        }

        // Start Resend Cooldown
        startResendTimer(60);
    }

    function startResendTimer(seconds) {
        const resendBtn = document.getElementById("resendTfaBtn");
        const timerText = document.getElementById("tfaTimer");
        if (!resendBtn) return;

        clearInterval(resendCountdownTimer);
        resendBtn.disabled = true;

        let remaining = seconds;
        const updateText = () => {
            if (remaining > 0) {
                timerText.textContent = `Code expires in ${remaining}s`;
                resendBtn.textContent = `Resend in ${remaining}s`;
                remaining--;
            } else {
                clearInterval(resendCountdownTimer);
                timerText.textContent = "";
                resendBtn.textContent = "Resend Code";
                resendBtn.disabled = false;
            }
        };
        updateText();
        resendCountdownTimer = setInterval(updateText, 1000);
    }

    twoFactorForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearAlert();
        clearFormErrors();

        const codeInput = document.getElementById("tfa_code");
        const code = codeInput.value.trim();
        const submitBtn = twoFactorForm.querySelector("button[type='submit']");

        if (!code || code.length !== 6) {
            document.getElementById("err-tfa_code").textContent = "Please enter the complete 6-digit code.";
            return;
        }

        setBtnLoading(submitBtn, true, "Verifying code...");

        try {
            const result = await AuthService.verify2FA(code);
            setBtnLoading(submitBtn, false);

            if (!result.success) {
                document.getElementById("err-tfa_code").textContent = result.message || "Invalid or expired code.";
                return;
            }

            handlePostLoginState(result.data.user);
        } catch (err) {
            setBtnLoading(submitBtn, false);
            showAlert("Failed to verify code. Please try again.", "error");
        }
    });

    document.getElementById("resendTfaBtn").addEventListener("click", async () => {
        const resendBtn = document.getElementById("resendTfaBtn");
        resendBtn.disabled = true;
        resendBtn.textContent = "Sending...";

        try {
            const result = await AuthService.resend2FA();
            if (result.success) {
                showAlert("A fresh verification code has been dispatched.", "success");
                startResendTimer(60);
            } else {
                showAlert(result.message || "Unable to resend code right now.", "warning");
                resendBtn.disabled = false;
                resendBtn.textContent = "Resend Code";
            }
        } catch (e) {
            resendBtn.disabled = false;
            resendBtn.textContent = "Resend Code";
        }
    });

    document.getElementById("backToLoginFrom2fa").addEventListener("click", () => {
        switchStep(stepLogin);
    });

    // ----------------------------------------------------
    // First Login Flow (Required Credential Rotation)
    // ----------------------------------------------------
    let pendingFirstLoginUser = null;

    function setupFirstLoginStep(user) {
        pendingFirstLoginUser = user;
        switchStep(stepFirstLogin);

        document.getElementById("fl_username").value = user.username || "";
        document.getElementById("fl_current_password").value = "";
        document.getElementById("fl_new_password").value = "";
        document.getElementById("fl_confirm_password").value = "";
        document.getElementById("fl_confirm_email").value = "";

        showAlert("Welcome! As this is your first sign-in, security policy requires setting your personal password.", "warning");
    }

    firstLoginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearAlert();
        clearFormErrors();

        const currentPassword = document.getElementById("fl_current_password").value;
        const newUsername = document.getElementById("fl_username").value.trim();
        const newPassword = document.getElementById("fl_new_password").value;
        const confirmPassword = document.getElementById("fl_confirm_password").value;
        const confirmEmail = document.getElementById("fl_confirm_email").value.trim();

        if (newPassword !== confirmPassword) {
            document.getElementById("err-fl_confirm_password").textContent = "Passwords do not match.";
            return;
        }

        const submitBtn = firstLoginForm.querySelector("button[type='submit']");
        setBtnLoading(submitBtn, true, "Saving credentials...");

        try {
            const result = await AuthService.completeFirstLogin({
                username: newUsername,
                current_password: currentPassword,
                new_password: newPassword,
                confirm_password: confirmPassword,
                confirm_email: confirmEmail
            });

            setBtnLoading(submitBtn, false);

            if (!result.success) {
                showAlert(result.message || "Could not update credentials.", "error");
                if (result.errors) {
                    if (result.errors.current_password) document.getElementById("err-fl_current_password").textContent = result.errors.current_password;
                    if (result.errors.username) document.getElementById("err-fl_username").textContent = result.errors.username;
                    if (result.errors.new_password) document.getElementById("err-fl_new_password").textContent = result.errors.new_password;
                    if (result.errors.confirm_email) document.getElementById("err-fl_confirm_email").textContent = result.errors.confirm_email;
                }
                return;
            }

            // Updated successfully, now refresh session user
            if (pendingFirstLoginUser) {
                pendingFirstLoginUser.must_change_password = false;
                pendingFirstLoginUser.username = newUsername;
                AuthService.savePatientSession(pendingFirstLoginUser);
            }

            showAlert("Credentials successfully updated! Logging into patient portal...", "success");
            setTimeout(() => {
                handlePostLoginState(pendingFirstLoginUser);
            }, 1000);

        } catch (err) {
            setBtnLoading(submitBtn, false);
            showAlert("Failed to save credentials. Please try again.", "error");
        }
    });

    document.getElementById("firstLoginCancelBtn").addEventListener("click", async () => {
        await AuthService.logout();
        switchStep(stepLogin);
    });

    // ----------------------------------------------------
    // Expired Password Step (HIPAA 90-day renewal)
    // ----------------------------------------------------
    let pendingExpiredResult = null;

    function setupExpiredPasswordStep(result) {
        pendingExpiredResult = result;
        switchStep(stepExpiredPassword);

        document.getElementById("exp_user_id").value = result.user_id || "";
        document.getElementById("exp_username").value = result.username || "";
        document.getElementById("exp_current_password").value = "";
        document.getElementById("exp_new_password").value = "";
        document.getElementById("exp_confirm_password").value = "";

        showAlert(result.message || "Your password has expired (90-day policy). Please create a new password.", "warning");
    }

    expiredPasswordForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearAlert();
        clearFormErrors();

        const currentPassword = document.getElementById("exp_current_password").value;
        const newPassword = document.getElementById("exp_new_password").value;
        const confirmPassword = document.getElementById("exp_confirm_password").value;
        const userId = parseInt(document.getElementById("exp_user_id").value, 10);
        const username = document.getElementById("exp_username").value;

        if (newPassword !== confirmPassword) {
            document.getElementById("err-exp_confirm_password").textContent = "Passwords do not match.";
            return;
        }

        const submitBtn = expiredPasswordForm.querySelector("button[type='submit']");
        setBtnLoading(submitBtn, true, "Updating Password...");

        try {
            const result = await AuthService.updateExpiredPassword({
                user_id: userId,
                username: username,
                current_password: currentPassword,
                new_password: newPassword,
                confirm_password: confirmPassword
            });

            setBtnLoading(submitBtn, false);

            if (!result.success) {
                showAlert(result.message || "Failed to update password.", "error");
                if (result.errors) {
                    if (result.errors.current_password) document.getElementById("err-exp_current_password").textContent = result.errors.current_password;
                    if (result.errors.new_password) document.getElementById("err-exp_new_password").textContent = result.errors.new_password;
                }
                return;
            }

            showAlert("Password updated successfully!", "success");
            setTimeout(() => {
                handlePostLoginState(result.data?.user);
            }, 1000);

        } catch (e) {
            setBtnLoading(submitBtn, false);
            showAlert("Could not update password. Please try again.", "error");
        }
    });

    document.getElementById("expiredPasswordCancelBtn").addEventListener("click", () => {
        switchStep(stepLogin);
    });

    // ----------------------------------------------------
    // HIPAA NPP Privacy Notice Acknowledgment Flow
    // ----------------------------------------------------
    let pendingNppUser = null;

    function setupNppStep(user) {
        pendingNppUser = user;
        switchStep(stepNpp);
        document.getElementById("npp_signature_name").value = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    }

    nppForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearAlert();
        clearFormErrors();

        const agreeCheck = document.getElementById("npp_agree_check");
        const sigInput = document.getElementById("npp_signature_name");
        const sigName = sigInput.value.trim();

        let hasErr = false;
        if (!agreeCheck.checked) {
            document.getElementById("err-npp_agree").textContent = "You must acknowledge and accept the privacy notice.";
            hasErr = true;
        }
        if (!sigName) {
            document.getElementById("err-npp_signature").textContent = "Please provide your full legal name.";
            hasErr = true;
        }
        if (hasErr) return;

        const submitBtn = nppForm.querySelector("button[type='submit']");
        setBtnLoading(submitBtn, true, "Submitting Consent...");

        try {
            const result = await AuthService.acknowledgeNpp(sigName);
            setBtnLoading(submitBtn, false);

            if (!result.success) {
                showAlert(result.message || "Failed to record privacy acknowledgment.", "error");
                return;
            }

            if (pendingNppUser) {
                pendingNppUser.npp_acknowledged = true;
                AuthService.savePatientSession(pendingNppUser);
            }

            showAlert("Notice of Privacy Practices acknowledged.", "success");
            setTimeout(() => {
                renderPatientDashboard(pendingNppUser);
                switchStep(stepDashboard);
            }, 800);

        } catch (e) {
            setBtnLoading(submitBtn, false);
            showAlert("Failed to submit consent. Please try again.", "error");
        }
    });

    document.getElementById("nppCancelBtn").addEventListener("click", async () => {
        await AuthService.logout();
        switchStep(stepLogin);
    });

    // ----------------------------------------------------
    // Patient Authenticated Dashboard
    // ----------------------------------------------------
    function renderPatientDashboard(user) {
        const nameEl = document.getElementById("dashPatientName");
        const userEl = document.getElementById("dashPatientUsername");
        const avatarEl = document.getElementById("dashPatientAvatar");

        const fullName = `${user.first_name || "Valued"} ${user.last_name || "Patient"}`.trim();
        if (nameEl) nameEl.textContent = fullName;
        if (userEl) userEl.textContent = `@${user.username || "patient"}`;

        if (avatarEl) {
            const initial = (user.first_name ? user.first_name[0] : (user.username ? user.username[0] : "P")).toUpperCase();
            avatarEl.textContent = initial;
        }
    }

    // Patient Logout Button
    document.getElementById("patientLogoutBtn").addEventListener("click", async () => {
        const logoutBtn = document.getElementById("patientLogoutBtn");
        setBtnLoading(logoutBtn, true, "Signing out...");
        await AuthService.logout();
        setBtnLoading(logoutBtn, false);
        switchStep(stepLogin);
        showAlert("You have successfully signed out.", "success");
    });

    // Quick demo modal / Support button
    const supportBtn = document.getElementById("contactSupportBtn");
    if (supportBtn) {
        supportBtn.addEventListener("click", () => {
            alert("USIntellix Patient Care Helpdesk:\n\nTelephone: 1-800-555-CARE (2273)\nEmail: support@usintellix.health\nHours: 24/7 Patient Assistance");
        });
    }

    const forgotPassBtn = document.getElementById("forgotPasswordBtn");
    if (forgotPassBtn) {
        forgotPassBtn.addEventListener("click", () => {
            alert("Forgot Password / Account Recovery:\n\nFor security and HIPAA patient identity verification, please contact your clinic receptionist or call 1-800-555-CARE to request a secure reset PIN.");
        });
    }
}

// ----------------------------------------------------
// Password Visibility Toggles
// ----------------------------------------------------
function setupPasswordToggles() {
    document.querySelectorAll(".password-toggle-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            if (!input) return;

            const isPassword = input.type === "password";
            input.type = isPassword ? "text" : "password";

            btn.innerHTML = isPassword ? `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
            ` : `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>
            `;
        });
    });
}
