import React from 'react';
import './ThemeToggle.css';

export default function ThemeToggle({ isDark, onToggle }) {
  return (
    <label className="theme-toggle-label">
      <input
        className="theme-toggle-input"
        type="checkbox"
        checked={isDark}
        onChange={onToggle}
      />
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 69.667 44">
        <g transform="translate(3.5 3.5)">
          <g transform="matrix(1, 0, 0, 1, -3.5, -3.5)" filter="url(#container)">
            <rect className="tt-container" width="60.667" height={35} rx="17.5" transform="translate(3.5 3.5)" fill="#83cbd8" />
          </g>
          <g className="tt-button" transform="translate(2.333 2.333)">
            <g className="tt-sun">
              <g transform="matrix(1, 0, 0, 1, -5.83, -5.83)" filter="url(#sun-outer)">
                <circle cx="15.167" cy="15.167" r="15.167" transform="translate(5.83 5.83)" fill="#f8e664" />
              </g>
              <g transform="matrix(1, 0, 0, 1, -5.83, -5.83)" filter="url(#sun)">
                <path d="M11.667,0A11.667,11.667,0,1,1,0,11.667,11.667,11.667,0,0,1,11.667,0Z" transform="translate(9.33 9.33)" fill="rgba(246,254,247,0.29)" />
              </g>
              <circle cx={7} cy={7} r={7} transform="translate(8.167 8.167)" fill="#fcf4b9" />
            </g>
            <g className="tt-moon">
              <g transform="matrix(1, 0, 0, 1, -31.5, -5.83)" filter="url(#moon)">
                <circle cx="15.167" cy="15.167" r="15.167" transform="translate(31.5 5.83)" fill="#cce6ee" />
              </g>
              <g className="tt-patches" transform="translate(-24.415 -1.009)" fill="#a6cad0">
                <circle cx={2} cy={2} r={2} transform="translate(43.009 4.496)" />
                <circle cx={2} cy={2} r={2} transform="translate(39.366 17.952)" />
                <circle cx={1} cy={1} r={1} transform="translate(33.016 8.044)" />
                <circle cx={1} cy={1} r={1} transform="translate(51.081 18.888)" />
                <circle cx={1} cy={1} r={1} transform="translate(33.016 22.503)" />
                <circle cx="1.5" cy="1.5" r="1.5" transform="translate(50.081 10.53)" />
              </g>
            </g>
          </g>
          <g className="tt-cloud" transform="matrix(1, 0, 0, 1, -3.5, -3.5)" filter="url(#cloud)">
            <path d="M3512.81,173.815a4.463,4.463,0,0,1,2.243.62.95.95,0,0,1,.72-1.281,4.852,4.852,0,0,1,2.623.519c.034.02-.5-1.968.281-2.716a2.117,2.117,0,0,1,2.829-.274,1.821,1.821,0,0,1,.854,1.858c.063.037,2.594-.049,3.285,1.273s-.865,2.544-.807,2.626a12.192,12.192,0,0,1,2.278.892c.553.448,1.106,1.992-1.62,2.927a7.742,7.742,0,0,1-3.762-.3c-1.28-.49-1.181-2.65-1.137-2.624s-1.417,2.2-2.623,2.2a4.172,4.172,0,0,1-2.394-1.206,3.825,3.825,0,0,1-2.771.774c-3.429-.46-2.333-3.267-2.2-3.55A3.721,3.721,0,0,1,3512.81,173.815Z" transform="translate(-3466.47 -160.94)" fill="#fff" />
          </g>
          <g className="tt-stars" transform="translate(3.585 1.325)" fill="#def8ff">
            <path d="M.774,0,.566.559,0,.539.458.933.25,1.492l.485-.361.458.394L1.024.953,1.509.592.943.572Z" transform="matrix(-1, 0.017, -0.017, -1, 24.231, 3.055)" />
            <path d="M1.341.529.836.472.736,0,.505.46,0,.4.4.729l-.231.46L.605.932l.4.326L.9.786Z" transform="matrix(-0.777, 0.629, -0.629, -0.777, 23.185, 12.358)" />
            <path d="M.015,1.065.475.9l.285.365L.766.772l.46-.164L.745.494.751,0,.481.407,0,.293.285.658Z" transform="matrix(0.438, 0.899, -0.899, 0.438, 23.177, 29.735)" />
            <path d="M1.161,1.6,1.059,1,1.574.722.962.607.86,0,.613.572,0,.457.446.881.2,1.454l.516-.274Z" transform="translate(12.677 0.388) rotate(104)" />
            <path d="M.873,1.648l.114-.62L1.579.945,1.03.62,1.144,0,.706.464.157.139.438.7,0,1.167l.592-.083Z" transform="matrix(-0.07, 0.998, -0.998, -0.07, 11.066, 15.457)" />
            <path d="M.593,0,.638.724,0,.982l.7.211.045.724.36-.64.7.211L1.342.935,1.7.294,1.063.552Z" transform="translate(8.326 28.061) rotate(11)" />
            <path d="M.816,0,.5.455,0,.311.323.767l-.312.455.516-.215.323.456L.827.911,1.343.7.839.552Z" transform="translate(5.012 5.962) rotate(172)" />
            <path d="M1.261,0,.774.571.114.3.487.967,0,1.538.728,1.32l.372.662.047-.749.728-.218L1.215.749Z" transform="translate(2.218 14.616) rotate(169)" />
          </g>
        </g>
      </svg>
    </label>
  );
}
