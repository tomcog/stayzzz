import { Button } from './ui/button';
import { LucideIcon } from 'lucide-react';

interface ButtonFabProps {
  onClick: () => void;
  disabled?: boolean;
  icon: LucideIcon;
  isAnimating?: boolean;
  className?: string;
  label: string;
}

export function ButtonFab({ onClick, disabled = false, icon: Icon, isAnimating = false, className = '', label }: ButtonFabProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      size="icon"
      className={`fixed bottom-6 left-6 h-12 w-12 rounded-full shadow-lg z-50 bg-white hover:bg-gray-50 ${className}`}
      aria-label={label}
    >
      <Icon className={`w-5 h-5 text-gray-500 ${isAnimating ? 'animate-spin' : ''}`} />
    </Button>
  );
}
