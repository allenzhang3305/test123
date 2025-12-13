---
description: Run type checking and linting for the project
---

1. **Fast Check (Recommended)**
   Run the fast type checker (oxlint) for quick feedback during development.
   // turbo
   ```bash
   pnpm typecheck:fast
   ```

2. **Full Check (CI/Final Verification)**
   Run the full TypeScript compiler check (tsc) before committing or deploying to ensure complete type safety.
   ```bash
   pnpm typecheck
   ```

3. **Fix Issues**
   If errors are reported:
   - For `oxlint` errors, fix them immediately.
   - For `tsc` errors, address type mismatches or missing properties.
