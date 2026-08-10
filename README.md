# ES Resource Command Center

A single‑page resource & allocation management app (WPP Enterprise Solutions, Slate & Teal theme, Calibri UI). Loads two spreadsheets — **Resource Allocation** and **Account Details** — and optionally syncs to a shared **Supabase** database.

> Login (prototype): **admin / admin**

## Features
- Dashboard KPIs with click‑through drill‑downs
- Editable allocation heatmap (Jul locked, Aug–Dec editable)
- Resources tab: search + filters, per‑account allocation, click an allocation to see a person's project split
- Accounts tab: geo, owner, start/end dates, status (from the Account Details sheet)
- Executive Insights: utilisation donut, monthly FTE, top accounts, geography split, AI‑style recommendations
- Resource Assistant chatbot
- Two‑sheet upload (.xlsx and .csv)
- Optional Supabase sync (push data + save heatmap edits)

## Repository layout
```
resource-command-center/
├── index.html               # App shell (loads the files below)
├── css/styles.css           # Slate & Teal theme, Calibri
├── js/app.js                # App logic (import, merge, render)
├── js/supabase.js           # Supabase data layer (reads window.APP_CONFIG)
├── config.sample.js         # Template for your keys (committed)
├── config.js                # YOUR keys (git-ignored, not committed)
├── supabase/
│   ├── 01_schema.sql        # Tables (resources, accounts, allocations, rfps, logs)
│   └── 02_rls_policies.sql  # Prototype RLS policies
├── templates/               # Blank CSV upload templates
├── .github/workflows/deploy.yml  # GitHub Pages deploy
├── .gitignore               # Ignores config.js (secrets)
└── LICENSE
```

## Quick start (local)
Because the app loads `js/*.js` and `config.js` as separate files, open it via a tiny local server (not file://) so the browser can fetch them:

```bash
# Python 3
python -m http.server 8000
# then open http://localhost:8000
```

Or use the VS Code "Live Server" extension. Sign in with **admin / admin**, then on the Dashboard upload your two sheets.

## Connect to Supabase
1. Create a project at https://supabase.com.
2. In **SQL Editor**, run `supabase/01_schema.sql`, then `supabase/02_rls_policies.sql`.
3. In **Project Settings → API**, copy the **Project URL** and the **anon public** key.
4. Copy the config template and add your keys:
   ```bash
   cp config.sample.js config.js
   ```
   Edit `config.js`:
   ```js
   window.APP_CONFIG = {
     SUPABASE_URL: "https://yourproject.supabase.co",
     SUPABASE_KEY: "eyJhbGciOi...anon-public-key..."
   };
   ```
5. Reload the app. The header shows **● Connected to Supabase**.
6. Upload the two sheets, then click **⬆ Push to Supabase** on the Dashboard.

> `config.js` is git‑ignored, so your keys are never committed. Use the **anon public** key only — never the `service_role` key.

## Push this repo to GitHub

```bash
git init
git add .
git commit -m "Initial commit: ES Resource Command Center"
git branch -M main
git remote add origin https://github.com/<your-username>/resource-command-center.git
git push -u origin main
```

## Deploy (GitHub Pages)
Two options:

**A. Automatic (workflow included)**
- Push to `main`. In **Settings → Pages → Build and deployment → Source**, choose **GitHub Actions**. The included `.github/workflows/deploy.yml` publishes the site.

**B. Branch deploy**
- **Settings → Pages → Source: Deploy from a branch → main → /(root)**.

Your URL will look like: `https://<your-username>.github.io/resource-command-center/`

> Pages serves **public** repos on the free plan. If you connect Supabase from a public site, make sure your RLS policies are locked down. For internal‑only data, keep the repo **private** (and host via Azure Static Web Apps / an internal host instead), or deploy the app without keys and have each user add their own `config.js`.

## Data model (mirrors the two sheets)
- **resources**: id, resource_name, email, role, department, reporting_manager, team_head, **resource_geo**, status
- **accounts**: id, account_name, **geo**, account_owner, start_date, end_date, status
- **allocations**: resource_id, account_id, allocation_month, allocation_percentage, project_geo, comments

## Security notes
- The included RLS policies are **open** for prototyping. Before wider use, enable Supabase Auth and change `using (true)` to `using (auth.role() = 'authenticated')`.
- Never commit `config.js` or the `service_role` key.

## License
MIT — see `LICENSE`.
