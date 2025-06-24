import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  animate?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ 
  className, 
  children, 
  animate = false,
  onClick
}) => {
  const CardComponent = animate ? motion.div : 'div';
  
  const animationProps = animate ? {
    whileHover: { scale: 1.03 },
    whileTap: { scale: 0.98 },
    transition: { type: 'spring', stiffness: 300, damping: 20 }
  } : {};
  
  return (
    <CardComponent
      className={clsx(
        'bg-white rounded-lg shadow-md overflow-hidden',
        { 'cursor-pointer': onClick },
        className
      )}
      onClick={onClick}
      {...animationProps}
    >
      {children}
    </CardComponent>
  );
};

export const CardHeader: React.FC<{ className?: string; children: React.ReactNode }> = ({ 
  className, 
  children 
}) => {
  return (
    <div className={clsx('p-5 pb-0', className)}>
      {children}
    </div>
  );
};

export const CardContent: React.FC<{ className?: string; children: React.ReactNode }> = ({ 
  className, 
  children 
}) => {
  return (
    <div className={clsx('p-5', className)}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<{ className?: string; children: React.ReactNode }> = ({ 
  className, 
  children 
}) => {
  return (
    <div className={clsx('p-5 pt-0', className)}>
      {children}
    </div>
  );
};