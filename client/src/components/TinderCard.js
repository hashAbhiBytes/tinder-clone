import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { useSpring, animated as Animated } from '@react-spring/web';

const to = (x = 0, y = 0, rot = 0, scale = 1) => ({
  x,
  y,
  rot,
  scale,
  config: { tension: 300, friction: 30 },
});

const TinderCard = forwardRef(({
  children,
  onSwipe = () => {},
  onCardLeftScreen = () => {},
  onSwipeRequirementFulfilled = () => {},
  onSwipeRequirementUnfulfilled = () => {},
  preventSwipe = [],
  swipeThreshold = 100,
  flickOnSwipe = true,
  className = '',
  ...props
}, ref) => {
  const elementRef = useRef(null);
  const isDragging = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  const last = useRef({ x: 0, y: 0, t: 0 });
  const [{ x, y, rot, scale }, api] = useSpring(() => to());

  useImperativeHandle(ref, () => ({
    swipe(dir = 'right') {
      const xDist = dir === 'left' ? -1000 : dir === 'right' ? 1000 : 0;
      const yDist = dir === 'up' ? -1000 : dir === 'down' ? 1000 : 0;
      api.start(to(xDist, yDist, xDist / 10));
      onSwipe(dir);
      setTimeout(() => onCardLeftScreen(dir), 600);
    }
  }));

  const calcDirection = (dx, dy) => {
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
    return dy > 0 ? 'down' : 'up';
  };

  const handleGestureStart = (clientX, clientY) => {
    isDragging.current = true;
    start.current = { x: clientX, y: clientY };
    last.current = { x: clientX, y: clientY, t: Date.now() };
  };

  const handleGestureMove = (clientX, clientY) => {
    if (!isDragging.current) return;

    const dx = clientX - start.current.x;
    const dy = clientY - start.current.y;
    api.start({ x: dx, y: dy, rot: dx / 10, scale: 1.05 });

    const abs = Math.sqrt(dx ** 2 + dy ** 2);
    if (abs > swipeThreshold) {
      onSwipeRequirementFulfilled();
    } else {
      onSwipeRequirementUnfulfilled();
    }
  };

  const handleGestureEnd = (clientX, clientY) => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const dx = clientX - start.current.x;
    const dy = clientY - start.current.y;
    const dir = calcDirection(dx, dy);

    const velocity = (Math.sqrt((dx) ** 2 + (dy) ** 2)) / (Date.now() - last.current.t);

    if (
      (Math.abs(dx) > swipeThreshold || Math.abs(dy) > swipeThreshold) &&
      !preventSwipe.includes(dir) &&
      flickOnSwipe
    ) {
      const xForce = dir === 'left' ? -1000 : dir === 'right' ? 1000 : 0;
      const yForce = dir === 'up' ? -1000 : dir === 'down' ? 1000 : 0;
      api.start(to(xForce, yForce, dx / 10));
      onSwipe(dir);
      setTimeout(() => onCardLeftScreen(dir), 600);
    } else {
      api.start(to()); // Reset position
    }
  };

  // Attach listeners
  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const touchStart = (e) => handleGestureStart(e.touches[0].clientX, e.touches[0].clientY);
    const touchMove = (e) => handleGestureMove(e.touches[0].clientX, e.touches[0].clientY);
    const touchEnd = (e) => handleGestureEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);

    const mouseStart = (e) => handleGestureStart(e.clientX, e.clientY);
    const mouseMove = (e) => handleGestureMove(e.clientX, e.clientY);
    const mouseEnd = (e) => handleGestureEnd(e.clientX, e.clientY);

    el.addEventListener('touchstart', touchStart);
    el.addEventListener('touchmove', touchMove);
    el.addEventListener('touchend', touchEnd);
    el.addEventListener('mousedown', mouseStart);
    el.addEventListener('mousemove', mouseMove);
    el.addEventListener('mouseup', mouseEnd);

    return () => {
      el.removeEventListener('touchstart', touchStart);
      el.removeEventListener('touchmove', touchMove);
      el.removeEventListener('touchend', touchEnd);
      el.removeEventListener('mousedown', mouseStart);
      el.removeEventListener('mousemove', mouseMove);
      el.removeEventListener('mouseup', mouseEnd);
    };
  }, []);

  return (
    <Animated.div
      ref={elementRef}
      className={className}
      style={{
        transform: x
          .to((x) => `translate3d(${x}px, ${y.get()}px, 0) rotate(${rot.get()}deg)`),
        scale,
        touchAction: 'none',
        position: 'absolute',
        willChange: 'transform',
      }}
      {...props}
    >
      {children}
    </Animated.div>
  );
});

export default TinderCard;
