import { KEYART_JPG_WIDTH, KEYART_RATIO, KEYART_WIDTHS, keyArtJpg, keyArtSrcSet, type KeyArtKind, type KeyArtTheme } from '@/lib/site';

interface Props {
  theme: KeyArtTheme;
  /** Default `hero` (16:9, no lettering). */
  kind?: KeyArtKind;
  /** Subset of widths to offer; default every width of that kind. */
  widths?: readonly number[];
  /** `sizes` attribute, default `100vw`. */
  sizes?: string;
  alt?: string;
  className?: string;
  loading?: 'eager' | 'lazy';
  /** Below this viewport width (px) the `portrait-clean` variant is served instead (for the home hero). */
  portraitBelow?: number;
}

/**
 * Responsive key art: WebP `srcset` with a JPG fallback, from public/assets/keyart.
 * Renders a `<picture>`; the `className` goes to the `<img>`.
 */
export default function KeyArt({ theme, kind = 'hero', widths, sizes = '100vw', alt = '', className, loading = 'lazy', portraitBelow }: Props) {
  const jpgWidth = KEYART_JPG_WIDTH[kind];
  return (
    <picture>
      {portraitBelow !== undefined && (
        <source
          media={`(max-width: ${portraitBelow - 1}px)`}
          type="image/webp"
          srcSet={keyArtSrcSet(theme, 'portrait-clean', KEYART_WIDTHS['portrait-clean'])}
          sizes="100vw"
        />
      )}
      <source type="image/webp" srcSet={keyArtSrcSet(theme, kind, widths)} sizes={sizes} />
      <img
        src={keyArtJpg(theme, kind)}
        width={jpgWidth}
        height={Math.round(jpgWidth / KEYART_RATIO[kind])}
        alt={alt}
        className={className}
        loading={loading}
        decoding={loading === 'lazy' ? 'async' : undefined}
      />
    </picture>
  );
}
