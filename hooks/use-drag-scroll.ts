import { useRef, useEffect } from 'react';

export const useDragScroll = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      startX.current = e.pageX - element.offsetLeft;
      scrollLeft.current = element.scrollLeft;
      element.style.cursor = 'grabbing';
      element.style.userSelect = 'none';
    };

    const handleMouseLeave = () => {
      isDragging.current = false;
      element.style.cursor = 'grab';
      element.style.userSelect = 'auto';
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      element.style.cursor = 'grab';
      element.style.userSelect = 'auto';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const x = e.pageX - element.offsetLeft;
      const walk = (x - startX.current) * 2; // Adjust scroll speed
      element.scrollLeft = scrollLeft.current - walk;
    };

    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mousemove', handleMouseMove);

    // Set initial cursor
    element.style.cursor = 'grab';

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return ref;
};