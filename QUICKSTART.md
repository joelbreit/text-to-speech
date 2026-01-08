# Quick Start Guide - AWS Deployment

This guide will help you deploy the Text-to-Speech backend infrastructure to AWS in under 10 minutes.

## Prerequisites (One-Time Setup)

### 1. Install AWS SAM CLI

**macOS** (using Homebrew):
```bash
brew tap aws/tap
brew install aws-sam-cli
```

**Windows** (using installer):
Download from: https://github.com/aws/aws-sam-cli/releases/latest

**Linux**:
```bash
# Download installer
wget https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip
unzip aws-sam-cli-linux-x86_64.zip -d sam-installation
sudo ./sam-installation/install
```

Verify installation:
```bash
sam --version
```

### 2. Configure AWS Credentials

If you haven't already configured AWS CLI:

```bash
aws configure
```

You'll need:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Output format (use `json`)

## Deployment Steps

### Option 1: Automated Script (Recommended)

```bash
# First-time deployment with guided prompts
./deploy.sh guided
```

Follow the prompts:
1. **Stack Name**: Press Enter for default (`text-to-speech-app`)
2. **AWS Region**: Choose your region (e.g., `us-east-1`)
3. **Stage**: Press Enter for `dev`
4. **Confirm changes**: Type `y`
5. **Allow IAM role creation**: Type `y`
6. **Allow authorizer creation**: Type `y`
7. **Save configuration**: Type `y`

Subsequent deployments (after code changes):
```bash
./deploy.sh deploy
```

### Option 2: Manual Commands

```bash
# 1. Install dependencies
cd backend/tts && npm install && cd ../..
cd backend/usage && npm install && cd ../..
cd backend/profile && npm install && cd ../..

# 2. Build
sam build

# 3. Deploy
sam deploy --guided
```

## Post-Deployment

### Get Your Configuration Values

```bash
./deploy.sh outputs
```

Or:

```bash
sam list stack-outputs --stack-name text-to-speech-app
```

You'll see output like:
```
Key: ApiEndpoint
Value: https://abc123.execute-api.us-east-1.amazonaws.com/dev

Key: UserPoolId
Value: us-east-1_ABC123

Key: UserPoolClientId
Value: 1234567890abcdefghijklmnop

Key: IdentityPoolId
Value: us-east-1:12345678-1234-1234-1234-123456789012
```

### Configure Your Frontend

Create or update `src/config/aws-config.ts`:

```typescript
export const awsConfig = {
  apiEndpoint: 'YOUR_API_ENDPOINT_FROM_OUTPUTS',
  cognito: {
    region: 'YOUR_REGION',
    userPoolId: 'YOUR_USER_POOL_ID',
    userPoolClientId: 'YOUR_USER_POOL_CLIENT_ID',
    identityPoolId: 'YOUR_IDENTITY_POOL_ID'
  }
};
```

## Test the Deployment

### Create a Test User

```bash
# Sign up
aws cognito-idp sign-up \
  --client-id YOUR_USER_POOL_CLIENT_ID \
  --username test@example.com \
  --password TestPassword123! \
  --user-attributes Name=email,Value=test@example.com

# Confirm (admin command)
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id YOUR_USER_POOL_ID \
  --username test@example.com
```

### Test in Browser

1. Start your React app:
   ```bash
   npm run dev
   ```

2. Sign up or log in with your test account

3. Try converting text to speech

## Common Issues

### Issue: "Command not found: sam"

**Solution**: SAM CLI not installed. Follow step 1 in Prerequisites above.

### Issue: "Unable to locate credentials"

**Solution**: Run `aws configure` to set up your AWS credentials.

### Issue: "Stack already exists"

**Solution**: Either delete the existing stack or update it:
```bash
sam deploy  # Updates existing stack
```

To delete and start fresh:
```bash
sam delete --stack-name text-to-speech-app
```

### Issue: Build fails with npm errors

**Solution**: Ensure Node.js 20.x is installed:
```bash
node --version  # Should be v20.x or later
```

## Next Steps

1. **Enable Custom Domain** (Optional):
   - Set up API Gateway custom domain
   - Configure Route 53 DNS

2. **Add Monitoring** (Recommended):
   - Set up CloudWatch dashboards
   - Configure billing alarms

3. **Frontend Integration**:
   - Install AWS Amplify: `npm install aws-amplify`
   - Configure authentication in your React app
   - Implement API calls to your endpoints

## Cleanup

To remove all AWS resources:

```bash
sam delete --stack-name text-to-speech-app
```

**Warning**: This deletes all data including usage statistics in DynamoDB.

## Cost Estimate

With light usage (100 requests/month):
- **Free Tier**: Most services covered under AWS Free Tier
- **After Free Tier**: ~$1-2/month

With moderate usage (1000 requests/month, 500 chars each):
- API Gateway: $0.04
- Lambda: $0.01
- DynamoDB: $0.01
- Polly: $2.00
- **Total**: ~$2-3/month

## Support

- Full documentation: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- Backend details: See [backend/README.md](./backend/README.md)
- AWS SAM docs: https://docs.aws.amazon.com/serverless-application-model/
