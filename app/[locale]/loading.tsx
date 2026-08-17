import { CircleNotchIcon } from '@phosphor-icons/react/dist/ssr';
import { getTranslations } from 'next-intl/server';

export default async function Loading() {
  const t = await getTranslations('common');

  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center" role="status">
      <CircleNotchIcon className="h-8 w-8 motion-safe:animate-spin text-green" weight="bold" />
      <span className="sr-only">{t('loading')}</span>
    </div>
  );
}
