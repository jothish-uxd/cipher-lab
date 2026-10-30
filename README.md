# Cipher Lab

Build, train and deploy surveillance models on the electronic communications of financial firms, to find bribery, money laundering, market abuse and other financial crime, without the messages ever leaving the customer’s vault.

The **Vault** tab is the other side: the customer's message vault, where compliance officers review the email, Teams, Bloomberg Chat, WhatsApp, text, Facebook Messenger and LinkedIn messages that policies flag. Policies run the models deployed from the Lab, so a match links straight back to the solution that produced it.

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
- `src/pages/NewSolutionPage.tsx` — start a solution: choose the risk, name it, land on a blank contract.
- `src/components/ResetLab.tsx` — reset button in the frame bar; clears every change saved in this browser.
- `src/pages/SolutionPage.tsx` — the stage shell each lifecycle screen plugs into.
- `src/pages/stages/ContractCapture.tsx` — stage 1: solution details, success criteria, data request, team, sign-off and activity.
- `src/pages/stages/DataFulfillment.tsx` — stage 2: send the data request to the vault, watch counts arrive, import the training set.
- `src/pages/stages/DataAnalysis.tsx` — stage 3: cleaning rules, vocabulary, channel, length and sentiment aggregates; choose what to send to feature engineering.
- `src/pages/stages/FeatureEngineering.tsx` — stage 4: tune, add or remove features, preview them on your own sentence, lock the set for training.
- `src/pages/stages/Training.tsx` — stage 5: pick candidate models, train with live progress, check each result against the contract.
- `src/pages/stages/ModelEvaluation.tsx` — stage 6: compare models against the contract, tune the alert threshold, inspect, try a message, choose one to deploy.
- `src/pages/stages/Deployment.tsx` — stage 7: deploy versioned services to the vault, switch surveillance on, roll back, monitor precision and drift.
- `src/components/charts/` — accessible charts ported from a11y-charts: monochrome patterns, generated summaries, one keyboard stop per chart, data tables.
- `src/pages/vault/` — the Vault, in its own browser frame (`vault.igbc.bank`): `MessagesPage` (list plus reading pane, below or beside), `MessageList` (unread, channel, attachments, sender, recipients, subject, policy matches, AI predictions, date, size), `MessageReader` (highlighted lexicon matches, AI predictions, policy matches with status, classification tags), `PoliciesPage` (each policy and the Lab model behind it).
- `src/data/vault/` — the vault's placeholder organisation (InterGalactic Banking Clan), people, classification tags, channels, policies, messages and review state. `lab.ts` is where the vault meets the lab: it reads the customer, its models and their live status from the lab's own data.
- `src/components/HoverCard.tsx` — design-system component for details on hover or focus. `src/components/vault/` — Vault's sidebar, icons and hover-card content.
- `src/data/store.ts`, `src/data/contracts.ts`, `src/data/fulfillment.ts`, `src/data/analysis.ts`, `src/data/features.ts`, `src/data/training.ts`, `src/data/evaluation.ts`, `src/data/deployment.ts` — edits made in the lab, saved in the browser (localStorage).

## Routes

| Route | Page |
| --- | --- |
| `#/overview` | Overview |
| `#/lab` | All customers |
| `#/lab/:customer` | One customer’s solutions |
| `#/lab/:customer/solutions/:solution/:stage` | A solution at a lifecycle stage |
| `#/vault/:view` | Vault messages: `all`, `unread`, `flagged`, `escalated`, `cleared`, `policy-<id>`, `channel-<id>` |
| `#/vault/:view/:message` | A view with a message open |
| `#/vault/policies` | Vault policies |

## Deploy

Pushing to `main` builds and publishes to GitHub Pages through `.github/workflows/deploy.yml`. Turn it on once under Settings → Pages → Source: GitHub Actions.
