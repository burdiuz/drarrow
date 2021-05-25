import { getShape } from './shape.js';
import { ARROW, polarToCartesian, cartesianToPolar } from './utils.js';

const drawTail = (ctx, cp2x, cp2y) => {
  const { color, startX, startY, x, y } = getShape();

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.quadraticCurveTo(startX + cp2x, startY + cp2y, startX + x, startY + y);

  ctx.lineWidth = 4;
  ctx.strokeStyle = color;
  ctx.stroke();
  // console.log(startX, startY, startX + x, startY + y);
};

const drawHead = (ctx, cp2x, cp2y) => {
  const { color, startX, startY, x, y } = getShape();

  ctx.lineWidth = 0;
  ctx.fillStyle = color;
  ctx.translate(startX + x, startY + y);
  ctx.rotate(cartesianToPolar(x - cp2x, y - cp2y).angle);
  ctx.fill(ARROW);
};

export const drawArrow = (ctx, e) => {
  const { startX, startY, x, y, maxAngle, minAngle, angle, radius } =
    getShape();

  const { x: cp2x, y: cp2y } = polarToCartesian(
    radius / 2,
    maxAngle - angle > angle - minAngle ? maxAngle : minAngle
  );

  //* control line
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(startX + cp2x, startY + cp2y);
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#0000ff';
  ctx.stroke();
  //*/

  //* arrow direction line
  ctx.beginPath();
  ctx.moveTo(startX + cp2x, startY + cp2y);
  ctx.lineTo(startX + x, startY + y);
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#ff0000';
  ctx.stroke();
  //*/

  console.log(e);
  drawTail(ctx, cp2x, cp2y);
  drawHead(ctx, cp2x, cp2y);
};

export const startDrawArrow = (ctx, e) => {};

export const endDrawArrow = (ctx, e, done) => {
  done();
};
