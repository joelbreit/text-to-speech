# AGENTS.md

This file documents the AI agents and assistants used in this project, their configurations, roles, and usage guidelines.

## Overview

This project uses AI agents to assist with development, code generation, and documentation. This document provides a reference for understanding which agents are available and how to work with them effectively.

## AI Agents

### Claude Code (claude.ai/code)

**Purpose**: Primary AI coding assistant for development tasks

**Configuration**: See [CLAUDE.md](./CLAUDE.md) for detailed project-specific guidance

**Capabilities**:
- Code generation and refactoring
- Bug fixes and troubleshooting
- Documentation updates
- Architecture design assistance
- Testing and debugging support

**Usage Guidelines**:
- Refer to CLAUDE.md for project-specific context before asking questions
- Provide clear, specific requests with context about the codebase
- Review generated code before committing
- Test AI-generated code thoroughly

**Key Context Files**:
- `CLAUDE.md` - Project overview and development guidelines
- `plan.md` - Project phases and roadmap
- `DEPLOYMENT.md` - Infrastructure deployment instructions
- `QUICKSTART.md` - Quick deployment reference

## Agent Configuration

### Project Context

Agents working with this codebase should be aware of:

1. **Tech Stack**: React 19.2, TypeScript, Vite, Tailwind CSS, AWS services
2. **Architecture**: Frontend (React SPA) + Backend (AWS Lambda, API Gateway, DynamoDB, Cognito)
3. **Development Phases**: See `plan.md` for current phase and roadmap
4. **TTS Implementation**: Dual-mode (Browser Web Speech API for guests, AWS Polly for authenticated users)

### Code Style

- **TypeScript**: Strict mode enabled, use type annotations
- **React**: Functional components with hooks, TypeScript interfaces
- **Styling**: Tailwind CSS utility classes
- **Backend**: Node.js 20.x ESM (`.mjs` files)

### Important Considerations

- Always check authentication requirements before accessing AWS resources
- Test both guest and authenticated user flows
- Consider fallback mechanisms for TTS failures
- Follow AWS SAM patterns for infrastructure changes
- Maintain backward compatibility during refactoring

## Best Practices for Working with Agents

1. **Provide Context**: Include relevant file paths and code snippets when asking questions
2. **Be Specific**: Clearly state what you want to accomplish and any constraints
3. **Review Changes**: Always review agent-generated code before committing
4. **Test Thoroughly**: Test changes in both development and production-like environments
5. **Document Updates**: Update relevant documentation when making architectural changes

## Future Agent Integrations

Potential areas for future AI agent integration:

- **Automated Testing**: AI agents for generating and maintaining test suites
- **Code Review**: Automated code review agents for pull requests
- **Documentation**: Automated documentation generation from code
- **Monitoring**: AI-powered error analysis and alerting

## Related Documentation

- [CLAUDE.md](./CLAUDE.md) - Detailed Claude Code guidance
- [README.md](./README.md) - Project overview
- [plan.md](./plan.md) - Project phases and roadmap
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment instructions
- [QUICKSTART.md](./QUICKSTART.md) - Quick start guide
