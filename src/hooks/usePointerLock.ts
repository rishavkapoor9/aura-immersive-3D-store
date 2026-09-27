import { useCallback, useEffect, useState } from 'react';

export function usePointerLock(target: React.RefObject<HTMLElement>) {
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const handleChange = () => setIsLocked(document.pointerLockElement === target.current);
    document.addEventListener('pointerlockchange', handleChange);
    return () => document.removeEventListener('pointerlockchange', handleChange);
  }, [target]);

  const lock = useCallback(() => {
    target.current?.requestPointerLock();
  }, [target]);

  const unlock = useCallback(() => {
    if (document.pointerLockElement) document.exitPointerLock();
  }, []);

  return { isLocked, lock, unlock };
}
