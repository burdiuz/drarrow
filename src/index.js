import {
  startDrawShape,
  drawShape,
  endDrawShape,
  setStateCanvas,
  redrawState,
  drawCurrentShape,
} from './core.js';
import { hasShape } from './shape.js';
import { loadStateFromURL } from './state.js';
import { clearCanvas, Type } from './utils.js';
import { hideModal } from './modal.js';

const canvas = document.getElementById('canvas');
const canvasCtx = canvas.getContext('2d', {
  desynchronized: true,
});
const drawing = document.getElementById('drawing');
const drawingCtx = drawing.getContext('2d', {
  desynchronized: true,
});

let color = '#000000';
let lastClickTime = 0;

drawing.addEventListener('mousedown', (e) => {
  const handleMouseMove = (e) => {
    clearCanvas(drawing, drawingCtx);
    drawShape(drawingCtx, e);
  };

  const handleMouseUp = (e) => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);

    endDrawShape(drawingCtx, e);
    clearCanvas(drawing, drawingCtx);
  };

  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);

  clearCanvas(drawing, drawingCtx);
  startDrawShape(drawingCtx, e, {
    color,
    type: Date.now() - lastClickTime < 200 ? Type.RECT : Type.ARROW,
  });
});

drawing.addEventListener('click', () => {
  lastClickTime = Date.now();
});

const resize = async () => {
  const newSize = { width: window.innerWidth, height: window.innerHeight };

  Object.assign(canvas, newSize);
  Object.assign(drawing, newSize);

  await Promise.resolve();

  redrawState();

  if (hasShape()) {
    drawCurrentShape(drawingCtx);
  }
};

document.querySelectorAll('.color-btn').forEach((btn) => {
  btn.addEventListener('click', ({ target }) => {
    const selectedBtn = document.querySelector('.color-btn.selected-btn');
    if (selectedBtn) {
      selectedBtn.classList.remove('selected-btn');
    }

    target.classList.add('selected-btn');
    color = target.dataset.color;
  });
});

document.querySelector('.download-btn').addEventListener('click', (e) => {
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = 'drarrow_diagram.png';
  a.click();
});

window.addEventListener('resize', resize);
window.addEventListener('keyup', (e) => {
  if (event.key === 'Escape') {
    hideModal({ forced: true });
  }
});

window.addEventListener('popstate', () => {
  loadStateFromURL();
  redrawState();
});

setStateCanvas(canvas);
loadStateFromURL();
resize();
