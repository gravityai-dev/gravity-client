/**
 * GravityContainer
 * Root component for rendering Gravity AI chat interface
 * Preserves the render prop pattern that developers love
 */

import React from 'react';
import { useGravity } from '../hooks/useGravity';

interface GravityContainerProps {
  children: (gravity: ReturnType<typeof useGravity>) => React.ReactNode;
  className?: string;
}

export const GravityContainer: React.FC<GravityContainerProps> = ({ 
  children, 
  className = "" 
}) => {
  // Get full Gravity state and methods from the hook
  const gravity = useGravity();
  
  // Render the children function with the full gravity state
  return <div className={className}>{children(gravity)}</div>;
};
