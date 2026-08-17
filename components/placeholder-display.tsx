'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

function PlaceholderDisplay() {
  const t = useTranslations('placeholders');
  const reduceMotion = useReducedMotion();
  const [currentMessage, setCurrentMessage] = useState('');

  useEffect(() => {
    const messages = [
      t('1'),
      t('2'),
      t('3'),
      t('4'),
      t('5'),
      t('6'),
      t('7'),
      t('8'),
      t('9'),
      t('10'),
    ];
    const randomIndex = Math.floor(Math.random() * messages.length);
    setCurrentMessage(messages[randomIndex] ?? '');
  }, [t]);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mx-auto flex min-h-[8rem] w-full max-w-xl items-center justify-center overflow-hidden rounded-xl bg-muted/50 p-4">
        <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
          <Image src="/no-results.svg" alt="" width={120} height={120} />
          <p className="text-base text-muted-foreground">{currentMessage}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default PlaceholderDisplay;
