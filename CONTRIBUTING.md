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

## Adding Data to Upstash Search

This section explains how to add and update data in the Upstash Search vector database used for semantic search functionality.

### Overview

Data is stored in JSON format and automatically enriched with translations before being uploaded to Upstash Search. Contributors only need to edit the JSON file with Finnish strings - all translation and enrichment happens automatically.

### Data Format

Entries in `data/overall_colors_upstash.json` should follow this structure:

```json
{
  "id": "unique_id",
  "content": {
    "vari": "color_name",
    "alue": "area_or_city",
    "ala": "field_of_study",
    "ainejärjestö": "student_organization",
    "oppilaitos": "university_or_school"
  },
  "metadata": {
    "hex": "background: #color; color: white;"
  }
}
```

**Field Descriptions:**

- `id` (required): Unique identifier as a string (e.g., "1", "2", "123")
- `content` (required): Object containing searchable fields:
  - `vari`: Color name in Finnish (e.g., "metsänvihreä", "musta", "valkoinen")
  - `alue`: Area or city in Finnish (e.g., "Hattula", "Helsinki")
  - `ala`: Field of study in Finnish. For multiple fields, use comma-separated values (e.g., "insinööri, kestävä kehitys")
  - `ainejärjestö`: Student organization name in Finnish. Can be empty string `""` if not applicable
  - `oppilaitos`: University or school name in Finnish (e.g., "Hämeen AMK", "Aalto-yliopisto")
- `metadata` (optional): Additional data:
  - `hex`: CSS styling string for color display (e.g., "background: #14780a; color: white;")

**Example Entry:**

```json
{
  "id": "1",
  "content": {
    "vari": "metsänvihreä",
    "alue": "Hattula",
    "ala": "hortonomi",
    "ainejärjestö": "LOK ry",
    "oppilaitos": "Hämeen AMK"
  },
  "metadata": {
    "hex": "background: #14780a; color: white;"
  }
}
```

### Upload Process

To upload data to Upstash Search:

1. **Edit the JSON file**: Add or update entries in `data/overall_colors_upstash.json`
2. **Ensure dev server is running**: The API endpoint requires the server to be running
   ```bash
   pnpm run dev
   ```
3. **Make POST request**: Call the `/api/upsert` endpoint
   ```bash
   curl -X POST http://localhost:3000/api/upsert
   ```
   Or use any HTTP client (Postman, Insomnia, etc.) to make a POST request to `http://localhost:3000/api/upsert`
4. **Check response**: The endpoint returns upload statistics:
   ```json
   {
     "success": true,
     "count": 1500,
     "batches": 15,
     "existingCount": 1400,
     "newCount": 100,
     "mergedCount": 1500
   }
   ```

### What Happens Automatically

When you call `/api/upsert`, the system automatically:

1. **Reads the JSON file**: Loads all entries from `data/overall_colors_upstash.json`
2. **Fetches existing data**: Retrieves current documents from Upstash Search index `haalarikone-db` (for merging)
3. **Merges data**: Combines new entries with existing ones, preserving existing data
4. **Enriches with translations**: Converts Finnish strings to multi-language objects using `data/translations.json`
5. **Uploads in batches**: Uploads documents in batches of 100 to Upstash Search for efficient processing

### Data Enrichment Details

The enrichment process (`lib/enrich-search-data.ts`) automatically converts fields:

- **`vari`** → `{fi: "metsänvihreä", en: "forest green", sv: "skogsgrön"}` using `translations.colors`
- **`alue`** → `{fi: "Hattula", en: "Hattula", sv: "Hattula"}` using `translations.areas`
- **`ala`** → `{fi: "hortonomi", en: "horticulturist", sv: "hortonom"}` using `translations.fields` (handles comma-separated values by translating each field individually)
- **`oppilaitos`** → `{fi: "Hämeen AMK", en: "Häme University of Applied Sciences", sv: "Hämeen ammattikorkeakoulu"}` using `translations.universities`
- **`ainejärjestö`** → Stays as a string (no translation applied)

Translations are loaded from `data/translations.json`. If a translation is missing, the Finnish value is used as fallback.

### Example Workflow

**1. Add a new entry to `data/overall_colors_upstash.json`:**

```json
{
  "id": "999",
  "content": {
    "vari": "sininen",
    "alue": "Tampere",
    "ala": "tietojenkäsittely",
    "ainejärjestö": "TKO-äly",
    "oppilaitos": "Tampereen yliopisto"
  },
  "metadata": {
    "hex": "background: blue; color: white;"
  }
}
```

**2. Make POST request:**

```bash
curl -X POST http://localhost:3000/api/upsert
```

**3. Expected response:**

```json
{
  "success": true,
  "count": 1501,
  "batches": 16,
  "existingCount": 1500,
  "newCount": 1,
  "mergedCount": 1501
}
```

**4. Enriched data in Upstash:**

After upload, the data in Upstash Search will have this structure:

```json
{
  "id": "999",
  "content": {
    "vari": {
      "fi": "sininen",
      "en": "blue",
      "sv": "blå"
    },
    "alue": {
      "fi": "Tampere",
      "en": "Tampere",
      "sv": "Tammerfors"
    },
    "ala": {
      "fi": "tietojenkäsittely",
      "en": "computer science",
      "sv": "datavetenskap"
    },
    "ainejärjestö": "TKO-äly",
    "oppilaitos": {
      "fi": "Tampereen yliopisto",
      "en": "University of Tampere",
      "sv": "Tammerfors universitet"
    }
  },
  "metadata": {
    "hex": "background: blue; color: white;"
  }
}
```

### Related Files

- `data/overall_colors_upstash.json` - Source data file edited by contributors
- `app/api/upsert/route.ts` - API endpoint that handles uploads
- `lib/enrich-search-data.ts` - Function that enriches documents with translations
- `data/translations.json` - Translation mappings for colors, areas, fields, and universities

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
