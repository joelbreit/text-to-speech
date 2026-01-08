// AWS Cognito Configuration
// These values should be populated after deploying the backend with AWS SAM
// Run: ./deploy.sh outputs
// to get these values from your CloudFormation stack

export const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID || '',
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || '',
      identityPoolId: import.meta.env.VITE_IDENTITY_POOL_ID || '',
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code' as const,
      userAttributes: {
        email: {
          required: true,
        },
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
};

// API Configuration
export const apiConfig = {
  endpoint: import.meta.env.VITE_API_ENDPOINT || '',
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
};
