import { randomUUID } from 'crypto'

import { DEFAULT_SITE_CONFIG, type SiteConfigPayload } from './site-config-defaults'

const SITE_SETTINGS_ID = 'default'
const MAX_SERVICE_CARDS = 10
const MIN_SERVICE_CARDS = 1

const VALID_ICONS = new Set([
  'stethoscope',
  'shield',
  'calendar',
  'heart',
  'baby',
  'sparkles',
])

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function parseIcon(v: unknown, index: number): string {
  if (typeof v === 'string' && VALID_ICONS.has(v)) return v
  const icons = ['stethoscope', 'shield', 'calendar', 'heart', 'baby', 'sparkles']
  return icons[index % icons.length]
}

function normalizeServiceCards(raw: unknown): SiteConfigPayload['serviceCards'] {
  const base = DEFAULT_SITE_CONFIG.serviceCards
  if (!Array.isArray(raw) || raw.length === 0) {
    return base.map((c) => ({ ...c }))
  }

  const parsed = raw.slice(0, MAX_SERVICE_CARDS).map((item, i) => {
    const rec = isRecord(item) ? item : {}
    const fallback = base[i] ?? base[0]
    const imageUrl =
      typeof rec.imageUrl === 'string' && rec.imageUrl.trim() ? rec.imageUrl.trim() : undefined
    return {
      id:
        typeof rec.id === 'string' && rec.id
          ? rec.id
          : typeof fallback.id === 'string'
            ? fallback.id
            : `svc-${randomUUID()}`,
      title: typeof rec.title === 'string' ? rec.title : fallback.title,
      description:
        typeof rec.description === 'string' ? rec.description : fallback.description,
      ...(imageUrl ? { imageUrl } : {}),
      icon: parseIcon(rec.icon, i),
    }
  })

  return parsed.length >= MIN_SERVICE_CARDS
    ? parsed
    : base.map((c) => ({ ...c }))
}

export function normalizeSiteConfig(stored: unknown): SiteConfigPayload {
  const base = DEFAULT_SITE_CONFIG
  if (!isRecord(stored)) {
    return {
      ...base,
      serviceCards: base.serviceCards.map((c) => ({ ...c })),
    }
  }

  const str = (key: keyof SiteConfigPayload): string => {
    const v = stored[key as string]
    const d = base[key]
    return typeof v === 'string' ? v : (d as string)
  }

  return {
    brandName: str('brandName'),
    brandTagline: str('brandTagline'),
    logoUrl: str('logoUrl'),
    heroImageUrl: str('heroImageUrl'),
    heroImageAlt: str('heroImageAlt'),
    heroBadge: str('heroBadge'),
    heroTitle: str('heroTitle'),
    heroDescription: str('heroDescription'),
    heroCaption: str('heroCaption'),
    servicesTitle: str('servicesTitle'),
    servicesSubtitle: str('servicesSubtitle'),
    serviceCards: normalizeServiceCards(stored.serviceCards),
    ctaTitle: str('ctaTitle'),
    ctaDescription: str('ctaDescription'),
    footerNotice: str('footerNotice'),
  }
}

export function mergeSiteConfigPatch(
  current: SiteConfigPayload,
  patch: unknown,
): SiteConfigPayload {
  if (!isRecord(patch)) return current

  const merged = { ...current, ...patch } as Record<string, unknown>
  if (patch && isRecord(patch) && 'serviceCards' in patch) {
    merged.serviceCards = patch.serviceCards
  }
  return normalizeSiteConfig(merged)
}

export { SITE_SETTINGS_ID, DEFAULT_SITE_CONFIG }
