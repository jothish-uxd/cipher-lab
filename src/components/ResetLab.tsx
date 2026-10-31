import ResetButton from './ResetButton';
import { isVaultKey, resetStore } from '../data/store';

/** Reset button in the lab's frame bar. Leaves the vault's review work alone. */
export default function ResetLab() {
  return (
    <ResetButton
      what="lab"
      description="This clears every change made in this browser: contracts, data requests, analysis, training, deployments and new solutions. Customers go back to their starting state. Review work in the vault is kept."
      done="Lab reset. Every customer is back to its starting state."
      to="/lab"
      onReset={() => resetStore((k) => !isVaultKey(k))}
    />
  );
}
