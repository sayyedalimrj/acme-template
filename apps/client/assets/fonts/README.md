# Persian fonts

## IRANYekanX (preferred)

IRANYekanX is a licensed font from [fontiran.com](https://fontiran.com/fonts/iranyekan).
Place your licensed `.ttf` files here, then enable them in `src/theme/fonts.ts`:

1. Add files such as `IRANYekanX-Regular.ttf`, `IRANYekanX-Bold.ttf`, …
2. Set `USE_IRANYEKANX = true` and wire the `require()` entries in `appFontMap`.

Until those files are added, the app bundles **Vazirmatn** (OFL) via `@expo-google-fonts/vazirmatn`.
