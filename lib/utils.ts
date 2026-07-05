import React from 'react';

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const parseStyles = (hex: string | null): React.CSSProperties => {
  if (!hex) {
    return { backgroundColor: '#ffffff' };
  }

  const styles: React.CSSProperties = {};

  const backgroundImageMatch = hex.match(/background-image:\s*([^;]+);/);
  if (backgroundImageMatch) {
    styles.backgroundImage = backgroundImageMatch[1];
  }

  const backgroundMatch = hex.match(/background:\s*([^;]+);/);
  if (backgroundMatch) {
    const value = backgroundMatch[1].trim();
    if (value.includes('gradient') || value.includes('url(')) {
      if (!styles.backgroundImage) {
        styles.backgroundImage = value;
      }
    } else {
      styles.backgroundColor = value;
    }
  }

  if (Object.keys(styles).length === 0) {
    return { backgroundColor: '#ffffff' };
  }

  return styles;
};

export function capitalizeFirstLetter(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
