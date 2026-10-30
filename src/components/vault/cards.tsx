import type { Message } from '../../data/vault/messages';
import { findTag, membersOf } from '../../data/vault/org';
import { findPolicy, policyLabel, policyModel, POLICIES, predictionModel, type PredictionId } from '../../data/vault/policies';
import { matchesOf, statusLabel, type Review } from '../../data/vault/review';
import { plural, sentimentWord } from './format';

/* Content for HoverCards. Text only: the cards never hold links or buttons. */

export const tagPath = (tagId: string) => findTag(tagId).path.join(' / ');

/** Which policies use a prediction, as "Bribery (v12), Anti-money laundering (v12)". */
const policiesUsing = (id: PredictionId) => POLICIES.filter((p) => p.uses.includes(id)).map(policyLabel).join(', ');

export function predictionValue(m: Message, id: PredictionId) {
  const p = m.predictions;
  if (id === 'business') return p.business;
  if (id === 'language') return p.language.startsWith('English') ? 'English' : 'Non-English';
  return `Sentiment ${p.sentiment.toFixed(2)}`;
}

export function PredictionDetail({ m, id }: { m: Message; id: PredictionId }) {
  const model = predictionModel(id);
  const p = m.predictions;
  return (
    <dl className="card-dl">
      <div><dt>AI model</dt><dd>{model.model} <span className="mono">(v{model.version})</span></dd></div>
      <div><dt>Result</dt><dd>{id === 'language' ? p.language : id === 'sentiment' ? `${p.sentiment.toFixed(2)}, ${sentimentWord(p.sentiment)}` : p.business}</dd></div>
      <div><dt>Policies</dt><dd>{policiesUsing(id) || 'None'}</dd></div>
    </dl>
  );
}

export function PredictionsCard({ m }: { m: Message }) {
  const ids: PredictionId[] = ['business', 'language', 'sentiment'];
  return (
    <>
      <p className="card-title">AI predictions ({ids.length})</p>
      <ul className="card-list">
        {ids.map((id) => (
          <li key={id}>
            <p className="card-chip">{predictionValue(m, id)}</p>
            <PredictionDetail m={m} id={id} />
          </li>
        ))}
      </ul>
    </>
  );
}

export function PolicyMatchesCard({ m, r }: { m: Message; r: Review }) {
  const all = matchesOf(m, r);
  return (
    <>
      <p className="card-title">Policy matches ({all.length})</p>
      <ul className="card-list">
        {m.hits.map((h) => {
          const p = findPolicy(h.policy)!;
          const model = policyModel(p);
          const mine = all.filter((x) => x.policy === h.policy);
          return (
            <li key={h.policy}>
              <p className="card-strong">{policyLabel(p)}</p>
              <ul className="card-sub">
                {mine.map((x) => (
                  <li key={x.i}>
                    <span>{tagPath(x.match.tag)}</span>
                    <span className="card-status">{statusLabel(x.status)}</span>
                  </li>
                ))}
              </ul>
              {model && mine.some((x) => x.match.via === 'model') && (
                <p className="card-note">Cipher Lab model: {model.name} <span className="mono">{model.version}</span></p>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function TagCard({ tagId }: { tagId: string }) {
  const t = findTag(tagId);
  const members = membersOf(tagId);
  const shown = members.slice(0, 6);
  return (
    <>
      <p className="card-title card-title--rule">
        {t.path.slice(0, -1).map((s) => `${s} / `)}<strong>{t.path[t.path.length - 1]}</strong>
      </p>
      <dl className="card-dl">
        <div><dt>Group</dt><dd>{t.group}</dd></div>
        <div><dt>Members</dt><dd>{plural(members.length, 'person', 'people')}</dd></div>
      </dl>
      <ul className="card-people">
        {shown.map((p) => <li key={p.id}>{p.name} <span className="mono">&lt;{p.address}&gt;</span></li>)}
        {members.length > shown.length && <li className="muted">and {members.length - shown.length} more</li>}
      </ul>
    </>
  );
}
