import { addToState } from './state.js';
import { getShape, setShape } from './shape.js';
import { showRectCaptionModal, hideModal } from './modal.js';

const { max, min, PI } = Math;

const R = 10;
const R2 = R * 2;
const AT = PI * 1.5;
const AR = 0;
const AB = PI * 0.5;
const AL = PI;

export const drawRect = (ctx, e) => {
  const { startX, startY, x, y, color } = getShape();
  let x1, y1, x2, y2;

  if (x >= 0) {
    x1 = startX;
    x2 = x1 + max(R2, x);
  } else {
    x1 = startX + min(-R2, x);
    x2 = startX;
  }

  if (y > 0) {
    y1 = startY;
    y2 = y1 + max(R2, y);
  } else {
    y1 = startY + min(-R2, y);
    y2 = startY;
  }

  ctx.beginPath();
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  ctx.arc(x1 + R, y1 + R, R, AL, AT);
  ctx.moveTo(x1 + R, y1);
  ctx.lineTo(x2 - R, y1);

  ctx.arc(x2 - R, y1 + R, R, AT, AR);
  ctx.moveTo(x2, y1 + R);
  ctx.lineTo(x2, y2 - R);

  ctx.arc(x2 - R, y2 - R, R, AR, AB);
  ctx.moveTo(x2 - R, y2);
  ctx.lineTo(x1 + R, y2);

  ctx.arc(x1 + R, y2 - R, R, AB, AL);
  ctx.moveTo(x1, y2 - R);
  ctx.lineTo(x1, y1 + R);
  ctx.stroke();
};

export const startDrawRect = (ctx, e) => {};

export const endDrawRect = (ctx, e, done) => {
  const q = showRectCaptionModal();
  q('.close-btn').addEventListener('click', () => {
    hideModal();
    done();
  });
  q('.apply-btn').addEventListener('click', () => {
    const text = q('.modal-content').value;
    setShape({ ...getShape(), text });
    hideModal();
    done();
  });
};
