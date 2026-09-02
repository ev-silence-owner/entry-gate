<div align="center">

[![pre-launch](https://img.shields.io/badge/status-PRE--LAUNCH-8b5cf6?labelColor=0a0a0a&style=for-the-badge)](#status)
[![non-clinical](https://img.shields.io/badge/safety-NON--CLINICAL-14b8a6?labelColor=0a0a0a&style=for-the-badge)](#boundary)
[![entry-gate](https://img.shields.io/badge/surface-GOLDEN%20SILENCE-d4af37?labelColor=0a0a0a&style=for-the-badge)](#what-this-is)
[![host](https://img.shields.io/badge/host-patternlens.app-d4af37?labelColor=0a0a0a&style=for-the-badge)](#patternlensapp)
[![cloudflare](https://img.shields.io/badge/pages-Cloudflare-f6821f?labelColor=0a0a0a&style=for-the-badge)](#cloudflare-pages)
[![license](https://img.shields.io/badge/license-MIT-22c55e?labelColor=0a0a0a&style=for-the-badge)](./LICENSE)

# ENTRY GATE

**Golden Silence. Sixty seconds of nothing. Then a starting point.**

PatternLens Entry Gate · SILENCE SYSTEM · not a clinic · not LIVE  
Intended host: [patternlens.app](https://patternlens.app)

[What this is](#what-this-is) · [Boundary](#boundary) · [Routes](#routes) · [patternlens.app](#patternlensapp) · [Cloudflare Pages](#cloudflare-pages) · [Status](#status)

</div>

Ember gold `#d8a45a` · graphite `#6b8f96` · midnight `#c49a6a` · ion `#8ec0c7`.  
Cormorant Garamond for the rare words. Outfit for the rest.

---

## What this is

Entry Gate is the first behavioural session of PatternLens. It is **not onboarding**, not a loading screen, and not a score.

| Surface | Role |
|---|---|
| **Golden Silence** `/` | 60 s, four φ phases. A silence form at 38.2vh. Tap after 10 s is a conscious exit. |
| **Aha** `/aha` | Seconds spent in silence. Optional thought name. Not a result. |
| **Quiet** `/quiet` | Presence. Nothing is required. |

The form is a golden rectangle 1:1.618, rotated 23.6°, with a three-arc Fibonacci spiral. Breath 38.2 / 23.6 / 38.2. Reduce Motion keeps opacity and blur, drops breath and rotation.

Tap is exit, not mind-wandering. Time in silence stays on this device. It is a starting point, not a profile.

---

## Boundary

| It is | It is not |
|---|---|
| A first session of silence | Diagnosis, therapy, a medical device |
| Seconds remaining in low stimulus | Attention-span score or comfort score |
| Optional thought category | Personality, mood, or health inference |
| Theme preference on this device | An account |
| Open-core *candidate* | A public npm package marked LIVE |
| Intended host `patternlens.app` | A verified LIVE service |

Forbidden in consumer copy and contracts: `ANS`, `HRV`, `GSR`, `ECG`, diagnosis, therapy, biological age, intervention recommendation.

---

## Routes

```text
/        Golden Silence     60 000 ms · Entry → Deepening → Silence → Return
/aha     Starting point     seconds + optional thought + silence theme
/quiet   Presence           no demand
```

| Phase | Start | Copy |
|---|---|---|
| Entry | 0 ms | Pozwól sobie na ciszę |
| Deepening | 6 472 ms | none |
| Silence | 16 944 ms | none |
| Return | 49 304 ms | Wracasz gotowa/gotów |

Themes: Ember Silence, Graphite Drift, Midnight Paper, Ion Haze.

---

## patternlens.app

Canonical public name: **`https://patternlens.app`**.  
`www.patternlens.app` should redirect to the apex.

This is the intended host. It is **not LIVE** until this repo is what HTTPS returns with status 200 and title **Entry Gate · Screen Zero**.

Do not guess a `*.pages.dev` hostname. Copy it from the Pages project after Connect to Git is **Ready**. Zone and Pages must be the same Cloudflare account (error 1014 is cross-user CNAME).

---

## Cloudflare Pages

**No API token.** Connect this repo to Pages through Git, then attach the domain in the same panel.

1. Open [Workers & Pages → Create](https://dash.cloudflare.com/b00b3e8ea857145a286c101efe065fd1/workers-and-pages/create).
2. **Pages** → **Connect to Git** → repository **entry-gate**.
3. Framework preset **None**. Build command empty. Output directory `/`.
4. **Save and Deploy**. Wait for Production **Ready**.
5. Open the exact `https://<project>.pages.dev/` shown in the project. It must be 200.
6. Custom domains → `patternlens.app`, then `www.patternlens.app` (www → apex). Leave the orange cloud.
7. Do not paste a CNAME to a hostname that does not exist on this account.

This chat cannot complete Cloudflare OAuth.

`wrangler.toml` is already here. `_redirects` maps `/aha` and `/quiet` to `index.html`.

---

## Status

```text
Entry Gate     ███████░░░  Golden Silence + /aha in this repo
Host           ████░░░░░░  patternlens.app intended — 403 / 1014 — not LIVE
Pages          ██░░░░░░░░  Connect to Git still required
Contracts      ███████░░░  candidate — boundary review
PatternLens    ████░░░░░░  pre-launch
```

Package publish, repo visibility changes, deploy, and marking LIVE each need their own evidence.

---

## Local

Open `index.html` in a browser, or serve the folder as static files.  
No build step. No accounts. Session records stay in `localStorage`.

---

## Canon

| Law | Value |
|---|---|
| Golden rectangle | φ = 1.618, 23.6° |
| Session | 60 s, four Fibonacci phases |
| Exit | tap after 10 s, or auto at 60 s |
| Language | S11 — no clinical claims in copy |
| Public name | `patternlens.app` — intended, not LIVE until verified |

Security reports — not via public issues. See [SECURITY.md](./SECURITY.md).

This file does not authorize clinical claims, raw biosignals, package publication, or marking a service LIVE.

---

<div align="center">

`#0a0a0a` void · `#d8a45a` ember · `#e8e8e8` paper

PRE-LAUNCH · NON-CLINICAL · MIT · patternlens.app

[silence-phi](https://github.com/ev-silence-owner/silence-phi) · [Soft-Noire-Design](https://github.com/ev-silence-owner/Soft-Noire-Design)

</div>
