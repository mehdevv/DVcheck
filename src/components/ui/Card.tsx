import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hover = false,
  padding = 'md'
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { y: -2, shadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' } : {}}
      className={clsx(
        'bg-white rounded-xl border border-notion-gray-200 shadow-sm',
        paddingClasses[padding],
        hover && 'cursor-pointer',
        className
      )}
    >
      {children}
    </motion.div>
  );
};


