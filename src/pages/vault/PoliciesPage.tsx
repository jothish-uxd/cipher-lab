import { Link } from 'react-router-dom';
import { MESSAGES } from '../../data/vault/messages';
import { POLICIES, policyModel, predictionModel } from '../../data/vault/policies';
import { openMatches, useReview } from '../../data/vault/review';
import { useStoreVersion } from '../../data/store';
import { labRoutes, modelLive, modelStatus, ORG } from '../../data/vault/lab';
import { tagPath } from '../../components/vault/cards';
import { usePageTitle } from '../../components/usePageTitle';

/** Policies running in this vault, and the Cipher Lab model behind each one. */
export default function PoliciesPage() {
  const h = usePageTitle('Vault policies');
  useStoreVersion();
  const r = useReview();

  return (
    <div className="page-pad" data-scroll>
      <div className="page-head">
        <p className="page-kicker">{ORG.name} · {ORG.vaultProvider}</p>
        <h1 ref={h} tabIndex={-1} className="page-title">Policies</h1>
        <p className="page-lede">
          Each policy combines a lexicon, the vault’s AI predictions and, where one is deployed, a model trained in the Lab.
          Models score messages inside the vault; nothing leaves it.
        </p>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Policy</th>
              <th scope="col">Watches</th>
              <th scope="col">Detectors</th>
              <th scope="col">Cipher Lab model</th>
              <th scope="col" className="num">Open matches</th>
            </tr>
          </thead>
          <tbody>
            {POLICIES.map((p) => {
              const model = policyModel(p);
              const open = MESSAGES.reduce((n, m) => n + openMatches(m, r).filter((x) => x.policy === p.id).length, 0);
              return (
                <tr key={p.id}>
                  <th scope="row">
                    <Link to={`/vault/policy-${p.id}`} className="row-link">{p.name}</Link> <span className="tag">v{p.version}</span>
                    <p className="cell-note">{p.about}</p>
                  </th>
                  <td><ul className="cell-list">{p.scope.map((t) => <li key={t}>{tagPath(t)}</li>)}</ul></td>
                  <td>
                    <ul className="cell-list">
                      <li>Lexicon, {p.lexicon.length} phrases</li>
                      {p.uses.map((u) => <li key={u}>{predictionModel(u).model} <span className="mono">v{predictionModel(u).version}</span></li>)}
                    </ul>
                  </td>
                  <td>
                    {model ? (
                      <div className="cell-model">
                        <span>{model.name} <span className="mono">{model.version}</span></span>
                        <span className={`status${modelLive(model) ? ' status--in-progress' : ''}`}>{modelStatus(model)}</span>
                        <Link className="ext-link" to={labRoutes.model(model)}>Open in the Lab</Link>
                      </div>
                    ) : (
                      <div className="cell-model">
                        <span className="muted">Lexicon only</span>
                        <Link className="ext-link" to={labRoutes.newSolution()}>Train one in the Lab</Link>
                      </div>
                    )}
                  </td>
                  <td className="num">{open}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
