import React from 'react';
import { BadgeCheck } from 'lucide-react';
import { initials } from '../utils/format';

export interface ArtistAvatarProps {
  name: string;
  size?: number;
  verified?: boolean;
  imageUrl?: string;
  src?: string;
}

export default function ArtistAvatar({ name, size = 40, verified, imageUrl, src }: ArtistAvatarProps) {
  const imageSource = imageUrl || src;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {imageSource ? (
        <img
          src={imageSource}
          alt={name}
          className="h-full w-full rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-full bg-cobalt-500 font-display font-semibold text-ink-950"
          style={{ width: size, height: size, fontSize: size * 0.38 }}
        >
          {initials(name)}
        </div>
      )}
      {verified && (
        <BadgeCheck
          size={size * 0.4}
          className="absolute -bottom-0.5 -right-0.5 rounded-full bg-ink-900 text-teal-400"
        />
      )}
    </div>
  );
}
