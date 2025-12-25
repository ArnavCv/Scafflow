# SCAFFLOW
#### Video Demo: https://youtu.be/UVH4lAB43uc
#### Live site: https://scafflow-cmp.vercel.app/
#### Description:
I’m Arnav Chaturvedi, an Indian Computer Science Engineering sophomore, and CS50 was my gateway into this world back when I was a fresher. Scafflow is my attempt to make construction management feel less like wrestling spreadsheets and more like driving a dashboard. Everything lives in one Next.js App Router project: the UI, the API routes, and the Postgres access. Users own their projects and can create tasks, budgets, safety incidents, change orders, and progress draws. Admins can see everything but do not mutate data, which keeps demos safe and mirrors real oversight roles. I leaned into a single-language stack (JavaScript/TypeScript) and added an OOP-style service and repository layer so access checks and validation sit in one place instead of being sprinkled across handlers.

I am proud of the ownership model and the auto rollup of project progress. Task updates recalculate the project’s progress percentage so nothing is hard coded. Every write path verifies that the caller is the project owner, while admin reads bypass ownership but never allow writes. That decision forces a clean separation between “doers” and “overseers” and avoids the classic “everyone edits everything” demo risk.

Authentication uses JWT. The client stores the token, protects routes, and calls `/api/auth/me` to keep sessions honest. Pages like projects, tasks, budgets, safety, change orders, and progress draws all fetch through the Next.js API routes, which wrap Postgres queries and enforce owner-or-admin visibility. Admins get a dedicated page that lists every user and every project with owner details, but all admin forms are disabled by design.

Data realism mattered. The seed script builds tables and inserts an admin plus ten demo users, along with a set of projects, tasks, budget items, safety incidents, change orders, and draws that look “lived in.” Progress values, timestamps, and budgets are intentionally varied so the dashboard, KPIs, and per-project pages feel like a real portfolio instead of a blank slate. The seeding process deletes and reinserts projects by name to keep runs deterministic, and it recalculates project progress from tasks rather than trusting static numbers.

The codebase has a few pillars. `lib/services/project-service.ts` and `lib/repositories/project-repository.ts` centralize validation, auth extraction, and visibility logic. `lib/auth.ts` handles JWT and bcrypt helpers. `lib/db.ts` loads `.env.local` first, then runs Postgres with helpful error logging when queries fail. `lib/types.ts` defines shared interfaces for users, projects, tasks, budgets, safety incidents, change orders, and draws, including owner metadata so the UI can show who owns what without extra round trips. The app pages (projects, dashboard, KPIs, budget-costs, change-orders, progress-draws, safety-mobilization, execution-workflow, collaboration, schedule-orders, settings) all call the same APIs with loading and error states and hide create forms when the viewer is an admin.

Design choices were deliberate. I kept everything in one Next.js codebase to avoid babysitting a second backend service. I chose owner-only writes and admin read-only because that matches real-world oversight and keeps demos from getting messy. I used a service/repo layer to avoid duplicated access checks and to make it harder to accidentally expose data. Task-driven progress ensures the project health UI reflects actual work. Seeding with rich data makes it easy to present the project without manual prep. Everything is JavaScript/TypeScript to stay in one mental model.

I did the work and took targeted assistance from ChatGPT. The initial UI scaffolding was generated with the help of v0 by Vercel, and from there the access controls, data flows, and seeds were hand-shaped to fit this project’s goals. The tone here is mine: a bit informal, slightly proud, and focused on making something demo-ready for a CS50 final submission.

#### Setup and demo
Install deps: `npm install`  
Seed database locally or against a hosted Postgres by setting `DATABASE_URL` and running the seed script:  
- PowerShell: `$env:DATABASE_URL="<your db url>"; $env:TS_NODE_COMPILER_OPTIONS='{"module":"commonjs","moduleResolution":"node"}'; npx ts-node --transpile-only scripts/init-db.ts`  
- macOS/Linux: `DATABASE_URL="<your db url>" TS_NODE_COMPILER_OPTIONS='{"module":"commonjs","moduleResolution":"node"}' npx ts-node --transpile-only scripts/init-db.ts`  
If you are using the hosted site at https://scafflow-cmp.vercel.app/, the database is already seeded.  
Admin (read-only): `admin@scafflow.com` / `Scafflow1234`  
Owners: `alice@example.com`, `bob@example.com`, `charlie@example.com`, `dana@example.com`, `evan@example.com`, `fiona@example.com`, `gary@example.com`, `hana@example.com`, `ivan@example.com`, `jade@example.com` (password `Password123!`)
