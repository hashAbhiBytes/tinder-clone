import { useEffect } from 'react';

const HeartTrail = () => {
    useEffect(() => {
        const createHeart = (e) => {
            const heart = document.createElement('div');
            heart.className = 'heart';
            heart.style.left = `${e.clientX}px`;
            heart.style.top = `${e.clientY}px`;

            document.body.appendChild(heart);

            setTimeout(() => {
                heart.style.opacity = '0';
                heart.style.transform += ' scale(1.5) translateY(-40px)';
            }, 0);

            setTimeout(() => {
                heart.remove();
            }, 1000); // remove after animation
        };

        document.addEventListener('mousemove', createHeart);
        return () => document.removeEventListener('mousemove', createHeart);
    }, []);

    return null; // no UI output
};

export default HeartTrail;
