# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **AI-Powered Socratic Learning**: Replaced static templates with a dynamic AI-driven system using Google Gemini 1.5.
- **Season 1 Expansion**: Added full curriculum for Billions Season 1 (12 episodes) with specialized teaching goals and focus areas.
- **Mobile Support**: Integrated Capacitor to support iOS and Android builds, including viewport-fit support and mobile status bar styling.
- **Persistent Study State**: The application now remembers the last studied episode and scene across sessions.
- **API Key Management**: Added a secure way to save and manage Gemini API keys in the browser's local storage.
- **Course Navigation**: Introduced an episode-level navigation map in the Learn page to track progress across the entire season.

### Changed
- **Socratic System Overhaul**: Redesigned the Socratic methodology to focus strictly on linguistic evidence (Meaning → Vocabulary → Pattern → Migration).
- **UI Improvements**: Updated the Dashboard and Learn pages to reflect the new expanded content and mobile-friendly design.
- **Progress Tracking**: Enhanced the progress system to track words learned based on actual keywords per scene.

### Fixed
- ESLint configurations to ignore mobile build directories (`dist`, `ios`, `android`).
- Viewport and meta tags for better performance on high-density mobile screens.
