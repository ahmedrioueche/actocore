import { useUiText } from '../../hooks/use-ui-text';

export function ChatInitProgressBar() {
  const label = useUiText('loading');

  return (
    <div
      className="ac-chat__init-bar"
      role="progressbar"
      aria-valuetext={label}
      aria-label={label}
    >
      <div className="ac-chat__init-bar-track" aria-hidden />
    </div>
  );
}
