import { brand } from '@/lib/site';

interface Props {
  /** Height class for the skull signet (narrow viewports). */
  skullClass?: string;
  /** Height class for the wordmark (from `sm` upwards). */
  wordmarkClass?: string;
}

/**
 * The real signet from public/assets/brand: skull on narrow viewports, the ZOMBIE wordmark
 * (which carries the skull in its O) once there is room for about 160 px.
 * Dark-background versions only; never recoloured, no glow.
 */
export default function BrandMark({ skullClass = 'h-9', wordmarkClass = 'h-11' }: Props) {
  return (
    <>
      <img src={brand.skullOnDark} alt="Zombie Reality Breach" className={`${skullClass} w-auto sm:hidden`} />
      <img src={brand.wordmarkOnDark} alt="Zombie Reality Breach" className={`${wordmarkClass} w-auto hidden sm:block`} />
    </>
  );
}
