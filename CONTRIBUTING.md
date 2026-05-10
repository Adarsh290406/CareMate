# 🤝 Contributing to CareMate AI

Thank you for your interest in contributing! Here's how to get started.

## Development Setup

Follow the [SETUP.md](SETUP.md) guide to get the project running locally.

## How to Contribute

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/caremate-ai.git`
3. **Create a branch**: `git checkout -b feature/your-feature-name`
4. **Make changes** and test them
5. **Commit**: `git commit -m "feat: add your feature description"`
6. **Push**: `git push origin feature/your-feature-name`
7. **Open a Pull Request**

## Commit Message Format

Use conventional commits:
```
feat: add new feature
fix: fix a bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add tests
```

## Code Style

- TypeScript strict mode — no `any` unless necessary
- Functional React components with hooks
- Use `cn()` utility from `lib/utils.ts` for conditional classnames
- All AI calls should go through `lib/gemini.ts`
- Firebase queries should use hooks in `hooks/`

## Adding a New Feature

1. Add UI in `src/pages/` or `src/components/`
2. Register route in `src/App.tsx`
3. Add AI logic to `src/lib/gemini.ts` if needed
4. Add link in `src/pages/Profile.tsx` if it's a patient tool

## Reporting Issues

Open a GitHub Issue with:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if UI-related
