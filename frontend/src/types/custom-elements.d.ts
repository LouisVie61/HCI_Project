import type { HTMLAttributes } from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'pose-viewer': HTMLAttributes<HTMLElement> & {
        src?: string;
        autoplay?: boolean | string;
        loop?: boolean | string;
        background?: string;
        width?: string;
        height?: string;
        padding?: string;
        aspectRatio?: number;
        renderer?: 'canvas' | 'svg' | 'interactive';
        thickness?: number;
      };
    }
  }
}
