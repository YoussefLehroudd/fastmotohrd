import { useEffect } from 'react';

export const useScript = (src, onLoad) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    
    // Add onload handler
    if (onLoad) {
      script.onload = () => {
        onLoad();
      };
    }

    // Add error handler
    script.onerror = () => {
      console.error(`Failed to load script: ${src}`);
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [src, onLoad]);
};
