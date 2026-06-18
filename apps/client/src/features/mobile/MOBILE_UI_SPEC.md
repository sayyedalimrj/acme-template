# Mobile UI & Motion Spec (client dashboard)

A small, local spec that anchors the customer-facing mobile dashboard. It captures the
dimensions and motion tokens used by `mobileTokens.ts` and `motion.ts`, grounded in official
mobile guidance. This is design direction for the merchant client app only — it does not touch
the global theme or any other app.

## Research basis (official sources)

- **Tap targets:** Apple Human Interface Guidelines recommend a minimum **44×44 pt** hit area
  ([Apple — UI Design Dos and Don'ts](https://developer.apple.com/design/tips/)); Material
  Design recommends a minimum **48×48 dp** touch target. We use **48dp** for primary targets
  and never go below 44.
- **Motion duration/easing:** Material motion guidance puts small transitions at ~**150–200ms**
  and uses standard/decelerate easing; Material's `medium` durations sit around **300–350ms**
  ([Material — Duration & easing](https://material.io/archive/guidelines/motion/duration-easing.html),
  [Flutter Durations.medium3 = 350ms](https://api.flutter.dev/flutter/material/Durations/medium3-constant.html)).
  Entrances **decelerate** (ease-out); exits **accelerate**.
- **Animation tech:** React Native `Animated` + `LayoutAnimation` + `Pressable` feedback only.
  Reanimated is not installed in this app, so it is intentionally not used (no heavy deps).

_Content was rephrased for compliance with licensing restrictions._

## Dimensions (see `mobileTokens.ts` → `mobileMetrics`)

| Token             | Value     | Notes                                         |
| ----------------- | --------- | --------------------------------------------- |
| design width      | 390–430   | Mobile-first target.                          |
| frame max width   | 440       | Desktop centers this frame (no wide stretch). |
| frame radius      | 34        | Centered desktop preview only.                |
| screen padding    | 26        | Horizontal page padding.                      |
| header height     | 54        | Top header row.                               |
| hero card height  | 214       | Dark hero / site card.                        |
| quick action card | 100×122   | 4-up quick actions.                           |
| service tile      | 70        | Feature icon tiles.                           |
| list row height   | 76        | Activity / list rows.                         |
| bottom nav height | 64 + safe | Plus bottom safe-area inset.                  |
| min tap target    | 48        | Never below 44 (HIG).                         |
| body text min     | 13–15     | Avoid text below ~12–13.                      |

## Motion (see `motion.ts`)

| Token               | Value             | Use                                               |
| ------------------- | ----------------- | ------------------------------------------------- |
| `motion.fast`       | 140ms             | Press feedback, tab indicator, small fades.       |
| `motion.normal`     | 220ms             | Card/section entrance, standard transitions.      |
| `motion.slow`       | 320ms             | Larger/emphasized transitions, expand.            |
| `motion.pressScale` | 0.97              | Press scale for cards/buttons (`PressableScale`). |
| `cardEnter`         | fade + ↑12px      | `AnimatedSection` mount.                          |
| `routeEnter`        | subtle slide/fade | Expo Router stack defaults where supported.       |
| `badgePulse`        | tiny, optional    | Unread badge only (subtle).                       |
| `tabSwitch`         | opacity/translate | Bottom-nav active state (fast).                   |
| `expand`            | height/opacity    | `LayoutAnimation` for More/details.               |
| easing.decelerate   | ease-out cubic    | Entrances.                                        |
| easing.accelerate   | ease-in cubic     | Exits.                                            |

## Rules

- **Press feedback:** every primary tappable surface scales to `pressScale` on press-in and
  returns on release; disabled/reduced-motion skips the scale.
- **Reduced motion:** `useReducedMotion()` (RN `AccessibilityInfo`) collapses all animations to
  instant when the OS setting is on.
- **Page transitions:** rely on Expo Router stack defaults; keep them subtle (slide/fade).
- **Restraint:** motion should make the app feel soft and alive — never flashy. Prefer short
  durations and gentle easing.
