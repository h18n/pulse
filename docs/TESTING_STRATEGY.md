# Testing Strategy

To ensure absolute reliability for critical infrastructure software, Pulse enforces a comprehensive testing pyramid.

## 1. Unit Testing
*   **Framework:** `Vitest` or `Jest`.
*   **Scope:** All isolated utility functions, Redux/Zustand slice logic, and complex data parsers (e.g., transforming OpenTelemetry payloads into UI structures).
*   **Coverage Expectation:** > 80% coverage on core business logic modules.

## 2. Integration Testing
*   **Framework:** `Supertest` alongside Node testing frameworks.
*   **Scope:** Backend Fastify routes. Testing that the REST endpoints properly format requests to the underlying Elasticsearch/Prometheus stores without needing the UI.

## 3. End-to-End (E2E) Testing
*   **Framework:** `Playwright`
*   **Scope:** Testing critical user journeys:
    1.  User logs in.
    2.  User navigates to the Traces Explorer.
    3.  User expands a Trace to view the span waterfall.
    4.  User queries the AI Copilot.
*   **Execution:** Run headless in GitHub Actions on every Pull Request.

## 4. Linting and Static Analysis
*   **TypeScript:** Strict mode enabled. No `any` types allowed in core abstractions.
*   **ESLint/Prettier:** Enforced formatting. Code must pass `npm run lint` before a PR can be merged.

## Running Tests Locally
See the primary `README.md` for specific test execution commands (`npm run test`, `npm run test:e2e`).
