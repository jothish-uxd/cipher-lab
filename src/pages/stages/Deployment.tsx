import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Customer, Solution } from '../../data/customers';
import { CURRENT_USER } from '../../data/customers';
import { logEntry, useContract, useSolutionStage, type Contract } from '../../data/contracts';
import { useAnalysis } from '../../data/analysis';
import { useFeatures, activeFeatures, inputCount } from '../../data/features';
import { useFulfillment, useNow } from '../../data/fulfillment';
import { MODELS, pct, resultFor, runProgress, useTraining } from '../../data/training';
import { atThreshold, meetsContract, resultAt, useEvaluation, workload } from '../../data/evaluation';
import { DEPLOY_SECONDS, nextVersion, serviceName, useDeployment, type Version } from '../../data/deployment';
import { stageIndex } from '../../data/stages';
import Toggle from '../../components/Toggle';
import HBarChart from '../../components/charts/HBarChart';

const n = (x: number) => x.toLocaleString('en-GB');
const fmtTime = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtDay = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return (h >>> 0) / 4294967296; };

export default function Deployment({ customer, solution }: { customer: Customer; solution: Solution }) {
  const [k, setK] = useContract(customer, solution);
  const [stage] = useSolutionStage(customer, solution);
  const [a] = useAnalysis(customer, solution);
  const [f] = useFeatures(customer, solution, a);
  const [t] = useTraining(customer, solution);
  const [requests] = useFulfillment(customer, solution);
  const [risky] = solution.labels;

  // Same default choice as evaluation, for solutions that arrive here already deployed.
  const trained = t.runs.filter((r) => runProgress(t, r, Date.now()).status === 'Done').map((r) => r.model);
  const results = trained.map((m) => resultFor(customer, solution, m, f));
  const bestPassing = results.filter((r) => meetsContract(r, k)).sort((x, y) => y.byLabel[risky].f1 - x.byLabel[risky].f1)[0]?.model ?? trained[0];
  const [e] = useEvaluation(customer, solution, bestPassing);
  const [d, setD] = useDeployment(customer, solution, e.chosen?.model ?? bestPassing);
  const base = `/lab/${customer.id}/solutions/${solution.id}`;
  const [announce, setAnnounce] = useState('');

  const latest = d.versions[0];
  const deploying = !!latest && Date.now() - new Date(latest.at).getTime() < DEPLOY_SECONDS * 1000;
  const now = useNow(deploying || !!d.live);
  const stillDeploying = !!latest && now - new Date(latest.at).getTime() < DEPLOY_SECONDS * 1000;

  const [name, setName] = useState(() => serviceName(customer, solution, d.versions.length + 1));
  const [description, setDescription] = useState(`Flags ${risky.toLowerCase()} in ${customer.name} communications for compliance review.`);

  if (!e.chosen || stageIndex(stage) < stageIndex('deployment')) {
    return (
      <section className="contract-status gate" aria-labelledby="gate-h">
        <div className="contract-status__text">
          <h2 id="gate-h" className="contract-status__title">Waiting on a chosen model</h2>
          <p className="muted">Deployment opens once a model that meets the contract is chosen at evaluation.</p>
        </div>
        <div className="contract-status__actions">
          <Link className="btn btn--secondary" to={`${base}/evaluation`}>Go to model evaluation</Link>
        </div>
      </section>
    );
  }

  const chosen = e.chosen;
  const log = (what: string) => setK((p) => ({ ...p, activity: [logEntry(what), ...p.activity] }));
  const live = d.versions.find((v) => v.version === d.live);
  const pending = !!latest && latest.version !== d.live && !stillDeploying;
  const chosenIsDeployed = !!latest && latest.model === chosen.model && latest.threshold === chosen.threshold;

  const deploy = (ev: FormEvent) => {
    ev.preventDefault();
    const v: Version = {
      version: nextVersion(d.versions),
      model: chosen.model,
      threshold: chosen.threshold,
      name: name.trim() || serviceName(customer, solution, d.versions.length + 1),
      description: description.trim(),
      by: CURRENT_USER.name,
      at: new Date().toISOString(),
    };
    setD((p) => ({ ...p, versions: [v, ...p.versions] }));
    log(`Deployed ${v.name} version ${v.version} to the vault`);
    setAnnounce(`Deploying version ${v.version}.`);
    setName(serviceName(customer, solution, d.versions.length + 2));
  };
  const makeLive = (v: Version) => {
    setD((p) => ({ ...p, live: v.version, liveSince: new Date().toISOString() }));
    log(`Put version ${v.version} live in surveillance`);
    setAnnounce(`Version ${v.version} is live.`);
  };
  const setOn = (on: boolean) => {
    if (on && latest) return makeLive(live ?? latest);
    setD((p) => ({ ...p, live: undefined, liveSince: undefined }));
    log('Switched surveillance off');
    setAnnounce('Surveillance switched off.');
  };

  const nf = activeFeatures(a, f);
  const channels = requests.find((r) => r.importedAt)?.channels ?? [];
  const inputs = nf.reduce((s, id) => s + inputCount(id, f, channels.length), 0);
  const status = (v: Version) =>
    v === latest && stillDeploying ? 'Deploying' : v.version === d.live ? 'Live' : 'Standby';

  return (
    <div className="contract contract--wide">
      <p className="visually-hidden" role="status" aria-live="polite">{announce}</p>

      <section className={`contract-status${live ? ' is-locked' : ''}`} aria-labelledby="dp-h">
        <div className="contract-status__text">
          <h2 id="dp-h" className="contract-status__title">
            {live ? `Live in surveillance: ${live.name} ${live.version}` : stillDeploying ? `Deploying version ${latest.version}` : latest ? 'Deployed, not live' : 'Ready to deploy'}
          </h2>
          <p className="muted">
            {live && `Scoring new ${customer.name} messages inside the vault since ${fmtTime.format(new Date(d.liveSince!))}. Flagged messages go to compliance reviewers.`}
            {!live && stillDeploying && 'Building the service inside the vault. This takes a few seconds here.'}
            {!live && !stillDeploying && latest && 'The service is running in the vault but not scoring live messages. Switch on surveillance when the customer is ready.'}
            {!latest && `${MODELS[chosen.model].name} at an alert threshold of ${chosen.threshold.toFixed(2)}, as chosen at evaluation.`}
          </p>
        </div>
        <div className="contract-status__actions">
          {stillDeploying ? <span className="pulse" aria-hidden="true" /> : latest && (
            <Toggle checked={!!live} onChange={setOn} label={`${solution.name} in surveillance`} />
          )}
        </div>
      </section>

      {/* Deploy a version */}
      {!chosenIsDeployed && (
        <section className="contract-section" aria-labelledby="new-h">
          <div className="contract-section__head">
            <h2 id="new-h" className="section-title">Deploy version {nextVersion(d.versions)}</h2>
          </div>
          <p className="section-lede">
            {MODELS[chosen.model].name}, alert threshold {chosen.threshold.toFixed(2)}, trained on {nf.length} features ({n(inputs)} inputs).
            {latest ? ' It will deploy on standby beside the live version, so you can switch over when ready.' : ''}
          </p>
          <form className="form" onSubmit={deploy}>
            <div className="form-grid form-grid--2">
              <label className="field">
                <span className="field__label">Service name</span>
                <input type="text" value={name} onChange={(ev) => setName(ev.target.value)} required />
              </label>
              <label className="field">
                <span className="field__label">Description</span>
                <input type="text" value={description} onChange={(ev) => setDescription(ev.target.value)} />
              </label>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn--primary">Deploy to the vault</button>
            </div>
          </form>
        </section>
      )}

      {/* Versions */}
      {d.versions.length > 0 && (
        <section className="contract-section" aria-labelledby="ver-h">
          <div className="contract-section__head">
            <h2 id="ver-h" className="section-title">Versions</h2>
          </div>
          <p className="section-lede">Only one version is live at a time. Standby versions can be put live in one step, so rolling back is instant.</p>
          <div className="table-wrap">
            <table className="table">
              <caption className="visually-hidden">Deployed versions</caption>
              <thead>
                <tr>
                  <th scope="col">Version</th>
                  <th scope="col">Service</th>
                  <th scope="col">Model</th>
                  <th scope="col" className="num">Threshold</th>
                  <th scope="col">Deployed by</th>
                  <th scope="col">Deployed</th>
                  <th scope="col">Status</th>
                  <th scope="col"><span className="visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {d.versions.map((v) => {
                  const st = status(v);
                  return (
                    <tr key={v.version}>
                      <th scope="row"><code className="id">{v.version}</code></th>
                      <td><span className="cell-strong">{v.name}</span><span className="cell-sub">{v.description}</span></td>
                      <td>{MODELS[v.model].name}</td>
                      <td className="num">{v.threshold.toFixed(2)}</td>
                      <td>{v.by}</td>
                      <td>{fmtTime.format(new Date(v.at))}</td>
                      <td><span className={`status${st === 'Live' ? ' status--in-progress' : ''}`}>{st}</span></td>
                      <td className="row-actions">
                        {st === 'Standby' && (
                          <button type="button" className="link-button" onClick={() => makeLive(v)}>
                            {d.live ? 'Switch to this' : 'Put live'}<span className="visually-hidden"> version {v.version}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pending && d.live && <p className="note">Version {latest.version} is on standby. Switch to it when you’re ready; the live version keeps running until then.</p>}
        </section>
      )}

      {/* Runtime */}
      {(live ?? latest) && !stillDeploying && (
        <section className="contract-section" aria-labelledby="rt-h">
          <div className="contract-section__head">
            <h2 id="rt-h" className="section-title">Runtime</h2>
          </div>
          <dl className="detail-grid">
            <div className="detail-grid__wide"><dt>Endpoint, reachable only inside the vault</dt><dd><code className="id">https://{customer.id}.vault.cipherlab.internal/score/{(live ?? latest).name}</code></dd></div>
            <div><dt>Container image</dt><dd><code className="id">sha256:{Math.floor(hash((live ?? latest).name + (live ?? latest).version) * 0xffffffff).toString(16).padStart(8, '0')}…</code></dd></div>
            <div><dt>Vault region</dt><dd>{solution.vault}</dd></div>
            <div><dt>Model</dt><dd>{MODELS[(live ?? latest).model].name}</dd></div>
            <div><dt>Alert threshold</dt><dd>{(live ?? latest).threshold.toFixed(2)}</dd></div>
            <div><dt>Features</dt><dd>{nf.length} features, {n(inputs)} inputs</dd></div>
          </dl>
        </section>
      )}

      {/* Monitoring */}
      {live && <Monitoring customer={customer} solution={solution} live={live} since={d.liveSince!} now={now} baseMetrics={results.find((r) => r.model === live.model)} k={k} risky={risky} base={base} />}
    </div>
  );
}

function Monitoring({ customer: c, solution: s, live: v, since, now: nowMs, baseMetrics, k, risky, base }: {
  customer: Customer; solution: Solution; live: Version; since: string; now: number; baseMetrics?: ReturnType<typeof resultFor>;
  k: Contract; risky: string; base: string;
}) {
  const seed = `${c.id}/${s.id}/${v.version}`;
  const m = baseMetrics ? atThreshold(resultAt(baseMetrics, risky, 0.5).byLabel[risky], v.threshold) : { precision: 0.85, recall: 0.8, f1: 0.82 };
  const alertRate = workload(m).alerts / 10000;
  const perWeek = Math.round(40000 + hash(seed) * 80000);
  const days = (nowMs - new Date(since).getTime()) / 86400000;
  const weeks = Math.floor(days / 7);
  const fresh = weeks < 1;
  // Fresh deployments tick up live so the demo shows activity; older ones show weekly history.
  const scored = fresh ? Math.round(((nowMs - new Date(since).getTime()) / 1000) * 37) : Math.round(perWeek * days / 7);
  const alerts = Math.round(scored * alertRate);
  const weekly = Array.from({ length: Math.min(weeks, 8) }, (_, i) => {
    const w = weeks - Math.min(weeks, 8) + i;
    const start = new Date(new Date(since).getTime() + w * 7 * 86400000);
    return { label: `Week of ${fmtDay.format(start)}`, value: Math.round(perWeek * alertRate * (0.85 + hash(seed + w) * 0.3)) };
  });
  const drift = fresh ? null : hash(seed + 'drift') > 0.7 ? 'Moderate' : 'Low';
  const confirmed = Math.max(0.5, m.precision - (drift === 'Moderate' ? 0.06 : 0.01) + (hash(seed + 'c') - 0.5) * 0.02);
  const precisionCriterion = k.criteria.find((x) => x.metric === 'Precision' && x.label === risky);
  const below = !!precisionCriterion && confirmed * 100 < precisionCriterion.minimum;

  return (
    <section className="contract-section" aria-labelledby="mon-h">
      <div className="contract-section__head">
        <h2 id="mon-h" className="section-title">Monitoring</h2>
      </div>
      <p className="section-lede">How the live model is doing, from reviewer decisions and input statistics. Still aggregates only.</p>
      <dl className="stat-row">
        <div><dt>Messages scored</dt><dd className="tabular">{n(scored)}</dd></div>
        <div><dt>Alerts raised</dt><dd className="tabular">{n(alerts)}</dd></div>
        <div><dt>Confirmed by reviewers</dt><dd>{fresh ? <span className="muted">After first reviews</span> : pct(confirmed)}</dd></div>
        <div><dt>Input drift</dt><dd>{drift ?? <span className="muted">Not enough data yet</span>}</dd></div>
      </dl>
      {!fresh && (
        <p className={`criteria-check${below ? ' is-miss' : ''}`}>
          <svg viewBox="0 0 16 16" aria-hidden="true">{below ? <path d="M4 4l8 8M12 4l-8 8" /> : <path d="m3.5 8.5 3 3 6-7" />}</svg>
          {precisionCriterion
            ? below
              ? <>Confirmed precision is below the contract’s {precisionCriterion.minimum}%. <Link to={`${base}/training`}>Retrain with fresh data</Link>.</>
              : `Confirmed precision meets the contract’s ${precisionCriterion.minimum}% in production.`
            : 'No precision criterion in the contract to check against.'}
          {drift === 'Moderate' && !below && ' Input drift is moderate: messages are starting to look different from the training data. Plan a retrain.'}
        </p>
      )}
      {weekly.length > 0 ? (
        <div className="chart-cell chart-cell--solo">
          <HBarChart title="Alerts per week" unit="alerts" data={weekly} pattern="solid"
            summary={`About ${n(Math.round(weekly.reduce((x, y) => x + y.value, 0) / weekly.length))} alerts a week over the last ${weekly.length} weeks.`} />
        </div>
      ) : (
        <p className="note">Weekly figures appear after the first full week live.</p>
      )}
    </section>
  );
}
