# torjan-horse-enterprise-chrome-extension
Enterprise Chrome extension that embeds SaaS workflows inside LinkedIn, Salesforce, and legacy tools, so buyers don’t need a new dashboard.  Manifest V3 “integration companion” that injects your product into the tools sales teams already use.

# Enterprise Companion — Chrome Extension as a Trojan Horse
# Enterprise Companion
Enterprise buyers stall SaaS deals because they will not abandon legacy dashboards or retrain teams. This extension is the **integration bridge**: your product’s capabilities layered on Salesforce, LinkedIn, HubSpot, or an internal ERP — no full migration.
> **Stop forcing a full migration. Build a bridge instead.**
> Hook: *Enterprise sales cycles stalling because clients hate switching dashboards? Stop forcing a full migration. Build a bridge instead.*
A Manifest V3 Chrome extension that embeds your SaaS inside the tools enterprise teams already use — LinkedIn, Salesforce, HubSpot, or a legacy ERP — so buyers never have to abandon their current dashboard.
## Architecture (Manifest V3)
---
## Why this exists
Enterprise deals stall when clients refuse to:
- Leave their legacy CRM / ERP
- Retrain staff on a new UI
- Run a painful data migration
**Enterprise Companion** reframes the Chrome extension as a strategic **integration layer**: your product’s workflows (enrich, sync, draft, log) appear as a side panel on top of the host site.
---
## Features
- Injects a React side panel into host pages via **Shadow DOM** (host CSS can’t break your UI)
- Extracts page context (name, title, company, email, record ID) from LinkedIn / Salesforce / generic ERP markup
- Background service worker handles auth + API calls
- Demo automation loop: **Enrich**, **Sync to SaaS**, **Draft outreach**, **Log activity**
- Local **legacy ERP demo page** for offline demos
- Ready to point at a real SaaS backend via env config
---
## Architecture
```
+-----------------------------------------------------------------------+
|                          CHROME EXTENSION                             |

[8 lines collapsed]

  (Salesforce / LinkedIn / ERP)     (Database & Business Logic)
```
| Layer | Location | Role |
| Layer | Path | Role |
| --- | --- | --- |
| Config | `wxt.config.ts` → generated `manifest.json` | Permissions, host matches, OAuth stub |
| Content script | `entrypoints/content.tsx` | DOM extract + **Shadow DOM** React panel |
| Background | `entrypoints/background.ts` | Auth session, messaging, API calls |
| Popup | `entrypoints/popup/` | Connect / disconnect SaaS account |
| Shared | `lib/` | Types, auth, extractors, SaaS client |
| Config | `wxt.config.ts` | Permissions, host matches, OAuth stub → generates `manifest.json` |
| Content script | `entrypoints/content.tsx` | DOM extraction + Shadow DOM React panel |
| Background | `entrypoints/background.ts` | Auth session, messaging, SaaS API |
| Popup | `entrypoints/popup/` | Connect / disconnect account |
| Shared libs | `lib/` | Types, auth, extractors, API client |
| UI | `components/` | Companion panel + isolated styles |
### Shadow DOM rule
Enterprise hosts (Salesforce, HubSpot) ship aggressive CSS. Injected UI mounts under `element.attachShadow({ mode: "open" })` so styles do not leak either direction.
Enterprise apps ship aggressive global CSS. Always mount injected UI inside:
## Stack
```js
element.attachShadow({ mode: "open" })
```
- **WXT** — Manifest V3 bundling, HMR, Chrome/Firefox targets
- **React + TypeScript** — companion panel & popup
- **Chrome messaging** — content ↔ background only; background owns HTTPS to your SaaS
Your styles stay yours; their dashboard stays theirs.
---
## Tech stack
| Layer | Choice |
| --- | --- |
| Extension framework | [WXT](https://wxt.dev) (Manifest V3) |
| UI | React + TypeScript |
| Styling | Isolated CSS inside Shadow DOM |
| Messaging | `chrome.runtime` (content ↔ background) |
---
## Quick start
### Requirements
- Node.js 18+
- Google Chrome (or Chromium)
### Install & develop
```bash
npm install
npm run dev

[1 line collapsed]

WXT builds into `.output/chrome-mv3-dev/` and can launch a browser with the extension loaded.
### Manual load
### Production build + manual load
1. `npm run build`
2. Chrome → `chrome://extensions` → Developer mode → **Load unpacked** → `.output/chrome-mv3`
3. Serve the demo host: `npx serve public -p 4173`
4. Open `http://localhost:4173/demo-host.html`
5. Click **EC** → Connect SaaS → run Enrich / Sync / Draft / Log
```bash
npm run build
```
### Real SaaS backend
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `.output/chrome-mv3`
Copy `.env.example` → `.env` and set:
### Demo on a fake legacy ERP
```bash
npx serve public -p 4173
```
Open [http://localhost:4173/demo-host.html](http://localhost:4173/demo-host.html)
1. Click the green **EC** button  
2. **Connect SaaS account**  
3. Run **Enrich / Sync / Draft / Log**
### Demo on LinkedIn
1. Load the unpacked extension  
2. Open any LinkedIn profile  
3. Click **EC** → connect → run actions  
> **Note:** Host DOM selectors (especially LinkedIn) change often. Treat extractors as a starting point and tune them for your target pages. Respect LinkedIn’s Terms of Service — this project is designed for **user-initiated** actions on pages the user is already viewing, not bulk scraping.
---
## Connect a real SaaS backend
By default the extension uses a **mock automation loop** (great for demos).
1. Copy env example:
```bash
cp .env.example .env
```
2. Set your API:
```env
VITE_SAAS_API_URL=https://api.your-saas.example.com
```
Expected endpoint: `POST /api/extension/automate` with `Authorization: Bearer <token>` and body `{ action, context, notes? }`.
3. Implement:
Replace demo login in `lib/auth.ts` with `chrome.identity.launchWebAuthFlow` (or your SaaS OAuth popup) and set `oauth2.client_id` in `wxt.config.ts`.
```http
POST /api/extension/automate
Authorization: Bearer <token>
Content-Type: application/json
```
## Automation loop
Body shape:
1. Content script extracts page context (name, email, company, record id).
2. User clicks an action in the Shadow DOM panel.
3. Message → background → your SaaS API (enrich, sync, draft, log).
