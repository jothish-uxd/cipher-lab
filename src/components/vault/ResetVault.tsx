import ResetButton from '../ResetButton';
import { isVaultKey, resetStore } from '../../data/store';

/** Reset button in the vault's frame bar. Leaves the lab's changes alone. */
export default function ResetVault() {
  return (
    <ResetButton
      what="vault"
      description="This clears the review work saved in this browser: read and unread, flagged, escalated and cleared matches, and the reading pane layout. Messages go back to their starting state. Changes in the lab are kept."
      done="Vault reset. Every message is back to its starting state."
      to="/vault/all"
      onReset={() => resetStore(isVaultKey)}
    />
  );
}
