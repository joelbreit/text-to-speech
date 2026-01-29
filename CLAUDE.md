# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A text-to-speech web application for listening to text at accelerated speeds. Phase 1 (UI), Phase 2 (AWS Infrastructure), Phase 2.1 (User Login UI), and Phase 3 (Playback Speed & AWS Polly) are implemented. Ready for Phase 4 (advanced features).

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
- **TTS**: Browser Web Speech API (guest users), AWS Polly (authenticated users)
- **Backend**: AWS Lambda, API Gateway, DynamoDB, Cognito
- **IaC**: AWS SAM (Serverless Application Model)

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

### TTS Implementation

Reader.tsx supports dual TTS modes:

**Browser Web Speech API** (guest users):
- `SpeechSynthesisUtterance` for text-to-speech conversion
- Manual progress tracking via time estimation (0.4 seconds per word / speed)
- Volume and speed control synced with utterance object
- Play/pause state management with time tracking refs

**AWS Polly** (authenticated users):
- Calls backend `/tts/synthesize` endpoint with auth token
- Backend returns presigned S3 URL to audio file
- HTML5 Audio element for playback
- Accurate duration from audio metadata
- Real-time speed changes during playback

**Important**: The progress bar click-to-seek cancels and requires restart for both implementations. Future versions should maintain playback position.

## Backend Infrastructure (Phase 2 - Implemented)

The AWS backend is fully implemented and ready for deployment:

### Infrastructure Components
- **API Gateway**: REST API with Cognito authorization
- **Lambda Functions**:
  - `tts` - Text-to-speech using AWS Polly (POST /tts/synthesize)
  - `usage` - Usage statistics (GET /usage)
  - `profile` - User profile info (GET /profile)
- **DynamoDB**: Usage tracking with 90-day TTL
- **Cognito**: User Pool + Identity Pool for authentication
- **Deployment**: AWS SAM with CloudFormation

### Deployment Files
- `template.yaml` - SAM template defining all infrastructure
- `backend/*/` - Lambda function code (Node.js 20.x ESM)
- `samconfig.toml` - SAM configuration for dev/prod environments
- `deploy.sh` - Automated deployment script
- `DEPLOYMENT.md` - Comprehensive deployment guide
- `QUICKSTART.md` - Quick deployment reference

### Deploying the Backend
```bash
# First-time deployment (requires SAM CLI)
./deploy.sh guided

# Subsequent deployments
./deploy.sh deploy

# Get stack outputs (API endpoint, Cognito IDs, etc.)
./deploy.sh outputs
```

See [QUICKSTART.md](./QUICKSTART.md) for detailed deployment instructions.

## Authentication UI (Phase 2.1 - Implemented)

The frontend now includes full authentication UI integrated with AWS Cognito:

### Authentication Features
- **Login/Signup Modal**: Modal component with email/password authentication
- **Email Verification**: Confirmation code flow for new user signups
- **Auth State Management**: React Context-based authentication state
- **Protected Routes**: Profile page requires authentication
- **Conditional UI**: Header shows login/signup buttons when logged out, profile link when logged in

### Frontend Auth Components
- **AuthContext.tsx**: Authentication state management with AWS Amplify
- **AuthModal.tsx**: Login, signup, and email verification modal
- **Layout.tsx**: Updated navigation with conditional auth buttons
- **Profile.tsx**: Shows user email and ID, with logout functionality

### Environment Configuration

Before running the app, you need to configure your AWS credentials:

1. Deploy the backend infrastructure (see above)
2. Get the CloudFormation stack outputs:
   ```bash
   ./deploy.sh outputs
   ```
3. Create a `.env` file in the project root (see `.env.example`):
   ```bash
   cp .env.example .env
   ```
4. Fill in the values from the stack outputs:
   - `VITE_USER_POOL_ID` - From `UserPoolId` output
   - `VITE_USER_POOL_CLIENT_ID` - From `UserPoolClientId` output
   - `VITE_IDENTITY_POOL_ID` - From `IdentityPoolId` output
   - `VITE_API_ENDPOINT` - From `ApiEndpoint` output
   - `VITE_AWS_REGION` - From `Region` output (default: us-east-1)

### Authentication Flow
1. User clicks "Sign Up" in header
2. Enters email and password (must meet password requirements)
3. Receives verification code via email
4. Confirms email with verification code
5. Logs in with credentials
6. Can access profile page and logout

**Note**: The app works without authentication using browser Web Speech API. Authentication is only required for AWS Polly TTS and usage tracking features.

## Playback Speed & AWS Polly Integration (Phase 3 - Implemented)

The app now features playback speed controls and AWS Polly integration for authenticated users:

### Speed Controls
- **Speed Display**: Shows current playback speed (e.g., "1.5x")
- **Increment/Decrement Buttons**: +/- buttons to adjust speed by 0.1x increments
- **Speed Range**: 0.5x to 4.0x playback speed
- **LocalStorage Persistence**: Speed preference is saved and restored across sessions
- **Real-time Updates**: Speed changes apply to currently playing audio (Polly only)

### Dual TTS System
- **Guest Users**: Uses browser Web Speech API with speed support
- **Authenticated Users**: Uses AWS Polly for high-quality, natural-sounding speech
- **Automatic Fallback**: If Polly fails, automatically falls back to browser TTS
- **Visual Indicator**: Shows "Using AWS Polly for high-quality text-to-speech" when logged in

### Implementation Details
- **pollyTTS.ts**: Service class for AWS Polly API integration
  - Calls `/tts/synthesize` endpoint with auth token
  - Returns audio URL from Polly
  - Manages HTML5 Audio playback with speed control
  - Provides pause/resume/stop controls
  - Tracks current time and duration

- **Reader.tsx Updates**:
  - Dual-mode operation (browser vs Polly)
  - Speed state with localStorage
  - Loading states during Polly synthesis
  - Error handling with fallback
  - Volume and speed controls work with both engines
  - Progress tracking for both TTS methods

### Key Features
- Speed persists across page reloads via localStorage
- Volume controls work independently for both TTS engines
- Progress bar and time display work for both engines
- Polly provides more accurate duration tracking
- Speed can be changed during playback (Polly only)

## Future Phases

### Phase 4: Advanced Features
- Keyboard shortcuts
- Additional TTS providers (Eleven Labs)
- Usage cost estimation

## Configuration

- **TypeScript**: Project references pattern (`tsconfig.json` references `tsconfig.app.json` and `tsconfig.node.json`)
- **ESLint**: React hooks and refresh plugins configured in `eslint.config.js`
- **Tailwind**: Configured via `tailwind.config.js` and `postcss.config.js`
