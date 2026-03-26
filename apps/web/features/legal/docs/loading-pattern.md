# Legal Feature: Loading Patterns & Architecture

This document explains the architectural decisions and UI patterns used in the `features/legal` module.

## 🏗️ Architecture: Feature-Based Co-location

Following the project's DNA, all legal-related resources are co-located within `apps/web/features/legal`:

- **`/api`**: Contains `legalApi` using the centralized `apiGet`/`apiPost` utilities.
- **`/hooks`**: Contains `useConsentStatus` and `useAnonymousId` for managing legal state.
- **`/components`**: Contains UI components like `ConsentModal`, `CookieBanner`, and `PolicySkeleton`.
- **`/docs`**: Architectural and pattern documentation.

This organization ensures that features are self-contained and easy to maintain.

## 🦴 Loading Pattern: Skeletons

To provide a stable and premium user experience, we use **Skeleton** components instead of generic spinners.

### Why Skeletons?
1. **Layout Stability**: Prevents layout shifts by occupying the same space as the eventual content.
2. **Perceived Performance**: Users feel the app is faster as they see the immediate "shape" of the page.
3. **Design Consistency**: Skeletons match the typography and layout of the real content.

### Implementation: `PolicySkeleton`
The `PolicySkeleton` component mimics the structure of a legal document (Title, Date, and multiple sections with headings and paragraphs).

```tsx
// Usage in policy pages
if (isLoading) {
  return <PolicySkeleton />;
}
```

### Best Practices
- **Match the Layout**: Ensure the skeleton's max-width and padding match the `article` container.
- **Micro-animations**: Use the built-in `animate-pulse` from the design system's `Skeleton` primitive.
- **Fade-in Transitions**: Use `animate-in fade-in` classes for a smooth transition from skeleton to content.
