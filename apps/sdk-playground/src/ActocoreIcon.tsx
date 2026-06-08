import actocoreIconSrc from '@actocore/shared-assets/actocore_icon.svg';

interface ActocoreIconProps {
  size?: number;
}

export function ActocoreIcon({ size = 36 }: ActocoreIconProps) {
  return (
    <div
      aria-hidden
      style={{
        position: 'relative',
        width: size,
        height: size,
        overflow: 'hidden',
        borderRadius: 10,
        flexShrink: 0,
      }}
    >
      <img
        src={actocoreIconSrc}
        alt=""
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: '340%',
          maxWidth: 'none',
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  );
}
