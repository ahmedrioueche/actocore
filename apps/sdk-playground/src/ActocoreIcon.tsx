import actocoreIconSrc from '@actocore/shared-assets/actocore_icon.svg';
import actocoreIconDarkSrc from '@actocore/shared-assets/actocore_icon_dark.svg';
import actocoreIconInverseSrc from '@actocore/shared-assets/actocore_icon_inverse.svg';

export type ActocoreIconVariant = 'brand' | 'inverse' | 'dark';

const ICON_SRC: Record<ActocoreIconVariant, string> = {
  brand: actocoreIconSrc,
  inverse: actocoreIconInverseSrc,
  dark: actocoreIconDarkSrc,
};

interface ActocoreIconProps {
  size?: number;
  variant?: ActocoreIconVariant;
}

export function ActocoreIcon({ size = 36, variant = 'brand' }: ActocoreIconProps) {
  return (
    <img
      src={ICON_SRC[variant]}
      alt=""
      width={size}
      height={size}
      style={{ display: 'block', flexShrink: 0, objectFit: 'contain' }}
    />
  );
}
