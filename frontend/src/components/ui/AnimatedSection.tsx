import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

type AnimationType = 'fadeInUp' | 'fadeIn' | 'slideInLeft' | 'slideInRight' | 'scaleIn' | 'none';

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  viewport?: {
    once?: boolean;
    amount?: number;
    margin?: string;
  };
}

const animations = {
  fadeInUp: {
    initial: { opacity: 0, y: 60 },
    whileInView: { opacity: 1, y: 0 },
  },
  fadeIn: {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
  },
  slideInLeft: {
    initial: { opacity: 0, x: -60 },
    whileInView: { opacity: 1, x: 0 },
  },
  slideInRight: {
    initial: { opacity: 0, x: 60 },
    whileInView: { opacity: 1, x: 0 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    whileInView: { opacity: 1, scale: 1 },
  },
  none: {
    initial: {},
    whileInView: {},
  },
};

export function AnimatedSection({
  children,
  className,
  animation = 'fadeInUp',
  delay = 0,
  duration = 0.8,
  viewport = { once: true, amount: 0.3 },
}: AnimatedSectionProps) {
  const selectedAnimation = animations[animation];

  return (
    <motion.div
      className={cn(className)}
      initial={selectedAnimation.initial}
      whileInView={selectedAnimation.whileInView}
      viewport={viewport}
      transition={{
        duration,
        delay,
        ease: 'easeOut',
      }}
    >
      {children}
    </motion.div>
  );
}
