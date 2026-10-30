import { useId, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Customer, Solution } from '../../data/customers';
import { logEntry, useContract, useSolutionStage } from '../../data/contracts';
import { useAggregates, useAnalysis } from '../../data/analysis';
import { useFeatures } from '../../data/features';
import { MODELS, pct, resultFor, runProgress, useTraining, valueFor, type ModelKind } from '../../data/training';
import { atThreshold, confusion, meetsContract, resultAt, useEvaluation, workload } from '../../data/evaluation';
import { stageIndex } from '../../data/stages';
import HBarChart from '../../components/charts/HBarChart';
import Select from '../../components/Select';

const n = (x: number) => x.toLocaleString('en-GB');

export default function ModelEvaluation({ customer, solution }: { customer: Customer; solution: Solution }) {
  const [k, setK] = useContract(customer, solution);
  const [stage, setStage] = useSolutionStage(customer, solution);
  const [a] = useAnalysis(customer, solution);
  const [f] = useFeatures(customer, solution, a);
  const [t] = useTraining(customer, solution);
  const agg = useAggregates(customer, solution, a.rules);
  const navigate = useNavigate();
  const base = `/lab/${customer.id}/solutions/${solution.id}`;
  const [risky, other] = solution.labels;

  const trained = t.runs.filter((r) => runProgress(t, r, Date.now()).status === 'Done').map((r) => r.model);
  const results = trained.map((m) => resultFor(customer, solution, m, f));
  const bestPassing = results.filter((r) => meetsContract(r, k)).sort((x, y) => y.byLabel[risky].f1 - x.byLabel[risky].f1)[0]?.model;
  const [e, setE] = useEvaluation(customer, solution, bestPassing ?? trained[0]);
  const inspect: ModelKind | undefined = e.inspect ?? e.chosen?.model ?? bestPassing ?? trained[0];
  const [announce, setAnnounce] = useState('');

  if (!t.continuedAt || !trained.length || stageIndex(stage) < stageIndex('evaluation')) {
    return (
      <section className="contract-status gate" aria-labelledby="gate-h">
        <div className="contract-status__text">
          <h2 id="gate-h" className="contract-status__title">Waiting on training</h2>
          <p className="muted">Evaluation opens once at least one model has finished training and been sent over.</p>
        </div>
        <div className="contract-status__actions">
          <Link className="btn btn--secondary" to={`${base}/training`}>Go to training</Link>
        </div>
      </section>
    );
  }

  const th = (m: ModelKind) => e.thresholds[m] ?? 0.5;
  const tuned = results.map((r) => resultAt(r, risky, th(r.model)));
  const passing = tuned.filter((r) => meetsContract(r, k));
  const insp = tuned.find((r) => r.model === inspect)!;
  const inspPasses = meetsContract(insp, k);

  const choose = (m: ModelKind) => {
    const threshold = th(m);
    setE((p) => ({ ...p, chosen: { model: m, threshold, at: new Date().toISOString() } }));
    setK((p) => ({ ...p, activity: [logEntry(`Chose ${MODELS[m].name.toLowerCase()} for deployment at an alert threshold of ${threshold.toFixed(2)}`), ...p.activity] }));
    if (stage === 'evaluation') setStage('deployment');
    setAnnounce(`${MODELS[m].name} chosen for deployment.`);
  };

  return (
    <div className="contract contract--wide">
      <p className="visually-hidden" role="status" aria-live="polite">{announce}</p>

      <section className={`contract-status${e.chosen ? ' is-locked' : ''}`} aria-labelledby="ev-h">
        <div className="contract-status__text">
          <h2 id="ev-h" className="contract-status__title">
            {e.chosen ? `${MODELS[e.chosen.model].name} chosen for deployment` : 'Choose a model to deploy'}
          </h2>
          <p className="muted">
            {e.chosen
              ? `At an alert threshold of ${e.chosen.threshold.toFixed(2)}. You can still change the choice before it goes live.`
              : `${passing.length} of ${tuned.length} trained models meet the contract at their current thresholds. Only those can be deployed.`}
          </p>
        </div>
        <div className="contract-status__actions">
          {e.chosen && <button type="button" className="btn btn--primary" onClick={() => navigate(`${base}/deployment`)}>Go to deployment</button>}
        </div>
      </section>

      {/* Side by side */}
      <section className="contract-section" aria-labelledby="cmp-h">
        <div className="contract-section__head">
          <h2 id="cmp-h" className="section-title">Side by side</h2>
        </div>
        <p className="section-lede">Metrics on the held-out test set, at each model’s alert threshold. Contract criteria are marked pass or miss.</p>
        <div className="table-wrap">
          <table className="table compare-table">
            <caption className="visually-hidden">Trained models compared</caption>
            <thead>
              <tr>
                <th scope="col">Measure</th>
                {tuned.map((r) => (
                  <th key={r.model} scope="col" className={`num${r.model === inspect ? ' is-inspect' : ''}`}>
                    {MODELS[r.model].name}
                    {e.chosen?.model === r.model && <span className="tag">Chosen</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="row-group"><th scope="rowgroup" colSpan={tuned.length + 1}>On “{risky}”</th></tr>
              {(['precision', 'recall', 'f1'] as const).map((key) => (
                <tr key={key}>
                  <th scope="row">{key === 'f1' ? 'F1 score' : key[0].toUpperCase() + key.slice(1)}</th>
                  {tuned.map((r) => <td key={r.model} className="num">{pct(r.byLabel[risky][key])}</td>)}
                </tr>
              ))}
              <tr className="row-group"><th scope="rowgroup" colSpan={tuned.length + 1}>On “{other}”</th></tr>
              {(['precision', 'recall'] as const).map((key) => (
                <tr key={key}>
                  <th scope="row">{key[0].toUpperCase() + key.slice(1)}</th>
                  {tuned.map((r) => <td key={r.model} className="num">{pct(r.byLabel[other][key])}</td>)}
                </tr>
              ))}
              <tr><th scope="row">Accuracy</th>{tuned.map((r) => <td key={r.model} className="num">{pct(r.accuracy)}</td>)}</tr>
              <tr><th scope="row">Alert threshold</th>{tuned.map((r) => <td key={r.model} className="num">{th(r.model).toFixed(2)}</td>)}</tr>
              <tr className="row-group"><th scope="rowgroup" colSpan={tuned.length + 1}>Contract criteria</th></tr>
              {k.criteria.map((c) => (
                <tr key={c.id}>
                  <th scope="row">{c.metric} on {c.label}, at least {c.minimum}%</th>
                  {tuned.map((r) => {
                    const ok = valueFor(r, c) * 100 >= c.minimum;
                    return <td key={r.model} className={`num pass-cell${ok ? '' : ' is-miss'}`}>{ok ? 'Pass' : 'Miss'}</td>;
                  })}
                </tr>
              ))}
              <tr className="actions-row">
                <th scope="row"><span className="visually-hidden">Actions</span></th>
                {tuned.map((r) => {
                  const ok = meetsContract(r, k);
                  const isChosen = e.chosen?.model === r.model && e.chosen.threshold === th(r.model);
                  return (
                    <td key={r.model} className="num">
                      <div className="cell-actions">
                        <button type="button" className="link-button" onClick={() => setE((p) => ({ ...p, inspect: r.model }))} aria-pressed={r.model === inspect}>
                          {r.model === inspect ? 'Inspecting' : 'Inspect'}<span className="visually-hidden"> {MODELS[r.model].name}</span>
                        </button>
                        <button
                          type="button"
                          className={`btn btn--sm ${isChosen ? 'btn--secondary' : 'btn--primary'}`}
                          aria-disabled={!ok || isChosen}
                          title={!ok ? 'Misses the contract at this threshold' : undefined}
                          onClick={() => ok && !isChosen && choose(r.model)}
                        >
                          {isChosen ? 'Chosen' : 'Choose'}<span className="visually-hidden"> {MODELS[r.model].name}{!ok ? ', unavailable: misses the contract at this threshold' : ''}</span>
                        </button>
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* One model in depth */}
      {insp && agg && (
        <Inspect
          key={insp.model}
          model={insp.model}
          risky={risky}
          other={other}
          threshold={th(insp.model)}
          setThreshold={(v) => setE((p) => ({ ...p, thresholds: { ...p.thresholds, [insp.model]: v } }))}
          base={results.find((r) => r.model === insp.model)!.byLabel[risky]}
          passes={inspPasses}
          criteria={k.criteria.map((c) => ({ text: `${c.metric} on ${c.label} ≥ ${c.minimum}%`, ok: valueFor(insp, c) * 100 >= c.minimum }))}
          volume={agg.volume}
          signals={agg.vocabulary[risky].words.slice(0, 8)}
          inspectOptions={trained}
          onInspect={(m) => setE((p) => ({ ...p, inspect: m }))}
        />
      )}

      {agg && (
        <TryMessage
          models={trained}
          thresholds={Object.fromEntries(trained.map((m) => [m, th(m)]))}
          riskyTerms={[...agg.vocabulary[risky].words, ...agg.vocabulary[risky].pairs].map((x) => x.label)}
          routineTerms={[...agg.vocabulary[other].words, ...agg.vocabulary[other].pairs].map((x) => x.label)}
          risky={risky}
        />
      )}
    </div>
  );
}

/* ---------- Inspect one model ---------- */

function Inspect(props: {
  model: ModelKind; risky: string; other: string; threshold: number; setThreshold: (v: number) => void;
  base: { precision: number; recall: number; f1: number }; passes: boolean; criteria: { text: string; ok: boolean }[];
  volume: Record<string, number>; signals: { label: string; value: number }[];
  inspectOptions: ModelKind[]; onInspect: (m: ModelKind) => void;
}) {
  const id = useId();
  const m = atThreshold(props.base, props.threshold);
  const w = workload(m);
  const cm = confusion(m, props.volume[props.risky] ?? 1000, props.volume[props.other] ?? 1000);
  const top = props.signals[0]?.value || 1;
  const importance = props.signals.map((s, i) => ({ label: s.label, value: Math.round((s.value / top) * 100 * (1 - i * 0.02)) }));

  return (
    <section className="contract-section" aria-labelledby={`${id}-h`}>
      <div className="contract-section__head">
        <h2 id={`${id}-h`} className="section-title">Inspect a model</h2>
        <Select inline className="select--wide" label="Model" value={props.model} onChange={props.onInspect} options={props.inspectOptions.map((m) => ({ value: m, label: MODELS[m].name }))} />
      </div>

      <div className="inspect-grid">
        <div className="panel panel--flat">
          <h3 className="sub-title">Alert threshold</h3>
          <p className="section-lede">How sure the model must be before it flags a message. Higher means fewer, more precise alerts, and more missed cases.</p>
          <div className="threshold">
            <label htmlFor={`${id}-t`} className="field__label">Threshold</label>
            <input
              id={`${id}-t`}
              type="range" min={0.05} max={0.95} step={0.05}
              value={props.threshold}
              onChange={(e) => props.setThreshold(Number(e.target.value))}
              aria-valuetext={`${props.threshold.toFixed(2)}: precision ${pct(m.precision)}, recall ${pct(m.recall)}`}
            />
            <output htmlFor={`${id}-t`} className="threshold__value">{props.threshold.toFixed(2)}</output>
          </div>
          <dl className="model-card__metrics model-card__metrics--4">
            <div><dt>Precision</dt><dd>{pct(m.precision)}</dd></div>
            <div><dt>Recall</dt><dd>{pct(m.recall)}</dd></div>
            <div><dt>F1 score</dt><dd>{pct(m.f1)}</dd></div>
          </dl>
          <p className="workload" aria-live="polite">
            For every 10,000 live messages (assuming 1% are truly “{props.risky}”), reviewers would see about <strong>{n(w.alerts)} alerts</strong>, {n(w.falseAlerts)} of them false, and <strong>{n(w.missed)} real cases</strong> would be missed.
          </p>
          <ul className="criteria-list">
            {props.criteria.map((c) => (
              <li key={c.text} className={`criteria-check${c.ok ? '' : ' is-miss'}`}>
                <svg viewBox="0 0 16 16" aria-hidden="true">{c.ok ? <path d="m3.5 8.5 3 3 6-7" /> : <path d="M4 4l8 8M12 4l-8 8" />}</svg>
                {c.text}: {c.ok ? 'pass' : 'miss'}
              </li>
            ))}
          </ul>
        </div>

        <div className="panel panel--flat">
          <h3 className="sub-title">Confusion matrix</h3>
          <p className="section-lede">The held-out test set: 20% of the imported data, never seen in training.</p>
          <table className="table confusion">
            <caption className="visually-hidden">Confusion matrix for {MODELS[props.model].name}</caption>
            <thead>
              <tr><td /><th scope="col" className="num">Flagged</th><th scope="col" className="num">Not flagged</th></tr>
            </thead>
            <tbody>
              <tr><th scope="row">Really “{props.risky}”</th><td className="num cm-good">{n(cm.tp)}<span>caught</span></td><td className="num">{n(cm.fn)}<span>missed</span></td></tr>
              <tr><th scope="row">Really “{props.other}”</th><td className="num">{n(cm.fp)}<span>false alerts</span></td><td className="num cm-good">{n(cm.tn)}<span>correctly ignored</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="chart-cell chart-cell--solo">
        <HBarChart
          title={`Strongest signals for “${props.risky}” in ${MODELS[props.model].name.toLowerCase()}`}
          unit="relative importance"
          data={importance}
          pattern="diagonalForward"
          max={100}
          summary={`“${importance[0]?.label}” pushes a message toward “${props.risky}” the most. Importance is relative to that term (100).`}
        />
      </div>
    </section>
  );
}

/* ---------- Try a message ---------- */

function TryMessage({ models, thresholds, riskyTerms, routineTerms, risky }: {
  models: ModelKind[]; thresholds: Record<string, number>; riskyTerms: string[]; routineTerms: string[]; risky: string;
}) {
  const [text, setText] = useState('Can you keep this quiet? A small gift for the envoy should speed approval before the vote.');
  const id = useId();
  const out = useMemo(() => {
    const lower = text.toLowerCase();
    const up = riskyTerms.filter((t) => new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(lower));
    const down = routineTerms.filter((t) => new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(lower) && !up.includes(t));
    const raw = up.reduce((s, t) => s + (t.includes(' ') ? 1.1 : 0.7), 0) - down.length * 0.6;
    const scale: Record<ModelKind, number> = { rf: 0.9, nb: 1.15, lr: 1, gb: 0.95, lm: 1.25 };
    const scores = models.map((m) => {
      const z = -1.6 + raw * scale[m] + (m === 'lm' && /quiet|offline|personal|token|worth/.test(lower) ? 0.6 : 0);
      const p = 1 / (1 + Math.exp(-z));
      return { m, p, flag: p >= thresholds[m] };
    });
    return { up, down, scores };
  }, [text, models, thresholds, riskyTerms, routineTerms]);

  return (
    <section className="contract-section" aria-labelledby={`${id}-h`}>
      <div className="contract-section__head">
        <h2 id={`${id}-h`} className="section-title">Try a message</h2>
      </div>
      <p className="section-lede">Write your own example and see how confident each model is that it’s “{risky}”, and which words moved it. Runs in your browser on your text, never on vault data.</p>
      <label className="field field--wide">
        <span className="field__label">Message</span>
        <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <div className="try-out" aria-live="polite">
        <ul className="confidence">
          {out.scores.map(({ m, p, flag }) => (
            <li key={m}>
              <span className="confidence__name">{MODELS[m].name}</span>
              <span className="meter" aria-hidden="true"><span style={{ width: `${p * 100}%` }} /></span>
              <span className="confidence__value tabular">{Math.round(p * 100)}%</span>
              <span className={`confidence__flag${flag ? ' is-flag' : ''}`}>{flag ? 'Flagged' : 'Not flagged'}</span>
            </li>
          ))}
        </ul>
        <div className="why">
          <p><strong>Raised the score:</strong> {out.up.length ? out.up.map((t) => `“${t}”`).join(', ') : 'nothing recognised'}</p>
          <p><strong>Lowered it:</strong> {out.down.length ? out.down.map((t) => `“${t}”`).join(', ') : 'nothing recognised'}</p>
        </div>
      </div>
    </section>
  );
}
