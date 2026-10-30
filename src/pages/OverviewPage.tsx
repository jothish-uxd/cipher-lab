import { useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { STAGES } from '../data/stages';
import { usePageTitle } from '../components/usePageTitle';

const TABS = [
  { id: 'how', label: 'How it works' },
  { id: 'why', label: 'Why it exists' },
  { id: 'changes', label: 'What the rebuild changes' },
] as const;
type TabId = (typeof TABS)[number]['id'];

export default function OverviewPage() {
  const h = usePageTitle('Overview');
  const [tab, setTab] = useState<TabId>('how');
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Arrow keys move between tabs, as in a11y-charts.
  const onKey = (e: KeyboardEvent, i: number) => {
    const last = TABS.length - 1;
    const next =
      e.key === 'ArrowRight' ? (i === last ? 0 : i + 1)
      : e.key === 'ArrowLeft' ? (i === 0 ? last : i - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    setTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  };

  const [first, ...inside] = STAGES;

  return (
    <main id="main" className="main main--solo">
      <section className="hero" aria-labelledby="ov-title">
        <h1 ref={h} tabIndex={-1} id="ov-title" className="page-title">
          Models trained on messages no one may read.
        </h1>
        <p className="page-lede">
          Cipher Lab is a service workspace for building, training and deploying models that flag
          misconduct in regulated firms’ electronic communications. The model goes to the archive.
          The messages never come out.
        </p>
        <div className="hero-actions">
          <Link to="/studio" className="btn btn--primary">Open the studio</Link>
          <p className="note">A design rebuild of AI Studio, first designed in 2019–2020.</p>
        </div>
      </section>

      <div className="tabbar">
        <div className="tablist" role="tablist" aria-label="Overview sections">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => { tabRefs.current[i] = el; }}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-controls={`panel-${t.id}`}
              aria-selected={tab === t.id}
              tabIndex={tab === t.id ? 0 : -1}
              className="tab"
              onClick={() => setTab(t.id)}
              onKeyDown={(e) => onKey(e, i)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <section className="tab-panel" role="tabpanel" id="panel-how" aria-labelledby="tab-how" tabIndex={0} hidden={tab !== 'how'}>
        <div className="doc-block">
          <h2 className="doc-h2">One solution, seven stages</h2>
          <p className="doc-p">
            Every solution moves through the same lifecycle. Only the first stage happens outside the
            customer’s archive; one more lets aggregate scores out.
          </p>
          <ol className="flow">
            <li className="flow__stage flow__stage--outside">
              <span className="flow__num" aria-hidden="true">1</span>
              <strong className="flow__name">{first.name}</strong>
              <span className="flow__desc">{first.summary}</span>
            </li>
            <li className="flow__boundary">
              <p className="flow__boundary-label" id="boundary-label">
                <LockIcon /> Inside the customer’s archive
              </p>
              <ol className="flow__inside" aria-labelledby="boundary-label" start={2}>
                {inside.map((s, i) => (
                  <li key={s.id} className="flow__stage">
                    <span className="flow__num" aria-hidden="true">{i + 2}</span>
                    <strong className="flow__name">{s.name}</strong>
                    <span className="flow__desc">{s.summary}</span>
                    {s.zone === 'crossing' && (
                      <span className="flow__exit"><ExitIcon /> Only aggregate scores leave</span>
                    )}
                  </li>
                ))}
              </ol>
            </li>
          </ol>
        </div>

        <div className="doc-block">
          <h2 className="doc-h2">What it promises customers</h2>
          <dl className="feature-list">
            <div><dt>The data stays where it is</dt><dd>Fulfillment, analysis, training and serving run inside the customer’s archive region. Analysts see distributions and counts, never a message.</dd></div>
            <div><dt>Success is agreed first</dt><dd>Contract capture sets the criteria a model must meet, such as minimum precision on the risky label. Evaluation checks every candidate against them.</dd></div>
            <div><dt>Every decision is on the record</dt><dd>Who requested data, which features were kept, which model shipped and who switched it on. A regulator can follow the whole trail.</dd></div>
            <div><dt>Built for many customers at once</dt><dd>Service data scientists move solutions for every customer from one studio, each customer’s data sealed in its own archive.</dd></div>
          </dl>
        </div>
      </section>

      <section className="tab-panel" role="tabpanel" id="panel-why" aria-labelledby="tab-why" tabIndex={0} hidden={tab !== 'why'}>
        <div className="doc-block doc-block--first">
          <h2 className="doc-h2">The problem it solves</h2>
          <div className="prose">
            <p>
              Banks, brokers, trading desks and insurers must record and supervise what their people
              say: email, chat, collaboration tools, social messages and voice. Rules such as SEC
              Rule 17a-4, FINRA Rule 3110 and MiFID II require the records to be kept and reviewed,
              and the archives that hold them are run by providers such as Global Relay, Smarsh and
              Bloomberg Vault.
            </p>
            <p>
              Most surveillance still runs on lexicons: lists of risky words. They flag enormous
              volumes of harmless messages and miss anything said in code. A trained model reads
              context far better, but training one needs the most sensitive messages a firm holds,
              and those can’t be handed to a vendor.
            </p>
            <p>
              Cipher Lab removes that trade-off. Service data scientists build the model for the
              customer while working only with labels, counts and aggregates.
            </p>
          </div>
        </div>

        <div className="doc-block">
          <h2 className="doc-h2">Who works in it</h2>
          <table className="table">
            <caption className="visually-hidden">Roles in Cipher Lab</caption>
            <thead><tr><th scope="col">Role</th><th scope="col">What they do</th></tr></thead>
            <tbody>
              <tr><th scope="row">Service data scientist</th><td>Moves each solution through the stages, across many customers. The studio is built for them.</td></tr>
              <tr><th scope="row">Solution owner</th><td>Sits at the customer, agrees the contract and approves what goes live.</td></tr>
              <tr><th scope="row">Compliance reviewer</th><td>Needs to know why a message was flagged, and to show their regulator.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="tab-panel" role="tabpanel" id="panel-changes" aria-labelledby="tab-changes" tabIndex={0} hidden={tab !== 'changes'}>
        <div className="doc-block doc-block--first">
          <h2 className="doc-h2">From 2019 to now</h2>
          <p className="doc-p">The rebuild keeps the original lifecycle and revisits each stage with what is possible today.</p>
          <table className="table">
            <caption className="visually-hidden">Original design compared with the rebuild</caption>
            <thead>
              <tr><th scope="col">Stage</th><th scope="col">2019 design</th><th scope="col">Rebuild</th></tr>
            </thead>
            <tbody>
              <tr><th scope="row">Data fulfillment</th><td>Press “Request status” until the counts arrive</td><td>Live request status, with a notice when every label is ready</td></tr>
              <tr><th scope="row">Data analysis</th><td>Top words and phrases shown as-is</td><td>Aggregates with privacy noise, so no single message can be recovered</td></tr>
              <tr><th scope="row">Training</th><td>Random forest, naive Bayes and logistic regression on word counts</td><td>Those models kept as baselines beside language-model classifiers</td></tr>
              <tr><th scope="row">Model evaluation</th><td>Metrics side by side</td><td>Pass or fail against the contract’s criteria, and why each message was flagged</td></tr>
              <tr><th scope="row">Deployment</th><td>Switch a model on</td><td>Versioned services, and monitoring for drift after go-live</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

const LockIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="3" y="7" width="10" height="7" rx="1.5" /><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
  </svg>
);
const ExitIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3h4v4M13 3 7 9M11 10v3H3V5h3" />
  </svg>
);
