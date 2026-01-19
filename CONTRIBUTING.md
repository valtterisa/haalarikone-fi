# Contributing to Haalarikone

Thank you for your interest in contributing to Haalarikone! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue using the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md). Include:

- A clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details (browser, OS, etc.)

### Suggesting Features

Feature requests are welcome! Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md) to:

- Describe the feature clearly
- Explain why it would be useful
- Provide examples or mockups if possible

### Pull Requests

1. **Fork the repository** and create your branch from `main`:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the project's coding standards:
   - Use TypeScript
   - Follow existing code style
   - Write clear, self-documenting code
   - Avoid unnecessary comments

3. **Test your changes**:

   ```bash
   pnpm test
   ```

   Ensure all tests pass before submitting.

4. **Commit your changes**:

   ```bash
   git commit -m "Add: brief description of changes"
   ```

   Use clear, descriptive commit messages.

5. **Push to your fork**:

   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Draft Pull Request (recommended for ongoing work)** using the [PR template](.github/PULL_REQUEST_TEMPLATE.md)

   - Use **Draft** while the work is in progress and you still plan to make changes.
   - Keep pushing commits to the same branch; the Draft PR stays up to date automatically.

7. **When ready, mark the PR as "Ready for review"**

   - Only mark it ready when the change is stable and you want feedback.

8. **Check and address CodeRabbit feedback**

   - CodeRabbit will leave automated review comments on your PR.
   - Read all CodeRabbit comments and either implement the suggested change or reply with a clear reason why you are not applying it.
   - Resolve CodeRabbit threads before requesting final approval / merging.

## Development Setup

1. **Clone your fork**:

   ```bash
   git clone https://github.com/YOUR_USERNAME/haalarikone.git
   cd haalarikone
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Set up environment variables** (see [README.md](./README.md#3-environment-variables))

4. **Start the development server**:
   ```bash
   pnpm run dev
   ```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode (already configured)
- Define proper types for all functions and components
- Avoid `any` types when possible

### Code Style

- **No comments** unless explicitly necessary
- Use meaningful variable and function names
- Keep functions focused and single-purpose
- Follow existing patterns in the codebase

### Component Guidelines

- Use functional components
- Prefer server components (Next.js App Router)
- Mark client components with `"use client"`
- Use path aliases (`@/`) for imports
- Keep components small and reusable

### Git Commit Messages

Use conventional commits-style prefixes:

- **feat:** new feature or user-facing enhancement
- **fix:** bug fix
- **chore:** tooling or dependency updates
- **docs:** documentation-only changes
- **refactor:** code refactors without behavior changes
- **test:** add or update tests

Example:

```
feat: add advanced search filters
fix: correct auth redirect loop
docs: clarify environment setup
```

## Testing

- Write tests for new features when applicable
- Ensure existing tests pass
- Test in multiple browsers (Chrome, Firefox, Safari)
- Test responsive design on different screen sizes

## Pull Request Process

1. **Update documentation** if you've changed functionality
2. **Add tests** for new features or bug fixes
3. **Ensure all tests pass** locally
4. **Update CHANGELOG.md** if applicable (if the project uses one)
5. **Make sure the PR is ready for review**
   - PR is not a Draft
   - CodeRabbit feedback is addressed (changes made or rationale provided)
6. **Request review** from maintainers

### PR Review Checklist

Before submitting, ensure:

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] No console errors or warnings
- [ ] Documentation is updated (if needed)
- [ ] Code is self-documenting (no unnecessary comments)
- [ ] TypeScript types are properly defined
- [ ] Changes are tested in development environment
- [ ] CodeRabbit comments are reviewed and resolved

## Questions?

If you have questions or need help:

- Open an issue with the [Question template](.github/ISSUE_TEMPLATE/question.md)
- Contact the maintainer: [savonen.emppu@gmail.com](mailto:savonen.emppu@gmail.com)

## Recognition

Contributors will be recognized in the project's README or contributors file. Thank you for helping make Haalarikone better!
