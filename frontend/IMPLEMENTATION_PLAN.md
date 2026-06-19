# SOC Frontend Implementation Plan

## Goal
Create a polished, recruiter-friendly SOC dashboard experience in the existing Next.js frontend, while shifting the visual system from the current dark shell to a lighter, cleaner "lightish" theme.

## Design Direction
- Use a soft light background with subtle blue-gray surfaces instead of black/dark panels.
- Keep security accents vivid (blue, amber, red, green) so the UI still feels high-trust and threat-focused.
- Preserve the current route structure and component architecture, but elevate the visual hierarchy and page composition.

## Phase 1 — Design System Refresh
1. Update the global theme tokens in [frontend/app/globals.css](frontend/app/globals.css).
2. Replace the dark canvas/surface colors with lighter backgrounds and slightly stronger borders.
3. Keep the accent palette and severity colors intact, but soften the surrounding surfaces.
4. Adjust text contrast so the UI remains readable on light backgrounds.

## Phase 2 — Shell and Navigation Polish
1. Refine the top bar layout to feel more premium and less utilitarian.
2. Improve the sidebar with clearer section grouping and active-state behavior.
3. Standardize card, button, badge, and input styles across the app.
4. Introduce a more consistent spacing and container rhythm.

## Phase 3 — Dashboard Experience
1. Rework the dashboard into a more executive-style SOC overview.
2. Improve the security score card, alert summary cards, and trend visuals.
3. Upgrade the threat timeline and attack-source map into more polished, presentation-ready components.
4. Add a clearer AI insights panel with concise recommendations.

## Phase 4 — Core Operations Pages
1. Upgrade the incidents page into a more modern triage experience with stronger table design and filters.
2. Elevate the incident details experience into a case-file style layout with timeline, evidence, and report sections.
3. Improve the threat monitoring page into a live operations center with more visual hierarchy.
4. Build a richer investigation center experience with a clearer attack-path visualization structure.

## Phase 5 — Advanced SOC Pages
1. Create a visually stronger AI agents page with workflow visuals and per-agent status cards.
2. Improve the threat intelligence page with a more structured matrix and feed layout.
3. Refine the log explorer into a more Splunk-like experience with stronger table and filtering affordances.

## Component Strategy
Introduce reusable building blocks where appropriate:
- MetricCard
- StatusBadge
- SectionHeader
- InsightPanel
- TimelineCard
- AgentStatusCard
- FilterBar
- DataTable

## Implementation Notes
- Keep the existing routes and content model intact.
- Favor lightweight, maintainable CSS rather than introducing a large charting dependency too early.
- Prioritize the dashboard and incidents experience first because they are the most visible and recruiter-impactful.
- Validate the UI after each phase with lint/build checks.

## Delivery Order
1. Theme refresh
2. Dashboard polish
3. Incidents and monitoring polish
4. Investigation and AI agent pages
5. Intelligence and log explorer polish
