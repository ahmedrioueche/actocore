import type {
  ActocoreLoadingConfig,
  ActocoreLoadingInitStyle,
  ActocoreLoadingThinkingStyle,
} from '../config/types';
import { SDK_LOADING_DEFAULTS } from '../config/sdk-defaults';

export type ResolvedLoadingConfig = Required<ActocoreLoadingConfig>;

export function resolveLoadingConfig(
  loading?: ActocoreLoadingConfig,
): ResolvedLoadingConfig {
  return {
    initStyle: loading?.initStyle ?? SDK_LOADING_DEFAULTS.initStyle,
    thinkingStyle:
      loading?.thinkingStyle ?? SDK_LOADING_DEFAULTS.thinkingStyle,
    thinkingAnimation:
      loading?.thinkingAnimation ?? SDK_LOADING_DEFAULTS.thinkingAnimation,
  };
}

export function initStyleShowsBar(initStyle: ActocoreLoadingInitStyle): boolean {
  return initStyle !== 'centered' && initStyle !== 'none';
}

export function initStyleShowsInitBody(
  initStyle: ActocoreLoadingInitStyle,
): boolean {
  return initStyle !== 'bar-only' && initStyle !== 'none';
}

export function initStyleShowsCloud(initStyle: ActocoreLoadingInitStyle): boolean {
  return (
    initStyle === 'centered' ||
    initStyle === 'bar-and-animation' ||
    initStyle === 'bar-and-animation-text'
  );
}

export function initStyleShowsInitText(
  initStyle: ActocoreLoadingInitStyle,
): boolean {
  return (
    initStyle === 'bar-and-centered' ||
    initStyle === 'bar-and-animation-text' ||
    initStyle === 'centered'
  );
}

export function thinkingStyleIncludesText(
  style: ActocoreLoadingThinkingStyle,
): boolean {
  return style === 'text' || style === 'text-and-dots';
}

export function thinkingStyleIncludesDots(
  style: ActocoreLoadingThinkingStyle,
): boolean {
  return style === 'dots' || style === 'text-and-dots';
}
