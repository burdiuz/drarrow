import { getShape } from './shape.js';
import { ARROW, polarToCartesian, cartesianToPolar } from './utils.js';

const getCurveAngle = () => {
  const { angle, maxAngle, minAngle } = getShape();

  return maxAngle - angle > angle - minAngle ? maxAngle : minAngle;
};

const drawTail = (ctx, shape, cp2x, cp2y) => {
  const { color, startX, startY, x, y } = shape;

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.quadraticCurveTo(startX + cp2x, startY + cp2y, startX + x, startY + y);

  ctx.lineWidth = 4;
  ctx.strokeStyle = color;
  ctx.stroke();
};

const drawHead = (ctx, shape, cp2x, cp2y) => {
  const { color, startX, startY, x, y } = shape;

  ctx.lineWidth = 0;
  ctx.fillStyle = color;
  ctx.translate(startX + x, startY + y);
  ctx.rotate(cartesianToPolar(x - cp2x, y - cp2y).angle);
  ctx.fill(ARROW);
  ctx.resetTransform();
};
export const drawArrowFor = (ctx, shape) => {
  const { angle, x, y } = shape;
  const { x: cp2x, y: cp2y } = polarToCartesian(
    cartesianToPolar(x, y).radius / 2,
    angle
  );

  drawTail(ctx, shape, cp2x, cp2y);
  drawHead(ctx, shape, cp2x, cp2y);
};

export const drawCurrentArrow = (ctx) => {
  const shape = getShape();
  drawArrowFor(ctx, {
    ...shape,
    angle: getCurveAngle(),
  });
};

export const startDrawCurrentArrow = (ctx) => {};

export const endDrawCurrentArrow = (ctx, done) => {
  done({
    ...getShape(),
    angle: getCurveAngle(),
  });
};
