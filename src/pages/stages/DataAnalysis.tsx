import { useId, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Customer, Solution } from '../../data/customers';
import { logEntry, useContract, useSolutionStage } from '../../data/contracts';
import { currentTrainingSet } from '../../data/fulfillment';
import {
  LENGTH_BUCKETS, MIN_MESSAGES, NGRAM_LABEL, SENTIMENTS, useAggregates, useAnalysis,
  type AnalysisState, type NGram, type Rules,
} from '../../data/analysis';
import { stageIndex } from '../../data/stages';
import HBarChart from '../../components/charts/HBarChart';
import SegmentedBarChart from '../../components/charts/SegmentedBarChart';
import { PATTERNS, type Pattern } from '../../components/charts/PatternDefs';

const LABEL_PATTERNS: Pattern[] = ['diagonalForward', 'dots'];

export default function DataAnalysis({ customer, solution }: { customer: Customer; solution: Solution }) {
  const [, setK] = useContract(customer, solution);
  const [stage, setStage] = useSolutionStage(customer, solution);
  const [a, setA] = useAnalysis(customer, solution);
  const agg = useAggregates(customer, solution, a.rules);
  const [gram, setGram] = useState<NGram>('words');
  const [announce, setAnnounce] = useState('');
  const base = `/lab/${customer.id}/solutions/${solution.id}`;
  const ts = currentTrainingSet(customer, solution);

  if (!agg || stageIndex(stage) < stageIndex('analysis')) {
    return (
      <section className="contract-status gate" aria-labelledby="gate-h">
        <div className="contract-status__text">
          <h2 id="gate-h" className="contract-status__title">Waiting on data</h2>
          <p className="muted">Analysis starts once a training set has been imported from the vault.</p>
        </div>
        <div className="contract-status__actions">
          <Link className="btn btn--secondary" to={`${base}/fulfillment`}>Go to data fulfillment</Link>
        </div>
      </section>
    );
  }

  const setRules = (fn: (r: Rules) => Rules) => setA((prev) => ({ ...prev, rules: fn(prev.rules) }));
  const setInclude = (fn: (i: AnalysisState['include']) => AnalysisState['include']) => setA((prev) => ({ ...prev, include: fn(prev.include) }));

  const selected =
    Object.values(a.include.vocabulary).reduce((n, g) => n + g.length, 0) +
    (a.include.channels ? 1 : 0) + (a.include.length ? 1 : 0) + (a.include.sentiment ? 1 : 0);

  const send = () => {
    if (!selected) return;
    setA((prev) => ({ ...prev, sentAt: new Date().toISOString() }));
    setK((prev) => ({ ...prev, activity: [logEntry(`Sent ${selected} ${selected === 1 ? 'analysis' : 'analyses'} to feature engineering`), ...prev.activity] }));
    if (stage === 'analysis') setStage('features');
    setAnnounce(`Sent ${selected} to feature engineering.`);
  };

  const vocabMax = Math.max(...solution.labels.flatMap((l) => agg.vocabulary[l][gram].map((d) => d.value)), 1);
  const toggleVocab = (label: string, on: boolean) =>
    setInclude((i) => {
      const cur = i.vocabulary[label] ?? [];
      return { ...i, vocabulary: { ...i.vocabulary, [label]: on ? [...new Set([...cur, gram])] : cur.filter((g) => g !== gram) } };
    });

  return (
    <div className="contract contract--wide">
      <p className="visually-hidden" role="status" aria-live="polite">{announce}</p>

      <section className="contract-status" aria-labelledby="an-h">
        <div className="contract-status__text">
          <h2 id="an-h" className="contract-status__title">Analyzing training set <code className="id">{ts}</code></h2>
          <p className="muted">
            {Object.entries(agg.volume).map(([l, v]) => `${v.toLocaleString('en-GB')} “${l}”`).join(' and ')} messages.
            Choose what to carry into feature engineering; {selected ? `${selected} selected so far.` : 'nothing selected yet.'}
          </p>
        </div>
        <div className="contract-status__actions">
          {a.sentAt && selected === 0 ? null : (
            <button type="button" className="btn btn--primary" aria-disabled={selected === 0} onClick={send}>
              {a.sentAt ? 'Update feature engineering' : 'Send to feature engineering'}
            </button>
          )}
          {a.sentAt && <Link className="btn btn--secondary" to={`${base}/features`}>Go to feature engineering</Link>}
        </div>
        <p className="boundary-note privacy-note">
          <svg viewBox="0 0 16 16" aria-hidden="true" className="note-icon"><rect x="3.5" y="7" width="9" height="6.5" rx="1.5" /><path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" /></svg>
          Everything here is an aggregate computed inside the vault. Terms appear only if at least {MIN_MESSAGES} messages use them, and counts include privacy noise.
        </p>
      </section>

      <Preparation rules={a.rules} setRules={setRules} />

      <section className="contract-section" aria-labelledby="voc-h">
        <div className="contract-section__head">
          <h2 id="voc-h" className="section-title">Vocabulary</h2>
        </div>
        <p className="section-lede">The most common terms in each label after cleaning. Look for terms that separate the labels.</p>
        <div className="seg-control" role="radiogroup" aria-label="Term length">
          {(['words', 'pairs', 'triples'] as NGram[]).map((g) => (
            <label key={g} className={`seg-control__opt${gram === g ? ' is-on' : ''}`}>
              <input type="radio" name="gram" value={g} checked={gram === g} onChange={() => setGram(g)} />
              {NGRAM_LABEL[g]}
            </label>
          ))}
        </div>
        <div className="chart-pair">
          {solution.labels.map((label, i) => (
            <div key={label} className="chart-cell">
              <HBarChart
                title={`${NGRAM_LABEL[gram]} in “${label}”`}
                unit="messages"
                data={agg.vocabulary[label][gram]}
                pattern={LABEL_PATTERNS[i]}
                max={vocabMax}
                empty={`No ${NGRAM_LABEL[gram].toLowerCase()} reach ${MIN_MESSAGES} messages after cleaning.`}
              />
              <label className="include">
                <input
                  type="checkbox"
                  checked={(a.include.vocabulary[label] ?? []).includes(gram)}
                  onChange={(e) => toggleVocab(label, e.target.checked)}
                />
                Use these {NGRAM_LABEL[gram].toLowerCase()} in feature engineering
              </label>
            </div>
          ))}
        </div>
        {agg.hiddenTerms > 0 && (
          <p className="note">{agg.hiddenTerms} {agg.hiddenTerms === 1 ? 'term is' : 'terms are'} held back because fewer than {MIN_MESSAGES} messages use them.</p>
        )}
      </section>

      <Breakdown
        id="ch"
        title="Messages by channel"
        lede="Where each label’s messages were sent. A label that leans on one channel is a useful signal."
        chartTitle="Share of messages by channel"
        series={Object.keys(agg.channels[solution.labels[0]])}
        data={agg.channels}
        labels={solution.labels}
        checked={a.include.channels}
        onCheck={(v) => setInclude((i) => ({ ...i, channels: v }))}
        includeLabel="Use channel as a feature"
      />
      <Breakdown
        id="len"
        title="Message length"
        lede="How long messages are in each label, in words."
        chartTitle="Share of messages by length"
        series={LENGTH_BUCKETS}
        data={agg.length}
        labels={solution.labels}
        checked={a.include.length}
        onCheck={(v) => setInclude((i) => ({ ...i, length: v }))}
        includeLabel="Use message length as a feature"
      />
      <Breakdown
        id="sent"
        title="Sentiment"
        lede="The tone of each label’s messages, scored inside the vault."
        chartTitle="Share of messages by sentiment"
        series={SENTIMENTS}
        data={agg.sentiment}
        labels={solution.labels}
        checked={a.include.sentiment}
        onCheck={(v) => setInclude((i) => ({ ...i, sentiment: v }))}
        includeLabel="Use sentiment as a feature"
      />

      <section className="send-bar" aria-label="Send to feature engineering">
        <p>{selected ? `${selected} ${selected === 1 ? 'analysis' : 'analyses'} selected for feature engineering.` : 'Nothing selected for feature engineering yet.'}</p>
        <button type="button" className="btn btn--primary" aria-disabled={selected === 0} onClick={send}>
          {a.sentAt ? 'Update feature engineering' : 'Send to feature engineering'}
        </button>
      </section>
    </div>
  );
}

/* ---------- Cleaning rules ---------- */

function Preparation({ rules, setRules }: { rules: Rules; setRules: (fn: (r: Rules) => Rules) => void }) {
  const rows: { key: keyof Omit<Rules, 'removeWords' | 'keepWords'>; label: string; help: string }[] = [
    { key: 'numbers', label: 'Numbers', help: 'Amounts and dates can matter for laundering and trading risks.' },
    { key: 'punctuation', label: 'Punctuation', help: 'Rarely useful; removing it merges “gift,” and “gift”.' },
    { key: 'emoji', label: 'Emoji', help: 'Often carry tone in chat.' },
    { key: 'emailAddresses', label: 'Email addresses', help: 'Removed by default so no address reaches a model.' },
  ];
  return (
    <section className="contract-section" aria-labelledby="prep-h">
      <div className="contract-section__head">
        <h2 id="prep-h" className="section-title">Data preparation</h2>
      </div>
      <p className="section-lede">Cleaning rules applied inside the vault before anything is counted. Changes update the vocabulary below right away.</p>

      <div className="word-lists">
        <WordList
          title="Words to remove"
          help="Common words that carry no signal."
          words={rules.removeWords}
          onChange={(w) => setRules((r) => ({ ...r, removeWords: w }))}
        />
        <WordList
          title="Words to always keep"
          help="Kept even if another rule would drop them."
          words={rules.keepWords}
          onChange={(w) => setRules((r) => ({ ...r, keepWords: w }))}
        />
      </div>

      <table className="table rules-table">
        <caption className="visually-hidden">Cleaning rules</caption>
        <thead><tr><th scope="col">Content</th><th scope="col">Treatment</th><th scope="col">Why it matters</th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <th scope="row">{row.label}</th>
              <td>
                <div className="seg-control seg-control--sm" role="radiogroup" aria-label={`${row.label} treatment`}>
                  {(['remove', 'keep'] as const).map((v) => (
                    <label key={v} className={`seg-control__opt${rules[row.key] === v ? ' is-on' : ''}`}>
                      <input type="radio" name={`rule-${row.key}`} checked={rules[row.key] === v} onChange={() => setRules((r) => ({ ...r, [row.key]: v }))} />
                      {v === 'remove' ? 'Remove' : 'Keep'}
                    </label>
                  ))}
                </div>
              </td>
              <td>{row.help}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function WordList({ title, help, words, onChange }: { title: string; help: string; words: string[]; onChange: (w: string[]) => void }) {
  const [value, setValue] = useState('');
  const inputId = useId();
  const add = (e: FormEvent) => {
    e.preventDefault();
    const w = value.trim().toLowerCase();
    if (w && !words.includes(w)) onChange([...words, w]);
    setValue('');
  };
  return (
    <div className="word-list">
      <h3 className="word-list__title">{title}</h3>
      <p className="note">{help}</p>
      <ul className="chips" aria-label={title}>
        {words.map((w) => (
          <li key={w} className="chip">
            {w}
            <button type="button" className="chip__x" aria-label={`Remove “${w}” from ${title.toLowerCase()}`} onClick={() => onChange(words.filter((x) => x !== w))}>
              <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6" /></svg>
            </button>
          </li>
        ))}
      </ul>
      <form className="chip-add" onSubmit={add}>
        <label className="visually-hidden" htmlFor={inputId}>Add a word to {title.toLowerCase()}</label>
        <input id={inputId} type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Add a word" />
        <button type="submit" className="btn btn--secondary btn--sm">Add</button>
      </form>
    </div>
  );
}

/* ---------- Segmented breakdowns ---------- */

function Breakdown(props: {
  id: string; title: string; lede: string; chartTitle: string; series: string[];
  data: Record<string, Record<string, number>>; labels: string[];
  checked: boolean; onCheck: (v: boolean) => void; includeLabel: string;
}) {
  const series = props.series.map((key, i) => ({ key, label: key, pattern: PATTERNS[i % (PATTERNS.length - 1)] }));
  return (
    <section className="contract-section" aria-labelledby={`${props.id}-h`}>
      <div className="contract-section__head">
        <h2 id={`${props.id}-h`} className="section-title">{props.title}</h2>
      </div>
      <p className="section-lede">{props.lede}</p>
      <SegmentedBarChart
        title={props.chartTitle}
        unit="messages"
        series={series}
        rows={props.labels.map((l) => ({ label: l, values: props.data[l] }))}
      />
      <label className="include">
        <input type="checkbox" checked={props.checked} onChange={(e) => props.onCheck(e.target.checked)} />
        {props.includeLabel}
      </label>
    </section>
  );
}

