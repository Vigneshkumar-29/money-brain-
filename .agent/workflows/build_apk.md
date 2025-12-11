---
description: Build an Android APK for the application
---

# Build Android APK

This workflow guides you through the process of building a standalone APK for Android using Expo Application Services (EAS).

## Prerequisites
- You must be logged in to your Expo account via the terminal.
- The project must be linked to an EAS project (which seems to be done based on app.json).

## Steps

1. **Install EAS CLI** (if not already installed)
   ```bash
   npm install -g eas-cli
   ```

2. **Login to EAS**
   ```bash
   eas login
   ```

3. **Build the APK**
   Run the following command to start the build process for an APK (not an App Bundle/AAB).
   ```bash
   eas build -p android --profile preview
   ```
   - Select "Yes" if asked to generate a new keystore.
   - Wait for the build to complete. The terminal will provide a download link for the .apk file.

4. **Download and Install**
   - Once finished, download the `.apk` file from the link provided or from your Expo dashboard.
   - Transfer it to your Android device and install it.
