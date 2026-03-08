import { Button } from './ui/button';

interface ButtonPrimaryProps {
  onClick: () => void;
  children: React.ReactNode;
}

export function ButtonPrimary({ onClick, children }: ButtonPrimaryProps) {
  return (
    <Button
      onClick={onClick}
      size="sm"
      className="bg-cta hover:bg-cta/90 text-cta-foreground rounded-full text-[18px] px-[12px] py-[5px]"
    >
      {children}
    </Button>
  );
}
