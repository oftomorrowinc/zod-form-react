# Contributing to Zod Form React

Thank you for your interest in contributing to Zod Form React! We welcome contributions from the community and are grateful for any help you can provide.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Coding Standards](#coding-standards)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

Please note that this project is released with a Contributor Code of Conduct. By participating in this project you agree to abide by its terms.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a new branch for your contribution
4. Make your changes
5. Push to your fork and submit a pull request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/zod-form-react.git
cd zod-form-react

# Install dependencies
npm install

# Start development mode
npm run dev

# Run the example app
npm run demo
```

### Firebase Emulators

For testing Firebase features locally:

```bash
# Start Firebase emulators
npm run emulators

# In another terminal, run the example
npm run demo
```

## Making Changes

1. **Create a Branch**: Create a feature branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**: Write your code following our coding standards

3. **Add Tests**: Ensure your changes are covered by tests

4. **Update Documentation**: Update the README.md if you're adding new features

5. **Check Your Code**: Run all checks before committing
   ```bash
   npm run check
   ```

## Testing

We use Jest for testing. Please ensure all tests pass:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- src/utils/schema-parser.test.ts
```

### Writing Tests

- Place test files next to the code they test with a `.test.ts` extension
- Write descriptive test names that explain what is being tested
- Test both success and error cases
- Mock Firebase services when testing Firebase features

Example test structure:
```typescript
describe('ComponentName', () => {
  it('should render without errors', () => {
    // Test implementation
  });

  it('should handle user interaction correctly', () => {
    // Test implementation
  });
});
```

## Submitting a Pull Request

1. **Update Your Branch**: Rebase your branch on the latest main
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run All Checks**: Ensure everything passes
   ```bash
   npm run check
   npm test
   npm run build
   ```

3. **Push Your Changes**: Push to your fork
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create Pull Request**: Go to GitHub and create a pull request with:
   - Clear title describing the change
   - Description of what was changed and why
   - Reference to any related issues
   - Screenshots for UI changes

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Provide proper types, avoid `any` when possible
- Export types from `types/` directory
- Use generics for reusable components

### React

- Use functional components with hooks
- Follow React best practices
- Keep components small and focused
- Use proper prop types

### Styling

- Use Tailwind CSS classes
- Follow the existing theme structure
- Keep dark mode in mind
- Use CSS variables for theme values

### Code Style

- We use Prettier for formatting (runs automatically)
- ESLint for linting
- Follow existing patterns in the codebase

### Git Commits

- Use clear, descriptive commit messages
- Follow conventional commits format:
  ```
  feat: add new feature
  fix: resolve bug in component
  docs: update README
  test: add tests for utils
  refactor: improve code structure
  ```

## Reporting Issues

When reporting issues, please include:

1. **Description**: Clear description of the issue
2. **Reproduction**: Steps to reproduce the behavior
3. **Expected Behavior**: What you expected to happen
4. **Actual Behavior**: What actually happened
5. **Environment**: 
   - OS and version
   - Node version
   - Browser (if applicable)
   - Package version
6. **Code Sample**: Minimal code example that reproduces the issue
7. **Error Messages**: Any error messages or console output

## Feature Requests

We welcome feature requests! Please:

1. Check existing issues to avoid duplicates
2. Provide a clear use case
3. Explain why this would benefit other users
4. If possible, suggest an implementation approach

## Questions?

Feel free to open an issue with the "question" label or reach out to the maintainers.

Thank you for contributing to Zod Form React! 🎉