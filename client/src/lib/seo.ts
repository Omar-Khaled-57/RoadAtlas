import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface PageMetaOptions {
  titleKey: string;
  descriptionKey?: string;
  titleParams?: Record<string, unknown>;
  descriptionParams?: Record<string, unknown>;
}

function ensureMetaTag(name: string): HTMLMetaElement {
  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  return tag;
}

export function usePageMeta({
  titleKey,
  descriptionKey,
  titleParams,
  descriptionParams,
}: PageMetaOptions) {
  const { t } = useTranslation();

  useEffect(() => {
    const title = t(titleKey, titleParams);
    document.title = title ? `${title} · RoadAtlas` : 'RoadAtlas';

    if (descriptionKey) {
      const description = t(descriptionKey, descriptionParams);
      if (description) {
        ensureMetaTag('description').setAttribute('content', description);
      }
    }
  }, [descriptionKey, descriptionParams, t, titleKey, titleParams]);
}
