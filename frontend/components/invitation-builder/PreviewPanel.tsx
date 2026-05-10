'use client';

import InvitationCard from './InvitationCard';
import type { BuilderState } from './types';

type PreviewPanelProps = {
  data: BuilderState;
};

/** Builder preview only — no music UI here; trim & playback use `music-clip-utils` in the editor Music section. Live invitations keep their own player. */
export default function PreviewPanel({ data }: PreviewPanelProps) {
  return (
    <aside className="relative h-full overflow-y-auto bg-[#f7f1e8] px-3 py-5 dark:bg-slate-950 sm:px-4 sm:py-6 lg:px-5 lg:py-7">
      <div className="mx-auto w-full max-w-[31rem]">
        <InvitationCard data={data} />
      </div>
    </aside>
  );
}
