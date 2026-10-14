import React, { useState, useEffect } from 'react';
import { isImageUrl } from '../utils/imageUtils';

export interface CategoryIconProps {
  iconOrUrl?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackEmoji?: string;
}

const SIZE_MAP = {
  xs: {
    container: 'w-5 h-5 text-xs',
    img: 'w-5 h-5 rounded-md',
  },
  sm: {
    container: 'w-6 h-6 text-sm',
    img: 'w-6 h-6 rounded-lg',
  },
  md: {
    container: 'w-8 h-8 text-lg sm:text-xl',
    img: 'w-8 h-8 rounded-xl',
  },
  lg: {
    container: 'w-10 h-10 text-2xl',
    img: 'w-10 h-10 rounded-xl',
  },
  xl: {
    container: 'w-12 h-12 text-3xl',
    img: 'w-12 h-12 rounded-2xl',
  },
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  iconOrUrl,
  name = 'Categoría',
  size = 'md',
  className = '',
  fallbackEmoji = '🏷️',
}) => {
  const [imgError, setImgError] = useState(false);
  const isImage = isImageUrl(iconOrUrl);

  // Reset error state if the icon/URL changes
  useEffect(() => {
    setImgError(false);
  }, [iconOrUrl]);

  const sizeClasses = SIZE_MAP[size] || SIZE_MAP.md;

  if (isImage && !imgError && iconOrUrl) {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden bg-[#FAF8F5] border border-[#F0EBE1] shadow-2xs ${sizeClasses.img} ${className}`}
      >
        <img
          src={iconOrUrl}
          alt={name}
          loading="lazy"
          crossOrigin="anonymous"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-[inherit] transition-opacity duration-200"
        />
      </div>
    );
  }

  // If it's a broken image, show a tasteful fallback
  if (isImage && imgError) {
    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 select-none bg-[#F5EFE6] text-[#7A7267] rounded-xl font-bold ${sizeClasses.container} ${className}`}
        title={`${name} (imagen no disponible)`}
      >
        {fallbackEmoji}
      </span>
    );
  }

  // Standard Emoji or text icon
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 select-none leading-none ${sizeClasses.container} ${className}`}
      role="img"
      aria-label={name}
    >
      {iconOrUrl || '💰'}
    </span>
  );
};
