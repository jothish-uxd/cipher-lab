import { Link } from 'react-router-dom';
import { STAGES } from '../data/stages';
import { usePageTitle } from '../components/usePageTitle';

export default function OverviewPage() {
  const h = usePageTitle('Overview');
  const [first, ...inside] = STAGES;

  return (
    <main id="main" className="overview">
      <section className="ov-hero" aria-labelledby="ov-title">
        <h1 ref={h} tabIndex={-1} id="ov-title" className="ov-hero__title">
          Train surveillance models on messages no one is allowed to read.
        </h1>
        <p className="ov-hero__lede">
          Cipher Lab is a service workspace for building, training and deploying models that flag
          misconduct in regulated firms’ electronic communications. The model goes to the archive.
          The messages never come out.
        </p>
        <p><Link to="/studio" className="btn btn--primary">Open the studio</Link></p>
      </section>

      <section className="ov-flow" aria-labelledby="flow-h">
        <h2 id="flow-h" className="ov-h2">One solution, seven stages</h2>
        <p className="ov-text">
          Every solution moves through the same lifecycle. Only the first stage happens outside the
          customer’s archive.
        </p>
        <ol className="flow">
          <li className="flow__stage flow__stage--outside">
            <span className="flow__num" aria-hidden="true">1</span>
            <span className="flow__name">{first.name}</span>
            <span className="flow__desc">{first.summary}</span>
          </li>
          <li className="flow__boundary">
            <p className="flow__boundary-label" id="boundary-label">Inside the customer’s archive</p>
            <ol className="flow__inside" aria-labelledby="boundary-label" start={2}>
              {inside.map((s, i) => (
                <li key={s.id} className={`flow__stage${s.zone === 'crossing' ? ' flow__stage--crossing' : ''}`}>
                  <span className="flow__num" aria-hidden="true">{i + 2}</span>
                  <span className="flow__name">{s.name}</span>
                  <span className="flow__desc">{s.summary}</span>
                  {s.zone === 'crossing' && <span className="flow__exit">Only aggregate metrics leave</span>}
                </li>
              ))}
            </ol>
          </li>
        </ol>
      </section>

      <section className="ov-section ov-split" aria-labelledby="problem-h">
        <h2 id="problem-h" className="ov-h2">The problem it solves</h2>
        <div className="ov-prose">
          <p>
            Banks, brokers, trading desks and insurers must record and supervise what their people
            say: email, chat, collaboration tools, social messages and voice. Rules such as SEC
            Rule 17a-4, FINRA Rule 3110 and MiFID II require the records to be kept and reviewed,
            and the archives that hold them are run by providers such as Global Relay, Smarsh
            and Bloomberg Vault.
          </p>
          <p>
            Most surveillance still runs on lexicons: lists of risky words. They flag enormous
            volumes of harmless messages and miss anything said in code. A trained model reads
            context far better, but training one needs the most sensitive messages a firm holds,
            and those can’t be handed to a vendor.
          </p>
          <p>
            Cipher Lab removes that trade-off. Service data scientists build the model for the
            customer, but they work with labels, counts and aggregates. The content stays sealed
            in the archive the whole time.
          </p>
        </div>
      </section>

      <section className="ov-section" aria-labelledby="principles-h">
        <h2 id="principles-h" className="ov-h2">What it promises customers</h2>
        <dl className="principles">
          <div>
            <dt>The data stays where it is</dt>
            <dd>
              Fulfillment, analysis, training and serving run inside the customer’s archive region.
              Analysts see distributions and counts, never a message.
            </dd>
          </div>
          <div>
            <dt>Success is agreed first</dt>
            <dd>
              Contract capture sets the criteria a model must meet, such as minimum precision on the
              risky label, and evaluation checks every candidate against them.
            </dd>
          </div>
          <div>
            <dt>Every decision is on the record</dt>
            <dd>
              Who requested data, which features were kept, which model was deployed and who switched
              it on. A regulator can follow the whole trail.
            </dd>
          </div>
        </dl>
      </section>

      <section className="ov-section ov-split" aria-labelledby="who-h">
        <h2 id="who-h" className="ov-h2">Who works in it</h2>
        <ul className="roles">
          <li>
            <span className="roles__name">Service data scientists</span>
            <span>Move each solution through the stages across many customers. The studio is built for them.</span>
          </li>
          <li>
            <span className="roles__name">Solution owners</span>
            <span>Sit at the customer, agree the contract and approve what goes live.</span>
          </li>
          <li>
            <span className="roles__name">Compliance reviewers</span>
            <span>Need to understand why a message was flagged, and to show their regulator.</span>
          </li>
        </ul>
      </section>

      <section className="ov-section" aria-labelledby="then-h">
        <h2 id="then-h" className="ov-h2">What the rebuild changes</h2>
        <p className="ov-text">
          The original AI Studio was designed in 2019–2020. This rebuild keeps its lifecycle and
          revisits each stage with what is possible now.
        </p>
        <div className="table-wrap">
          <table className="table compare">
            <caption className="visually-hidden">Original design compared with the rebuild</caption>
            <thead>
              <tr>
                <th scope="col">Stage</th>
                <th scope="col">2019 design</th>
                <th scope="col">Rebuild</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Data fulfillment</th>
                <td>Press “Request status” until the counts arrive</td>
                <td>Live request status, with a notice when every label is ready</td>
              </tr>
              <tr>
                <th scope="row">Data analysis</th>
                <td>Top words and phrases shown as-is</td>
                <td>Aggregates with privacy noise, so no single message can be recovered</td>
              </tr>
              <tr>
                <th scope="row">Training</th>
                <td>Random forest, naive Bayes and logistic regression on word counts</td>
                <td>Those models kept as baselines beside modern language-model classifiers</td>
              </tr>
              <tr>
                <th scope="row">Model evaluation</th>
                <td>Metrics side by side</td>
                <td>Pass or fail against the contract’s criteria, and why each message was flagged</td>
              </tr>
              <tr>
                <th scope="row">Deployment</th>
                <td>Switch a model on</td>
                <td>Versioned services, and monitoring for drift after go-live</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <footer className="ov-foot">
        <p>
          A design rebuild for learning. Customers, people and data in the studio are placeholders
          from the Star Wars galaxy.
        </p>
      </footer>
    </main>
  );
}
