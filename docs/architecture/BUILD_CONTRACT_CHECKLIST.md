# GridPass.App

## BUILD_CONTRACT_CHECKLIST.md

### How the IDE must build GridPass (Tables → RLS → API → Tests → UI)

---

## 0) Operating Rules (Read First)

### Non-Negotiables

1. **API-first**: build `/api/v1/*` endpoints before UI
2. **RLS-first**: no table ships without RLS policies + at least 2 tests
3. **Domain boundaries**: each endpoint belongs to exactly one domain
4. **No assumptions**: if a business rule is unclear, log a TODO, don’t invent behavior
5. **Auditability**: inserts/updates must record `created_at`, `updated_at`, `created_by` where applicable

### Definition of “Done” for any module

✅ Table(s) exist
✅ RLS policies exist
✅ Minimal indexes exist
✅ API routes exist (GET/POST at minimum)
✅ API returns standardized envelope
✅ Tests exist (RLS + endpoint happy-path)
✅ Visible in `/admin/api` playground

---

## 1) Global Standards

### Standard columns (most tables)

* `id uuid primary key default gen_random_uuid()`
* `created_at timestamptz default now()`
* `updated_at timestamptz default now()`
* `created_by uuid null` (references auth.users when needed)
* `archived_at timestamptz null`

### RLS policy patterns

* **Owner read/write**: `auth.uid() = owner_user_id`
* **Org member read/write**: membership join
* **Admin override**: `exists(select 1 from user_admin where user_id=auth.uid())` (or equivalent)

### API response envelope

```json
{ "success": true, "data": <any>, "meta": { } }
```

---

## 2) Build Order (DO NOT REORDER)

This order matches “2026 system of record” capture:

### Tier A — Backbone (must be rock solid)

1. **Roles**
2. **Credentials**
3. **Tracks**
4. **Events + EventRequirements**
5. **CheckIns + Verification**
6. **Org Memberships + Invites** (if not complete already)

### Tier B — Supporting Modules

7. Wallet (Documents + Sharing)
8. Tasks (User/Org/Event scoped)

### Tier C — Later Modules

9. Listings
10. Trips
11. Jobs/Resumes
12. Inventory
13. Messaging/Notifications

---

## 3) Module Contracts (Tables → RLS → API → Tests)

Below are the **exact marching orders** for the IDE.

---

# MODULE 1 — ROLES (Season scoped) **[MVP-2026]**

## Tables

### `roles`

Fields:

* `id`
* `user_id uuid not null`
* `season_year int not null`
* `role_type text not null` (enum-like: driver/crew/engineer/manager/official/media)
* `verified bool default false`
* `verified_by uuid null`
* `verified_at timestamptz null`

Indexes:

* `(user_id, season_year)`
* `(season_year, role_type)`

## RLS Policies

* User can **select** their own roles
* User can **insert** roles for themselves
* User can **update** their own roles only if `verified=false`
* Admin/staff can **verify** roles

## API

* `GET /api/v1/roles?season_year=`
* `POST /api/v1/roles`
* `POST /api/v1/roles/{id}/verify` (admin/staff)

## Tests

1. User A cannot read User B roles
2. User can create role for self
3. User cannot edit after verified
4. Admin can verify

---

# MODULE 2 — CREDENTIALS **[MVP-2026]**

## Tables

### `credentials`

Fields:

* `id`
* `user_id`
* `season_year int`
* `credential_type text` (license/waiver/badge/insurance)
* `issuer text`
* `scope text` (global/season/event)
* `event_id uuid null`
* `issued_at timestamptz default now()`
* `expires_at timestamptz null`
* `verification_status text` (pending/verified/expired)
* `verified_by uuid null`
* `verified_at timestamptz null`

Indexes:

* `(user_id, season_year)`
* `(event_id)`
* `(verification_status)`

## RLS

* User can read own credentials
* User can create own credentials (status=pending)
* Only staff/admin can set verified status
* Credential tied to event must be readable by event staff (scoped, not full doc contents)

## API

* `GET /api/v1/credentials?season_year=`
* `POST /api/v1/credentials`
* `POST /api/v1/credentials/{id}/verify`

## Tests

* Ownership read
* Staff verify
* Event-scoped access works as designed

---

# MODULE 3 — TRACKS **[MVP-2026]**

## Tables

### `tracks`

Fields:

* `id`
* `name text`
* `location text`
* `country text`
* `timezone text`
* `active bool default true`

Indexes:

* `(name)`
* `(active)`

## RLS

* Public read (select) allowed
* Create/update restricted to admin

## API

* `GET /api/v1/tracks`
* `POST /api/v1/tracks` (admin)
* `PUT /api/v1/tracks/{id}` (admin)

## Tests

* Public can list tracks
* Non-admin cannot create/update

---

# MODULE 4 — EVENTS + REQUIREMENTS **[MVP-2026]**

## Tables

### `events`

Fields:

* `id`
* `name text`
* `track_id uuid`
* `season_year int`
* `series text`
* `start_date date`
* `end_date date`
* `status text` (scheduled/live/completed/canceled)

Indexes:

* `(season_year)`
* `(track_id, start_date)`

### `event_requirements`

Fields:

* `id`
* `event_id uuid`
* `required_credential_type text` (waiver/license)
* `role_scope text` (all/driver/crew/official)

Index:

* `(event_id)`

## RLS

* Public read for events (or authenticated-only if you prefer)
* Only org/promoter/admin can create events (use org membership)
* Requirements: read allowed, write restricted to event owner org/admin

## API

* `GET /api/v1/events?season_year=&track_id=&series=`
* `POST /api/v1/events`
* `PUT /api/v1/events/{id}`
* `GET /api/v1/events/{id}/requirements`
* `POST /api/v1/events/{id}/requirements`
* `DELETE /api/v1/events/{id}/requirements/{reqId}`

## Tests

* Event list works
* Only allowed creators can create
* Requirements enforce permission

---

# MODULE 5 — CHECKINS + VERIFICATION (The Lock-In) **[MVP-2026]**

## Tables

### `checkins`

Fields:

* `id`
* `user_id uuid`
* `event_id uuid`
* `role_id uuid`
* `vehicle_id uuid null`
* `check_in_method text` (qr/nfc/manual)
* `checked_in_at timestamptz default now()`
* `verified bool default false`
* `verified_by uuid null`
* `verified_at timestamptz null`
* `voided_at timestamptz null`
* `void_reason text null`

Indexes:

* `(event_id)`
* `(user_id, event_id)`
* `(verified)`

## RLS

* User can read own checkins
* User can create checkin for self ONLY if event is active/scheduled
* Event staff/admin can verify
* Prevent edits after verification (only void via staff)

## API

* `GET /api/v1/checkins?event_id=&user_id=`
* `POST /api/v1/checkins`
* `POST /api/v1/checkins/{id}/verify`
* `POST /api/v1/checkins/{id}/void`

## Tests

* User cannot check-in another user
* User can check-in self
* Staff can verify
* Verified record immutable

---

# MODULE 6 — ORG MEMBERSHIPS + INVITES **[MVP-2026]**

(Only include if your org system doesn’t already have it.)

## Tables

* `org_memberships`
* `org_invites`

## API

* `POST /api/v1/orgs/{id}/invites`
* `POST /api/v1/orgs/{id}/invites/{inviteId}/accept`
* `GET /api/v1/orgs/{id}/members`

## Tests

* Only org admins can invite
* Accepted invite creates membership

---

# MODULE 7 — WALLET (Documents + sharing) **[PHASE2]**

## Tables

* `documents`
* `document_shares`

## Core rule

Docs are private by default; sharing is explicit and scoped.

---

# MODULE 8 — TASKS (User/Org/Event) **[PHASE2]**

## Tables

* `task_lists`
* `tasks`
* `task_assignments`

---

## 4) IDE Work Pattern (How to execute each module)

For each module, the IDE must output:

1. `migration.sql` (tables + indexes)
2. `rls.sql` (RLS policies)
3. `api/*.ts` routes (Next.js handlers)
4. `tests/*.spec.ts` (RLS + API)
5. Register endpoints in `/admin/api` nav

**No step skipped.**

---

## 5) “All APIs” Without Breaking Focus

We will create endpoint shells for all future modules (Trips, Listings, Jobs, etc.) but with:

* `501 Not Implemented` or
* returning `{success:true, data:null, meta:{status:"planned"}}`

This makes the IDE aware of existence without pretending behavior.

---

## 6) Immediate Next Task for the IDE

Given your current status (Auth/Users/Vehicles/Orgs working), the IDE should implement next:

1. `roles` module
2. `credentials` module
3. `tracks` module
4. `events` + `event_requirements`
5. `checkins` module

Then we revisit Wallet/Tasks.
