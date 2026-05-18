import React from 'react';

interface AvatarProps {
  name?: string | null;
  size?: number | 'full';
  className?: string;
}

export function Avatar({ name, size = 40, className = '' }: AvatarProps) {
  const getInitials = (n?: string | null) => {
    if (!n) return '?';
    return n
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getColor = (n?: string | null) => {
    if (!n) return 'bg-gray-400';
    const colors = [
      'bg-indigo-500', 
      'bg-rose-500', 
      'bg-emerald-500', 
      'bg-amber-500', 
      'bg-sky-500', 
      'bg-violet-500'
    ];
    let hash = 0;
    for (let i = 0; i < n.length; i++) {
      hash = n.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const initials = getInitials(name);
  const bgColor = getColor(name);
  
  const sizeClass = size === 'full' ? 'w-full h-full' : '';
  const sizeStyle = size !== 'full' ? { width: size, height: size } : {};

  return (
    <div 
      className={`rounded-full flex items-center justify-center text-white font-bold select-none ${bgColor} ${sizeClass} ${className}`}
      style={sizeStyle}
    >
      <span style={{ fontSize: size === 'full' ? 'inherit' : (typeof size === 'number' ? size * 0.4 : 'inherit') }}>
        {initials}
      </span>
    </div>
  );
}
