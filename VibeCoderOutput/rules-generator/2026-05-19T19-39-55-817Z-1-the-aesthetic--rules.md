# Development Rules: The Aesthetic

## Category: Core Principles

### Rule: Prioritize Clarity Over Cleverness

**Description:** Write code that is easy to read, understand, and reason about. Avoid overly complex or obscure language features when a simpler alternative exists.

**Rationale:** Aligns with the core principle of "Clarity over cleverness" from the research context. Ensures maintainability and reduces the cognitive load for developers, crucial for a project where visual quality and polish are paramount.

**Applicability:** All code files.

**Guidelines / Examples:**
```typescript
// Good Example:
function calculateTotalPrice(items: Item[], taxRate: number): number {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * taxRate;
  return subtotal + tax;
}

// Bad Example:
const calc = (i: any[], t: number) => i.reduce((s, {p, q}) => s + p * q, 0) * (1 + t);
```

### Rule: Maintain Consistency Across the Codebase

**Description:** Adhere to uniform patterns, naming conventions, formatting, and architectural choices throughout the project.

**Rationale:** Directly from the research context ("Consistency"). Essential for a predictable development experience and for ensuring that "The Aesthetic" is reflected not just in the UI but also in the code's structure and quality.

**Applicability:** All code files.

**Guidelines / Examples:**
- Use the same casing for variables (e.g., camelCase).
- Apply the same indentation and spacing rules.
- Follow the established file and folder structure.
- Use consistent patterns for error handling, state management, etc.

### Rule: Apply the KISS Principle (Keep It Simple, Stupid)

**Description:** Avoid unnecessary complexity in design, implementation, and architecture. Opt for the simplest solution that effectively meets the requirements.

**Rationale:** Aligns with the "Simplicity (KISS)" core principle. Reduces the likelihood of bugs and makes the codebase easier to maintain and understand, supporting the overall quality expected for "The Aesthetic."

**Applicability:** All code files and architectural decisions.

**Guidelines / Examples:**
- Prefer straightforward algorithms over complex ones unless performance dictates otherwise.
- Avoid deep nesting of conditional statements or loops.
- Decompose complex logic into smaller, manageable functions.

### Rule: Adhere to the DRY Principle (Don't Repeat Yourself)

**Description:** Avoid duplicating code. Extract common logic into reusable functions, components, or modules.

**Rationale:** Directly from the "Don't Repeat Yourself (DRY)" core principle. Reduces maintenance effort and the risk of inconsistencies.

**Applicability:** All code files.

**Guidelines / Examples:**
```typescript
// Good Example:
function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

// Bad Example:
// ... in component A
const priceFormatted = `$${item.price.toFixed(2)}`;
// ... in component B
const totalFormatted = `$${total.toFixed(2)}`;
```

### Rule: Follow the Single Responsibility Principle (SRP)

**Description:** Each function, class, module, or component should have one primary responsibility or reason to change.

**Rationale:** From the "Single Responsibility" core principle. Promotes modularity, testability, and maintainability. Helps in organizing code logically, which is important for a project focused on aesthetics and quality.

**Applicability:** Functions, classes, components, modules.

**Guidelines / Examples:**
- A UI component should handle rendering and user interaction, not data fetching or complex business logic.
- A service function should perform a specific business operation, not multiple unrelated tasks.

### Rule: Design for Security

**Description:** Integrate security considerations from the outset of development. Follow secure coding practices and validate all inputs and outputs.

**Rationale:** Aligns with the "Secure by design" core principle. Crucial for any software product to protect user data and maintain trust.

**Applicability:** All code, especially input handling, authentication, and data storage.

**Guidelines / Examples:**
- Sanitize all user-generated content before displaying it.
- Validate data received from external sources.
- Use parameterized queries for database interactions.

### Rule: Ensure Testability

**Description:** Write code in a way that makes it easy to test automatically. This includes writing modular code, using dependency injection, and avoiding tight coupling.

**Rationale:** From the "Testability" core principle. Enables robust automated testing, which is vital for ensuring the quality and reliability of "The Aesthetic."

**Applicability:** All code, with a focus on business logic and critical components.

**Guidelines / Examples:**
- Inject dependencies rather than hardcoding them.
- Keep functions pure where possible (output depends only on input).
- Design components to be easily mockable.

### Rule: Optimize for Maintainability

**Description:** Write code with future modifications, debugging, and enhancements in mind. Prioritize readability, modularity, and clear structure.

**Rationale:** Directly from the "Maintainability" core principle. Ensures the long-term health and evolution of "The Aesthetic" without incurring excessive technical debt.

**Applicability:** All code.

**Guidelines / Examples:**
- Use clear and descriptive naming.
- Keep functions and modules small and focused.
- Write comments for complex or non-obvious logic.
- Maintain consistent formatting and structure.

## Category: Code Style & Formatting

### Rule: Use Automated Code Formatting

**Description:** Employ an automated code formatter (e.g., Prettier, Black, gofmt) to enforce consistent indentation, spacing, line length, and brace style.

**Rationale:** Based on the research context's emphasis on automated formatters like Prettier and ESLint. Ensures visual consistency across the codebase, contributing to readability and reducing stylistic debates.

**Applicability:** All code files.

**Guidelines / Examples:**
- Configure the chosen formatter to adhere to project-wide settings.
- Integrate the formatter into pre-commit hooks or CI pipelines.
```json
// Example Prettier Configuration (.prettierrc.json)
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### Rule: Utilize Linting for Code Quality and Style Enforcement

**Description:** Use a linter (e.g., ESLint, Flake8, golangci-lint) to identify and flag stylistic errors, potential bugs, and anti-patterns.

**Rationale:** From the research context's recommendation of linters like ESLint. Helps catch common errors early and enforces coding standards beyond basic formatting.

**Applicability:** All code files.

**Guidelines / Examples:**
- Configure the linter with a comprehensive set of rules.
- Integrate linting into the development workflow (e.g., IDE integration, pre-commit hooks, CI).
- Address all reported linting errors before committing code.

### Rule: Limit Line Length

**Description:** Keep lines of code within a reasonable maximum length (e.g., 100-120 characters) to improve readability.

**Rationale:** A common practice for readability, supported by automated formatters. Prevents horizontal scrolling and makes code easier to scan.

**Applicability:** All code files.

**Guidelines / Examples:**
```typescript
// Good Example:
const userProfile = await userService.getUserProfile(userId, {
  includeDetails: true,
  selectFields: ['name', 'email', 'createdAt'],
});

// Bad Example:
const userProfile = await userService.getUserProfile(userId, { includeDetails: true, selectFields: ['name', 'email', 'createdAt'] });
```

## Category: Naming Conventions

### Rule: Use Clear and Descriptive Names

**Description:** Choose names for variables, functions, components, classes, and files that clearly indicate their purpose and intent.

**Rationale:** Directly from the research context's "Naming conventions." Essential for self-documenting code and making the codebase understandable.

**Applicability:** All identifiers and file names.

**Guidelines / Examples:**
```typescript
// Good Example:
let userProfileData;
function fetchUserProfile(userId: string): Promise<UserProfile>;
const UserProfileCard: React.FC<Props>;

// Bad Example:
let data;
function fetchData(id: string): Promise<any>;
const Card: React.FC;
```

### Rule: Prefer Intent-Revealing Names Over Abbreviations

**Description:** Use full, descriptive names instead of cryptic abbreviations, unless the abbreviation is universally understood and significantly improves brevity without sacrificing clarity.

**Rationale:** From the research context's "Naming conventions." Enhances readability and reduces ambiguity.

**Applicability:** All identifiers.

**Guidelines / Examples:**
```typescript
// Good Example:
const numberOfRetries = 3;
const customerAddress = '123 Main St';

// Bad Example:
const numRetries = 3;
const custAddr = '123 Main St';
```

### Rule: Maintain Naming Consistency

**Description:** Apply naming conventions consistently across the entire project. For example, use camelCase for variables and functions, PascalCase for components and classes.

**Rationale:** Reinforces the "Consistency" principle and the research context's emphasis on consistent naming.

**Applicability:** All identifiers and file names.

**Guidelines / Examples:**
- Variables and function parameters: `userName`, `calculateTotal`.
- Class names: `UserProfile`, `OrderService`.
- Component names (if applicable, e.g., React): `UserProfileCard`, `OrderSummary`.
- Constants: `MAX_ITEMS`, `DEFAULT_TIMEOUT`.

## Category: Architecture & Design Patterns

### Rule: Organize Code by Business Capability (Modular Monolith)

**Description:** Structure the application into well-defined modules, each representing a distinct business capability. Within each module, apply principles of separation of concerns (e.g., domain, application, infrastructure).

**Rationale:** Based on the research context's recommendation for a "Modular monolith" with feature-based organization and "Clean/Hexagonal principles inside each module" as a modern default. This provides strong boundaries, maintainability, and scalability.

**Applicability:** Overall project structure.

**Guidelines / Examples:**
```
src/
  modules/
    users/
      domain/       // Core business entities and rules
      application/  // Use cases, application logic, ports
      infrastructure/ // Database access, external API clients, etc.
      api/          // API endpoints, controllers for this module
    orders/
      domain/
      application/
      infrastructure/
      api/
  shared/
    kernel/       // Core shared abstractions, base classes
    utils/        // General utility functions
    errors/       // Shared error types
```

### Rule: Isolate Core Business Logic (Clean/Hexagonal Principles)

**Description:** Ensure that the core domain and application logic are independent of external concerns like databases, frameworks, and UI. Use ports and adapters to interact with the outside world.

**Rationale:** Aligns with the research context's mention of "Hexagonal / Ports and Adapters" and "Clean Architecture." This promotes testability and framework independence.

**Applicability:** Within each module (e.g., `modules/users/domain`, `modules/users/application`).

**Guidelines / Examples:**
- Define interfaces (ports) for external interactions within the `application` or `domain` layers.
- Implement these interfaces (adapters) in the `infrastructure` layer.
- Core logic should depend on abstractions (ports), not concrete implementations (adapters).

### Rule: Favor Composition Over Inheritance

**Description:** Build complex functionality by combining simpler objects (composition) rather than inheriting from base classes, where appropriate.

**Rationale:** A common design principle that promotes flexibility and reduces tight coupling, contributing to maintainability.

**Applicability:** Object-oriented design, component creation.

**Guidelines / Examples:**
```typescript
// Good Example (Composition):
class OrderProcessor {
  constructor(private paymentGateway: PaymentGateway, private notificationService: NotificationService) {}

  process(order: Order) {
    this.paymentGateway.charge(order.amount);
    this.notificationService.sendConfirmation(order.userEmail);
  }
}

// Bad Example (Inheritance - potentially problematic):
class BasicOrderProcessor { /* ... */ }
class AdvancedOrderProcessor extends BasicOrderProcessor { /* ... adds more logic */ }
// This can lead to rigid hierarchies.
```

### Rule: Use API-First Design for External Interfaces

**Description:** Define and document API contracts (e.g., OpenAPI/Swagger) before implementing the backend services or frontend clients that consume them.

**Rationale:** From the research context's "API-first architecture." Facilitates parallel development between teams and ensures clear contracts for integrations.

**Applicability:** All public-facing APIs and inter-service communication.

**Guidelines / Examples:**
- Use tools like OpenAPI Generator or Swagger Editor.
- Ensure API definitions are versioned and maintained.
- Treat API contracts as first-class citizens.

## Category: File & Project Structure

### Rule: Organize Files by Feature/Module

**Description:** Group files related to a specific feature or business capability together within a dedicated directory (e.g., `src/modules/users/`). Avoid organizing solely by technical layer (e.g., `src/controllers/`, `src/services/`).

**Rationale:** Directly from the research context's "Feature-based structure" and "Organize by business capability." Improves discoverability and makes it easier to understand and modify specific parts of the application.

**Applicability:** `src` directory and its subdirectories.

**Guidelines / Examples:**
```text
src/
  modules/
    authentication/
      components/       // UI components specific to auth
      services/         // Auth-related business logic
      hooks/            // Custom hooks for auth state
      utils/            // Auth-specific utilities
      types.ts          // Auth-related types
      index.ts          // Module entry point
    product-catalog/
      components/
      services/
      hooks/
      utils/
      types.ts
      index.ts
  shared/
    // ... shared components, utils, etc.
```

### Rule: Keep Shared Code Minimal and Well-Defined

**Description:** The `shared/` directory should contain only truly reusable code (e.g., generic utility functions, base types, common error classes). Avoid using it as a dumping ground for feature-specific code.

**Rationale:** From the research context's "Keep shared code small." Prevents the `shared/` directory from becoming a bottleneck or a source of tight coupling.

**Applicability:** `shared/` directory.

**Guidelines / Examples:**
- A generic `formatDate` utility is suitable for `shared/utils`.
- A `UserAvatar` component used across multiple modules is suitable for `shared/components`.
- Logic specific to user authentication should reside within the `authentication` module, not `shared/`.

### Rule: Avoid Circular Dependencies

**Description:** Ensure that modules or files do not create circular dependencies (e.g., Module A depends on Module B, and Module B depends on Module A).

**Rationale:** From the research context's "Avoid circular dependencies." Circular dependencies make code harder to understand, test, and refactor, and can indicate a flawed module boundary.

**Applicability:** All modules and files.

**Guidelines / Examples:**
- If circular dependencies arise, refactor to break the cycle, potentially by introducing a new shared module or moving shared logic to a higher level.
- Use dependency injection to manage relationships.

## Category: State Management

*(Note: This category is included assuming a frontend application context. Adjust or remove if not applicable.)*

### Rule: Centralize Global State Management

**Description:** Use a dedicated state management library (e.g., Redux, Zustand, Pinia) for managing application-wide state that is shared across multiple components or modules.

**Rationale:** Provides a predictable and maintainable way to handle complex global state, crucial for a polished UI.

**Applicability:** Global application state.

**Guidelines / Examples:**
- Define clear actions and reducers/mutations for state changes.
- Keep local component state for UI-specific, non-shared data.
```typescript
// Example using Zustand
import create from 'zustand';

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
}

const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
```

### Rule: Keep Component State Local When Possible

**Description:** Prefer managing state within individual components if that state is only used by that component or its direct children.

**Rationale:** Simplifies component logic and reduces unnecessary complexity in the global state.

**Applicability:** Component-level state.

**Guidelines / Examples:**
```typescript
// Good Example (Local State):
function MyComponent() {
  const [isOpen, setIsOpen] = useState(false); // State is local to MyComponent

  return <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>;
}

// Bad Example (Global State for Local Need):
// Using a global store action to toggle a local modal's visibility.
```

## Category: API Design

### Rule: Use Consistent API Response Formats

**Description:** All API endpoints should return data in a consistent format, including success and error responses.

**Rationale:** Simplifies client-side handling and provides a predictable experience for consumers of the API.

**Applicability:** All API endpoints.

**Guidelines / Examples:**
- **Success Response:**
  ```json
  {
    "status": "success",
    "data": { ... }
  }
  ```
- **Error Response:**
  ```json
  {
    "status": "error",
    "message": "Resource not found",
    "code": "NOT_FOUND",
    "details": { ... } // Optional additional error details
  }
  ```

### Rule: Implement Clear API Versioning

**Description:** Version APIs to manage changes gracefully and avoid breaking existing clients. Use URL versioning (e.g., `/api/v1/users`).

**Rationale:** Essential for evolving APIs without disrupting consumers.

**Applicability:** All public-facing APIs.

**Guidelines / Examples:**
- Use semantic versioning for API versions.
- Clearly document the lifecycle of older API versions.

### Rule: Use Standard HTTP Methods and Status Codes

**Description:** Adhere to standard HTTP methods (GET, POST, PUT, DELETE, etc.) for intended operations and use appropriate HTTP status codes to indicate the outcome of requests.

**Rationale:** Follows established web standards, making APIs intuitive and easier to integrate with.

**Applicability:** All API endpoints.

**Guidelines / Examples:**
- `GET /users` - Retrieve a list of users.
- `POST /users` - Create a new user.
- `GET /users/{id}` - Retrieve a specific user.
- `PUT /users/{id}` - Update a specific user.
- `DELETE /users/{id}` - Delete a specific user.
- Use `200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`, etc.

## Category: Error Handling & Logging

### Rule: Handle Errors Explicitly and Gracefully

**Description:** Anticipate potential errors and implement explicit error handling mechanisms. Ensure the application fails gracefully, providing informative messages to the user or logs without crashing.

**Rationale:** From the research context's "Error handling." Crucial for user experience and system stability.

**Applicability:** All operations that can fail (I/O, network requests, business logic).

**Guidelines / Examples:**
```typescript
// Good Example:
try {
  const data = await fetchData();
  renderData(data);
} catch (error) {
  console.error("Failed to fetch or render data:", error);
  showUserMessage("Could not load content. Please try again later.");
}

// Bad Example:
// Ignoring potential errors from fetchData()
```

### Rule: Log Errors with Sufficient Context

**Description:** When an error occurs, log it with enough detail (e.g., stack trace, relevant variables, user ID, request details) to facilitate debugging.

**Rationale:** Directly from the research context's "Error handling." Essential for diagnosing and resolving issues efficiently.

**Applicability:** All caught exceptions and critical operational failures.

**Guidelines / Examples:**
```javascript
// Good Example:
try {
  // ...
} catch (error) {
  logger.error('Failed to process order', {
    orderId: order.id,
    userId: currentUser.id,
    errorMessage: error.message,
    stack: error.stack,
    // other relevant context
  });
}

// Bad Example:
// logger.error('An error occurred');
```

### Rule: Avoid Swallowing Exceptions Silently

**Description:** Do not catch exceptions without either handling them appropriately, logging them, or re-throwing them.

**Rationale:** From the research context's "Error handling." Silent failures make debugging extremely difficult and can mask underlying problems.

**Applicability:** All `catch` blocks.

**Guidelines / Examples:**
```typescript
// Good Example:
try {
  // ... potentially failing operation
} catch (e) {
  // Log and potentially re-throw or return an error indicator
  console.error(e);
  throw e; // or return { error: e };
}

// Bad Example:
try {
  // ... potentially failing operation
} catch (e) {
  // Do nothing - error is swallowed
}
```

## Category: Security Practices

### Rule: Validate All Inputs

**Description:** Rigorously validate all data received from external sources, including user input, API requests, and data from third-party services.

**Rationale:** A fundamental security principle from the research context. Prevents injection attacks, data corruption, and unexpected behavior.

**Applicability:** User interfaces, API endpoints, data ingestion points.

**Guidelines / Examples:**
- Use validation libraries (e.g., Zod, Yup, Joi).
- Check data types, formats, lengths, and ranges.
- Implement server-side validation even if client-side validation exists.

### Rule: Sanitize All Outputs

**Description:** Sanitize or properly encode data before rendering it in user interfaces or sending it to other systems to prevent cross-site scripting (XSS) and other injection vulnerabilities.

**Rationale:** From the research context's "Sanitize outputs." Protects against malicious code execution in the user's browser.

**Applicability:** Rendering user-generated content, constructing responses.

**Guidelines / Examples:**
- Use appropriate encoding functions provided by your framework or templating engine.
- Be cautious when rendering HTML directly from untrusted sources.

### Rule: Securely Manage Secrets

**Description:** Never commit secrets (API keys, passwords, database credentials) directly into the codebase. Use environment variables or dedicated secret management tools.

**Rationale:** Directly from the research context's "Store secrets in environment variables or secret managers." Prevents accidental exposure of sensitive credentials.

**Applicability:** Configuration files, environment setup.

**Guidelines / Examples:**
- Use `.env` files for local development (ensure `.env` is in `.gitignore`).
- Utilize platform-specific secret management services in production (e.g., AWS Secrets Manager, HashiCorp Vault).

### Rule: Keep Dependencies Updated

**Description:** Regularly update all project dependencies (libraries, frameworks) to their latest secure versions.

**Rationale:** From the research context's "Keep dependencies updated." Addresses known security vulnerabilities in outdated packages.

**Applicability:** Dependency management.

**Guidelines / Examples:**
- Use tools like `npm audit`, `yarn audit`, or `dependabot`.
- Schedule regular dependency review and update cycles.
- Test thoroughly after updating dependencies.

## Category: Performance Optimization

### Rule: Optimize Asset Delivery

**Description:** Ensure images, fonts, and other static assets are optimized for web delivery (e.g., compressed images, appropriate formats, lazy loading).

**Rationale:** Directly from the research context's "Optimize image sizes, font loading, and asset delivery." Crucial for fast load times and a good user experience, especially for a visually focused product.

**Applicability:** Frontend assets.

**Guidelines / Examples:**
- Use modern image formats like WebP.
- Implement responsive images (`<picture>` element or `srcset`).
- Lazy load images and non-critical assets below the fold.
- Optimize font loading strategies.

### Rule: Avoid Unnecessary Re-renders and Heavy Computations

**Description:** Optimize frontend components to prevent unnecessary re-renders. Avoid computationally expensive operations on the main thread that can block the UI.

**Rationale:** From the research context's "Avoid unnecessary re-renders or heavy animations." Ensures a smooth and responsive user interface.

**Applicability:** Frontend components, JavaScript execution.

**Guidelines / Examples:**
- Use memoization techniques (e.g., `React.memo`, `useMemo`, `useCallback`).
- Offload heavy computations to web workers if necessary.
- Profile your application to identify performance bottlenecks.

### Rule: Measure Performance Regularly

**Description:** Use performance monitoring tools and techniques to measure real-world performance metrics and identify areas for improvement.

**Rationale:** Directly from the research context's "Measure real performance rather than guessing." Data-driven optimization is key.

**Applicability:** Frontend and backend performance.

**Guidelines / Examples:**
- Utilize browser developer tools (Performance tab).
- Implement Real User Monitoring (RUM) tools.
- Set performance budgets and track them in CI/CD.

## Category: Testing Standards

### Rule: Implement a Testing Pyramid Strategy

**Description:** Structure automated tests following the testing pyramid: a large base of unit tests, a middle layer of integration tests, and a small top layer of end-to-end (E2E) tests.

**Rationale:** From the research context's "Use a testing pyramid." Ensures efficient and effective test coverage.

**Applicability:** All code.

**Guidelines / Examples:**
- **Unit Tests:** Test individual functions, components, or modules in isolation. Fast and numerous.
- **Integration Tests:** Test the interaction between multiple components or modules.
- **E2E Tests:** Test critical user flows from start to finish, simulating real user interaction. Slower and fewer.

### Rule: Write Tests for Core Business Logic and Critical Flows

**Description:** Prioritize writing tests for core business logic, complex algorithms, edge cases, error states, and critical user journeys.

**Rationale:** From the research context's "What to test." Ensures the most important parts of the application are robust and reliable.

**Applicability:** Business logic, critical user paths, complex features.

**Guidelines / Examples:**
- Test happy paths and failure scenarios.
- Cover boundary conditions and invalid inputs.
- Ensure accessibility checks are integrated where possible.

### Rule: Maintain Up-to-Date Test Documentation

**Description:** Ensure tests are readable and, where necessary, include comments explaining complex test setups or assertions.

**Rationale:** Tests serve as living documentation. Clear tests make it easier to understand expected behavior and prevent regressions.

**Applicability:** All test files.

**Guidelines / Examples:**
- Use descriptive test names (e.g., `it('should return an error if the user is not authenticated')`).
- Structure tests logically (Arrange, Act, Assert).

## Category: Documentation Standards

### Rule: Write Self-Documenting Code

**Description:** Aim for code that is clear and readable through good naming, structure, and straightforward logic, minimizing the need for comments.

**Rationale:** From the research context's "Avoid commenting obvious code; aim for self-documenting code." Reduces the burden of maintaining comments and ensures documentation stays synchronized with the code.

**Applicability:** All code.

**Guidelines / Examples:**
- Use descriptive variable names like `userProfile` instead of `up`.
- Break down complex functions into smaller, well-named units.

### Rule: Document Non-Obvious Logic and Decisions

**Description:** Add comments only where they clarify business rules, edge cases, external constraints, or non-obvious implementation decisions that are not evident from the code itself.

**Rationale:** Directly from the research context's "Write comments only where they add value." Ensures comments provide genuine insight.

**Applicability:** Complex algorithms, workarounds, specific business logic implementations.

**Guidelines / Examples:**
```typescript
// Example: Explaining a business rule
// We apply a 10% discount for orders over $100, but only on weekdays.
if (order.total > 100 && !isWeekend(order.date)) {
  // ... apply discount
}

// Example: Explaining a technical decision
// Using a setTimeout here to ensure the DOM has updated before measuring element height.
// This is a workaround for a known browser rendering quirk.
setTimeout(() => {
  const height = element.offsetHeight;
  // ... use height
}, 0);
```

### Rule: Maintain Up-to-Date Architecture and Setup Documentation

**Description:** Keep documentation for project setup, architecture overview, and key design decisions current and accessible.

**Rationale:** From the research context's "Maintain up-to-date architecture and setup docs." Essential for onboarding new developers and for understanding the system's design.

**Applicability:** `README.md`, architecture decision records (ADRs), wiki pages.

**Guidelines / Examples:**
- Include instructions for setting up the development environment.
- Provide a high-level overview of the system architecture.
- Document major architectural choices and their rationale.

## Category: Dependency Management

### Rule: Minimize Dependencies

**Description:** Be judicious when adding new dependencies. Evaluate if the functionality can be achieved with existing code or a smaller, more focused library.

**Rationale:** Reduces the attack surface, potential for conflicts, and build times. Aligns with the "Simplicity" and "YAGNI" principles.

**Applicability:** Adding new libraries or packages.

**Guidelines / Examples:**
- Before adding a new library, search for built-in browser/Node.js APIs or existing project utilities.
- Prefer smaller, well-maintained libraries over large, feature-rich ones if only a subset of features is needed.

### Rule: Use Lock Files

**Description:** Always commit lock files (e.g., `package-lock.json`, `yarn.lock`, `Pipfile.lock`) to ensure reproducible builds.

**Rationale:** Guarantees that all developers and CI/CD environments use the exact same versions of dependencies, preventing "works on my machine" issues.

**Applicability:** Package management.

**Guidelines / Examples:**
- Ensure your package manager is configured to generate and update lock files.
- Add lock files to version control.

## Category: Version Control (Git Flow)

### Rule: Use a Clear Branching Strategy

**Description:** Adopt a consistent branching strategy (e.g., Gitflow, GitHub Flow) for managing feature development, releases, and hotfixes.

**Rationale:** From the research context's "Use Git with a clear branching strategy." Provides structure and predictability to the development workflow.

**Applicability:** All Git operations.

**Guidelines / Examples:**
- **Feature Branches:** Create branches for each new feature (e.g., `feature/user-profile-edit`).
- **Develop Branch:** Use a `develop` branch for ongoing integration.
- **Main Branch:** Use `main` (or `master`) for production-ready code.
- **Release Branches:** Use `release/*` branches for preparing releases.
- **Hotfix Branches:** Use `hotfix/*` branches for urgent production fixes.

### Rule: Make Small, Frequent Commits

**Description:** Commit changes frequently in small, logical units. Each commit should represent a single, complete change.

**Rationale:** Directly from the research context's "Make small, frequent commits." Makes code reviews easier, simplifies reverting changes, and provides a clearer history.

**Applicability:** All Git commits.

**Guidelines / Examples:**
- Commit after completing a small task, fixing a bug, or implementing a part of a feature.
- Avoid large commits that mix multiple unrelated changes.

### Rule: Write Meaningful Commit Messages

**Description:** Craft clear and concise commit messages that explain the *what* and *why* of the change. Follow a conventional format (e.g., Conventional Commits).

**Rationale:** From the research context's "Write meaningful commit messages." Improves the clarity of the project history and aids in automated changelog generation.

**Applicability:** All Git commits.

**Guidelines / Examples:**
- **Format:** `<type>(<scope>): <subject>`
- **Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- **Subject:** Imperative mood, concise (e.g., "Add user profile editing feature").
- **Body (optional):** Explain the motivation and context.

```
feat(auth): Implement password reset functionality

This commit introduces the backend logic and API endpoints
for users to reset their passwords via email verification.
Includes token generation, validation, and password update.
```

### Rule: Use Pull Requests and Code Reviews

**Description:** All code changes intended for integration into main branches (`develop`, `main`) must go through a Pull Request (PR) and undergo mandatory review by at least one other team member.

**Rationale:** From the research context's "Use pull requests and mandatory review for important changes." Ensures code quality, knowledge sharing, and adherence to standards.

**Applicability:** All code merges into shared branches.

**Guidelines / Examples:**
- Create PRs for all feature branches.
- Ensure PRs are well-described and link to relevant issues/tickets.
- Reviewers should check for readability, correctness, security, maintainability, and adherence to these rules.

## Category: UI Consistency & Design System

### Rule: Build and Adhere to a Design System

**Description:** Develop and utilize a comprehensive design system or component library that standardizes UI elements like colors, typography, spacing, buttons, and form controls.

**Rationale:** Directly from the research context's "Design system first." Essential for "The Aesthetic" to ensure visual consistency and a cohesive user experience.

**Applicability:** All UI development.

**Guidelines / Examples:**
- Define and use design tokens for all visual properties.
- Create reusable UI components based on the design system.
- Ensure all UI elements conform to the defined standards.

### Rule: Use Tokens for Design Consistency

**Description:** Employ design tokens (variables) for all stylistic properties (colors, typography, spacing, shadows, etc.) to ensure consistency across the application.

**Rationale:** From the research context's "Use tokens for consistency across UI." Centralizes design decisions and makes them easily updatable.

**Applicability:** CSS, styling definitions, component props.

**Guidelines / Examples:**
```css
/* Example using CSS Custom Properties */
:root {
  --color-primary: #007bff;
  --font-size-base: 16px;
  --spacing-medium: 16px;
}

.button-primary {
  background-color: var(--color-primary);
  padding: var(--spacing-medium);
  font-size: var(--font-size-base);
}
```

### Rule: Maintain Predictable Layouts and Spacing

**Description:** Ensure consistent application of layout rules and spacing between UI elements across different screens and components.

**Rationale:** Reinforces the "UI consistency" and "Preserve visual hierarchy and spacing discipline" points from the research. Contributes significantly to the aesthetic quality.

**Applicability:** All UI components and layouts.

**Guidelines / Examples:**
- Use a consistent spacing scale (e.g., multiples of 4px or 8px).
- Employ layout patterns (e.g., grid systems, flexbox) consistently.
- Avoid arbitrary pixel values for margins and paddings.

### Rule: Ensure Responsive Behavior

**Description:** Design and implement UI components to adapt gracefully to various screen sizes and devices.

**Rationale:** From the research context's "Ensure responsive behavior across screen sizes." Critical for modern web applications.

**Applicability:** All UI components.

**Guidelines / Examples:**
- Use relative units (%, vw, vh, rem, em).
- Employ media

_Generated: 5/20/2026, 1:40:50 AM_