---
mode: ask
---
## Context
- **Project and current codebase:** primr-faq-demo

THe FAQ demo is build for event planners that might have to manage events with tons of volunteers (like a tech conference). The volunteers should be able to use the faq demo app to ask questions that will be answered will all of the documentation uploaded in the application.

## 🎯 Task
Add support to the application for uploading .pdf files. The application should be able to extract text from the PDF and create embeddings for it, similar to how it currently handles `.docx`, `.md`, and `.txt` files.


## 🚧 Constraints
- **Do not** modify any existing files except to _add_ the new feature.
- Keep naming, folder structure, and coding conventions _exactly_ as current code (TS, async/await, error handling).
- Tests must live under `tests/` and follow the naming pattern `*.spec.ts`.
- No new dependencies unless absolutely necessary—document any you propose.

## ✅ Success Criteria
- Automated tests cover all detection branches (missing, outdated, present).
- New command registered under `/ask-primr check-environment` and documented in `README.md`.
- All existing tests still pass with zero regressions.
- Linter (ESLint/Prettier) reports zero errors or warnings.

## 🛠️ Engineering Best Practices
- Write clear JSDoc/TSDoc comments for all public functions.
- Add or update any TypeScript types/interfaces as needed.
- Adhere to existing error‑handling patterns (`try/catch` + logging).
- Include inline code comments only where logic isn’t self‑explanatory.
- Update `CHANGELOG.md` with a summary of the new feature.
- If any edge case requires a breaking change, flag it in your PR description.
