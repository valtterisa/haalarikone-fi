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

  const backgroundImageMatch = hex.match(/background-image:\s*([^;]+);/);
  if (backgroundImageMatch) {
    return { backgroundImage: backgroundImageMatch[1] };
  }

  const backgroundColorMatch = hex.match(/background:\s*([^;]+);/);
  if (backgroundColorMatch) {
    return { background: backgroundColorMatch[1] };
  }

  return { backgroundColor: '#ffffff' };
};

export function capitalizeFirstLetter(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
