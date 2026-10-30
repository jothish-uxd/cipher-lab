import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Customer, Solution } from '../../data/customers';
import { logEntry, METRIC_HELP, METRICS, useContract, useSolutionStage } from '../../data/contracts';
import { useAnalysis } from '../../data/analysis';
import { useFeatures, activeFeatures } from '../../data/features';
import { useNow } from '../../data/fulfillment';
import {
  MODELS, MODEL_ORDER, checkCriteria, pct, resultFor, runProgress, useTraining,
  type Result,
} from '../../data/training';
import { stageIndex } from '../../data/stages';
import HBarChart from '../../components/charts/HBarChart';

export default function Training({ customer, solution }: { customer: Customer; solution: Solution }) {
  const [k, setK] = useContract(customer, solution);
  const [stage, setStage] = useSolutionStage(customer, solution);
  const [a] = useAnalysis(customer, solution);
  const [f] = useFeatures(customer, solution, a);
  const [t, setT] = useTraining(customer, solution);
  const navigate = useNavigate();
  const base = `/lab/${customer.id}/solutions/${solution.id}`;
  const [announce, setAnnounce] = useState('');

  const running = !!t.startedAt && t.runs.some((r) => runProgress(t, r, Date.now()).status === 'Training');
  const now = useNow(running);
  const progress = t.runs.map((r) => ({ run: r, ...runProgress(t, r, now) }));
  const finished = !!t.startedAt && progress.every((p) => p.status === 'Done' || p.status === 'Stopped');
  const done = progress.filter((p) => p.status === 'Done').map((p) => p.run.model);
  const results: Result[] = done.map((m) => resultFor(customer, solution, m, f));
  const [risky] = solution.labels;

  // Announce each model as it finishes, and the end of training.
  const said = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!t.startedAt) return;
    progress.forEach((p) => {
      const id = t.startedAt + p.run.model;
      if (p.status === 'Done' && !said.current.has(id) && p.run.seconds > 0) {
        said.current.add(id);
        setAnnounce(`${MODELS[p.run.model].name} finished training.`);
      }
    });
    if (finished && !said.current.has(t.startedAt) && t.runs.some((r) => r.seconds > 0)) {
      said.current.add(t.startedAt);
      setAnnounce(`Training finished. ${done.length} ${done.length === 1 ? 'model' : 'models'} ready to compare.`);
    }
  });

  if (!f.lockedAt || stageIndex(stage) < stageIndex('training')) {
    return (
      <section className="contract-status gate" aria-labelledby="gate-h">
        <div className="contract-status__text">
          <h2 id="gate-h" className="contract-status__title">Waiting on features</h2>
          <p className="muted">Training starts once the feature set is locked, so every candidate trains on the same inputs.</p>
        </div>
        <div className="contract-status__actions">
          <Link className="btn btn--secondary" to={`${base}/features`}>Go to feature engineering</Link>
        </div>
      </section>
    );
  }

  const log = (what: string) => setK((prev) => ({ ...prev, activity: [logEntry(what), ...prev.activity] }));
  const start = () => {
    if (!t.selected.length) return;
    setT((p) => ({ ...p, startedAt: new Date().toISOString(), runs: p.selected.map((m) => ({ model: m, seconds: MODELS[m].seconds })), continuedAt: undefined }));
    log(`Started training ${t.selected.length} candidate models`);
    said.current = new Set();
    setAnnounce('Training started.');
  };
  const abort = () => {
    const elapsed = (Date.now() - new Date(t.startedAt!).getTime()) / 1000;
    setT((p) => ({ ...p, runs: p.runs.map((r) => (elapsed < r.seconds ? { ...r, abortedAfter: elapsed } : r)) }));
    log('Stopped training');
    setAnnounce('Training stopped. Finished models are kept.');
  };
  const proceed = () => {
    setT((p) => ({ ...p, continuedAt: new Date().toISOString() }));
    log(`Sent ${done.length} trained models to evaluation`);
    if (stage === 'training') setStage('evaluation');
    navigate(`${base}/evaluation`);
  };

  const best = [...results].sort((x, y) => y.byLabel[risky].f1 - x.byLabel[risky].f1)[0];
  const featureCount = activeFeatures(a, f).length;

  return (
    <div className="contract contract--wide">
      <p className="visually-hidden" role="status" aria-live="polite">{announce}</p>

      <section className={`contract-status${finished && done.length ? ' is-locked' : ''}`} aria-labelledby="tr-h">
        <div className="contract-status__text">
          <h2 id="tr-h" className="contract-status__title">
            {!t.startedAt ? 'Ready to train' : running ? 'Training inside the vault' : done.length ? `${done.length} ${done.length === 1 ? 'model' : 'models'} trained` : 'Training stopped'}
          </h2>
          <p className="muted">
            {!t.startedAt && `Pick the candidates to train on the locked feature set (${featureCount} features). They all train on the same data, so the results compare fairly.`}
            {running && 'Models train one beside another. You can leave this page; training keeps going.'}
            {finished && done.length > 0 && `Each model is checked against the contract’s ${k.criteria.length} success ${k.criteria.length === 1 ? 'criterion' : 'criteria'}. Compare them in full at evaluation.`}
            {finished && done.length === 0 && 'No model finished. Start training again.'}
          </p>
        </div>
        <div className="contract-status__actions">
          {!t.startedAt && <button type="button" className="btn btn--primary" aria-disabled={!t.selected.length} onClick={start}>Start training</button>}
          {running && <button type="button" className="btn btn--secondary" onClick={abort}>Stop training</button>}
          {finished && (
            <div className="confirm">
              <button type="button" className="btn btn--secondary" onClick={() => setT((p) => ({ ...p, startedAt: undefined, runs: [] }))}>Train again</button>
              {done.length > 0 && <button type="button" className="btn btn--primary" onClick={proceed}>Continue to model evaluation</button>}
            </div>
          )}
        </div>
      </section>

      {!t.startedAt ? (
        <section className="contract-section" aria-labelledby="pick-h">
          <div className="contract-section__head">
            <h2 id="pick-h" className="section-title">Candidate models</h2>
          </div>
          <fieldset className="model-picks">
            <legend className="visually-hidden">Choose the models to train</legend>
            {MODEL_ORDER.map((m) => (
              <label key={m} className="model-pick">
                <input
                  type="checkbox"
                  checked={t.selected.includes(m)}
                  onChange={(e) => setT((p) => ({ ...p, selected: e.target.checked ? MODEL_ORDER.filter((x) => x === m || p.selected.includes(x)) : p.selected.filter((x) => x !== m) }))}
                />
                <span className="model-pick__body">
                  <span className="model-pick__name">{MODELS[m].name} <span className="tag">{MODELS[m].family}</span></span>
                  <span className="model-pick__about">{MODELS[m].about}</span>
                </span>
                <span className="model-pick__time">about {MODELS[m].seconds}s here</span>
              </label>
            ))}
          </fieldset>
          {!t.selected.length && <p className="note">Choose at least one model to start training.</p>}
        </section>
      ) : (
        <section className="contract-section" aria-labelledby="runs-h">
          <div className="contract-section__head">
            <h2 id="runs-h" className="section-title">Runs</h2>
          </div>
          <ul className="label-progress label-progress--wide">
            {progress.map(({ run, status, pct: p }) => (
              <li key={run.model} className={`label-row${status === 'Done' ? ' is-ready' : ''}`}>
                <div className="label-row__head">
                  <span className="label-row__name">{MODELS[run.model].name}</span>
                  <span className="label-row__status">{status}</span>
                </div>
                <div className="meter" role="progressbar" aria-label={`${MODELS[run.model].name} training`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p)}>
                  <span style={{ width: `${p}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results.length > 0 && (
        <section className="contract-section" aria-labelledby="res-h">
          <div className="contract-section__head">
            <h2 id="res-h" className="section-title">Results on “{risky}”</h2>
          </div>
          <details className="metric-help">
            <summary>What these numbers mean</summary>
            <dl>
              {METRICS.map((m) => <div key={m}><dt>{m}</dt><dd>{METRIC_HELP[m]}</dd></div>)}
            </dl>
          </details>

          <ul className="model-cards">
            {results.map((r) => {
              const c = checkCriteria(r, k);
              const m = r.byLabel[risky];
              const isBest = r === best && results.length > 1;
              return (
                <li key={r.model} className={`model-card${c.misses.length === 0 ? ' is-pass' : ''}`}>
                  <div className="model-card__head">
                    <h3 className="model-card__name">{MODELS[r.model].name}</h3>
                    {isBest && <span className="tag">Best F1</span>}
                  </div>
                  <dl className="model-card__metrics">
                    <div><dt>Precision</dt><dd>{pct(m.precision)}</dd></div>
                    <div><dt>Recall</dt><dd>{pct(m.recall)}</dd></div>
                    <div><dt>F1 score</dt><dd>{pct(m.f1)}</dd></div>
                    <div><dt>Accuracy</dt><dd>{pct(r.accuracy)}</dd></div>
                  </dl>
                  <p className={`criteria-check${c.misses.length ? ' is-miss' : ''}`}>
                    <svg viewBox="0 0 16 16" aria-hidden="true">{c.misses.length ? <path d="M4 4l8 8M12 4l-8 8" /> : <path d="m3.5 8.5 3 3 6-7" />}</svg>
                    {c.misses.length === 0
                      ? (c.total === 1 ? 'Meets the contract criterion' : c.total === 2 ? 'Meets both contract criteria' : `Meets all ${c.total} contract criteria`)
                      : `Misses ${c.misses.map((x) => `${x.metric.toLowerCase()} on ${x.label} (needs ${x.minimum}%)`).join(', ')}`}
                  </p>
                </li>
              );
            })}
          </ul>

          {results.length > 1 && (
            <div className="chart-cell chart-cell--solo">
              <HBarChart
                title={`F1 score on “${risky}”, by model`}
                unit="percent F1"
                data={[...results].sort((x, y) => y.byLabel[risky].f1 - x.byLabel[risky].f1).map((r) => ({ label: MODELS[r.model].name, value: Math.round(r.byLabel[risky].f1 * 1000) / 10 }))}
                pattern="solid"
                max={100}
              />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
