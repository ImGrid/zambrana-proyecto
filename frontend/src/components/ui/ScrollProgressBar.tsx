import { motion, useScroll } from 'motion/react';
import { cn } from '@/lib/utils';

interface ScrollProgressBarProps {
  className?: string;
  color?: string;
  height?: string;
  position?: 'top' | 'bottom';
}

export function ScrollProgressBar({
  className,
  color = 'bg-coral-600',
  height = 'h-1',
  position = 'top',
}: ScrollProgressBarProps) {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      className={cn(
        'fixed left-0 right-0 z-50',
        height,
        color,
        position === 'top' ? 'top-0' : 'bottom-0',
        className
      )}
      style={{
        scaleX: scrollYProgress,
        transformOrigin: 'left',
      }}
    />
  );
}
