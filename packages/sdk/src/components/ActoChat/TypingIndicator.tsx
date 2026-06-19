import { useActocoreUiConfig } from '../../context/actocore-context';
import { useUiText } from '../../hooks/use-ui-text';
import { mergeClassNames } from '../../utils/merge-class-names';
import {
  thinkingStyleIncludesDots,
  thinkingStyleIncludesText,
} from '../../utils/resolve-loading-config';

function ThinkingCloudIcon() {
  return (
    <svg
      className="ac-chat__typing-cloud"
      width="28"
      height="22"
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

function TypingDots() {
  return (
    <span className="ac-chat__typing-dots" aria-hidden>
      <span className="ac-chat__typing-dot" />
      <span className="ac-chat__typing-dot" />
      <span className="ac-chat__typing-dot" />
    </span>
  );
}

export function TypingIndicator() {
  const ui = useActocoreUiConfig();
  const label = useUiText('thinking');
  const { thinkingStyle, thinkingAnimation } = ui.loading;

  if (thinkingStyle === 'none') {
    return null;
  }

  const showText = thinkingStyleIncludesText(thinkingStyle);
  const showDots = thinkingStyleIncludesDots(thinkingStyle);
  const showCloud = thinkingStyle === 'dots';
  const animationClass =
    showText && thinkingAnimation !== 'none'
      ? `ac-chat__typing-text--${thinkingAnimation}`
      : undefined;
  const displayLabel =
    animationClass === 'ac-chat__typing-text--ellipsis'
      ? label.replace(/[.…]+$/u, '')
      : label;

  return (
    <div
      className="ac-chat__row ac-chat__row--assistant"
      role="status"
      aria-live="polite"
    >
      <div className="ac-chat__bubble ac-chat__bubble--assistant ac-chat__typing">
        {showCloud ? <ThinkingCloudIcon /> : null}
        {showText ? (
          <span
            className={mergeClassNames('ac-chat__typing-text', animationClass)}
          >
            {displayLabel}
          </span>
        ) : null}
        {showDots ? <TypingDots /> : null}
      </div>
    </div>
  );
}
