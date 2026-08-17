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

### Prerequisites

- Node.js (LTS version recommended)
- pnpm (package manager)
- Git
- Anthropic API key (optional — only used for zero-result AI fallback)
- (Optional) Resend account for feedback emails

### 1. Clone your fork

```bash
git clone https://github.com/YOUR_USERNAME/haalarikone.git
cd haalarikone
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Environment variables

Create a `.env.local` file in the root directory with at least the following variables:

```env
# Anthropic (optional - AI fallback when deterministic search returns no results)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Resend (optional - feedback form)
RESEND_API_KEY=your_resend_api_key
FEEDBACK_EMAIL_TO=your_email@example.com
```

Notes:

- Optional: `ANTHROPIC_API_KEY` (AI fallback on zero-result searches)
- Optional: `RESEND_API_KEY`, `FEEDBACK_EMAIL_TO` (feedback form fails silently if missing)
- The app uses `localePrefix: 'as-needed'` – Finnish (default) has no prefix, other locales use `/en` or `/sv`

### 4. Start the development server

```bash
pnpm run dev
```

## Linting, formatting, and commit hooks

This project uses **Prettier**, **Husky**, and **lint-staged** to keep formatting consistent.

### Tooling

- Prettier for formatting (configured via `.prettierrc`)
- Husky for Git hooks
- lint-staged for running checks only on staged files

### On each commit

When you run `git commit`, Husky runs `lint-staged`, which:

- Runs `prettier --write` on staged `*.ts`, `*.tsx`, `*.md`, and `*.json` files

TypeScript typechecking is **not** part of any Git hook to keep commits fast. Type safety is enforced by `next build` (and optionally by running a manual typecheck command in CI or locally).

### Manual commands

Use these commands during development:

```bash
pnpm format     # Format the whole codebase with Prettier
pnpm test       # Run the test suite
```

In CI or locally, you can also rely on:

```bash
pnpm build      # Runs Next.js build, which performs typechecking
```

## Updating the Search Dataset

Search runs entirely against the local JSON dataset. There is no vector database upload step.

### Where the data lives

- `data/overall_data.json`: Source dataset used by the app

The dataset is loaded at runtime and used by:

- `lib/load-universities.ts`: loads searchable “university” rows from the JSON
- `lib/load-color-data.ts`: derives color variants/base colors for matching

### How to make changes safely

1. **Edit the JSON file**: add/update entries in `data/overall_data.json`
2. **Keep shapes consistent with existing entries**:
   - `content.vari` may be a string (color label) or an object (with `base` and/or `label`)
   - `metadata.hex` is optional and used for UI color rendering
3. **Validate behavior via the search API**:
   - The search endpoint (`app/api/search/route.ts`) combines AI query understanding, deterministic filtering, and an in-memory keyword scoring fallback
   - Changes to the dataset should be reflected immediately in local searches once the app reloads

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

### Internationalization

- Keep all user-facing text in translation files (`messages/*.json`)
- Use `useTranslations` in client components
- Use `getTranslations` in server components
- Route segments are translated via `lib/route-translations.ts`
- Entity slugs (universities, fields, colors) are translated via `lib/slug-translations.ts`

### Styling

- Use Tailwind CSS utility classes
- Shared UI components in `components/ui/` are built on Radix UI primitives
- Theme support is handled via `next-themes`
- Responsive breakpoints follow Tailwind conventions: `sm:`, `md:`, `lg:`, `xl:`

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

Haalarikone uses two layers of automated tests:

- **Unit & integration tests:** Vitest + React Testing Library (running in jsdom)
- **End-to-end tests:** Playwright browser tests

### Unit & integration tests (Vitest)

- Place tests close to the code under test (for example `components/*.test.tsx`, `lib/*.test.ts`)
- Run the full suite once:

```bash
pnpm test
```

- Run tests in watch mode during development:

```bash
pnpm test:watch
```

### End-to-end tests (Playwright)

- E2E tests live in the `tests/` directory
- Ensure the dev server is running (`pnpm run dev`), then run:

```bash
pnpm test:e2e
```

- After a run, open the HTML report:

```bash
pnpm exec playwright show-report
```

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
