import { useState, useCallback } from "react";

interface UseComponentLoaderReturn {
  loadComponent: (componentUrl: string, componentName: string) => Promise<any>;
  componentCache: Map<string, any>;
  loadingComponents: Set<string>;
}

/**
 * Hook to dynamically load and cache React components
 */
export function useComponentLoader(apiUrl: string): UseComponentLoaderReturn {
  const [componentCache, setComponentCache] = useState<Map<string, any>>(new Map());
  const [loadingComponents, setLoadingComponents] = useState<Set<string>>(new Set());

  const loadComponent = useCallback(
    async (componentUrl: string, componentName: string): Promise<any> => {
      // Check cache first
      if (componentCache.has(componentName)) {
        return componentCache.get(componentName);
      }

      // Check if component is already in global scope (IIFE format)
      if ((window as any)[componentName]) {
        const Component = (window as any)[componentName];
        setComponentCache((prev) => {
          const newCache = new Map(prev);
          newCache.set(componentName, Component);
          return newCache;
        });
        return Component;
      }

      // Check if already loading
      if (loadingComponents.has(componentName)) {
        return new Promise((resolve, reject) => {
          const timeout = 30000;
          const startTime = Date.now();
          const checkInterval = setInterval(() => {
            if ((window as any)[componentName]) {
              clearInterval(checkInterval);
              resolve((window as any)[componentName]);
            } else if (Date.now() - startTime > timeout) {
              clearInterval(checkInterval);
              reject(new Error(`Timeout waiting for component ${componentName} to load`));
            }
          }, 100);
        });
      }

      try {
        setLoadingComponents((prev) => new Set(prev).add(componentName));

        const fullUrl = `${apiUrl}${componentUrl}`;

        return new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = fullUrl;
          script.async = true;

          script.onload = () => {
            const Component = (window as any)[componentName];

            if (Component && typeof Component === "function") {
              console.log(`[Loader] ✅ ${componentName} loaded`);

              setComponentCache((prev) => {
                const newCache = new Map(prev);
                newCache.set(componentName, Component);
                return newCache;
              });

              setLoadingComponents((prev) => {
                const newSet = new Set(prev);
                newSet.delete(componentName);
                return newSet;
              });

              resolve(Component);
            } else {
              const error = `Component ${componentName} not found in global scope`;
              console.error(`[Loader] ${error}`);
              setLoadingComponents((prev) => {
                const newSet = new Set(prev);
                newSet.delete(componentName);
                return newSet;
              });
              reject(new Error(error));
            }
          };

          script.onerror = () => {
            const error = `Failed to load script from ${fullUrl}`;
            console.error(`[Loader] ${error}`);
            setLoadingComponents((prev) => {
              const newSet = new Set(prev);
              newSet.delete(componentName);
              return newSet;
            });
            reject(new Error(error));
          };

          document.head.appendChild(script);
        });
      } catch (error) {
        console.error(`[Loader] Failed to load component ${componentName}:`, error);
        setLoadingComponents((prev) => {
          const newSet = new Set(prev);
          newSet.delete(componentName);
          return newSet;
        });
        return null;
      }
    },
    [apiUrl, componentCache, loadingComponents]
  );

  return {
    loadComponent,
    componentCache,
    loadingComponents,
  };
}

export default useComponentLoader;
