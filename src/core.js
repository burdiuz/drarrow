import {
  startDrawCurrentArrow,
  drawCurrentArrow,
  endDrawCurrentArrow,
  drawArrowFor,
} from './arrow.js';
import {
  startDrawCurrentRect,
  drawCurrentRect,
  endDrawCurrentRect,
  drawRectFor,
} from './rect.js';
import { Type, clearCanvas, isValidShape } from './utils.js';
import { getShape, resetShape, initShape, recordCoords } from './shape.js';
import { addToState, getState } from './state.js';

const { abs } = Math;

const drawTypes = {
  [Type.ARROW]: drawArrowFor,
  [Type.RECT]: drawRectFor,
};

const startDrawCurrentTypes = {
  [Type.ARROW]: startDrawCurrentArrow,
  [Type.RECT]: startDrawCurrentRect,
};

const drawCurrentTypes = {
  [Type.ARROW]: drawCurrentArrow,
  [Type.RECT]: drawCurrentRect,
};

const endDrawCurrentTypes = {
  [Type.ARROW]: endDrawCurrentArrow,
  [Type.RECT]: endDrawCurrentRect,
};

let stateCanvas;
let stateCanvasCtx;

export const setStateCanvas = (value) => {
  stateCanvas = value;
  stateCanvasCtx = stateCanvas.getContext('2d');
};

export const redrawState = () => {
  clearCanvas(stateCanvas, stateCanvasCtx);
  getState().forEach((item) => {
    drawTypes[item.type](stateCanvasCtx, item);
  });

  // console.log(JSON.stringify(getState(), null, 2));
};

export const drawCurrentShape = (ctx) => {
  const { type } = getShape();
  drawCurrentTypes[type](ctx);
};

export const drawShape = (ctx, e) => {
  recordCoords(e);
  drawCurrentShape(ctx);
};

export const startDrawShape = (ctx, e, config) => {
  const { type } = config;
  initShape(e, config);

  startDrawCurrentTypes[type](ctx);
};
export const endDrawShape = (ctx, e) => {
  recordCoords(e);

  const { type } = getShape();
  endDrawCurrentTypes[type](ctx, (shape) => {
    if (shape && isValidShape(shape)) {
      addToState(shape);
    }

    resetShape();
    redrawState();
  });
};
