import { asset } from '@/lib/site';

interface Props {
  /** File name in public/assets/weapons (<id>_600.webp, <id>_1200.webp), 16:9 with a transparent background. */
  id: string;
  alt: string;
  className?: string;
  /** `sizes` attribute, default a third of the viewport on desktop. */
  sizes?: string;
  loading?: 'eager' | 'lazy';
}

function weaponImageUrl(id: string, width: 600 | 1200 = 600): string {
  return asset(`assets/weapons/${id}_${width}.webp`);
}

/** Render of one of the game's weapon or mod models (scripts/Build-WeaponImages.ps1). */
export default function WeaponImage({ id, alt, className, sizes = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw', loading = 'lazy' }: Props) {
  return (
    <img
      src={weaponImageUrl(id, 600)}
      srcSet={`${weaponImageUrl(id, 600)} 600w, ${weaponImageUrl(id, 1200)} 1200w`}
      sizes={sizes}
      width={1200}
      height={675}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
    />
  );
}
