# Contributing to Pulse

First off, thank you for considering contributing to Pulse! 🎉

This document provides guidelines and information for contributors. Following these guidelines helps communicate that you respect the time of the developers managing and developing this open source project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Issue Guidelines](#issue-guidelines)

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

**TL;DR**: Be respectful, inclusive, and constructive.

---

## Getting Started

### Prerequisites

- **Node.js** 20 or higher
- **npm** 10 or higher
- **Git**
- **Docker** (optional, for backend services)

### Development Setup

1. **Fork the repository**

   Click the "Fork" button on GitHub to create your own copy.

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/pulse.git
   cd pulse
   ```

3. **Add upstream remote**

   ```bash
   git remote add upstream https://github.com/h18n/pulse.git
   ```

4. **Install dependencies**

   ```bash
   cd ui
   npm install
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open in browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

> 📘 For a complete setup walkthrough (including backend and Docker), see **[Getting Started](docs/GETTING_STARTED.md)**.

---

## How to Contribute

### Types of Contributions

We welcome many types of contributions:

| Type | Description |
|------|-------------|
| 🐛 **Bug Fixes** | Fix issues in existing code |
| ✨ **Features** | Add new functionality |
| 📖 **Documentation** | Improve or add documentation |
| 🎨 **Design** | Improve UI/UX |
| ⚡ **Performance** | Improve performance |
| ♿ **Accessibility** | Improve accessibility |
| 🧪 **Tests** | Add or improve tests |

### Finding Issues to Work On

- Look for issues labeled `good first issue` for beginner-friendly tasks
- Check `help wanted` for issues where we need assistance
- Browse `feature request` for new features to implement

### Before Starting Work

1. **Check existing issues** - Make sure no one else is working on it
2. **Open an issue first** - For major changes, discuss before implementing
3. **Assign yourself** - Comment on the issue that you're working on it

---

## Pull Request Process

### 1. Create a Branch

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
```

**Branch naming conventions:**

| Type | Format | Example |
|------|--------|---------|
| Feature | `feature/description` | `feature/add-trace-explorer` |
| Bug fix | `fix/description` | `fix/alert-not-dismissing` |
| Documentation | `docs/description` | `docs/update-api-reference` |
| Refactor | `refactor/description` | `refactor/extract-hook` |

### 2. Make Your Changes

- Write clean, readable code
- Follow the [coding standards](#coding-standards)
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run all checks
npm run lint
npm run type-check
npm run test:unit

# For UI changes, also run E2E tests
npm run test:e2e
```

### 4. Commit Your Changes

Follow our [commit message guidelines](#commit-messages):

```bash
git add .
git commit -m "feat(alerts): add alert silencing functionality"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

### 6. PR Requirements

Your PR must:

- [ ] Pass all CI checks
- [ ] Have no merge conflicts
- [ ] Include tests for new functionality
- [ ] Update relevant documentation
- [ ] Have a clear description of changes
- [ ] Reference any related issues

### 7. Code Review

- A maintainer will review your PR
- Address any requested changes
- Once approved, a maintainer will merge

---

## Coding Standards

### TypeScript

```typescript
// ✅ DO: Use explicit types
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ DON'T: Use `any`
function processData(data: any): any {
  // ...
}
```

### React Components

```tsx
// ✅ DO: Use functional components with TypeScript
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ variant = 'primary', children, onClick }: ButtonProps) {
  return (
    <button
      className={cn('btn', variant === 'primary' ? 'btn-primary' : 'btn-secondary')}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// ❌ DON'T: Use class components or untyped props
class Button extends React.Component {
  render() {
    return <button>{this.props.children}</button>;
  }
}
```

### Styling

```tsx
// ✅ DO: Use Tailwind CSS with semantic colors
<div className="bg-card border border-border rounded-lg p-4">
  <h2 className="text-foreground font-semibold">Title</h2>
  <p className="text-muted-foreground">Description</p>
</div>

// ❌ DON'T: Use inline styles or hardcoded colors
<div style={{ backgroundColor: '#141417', padding: '16px' }}>
  <h2 style={{ color: '#fff' }}>Title</h2>
</div>
```

### Data Handling (Mock-First Philosophy)
 
 We use a **Mock-First, API-Always** approach. This means components should be developed using a common data hook that gracefully handles missing backend services by providing realistic mock data.
 
 ```tsx
 // ✅ DO: Use useDataQuery with targets
 const { data, isLoading } = useDataQuery({
   targets: [{ refId: 'A', expr: 'rate(http_requests_total[5m])' }],
   timeRange: { from: 'now-1h', to: 'now' }
 });
 
 // ❌ DON'T: Hardcode mock data inside the component
 const [data] = useState(MOCK_DATA); 
 ```
 
 - All data fetching should pass through `src/lib/hooks/useDataQuery.ts`.
 - Always provide a fallback path in your logic for when the API returns an error or empty data.
 
 ### File Organization

```
src/components/
├── ui/                    # Base UI components
├── layout/                # Layout components
├── features/              # Feature-specific components
│   └── alerts/
│       ├── AlertList.tsx
│       ├── AlertCard.tsx
│       ├── AlertCard.test.tsx
│       └── index.ts
└── providers/             # Context providers
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `AlertCard.tsx` |
| Hooks | camelCase with `use` prefix | `useAlerts.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_ALERTS = 100` |
| Types/Interfaces | PascalCase | `interface AlertProps` |

---

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, etc.) |
| `refactor` | Code refactoring |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks |
| `perf` | Performance improvements |

### Examples

```bash
# Feature
git commit -m "feat(dashboard): add real-time widget refresh"

# Bug fix
git commit -m "fix(alerts): resolve notification not dismissing on click"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Breaking change
git commit -m "feat(api)!: change alert response format

BREAKING CHANGE: Alert API now returns array instead of object"
```

### Scope

Common scopes for this project:

- `dashboard` - Dashboard features
- `alerts` - Alerting system
- `correlation` - Correlation rules engine ✨NEW
- `automation` - Runbook automation ✨NEW
- `logs` - Log explorer
- `metrics` - Metrics explorer
- `explore` - Explore pages (global queries) ✨NEW
- `copilot` - AI Copilot
- `devices` - Infrastructure monitoring
- `sensors` - MQTT sensor integration ✨NEW
- `incidents` - Incident management
- `auth` - Authentication
- `ui` - UI components
- `api` - API endpoints
- `websocket` - Real-time updates ✨NEW

---

## Issue Guidelines

### Bug Reports

When reporting a bug, include:

1. **Environment**: OS, browser, Node.js version
2. **Steps to reproduce**: Detailed steps to trigger the bug
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Screenshots**: If applicable
6. **Console errors**: Any error messages

**Template:**

```markdown
## Bug Description
A clear description of the bug.

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Screenshots
If applicable, add screenshots.

## Environment
- OS: [e.g., macOS 14.0]
- Browser: [e.g., Chrome 120]
- Node.js: [e.g., 20.10.0]
```

### Feature Requests

When requesting a feature, include:

1. **Problem statement**: What problem does this solve?
2. **Proposed solution**: How would you solve it?
3. **Alternatives considered**: Other approaches you've thought of
4. **Additional context**: Mockups, examples, etc.

---

## Questions?

- 💬 [Start a Discussion](https://github.com/h18n/pulse/discussions)
- 🐛 [Report an Issue](https://github.com/h18n/pulse/issues)

---

Thank you for contributing to Pulse! 🙌
