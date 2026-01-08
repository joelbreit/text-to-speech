# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A text-to-speech web application for listening to text at accelerated speeds. Currently in Phase 1 (UI implementation) with plans for AWS backend integration, advanced playback controls, and premium TTS APIs.

## Development Commands

```bash
# Start development server with HMR
npm run dev

# Build for production (runs TypeScript compiler + Vite build)
npm run build

# Run ESLint
npm run lint

# Preview production build
npm run preview
```

## Tech Stack

- **Frontend**: React 19.2 with TypeScript
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS with PostCSS
- **Build Tool**: Vite 7
- **Icons**: Lucide React
- **TTS**: Browser Web Speech API (Phase 1), AWS Polly planned (Phase 2)

## Architecture

### Application Structure

- **App.tsx**: Top-level router configuration with BrowserRouter
- **main.tsx**: React entry point rendering App in StrictMode
- **components/Layout.tsx**: Navigation shell with `<Outlet>` for page rendering
- **pages/Reader.tsx**: Main TTS interface with play/pause, volume, progress controls
- **pages/Profile.tsx**: User profile page

### Routing

Two main routes defined in App.tsx:
- `/` - Reader page (index route)
- `/profile` - Profile page

Both routes render within the Layout component which provides persistent navigation.

### TTS Implementation (Phase 1)

Reader.tsx uses the native Web Speech API:
- `SpeechSynthesisUtterance` for text-to-speech conversion
- Manual progress tracking via time estimation (0.4 seconds per word)
- Volume control synced with utterance object
- Play/pause state management with time tracking refs
- Progress bar with click-to-seek functionality (restarts speech)

**Important**: The current progress bar implementation cancels and requires restart when seeking. Future implementations should maintain playback position.

## Future Phases

### Phase 2: AWS Infrastructure
- API Gateway + Lambda backend (code in this repo)
- AWS Cognito authentication
- AWS Polly for authenticated users
- DynamoDB for usage tracking
- AWS SAM deployment

### Phase 3: Playback Speed
- Speed controls (+/- 0.1x increments)
- Local storage persistence

### Phase 4: Advanced Features
- Real-time playback updates
- Keyboard shortcuts
- Additional TTS providers (Eleven Labs)
- Usage cost estimation

## Configuration

- **TypeScript**: Project references pattern (`tsconfig.json` references `tsconfig.app.json` and `tsconfig.node.json`)
- **ESLint**: React hooks and refresh plugins configured in `eslint.config.js`
- **Tailwind**: Configured via `tailwind.config.js` and `postcss.config.js`
