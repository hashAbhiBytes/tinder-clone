import React, { useRef, useImperativeHandle, forwardRef, useEffect, useState } from 'react';
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
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Function to perform a swipe
  const performSwipe = (dir = 'right') => {
    const xDist = dir === 'left' ? -1000 : dir === 'right' ? 1000 : 0;
    const yDist = dir === 'up' ? -1000 : dir === 'down' ? 1000 : 0;
    api.start(to(xDist, yDist, xDist / 10));
    onSwipe(dir);
    setTimeout(() => onCardLeftScreen(dir), 600);
  };

  useImperativeHandle(ref, () => ({
    swipe: performSwipe
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

    if (
      (Math.abs(dx) > swipeThreshold || Math.abs(dy) > swipeThreshold) &&
      !preventSwipe.includes(dir) &&
      flickOnSwipe
    ) {
      performSwipe(dir);
    } else {
      api.start(to()); // Reset position
    }
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Attach listeners for touch/mouse events
  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const touchStart = (e) => handleGestureStart(e.touches[0].clientX, e.touches[0].clientY);
    const touchMove = (e) => handleGestureMove(e.touches[0].clientX, e.touches[0].clientY);
    const touchEnd = (e) => handleGestureEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);

    const mouseStart = (e) => {
      handleGestureStart(e.clientX, e.clientY);
      // Add document-level event listeners for better drag handling
      document.addEventListener('mousemove', mouseMove);
      document.addEventListener('mouseup', mouseEnd);
    };
    
    const mouseMove = (e) => handleGestureMove(e.clientX, e.clientY);
    
    const mouseEnd = (e) => {
      handleGestureEnd(e.clientX, e.clientY);
      // Remove document-level event listeners
      document.removeEventListener('mousemove', mouseMove);
      document.removeEventListener('mouseup', mouseEnd);
    };

    el.addEventListener('touchstart', touchStart);
    el.addEventListener('touchmove', touchMove);
    el.addEventListener('touchend', touchEnd);
    el.addEventListener('mousedown', mouseStart);

    return () => {
      el.removeEventListener('touchstart', touchStart);
      el.removeEventListener('touchmove', touchMove);
      el.removeEventListener('touchend', touchEnd);
      el.removeEventListener('mousedown', mouseStart);
      document.removeEventListener('mousemove', mouseMove);
      document.removeEventListener('mouseup', mouseEnd);
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

// Main container component that includes the card and swipe buttons
const TinderCardContainer = ({ children, ...props }) => {
  const cardRef = useRef(null);
  
  const handleSwipe = (direction) => {
    if (cardRef.current) {
      cardRef.current.swipe(direction);
    }
  };

  return (
    <div className="tinder-card-container" style={{
      position: 'relative',
      width: '100%', 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div className="card-area" style={{
        position: 'relative',
        width: '100%',
        height: '80%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <TinderCard ref={cardRef} {...props}>
          {children}
        </TinderCard>
      </div>
      
      <div className="swipe-buttons" style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        marginTop: '20px'
      }}>
        <button 
          onClick={() => handleSwipe('left')}
          style={{
            background: '#FF4136',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}
        >
          ✕
        </button>
        <button 
          onClick={() => handleSwipe('right')}
          style={{
            background: '#2ECC40',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}
        >
          ♥
        </button>
      </div>
    </div>
  );
};

export { TinderCard, TinderCardContainer };