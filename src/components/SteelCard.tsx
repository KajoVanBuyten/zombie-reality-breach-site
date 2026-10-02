import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export default function SteelCard({ children, className = '' }: Props) {
  return (
    <div className={`steel-card rounded-sm overflow-hidden ${className}`}>
      <div className="absolute top-2 left-2 rivet" />
      <div className="absolute top-2 right-2 rivet" />
      <div className="absolute bottom-2 left-2 rivet" />
      <div className="absolute bottom-2 right-2 rivet" />
      {children}
    </div>
  );
}
