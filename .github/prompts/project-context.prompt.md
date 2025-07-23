---
mode: ask
---
## Context
- **Project and current codebase:** primr-faq-demo

THe FAQ demo is build for event planners that might have to manage events with tons of volunteers (like a tech conference). The volunteers should be able to use the faq demo app to ask questions that will be answered will all of the documentation uploaded in the application.

## 🎯 Task
Expected behavior:
There are two events Event A and Event B.

Each event had it's own set of files.

When a volunteer asks a question, the application will search for the answer in the files uploaded for that event using RAG.

Actual behavior:
- the application is not searching for answer across all the files uploaded for the event. it seems to only be using one file to search for the answer. For example, if the question is "What is the schedule for Event A?" it should search across all files uploaded for Event A, not just one file.
- The application doesn't seem to be switching context based on the event selected. If I select Event A, it should only search for answers in files uploaded for Event A, and similarly for Event B.

## ☑️ Requirements
- List every functional requirement, e.g.
  - Must support Node ≥14, detect via `process.version`
  - Check `npm` vs. `yarn` installation
  - Detect running Docker daemon, MongoDB URI connectivity
  - Return JSON with fields `{ status: string, fixes: string[] }`
- Include any UI/output format rules (Slack message blocks, JSON shape, etc.)

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
