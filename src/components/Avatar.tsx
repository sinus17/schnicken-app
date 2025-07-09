import React, { useState } from 'react';

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ name, avatarUrl, size = 'medium', className = '' }) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    small: 'w-8 h-8 text-sm',
    medium: 'w-10 h-10 text-base',
    large: 'w-12 h-12 text-lg'
  };

  const getInitials = (name: string) => {
    return name?.substring(0, 2).toUpperCase() || '??';
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const shouldShowImage = avatarUrl && !imageError;

  return (
    <div className={`${sizeClasses[size]} bg-schnicken-medium rounded-full flex items-center justify-center text-white overflow-hidden ${className}`}>
      {shouldShowImage ? (
        <img
          src={avatarUrl}
          alt={`${name} Avatar`}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      ) : (
        <span className="font-medium">{getInitials(name)}</span>
      )}
    </div>
  );
};

export default Avatar;
