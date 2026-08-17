# Proofline: Copilot Value Evidence MVP

Proofline is a working prototype for measuring the business value of consumption-priced AI products, initially Microsoft Copilot Cowork and GitHub Copilot. It connects cost and usage data to experience sampling, testable business hypotheses, operational outcome studies, and evidence-adjusted ROI.

The goal is not to manufacture one precise-looking number. It is to show what was spent, what changed, which business result followed, and how much confidence decision-makers should place in each claim.

## Why Proofline

Product telemetry can show consumption, active users, feature use, and accepted suggestions. It cannot establish that assisted work was valuable, that Copilot caused an improvement, or that saved time became a business result.

Proofline closes that gap by:

- Separating adoption and time saved from realized business value.
- Sampling varied knowledge work instead of requiring employees to log every AI-assisted task.
- Testing repeatable, high-value processes against operational measures.
- Distinguishing observed, estimated, modelled, and anecdotal evidence.
- Making assumptions, uncertainty, and evidence discounts visible and adjustable.

## How Value Is Measured

### Evidence chain

Every claim follows four levels:

1. **Consumption:** What did Copilot cost?
2. **Activity:** Which products and broad work categories were used?
3. **Effect:** Did AI change speed, quality, scope, confidence, or risk?
4. **Business value:** Which Microsoft Business Value pillar did the result advance?

The headline model is:

$$
\mathrm{Net\ value} =
\sum \mathrm{Adjusted\ pillar\ value} -
\mathrm{AI\ cost}
$$

A production model should also subtract implementation, training, and change-management costs when those inputs are available.

### Business Value pillars

| Pillar | Example Copilot use cases | Measurable result | Supporting evidence |
| --- | --- | --- | --- |
| **Improved Performance** | Generate tests, summarize case material, or prepare proposals faster | Higher throughput, shorter cycle time, or faster customer response | Deployment data, case metrics, CRM timestamps, and matched-team studies |
| **Cost Savings** | Reduce external research, repetitive contractor work, or processing effort | Lower third-party spend, overtime, hiring, or processing cost | Finance records, vendor invoices, workforce plans, and cost baselines |
| **Innovation / Transformation** | Create an AI-assisted service or redesign an end-to-end workflow | New revenue, expanded service scope, new products, or a different operating model | Product adoption, revenue attribution, process measures, and customer outcomes |
| **Risk Mitigation** | Improve code review, policy checks, incident analysis, or control coverage | Fewer defects, less rework, better compliance, or reduced exposure | Defect rates, audit findings, incident records, and control tests |

Each claim is assigned to one primary pillar to prevent double counting. For example, faster proposal drafting is Improved Performance when it shortens response time, Cost Savings only when it reduces spend, and Innovation / Transformation only when it enables a new offer or operating model.

### Two complementary measurement workflows

| Workflow | Best suited to | What it provides | Main limitation |
| --- | --- | --- | --- |
| **Stratified experience sampling** | Ad hoc drafting, research, analysis, communication, and other work that varies by person | Broad coverage, estimated effects, qualitative context, and discovery of valuable use cases | Self-reporting and limited causal attribution |
| **Focused outcome studies** | Repeatable processes such as software delivery, case handling, proposals, or incident response | Operational results tested with matched teams, stable pre/post measures, or staggered rollouts | More effort and practical only for selected processes |

The workflows form an evidence funnel. Surveys reveal where acceleration occurs and identify claims worth testing. Outcome studies determine whether the most valuable effects are repeatable and plausibly attributable to Copilot. Operational imports, financial data, hypotheses, and qualitative cases provide additional evidence; surveys and studies are the MVP's two primary measurement workflows, not the only possible sources.

### Evidence types, confidence, and valuation

Evidence type describes the basis of a contribution:

- **Observed:** measured in an operational system or outcome study.
- **Estimated:** inferred from representative samples or another estimation method.
- **Modelled:** calculated from observed or estimated inputs using explicit assumptions.
- **Anecdotal:** supported by a qualitative case or individual account.

These types can coexist within one claim. A study may observe an 18% cycle-time reduction and then model its financial value. A survey may provide an estimated effect plus an anecdotal explanation.

Confidence is separate from evidence type. It reflects representativeness, baseline quality, comparison design, sample size, source reliability, and uncertainty. Proofline applies both dimensions to each value contribution:

$$
\mathrm{Adjusted\ contribution} =
\mathrm{Gross\ contribution} \times
\mathrm{Evidence\ weight} \times
\mathrm{Confidence\ multiplier}
$$

Adjusted contributions feed pillar totals, realized value, net value, and ROI. The evidence-health score shows how much gross value remains after these adjustments:

$$
\mathrm{Evidence\ health} =
\frac{\mathrm{Total\ adjusted\ value}}
{\mathrm{Total\ gross\ value}} \times 100
$$

The MVP uses the low end of the value interval as its headline, shows the midpoint as upside, and then applies the customer-selected evidence and confidence multipliers. Quantitative operational results with a credible baseline generally deserve the greatest weight, but study design and source quality matter more than whether a result is merely numeric.

## What the MVP Includes

- **Portfolio overview:** evidence-adjusted value, gross value, net value, ROI, evidence mix, health score, four-pillar composition, and team results.
- **Editable valuation policy:** nine persisted sliders for cost, realization, evidence weights, and confidence multipliers.
- **Experience sampling:** a functional 30-second survey covering product, work type, time saved, effect, and enabled outcome.
- **Value hypothesis registry:** persisted claims connecting an AI use case to an expected effect, business outcome, and evidence source.
- **Outcome studies:** matched-team, pre/post, and staggered-rollout examples with optional baselines and explicit comparison bases.
- **CSV ingestion:** browser-side parsing and field checks for GitHub Copilot, Microsoft 365, and employee mapping exports.
- **Evidence labelling:** Observed, Estimated, Modelled, and Anecdotal records with separate confidence levels.

All portfolio figures, contribution assignments, confidence levels, and default weights are illustrative seed data, not customer results.

## Screenshots

### Portfolio overview

![Proofline portfolio overview showing spend, evidence-adjusted value, ROI assumptions, evidence health, and the four Business Value pillars](public/screenshots/portfolio-overview.png)

| Experience sampling | Outcome studies |
| --- | --- |
| ![Proofline sample responses view showing collection progress and response metrics](public/screenshots/sample-responses.png) | ![Proofline outcome studies view showing study designs, measured results, and confidence](public/screenshots/outcome-studies.png) |

## Customer-Adjustable Controls

Every slider immediately recomputes affected contributions, pillar totals, evidence health, net value, and ROI. Settings persist in browser storage; **Reset to defaults** restores all nine controls.

### Valuation inputs

| Slider | Default and range | What it controls | When to adjust it |
| --- | --- | --- | --- |
| **Loaded hourly cost** | $65/hour; $30-$150 | Converts estimated productive time into gross Improved Performance value. | Use the finance-approved blended cost of the measured population, including relevant employment overhead. Change it when workforce mix or costing policy changes; do not substitute an external billing rate unless that is the claimed value mechanism. |
| **Realization factor** | 55%; 0%-100% | The share of estimated productivity capacity that becomes an evidenced business result. | Raise it when released capacity consistently becomes measured throughput, faster delivery, avoided hiring, or another result. Lower it when savings are self-reported, demand is constrained, bottlenecks prevent conversion, or no downstream result can be shown. |

### Evidence weights

These sliders define the base policy for every contribution carrying an evidence label. A 100% setting applies no evidence-type discount; 0% excludes that type from adjusted value.

| Slider | Default | When to adjust it |
| --- | ---: | --- |
| **Observed** | 100% | Usually highest. Lower it if operational measures have weak attribution, unstable definitions, poor data quality, or no credible comparison. |
| **Estimated** | 85% | Raise it for representative, low-bias samples calibrated against observed outcomes. Lower it for small, voluntary, skewed, or unvalidated samples. |
| **Modelled** | 75% | Raise it when finance approves a back-tested model based mostly on observed inputs. Lower it when assumptions are volatile, indirect, or weakly calibrated. |
| **Anecdotal** | 40% | Lower it, potentially to 0%, when individual cases cannot support financial attribution. Raise it cautiously for documented and corroborated interim evidence. |

### Confidence multipliers

These sliders apply a second adjustment to contributions tagged High, Medium, or Low confidence without changing their evidence type.

| Slider | Default | When to adjust it |
| --- | ---: | --- |
| **High** | 100% | Keep at 100% when High means the organization's approval threshold has been met. Lower it if even the strongest claims require a policy reserve. |
| **Medium** | 90% | Set it to match tolerance for material limitations such as an incomplete baseline, moderate sample, or attribution concern. |
| **Low** | 75% | Lower it when directional claims should contribute little or nothing to financial decisions. Raise it only when Low reflects a temporary documentation gap rather than weak evidence. |

Percentage controls move in five-point increments. Finance and measurement owners should approve and version the policy in production. Weights should reflect evidence quality, historical calibration, and decision risk, never a desired ROI target.

## Privacy and MVP Boundaries

The prototype is a React and TypeScript single-page app built with Vite. It uses `localStorage` for responses, hypotheses, imports, and assumptions; Papa Parse for CSV processing; and Lucide React for icons.

The intended privacy controls are:

- Aggregate reporting by default.
- No prompt, document, message, or source-code inspection.
- Minimum group-size thresholds for team reporting.
- Role-based access for portfolio owners, managers, and study analysts.

The MVP has no backend, tenant authentication, Microsoft Graph or GitHub API connection, Teams bot, governed retention, or production statistical engine. Production deployments should also pseudonymize identifiers, define retention and permitted purposes, and involve privacy teams and employee representatives.

## Production Path

1. Entra ID authentication and role-based access control.
2. A governed, tenant-isolated database with retention controls and audit history.
3. Scheduled aggregate imports from Microsoft and GitHub reporting APIs.
4. Pseudonymous HR or identity mapping with minimum group sizes.
5. Balanced sampling, non-response analysis, and confidence intervals from real samples.
6. Teams adaptive-card delivery with reminders and opt-out controls.
7. Connectors to delivery, CRM, case management, incident, and finance systems.
8. Calibrated evidence weights and valuation assumptions with approval and version history.

## Run Locally

Requirements: a current Node.js release and npm.

```bash
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

To validate a production build:

```bash
npm run build
npm run lint
```

## Run Tests

The project uses [Vitest](https://vitest.dev) with Testing Library. Unit tests in `src/calculations.test.ts` cover the valuation model (evidence and confidence weighting, pillar totals, evidence health, ROI, and survey-hours estimation), and integration tests in `src/App.test.tsx` drive the UI for each workflow the README describes: the portfolio overview, editable valuation sliders, experience-sampling survey, value hypotheses, outcome studies, and CSV ingestion.

Run the full suite once:

```bash
npm run test
```

Or run in watch mode during development:

```bash
npm run test:watch
```