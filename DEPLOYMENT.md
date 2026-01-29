# AWS Deployment Guide

This guide covers deploying the Text-to-Speech application backend infrastructure using AWS SAM.

## Prerequisites

Before deploying, ensure you have:

1. **AWS Account**: An active AWS account with appropriate permissions
2. **AWS CLI**: Installed and configured with credentials
   ```bash
   aws --version
   aws configure
   ```
3. **AWS SAM CLI**: Installed on your system
   ```bash
   sam --version
   ```
   Install from: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

4. **Node.js**: Version 20.x or later for Lambda runtime compatibility
   ```bash
   node --version
   ```

## Architecture Overview

The deployment creates the following AWS resources:

- **API Gateway**: REST API with CORS enabled
- **Lambda Functions**:
  - `tts` - Text-to-speech synthesis using AWS Polly
  - `usage` - Usage statistics retrieval
  - `profile` - User profile information
- **DynamoDB Table**: Usage tracking with TTL enabled
- **Cognito User Pool**: User authentication
- **Cognito Identity Pool**: AWS credentials for authenticated users
- **IAM Roles**: Permissions for authenticated/unauthenticated users

## Deployment Steps

### Option 1: Automated Deployment (Recommended)

1. **Install Lambda dependencies**:
   ```bash
   cd backend/tts && npm install && cd ../..
   cd backend/usage && npm install && cd ../..
   cd backend/profile && npm install && cd ../..
   ```

2. **Build the application**:
   ```bash
   sam build
   ```

3. **Deploy to AWS** (first time):
   ```bash
   sam deploy --guided
   ```

   You'll be prompted for:
   - Stack name (default: `text-to-speech-app`)
   - AWS Region (e.g., `us-east-1`)
   - Stage (dev or prod)
   - Confirm changes before deploy
   - Allow SAM CLI IAM role creation
   - Disable rollback (optional)

4. **Deploy subsequent updates**:
   ```bash
   sam build && sam deploy
   ```

### Option 2: Manual Deployment Steps

1. **Install dependencies for all Lambda functions**:
   ```bash
   # TTS Function
   cd backend/tts
   npm install
   cd ../..

   # Usage Function
   cd backend/usage
   npm install
   cd ../..

   # Profile Function
   cd backend/profile
   npm install
   cd ../..
   ```

2. **Validate the SAM template**:
   ```bash
   sam validate --lint
   ```

3. **Build the application**:
   ```bash
   sam build --parallel --cached
   ```

   This command:
   - Builds all Lambda functions
   - Bundles dependencies
   - Prepares for deployment
   - Uses caching for faster builds

4. **Package the application** (creates S3 artifacts):
   ```bash
   sam package \
     --output-template-file packaged.yaml \
     --s3-bucket YOUR_DEPLOYMENT_BUCKET
   ```

   Replace `YOUR_DEPLOYMENT_BUCKET` with an S3 bucket name (SAM will create if needed).

5. **Deploy the CloudFormation stack**:
   ```bash
   sam deploy \
     --template-file packaged.yaml \
     --stack-name text-to-speech-app \
     --capabilities CAPABILITY_IAM \
     --region us-east-1 \
     --parameter-overrides Stage=dev
   ```

### Option 3: Using samconfig.toml (Pre-configured)

The repository includes a `samconfig.toml` file with default settings:

```bash
# Build and deploy with defaults
sam build && sam deploy --config-env default

# Deploy to production
sam build && sam deploy --config-env prod
```

## Post-Deployment Configuration

After successful deployment, retrieve the outputs:

```bash
# Get all stack outputs
sam list stack-outputs --stack-name text-to-speech-app

# Or use AWS CLI
aws cloudformation describe-stacks \
  --stack-name text-to-speech-app \
  --query 'Stacks[0].Outputs' \
  --output table
```

### Important Outputs

You'll need these values for frontend configuration:

- **ApiEndpoint**: API Gateway URL
- **UserPoolId**: Cognito User Pool ID
- **UserPoolClientId**: Cognito User Pool Client ID
- **IdentityPoolId**: Cognito Identity Pool ID
- **Region**: AWS Region

### Configure Frontend

Create a configuration file for your React app:

```typescript
// src/config/aws-config.ts
export const awsConfig = {
  apiEndpoint: 'https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev',
  cognito: {
    region: 'us-east-1',
    userPoolId: 'us-east-1_xxxxxxxxx',
    userPoolClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
    identityPoolId: 'us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  }
};
```

## Testing the Deployment

### Test API Endpoints

1. **Create a test user**:
   ```bash
   aws cognito-idp sign-up \
     --client-id YOUR_USER_POOL_CLIENT_ID \
     --username test@example.com \
     --password TestPassword123! \
     --user-attributes Name=email,Value=test@example.com
   ```

2. **Confirm the user** (admin command):
   ```bash
   aws cognito-idp admin-confirm-sign-up \
     --user-pool-id YOUR_USER_POOL_ID \
     --username test@example.com
   ```

3. **Test the TTS endpoint** (requires authentication token):
   ```bash
   curl -X POST \
     -H "Authorization: Bearer YOUR_ID_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"text":"Hello world","voiceId":"Ruth"}' \
     YOUR_API_ENDPOINT/tts/synthesize
   ```

## Managing the Stack

### View Logs

```bash
# View logs for TTS function
sam logs -n TTSFunction --stack-name text-to-speech-app --tail

# View logs for specific invocation
sam logs -n TTSFunction --stack-name text-to-speech-app --start-time '10min ago'
```

### Update the Stack

After making changes to Lambda code or template:

```bash
sam build && sam deploy
```

### Delete the Stack

⚠️ **Warning**: This will delete all resources including data in DynamoDB.

```bash
sam delete --stack-name text-to-speech-app
```

Or use AWS CLI:

```bash
aws cloudformation delete-stack --stack-name text-to-speech-app
```

## Cost Considerations

The deployed infrastructure uses the following pricing models:

- **API Gateway**: Pay per request
- **Lambda**: Pay per invocation and execution time (ARM64 for cost savings)
- **DynamoDB**: On-demand pricing (pay per request)
- **Cognito**: Free tier: 50,000 MAUs
- **Polly**: $4 per 1M characters (Neural voices)

**Estimated monthly cost** (1000 requests/month with 500 chars average):
- API Gateway: ~$0.04
- Lambda: ~$0.01
- DynamoDB: ~$0.01
- Polly: ~$2.00
- **Total**: ~$2-3/month for light usage

## Troubleshooting

### Build Failures

If `sam build` fails:

```bash
# Clean and rebuild
sam build --use-container

# Or force rebuild without cache
sam build --parallel --no-cached
```

### Deployment Failures

Common issues:

1. **Insufficient Permissions**: Ensure your AWS credentials have permissions for CloudFormation, Lambda, API Gateway, Cognito, DynamoDB, and IAM.

2. **Region Mismatch**: Verify your AWS CLI region matches the deployment region:
   ```bash
   aws configure get region
   ```

3. **Stack Already Exists**: If deploying to an existing stack name, use update:
   ```bash
   sam deploy --no-confirm-changeset
   ```

### Lambda Function Errors

View detailed error logs:

```bash
sam logs -n FUNCTION_NAME --stack-name text-to-speech-app --tail
```

## Development Workflow

### Local Testing

Test Lambda functions locally:

```bash
# Start local API
sam local start-api

# Invoke specific function
sam local invoke TTSFunction -e events/tts-event.json
```

### Hot Reload

Use SAM Sync for rapid development:

```bash
sam sync --watch --stack-name text-to-speech-app
```

This automatically deploys changes as you save files.

## Security Best Practices

1. **Enable CloudTrail**: Track API calls for auditing
2. **Use HTTPS Only**: API Gateway enforces HTTPS by default
3. **Rotate Credentials**: Regularly rotate AWS access keys
4. **Enable MFA**: For Cognito user accounts
5. **Review IAM Policies**: Follow principle of least privilege
6. **Monitor Costs**: Set up billing alerts in AWS Console

## Additional Resources

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [AWS Polly Pricing](https://aws.amazon.com/polly/pricing/)
- [Cognito User Pool Best Practices](https://docs.aws.amazon.com/cognito/latest/developerguide/best-practices.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)

## Support

For issues or questions:
1. Check CloudFormation stack events in AWS Console
2. Review CloudWatch Logs for Lambda functions
3. Validate IAM permissions
4. Review this documentation
