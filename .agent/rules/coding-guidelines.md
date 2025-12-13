# MRL Product Combo Manager - Coding Guidelines

## Project Structure

### Component Organization
Components live in `src/components/` organized by domain:
```
src/components/
├── ui/         # Reusable primitives (buttons, cells, containers)
├── upload/     # File upload components
├── product/    # Product-related (cards, images, visualization)
├── layout/     # App layout (sidebar, main content)
└── crosssell/  # Crosssell feature components
```

- **Existing feature**: Add to existing domain folder
- **New feature**: Create new domain folder only if it's a distinct feature area
- Each domain **MUST** have an `index.ts` barrel export

### Page Structure
Pages with significant logic use co-located folders:
```
src/app/[page]/
├── page.tsx              # ~150-200 lines max, orchestrator only
├── _components/          # Page-specific components
│   └── index.ts          # Barrel export
└── _hooks/               # Page-specific hooks
```

---

## Code Extraction Rules

### When to Extract
| Condition | Action |
|-----------|--------|
| Page component > 200 lines | Extract logic to `_hooks/use[Page]Page.ts` |
| Component > 300 lines | Split into sub-components |
| Component with 3+ modals | Extract modals to separate files |
| Function used in 2+ files | Extract to `lib/client/services/` or `lib/client/utils/` |
| API call logic | Wrap in service file |

### Services vs Utils
- **Services** (`lib/client/services/`): API calls, data fetching, external integrations
- **Utils** (`lib/client/utils/`): Pure functions, parsers, formatters

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | `PascalCase.tsx` | `ProductRowCard.tsx` |
| Hooks | `camelCase.ts` with `use` prefix | `useEditComboPage.ts` |
| Services | `kebab-case-service.ts` | `csv-export-service.ts` |
| Utils | `kebab-case.ts` | `js-parser.ts` |

---

## Import Style

Use **barrel exports** for cleaner imports:
```typescript
// ✅ Preferred
import { CopyableCell, SortButton } from "@/components/ui";

// ❌ Avoid (only if necessary for tree-shaking)
import { CopyableCell } from "@/components/ui/CopyableCell";
```

---

## Language Guidelines

| Context | Language |
|---------|----------|
| User-facing labels, buttons, modals | **Chinese (Traditional)** |
| Code, comments, variable names | **English** |
| Error messages shown to users | **Chinese** |
| Console logs, debug messages | **English** |

---

## Testing Requirements

### Required E2E Tests (Playwright)
- Services (`lib/client/services/`)
- Utils (`lib/client/utils/`)
- Critical user workflows (import, export, sync)

### NOT Required
- Layout components
- Pure UI components
- Simple page navigation

Run tests: `pnpm test:e2e`

---

## TypeScript Guidelines

- All functions **MUST** have explicit return types
- Use `interface` for component props
- Use `type` for unions and utility types
- Avoid `any` - use `unknown` if type is uncertain
