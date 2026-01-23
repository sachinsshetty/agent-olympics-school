# GitHub Actions CI/CD Setup

This repository uses GitHub Actions for comprehensive CI/CD across all modules (game, frontend, backend).

## 📋 Workflows Overview

### 🔄 Individual Module Workflows

#### Game CI/CD (`game-ci.yml`)
- **Triggers**: Changes to `game/` directory
- **Jobs**:
  - **lint-and-test**: Node.js linting, TypeScript checking, dependency installation
  - **build-and-push**: Multi-platform Docker builds, pushes to GHCR
  - **deploy-staging/production**: Environment-specific deployments

#### Frontend CI/CD (`frontend-ci.yml`)
- **Triggers**: Changes to `frontend/` directory
- **Jobs**:
  - **lint-and-test**: Python syntax checks, import validation, security scanning
  - **build-and-push**: Multi-platform Docker builds, pushes to GHCR
  - **deploy-staging/production**: Environment-specific deployments

#### Backend CI/CD (`backend-ci.yml`)
- **Triggers**: Changes to `backend/` directory
- **Jobs**:
  - **lint-and-test**: Python linting (flake8), formatting (black/isort), type checking (mypy)
  - **security-scan**: Trivy vulnerability scanning
  - **build-and-push**: Multi-platform Docker builds, pushes to GHCR
  - **deploy-staging/production**: Environment-specific deployments

### 🎯 Master Orchestration (`master-ci.yml`)
- **Triggers**: All branches, manual dispatch
- **Features**:
  - Detects which modules changed
  - Runs only relevant workflows
  - Supports selective deployments
  - Coordinated health checks

### 🚀 Release Management (`release.yml`)
- **Triggers**: Version tags (`v*.*.*`)
- **Features**:
  - Creates GitHub releases
  - Builds and tags all module images
  - Multi-platform support

### 🔒 Security & Maintenance
- **Security Scan** (`security.yml`): Daily CodeQL and Trivy scans
- **Dependencies** (`dependencies.yml`): Weekly automated updates

## 🏗️ Module Architecture

```
├── game/           # Next.js 16 + TypeScript + Docker
├── frontend/       # Python + FastAPI + Gradio + Docker
├── backend/        # Python + FastAPI + Docker
└── .github/
    └── workflows/  # CI/CD pipelines
```

## 🚀 Getting Started

### Prerequisites
- GitHub repository with Actions enabled
- Container Registry access (GHCR recommended)
- Environment secrets configured

### Required Secrets
```bash
# GitHub Container Registry (automatic with GITHUB_TOKEN)
# Add additional secrets as needed:
# - DEPLOYMENT_TOKEN
# - AWS_ACCESS_KEY_ID (for AWS deployments)
# - GCP_SA_KEY (for GCP deployments)
```

### Environments
Set up the following environments in repository settings:
- **staging**: For develop branch deployments
- **production**: For main branch deployments

## 📝 Workflow Triggers

### Automatic Triggers
- **Push to main/develop**: Full CI/CD pipeline
- **Pull requests**: Testing and validation only
- **Path-based**: Only affected modules run

### Manual Triggers
- **Release**: Tag with `v*.*.*` format
- **Master workflow**: Manual dispatch with module selection
- **Security scans**: On-demand scanning

## 🐳 Docker Images

### Image Naming Convention
```
ghcr.io/{owner}/{repo}-{module}:{tag}
```

### Available Tags
- `latest`: Latest main branch build
- `{branch}`: Branch-specific builds
- `v{major}.{minor}.{patch}`: Release versions
- `{branch}-{sha}`: Commit-specific builds

### Multi-Platform Support
All images support:
- `linux/amd64`
- `linux/arm64`

## 🔧 Configuration

### Customizing Deployments

Edit deployment steps in each workflow:

```yaml
deploy-production:
  steps:
    - name: Deploy to production
      run: |
        # Add your deployment commands
        # kubectl, docker-compose, AWS ECS, etc.
```

### Environment Variables

Configure in repository settings:
- **staging**: Staging environment variables
- **production**: Production environment variables

## 📊 Monitoring & Logs

### Workflow Logs
- View in Actions tab
- Download artifacts for detailed reports
- Security scan results in Security tab

### Health Checks
- Post-deployment health verification
- Service availability monitoring
- Rollback on failure

## 🔒 Security Features

### Automated Scanning
- **CodeQL**: Static code analysis
- **Trivy**: Container vulnerability scanning
- **Safety**: Python dependency security
- **npm audit**: Node.js security audits

### Compliance
- Multi-stage Docker builds
- Non-root containers
- Dependency updates
- Security patch monitoring

## 🚨 Troubleshooting

### Common Issues

**Workflow not triggering:**
- Check path filters in workflow triggers
- Verify branch protection rules
- Check repository settings

**Build failures:**
- Review build logs in Actions tab
- Check dependency versions
- Verify Docker context

**Deployment issues:**
- Check environment secrets
- Verify deployment credentials
- Review deployment scripts

### Debug Mode
Enable debug logging:
```yaml
env:
  ACTIONS_RUNNER_DEBUG: true
  ACTIONS_STEP_DEBUG: true
```

## 📈 Best Practices

### Development Workflow
1. **Feature branches**: Create from `develop`
2. **Pull requests**: Required for `main` merges
3. **Automated testing**: All changes tested
4. **Security scanning**: Before production

### Release Process
1. **Version bump**: Update version numbers
2. **Changelog**: Document changes
3. **Tag creation**: `git tag v1.2.3`
4. **Automated release**: GitHub Actions handles the rest

### Maintenance
- **Weekly**: Dependency updates (automated)
- **Daily**: Security scans (automated)
- **Monthly**: Review and optimize workflows

## 📞 Support

For issues with GitHub Actions:
- Check [GitHub Actions documentation](https://docs.github.com/en/actions)
- Review workflow logs
- Open issues in this repository

---

**Happy deploying! 🚀**