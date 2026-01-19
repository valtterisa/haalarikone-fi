'use client'

import { useEffect, useState } from 'react'
import { motion } from "framer-motion"
import Image from 'next/image';
import { useTranslations } from 'next-intl';

function PlaceholderDisplay() {
    const t = useTranslations('placeholders');
    const [currentMessage, setCurrentMessage] = useState("");

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
        setCurrentMessage(messages[randomIndex]);
    }, [t]);
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div
                className="flex items-center justify-center w-full min-h-[8rem] bg-gray-100 rounded-lg shadow-lg p-4 max-w-xl mx-auto overflow-hidden"
            ><div className="py-8 flex flex-col items-center justify-center gap-4 text-center">
                    <Image
                        src="/no-results.svg"
                        alt="No Results"
                        width={120}
                        height={120}
                    />
                    <p className="text-gray-600 text-base">
                        {currentMessage}
                    </p>
                </div></div>
        </motion.div>
    )
}

export default PlaceholderDisplay