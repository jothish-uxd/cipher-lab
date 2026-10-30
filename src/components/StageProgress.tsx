import { STAGES, stageIndex, type StageId } from '../data/stages';

/** Compact "4 of 7: Feature engineering" with a segmented bar. */
export default function StageProgress({ stage }: { stage: StageId }) {
  const i = stageIndex(stage);
  const s = STAGES[i];
  return (
    <span className="stage-progress">
      <span className="stage-progress__bar" aria-hidden="true">
        {STAGES.map((x, n) => (
          <span key={x.id} className={n < i ? 'is-done' : n === i ? 'is-current' : ''} />
        ))}
      </span>
      <span className="stage-progress__text">
        <span className="visually-hidden">Stage {i + 1} of {STAGES.length}: </span>
        {s.name}
      </span>
    </span>
  );
}
