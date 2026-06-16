# UI Design System (`src/components/ui`)

Production-grade, cross-platform UI primitives for the WooCommerce client dashboard. These
are **foundational components**, not throwaway demo widgets: they are the building blocks
every screen composes, so they are typed, themeable, accessible, and platform-safe.

## Principles & constraints

- **React Native first.** Built only from RN primitives (`View`, `Text`, `Pressable`,
  `TextInput`, `ScrollView`, `ActivityIndicator`). No raw DOM elements, no React DOM APIs,
  no CSS files, no `className`/Tailwind, no CSS variables, no web-only UI library.
- **Tokens, not hard-coded values.** All colors, spacing, radius, typography, border
  widths, elevation, and z-index come from the theme (`src/theme`). Read them via
  `useTheme()`. Add new design decisions to the tokens, not inline in components.
- **Theme & dark mode aware.** Components re-render correctly across light/dark because they
  reference semantic color roles.
- **RTL aware.** Use `rowDirection` / `directional()` from `useTheme()` (or the pure helpers
  in `src/theme/rtl.ts`) instead of hard-coded `left`/`right`.
- **Accessible by default.** Interactive components set `accessibilityRole`/state; states
  expose roles (`alert`, `progressbar`).
- **Stable import surface.** Import from `@/components/ui`, never from individual files.

## Components

| Component      | Purpose                                                                           |
| -------------- | --------------------------------------------------------------------------------- |
| `Screen`       | Page container: themed background, safe-area insets, optional scroll + padding.   |
| `Text`         | Typography primitive; `variant` (display…caption) + semantic `tone`.              |
| `Surface`      | Neutral themed panel (background/radius/border/elevation) without a header.       |
| `Card`         | Elevated surface with optional title + header action. Built for widgets/lists.    |
| `Button`       | `Pressable` wrapper; `primary`/`secondary`/`ghost`, sizes, loading, leading icon. |
| `Badge`        | Compact status pill mapping a `tone` to soft bg + solid fg.                       |
| `Divider`      | Hairline separator, horizontal or vertical.                                       |
| `DataList<T>`  | Lightweight table-like list from typed columns (small embedded lists).            |
| `Input`        | Themed `TextInput` with focus/invalid states; RTL-aware caret/alignment.          |
| `FieldLabel`   | Accessible field label with optional required marker.                             |
| `FormField`    | Label + control + help/error text; does not own form state.                       |
| `LoadingState` | Centered spinner + optional label (standard loading UI).                          |
| `EmptyState`   | Icon + title + body + optional action (standard empty UI).                        |
| `ErrorState`   | Icon + title + body + optional retry action (standard error UI).                  |

## Usage examples

```tsx
import { Card, Button, Badge, FormField, Input, EmptyState } from '@/components/ui';

<Card title="Recent orders" headerAction={<Badge tone="success" label="Live" />}>
  {/* ...content... */}
</Card>

<FormField label="Store URL" required help="The public site address">
  <Input placeholder="https://store.example.com" autoCapitalize="none" keyboardType="url" />
</FormField>

<EmptyState
  title="No orders yet"
  body="Orders will appear here once your store starts selling."
  action={{ label: 'Refresh', onPress: refetch }}
/>
```

## Theming API (`src/theme`)

```ts
const {
  tokens,
  mode,
  direction,
  isRTL,
  toggleMode,
  toggleDirection,
  rowDirection,
  directional,
  shadow,
} = useTheme();
```

- `tokens` — `color`, `spacing`, `radius`, `borderWidth`, `typography`, `elevation`,
  `zIndex`, `shadowColor`.
- `shadow(level)` — platform-correct elevation style (`'none' | 'sm' | 'md' | 'lg'`).
- `directional(ltrValue, rtlValue)` — pick a value based on the active direction.

> Mode/direction persistence is intentionally a TODO: it needs a cross-platform storage
> layer (AsyncStorage / expo-secure-store). We never use `localStorage`.

## Testing

Tests live under `src/**/__tests__` and run with `jest-expo` +
`@testing-library/react-native` (`npm test` in `apps/client`). Wrap components that call
`useTheme()` in a `ThemeProvider` (see `src/test/renderWithProviders.tsx`).
