<div align="center">

[![pre-launch](https://img.shields.io/badge/status-PRE--LAUNCH-8b5cf6?labelColor=0a0a0a&style=for-the-badge)](#status)
[![non-clinical](https://img.shields.io/badge/safety-NON--CLINICAL-14b8a6?labelColor=0a0a0a&style=for-the-badge)](#boundary)
[![entry-gate](https://img.shields.io/badge/surface-ENTRY%20GATE-d4af37?labelColor=0a0a0a&style=for-the-badge)](#what-this-is)
[![host](https://img.shields.io/badge/host-patternlens.app-d4af37?labelColor=0a0a0a&style=for-the-badge)](#patternlensapp)
[![cloudflare](https://img.shields.io/badge/pages-Cloudflare-f6821f?labelColor=0a0a0a&style=for-the-badge)](#cloudflare-pages)
[![license](https://img.shields.io/badge/license-MIT-22c55e?labelColor=0a0a0a&style=for-the-badge)](./LICENSE)

# ENTRY GATE

**Screen Zero. One field. One touch. A sealed arrival.**

PatternLens Entry Gate · SILENCE SYSTEM · not a clinic · not LIVE  
Intended host: [patternlens.app](https://patternlens.app)

[What this is](#what-this-is) · [Boundary](#boundary) · [Layers](#layers-l0--l1--l2) · [patternlens.app](#patternlensapp) · [Cloudflare Pages](#cloudflare-pages) · [Status](#status)

</div>

Midnight void `#0a0a0a` · 22k gold `#d4af37` as hairline only · paper `#e8e8e8`.  
Cormorant Garamond for the rare words. Outfit for the rest.

---

## What this is

Entry Gate is the passive door into PatternLens. It is a **deterministic observation instrument**, not onboarding, not a form, and not a diagnosis.

| Surface | Role |
|---|---|
| **Screen Zero** | Measure time-to-first-touch and region. No copy until you wait. |
| **Consent** | Explicit, equal-weight choice. Record, or continue in silence. |
| **Quiet Mode** | Presence after Genesis. Nothing is required of you. |
| **EffectLog** | Local sealed arrivals. L0 fact, L1 label, L2 held note. |

Tap is consent to continue. Logging is a second, quieter yes.

---

## Boundary

| It is | It is not |
|---|---|
| Observation of an arrival | Diagnosis, therapy, a medical device |
| Time-to-first-touch + quadrant | Personality, mood, or health inference |
| SHA-256 seal on this device | A server RSA signature |
| Open-core *candidate* | A public npm package marked LIVE |
| Intended host `patternlens.app` | A verified LIVE service |

Forbidden in consumer copy and contracts: `ANS`, `HRV`, `GSR`, `ECG`, diagnosis, therapy, biological age, intervention recommendation.

`GATE_CHECK → PRODUCTIZED` means a limited non-clinical experiment. Nothing else.

---

## Layers (L0 · L1 · L2)

```text
L0  Raw observation     write-once, sealed, local
L1  Notes               append-only labels, withdrawable
L2  Held notes          versioned hypothesis, hidden until you read it
```

| Signal | Range | Meaning |
|---|---|---|
| Time-to-first-touch | 50 ms – 30 s | Latency, not engagement |
| Quadrant | center / edge / top / bottom / left / right | Region, not a heatmap |
| Session gesture | deliberate · exploratory · habitual · delayed | A label, not a state of mind |

No Genesis is written on timeout (30 s). An edge touch with low attention is treated as an open door — nothing is kept.

---

## patternlens.app

Canonical public name for this surface: **`https://patternlens.app`**.  
`www.patternlens.app` should serve the same origin.

This is the intended host. It is **not LIVE** until this repo is what HTTPS returns.

| Name | Role |
|---|---|
| `patternlens.app` | Apex. Canonical. |
| `www.patternlens.app` | Alias of the apex. |
| `entry-gate.pages.dev` | Cloudflare Pages hostname after Connect to Git. |

Today the apex still answers on **Vercel** and redirects to `www`, which has **no DNS**. Attach the names to this Pages project, then drop the Vercel assignment. Do not call the host LIVE until a GET of `/` returns Screen Zero with TLS.

---

## Cloudflare Pages

**No API token.** Connect this repo to Pages through Git, then attach the domain in the same panel.

| Method | Token? | When |
|---|---|---|
| **Connect to Git** (recommended) | No. GitHub OAuth in the Cloudflare panel | 0 cost, auto-deploy from `main` |
| **Upload assets** | No. Drag and drop | one-shot, no Git |
| Wrangler CLI / GitHub Actions | Yes: `CLOUDFLARE_API_TOKEN` + Account ID | only automation outside the panel |

Steps:

1. Open [Workers & Pages → Create](https://dash.cloudflare.com/b00b3e8ea857145a286c101efe065fd1/workers-and-pages/create).
2. **Pages** → **Connect to Git**.
3. Authorize GitHub (`ev-silence-owner`).
4. Repository: **entry-gate**.
5. Framework preset **None**. Build command empty. Output directory `/`.
6. **Save and Deploy** → `https://entry-gate.pages.dev`.
7. **Custom domains** → Set up a domain → `patternlens.app`.
8. Repeat for `www.patternlens.app`.
9. Remove `patternlens.app` from the Vercel project so the apex is not split.

This chat cannot complete Cloudflare OAuth, Vercel domain removal, or registrar DNS on your behalf.

`wrangler.toml` is already here for a later CLI deploy if you want one.

---

## Architecture

```text
Entry Gate (this repo)     PUBLIC Pages candidate     Screen Zero
        │
        ▼
SILENCE Framework          PUBLIC candidate           contracts, φ, UI
        │
        ▼
approved API boundary      no EE source import
        │
        ▼
Enterprise runtime         PRIVATE                    policy, audit, billing
```

Apps consume public contracts. They do not import Enterprise source.  
Research does not leak into UI. Infra takes a signed digest, not a branch.

---

## Status

```text
Entry Gate     ██████░░░░  pre-launch — Pages connect required
Host           █████░░░░░  patternlens.app intended — not LIVE
Contracts      ███████░░░  candidate — boundary review
PatternLens    ████░░░░░░  pre-launch
Public core    ░░░░░░░░░░  blocked — history, license, SBOM
DNS / LIVE     ██░░░░░░░░  apex on Vercel · www has no record
```

Package publish, repo visibility changes, deploy, and marking LIVE each need their own evidence.

---

## Local

Open `index.html` in a browser, or serve the folder as static files.  
No build step. No accounts. EffectLog stays in `localStorage`.

---

## Canon

| Law | Value |
|---|---|
| Golden rectangle | φ = 1.618, hairline gold |
| Time-to-first-touch | `performance.now()`, not a wall clock in the decision |
| EffectLog | SHA-256 of L0, client-attested |
| Consent | post-tap, before L1; equal visual weight |
| Language | S11 — no clinical claims in copy |
| Public name | `patternlens.app` — intended, not LIVE until verified |

Security reports — not via public issues. See [SECURITY.md](./SECURITY.md).

This file does not authorize clinical claims, raw biosignals, package publication, or marking a service LIVE.

---

<div align="center">

`#0a0a0a` void · `#d4af37` gold · `#e8e8e8` paper

PRE-LAUNCH · NON-CLINICAL · MIT · patternlens.app

[silence-phi](https://github.com/ev-silence-owner/silence-phi) · [patternlens-pages](https://github.com/ev-silence-owner/patternlens-pages)

</div>
