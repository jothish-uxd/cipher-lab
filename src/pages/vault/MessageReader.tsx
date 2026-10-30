import { useId, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Match, Message } from '../../data/vault/messages';
import { findChannel, findTag, person } from '../../data/vault/org';
import { findPolicy, policyModel, type PredictionId } from '../../data/vault/policies';
import { STATUS_OPTIONS, matchesOf, tagsOf, type Review } from '../../data/vault/review';
import { labRoutes, modelStatus } from '../../data/vault/lab';
import HoverCard from '../../components/HoverCard';
import Select from '../../components/Select';
import { PredictionDetail, TagCard, predictionValue, tagPath } from '../../components/vault/cards';
import { ChannelIcon, ChevronIcon, FaceIcon, FileIcon, FlagIcon, LanguageIcon, ShieldIcon, SparkIcon } from '../../components/vault/icons';
import { formatDateTime, formatKb, formatTime } from '../../components/vault/format';

/** Wrap lexicon matches in <mark> so the reviewer sees why a message was flagged. */
function highlight(text: string, terms: string[]): ReactNode {
  if (!terms.length) return text;
  const re = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return text.split(re).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part));
}

const nameAndAddress = (id: string) => {
  const p = person(id);
  return <span className="addr">{p.name} <span className="mono">&lt;{p.address}&gt;</span></span>;
};

function Disclosure({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const id = useId();
  return (
    <section className="disclosure">
      <h3 className="disclosure__head">
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
          <ChevronIcon />
          <span>{title}</span>
          <span className="pill">{count}</span>
        </button>
      </h3>
      <div id={id} hidden={!open} className="disclosure__body">{children}</div>
    </section>
  );
}

const PREDICTIONS: { id: PredictionId; icon: JSX.Element }[] = [
  { id: 'business', icon: <ShieldIcon /> },
  { id: 'language', icon: <LanguageIcon /> },
  { id: 'sentiment', icon: <FaceIcon /> },
];

export default function MessageReader({ m, review: r }: { m: Message; review: Review }) {
  const channel = findChannel(m.channel)!;
  const unread = r.isUnread(m);
  const terms = [...new Set(m.hits.flatMap((h) => h.matches.flatMap((x) => x.terms ?? [])))];
  const matches = matchesOf(m, r);
  const tags = tagsOf(m);

  return (
    <article className="reader" aria-labelledby={`subj-${m.id}`}>
      <header className="reader__head">
        <div className="reader__top">
          <h2 id={`subj-${m.id}`} className="reader__subject">{m.subject}</h2>
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => r.setRead([m.id], unread)}>
            {unread ? 'Mark as read' : 'Mark as unread'}
          </button>
        </div>
        <dl className="reader__meta">
          <div><dt>From</dt><dd>{nameAndAddress(m.from)}</dd></div>
          <div><dt>To</dt><dd>{m.to.map((id, i) => <span key={id}>{i > 0 && ', '}{nameAndAddress(id)}</span>)}</dd></div>
          {m.cc && <div><dt>Cc</dt><dd>{m.cc.map((id, i) => <span key={id}>{i > 0 && ', '}{nameAndAddress(id)}</span>)}</dd></div>}
          <div><dt>Channel</dt><dd className="with-icon"><ChannelIcon id={m.channel} /> {channel.name}</dd></div>
          <div><dt>Date</dt><dd className="mono-num">{formatDateTime(m.date)}</dd></div>
        </dl>
      </header>

      <div className="reader__grid">
        <div className="reader__main">
          {m.body && (
            <div className="reader__body">
              {m.body.map((para, i) => <p key={i}>{highlight(para, terms)}</p>)}
            </div>
          )}
          {m.turns && (
            <ol className="transcript" aria-label={`${channel.name} conversation`}>
              {m.turns.map((t, i) => (
                <li key={i} className={`turn${t.from === m.from ? '' : ' turn--reply'}`}>
                  <p className="turn__who">
                    <span className="turn__name">{person(t.from).name}</span>
                    <time className="mono-num" dateTime={t.at}>{formatTime(t.at)}</time>
                  </p>
                  <p className="turn__text">{highlight(t.text, terms)}</p>
                </li>
              ))}
            </ol>
          )}

          {m.attachments.length > 0 && (
            <ul className="attachments" aria-label="Attachments">
              {m.attachments.map((a) => (
                <li key={a.name}><FileIcon /> <span>{a.name}</span> <span className="mono">{formatKb(a.kb)}</span></li>
              ))}
            </ul>
          )}

          <section className="predictions" aria-labelledby={`pred-${m.id}`}>
            <h3 id={`pred-${m.id}`} className="predictions__title"><SparkIcon /> AI predictions <span className="pill">{PREDICTIONS.length}</span></h3>
            <ul className="pred-chips">
              {PREDICTIONS.map(({ id, icon }) => (
                <li key={id}>
                  <HoverCard className="pred-chip" label={predictionValue(m, id)} card={<PredictionDetail m={m} id={id} />}>
                    {icon}<span>{predictionValue(m, id)}</span>
                  </HoverCard>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="reader__side" aria-label="Review">
          <Disclosure title="Policy matches" count={matches.length}>
            {m.hits.length === 0 ? (
              <p className="side-empty">No policy matched this message.</p>
            ) : (
              <ul className="policies">
                {m.hits.map((h) => {
                  const p = findPolicy(h.policy)!;
                  return (
                    <li key={h.policy} className="policy">
                      <p className="policy__name">{p.name} <span className="tag">v{p.version}</span></p>
                      <ul className="policy__matches">
                        {h.matches.map((x, i) => (
                          <MatchRow key={i} m={m} policyId={p.id} i={i} match={x} review={r} />
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            )}
          </Disclosure>

          <Disclosure title="Classification tags" count={tags.length}>
            {tags.length === 0 ? (
              <p className="side-empty">No one on this message is in a monitored group.</p>
            ) : (
              <ul className="tags">
                {tags.map((t) => (
                  <li key={t.id}>
                    <HoverCard className="tagpath" label={tagPath(t.id)} card={<TagCard tagId={t.id} />}>
                      {t.path.slice(0, -1).map((s) => <span key={s} className="tagpath__parent">{s} / </span>)}
                      <strong>{t.path[t.path.length - 1]}</strong>
                    </HoverCard>
                  </li>
                ))}
              </ul>
            )}
          </Disclosure>
        </aside>
      </div>
    </article>
  );
}

function MatchRow({ m, policyId, i, match, review: r }: { m: Message; policyId: string; i: number; match: Match; review: Review }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const policy = findPolicy(policyId)!;
  const model = policyModel(policy);
  const status = r.statusOf(m, policyId, i);
  const path = findTag(match.tag).path.join(' / ');

  return (
    <li className={`match match--${status}`}>
      <p className="match__tag"><span aria-hidden="true">↳ </span>{path}</p>
      <div className="match__row">
        <span className="match__flag" aria-hidden="true"><FlagIcon filled={status !== 'cleared'} /></span>
        <Select
          hideLabel
          label={`Status of ${policy.name} match under ${path}`}
          value={status}
          options={STATUS_OPTIONS}
          onChange={(s) => r.setStatus(m, policyId, i, s)}
          className="select--compact"
        />
        <button type="button" className="link-btn" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
          {open ? 'Hide details' : 'View details'}
        </button>
      </div>
      <div id={id} hidden={!open} className="match__details">
        {match.via === 'lexicon' ? (
          <p>Lexicon (v{policy.version}) matched {match.terms!.map((t, k) => <span key={t}>{k > 0 && ', '}<mark>{t}</mark></span>)}.</p>
        ) : model ? (
          <>
            <p>
              Cipher Lab model <strong>{model.name}</strong> <span className="mono">{model.service} {model.version}</span> scored{' '}
              <span className="mono">{match.score?.toFixed(2)}</span>, above the policy threshold of <span className="mono">{policy.threshold?.toFixed(2)}</span>.
            </p>
            <Link to={labRoutes.model(model)} className="ext-link">Open model in the Lab ({modelStatus(model).toLowerCase()})</Link>
          </>
        ) : null}
      </div>
    </li>
  );
}
