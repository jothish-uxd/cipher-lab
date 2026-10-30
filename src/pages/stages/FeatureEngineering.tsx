import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Customer, Solution } from '../../data/customers';
import { logEntry, useContract, useSolutionStage } from '../../data/contracts';
import { useFulfillment } from '../../data/fulfillment';
import { NGRAM_LABEL, useAnalysis, type NGram, type Rules } from '../../data/analysis';
import {
  FEATURE_HELP, FEATURE_NAME, activeFeatures, inputCount, offeredFeatures, useFeatures,
  type FeatureId, type FeatureSettings,
} from '../../data/features';
import { stageIndex } from '../../data/stages';
import Select from '../../components/Select';

const n = (x: number) => x.toLocaleString('en-GB');
const inputsText = (x: number) => `${n(x)} ${x === 1 ? 'input' : 'inputs'}`;

export default function FeatureEngineering({ customer, solution }: { customer: Customer; solution: Solution }) {
  const [, setK] = useContract(customer, solution);
  const [stage, setStage] = useSolutionStage(customer, solution);
  const [a] = useAnalysis(customer, solution);
  const [f, setF] = useFeatures(customer, solution, a);
  const [requests] = useFulfillment(customer, solution);
  const [open, setOpen] = useState<FeatureId | null>(null);
  const [announce, setAnnounce] = useState('');
  const base = `/lab/${customer.id}/solutions/${solution.id}`;
  const channels = requests.find((r) => r.importedAt)?.channels ?? [];

  if (!a.sentAt || stageIndex(stage) < stageIndex('features')) {
    return (
      <section className="contract-status gate" aria-labelledby="gate-h">
        <div className="contract-status__text">
          <h2 id="gate-h" className="contract-status__title">Waiting on analysis</h2>
          <p className="muted">Features come from what you choose in data analysis. Send at least one analysis over to start.</p>
        </div>
        <div className="contract-status__actions">
          <Link className="btn btn--secondary" to={`${base}/analysis`}>Go to data analysis</Link>
        </div>
      </section>
    );
  }

  const locked = !!f.lockedAt;
  const active = activeFeatures(a, f);
  const available: FeatureId[] = [
    ...offeredFeatures(a).filter((id) => f.removed.includes(id)),
    ...(!f.embedding.added || f.removed.includes('embedding') ? ['embedding' as FeatureId] : []),
  ];
  const total = active.reduce((sum, id) => sum + inputCount(id, f, channels.length), 0);
  const log = (what: string) => setK((prev) => ({ ...prev, activity: [logEntry(what), ...prev.activity] }));
  const say = (what: string) => setAnnounce(what);

  const remove = (id: FeatureId) => {
    setF((p) => ({ ...p, removed: [...new Set([...p.removed, id])] }));
    if (open === id) setOpen(null);
    log(`Removed the ${FEATURE_NAME[id].toLowerCase()} feature`);
    say(`${FEATURE_NAME[id]} removed. It’s listed under available features.`);
  };
  const add = (id: FeatureId) => {
    setF((p) => ({
      ...p,
      removed: p.removed.filter((x) => x !== id),
      embedding: id === 'embedding' ? { added: true } : p.embedding,
    }));
    log(`Added the ${FEATURE_NAME[id].toLowerCase()} feature`);
    say(`${FEATURE_NAME[id]} added to the feature set.`);
  };
  const lock = () => {
    if (!active.length) return;
    setF((p) => ({ ...p, lockedAt: new Date().toISOString() }));
    log(`Locked ${active.length} features (${n(total)} model inputs) for training`);
    if (stage === 'features') setStage('training');
    setOpen(null);
    say('Feature set locked. Training can start.');
  };
  const unlock = () => {
    setF((p) => ({ ...p, lockedAt: undefined }));
    log('Unlocked the feature set for editing');
    say('Feature set unlocked.');
  };

  return (
    <div className="contract">
      <p className="visually-hidden" role="status" aria-live="polite">{announce}</p>

      <section className={`contract-status${locked ? ' is-locked' : ''}`} aria-labelledby="fe-h">
        <div className="contract-status__text">
          <h2 id="fe-h" className="contract-status__title">
            {locked ? 'Feature set locked' : `${active.length} ${active.length === 1 ? 'feature' : 'features'}, ${n(total)} model inputs`}
          </h2>
          <p className="muted">
            {locked
              ? `Every candidate model trains on these ${active.length} features (${n(total)} inputs), so their results compare fairly.`
              : 'Tune each feature, add or remove features, then lock the set. Every candidate model trains on the same set.'}
          </p>
        </div>
        <div className="contract-status__actions">
          {locked ? (
            <div className="confirm">
              <button type="button" className="btn btn--secondary" onClick={unlock}>Unlock to edit</button>
              <Link className="btn btn--primary" to={`${base}/training`}>Go to training</Link>
            </div>
          ) : (
            <button type="button" className="btn btn--primary" aria-disabled={!active.length} onClick={lock}>Lock features and start training</button>
          )}
        </div>
      </section>

      <section className="contract-section" aria-labelledby="fs-h">
        <div className="contract-section__head">
          <h2 id="fs-h" className="section-title">In this feature set</h2>
        </div>
        {active.length === 0 ? (
          <p className="empty-line">No features yet. Add one from the list below.</p>
        ) : (
          <ul className="feature-rows">
            {active.map((id) => (
              <FeatureRow
                key={id}
                id={id}
                f={f}
                setF={setF}
                channels={channels}
                locked={locked}
                open={open === id}
                onToggle={() => setOpen(open === id ? null : id)}
                onRemove={() => remove(id)}
              />
            ))}
          </ul>
        )}
        <p className="feature-total">
          <span>Total model inputs</span>
          <strong className="tabular">{n(total)}</strong>
        </p>
      </section>

      {!locked && available.length > 0 && (
        <section className="contract-section" aria-labelledby="av-h">
          <div className="contract-section__head">
            <h2 id="av-h" className="section-title">Available to add</h2>
          </div>
          <ul className="feature-rows feature-rows--available">
            {available.map((id) => (
              <li key={id} className="feature-row">
                <div className="feature-row__main">
                  <div>
                    <h3 className="feature-row__name">{FEATURE_NAME[id]}{id === 'embedding' && <span className="tag">New</span>}</h3>
                    <p className="feature-row__desc">{FEATURE_HELP[id]}</p>
                  </div>
                  <span className="feature-row__inputs tabular">{inputsText(inputCount(id, f, channels.length))}</span>
                  <div className="feature-row__actions">
                    <button type="button" className="btn btn--secondary btn--sm" onClick={() => add(id)}>
                      Add<span className="visually-hidden"> {FEATURE_NAME[id]}</span>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Preview rules={a.rules} f={f} active={active} />
    </div>
  );
}

/* ---------- One feature ---------- */

function FeatureRow({ id, f, setF, channels, locked, open, onToggle, onRemove }: {
  id: FeatureId; f: FeatureSettings; setF: (fn: (p: FeatureSettings) => FeatureSettings) => void; channels: string[];
  locked: boolean; open: boolean; onToggle: () => void; onRemove: () => void;
}) {
  const editorId = useId();
  const v = f.vocabulary;
  const summary: Record<FeatureId, string> = {
    vocabulary: `${v.ngrams.map((g, i) => (i === 0 ? NGRAM_LABEL[g] : NGRAM_LABEL[g].toLowerCase())).join(', ')}; up to ${n(v.maxTerms)} terms each; terms in ${v.minDf}–${v.maxDf}% of messages; ${v.weighting === 'tfidf' ? 'weighted by rarity' : 'plain counts'}`,
    channels: channels.join(', ') || 'Channels from the data request',
    length: `Counted in ${f.length.unit}`,
    sentiment: f.sentiment.form === 'score' ? 'One score from negative to positive' : 'Negative, neutral or positive',
    embedding: '384 numbers per message from a language model running in the vault',
  };
  const editable = id === 'vocabulary' || id === 'length' || id === 'sentiment';
  const setVocab = (patch: Partial<FeatureSettings['vocabulary']>) => setF((p) => ({ ...p, vocabulary: { ...p.vocabulary, ...patch } }));

  return (
    <li className={`feature-row${open ? ' is-open' : ''}`}>
      <div className="feature-row__main">
        <div>
          <h3 className="feature-row__name">{FEATURE_NAME[id]}</h3>
          <p className="feature-row__desc">{summary[id]}</p>
        </div>
        <span className="feature-row__inputs tabular">{inputsText(inputCount(id, f, channels.length))}</span>
        {!locked && (
          <div className="feature-row__actions">
            {editable && (
              <button type="button" className="btn btn--secondary btn--sm" aria-expanded={open} aria-controls={editorId} onClick={onToggle}>
                {open ? 'Done' : 'Edit'}<span className="visually-hidden"> {FEATURE_NAME[id]} settings</span>
              </button>
            )}
            <button type="button" className="link-button" onClick={onRemove}>
              Remove<span className="visually-hidden"> {FEATURE_NAME[id]}</span>
            </button>
          </div>
        )}
      </div>

      {editable && !locked && (
        <div id={editorId} className="feature-row__editor" hidden={!open}>
          {id === 'vocabulary' && (
            <div className="form-grid">
              <fieldset className="checks checks--stack">
                <legend className="field__label">Term lengths</legend>
                {(['words', 'pairs', 'triples'] as NGram[]).map((g) => (
                  <label key={g} className="check">
                    <input
                      type="checkbox"
                      checked={v.ngrams.includes(g)}
                      disabled={v.ngrams.length === 1 && v.ngrams.includes(g)}
                      onChange={(e) => setVocab({ ngrams: e.target.checked ? [...v.ngrams, g] : v.ngrams.filter((x) => x !== g) })}
                    />
                    {NGRAM_LABEL[g]}
                  </label>
                ))}
              </fieldset>
              <label className="field">
                <span className="field__label">Ignore terms in fewer than (% of messages)</span>
                <input type="number" min={0} max={v.maxDf - 1} value={v.minDf} onChange={(e) => setVocab({ minDf: Math.max(0, Math.min(v.maxDf - 1, Number(e.target.value))) })} />
              </label>
              <label className="field">
                <span className="field__label">Ignore terms in more than (% of messages)</span>
                <input type="number" min={v.minDf + 1} max={100} value={v.maxDf} onChange={(e) => setVocab({ maxDf: Math.min(100, Math.max(v.minDf + 1, Number(e.target.value))) })} />
              </label>
              <Select label="Terms kept per length" value={v.maxTerms} onChange={(x) => setVocab({ maxTerms: x })} options={[500, 1000, 2000, 5000].map((x) => ({ value: x, label: n(x) }))} />
              <fieldset className="checks checks--stack">
                <legend className="field__label">Weighting</legend>
                <label className="check"><input type="radio" name="weighting" checked={v.weighting === 'tfidf'} onChange={() => setVocab({ weighting: 'tfidf' })} />Weight by rarity (TF-IDF)</label>
                <label className="check"><input type="radio" name="weighting" checked={v.weighting === 'counts'} onChange={() => setVocab({ weighting: 'counts' })} />Plain counts</label>
              </fieldset>
            </div>
          )}
          {id === 'length' && (
            <fieldset className="checks">
              <legend className="field__label">Count length in</legend>
              {(['words', 'sentences', 'paragraphs'] as const).map((u) => (
                <label key={u} className="check">
                  <input type="radio" name="length-unit" checked={f.length.unit === u} onChange={() => setF((p) => ({ ...p, length: { unit: u } }))} />
                  {u[0].toUpperCase() + u.slice(1)}
                </label>
              ))}
            </fieldset>
          )}
          {id === 'sentiment' && (
            <fieldset className="checks">
              <legend className="field__label">Represent sentiment as</legend>
              <label className="check"><input type="radio" name="sent-form" checked={f.sentiment.form === 'score'} onChange={() => setF((p) => ({ ...p, sentiment: { form: 'score' } }))} />One score</label>
              <label className="check"><input type="radio" name="sent-form" checked={f.sentiment.form === 'category'} onChange={() => setF((p) => ({ ...p, sentiment: { form: 'category' } }))} />Three categories</label>
            </fieldset>
          )}
        </div>
      )}
    </li>
  );
}

/* ---------- Try a sentence ---------- */

const NEG = ['not', 'never', 'delete', 'quiet', 'avoid', 'problem', 'urgent', 'risk', 'worry', 'hide'];
const POS = ['thanks', 'great', 'good', 'happy', 'pleased', 'welcome', 'glad', 'appreciate'];

function Preview({ rules, f, active }: { rules: Rules; f: FeatureSettings; active: FeatureId[] }) {
  const [text, setText] = useState('Thanks for the help today. Message me on my personal comlink, not here, and delete this after.');
  const id = useId();
  const result = useMemo(() => {
    const removed = new Set(rules.removeWords);
    const kept = new Set(rules.keepWords);
    const raw = text.toLowerCase().match(/[\p{L}\p{N}@.'’-]+/gu) ?? [];
    const tokens = raw.map((t) => {
      const w = t.replace(/^[.'’-]+|[.'’-]+$/g, '');
      const reason =
        kept.has(w) ? null :
        removed.has(w) ? 'common word' :
        rules.numbers === 'remove' && /^\d[\d.,]*$/.test(w) ? 'number' :
        rules.emailAddresses === 'remove' && /@/.test(w) ? 'email address' : null;
      return { w, reason };
    }).filter((t) => t.w);
    const keptWords = tokens.filter((t) => !t.reason).map((t) => t.w);
    const grams: string[] = [];
    if (f.vocabulary.ngrams.includes('words')) grams.push(...keptWords);
    if (f.vocabulary.ngrams.includes('pairs')) for (let i = 0; i < keptWords.length - 1; i++) grams.push(keptWords.slice(i, i + 2).join(' '));
    if (f.vocabulary.ngrams.includes('triples')) for (let i = 0; i < keptWords.length - 2; i++) grams.push(keptWords.slice(i, i + 3).join(' '));
    const sentences = text.split(/[.!?]+/).filter((x) => x.trim()).length;
    const paragraphs = text.split(/\n\s*\n/).filter((x) => x.trim()).length;
    const score = raw.reduce((s, w) => s + (POS.includes(w) ? 1 : NEG.includes(w) ? -1 : 0), 0);
    const tone = score > 0 ? 'Positive' : score < 0 ? 'Negative' : 'Neutral';
    return { tokens, grams, words: raw.length, sentences, paragraphs, score, tone };
  }, [text, rules, f.vocabulary.ngrams]);

  const length = f.length.unit === 'words' ? result.words : f.length.unit === 'sentences' ? result.sentences : result.paragraphs;

  return (
    <section className="contract-section" aria-labelledby="pv-h">
      <div className="contract-section__head">
        <h2 id="pv-h" className="section-title">Try a sentence</h2>
      </div>
      <p className="section-lede">See how the current rules and features read a message. This runs on your own text in the browser, never on vault data.</p>
      <label className="field field--wide">
        <span className="field__label">Your sentence</span>
        <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} aria-describedby={`${id}-out`} />
      </label>
      <div id={`${id}-out`} className="preview-out" aria-live="polite">
        <div>
          <h3 className="preview-out__h">After cleaning</h3>
          <ul className="chips">
            {result.tokens.map((t, i) => (
              <li key={t.w + i} className={`chip chip--token${t.reason ? ' is-removed' : ''}`}>
                {t.w}{t.reason && <span className="visually-hidden"> (removed: {t.reason})</span>}
              </li>
            ))}
          </ul>
          <p className="note">Struck-through words are removed by the cleaning rules from data analysis.</p>
        </div>
        <dl className="detail-grid">
          {active.includes('vocabulary') && <div className="detail-grid__wide"><dt>Vocabulary terms ({result.grams.length})</dt><dd className="preview-terms">{result.grams.slice(0, 18).join(', ')}{result.grams.length > 18 ? ', …' : ''}</dd></div>}
          {active.includes('length') && <div><dt>Message length</dt><dd>{result.words ? `${length} ${f.length.unit}` : '0'}</dd></div>}
          {active.includes('sentiment') && <div><dt>Sentiment</dt><dd>{f.sentiment.form === 'score' ? `${result.score > 0 ? '+' : ''}${result.score} (${result.tone.toLowerCase()})` : result.tone}</dd></div>}
          {active.includes('channels') && <div><dt>Channel</dt><dd className="muted">Comes from the message’s metadata</dd></div>}
          {active.includes('embedding') && <div><dt>Meaning</dt><dd className="muted">384 numbers, computed in the vault</dd></div>}
        </dl>
      </div>
    </section>
  );
}
