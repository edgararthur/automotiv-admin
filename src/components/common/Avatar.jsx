import React from 'react';

const Avatar = ({ name, size = 'medium', src = null }) => {
  // Generate initials from name
  const getInitials = (name) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
  };

  // Define size classes
  const sizeClasses = {
    small: 'h-8 w-8 text-xs',
    medium: 'h-10 w-10 text-sm',
    large: 'h-12 w-12 text-base'
  };

  // Generate a color based on the name string
  const getBackgroundColor = (name) => {
    if (!name) return 'bg-slate-500';
    
    const colors = [
      'bg-red-500',
      'bg-yellow-500',
      'bg-green-500',
      'bg-blue-500',
      'bg-indigo-500',
      'bg-purple-500',
      'bg-pink-500'
    ];
    
    // Simple hash function to generate a consistent index
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash) + name.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  if (src) {
    // If image URL is provided
    return (
      <img 
        src={src} 
        alt={name} 
        className={`${sizeClasses[size]} rounded-full object-cover border border-neutral-200`}
      />
    );
  }

  // Otherwise, show initials with background color
  return (
    <div className={`${sizeClasses[size]} ${getBackgroundColor(name)} rounded-full flex items-center justify-center text-white font-medium`}>
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
