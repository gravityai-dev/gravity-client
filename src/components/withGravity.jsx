import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGravity, useActiveResponse } from '../hooks';

/**
 * Higher-Order Component with granular state control and memo optimization
 * 
 * Usage:
 * const ProgressUpdate = withGravity(ProgressUpdateUI, {
 *   select: (gravity) => ({
 *     isLoading: gravity.isLoading,
 *     progress: gravity.activeResponse?.progress
 *   })
 * });
 * 
 * const MessageChunk = withGravity(MessageChunkUI); // No state needed
 */
export const withGravity = (UIComponent, options = {}) => {
  const { 
    select = null,           // Custom state selector function
    needsActiveResponse = false 
  } = options;
  
  const SmartComponent = React.memo((props) => {
    const gravity = useGravity();
    const activeResponse = needsActiveResponse ? useActiveResponse() : null;
    
    // Apply custom selector to extract only needed state
    const selectedState = select ? select(gravity, activeResponse) : {};
    
    // Extract component.props from each selected state property
    const extractedProps = {};
    if (selectedState && typeof selectedState === 'object') {
      Object.keys(selectedState).forEach(key => {
        const value = selectedState[key];
        // If the value has component.props, extract those props
        if (value && value.component && value.component.props) {
          extractedProps[key] = value.component.props;
        } else {
          extractedProps[key] = value;
        }
      });
    }
    
    return (
      <UIComponent 
        {...props}
        {...extractedProps}
      />
    );
  }, (prevProps, nextProps) => {
    // Use shallow comparison for props
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);
    
    if (prevKeys.length !== nextKeys.length) return false;
    
    for (const key of prevKeys) {
      if (prevProps[key] !== nextProps[key]) {
        return false;
      }
    }
    
    return true;
  });
  
  // Set display name for debugging
  SmartComponent.displayName = `withGravity(${UIComponent.displayName || UIComponent.name || 'Component'})`;
  
  return SmartComponent;
};
