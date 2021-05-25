import { startDrawArrow, drawArrow, endDrawArrow } from './arrow.js';
import { startDrawRect, drawRect, endDrawRect } from './rect.js';
import { Type } from './utils.js';
import { getShape, resetShape, initShape, recordCoords } from './shape.js';

const startDrawTypes = {
  [Type.ARROW]: startDrawArrow,
  [Type.RECT]: startDrawRect,
};

const drawTypes = {
  [Type.ARROW]: drawArrow,
  [Type.RECT]: drawRect,
};

const endDrawTypes = {
  [Type.ARROW]: endDrawArrow,
  [Type.RECT]: endDrawRect,
};

export const drawShape = (ctx, e) => {
  recordCoords(e);

  const { type } = getShape();
  drawTypes[type](ctx, e);
};

export const startDrawShape = (ctx, e, config) => {
  const { type } = config;
  initShape(e, config);

  startDrawTypes[type](ctx, e);
  console.log(e);
};
export const endDrawShape = (ctx, e) => {
  recordCoords(e);

  const { type } = getShape();
  endDrawTypes[type](ctx, e, () => {
    addToState(getShape());
    resetShape();
    // redraw shape and state
  });
  console.log(e);
};
