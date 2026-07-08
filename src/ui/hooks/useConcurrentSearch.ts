import { useEffect, useState } from "react";
import {
  idleSearchState,
  runConcurrentSearch,
  type ConcurrentSearchState,
} from "../../core/search";

export type { SourceState, ConcurrentSearchState } from "../../core/search";

export function useConcurrentSearch(query: string): ConcurrentSearchState {
  const [state, setState] = useState<ConcurrentSearchState>(idleSearchState);

  useEffect(() => {
    const ctrl = new AbortController();
    let alive = true;

    void runConcurrentSearch(
      query,
      {
        onUpdate: (next) => {
          if (alive) setState(next);
        },
      },
      ctrl.signal,
    );

    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [query]);

  return state;
}
