import React from 'react';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  count?: number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  circle = false,
  count = 1,
  className = '',
}) => {
  const widthStyle = typeof width === 'number' ? `${width}px` : width;
  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  const skeletons = Array.from({ length: count }).map((_, i) => (
    <div
      key={i}
      className={`skeleton-loading ${circle ? 'rounded-full' : 'rounded-lg'} ${
        i > 0 ? 'mt-2' : ''
      } ${className}`}
      style={{
        width: widthStyle,
        height: heightStyle,
      }}
    />
  ));

  return <>{skeletons}</>;
};

export const SkeletonCard: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-lg border border-gray-200 p-4 space-y-4">
        <Skeleton width="60%" height={24} />
        <Skeleton width="100%" height={16} />
        <Skeleton width="80%" height={16} />
      </div>
    ))}
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4">
        <Skeleton width={40} height={40} circle />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} />
        </div>
      </div>
    ))}
  </div>
);
