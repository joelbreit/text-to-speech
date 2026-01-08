#!/bin/bash

# Text-to-Speech App Deployment Script
# This script automates the deployment of the AWS backend infrastructure

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        log_info "Visit: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html"
        exit 1
    fi
    log_success "AWS CLI found: $(aws --version)"

    # Check SAM CLI
    if ! command -v sam &> /dev/null; then
        log_error "SAM CLI is not installed. Please install it first."
        log_info "Visit: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html"
        exit 1
    fi
    log_success "SAM CLI found: $(sam --version)"

    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install it first."
        exit 1
    fi
    log_success "Node.js found: $(node --version)"

    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured. Run 'aws configure' first."
        exit 1
    fi
    log_success "AWS credentials configured"
}

# Install Lambda dependencies
install_dependencies() {
    log_info "Installing Lambda function dependencies..."

    # TTS Function
    log_info "Installing TTS function dependencies..."
    cd backend/tts
    npm install
    cd ../..

    # Usage Function
    log_info "Installing Usage function dependencies..."
    cd backend/usage
    npm install
    cd ../..

    # Profile Function
    log_info "Installing Profile function dependencies..."
    cd backend/profile
    npm install
    cd ../..

    log_success "All dependencies installed"
}

# Validate SAM template
validate_template() {
    log_info "Validating SAM template..."
    if sam validate --lint; then
        log_success "Template validation passed"
    else
        log_error "Template validation failed"
        exit 1
    fi
}

# Build the application
build_app() {
    log_info "Building application..."
    if sam build --parallel --cached; then
        log_success "Build completed successfully"
    else
        log_error "Build failed"
        exit 1
    fi
}

# Deploy the application
deploy_app() {
    local env=${1:-default}

    log_info "Deploying to environment: $env"

    if [ "$env" == "guided" ]; then
        log_info "Starting guided deployment..."
        sam deploy --guided
    else
        log_info "Deploying with config environment: $env"
        sam deploy --config-env "$env"
    fi

    if [ $? -eq 0 ]; then
        log_success "Deployment completed successfully!"
    else
        log_error "Deployment failed"
        exit 1
    fi
}

# Get stack outputs
get_outputs() {
    local stack_name=${1:-text-to-speech-app}

    log_info "Retrieving stack outputs..."
    echo ""
    sam list stack-outputs --stack-name "$stack_name" || \
        aws cloudformation describe-stacks \
            --stack-name "$stack_name" \
            --query 'Stacks[0].Outputs' \
            --output table
}

# Main deployment flow
main() {
    echo ""
    log_info "=========================================="
    log_info "Text-to-Speech App Deployment Script"
    log_info "=========================================="
    echo ""

    # Parse command line arguments
    COMMAND=${1:-deploy}
    ENV=${2:-default}

    case $COMMAND in
        check)
            check_prerequisites
            ;;
        install)
            check_prerequisites
            install_dependencies
            ;;
        validate)
            validate_template
            ;;
        build)
            check_prerequisites
            install_dependencies
            validate_template
            build_app
            ;;
        deploy)
            check_prerequisites
            install_dependencies
            validate_template
            build_app
            deploy_app "$ENV"
            ;;
        outputs)
            get_outputs "${2:-text-to-speech-app}"
            ;;
        full)
            check_prerequisites
            install_dependencies
            validate_template
            build_app
            deploy_app "$ENV"
            get_outputs
            ;;
        guided)
            check_prerequisites
            install_dependencies
            validate_template
            build_app
            deploy_app "guided"
            ;;
        *)
            echo "Usage: $0 {check|install|validate|build|deploy|outputs|full|guided} [environment]"
            echo ""
            echo "Commands:"
            echo "  check     - Check prerequisites only"
            echo "  install   - Install Lambda dependencies"
            echo "  validate  - Validate SAM template"
            echo "  build     - Build the application"
            echo "  deploy    - Full deployment (default, dev, or prod)"
            echo "  outputs   - Get stack outputs"
            echo "  full      - Complete workflow with outputs"
            echo "  guided    - Interactive guided deployment"
            echo ""
            echo "Examples:"
            echo "  $0 check                    # Check prerequisites"
            echo "  $0 guided                   # First-time deployment"
            echo "  $0 deploy                   # Deploy to default env"
            echo "  $0 deploy prod              # Deploy to production"
            echo "  $0 full                     # Deploy and show outputs"
            echo "  $0 outputs                  # Show stack outputs"
            exit 1
            ;;
    esac

    echo ""
    log_success "Script completed successfully!"
}

# Run main function
main "$@"
