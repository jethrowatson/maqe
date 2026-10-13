# MAQE — The Engineering Intelligence Platform

> **Company Intelligence, Supplier Discovery & AI Lead Matching**  
> Operational implementation and production build based on the 15-Slide Platform Overview and Technical Build Addendum v1.1.

[![Deterministic Acceptance Gates](https://img.shields.io/badge/Acceptance%20Gates-100%25%20Passing-emerald)](tests/evaluation.test.ts)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.10-black)](https://nextjs.org/)
[![Database](https://img.shields.io/badge/MariaDB-Cloud%2010.11-blue)](db/schema.sql)
[![Live Demo](https://img.shields.io/badge/Live%20Deploy-jethrowatson.co.uk%2Fmaqe%2F-blueviolet)](https://jethrowatson.co.uk/maqe/)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Hosted-2563eb)](https://jethrowatson.github.io/maqe/)

---

## 🚀 Live Deployments & Cloud Endpoints

- **Live Web Application (StackCP / High-Performance CDN)**: [https://jethrowatson.co.uk/maqe/](https://jethrowatson.co.uk/maqe/)
- **Live Web Application (GitHub Pages)**: [https://jethrowatson.github.io/maqe/](https://jethrowatson.github.io/maqe/)
- **Cloud MariaDB REST API Gateway**: [https://jethrowatson.co.uk/maqe/api/health](https://jethrowatson.co.uk/maqe/api/health)
- **GitHub Repository**: [https://github.com/jethrowatson/maqe](https://github.com/jethrowatson/maqe)

---

## 🏛️ Platform Architecture

MAQE is an engineering super-database connecting UK manufacturing capabilities with commercial demand. It operates two distinct, coherent product experiences:

1. **Member Application** (Customer leads & supplier matching, Pro directory search, CRM pipeline, participant messaging, RFQ procurement, profile verification).
2. **Operator Console** (Intake & backfill partition coordinator, candidate discovery review, AI assertion evidence inspection, matching laboratory with calibrated weights, and durable job telemetry).

```
   ┌───────────────────────┐
   │ UK Companies House   │ (Intake & Daily Sync Watermarks)
   └───────────┬───────────┘
               ▼
   ┌───────────────────────┐
   │ C01 Registry Intake   │ (Normalised company identities, 600k capacity backfill)
   └───────────┬───────────┘
               ▼
   ┌───────────────────────┐
   │ C02 Discovery/Retriev │ (Identity verification, SHA-256 document bodies)
   └───────────┬───────────┘
               ▼
   ┌───────────────────────┐
   │ C03 AI Enrichment     │ (Structured assertions: observed facts vs inferences)
   └───────────┬───────────┘
               ▼
   ┌───────────────────────┐
   │ C04 Classification    │ (Engineering taxonomy, immutable version publication)
   └───────────┬───────────┘
               ▼
   ┌───────────────────────┐
   │ C05 Matching Engine   │ (Customer leads vs Supplier recommendations)
   └───────────┬───────────┘
               ▼
   ┌───────────────────────┐
   │ C07 Credits & Ledger  │ (Double-entry ledger, permanent match unlock invariant)
   └───────────┬───────────┘
               ▼
   ┌───────────────────────┐
   │ C08 Networking & RFQ  │ (Opportunity CRM, blind bidder threads, messages)
   └───────────────────────┘
```

---

## 📦 Canonical Logical Components

| Component | Responsibility & Emitted Records |
| :--- | :--- |
| **C01 Registry Intake** | Companies House UK adapter, durable backfill partition checkpoints, capacity governor (600 req / 5 min), daily sync watermarks. |
| **C02 Discovery & Retrieval** | Identity confidence scoring (`reg_no_match`, `domain_match`, `name_similarity`), operator review (`approved` / `rejected`), content-hashed document repository. |
| **C03 AI Enrichment** | Structured assertions distinguishing observed capabilities from inferred operational needs, with explicit document span citations. |
| **C04 Classification & Pub** | Engineering taxonomy mappings (`engineering_demo_v1`), immutable profile revisions, and side-by-side version diffing. |
| **C05 Directional Matching** | Deterministic rules-based dual ranker (`rules_v1`), explainable score decomposition (compatibility, sector, geography, evidence), precomputed match edges. |
| **C06 Membership & RBAC** | Free, Pro (£99/mo, 20 credits), and Premium (£299/mo, 50 credits) tiers, single-use company claim tokens. |
| **C07 Allocation & Credits** | Double-entry ledger, monthly allowances, pack purchases, and the **permanent non-double-charging invariant** across directions. |
| **C08 Connections & Networking** | Opportunity CRM pipeline (`prospective` → `contacted` → `reviewing` → `won`), direct messaging, RFQ procurement with isolated blind threads, referral invitations. |
| **C09 Project Opportunities** | Capped bidding module (max 10 bidding suppliers), platform selection without third-party escrow. |
| **C10 Shared Platform** | Durable background jobs, crash-recovery leases, idempotency key deduplication, immutable audit trail. |
| **C11 Commerce** | Stripe-compatible checkout sessions, subscription lifecycle, and pack fulfilment. |
| **C12 Notifications** | In-app notification center, multi-channel delivery routing (SendGrid, Twilio SMS/WhatsApp sinks). |

---

## 🎯 Deterministic Benchmark: Delta Metalworks Ltd

The test suite validates the exact commercial landscape from Section 8 & 17 for **Delta Metalworks Ltd** (Sheffield precision sheet metal fabricator, SIC 25110/25500):

### Customer Lead Rankings (Who needs Delta's sheet metal?)
1. **Apex Enclosures Ltd (Score: 92%)** — Electronic cabinets & server racks requiring high-volume precision sheet metal.
2. **Vanguard Auto Components Ltd (Score: 86%)** — Stamped brackets and chassis assemblies using laser blanks.
3. **Quantum Robotics Ltd (Score: 58%)** — Automation machinery with moderate sheet casing evidence.
- *Strict Exclusion*: **Vortex Sheet Metal Ltd (Score: 0% / Filtered)** — Competitor providing sheet metal, excluded from customer prospects.
- *Strict Exclusion*: **BioHealth Pharmaceuticals Ltd (Score: 0% / Filtered)** — Irrelevant negative control.

### Supplier Match Rankings (Who meets Delta's requirements?)
1. **Apex Steel & Alloys Ltd (Score: 94%)** — Supplies certified cold-rolled steel coils and aluminium plate.
2. **Precision Press & Tooling Ltd (Score: 88%)** — Supplies CNC press brake tooling and hydraulic components.
3. **Titan Freight & Haulage Ltd (Score: 84%)** — Provides heavy flatbed industrial road haulage.

---

## 🧪 Automated Test Suite

Run the full deterministic verification suite:

```bash
npm test
```

Verifies:
- All 5 acceptance gates
- Exact directional ranking order and scoring thresholds
- Credit debit atomicity & double-charge prevention
- Tenant isolation between organizations
- Blind RFQ bidder thread isolation

---

## 🛠️ Deploy & Run Locally

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Compile static production export
npm run build

# Deploy simultaneously to remote server and verify
./deploy.sh
```
