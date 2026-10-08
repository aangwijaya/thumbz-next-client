# AGENTS.md

## Role

You are working on the frontend repository of this project.

The frontend is responsible for:

* User interface
* User experience
* Client-side interactions
* Page and component implementation
* Frontend state management
* API consumption
* Authentication flows
* Form handling and validation
* Responsive layouts
* Accessibility
* Frontend tests

The backend is maintained in a separate repository.

Do not modify the backend repository unless explicitly requested.

---

# Source of Truth

Before implementing any task, read the relevant project documentation.

Priority order:

1. Explicit requirements from the current task
2. `design/DESIGN.md`
3. `PLAN.md`
4. `../thumbz-server/docs/API-CONTRACT.md` when available
5. Existing repository implementation and conventions
6. Relevant installed skills
7. Agent assumptions

When two documents conflict, follow the higher-priority source.

Do not invent requirements that are not supported by the documentation or current task.

---

# Project Documentation

## `design/DESIGN.md`

This is the primary source of truth for the frontend design.

Use it to understand:

* Product UI direction
* Visual language
* Layout
* Typography
* Colors
* Spacing
* Components
* Interaction patterns
* Responsive behavior
* UX requirements
* Design references

The repository may also contain:

```text
design/
├── DESIGN.md
└── references/
    ├── steep.md
    └── monad.md
```

`references/steep.md` and `references/monad.md` are reference material only.

They are not independent design systems.

Do not blindly combine their visual styles.

If references conflict with `design/DESIGN.md`, follow `DESIGN.md`.

The final product must feel like one coherent product rather than a collection of copied design patterns.

Do not rewrite `DESIGN.md` during implementation unless explicitly requested.

---

## `PLAN.md`

Use `PLAN.md` to understand:

* Implementation phases
* Feature order
* Page structure
* Component strategy
* API integration
* State requirements
* Testing requirements
* Dependencies between features

Follow the plan unless an implementation problem makes it impossible or unsafe to do so.

---

## `../thumbz-server/docs/API-CONTRACT.md`

This defines the communication contract between frontend and backend.

Before implementing API integration, check the contract.

Do not assume backend behavior.

Follow the documented:

* HTTP method
* Endpoint
* Authentication requirements
* Authorization requirements
* Request structure
* Response structure
* Error structure
* Pagination
* Filtering
* Sorting
* Validation behavior

Do not silently modify the API contract.

If the frontend requires an API contract change:

1. Stop the affected implementation.
2. Explain why the contract is insufficient.
3. Identify the impact on frontend and backend.
4. Update the API contract after approval.
5. Update the relevant plans if necessary.
6. Continue implementation.

---

# Coding Principles

## 1. Prefer stupid-simple code

Write code that is:

* Direct
* Explicit
* Readable
* Predictable
* Easy to debug
* Easy to maintain

Prefer simple React and Next.js patterns.

Do not optimize for cleverness.

---

## 2. No unnecessary abstraction

Do not create abstractions without a real need.

Avoid:

* Generic component factories
* Generic hooks that only wrap one API call
* Excessive utility functions
* Generic form abstractions for a single form
* Generic state-management layers
* Wrapper components that provide no meaningful behavior
* Premature design systems
* Excessive component composition

Create abstractions when they solve an actual repeated problem.

---

## 3. Avoid over-engineering

Do not introduce complexity for hypothetical future requirements.

Do not add:

* State management libraries without a real requirement
* Data-fetching libraries without a real requirement
* Complex caching layers
* Unnecessary client-side state
* Complex design-system infrastructure
* Micro-frontends
* Excessive custom hooks
* Unnecessary rendering optimizations

Use the simplest solution that satisfies the actual requirements.

---

# Next.js Principles

Use Next.js according to the project's established architecture and current conventions.

Prefer Server Components by default when they are appropriate.

Use Client Components only when client-side behavior is actually required.

Examples of legitimate Client Component requirements:

* Browser APIs
* User interaction requiring client state
* Event handlers
* Interactive UI
* Client-side effects
* Client-side authentication behavior where required

Do not add `"use client"` automatically.

Keep the client/server boundary as small as practical.

---

# React Principles

Prefer:

* Small focused components
* Clear props
* Local state when state is local
* Explicit data flow
* Composition where it improves readability

Avoid:

* Deep component hierarchies without a reason
* Prop drilling solved prematurely with global state
* Large components containing unrelated responsibilities
* Clever hooks
* Hidden side effects

A component should have a clear responsibility.

---

# Component Guidelines

Create a component when:

* It represents a meaningful UI unit.
* It is reused.
* It has meaningful internal behavior.
* Extracting it makes the parent easier to understand.

Do not create a component merely because a JSX fragment is a few lines long.

Prefer:

```text id="z7s2qf"
Feature
├── Page
├── FeatureHeader
├── FeatureList
└── FeatureItem
```

over excessive fragmentation such as:

```text id="k5n1cb"
Wrapper
Container
Section
Content
Inner
Row
ItemWrapper
```

unless the design genuinely requires those boundaries.

---

# UI and Design

`design/DESIGN.md` is the source of truth for visual implementation.

Follow:

* Typography
* Spacing
* Color usage
* Border radius
* Shadows
* Layout
* Component appearance
* Responsive behavior
* Interaction states

Do not invent a different visual language when the design already specifies one.

Do not copy reference designs literally.

Use Steep/Monad references as inspiration and guidance where appropriate, while maintaining a unified product identity.

---

# Responsive Design

The UI must work across the supported viewport sizes defined by the design.

Prefer responsive layouts using the project's existing styling approach.

Do not create unnecessary breakpoint-specific implementations.

Avoid fixing one viewport while breaking another.

When implementing responsive behavior, consider:

* Navigation
* Content width
* Tables
* Forms
* Cards
* Modals
* Overflow
* Typography
* Touch interaction

---

# Accessibility

Interactive UI should be accessible by default.

Use:

* Semantic HTML
* Proper buttons and links
* Labels for form controls
* Meaningful accessible names
* Keyboard-accessible interactions
* Appropriate focus states
* Appropriate ARIA only when necessary

Do not use `<div>` elements as interactive controls when a native element is appropriate.

---

# API Data

Treat data received from APIs as external/untrusted data.

Always use optional chaining (`?.`) when accessing properties on objects received from:

* APIs
* Props
* External services
* Server responses
* Other external sources

Example:

```ts id="z6q8ar"
user?.profile?.name
```

instead of:

```ts id="p4m2dx"
user.profile.name
```

when the value may be `undefined` or `null`.

Do not blindly add optional chaining to values whose existence is guaranteed by an established internal invariant.

---

# API Integration

The frontend must consume the API defined in:

```text
../thumbz-server/docs/API-CONTRACT.md
```

Do not:

* Guess endpoint names
* Guess response shapes
* Guess authentication behavior
* Add undocumented query parameters
* Depend on undocumented backend behavior
* Transform API data unnecessarily

Keep API integration explicit.

If the backend response is unsuitable for the UI, solve the problem deliberately rather than silently depending on undocumented behavior.

---

# Authentication

Authentication state must be handled according to the project's defined authentication architecture.

Do not store sensitive authentication information in insecure client-side storage unless explicitly required by the architecture.

Do not trust client-side authentication state for authorization.

The backend remains responsible for enforcing authorization.

The frontend should provide appropriate UX for:

* Unauthenticated users
* Authenticated users
* Unauthorized users
* Expired sessions
* Authentication failures

---

# Forms

Forms should:

* Validate user input
* Provide clear error messages
* Prevent accidental duplicate submissions
* Show appropriate loading states
* Handle API validation errors
* Preserve user input when appropriate

Do not duplicate complex backend business rules unnecessarily in the frontend.

Frontend validation improves UX.

Backend validation remains authoritative.

---

# Loading, Error, and Empty States

Every asynchronous user-facing feature should consider:

* Loading state
* Success state
* Error state
* Empty state

Do not assume API calls always succeed.

Error states should be understandable to users.

Do not expose internal API errors or implementation details directly to users.

---

# State Management

Prefer the smallest state scope possible.

Use:

* Local component state for local UI state
* URL state for shareable/filterable navigation state
* Server-side data fetching when appropriate
* Global state only when genuinely shared across unrelated parts of the application

Do not introduce global state simply because multiple components currently need access to the same data.

---

# Performance

Optimize meaningful bottlenecks, not hypothetical ones.

Prefer:

* Appropriate Server Components
* Appropriate data fetching
* Lazy loading when beneficial
* Efficient rendering
* Proper image handling
* Reasonable bundle size

Do not add:

* Memoization everywhere
* `useMemo` without a demonstrated need
* `useCallback` without a demonstrated need
* Complex caching
* Premature virtualization

Measure or identify a real problem before introducing complex optimization.

---

# Dependencies

Before adding a dependency:

1. Check whether the existing stack already provides the functionality.
2. Check whether it can be implemented simply without a dependency.
3. Confirm that the dependency is actually necessary.
4. Prefer small and well-maintained dependencies.

Do not add a dependency merely for convenience.

Do not replace an existing project convention with a new library without justification.

---

# Security

Never expose:

* Secrets
* Private API keys
* Tokens that must remain server-side
* Credentials
* Production environment values

Never place server-only secrets into client-exposed environment variables.

Do not assume that hiding a UI element provides security.

Authorization must be enforced by the backend.

---

# Changes and Scope

Keep changes focused.

Do not modify unrelated files.

Do not perform opportunistic refactoring while implementing a feature.

If existing code is imperfect but does not block the requested task, leave it alone unless fixing it is necessary.

Avoid large rewrites unless explicitly requested.

---

# Phased Implementation

Implementation must be performed **phase by phase**, not all at once.

Do not implement the entire `PLAN.md` in a single pass.

For each phase:

1. Read the relevant phase in `PLAN.md`.
2. Identify the smallest logical unit of work.
3. Implement only that unit.
4. Run the relevant validation.
5. Inspect the resulting diff.
6. Confirm consistency with:

   * `design/DESIGN.md`
   * `PLAN.md`
   * `docs/API-CONTRACT.md`
   * Existing project conventions
7. Only then continue to the next logical unit.

---

# Do Not Batch Unrelated Work

Do not create or modify many unrelated files in a single step merely because they appear in `PLAN.md`.

Prefer:

```text id="x2v4km"
Phase
  ↓
Small logical unit
  ↓
Implement
  ↓
Validate
  ↓
Review diff
  ↓
Next logical unit
```

Do not do:

```text id="h3z7pn"
Read PLAN.md
  ↓
Create 10–20 files
  ↓
Implement everything
  ↓
Run tests at the end
```

---

# Smallest Logical Unit

A logical unit should be small enough that its correctness can be understood and verified independently.

For example:

```text id="u8b3wd"
Create page structure
      ↓
Validate
      ↓
Create API integration
      ↓
Validate
      ↓
Create loading/error states
      ↓
Validate
      ↓
Create interactive components
      ↓
Validate
      ↓
Integration test
```

Do not create every page, component, hook, API client, and state layer simultaneously unless the feature is genuinely trivial.

---

# Stop Between Units

After completing a logical unit, stop and verify the result before continuing.

If validation fails:

1. Fix the current unit.
2. Re-run validation.
3. Do not continue to the next unit until the current unit is stable.

Do not accumulate multiple known failures across phases.

---

# Respect Phase Boundaries

Do not jump ahead to later phases because the implementation appears easy.

For example, if the current phase is:

```text id="q7p4de"
Frontend foundation
```

do not simultaneously implement:

```text id="r2m9wx"
All feature pages
Complex API integrations
Complete authentication UX
```

unless explicitly required by the current task.

---

# Completion Reporting

After each logical unit, briefly report:

```text id="e9k3sa"
Completed:
- What was implemented

Files changed:
- file/path
- file/path

Validation:
- Typecheck: PASS/FAIL
- Lint: PASS/FAIL
- Tests: PASS/FAIL
- Build: PASS/FAIL (when applicable)

Next:
- The next logical unit from the current phase
```

Do not silently continue through multiple implementation units.

---

# Architecture Changes

Do not change the established frontend architecture casually.

If implementation reveals that the planned architecture is insufficient:

1. Stop before making a broad architectural change.
2. Explain the problem.
3. Identify affected components.
4. Explain the proposed solution.
5. Check API contract impact.
6. Update the relevant documentation/plan after approval.
7. Then implement.

Architecture changes must be deliberate.

---

# API Contract Changes

If implementation requires a change to:

```text
../thumbz-server/docs/API-CONTRACT.md
```

stop the affected implementation.

Do not work around the contract by introducing undocumented behavior.

Follow:

```text id="b6t1qr"
Identify problem
      ↓
Explain required change
      ↓
Review contract impact
      ↓
Update API contract
      ↓
Update FE/BE plans if necessary
      ↓
Implement
```

The frontend and backend are separate repositories.

The API contract is the boundary between them.

---

# Installed Skills

Use installed skills when they are relevant to the current task.

Do not recreate installed skills inside the repository.

Do not create a `skills.md` file merely to document installed skills.

Do not duplicate skill documentation into `AGENTS.md`.

Use the appropriate installed skill when it provides specific knowledge or workflow guidance for the task.

---

## Model usage

Use the most appropriate configured model for the task.

### DeepSeek Flash
Use for:
- routine implementation
- standard React/Next.js components
- API integration
- forms
- CRUD UI
- TypeScript fixes
- lint/type errors
- small refactors
- repetitive implementation work

### DeepSeek Pro
Use for:
- architecture decisions
- complex debugging
- authentication/authorization
- major state-management decisions
- complex data-flow problems
- difficult performance issues
- reviewing a large implementation
- situations where the agent is stuck or repeatedly failing

### Kimi K3
Prefer Kimi K3 for frontend visual work, especially:
- landing pages
- hero sections
- high-visibility marketing sections
- streaming player UI
- streaming overlays
- esports match presentation
- player statistics UI
- dashboard layouts
- metric visualization
- charts and data-dense interfaces
- visual polish and responsive layout

For ordinary frontend implementation, DeepSeek Flash is sufficient.

Do not switch models merely because a task contains JSX or CSS.
Use Kimi K3 when visual quality and UI composition are a primary concern.

---

# Implementation Workflow

For a normal feature:

```text id="m5j8rc"
Read DESIGN.md
      ↓
Read PLAN.md
      ↓
Check API-CONTRACT.md
      ↓
Inspect existing implementation
      ↓
Identify smallest logical unit
      ↓
Implement
      ↓
Run validation
      ↓
Review diff
      ↓
Continue
```

Before finishing a task:

* Confirm the implementation follows `design/DESIGN.md`.
* Confirm the implementation follows `PLAN.md`.
* Confirm the API contract has not been violated.
* Confirm responsive behavior is appropriate.
* Confirm accessibility requirements are addressed.
* Confirm loading/error/empty states are handled where applicable.
* Confirm type checking passes.
* Confirm linting passes where configured.
* Confirm relevant tests pass.
* Confirm no unrelated files were changed.
* Confirm no unnecessary dependencies were introduced.
* Confirm no unnecessary abstractions were introduced.

---

# Definition of Done

A frontend task is complete when:

* The requested behavior is implemented.
* The implementation follows `design/DESIGN.md`.
* The implementation follows `PLAN.md`.
* API integration follows `docs/API-CONTRACT.md`.
* Authentication behavior follows the defined architecture.
* User input is appropriately validated.
* Loading, error, and empty states are handled where applicable.
* Responsive behavior is correct.
* Accessibility has been considered.
* Type checking passes.
* Linting passes where configured.
* Relevant tests pass.
* No secrets are exposed.
* No unrelated changes are included.
* The implementation remains simple and maintainable.

---

# Final Rule

When in doubt:

> Prefer the simplest implementation that correctly satisfies the requirements.

Do not add complexity to solve hypothetical future problems.

Do not assume requirements that were not specified.

Do not change architecture or API contracts without justification.

Build what is required, keep the code explicit, and leave the codebase simpler rather than more complicated.
