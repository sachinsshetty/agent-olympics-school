#!/bin/bash

# Test script for GitHub Actions workflows
# This script helps validate workflows locally before pushing

set -e

echo "🧪 Testing GitHub Actions Workflows Locally"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Test 1: Check workflow syntax
echo "📋 Checking workflow syntax..."
if command -v actionlint &> /dev/null; then
    if actionlint .github/workflows/*.yml; then
        print_status "Workflow syntax is valid"
    else
        print_error "Workflow syntax errors found"
        exit 1
    fi
else
    print_warning "actionlint not installed, skipping syntax check"
    print_warning "Install with: go install github.com/rhysd/actionlint/cmd/actionlint@latest"
fi

# Test 2: Validate Dockerfiles
echo "🐳 Testing Docker builds..."
modules=("game" "frontend" "backend")

for module in "${modules[@]}"; do
    if [ -f "${module}/Dockerfile" ]; then
        echo "Testing ${module} Dockerfile..."
        if docker build --dry-run "${module}" &> /dev/null; then
            print_status "${module} Dockerfile syntax is valid"
        else
            print_error "${module} Dockerfile has syntax errors"
        fi
    else
        print_warning "${module} Dockerfile not found"
    fi
done

# Test 3: Check dependencies
echo "📦 Checking dependencies..."

# Game dependencies
if [ -f "game/package.json" ]; then
    echo "Testing game dependencies..."
    cd game
    if npm install --dry-run &> /dev/null; then
        print_status "Game dependencies are valid"
    else
        print_error "Game dependency issues found"
    fi
    cd ..
fi

# Frontend dependencies
if [ -f "frontend/requirements.txt" ]; then
    echo "Testing frontend dependencies..."
    cd frontend
    if python3 -c "import pkg_resources; [pkg_resources.require(line.strip()) for line in open('requirements.txt') if line.strip() and not line.startswith('#')]" 2>/dev/null; then
        print_status "Frontend dependencies are valid"
    else
        print_error "Frontend dependency issues found"
    fi
    cd ..
fi

# Backend dependencies
if [ -f "backend/requirements.txt" ]; then
    echo "Testing backend dependencies..."
    cd backend
    if python3 -c "import pkg_resources; [pkg_resources.require(line.strip()) for line in open('requirements.txt') if line.strip() and not line.startswith('#')]" 2>/dev/null; then
        print_status "Backend dependencies are valid"
    else
        print_error "Backend dependency issues found"
    fi
    cd ..
fi

# Test 4: Check for required files
echo "📁 Checking required files..."
required_files=(
    ".github/workflows/game-ci.yml"
    ".github/workflows/frontend-ci.yml"
    ".github/workflows/backend-ci.yml"
    ".github/workflows/master-ci.yml"
    ".github/workflows/release.yml"
    ".github/workflows/security.yml"
    ".github/workflows/dependencies.yml"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_status "$file exists"
    else
        print_error "$file missing"
    fi
done

# Test 5: Validate YAML syntax
echo "📄 Validating YAML syntax..."
if command -v yamllint &> /dev/null; then
    if yamllint .github/workflows/*.yml; then
        print_status "YAML syntax is valid"
    else
        print_error "YAML syntax errors found"
    fi
else
    print_warning "yamllint not installed, skipping YAML validation"
    print_warning "Install with: pip install yamllint"
fi

echo ""
print_status "Local workflow testing completed!"
echo ""
echo "Next steps:"
echo "1. Commit and push your changes"
echo "2. Check the Actions tab for workflow runs"
echo "3. Monitor build and deployment status"
echo ""
echo "Useful commands:"
echo "- View workflow logs: gh workflow view"
echo "- List recent runs: gh run list"
echo "- View run details: gh run view <run-id>"