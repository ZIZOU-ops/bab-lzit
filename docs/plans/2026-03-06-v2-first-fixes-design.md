# V2 First Fixes - Design Document

**Date:** 2026-03-06
**Branch:** v2
**Status:** Approved

## Context

V2 fixes for the Babloo mobile app targeting 6 user-reported issues grouped into 5 themes.

## Themes & Priority

### A: Fix Auth Case Sensitivity (P1, Low effort)
- Input component missing `autoCapitalize` prop forwarding
- API does case-sensitive email lookup
- Fix: `autoCapitalize="none"` on email inputs + lowercase normalization in API
- Files: `Input.tsx`, `SignInEmailScreen.tsx`, `SignUpEmailScreen.tsx`, `ForgotPasswordScreen.tsx`, `auth.service.ts`

### B: Pro Accept Flow (P1, Medium effort)
- SearchScreen needs realistic wait animation for pro acceptance
- OffersScreen "Accepter" button navigates to chat without backend confirmation
- Missing push notification when pro accepts
- Fix: Backend confirm mutation + improved search UX + push notification
- Files: `SearchScreen.tsx`, `OffersScreen.tsx`, `proAssignment` mutations/routes, `notification.service.ts`

### C: Chat Agreement + Realistic Tracking (P1, High effort)
- No system message on price agreement, no "Continue to tracking" button
- StatusTrackingScreen uses hardcoded mock data
- No home page tracking banner
- Fix: System messages in chat, refactored tracking with real StatusEvents, demo simulation service (~2min per step), home banner
- Architecture: extensible for future GPS replacement
- Files: `ChatScreen.tsx`, `StatusTrackingScreen.tsx`, `HomeScreen`, `order.service.ts`, new `simulation.service.ts`

### D: Pro History with Ratings (P2, Low effort)
- ProOrderDetailScreen doesn't show client rating/comment/tip
- Fix: Extend API query + UI display
- Files: `ProOrderDetailScreen.tsx`, pro order queries

### E: Premium Icons (P2, Medium effort)
- Current SVG icons are basic, inconsistent sizes
- Fix: Lucide for generic icons + custom SVG for services (menage/cuisine/childcare)
- Standardized sizes: 24px nav, 20px actions, 32px services
- Files: `icons.tsx`, `package.json`, all icon imports

### F: Enriched Notifications (P3, Medium effort)
- Push payloads lack detail (status, pro name, ETA)
- Fix: Richer payloads, structured for future Live Activity/Dynamic Island
- Files: `notification.service.ts`, `notifications.ts`

## Branch Strategy

```
v2
  v2/fix-auth-case-sensitivity    (Theme A)
  v2/pro-accept-flow              (Theme B)
  v2/chat-agreement-tracking      (Theme C)
  v2/pro-history-rating           (Theme D)
  v2/icons-premium                (Theme E)
  v2/enriched-notifications       (Theme F)
```

Execution order: A -> B -> C -> D -> E -> F

## Decisions
- Tracking: Demo simulation with ~2min delays, extensible architecture for future GPS
- Dynamic Island / Live Activity: Deferred to V2.1
- Icons: Mix approach (Lucide for generic + custom SVG for services)
- Pro accept flow: Accept -> Chat opens -> "Propose a price" UI -> Client accepts/negotiates
