import { Assets } from './assets';

/** Seeded Floral Rose Wedding catalog template id (comparison / shop preview). */
export const FLORAL_ROSE_WEDDING_TEMPLATE_ID = 'cmocq9dnl00018t34vkynxewf';

const DEFAULT_STYLE = {
  textColor: '#e6c628',
  headingColor: '#142e7b',
  backgroundUrl: Assets.mainThumbnail1,
  styleVariant: 'default' as const,
};

type TemplateConfig = {
  theme?: unknown;
  colors?: {
    text?: unknown;
    heading?: unknown;
    primary?: unknown;
  };
  backgroundUrl?: unknown;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export function getTemplateStyleDefaults(template?: unknown) {
  const templateName =
    template && typeof template === 'object' && 'name' in template && typeof (template as { name?: unknown }).name === 'string'
      ? ((template as { name: string }).name || '')
      : '';
  const configCandidate =
    template && typeof template === 'object' && 'config' in template
      ? (template as { config?: unknown }).config
      : undefined;

  const config = (configCandidate && typeof configCandidate === 'object'
    ? (configCandidate as TemplateConfig)
    : undefined);
  const theme = isNonEmptyString(config?.theme) ? config.theme.trim().toLowerCase() : '';
  const isFloralRose = theme === 'floral-rose' || /floral\s*rose/i.test(templateName);

  const textColor = isNonEmptyString(config?.colors?.text)
    ? config.colors.text.trim()
    : DEFAULT_STYLE.textColor;
  const headingColor = isNonEmptyString(config?.colors?.heading)
    ? config.colors.heading.trim()
    : isNonEmptyString(config?.colors?.primary)
      ? config.colors.primary.trim()
      : DEFAULT_STYLE.headingColor;
  const backgroundUrl = isNonEmptyString(config?.backgroundUrl)
    ? config.backgroundUrl.trim()
    : isFloralRose
      ? ''
      : DEFAULT_STYLE.backgroundUrl;

  return {
    textColor: isFloralRose ? '#e6c628' : textColor,
    headingColor: isFloralRose ? '#5e3a26' : headingColor,
    backgroundUrl,
    styleVariant: isFloralRose ? 'floral-rose' : DEFAULT_STYLE.styleVariant,
  };
}
