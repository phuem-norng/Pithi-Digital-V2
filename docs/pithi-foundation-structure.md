# Pithi Digital — Core Foundation (Phase 1)

## Finalized Prisma Domain

- `User`: authentication + ownership (`USER` / `ADMIN`)
- `EventType`: master catalog for ceremony categories (slug + icon)
- `Template`: bound to one `EventType` for strict filtering
- `Event`: stores selected `eventTypeId`, `templateId`, and unique `slug` for public page
- `Guest`: RSVP-centric with counts and table assignment

## Backend Structure (NestJS)

- `backend/src/event-types`
  - EventType CRUD, seed endpoints, icon/slug validation
- `backend/src/templates`
  - Template CRUD, filter by `eventTypeId`, config JSON validation
- `backend/src/events`
  - Event creation flow, slug generation, template-eventType compatibility check
- `backend/src/public-invitations`
  - Public fetch by slug (`/v/:slug`) and optimized payload
- `backend/src/rsvp`
  - Public RSVP submit endpoint and dashboard synchronization hooks
- `backend/src/admin`
  - Admin-only orchestration endpoints (analytics + global controls)
- `backend/src/common/utils`
  - `slug.util.ts`, validation helpers, Khmer-safe text helpers

## Frontend Structure (Next.js App Router)

- `frontend/app/onboarding/select-event-type`
  - Khmer-first event type selection grid with icons
- `frontend/app/onboarding/templates`
  - Template picker filtered by selected `eventTypeId`
- `frontend/app/onboarding/create/details`
- `frontend/app/onboarding/create/location`
- `frontend/app/onboarding/create/media`
  - Multi-step event creator
- `frontend/app/v/[slug]`
  - Public invitation page rendered from template config JSON
- `frontend/app/v/[slug]/rsvp`
  - Public RSVP form (mobile-first)
- `frontend/app/admin/event-types`
  - Manage event type master data
- `frontend/app/admin/templates`
  - Upload + bind templates to event type
- `frontend/components/invitations`
  - Dynamic template renderers and blocks

## Next Implementation Slice

1. Implement `slug.util.ts` and enforce unique slug on event create.
2. Build template filter service (`eventTypeId -> templates[]`).
3. Expose public invitation by slug with RSVP endpoint.
4. Connect admin template/event-type pages to backend.
