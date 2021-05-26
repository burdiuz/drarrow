const { hypot, atan2, cos, sin, abs } = Math;

export const Type = {
  ARROW: 0,
  RECT: 1,
};

export const ARROW = (() => {
  const p = new Path2D();
  p.moveTo(10, 0);
  p.lineTo(-10, -10);
  p.lineTo(-7, 0);
  p.lineTo(-10, 10);
  p.lineTo(10, 0);
  p.closePath();
  return p;
})();

export const cartesianToPolar = (x, y) => ({
  radius: hypot(x, y),
  angle: atan2(y, x),
});

export const polarToCartesian = (r, a) => ({ x: r * cos(a), y: r * sin(a) });

export const clearCanvas = (canvas, ctx) => {
  ctx = ctx || canvas.getContext('2d');
  ctx.resetTransform();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

export const isValidShape = ({ x, y }) => abs(x) > 5 || abs(y) > 5;

export const colorToInt = (color) => color ? Number.parseInt(`0x${color.substr(1)}`, 16) || 0 : 0;

export const intToColor = (val) => `#${val.toString(16).padStart(6, '0')}`;
