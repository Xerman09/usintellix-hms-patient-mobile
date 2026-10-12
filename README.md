# USIntellix Patient Mobile App (React Native Android APK)

A native mobile application built using **React Native** for patient login and portal access in the **USIntellix Hospital Management System (HMS)**.

---

## 📁 Project Structure

```
ims/
├── patient_mobile_app/
│   ├── App.js                     # Root React Native application component
│   ├── index.js                   # App registry entry point
│   ├── package.json               # Dependencies and build scripts
│   ├── app.json                   # Application and Android package metadata (com.usintellix.patientapp)
│   ├── babel.config.js            # Babel compiler configuration
│   ├── android/
│   │   └── app/src/main/
│   │       └── AndroidManifest.xml # Android native permissions and network security configuration
│   └── src/
│       ├── constants/
│       │   ├── config.js          # Backend API URL (configured for Android 10.0.2.2 emulator / LAN IP)
│       │   └── theme.js           # Design tokens, medical dark colors, and typography
│       ├── api/
│       │   ├── client.js          # Cookie-aware fetch client for PHP session support
│       │   └── auth.js            # Patient authentication and HIPAA boundary enforcement
│       └── screens/
│           ├── LoginScreen.js     # Patient Login, 2FA OTP, First-Login Setup, 90-Day Renewal & NPP Consent
│           └── PatientDashboardScreen.js # Authenticated Patient Landing & Overview
```

---

## 🔒 Implemented Security & HIPAA Features

1. **Strict Patient Role Enforcement**:
   - Only users with role `patient` are granted access.
   - Hospital staff (doctor, nurse, receptionist, admin) accounts are rejected with an explicit alert to sign in via the Staff Portal.
2. **HIPAA Security Rule Workflows**:
   - **First-Login Setup (§ 164.312(a)(1))**: Mandatory credential reset and email confirmation.
   - **Lockout Defense (§ 164.312(a)(2)(i))**: Displays remaining cooldown minutes after 5 consecutive failed attempts.
   - **90-Day Password Renewal (§ 164.308(a)(5)(ii)(D))**: Detects expired credentials and presents renewal form.
   - **Privacy Practices Electronic Signature (§ 164.520)**: Requires patient consent before accessing medical charts.

---

## 🚀 How to Run & Build APK

### 1. Install Dependencies
Navigate into `patient_mobile_app`:
```bash
cd c:\xampp\htdocs\ims\patient_mobile_app
npm install
```

### 2. Configure Host IP
Open [`src/constants/config.js`](src/constants/config.js):
- **Android Emulator**: Uses `10.0.2.2` (automatically connects to host machine's Apache / XAMPP).
- **Physical Device**: Replace with your local machine's IP address (e.g., `http://192.168.1.50/ims/usintellix-hospital-management-system/backend/public`).

### 3. Generate Android APK
Ensure you have the **Android SDK** and **Java 17+ (JDK)** installed:
```bash
# Debug APK:
cd android
./gradlew assembleDebug

# Output APK path:
# android/app/build/outputs/apk/debug/app-debug.apk
```

Or using EAS Build:
```bash
npx eas-cli build -p android --profile preview
```

### 4. Test Patient Credentials
- **Username**: `testpatient1`
- **Password**: `Patient@123`
- **Role**: `patient` (Patient ID #2: Test Patient)
