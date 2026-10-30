import { useId, useRef, useState, type FormEvent } from 'react';
import { CURRENT_USER, type Customer, type Person, type Solution } from '../../data/customers';
import {
  CHANNELS, METRICS, METRIC_HELP, logEntry, signOffBlockers, useContract, useSolutionStage,
  type Contract, type Metric,
} from '../../data/contracts';
import { formatDate } from '../../components/format';
import Select from '../../components/Select';

const ROLES: Person['role'][] = ['Solution owner', 'Data scientist', 'Compliance reviewer'];
const fmtTime = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function ContractCapture({ customer, solution }: { customer: Customer; solution: Solution }) {
  const [k, setK] = useContract(customer, solution);
  const [stage, setStage] = useSolutionStage(customer, solution);
  const locked = k.status === 'Signed off';
  const blockers = signOffBlockers(k);
  const [confirming, setConfirming] = useState(false);
  const [announce, setAnnounce] = useState('');
  const blockersRef = useRef<HTMLDivElement>(null);

  const update = (fn: (k: Contract) => Contract, what: string) => {
    setK((prev) => {
      const next = fn(prev);
      return { ...next, activity: [logEntry(what), ...prev.activity] };
    });
    setAnnounce(what);
  };

  const signOff = () => {
    update((k) => ({ ...k, status: 'Signed off' }), 'Signed off the contract');
    if (stage === 'contract') setStage('fulfillment');
    setConfirming(false);
  };

  return (
    <div className="contract">
      <p className="visually-hidden" role="status" aria-live="polite">{announce}</p>

      {/* Status and the one decision this stage ends with */}
      <section className={`contract-status${locked ? ' is-locked' : ''}`} aria-labelledby="cs-h">
        <div className="contract-status__text">
          <h2 id="cs-h" className="contract-status__title">
            {locked ? 'Contract signed off' : 'Contract in draft'}
          </h2>
          <p className="muted">
            {locked
              ? 'These terms are locked. Every later stage is checked against them. Amend the contract to change anything.'
              : 'Agree the terms with the customer, then sign off to start requesting data from their vault.'}
          </p>
        </div>
        <div className="contract-status__actions">
          {locked ? (
            <button type="button" className="btn btn--secondary" onClick={() => update((k) => ({ ...k, status: 'Draft' }), 'Reopened the contract for amendment')}>
              Amend contract
            </button>
          ) : confirming ? (
            <div className="confirm" role="group" aria-label="Confirm sign-off">
              <span className="confirm__text">Lock the terms and start data fulfillment?</span>
              <button type="button" className="btn btn--primary" onClick={signOff}>Sign off</button>
              <button type="button" className="btn btn--secondary" onClick={() => setConfirming(false)}>Cancel</button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn--primary"
              aria-disabled={blockers.length > 0}
              aria-describedby={blockers.length ? 'blockers' : undefined}
              onClick={() => (blockers.length ? blockersRef.current?.focus() : setConfirming(true))}
            >
              Sign off contract
            </button>
          )}
        </div>
        {!locked && blockers.length > 0 && (
          <div id="blockers" className="blockers" tabIndex={-1} ref={blockersRef}>
            <p className="blockers__title">Before you can sign off</p>
            <ul>{blockers.map((b) => <li key={b}>{b}</li>)}</ul>
          </div>
        )}
      </section>

      <Details k={k} solution={solution} locked={locked} onSave={(d) => update(d, 'Updated the solution details')} />
      <Criteria k={k} solution={solution} locked={locked} update={update} />
      <DataRequest k={k} locked={locked} onSave={(d) => update(d, 'Updated the data request')} />
      <Team k={k} locked={locked} update={update} />

      <section className="contract-section" aria-labelledby="act-h">
        <div className="contract-section__head">
          <h2 id="act-h" className="section-title">Activity</h2>
        </div>
        <ol className="activity">
          {k.activity.map((a, i) => (
            <li key={a.at + i}>
              <time dateTime={a.at}>{fmtTime.format(new Date(a.at))}</time>
              <span><strong>{a.who}</strong> {a.what.charAt(0).toLowerCase() + a.what.slice(1)}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

/* ---------- Solution details ---------- */

function Details({ k, solution: s, locked, onSave }: { k: Contract; solution: Solution; locked: boolean; onSave: (fn: (k: Contract) => Contract) => void }) {
  const [editing, setEditing] = useState(!locked && !k.description.trim());
  const [draft, setDraft] = useState({ description: k.description, ...k.dates });
  const startEdit = () => { setDraft({ description: k.description, ...k.dates }); setEditing(true); };
  const save = (e: FormEvent) => {
    e.preventDefault();
    const { description, ...dates } = draft;
    onSave((k) => ({ ...k, description, dates }));
    setEditing(false);
  };
  const dateFields: [keyof Contract['dates'], string][] = [
    ['solutionStart', 'Solution start'],
    ['trainingStart', 'Training start'],
    ['trainingEnd', 'Training end'],
    ['goLive', 'Go-live'],
    ['solutionEnd', 'Solution end'],
  ];

  return (
    <section className="contract-section" aria-labelledby="det-h">
      <div className="contract-section__head">
        <h2 id="det-h" className="section-title">Solution details</h2>
        {!locked && !editing && <button type="button" className="btn btn--secondary btn--sm" onClick={startEdit}>Edit details</button>}
      </div>

      {editing ? (
        <form className="form" onSubmit={save}>
          <label className="field field--wide">
            <span className="field__label">What should the model flag?</span>
            <textarea rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </label>
          <div className="form-grid">
            {dateFields.map(([key, label]) => (
              <label className="field" key={key}>
                <span className="field__label">{label}</span>
                <input type="date" value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} required />
              </label>
            ))}
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn--primary">Save details</button>
            <button type="button" className="btn btn--secondary" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <>
          <p className="contract-desc">{k.description || <span className="muted">No description yet.</span>}</p>
          <dl className="detail-grid">
            <div><dt>Solution type</dt><dd>{s.type}</dd></div>
            <div><dt>Labels</dt><dd>{s.labels.join(' / ')}</dd></div>
            <div><dt>Function</dt><dd>{s.function}</dd></div>
            <div><dt>Vault</dt><dd>{s.vault}</dd></div>
            {dateFields.map(([key, label]) => (
              <div key={key}><dt>{label}</dt><dd><time dateTime={k.dates[key]}>{formatDate(k.dates[key])}</time></dd></div>
            ))}
          </dl>
        </>
      )}
    </section>
  );
}

/* ---------- Success criteria ---------- */

function Criteria({ k, solution: s, locked, update }: {
  k: Contract; solution: Solution; locked: boolean;
  update: (fn: (k: Contract) => Contract, what: string) => void;
}) {
  const [metric, setMetric] = useState<Metric>('Precision');
  const [label, setLabel] = useState(s.labels[0]);
  const [minimum, setMinimum] = useState(80);
  const formId = useId();

  const add = (e: FormEvent) => {
    e.preventDefault();
    const id = `c${Date.now()}`;
    update((k) => ({ ...k, criteria: [...k.criteria, { id, metric, label, minimum }] }), `Added a criterion: ${metric} on ${label} of at least ${minimum}%`);
  };

  return (
    <section className="contract-section" aria-labelledby="crit-h">
      <div className="contract-section__head">
        <h2 id="crit-h" className="section-title">Success criteria</h2>
      </div>
      <p className="section-lede">Every candidate model is checked against these at evaluation. A model that misses one can’t be deployed.</p>

      {k.criteria.length > 0 ? (
        <table className="table">
          <caption className="visually-hidden">Success criteria</caption>
          <thead>
            <tr>
              <th scope="col">Metric</th>
              <th scope="col">On label</th>
              <th scope="col" className="num">At least</th>
              {!locked && <th scope="col"><span className="visually-hidden">Actions</span></th>}
            </tr>
          </thead>
          <tbody>
            {k.criteria.map((c) => (
              <tr key={c.id}>
                <th scope="row">{c.metric}</th>
                <td>{c.label}</td>
                <td className="num">{c.minimum}%</td>
                {!locked && (
                  <td className="row-actions">
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => update((k) => ({ ...k, criteria: k.criteria.filter((x) => x.id !== c.id) }), `Removed a criterion: ${c.metric} on ${c.label}`)}
                    >
                      Remove<span className="visually-hidden"> {c.metric} on {c.label}</span>
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="empty-line">No criteria yet. Add at least one before signing off.</p>
      )}

      {!locked && (
        <form className="inline-form" onSubmit={add} aria-label="Add a success criterion">
          <Select label="Metric" value={metric} onChange={setMetric} describedBy={`${formId}-help`} options={METRICS.map((m) => ({ value: m, label: m }))} />
          <Select label="On label" value={label} onChange={setLabel} options={s.labels.map((l) => ({ value: l, label: l }))} />
          <label className="field field--narrow">
            <span className="field__label">At least (%)</span>
            <input type="number" min={1} max={100} value={minimum} onChange={(e) => setMinimum(Number(e.target.value))} required />
          </label>
          <button type="submit" className="btn btn--secondary">Add criterion</button>
          <p id={`${formId}-help`} className="field-help">{METRIC_HELP[metric]}</p>
        </form>
      )}
    </section>
  );
}

/* ---------- Data request ---------- */

function DataRequest({ k, locked, onSave }: { k: Contract; locked: boolean; onSave: (fn: (k: Contract) => Contract) => void }) {
  const [editing, setEditing] = useState(!locked && k.request.channels.length === 0);
  const [draft, setDraft] = useState(k.request);
  const startEdit = () => { setDraft(k.request); setEditing(true); };
  const save = (e: FormEvent) => {
    e.preventDefault();
    onSave((k) => ({ ...k, request: draft }));
    setEditing(false);
  };
  const r = editing ? draft : k.request;

  return (
    <section className="contract-section" aria-labelledby="req-h">
      <div className="contract-section__head">
        <h2 id="req-h" className="section-title">Data request</h2>
        {!locked && !editing && <button type="button" className="btn btn--secondary btn--sm" onClick={startEdit}>Edit request</button>}
      </div>
      <p className="section-lede">What data fulfillment will ask the vault for. The messages stay in the vault; the lab only sees how many arrived.</p>

      {editing ? (
        <form className="form" onSubmit={save}>
          <div className="form-grid">
            {Object.keys(r.perLabel).map((l) => (
              <label className="field" key={l}>
                <span className="field__label">Examples of “{l}”</span>
                <input
                  type="number" min={100} step={100} required
                  value={r.perLabel[l]}
                  onChange={(e) => setDraft({ ...draft, perLabel: { ...draft.perLabel, [l]: Number(e.target.value) } })}
                />
              </label>
            ))}
            <label className="field">
              <span className="field__label">Messages sent from</span>
              <input type="date" value={r.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} required />
            </label>
            <label className="field">
              <span className="field__label">Messages sent until</span>
              <input type="date" value={r.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} required />
            </label>
          </div>
          <fieldset className="checks">
            <legend className="field__label">Channels</legend>
            {CHANNELS.map((ch) => (
              <label key={ch} className="check">
                <input
                  type="checkbox"
                  checked={r.channels.includes(ch)}
                  onChange={(e) => setDraft({
                    ...draft,
                    channels: e.target.checked ? [...draft.channels, ch] : draft.channels.filter((x) => x !== ch),
                  })}
                />
                {ch}
              </label>
            ))}
          </fieldset>
          <div className="form-actions">
            <button type="submit" className="btn btn--primary">Save request</button>
            <button type="button" className="btn btn--secondary" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <dl className="detail-grid">
          {Object.entries(r.perLabel).map(([l, n]) => (
            <div key={l}><dt>Examples of “{l}”</dt><dd className="tabular">{n.toLocaleString('en-GB')}</dd></div>
          ))}
          <div><dt>Messages sent</dt><dd>{formatDate(r.from)} to {formatDate(r.to)}</dd></div>
          <div className="detail-grid__wide"><dt>Channels</dt><dd>{r.channels.length ? r.channels.join(', ') : <span className="muted">None chosen</span>}</dd></div>
        </dl>
      )}
    </section>
  );
}

/* ---------- Team ---------- */

function Team({ k, locked, update }: { k: Contract; locked: boolean; update: (fn: (k: Contract) => Contract, what: string) => void }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<Person['role']>('Data scientist');
  const add = (e: FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    const access = (ROLES.indexOf(role) + 1) as Person['access'];
    update((k) => ({ ...k, team: [...k.team, { name: n, role, access }] }), `Added ${n} as ${role.toLowerCase()}`);
    setName('');
  };

  return (
    <section className="contract-section" aria-labelledby="team-h">
      <div className="contract-section__head">
        <h2 id="team-h" className="section-title">Team</h2>
      </div>
      <p className="section-lede">Access level 1 can approve; level 2 builds models; level 3 reviews results. Nobody at any level can open a message.</p>
      {k.team.length === 0 ? <p className="empty-line">Nobody assigned yet. A solution needs a solution owner and a data scientist.</p> : (
      <table className="table">
        <caption className="visually-hidden">People assigned to this solution</caption>
        <thead>
          <tr>
            <th scope="col">Person</th>
            <th scope="col">Role</th>
            <th scope="col">Access</th>
            {!locked && <th scope="col"><span className="visually-hidden">Actions</span></th>}
          </tr>
        </thead>
        <tbody>
          {k.team.map((p, i) => (
            <tr key={p.name + i}>
              <th scope="row">
                <span className="person">
                  <span className="avatar avatar--sm" aria-hidden="true">{p.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}</span>
                  {p.name}
                </span>
              </th>
              <td>{p.role}</td>
              <td>Level {p.access}</td>
              {!locked && (
                <td className="row-actions">
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => update((k) => ({ ...k, team: k.team.filter((_, j) => j !== i) }), `Removed ${p.name} from the team`)}
                  >
                    Remove<span className="visually-hidden"> {p.name}</span>
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      )}
      {!locked && !k.team.some((p) => p.name === CURRENT_USER.name) && (
        <p className="quick-add">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => update((k) => ({ ...k, team: [...k.team, { name: CURRENT_USER.name, role: 'Data scientist', access: 2 }] }), `Added ${CURRENT_USER.name} as data scientist`)}
          >
            Add yourself as data scientist
          </button>
        </p>
      )}
      {!locked && (
        <form className="inline-form" onSubmit={add} aria-label="Add a person to the team">
          <label className="field">
            <span className="field__label">Name</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Hera Syndulla" required />
          </label>
          <Select label="Role" value={role} onChange={setRole} options={ROLES.map((r) => ({ value: r, label: r }))} />
          <button type="submit" className="btn btn--secondary">Add person</button>
        </form>
      )}
    </section>
  );
}
