# Enterprise Companion

> **Stop forcing a full migration. Build a bridge instead.**

A Manifest V3 Chrome extension that embeds your SaaS inside the tools enterprise teams already use — LinkedIn, Salesforce, HubSpot, or a legacy ERP — so buyers never have to abandon their current dashboard.

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
|                                                                       |
|  [ Content Script ]  <--->  [ Background Service Worker ]              |
|  (Injects UI into DOM)      (Handles Auth & Off-Screen Tasks)        |
|          ^                                   ^                        |
+----------|-----------------------------------|------------------------+
           |                                   |
           v                                   v
  [ Target Website ]                [ SaaS API / Backend ]
  (Salesforce / LinkedIn / ERP)     (Database & Business Logic)
```

| Layer | Path | Role |
| --- | --- | --- |
| Config | `wxt.config.ts` | Permissions, host matches, OAuth stub → generates `manifest.json` |
| Content script | `entrypoints/content.tsx` | DOM extraction + Shadow DOM React panel |
| Background | `entrypoints/background.ts` | Auth session, messaging, SaaS API |
| Popup | `entrypoints/popup/` | Connect / disconnect account |
| Shared libs | `lib/` | Types, auth, extractors, API client |
| UI | `components/` | Companion panel + isolated styles |

### Shadow DOM rule

Enterprise apps ship aggressive global CSS. Always mount injected UI inside:

```js
element.attachShadow({ mode: "open" })
```

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
```

WXT builds into `.output/chrome-mv3-dev/` and can launch a browser with the extension loaded.

### Production build + manual load

```bash
npm run build
```

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `.output/chrome-mv3`

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

## Connect a real SaaS backend / Supabase CRM

### Option A — Supabase CRM (built-in)

1. Copy env example and fill your project keys:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

2. Create the `leads` table (SQL migration already applied if you used the linked Supabase project; otherwise run the schema from the repo history / ask the agent to re-apply).

3. In Supabase → **Authentication → Providers → Email**, turn off **Confirm email** for faster testing.

4. Rebuild and reload the extension:

```bash
npm run build
```

5. **Sign up** from the extension popup (or side panel) with email + password.

6. On LinkedIn, click **EC → Sync to SaaS** — the person is saved to `leads`.

7. Open the CRM UI:

```bash
npx serve public -p 4173
```

Visit [http://localhost:4173/crm.html](http://localhost:4173/crm.html)

### Option B — Custom API

Copy `.env.example` → `.env` and set:

```
VITE_SAAS_API_URL=https://api.your-saas.example.com
```

Expected endpoint: `POST /api/extension/automate` with `Authorization: Bearer <token>` and body `{ action, context, notes? }`.

Replace login in `lib/auth.ts` with your OAuth flow if needed.

---

## Project structure

```
├── components/           # React companion UI + Shadow DOM styles
├── entrypoints/
│   ├── background.ts     # Service worker
│   ├── content.tsx       # Injected into host pages
│   └── popup/            # Toolbar popup
├── lib/
│   ├── auth.ts           # Session helpers (demo + hooks for OAuth)
│   ├── extractors.ts     # Host DOM → PageContext
│   ├── messaging.ts      # Typed runtime messages
│   ├── saas-api.ts       # Backend client + mock loop
│   └── types.ts          # Shared types
├── public/
│   └── demo-host.html    # Fake legacy ERP for demos
├── wxt.config.ts         # Manifest V3 config
└── package.json
```

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev build with hot reload |
| `npm run build` | Production Chrome MV3 build |
| `npm run zip` | Zip for distribution / Web Store packaging |
| `npm run dev:firefox` | Dev build targeting Firefox |
| `npm run build:firefox` | Production Firefox build |

---

## Roadmap ideas

- [ ] Real OAuth against your SaaS
- [ ] Persist synced leads to a CRM (e.g. Supabase / HubSpot)
- [ ] Stronger LinkedIn / Salesforce selectors per customer org
- [ ] Enrichment providers (email / firmographics APIs)
- [ ] AI outreach drafts wired to your LLM endpoint

---

## Disclaimer

This repository is an **architecture + demo scaffold** for embedding SaaS workflows in existing tools. You are responsible for complying with third-party site terms, privacy laws, and enterprise security requirements when deploying to production.

---

## License

Add a license before publishing (recommended: **MIT**). Until a `LICENSE` file is present, all rights remain with the author.

---

## Contributing

Issues and PRs are welcome — especially improvements to host extractors, auth flows, and backend examples.
