import { cartesianToPolar } from './utils.js';

const { PI, max, min } = Math;
const PI2 = PI * 2;

const getInitShape = () => ({
  type: 0,
  startX: 0,
  startY: 0,
  minAngle: 0,
  maxAngle: 0,
  angle: 0,
  radius: 0,
  x: 0,
  y: 0,
  color: '#000000',
  text: '',
});

let shape;

export const getShape = () => shape;

export const hasShape = () => !!shape;

export const setShape = (value) => {
  shape = value;
};

export const resetShape = () => {
  setShape(getInitShape());
};

export const initShape = (
  { clientX: startX, clientY: startY },
  { type, color }
) => {
  setShape(
    Object.assign(getInitShape(), {
      type,
      color,
      startX,
      startY,
    })
  );
};

export const recordCoords = ({ clientX, clientY }) => {
  const { startX, startY } = shape;
  let { minAngle, maxAngle } = shape;
  const x = clientX - startX;
  const y = clientY - startY;
  let { angle, radius } = cartesianToPolar(x, y);

  if (angle < 0) {
    angle = PI2 + angle;
  }

  if (radius < 100) {
    maxAngle = minAngle = angle;
  } else {
    maxAngle = max(maxAngle, angle);
    minAngle = min(minAngle, angle);
  }

  setShape({
    ...shape,
    x,
    y,
    angle,
    radius,
    maxAngle,
    minAngle,
  });
};
