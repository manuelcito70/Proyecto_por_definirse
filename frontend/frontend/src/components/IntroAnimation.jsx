import React, { useEffect, useState, useRef } from 'react';
import './IntroAnimation.css';

const pal = ['#ff1a1a', '#ff5a1f', '#ff2d95', '#e50914', '#ffb300', '#3a4cff', '#b1060f'];
const r = (a, b) => a + Math.random() * (b - a);

const IntroAnimation = ({ onComplete }) => {
  const [stage, setStage] = useState('intro-play');
  const furRef = useRef(null);
  const burstRef = useRef(null);

  useEffect(() => {
    // Generar SVG rects para "fur"
    if (furRef.current && furRef.current.children.length === 0) {
      const NS = 'http://www.w3.org/2000/svg';
      for (let i = 0; i < 31; i++) {
        const e = document.createElementNS(NS, 'rect');
        e.setAttribute('class', 'intro-fur-rect ' + (i % 2 ? 'fr' : 'fl'));
        e.setAttribute('x', r(0, 300));
        e.setAttribute('y', 0);
        e.setAttribute('width', r(3, 12));
        e.setAttribute('height', 400);
        e.setAttribute('fill', pal[Math.floor(r(0, pal.length))]);
        e.setAttribute('opacity', r(.35, .9));
        e.style.animationDelay = (-r(0, 2.2)) + 's';
        e.style.animationDuration = r(1.6, 3) + 's';
        furRef.current.appendChild(e);
      }
    }

    // Generar divs para "burst"
    if (burstRef.current && burstRef.current.children.length === 0) {
      const n = 48;
      for (let i = 0; i < n; i++) {
        const b = document.createElement('i');
        const c1 = pal[Math.floor(r(0, pal.length))];
        const c2 = pal[Math.floor(r(0, pal.length))];
        b.style.background = `linear-gradient(${c1},${c2} 50%,${c1})`;
        b.style.animationDelay = (3.5 + Math.abs(i - n / 2) / n * .9 + r(0, .25)) + 's';
        burstRef.current.appendChild(b);
      }
    }

    // Temporizador para iniciar la partición (split transition)
    // 6600ms es lo que dura la intro original
    const splitTimer = setTimeout(() => {
      setStage('splitting');
      
      // Esperar a que termine la transición de split (0.8s) para desmontar
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 800);
    }, 6600);

    return () => {
      clearTimeout(splitTimer);
    };
  }, [onComplete]);

  return (
    <div className={`intro-fullscreen-container ${stage}`}>
      
      {/* Mitades negras para el efecto Dividir (Split) al finalizar */}
      <div className="intro-half left"></div>
      <div className="intro-half right"></div>

      {/* Contenido de la animación (Logo y explosión) */}
      <div className="intro-content">
        <div className="intro-stage">
          <div className="intro-logo">
            <svg viewBox="0 0 300 400" aria-label="F">
              <defs>
                <linearGradient id="side" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stop-color="#8a050c" />
                  <stop offset="1" stop-color="#b1060f" />
                </linearGradient>
                <linearGradient id="diag" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stop-color="#e50914" />
                  <stop offset="1" stop-color="#9b0610" />
                </linearGradient>
                <clipPath id="fclip">
                  <rect x="40" y="20" width="60" height="360" />
                  <rect x="40" y="20" width="220" height="60" />
                  <rect x="40" y="160" width="160" height="60" />
                </clipPath>
              </defs>
              <rect className="intro-part p1" x="40" y="20" width="60" height="360" fill="url(#side)" />
              <rect className="intro-part p2" x="40" y="20" width="220" height="60" fill="url(#diag)" />
              <rect className="intro-part p3" x="40" y="160" width="160" height="60" fill="url(#diag)" />
              <g className="intro-fur" ref={furRef} clipPath="url(#fclip)"></g>
            </svg>
          </div>
        </div>
        <div className="intro-burst" ref={burstRef}></div>
        <div className="intro-word">F.I.N.I.</div>
      </div>
    </div>
  );
};

export default IntroAnimation;
