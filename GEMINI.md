# Mobile App Build & Optimization Rules (USIntellix Patient Mobile)

Whenever building, configuring, or packaging the Android mobile application (`patient_mobile_app`), ALWAYS enforce maximum APK compression and physical device compatibility:

1. **Target Physical Phone Architectures Only**:
   - In `android/gradle.properties`, ALWAYS set:
     ```properties
     reactNativeArchitectures=armeabi-v7a,arm64-v8a
     ```
   - Do NOT include `x86` or `x86_64` in production or preview APKs (these add ~29 MB of desktop emulator bloat that physical phones never use).

2. **Always Enable Native Library Compression**:
   - In `android/gradle.properties`, ALWAYS ensure:
     ```properties
     expo.useLegacyPackaging=true
     ```
   - This compresses `.so` native shared libraries inside the APK with ZIP DEFLATE, keeping total APK size around ~16 MB instead of 60+ MB.

3. **Android Gradle Plugin 8+ Compatibility**:
   - Do NOT declare `android:extractNativeLibs` directly in `AndroidManifest.xml` (doing so causes manifest merger errors in AGP 8). `expo.useLegacyPackaging=true` handles native library packaging automatically.

4. **Vector Icons & Safe Notch Insets**:
   - Use `react-native-svg` mapped elements in `src/components/Icons.js` (with `SvgWebShim.js` for web dev/builds).
   - Always retain `StatusBar.currentHeight` safe top insets across screens and modals so headers never collide with physical phone camera notches, clocks, or status bars.
