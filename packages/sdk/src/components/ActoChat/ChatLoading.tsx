import { useActocoreUiConfig } from '../../context/actocore-context';
import { useUiText } from '../../hooks/use-ui-text';
import {
  initStyleShowsCloud,
  initStyleShowsInitBody,
  initStyleShowsInitText,
} from '../../utils/resolve-loading-config';

function LoadingCloudIcon() {
  return (
    <svg
      className="ac-chat__loading-cloud"
      width="40"
      height="32"
      viewBox="0 0 28 22"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M8.5 20.5a6.5 6.5 0 0 1-1.2-12.9A8 8 0 0 1 22.2 4.5a5.5 5.5 0 0 1 .3 11h-14Z"
      />
    </svg>
  );
}

export function ChatLoading() {
  const ui = useActocoreUiConfig();
  const label = useUiText('loading');
  const initStyle = ui.loading.initStyle;

  if (!initStyleShowsInitBody(initStyle)) {
    return null;
  }

  const showCloud = initStyleShowsCloud(initStyle);
  const showText = initStyleShowsInitText(initStyle);

  return (
    <div className="ac-chat__loading" role="status" aria-live="polite">
      {showCloud ? <LoadingCloudIcon /> : null}
      {showText ? <p className="ac-chat__loading-text">{label}</p> : null}
    </div>
  );
}
