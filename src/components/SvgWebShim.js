import React from 'react';

export default function Svg(props) {
  return <svg {...props} />;
}
export const Path = (props) => <path {...props} />;
export const Rect = (props) => <rect {...props} />;
export const Circle = (props) => <circle {...props} />;
export const Line = (props) => <line {...props} />;
export const Polyline = (props) => <polyline {...props} />;
export const G = (props) => <g {...props} />;
