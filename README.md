# Cipher Lab

Build, train and deploy surveillance models on the electronic communications of financial firms, to find bribery, money laundering, market abuse and other financial crime, without the messages ever leaving the customer’s vault.

Placeholder customers, people and data come from the Star Wars galaxy.

## Run it (Mac)

```sh
npm install
npm run dev
```

Then open the local address Vite prints (usually http://localhost:5173).

## Structure

- `src/styles/tokens.css` — every color, type and spacing value. Taken from the a11y-charts design system; see `DESIGN-SYSTEM.md`.
- `src/components/BrowserFrame.tsx` — design-system component that runs the lab inside a full-viewport browser window.
- `src/data/stages.ts` — the seven-stage lifecycle.
- `src/data/customers.ts` — placeholder customers, solutions, models and teams.
- `src/pages/OverviewPage.tsx` — what the product is and who it serves.
- `src/pages/LabLayout.tsx` — the app: left nav lists customers, then drills into one customer’s solutions and models.
- `src/pages/SolutionPage.tsx` — the stage shell each lifecycle screen plugs into.
- `src/pages/stages/ContractCapture.tsx` — stage 1: solution details, success criteria, data request, team, sign-off and activity.
- `src/pages/stages/DataFulfillment.tsx` — stage 2: send the data request to the vault, watch counts arrive, import the training set.
- `src/pages/stages/DataAnalysis.tsx` — stage 3: cleaning rules, vocabulary, channel, length and sentiment aggregates; choose what to send to feature engineering.
- `src/components/charts/` — accessible charts ported from a11y-charts: monochrome patterns, generated summaries, one keyboard stop per chart, data tables.
- `src/data/store.ts`, `src/data/contracts.ts`, `src/data/fulfillment.ts`, `src/data/analysis.ts` — edits made in the lab, saved in the browser (localStorage).

## Routes

| Route | Page |
| --- | --- |
| `#/overview` | Overview |
| `#/lab` | All customers |
| `#/lab/:customer` | One customer’s solutions |
| `#/lab/:customer/solutions/:solution/:stage` | A solution at a lifecycle stage |

## Deploy

Pushing to `main` builds and publishes to GitHub Pages through `.github/workflows/deploy.yml`. Turn it on once under Settings → Pages → Source: GitHub Actions.
