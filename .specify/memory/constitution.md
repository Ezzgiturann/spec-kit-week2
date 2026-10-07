<!--
Sync Impact Report
==================
Version change: (unversioned template) → 1.0.0
Bump rationale: Initial ratification; all placeholders replaced with concrete governance.

Modified principles (template placeholder → new title):
  - [PRINCIPLE_1_NAME] → I. Readable, Intentional Code
  - [PRINCIPLE_2_NAME] → II. Test-First Development (NON-NEGOTIABLE)
  - [PRINCIPLE_3_NAME] → III. Meaningful Test Coverage
  - [PRINCIPLE_4_NAME] → IV. Simplicity & Single Responsibility
  - [PRINCIPLE_5_NAME] → V. Maintainability by Default

Added sections:
  - Code Quality Standards (was [SECTION_2_NAME])
  - Development Workflow & Quality Gates (was [SECTION_3_NAME])
  - Governance (filled)

Removed sections: none

Follow-up TODOs: none. Technology stack is not yet chosen, so the principles are
deliberately language-agnostic; tool-specific gates (linter, formatter, coverage
tool) are to be named in each feature's plan.md.
-->

# spec-kit-week2 Constitution

## Core Principles

### I. Readable, Intentional Code

Code is written for the next reader first and the compiler second.

- Names (variables, functions, types, files) MUST describe intent; abbreviations are allowed
  only when they are standard in the domain.
- Functions MUST do one thing at one level of abstraction. A function that needs a comment to
  explain *what* it does SHOULD be split or renamed instead.
- Comments MUST explain *why* (constraints, trade-offs, non-obvious decisions), not restate
  *what* the code does.
- Dead code, commented-out code, and unused imports/dependencies MUST NOT be merged.
- All code MUST pass the project's configured formatter and linter with zero warnings;
  suppressions MUST carry an inline justification.

**Rationale**: Code is read far more often than it is written. Consistent, intention-revealing
code lowers onboarding cost and reduces defects introduced during later changes.

### II. Test-First Development (NON-NEGOTIABLE)

- For every behavior change, a failing test that expresses the requirement MUST be written
  before the implementation (Red → Green → Refactor).
- Bug fixes MUST begin with a regression test that reproduces the bug and fails before the fix.
- Refactoring MUST NOT change behavior and MUST keep the full test suite green throughout.
- Tests MUST be derived from the acceptance scenarios in the feature's `spec.md`.

**Rationale**: Writing the test first forces a clear definition of "done", proves the test can
actually fail, and produces a safety net that makes later refactoring cheap.

### III. Meaningful Test Coverage

- Every public interface (module API, endpoint, CLI command) MUST have unit tests covering the
  happy path, boundary values, and documented error cases.
- Interactions across module, service, or persistence boundaries MUST have integration or
  contract tests.
- Tests MUST be deterministic: no reliance on wall-clock time, randomness without a fixed seed,
  test execution order, or uncontrolled network access. Flaky tests MUST be fixed or quarantined
  with a tracking issue within one working day.
- Tests MUST assert observable behavior, not implementation details, so that refactoring does
  not break them.
- Line coverage on changed code MUST be at least 80%; coverage is a floor, not a goal, and MUST
  NOT be achieved with assertion-free tests.

**Rationale**: Tests are only valuable if they catch real regressions and are trusted. Flaky or
implementation-coupled tests erode confidence and slow every future change.

### IV. Simplicity & Single Responsibility

- Implement the simplest solution that satisfies the current spec (YAGNI). Speculative
  generality, unused extension points, and premature optimization MUST NOT be added.
- Each module MUST have a single, clearly stated responsibility and a small public surface.
- New dependencies MUST be justified in `plan.md` (what it solves, why in-house code is worse,
  maintenance status, license).
- Any deviation that adds complexity MUST be recorded in the plan's Complexity Tracking table
  with the simpler alternative that was rejected and why.

**Rationale**: Every abstraction and dependency is a long-term maintenance cost. Complexity is
accepted only when it pays for itself in the current requirements.

### V. Maintainability by Default

- Modules MUST depend on abstractions at their boundaries (I/O, persistence, external services)
  so they can be tested and replaced in isolation.
- Errors MUST be handled explicitly: no silently swallowed exceptions; error messages MUST
  include enough context to diagnose the failure.
- Public interfaces MUST be documented (purpose, inputs, outputs, errors). Breaking changes to
  them MUST be called out in the PR and the spec.
- Duplication MUST be removed once the same logic appears a third time (Rule of Three), not
  earlier by guesswork.
- Configuration and secrets MUST NOT be hard-coded.

**Rationale**: The cost of software is dominated by its maintenance. Clear boundaries, explicit
errors, and documented contracts keep the codebase changeable as requirements evolve.

## Code Quality Standards

- **Size limits (guidance)**: Functions SHOULD stay under ~40 lines and files under ~400 lines;
  exceeding either requires a short justification in review.
- **Complexity**: Cyclomatic complexity per function SHOULD stay at or below 10; higher values
  MUST be justified or refactored.
- **Static analysis**: The chosen language's type checker (where available), linter, and
  formatter MUST be configured in the repository and run in CI.
- **Consistency**: Follow existing project conventions over personal preference; changing a
  convention requires updating it project-wide or documenting the exception.
- **Tooling**: Concrete tools and thresholds for the selected stack MUST be recorded in each
  feature's `plan.md` under Technical Context.

## Development Workflow & Quality Gates

1. **Spec before code**: Work starts from `/speckit-specify` → `/speckit-plan` →
   `/speckit-tasks`; the plan MUST pass the Constitution Check before implementation begins.
2. **Small changes**: Pull requests SHOULD be focused on one concern and reviewable in under
   ~400 changed lines (excluding generated files).
3. **Merge gates** — a change MUST NOT merge unless:
   - all tests pass locally and in CI;
   - formatter, linter, and type checks pass with zero warnings;
   - coverage on changed code meets Principle III;
   - at least one reviewer has approved, explicitly checking compliance with this constitution.
4. **Commits**: Commit messages MUST describe *why* the change was made; each commit SHOULD
   leave the build green.
5. **Definition of Done**: Code, tests, and documentation for public interfaces are updated
   together in the same change.

## Governance

- This constitution supersedes all other development practices in this repository. Where a
  guideline conflicts with it, the constitution wins.
- **Amendments** MUST be made via a pull request that edits this file, states the motivation,
  includes a Sync Impact Report, and describes any migration needed for existing code.
- **Versioning** follows semantic versioning:
  - MAJOR — removal or backward-incompatible redefinition of a principle or governance rule;
  - MINOR — a new principle or section, or materially expanded guidance;
  - PATCH — clarifications, wording, and typo fixes with no change in meaning.
- **Compliance review**: Every plan MUST pass the Constitution Check gate, and every code
  review MUST verify adherence. Justified exceptions MUST be documented in the plan's
  Complexity Tracking table; undocumented violations block merge.
- The constitution SHOULD be reviewed at least once per quarter for relevance.

**Version**: 1.0.0 | **Ratified**: 2026-10-07 | **Last Amended**: 2026-10-07
