# Text-to-Speech (TTS) Web App

This app will primarily be a simple way to use text-to-speech APIs to listen to text at accelerated speeds. 

## Tech stack:

- React
- Tailwind CSS
- TypeScript
- AWS services deployed with AWS SAM and the AWS CLI
- React Router for navigation
- Lucide Icons for icons

## Phases:

### Phase 1 UI:

- reader display:
  - big play/pause button
  - text input field
  - volume adjustment slider
  - progress bar
  - time display
  - volume display
- profile display:
  - email
  - logout button
- visual audio player with time tracking progress bar that can skip around
- Text to speech API will be the native browser API for this phase. This API will be retained for guest users of the app, but will be replaced with APIs like AWS Polly for authenticated users.

### Phase 2 Infrastructure:

- AWS services will be used for the backend
  - API Gateway for the API endpoints
  - Lambda functions for the backend logic
    - Code will be stored in this repository
  - DynamoDB for tracking usage and statistics
  - Polly for the main text to speech
  - Cognito for authentication and authorization
  - AWS SAM for deploying the infrastructure

### Phase 2.1 User Login UI:

- Update default state to be logged out
- Add login and signup buttons to the header
- Add login/signup modal
- Connect login/signup/logout to the backend

### Phase 3 Playback Speed:

- speed display
- +/- buttons to increase/decrease speed by 0.1x at a time
- Speed will be stored and retrieved from local storage
- Use AWS Polly for text-to-speech when logged in

### Extra features:

- keyboard shortcuts
- Eleven Labs or other APIs
- Estimate cost of usage