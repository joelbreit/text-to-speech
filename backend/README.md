# Backend Infrastructure

This directory contains the AWS Lambda functions for the Text-to-Speech application backend.

## Structure

```
backend/
├── tts/           # Text-to-speech synthesis using AWS Polly
├── usage/         # Usage statistics retrieval
└── profile/       # User profile information
```

## Lambda Functions

### TTS Function (`tts/`)

Converts text to speech using AWS Polly.

**Endpoint**: `POST /tts/synthesize`

**Request Body**:
```json
{
  "text": "Text to convert to speech",
  "voiceId": "Joanna",
  "engine": "neural",
  "outputFormat": "mp3"
}
```

**Response**:
```json
{
  "audioContent": "base64-encoded-audio",
  "contentType": "audio/mpeg",
  "characterCount": 25,
  "voiceId": "Joanna",
  "engine": "neural"
}
```

**Features**:
- Supports all AWS Polly voices
- Generative and neural engines
- Multiple output formats (mp3, ogg, pcm)
- Automatic usage tracking
- 100,000 character limit per request

### Usage Function (`usage/`)

Retrieves usage statistics for authenticated users.

**Endpoint**: `GET /usage?days=30&limit=100`

**Query Parameters**:
- `days` (optional): Number of days to look back (default: 30)
- `limit` (optional): Maximum number of records (default: 100)

**Response**:
```json
{
  "userId": "user-id",
  "period": {
    "days": 30,
    "startTime": 1234567890,
    "endTime": 1234567890
  },
  "summary": {
    "totalRequests": 42,
    "totalCharacters": 12500,
    "averageCharactersPerRequest": 297
  },
  "voiceUsage": {
    "Joanna": {
      "count": 30,
      "characters": 9000
    },
    "Matthew": {
      "count": 12,
      "characters": 3500
    }
  },
  "recentRequests": [...]
}
```

### Profile Function (`profile/`)

Retrieves user profile information and basic statistics.

**Endpoint**: `GET /profile`

**Response**:
```json
{
  "userId": "user-id",
  "email": "user@example.com",
  "usage": {
    "last30Days": {
      "totalRequests": 42,
      "totalCharacters": 12500
    },
    "firstUsage": 1234567890,
    "lastUsage": 1234567890
  }
}
```

## Authentication

All endpoints require Cognito authentication via JWT tokens in the Authorization header:

```
Authorization: Bearer <id-token>
```

## Development

### Local Testing

Install dependencies for each function:

```bash
cd tts && npm install
cd ../usage && npm install
cd ../profile && npm install
```

### Running Locally

Use SAM Local to test functions:

```bash
# From project root
sam local start-api

# Test TTS endpoint
curl -X POST http://localhost:3000/tts/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world"}'
```

## Deployment

See the main [DEPLOYMENT.md](../DEPLOYMENT.md) file for complete deployment instructions.

Quick deployment:

```bash
# From project root
./deploy.sh guided    # First time
./deploy.sh deploy    # Subsequent deployments
```

## Error Handling

All functions return standardized error responses:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

Common status codes:
- `200`: Success
- `400`: Bad request (invalid input)
- `401`: Unauthorized (missing/invalid token)
- `500`: Internal server error

## Monitoring

View function logs:

```bash
# View live logs
sam logs -n TTSFunction --tail

# View logs from last 10 minutes
sam logs -n TTSFunction --start-time '10min ago'
```

## Dependencies

Each function uses AWS SDK v3:
- `@aws-sdk/client-polly` - TTS function
- `@aws-sdk/client-dynamodb` - All functions
- `@aws-sdk/lib-dynamodb` - All functions

## Environment Variables

Automatically set by CloudFormation:
- `USAGE_TABLE`: DynamoDB table name for usage tracking
- `USER_POOL_ID`: Cognito User Pool ID

## IAM Permissions

Functions have least-privilege permissions:
- **TTS**: Polly SynthesizeSpeech, DynamoDB PutItem
- **Usage**: DynamoDB Query
- **Profile**: DynamoDB Query
