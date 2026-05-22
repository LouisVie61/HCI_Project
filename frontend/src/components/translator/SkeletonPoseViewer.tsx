import { useEffect, useState } from 'react';

interface SkeletonPoseViewerProps {
  src: string;
}

export const SkeletonPoseViewer = ({ src }: SkeletonPoseViewerProps) => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    const loadPoseViewer = async () => {
      try {
        const module = await import('pose-viewer/loader');
        module.defineCustomElements();
        if (!ignore) {
          setReady(true);
          setError(null);
        }
      } catch {
        if (!ignore) {
          setError('Pose viewer could not be loaded.');
        }
      }
    };

    void loadPoseViewer();

    return () => {
      ignore = true;
    };
  }, []);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-100 px-4 text-center text-sm font-medium text-rose-700">
        {error}
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-100 text-sm font-medium text-slate-500">
        Loading pose viewer...
      </div>
    );
  }

  return (
    <pose-viewer
      src={src}
      autoplay="true"
      background="#f8fafc"
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
};
