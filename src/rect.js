import { getShape } from './shape.js';
import { showRectCaptionModal, hideModal } from './modal.js';
import { isValidShape } from './utils.js';

const { ceil, max, min, PI } = Math;

const R = 10;
const R2 = R * 2;
const AT = PI * 1.5;
const AR = 0;
const AB = PI * 0.5;
const AL = PI;

const drawRectArea = (ctx, shape) => {
  const { startX, startY, x, y, color } = shape;
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

const LINE_SPACE_MULTIPLIER = 1;

const makeDarker = (colorStr, dm = 0.3) => {
  const src = Number.parseInt(`0x${colorStr.substr(1)}`, 16);

  const darker =
    ((((src >>> 16) & 0xff) * dm) << 16) |
    ((((src >>> 8) & 0xff) * dm) << 8) |
    (((src & 0xff) * dm) >> 0);

  return `#${darker.toString(16).padStart(6, '0')}`;
};

const drawRectText = (ctx, shape) => {
  const { startX, startY, x: rectW, y: rectH, text, color } = shape;

  if (!text) {
    return;
  }

  ctx.fillStyle = makeDarker(color);
  ctx.font = '1.5rem Arial, Helvetica, sans-serif';

  const { actualBoundingBoxAscent: asc, actualBoundingBoxDescent: desc } =
    ctx.measureText('|');

  const lineHeight = ceil(desc + asc);

  const lines = text.split('\n');
  const { length } = lines;
  let textW = 0;
  let textH = lineHeight * length * LINE_SPACE_MULTIPLIER;

  const widths = lines.map((line) => {
    const { width } = ctx.measureText(line);

    textW = max(textW, width);

    return width;
  });

  const x = startX + (rectW - textW) * 0.5;
  let y = startY + (rectH - textH) * 0.5;

  lines.forEach((line, index) => {
    const width = widths[index];

    ctx.fillText(line, x + (textW - width) * 0.5, y);

    y += lineHeight * LINE_SPACE_MULTIPLIER;
  });
};

export const drawRectFor = (ctx, shape) => {
  drawRectArea(ctx, shape);
  drawRectText(ctx, shape);
};

export const drawCurrentRect = (ctx) => {
  const shape = getShape();
  drawRectFor(ctx, shape);
};

export const startDrawCurrentRect = (ctx) => {};

export const endDrawCurrentRect = (ctx, done) => {
  if (!isValidShape(getShape())) {
    done(null);
    return;
  }

  const q = showRectCaptionModal();
  q().addEventListener('close', (e) => {
    const {
      detail: { forced },
    } = e;
    if (forced) {
      done(getShape());
    }
  });

  q('.close-btn').addEventListener('click', () => {
    hideModal();
    done(getShape());
  });

  q('.apply-btn').addEventListener('click', () => {
    const text = q('.modal-content').value.trim();
    hideModal();
    done({ ...getShape(), text });
  });
};
