# ADR 0003: Use contextual skeletons for route loading

## Status

Accepted

## Context

Several BeachRank screens load server-side or client-side data before content is ready.

When the user taps a link and remains on the previous screen with only a global loading bar, the interaction can feel delayed or broken.

The product should feel immediate on mobile.

## Decision

For navigation between screens, BeachRank should prefer destination-context loading states.

The route should transition to the destination context immediately, and the destination should render a skeleton that resembles the final layout.

Use `loading.tsx` for Next.js route-level loading when server-rendered route data can delay navigation.

Use feature-level skeletons for client-loaded feature data.

The global top loading indicator remains useful as secondary feedback, but should not be the main loading experience when a contextual skeleton is possible.

## Consequences

### Positive

- Taps feel acknowledged immediately.
- Users see that they reached the intended destination.
- Loading states feel more polished and less technical.
- Layout shift is reduced when skeletons match final content.

### Negative

- More route/feature-specific skeletons may need to be designed.
- Skeletons require maintenance when screen layouts change.
- Poorly matched skeletons can become misleading.

## Implementation notes

A good skeleton should:

- resemble the destination screen;
- use muted animated blocks;
- avoid visible technical text when possible;
- include accessible `sr-only` loading text;
- avoid flashing protected content before access checks finish.

## Alternatives considered

### Global progress bar only

Rejected as the only pattern because it can make the UI feel stuck on the previous screen.

### Text-only loading states

Rejected for primary screen loading because text-only states feel less polished and do not communicate destination context.
