import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Customer, Solution } from '../../data/customers';
import { logEntry, useContract, useSolutionStage } from '../../data/contracts';
import { makeRequest, progressOf, useFulfillment, useNow, type FulfillmentRequest, type LabelProgress } from '../../data/fulfillment';
import { stageIndex } from '../../data/stages';
import { formatDate } from '../../components/format';

const fmtTime = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const n = (x: number) => x.toLocaleString('en-GB');

export default function DataFulfillment({ customer, solution }: { customer: Customer; solution: Solution }) {
  const [k, setK] = useContract(customer, solution);
  const [stage, setStage] = useSolutionStage(customer, solution);
  const [requests, setRequests] = useFulfillment(customer, solution);
  const base = `/lab/${customer.id}/solutions/${solution.id}`;

  const latest = requests[0] as FulfillmentRequest | undefined;
  const inFlight = !!latest && !latest.importedAt;
  const now = useNow(inFlight);
  const progress = latest ? progressOf(latest, now) : [];
  const allReady = progress.length > 0 && progress.every((p) => p.fulfilled && p.ready);
  const state: 'none' | 'waiting' | 'ready' | 'imported' =
    !latest ? 'none' : latest.importedAt ? 'imported' : allReady ? 'ready' : 'waiting';

  // Announce milestones only, never every tick.
  const [announce, setAnnounce] = useState('');
  const announced = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!latest || latest.importedAt) return;
    progress.forEach((p) => {
      const id = `${latest.id}:${p.label}`;
      if (p.fulfilled && !announced.current.has(id)) {
        announced.current.add(id);
        setAnnounce(`“${p.label}” fulfilled with ${n(p.received)} messages.`);
      }
    });
    if (allReady && !announced.current.has(latest.id)) {
      announced.current.add(latest.id);
      setAnnounce('Every label is ready. Import the data to start analysis.');
    }
  });

  const log = (what: string) => setK((prev) => ({ ...prev, activity: [logEntry(what), ...prev.activity] }));

  const send = () => {
    const req = makeRequest(k, `${customer.id}${solution.id}${Date.now()}`, new Date());
    setRequests((prev) => [req, ...prev]);
    log('Requested data from the vault');
    setAnnounce('Request sent to the vault.');
  };

  const importData = () => {
    if (!latest) return;
    const ts = `ts-${Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0')}`;
    setRequests((prev) => prev.map((r, i) => (i === 0 ? { ...r, importedAt: new Date().toISOString(), trainingSetId: ts } : r)));
    log(`Imported training set ${ts}`);
    if (stage === 'fulfillment') setStage('analysis');
    setAnnounce(`Imported as training set ${ts}.`);
  };

  // Gate: the contract has to be signed off first.
  if (stageIndex(stage) < stageIndex('fulfillment') || k.status !== 'Signed off') {
    return (
      <section className="contract-status gate" aria-labelledby="gate-h">
        <div className="contract-status__text">
          <h2 id="gate-h" className="contract-status__title">Waiting on the contract</h2>
          <p className="muted">Data can only be requested once the contract is signed off, so the vault knows exactly what it may release.</p>
        </div>
        <div className="contract-status__actions">
          <Link className="btn btn--secondary" to={`${base}/contract`}>Go to contract capture</Link>
        </div>
      </section>
    );
  }

  return (
    <div className="contract">
      <p className="visually-hidden" role="status" aria-live="polite">{announce}</p>

      <section className={`contract-status${state === 'ready' ? ' is-locked' : ''}`} aria-labelledby="ff-h">
        <div className="contract-status__text">
          <h2 id="ff-h" className="contract-status__title">
            {state === 'none' && 'Nothing requested yet'}
            {state === 'waiting' && 'Waiting for the vault'}
            {state === 'ready' && 'Every label is ready'}
            {state === 'imported' && <>Imported as training set <code className="id">{latest!.trainingSetId}</code></>}
          </h2>
          <p className="muted">
            {state === 'none' && 'Send the contract’s data request to the vault. It searches for matching labelled messages and reports how many it finds.'}
            {state === 'waiting' && 'Counts update as the vault finds matching messages. You can leave this page; the request keeps running.'}
            {state === 'ready' && 'The vault found enough examples of every label. Import the data to start analysis.'}
            {state === 'imported' && 'The data stays in the vault. Analysis and training run there against this training set.'}
          </p>
        </div>
        <div className="contract-status__actions">
          {state === 'none' && <button type="button" className="btn btn--primary" onClick={send}>Send request to vault</button>}
          {state === 'waiting' && <span className="pulse" aria-hidden="true" />}
          {state === 'ready' && (
            <button type="button" className="btn btn--primary" onClick={importData}>
              <svg viewBox="0 0 16 16" aria-hidden="true" className="btn-icon"><path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10" /></svg>
              Import data
            </button>
          )}
          {state === 'imported' && (
            <div className="confirm">
              <button type="button" className="btn btn--secondary" onClick={send}>Request more data</button>
              <Link className="btn btn--primary" to={`${base}/analysis`}>Go to data analysis</Link>
            </div>
          )}
        </div>
      </section>

      {latest && (
        <section className="contract-section" aria-labelledby="req-now-h">
          <div className="contract-section__head">
            <h2 id="req-now-h" className="section-title">{latest.importedAt ? 'Imported request' : 'Current request'}</h2>
          </div>
          <p className="section-lede">
            Sent {fmtTime.format(new Date(latest.requestedAt))} by {latest.requestedBy}. Messages from {formatDate(latest.from)} to {formatDate(latest.to)} across {latest.channels.join(', ').toLowerCase()}.
          </p>
          <ul className="label-progress">
            {progress.map((p) => <LabelRow key={p.label} p={p} />)}
          </ul>
          <p className="boundary-note">
            <svg viewBox="0 0 16 16" aria-hidden="true" className="note-icon"><rect x="3.5" y="7" width="9" height="6.5" rx="1.5" /><path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" /></svg>
            Counts only. Message content never leaves the vault.
          </p>
        </section>
      )}

      {requests.length > 1 && (
        <section className="contract-section" aria-labelledby="hist-h">
          <div className="contract-section__head">
            <h2 id="hist-h" className="section-title">Earlier requests</h2>
          </div>
          <table className="table">
            <caption className="visually-hidden">Earlier data requests</caption>
            <thead>
              <tr>
                <th scope="col">Sent</th>
                <th scope="col">Label</th>
                <th scope="col" className="num">Requested</th>
                <th scope="col" className="num">Received</th>
                <th scope="col">Training set</th>
              </tr>
            </thead>
            <tbody>
              {requests.slice(1).flatMap((r) =>
                progressOf(r, now).map((p, i) => (
                  <tr key={r.id + p.label}>
                    <td>{i === 0 ? fmtTime.format(new Date(r.requestedAt)) : ''}</td>
                    <th scope="row">{p.label}</th>
                    <td className="num">{n(p.requested)}</td>
                    <td className="num">{n(p.received)}</td>
                    <td>{i === 0 ? (r.trainingSetId ? <code className="id">{r.trainingSetId}</code> : <span className="muted">Not imported</span>) : ''}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function LabelRow({ p }: { p: LabelProgress }) {
  const pct = Math.min(100, (p.received / p.requested) * 100);
  const status = p.fulfilled ? (p.ready ? 'Fulfilled' : 'Short') : p.ready ? 'Ready, still searching' : 'Searching';
  return (
    <li className={`label-row${p.ready ? ' is-ready' : ''}`}>
      <div className="label-row__head">
        <span className="label-row__name">{p.label}</span>
        <span className="label-row__status">{status}</span>
      </div>
      <div className="meter" aria-hidden="true"><span style={{ width: `${pct}%` }} /></div>
      <p className="label-row__count">
        <strong className="tabular">{n(p.received)}</strong> received of <span className="tabular">{n(p.requested)}</span> requested
        {p.fulfilledAt && <span className="muted">, fulfilled {formatDate(p.fulfilledAt.slice(0, 10))}</span>}
      </p>
    </li>
  );
}
