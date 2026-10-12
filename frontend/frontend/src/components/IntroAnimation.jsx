import React, { useEffect, useState, useRef } from 'react';
import './IntroAnimation.css';

const pal = ['#ff1a1a', '#e50914', '#ff5a1f', '#ffb300', '#ff2d95', '#ff6bd6', '#3a4cff', '#7a3bff', '#b1060f'];
const r = (a, b) => a + Math.random() * (b - a);
const pick = () => pal[Math.floor(r(0, pal.length))];

const IntroAnimation = ({ onComplete }) => {
  const [stage, setStage] = useState('intro-play');
  const furRef = useRef(null);
  const bokehRef = useRef(null);
  const glintsRef = useRef(null);

  useEffect(() => {
    // 1. Generar rayos "fur" dentro del SVG del logo
    if (furRef.current && furRef.current.children.length === 0) {
      const NS = 'http://www.w3.org/2000/svg';
      for (let i = 0; i < 48; i++) {
        const e = document.createElementNS(NS, 'rect');
        e.setAttribute('class', 'fur ' + (i % 2 ? 'fr' : 'fl'));
        e.setAttribute('x', r(0, 460));
        e.setAttribute('y', 0);
        e.setAttribute('width', r(3, 12));
        e.setAttribute('height', 200);
        e.setAttribute('fill', pick());
        e.setAttribute('opacity', r(0.4, 0.95));
        e.style.animationDelay = (-r(0, 2.2)) + 's';
        e.style.animationDuration = r(1.6, 3) + 's';
        furRef.current.appendChild(e);
      }
    }

    // 2. Generar partículas Bokeh
    if (bokehRef.current && bokehRef.current.children.length === 0) {
      for (let i = 0; i < 30; i++) {
        const e = document.createElement('i');
        const z = r(18, 90);
        e.style.cssText = `left:${r(0, 100)}%;top:${r(40, 105)}%;width:${z}px;height:${z}px`;
        e.style.setProperty('--d', (4 + r(0, 2)).toFixed(2) + 's');
        e.style.setProperty('--t', r(3.5, 5.5).toFixed(2) + 's');
        e.style.setProperty('--y', r(20, 45).toFixed(0) + 'vh');
        e.style.setProperty('--x', r(-40, 40).toFixed(0) + 'px');
        e.style.setProperty('--o', r(0.25, 0.6).toFixed(2));
        bokehRef.current.appendChild(e);
      }
    }

    // 3. Generar destellos de luz (Glints)
    if (glintsRef.current && glintsRef.current.children.length === 0) {
      for (let i = 0; i < 18; i++) {
        const e = document.createElement('i');
        e.style.left = r(12, 88) + '%';
        e.style.top = r(22, 78) + '%';
        e.style.setProperty('--s', r(18, 46).toFixed(0) + 'px');
        e.style.setProperty('--d', (4 + r(0, 3.6)).toFixed(2) + 's');
        glintsRef.current.appendChild(e);
      }
    }

    // 4. Temporizador de salida elegante hacia el sistema (Split Doors)
    const splitTimer = setTimeout(() => {
      setStage('splitting');
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 800);
    }, 8500);

    return () => {
      clearTimeout(splitTimer);
    };
  }, [onComplete]);

  return (
    <div className={`intro-fullscreen-container ${stage}`}>
      {/* Cortinas o puertas para transición Split (Modo Oscuro / Modo Claro) */}
      <div className="intro-half left"></div>
      <div className="intro-half right"></div>

      {/* Contenido de la animación cinemática */}
      <div className="intro-content">
        {/* Etapa 1: Formación y animación de logo Netflix-style */}
        <div id="stage" className="intro-stage-container">
          <div id="logo" className="intro-logo-fini">
            <svg viewBox="0 0 460 200" aria-label="F.I.N.I">
              <defs>
                <linearGradient id="side" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#8a050c" />
                  <stop offset="1" stopColor="#b1060f" />
                </linearGradient>
                <linearGradient id="diag" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#e50914" />
                  <stop offset="1" stopColor="#9b0610" />
                </linearGradient>
                <clipPath id="lclip">
                  {/* F */}
                  <rect x="20" y="10" width="30" height="180" />
                  <rect x="20" y="10" width="90" height="30" />
                  <rect x="20" y="85" width="70" height="26" />
                  {/* I */}
                  <rect x="150" y="10" width="30" height="180" />
                  {/* N */}
                  <rect x="230" y="10" width="30" height="180" />
                  <rect x="330" y="10" width="30" height="180" />
                  <polygon points="230,10 260,10 360,190 330,190" />
                  {/* I */}
                  <rect x="410" y="10" width="30" height="180" />
                </clipPath>
              </defs>
              <rect className="part" style={{ '--d': '.1s' }} x="20" y="10" width="30" height="180" fill="url(#side)" />
              <rect className="part h" style={{ '--d': '.5s' }} x="20" y="10" width="90" height="30" fill="url(#side)" />
              <rect className="part h" style={{ '--d': '.7s' }} x="20" y="85" width="70" height="26" fill="url(#side)" />
              <rect className="part" style={{ '--d': '.9s' }} x="150" y="10" width="30" height="180" fill="url(#side)" />
              <rect className="part" style={{ '--d': '1.1s' }} x="230" y="10" width="30" height="180" fill="url(#side)" />
              <rect className="part" style={{ '--d': '1.3s' }} x="330" y="10" width="30" height="180" fill="url(#side)" />
              <polygon className="part" style={{ '--d': '1.5s' }} points="230,10 260,10 360,190 330,190" fill="url(#diag)" />
              <rect className="part" style={{ '--d': '1.8s' }} x="410" y="10" width="30" height="180" fill="url(#side)" />
              <g id="fur" className="intro-fur-group" ref={furRef} clipPath="url(#lclip)"></g>
            </svg>
          </div>
        </div>

        {/* Efectos cinematográficos: halo, velo, bokeh y destellos */}
        <div id="halo" className="intro-halo"></div>
        <div id="veil" className="intro-veil"></div>
        <div id="bokeh" className="intro-bokeh" ref={bokehRef}></div>
        <div id="glints" className="intro-glints" ref={glintsRef}></div>

        {/* Revelación final: Logo UAGRM a la izquierda + F.I.N.I. al centro + Escudo UAGRM a la derecha */}
        <div id="brand" className="intro-brand">
          <div className="intro-brand-header">
            <img src="/logo-uagrm.png" alt="Logo UAGRM" className="intro-uagrm-logo" />
            <div id="word" className="intro-word-title">F.I.N.I.</div>
            <img src="/escudo%20UAGRM.png" alt="Escudo UAGRM" className="intro-uagrm-escudo" />
          </div>
          <div id="sub" className="intro-sub-title">FACULTAD INTEGRAL DE ICHILO</div>
        </div>
      </div>
    </div>
  );
};

export default IntroAnimation;
