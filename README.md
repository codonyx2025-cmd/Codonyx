
# Codonyx

<p align="center">
  <img src="public/favicon.png" alt="Codonyx Logo" width="120" />
</p>

Codonyx is a curated global network that connects **Expert Advisors**, **Laboratories**, and **Distribution Partners** across molecular science, biotech, AI healthcare, and life sciences. The platform is a private, admin-approved ecosystem where verified professionals collaborate, publish work, and run a dual-currency marketplace for distribution deals.

Live: <https://codonyx.org>

---

## Table of Contents

1. [Overview](#overview)
2. [Core Features](#core-features)
3. [User Roles & Access Model](#user-roles--access-model)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [Backend (Lovable Cloud / Supabase)](#backend-lovable-cloud--supabase)
7. [Edge Functions](#edge-functions)
8. [Storage Buckets](#storage-buckets)
9. [Authentication Flow](#authentication-flow)
10. [Notifications](#notifications)
11. [Security & Validation](#security--validation)
12. [Design System](#design-system)
13. [Local Development](#local-development)
14. [Environment Variables](#environment-variables)
15. [Deployment](#deployment)

---

## Overview

Codonyx is a React SPA backed by Lovable Cloud (Supabase). Every account is invitation- or application-based: users apply through a role-specific registration form, and only after an admin approves them can they browse the network, connect with peers, publish work, or participate in the distribution marketplace.

The platform intentionally hides a role-based directory: distributors see advisors and labs, advisors and labs see each other and distributors, and admin accounts are never exposed in public listings.

## Core Features

- **Role-specific registration** for Advisors, Laboratories, and Distribution Partners with OTP email verification, admin approval queue, and terms-and-conditions gating.
- **Reciprocal profile visibility** — no direct role browsing; access is enforced at the page level so pasting a `/profile/:id` URL from a forbidden role shows an error page.
- **Connection request system** — LinkedIn-style connect/accept, three-week cooldowns after declines, and email notifications.
- **Publications & Work** — advisors and labs upload publications (Published Paper, Presentation, Report, Thesis, Article, Patent, Other) with dedicated detail pages and external-link support.
- **Distributor marketplace** — dual-currency (INR / USD) deals and bids with strict currency-match validation and admin moderation.
- **Admin dashboard** — pending users, deals, bids, custom profile fields, keyword suggestions, banner images, and invite-link tokens.
- **Realtime notifications** — Supabase Realtime powers an in-app bell with unread badges; admins are notified when a new user registers.
- **Onboarding tour** — first-login 5-step guided tour, persisted in `localStorage`.
- **SEO & social** — square favicons, Open Graph, Twitter card, and JSON-LD organization schema.

## User Roles & Access Model

| Role | Registration | Can browse |
|---|---|---|
| **Admin** | Invite only | Everything, including admin profiles |
| **Advisor** | `/register` (admin approval) | Distributors + Laboratories (not other advisors) |
| **Laboratory** | `/register-laboratory` (admin approval) | Distributors + Advisors (not other labs) |
| **Distributor** | `/register-distributor` (admin approval) | Advisors + Laboratories |

Admin emails (`dashriday856@gmail.com`, `info@codonyx.org`) are filtered out of every public listing and search result.

## Tech Stack

- **Framework:** React 18 + Vite 5 + TypeScript 5
- **Styling:** Tailwind CSS v3 with shadcn/ui components
- **Fonts:** Poppins (display) + Inter (body)
- **Routing:** React Router v6 with route-level code splitting
- **State/Data:** TanStack Query (5-minute `staleTime`, parallel queries)
- **Backend:** Lovable Cloud (Supabase — Postgres + Auth + Storage + Edge Functions + Realtime)
- **Email:** Resend (transactional + auth email templates)
- **Hosting:** Lovable / Render, custom domain `codonyx.org`

## Project Structure

```
src/
├── assets/                  Logos, illustrations
├── components/
│   ├── admin/               Admin dashboard widgets
│   ├── advisors/            Advisor cards & filters
│   ├── connections/         Connect button, connections list
│   ├── home/                Landing sections
│   ├── laboratories/        Lab cards
│   ├── layout/              Navbar, Footer, DashboardNavbar
│   ├── mobile/              Mobile bottom navigation
│   ├── notifications/       Notification bell
│   ├── onboarding/          Guided tour
│   ├── profile/             Profile editor sections
│   ├── publications/        Publication cards / dialogs
│   ├── registration/        Shared registration inputs
│   └── ui/                  shadcn primitives
├── hooks/                   Custom React hooks (auth, notifications, etc.)
├── integrations/supabase/   Auto-generated client & types (DO NOT EDIT)
├── lib/                     Utilities (auth, uploads, notifyAdmins, ...)
└── pages/                   Route components
supabase/
├── config.toml              Auto-managed
└── functions/               Edge functions (see below)
```

## Backend (Lovable Cloud / Supabase)

Key tables (all in the `public` schema, all with RLS enabled and explicit GRANTs):

- `profiles` — one row per user, includes `user_type`, `approval_status`, contact info, bio, avatar, LinkedIn, and role-specific fields (research areas, services, distribution capacity, etc.).
- `user_roles` — separate table with an `app_role` enum (`admin`, `moderator`, `user`); admin checks go through a `SECURITY DEFINER` `has_role()` function to avoid recursive RLS.
- `connections` — connection requests, statuses, cooldown timestamps.
- `notifications` — in-app notifications with realtime channel.
- `publications` — advisor/lab publications with file attachments and external links.
- `deals` / `bids` — distributor marketplace with dual-currency support.
- `custom_fields` / `keyword_suggestions` — admin-managed dynamic profile fields and typeahead keywords.
- `banner_images` — homepage/marketing imagery managed by admins.
- `invite_tokens` — one-time admin invite links.
- `email_verification_codes` / `password_reset_otps` — short-lived OTPs, cleaned up by a scheduled edge function.

## Edge Functions

Located in `supabase/functions/`:

- `send-verification-code` — issues signup email OTPs.
- `reset-password-otp` — issues password-reset OTPs.
- `send-notification-email` — transactional emails (registration submitted, approval, connection updates).
- `send-connection-email` — connection request/accept emails.
- `send-contact-email` — contact form emails.
- `handle-existing-auth-user` — reconciles auth users during registration.
- `delete-user-account` — admin-safe account deletion.
- `cleanup-expired-otps` — scheduled cleanup.

## Storage Buckets

- `avatars` — profile pictures, path `${user_id}/avatar.jpg`, replaced in-place on upload.
- `publications` — publication attachments.
- `distributor-documents` — verification documents.
- `banners` — admin-managed banner images.
- `deals` — marketplace deal assets.

Upload validation is centralized in `src/lib/uploadValidation.ts` (4 MB image limit, 30 MB document limit, MIME whitelists, canvas-based image compression).

## Authentication Flow

1. User picks a role and fills the role-specific registration form.
2. Email is verified via a 6-digit OTP (Resend + edge function).
3. Password must reach **Strong** or **Very Strong** on the strength meter.
4. Profile is created with `approval_status = 'pending'`; admins receive an in-app + email notification.
5. Once approved, the user can sign in and access the dashboard.

Password reset uses an OTP flow (`/auth` → "Forgot password"). Google OAuth is supported through a wildcard `/~oauth/*` route so it works on custom domains.

## Notifications

- Powered by Supabase Realtime on the `notifications` table.
- `NotificationBell` shows unread counts; clicking a notification routes to the relevant page.
- New user registrations broadcast to **admin accounts only** with a "View Pending Users" link that opens `/admin`.

## Security & Validation

- **RLS everywhere.** Every public table has RLS enabled and per-role policies; `user_roles` is auth-only.
- **No client-side admin checks.** All privileged operations go through server-side `has_role()`.
- **Input validation with Zod** in critical forms; `TEXT_LIMITS` centralizes character caps (e.g., bio 2 000 chars).
- **Upload hardening.** MIME whitelist, size caps, canvas compression, and old-file cleanup to prevent orphaned storage objects.
- **Password strength.** All registration forms and password resets require **Strong** or **Very Strong** on the strength meter.
- **Required-field UX.** All three registration forms surface a toast — “Please fill all fields marked with * to submit the registration.” — when submit is attempted with missing required fields.

## Design System

- **Colors:** Navy (`#0F172A` family) + Emerald green accents, defined as semantic tokens in `src/index.css`.
- **Never** hardcode `text-white`, `bg-black`, or arbitrary hex utilities — use tokens.
- **Typography:** Poppins for headings, Inter for body. No serif fonts.
- **Dialogs:** Use styled `AlertDialog` from shadcn — never native `alert`/`confirm`.
- **Motion:** Scroll-to-top animations, subtle floating SVGs, biotech imagery.

## Local Development

```bash
# 1. Install
npm install

# 2. Start dev server (Vite on http://localhost:8080)
npm run dev

# 3. Type-check / lint
npm run lint
```

The Supabase client is auto-generated at `src/integrations/supabase/client.ts` — do not edit it.

## Environment Variables

Managed automatically by Lovable Cloud and stored in `.env` (do not edit by hand):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Secrets used by edge functions (Resend API key, etc.) are managed through the Lovable **Backend** panel.

## Deployment

- Preview deploys ship on every change via Lovable.
- Production custom domain: `codonyx.org` (Render/Lovable hosting).
- Publish from the Lovable editor via **Publish**.

---

© Codonyx. Central contact: **info@codonyx.org**
