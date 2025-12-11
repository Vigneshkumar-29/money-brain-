# MoneyBrain

MoneyBrain is a modern, high-performance personal finance tracking application built with React Native and Expo. It features a premium, futuristic design with dark mode support, smooth animations, and intuitive data visualization.

## 🌟 Features

-   **Dashboard Overview**: Real-time view of your total balance, income, and expenses.
-   **Transaction Tracking**: Easily log income and expenses with categories, dates, and notes.
-   **Visual Analytics**: Interactive bar charts to visualize spending and income trends.
-   **Dark Mode**: Fully supported dark theme for comfortable viewing in any environment.
-   **Premium UX**: Custom fonts (Syne & Manrope), smooth fade-in animations, and haptic feedback.

## 🛠 Tech Stack

-   **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
-   **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
-   **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native)
-   **Icons**: [Lucide React Native](https://lucide.dev/guide/packages/lucide-react-native)
-   **Fonts**: [Google Fonts](https://github.com/expo/google-fonts) (Syne & Manrope)
-   **Charts**: Custom SVG charts using `react-native-svg`

## 📂 Project Structure

```
money-brain/
├── app/                  # Application source code & screens
│   ├── (tabs)/           # Main tab navigation (Dashboard, Transactions, Charts, Settings)
│   ├── _layout.tsx       # Root layout configuration
│   └── transaction-modal # specialized modal screen
├── components/           # Reusable UI components
│   ├── charts/           # Visualization components
│   ├── dashboard/        # Dashboard-specific widgets
│   ├── transactions/     # Transaction list & form components
│   └── ui/               # Core design system elements (Buttons, Inputs, etc.)
└── assets/               # Static assets (fonts, images)
```

## 🚀 Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Start the development server**:
    ```bash
    npx expo start
    ```

3.  **Run on device/emulator**:
    -   Press `a` for Android Emulator
    -   Press `i` for iOS Simulator
    -   Scan the QR code with Expo Go on your physical device

## 🎨 Design System

The app follows a strict design system with:
-   **Typography**:
    -   *Display*: Syne (Bold/ExtraBold) for headings and impact numbers.
    -   *Body*: Manrope (Regular/Medium/SemiBold) for general text and UI elements.
    -   *Mono*: Space Mono for specific data points.
-   **Colors**:
    -   Primary: Green (`#2ECC71`)
    -   Accent: Red (`#FF6B6B`)
    -   Background: Light (`#FAFAF8`) & Dark (`#0F1419`)

## 🤝 Contribution

Feel free to fork this repository and submit pull requests for new features or improvements.
