import {
  startDrawShape,
  drawShape,
  endDrawShape,
  setStateCanvas,
  redrawState,
  drawCurrentShape,
} from './core.js';
import { hasShape } from './shape.js';
import { loadStateFromURL, saveStateToURL, initState } from './state.js';
import { clearCanvas, Type } from './utils.js';
import { showMessageModal, hideModal } from './modal.js';

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

const copy = () =>
  new Promise((res) => {
    canvas.toBlob((blob) => {
      navigator.clipboard
        .write([
          new ClipboardItem({
            ['image/png']: blob,
          }),
        ])
        .then(() =>
          showMessageModal('Image was copied to clipboard.', 'Share Image')
        )
        .catch(() =>
          showMessageModal('Could not copy image to clipboard.', 'Share Image')
        )
        .then((q) => {
          q('.close-btn').addEventListener('click', () => {
            hideModal();
            res();
          });
        });
    }, 'image/png');
  });

const undo = () => {
  history.back();
};

const redo = () => {
  history.forward();
};

const updateFullscreenBtn = () => {
  const btn = document.querySelector('.fullscreen-btn');

  if (!!document.fullscreenElement) {
    btn.classList.add('collapse-btn');
    btn.classList.remove('expand-btn');
  } else {
    btn.classList.remove('collapse-btn');
    btn.classList.add('expand-btn');
  }
};

const toggleFullscreen = () => {
  if (!!document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.body.requestFullscreen();
  }
  updateFullscreenBtn();
};
const showInfo = () => {
  location.href =
    './?a=BE2DXeDswl8s5EwZRX2CIIQmuDswl8uwZDMPo4e7n5aDj7%2Bzv8lCCIFNg8Zg7MJfQZpWAZQX0qBpQdGDL5FMuyHgRfD7%2FD5oOnt4efloPTvoMPs6fDi7%2BHy5FCeoEthVhgy%2BRTLuiJgZQOeRVBuYJDn3y8ojlDsTv9%2B7s7%2BHkoOnt4eflUJygRmFZmCQ598vCJZBlA6BE0G3g%2F4%2FrL0ihkPxvXs7PPj8uXl7qDN7%2BTlUJsgRWF5eD%2Fj%2BsvSKYBlA55BkGPg22FhLqi1ERw%2Bzl4fKg4ezsoOPo4e7n5fNQnpQGF0GDbYWEuiLtBlA6xB0KZV16ikEigvkS0PLl8%2FOg7e%2F18%2BWg4vX09O%2FuUIggXmKrdXXqKQmaC8BlBBXL6pCg4NthYUPSTJCs3v9uWg7e%2F18%2BVQkCBgRmuDbYWFE7oJEGUEHKgWEIbUi%2F6kbSguEU0uXs5eHz5aDt7%2FXz5aDi9fT07%2B5QlKBSQ4OD%2Fj%2BtDlIPtJ9TvoOTy4feg8uXj9OHu5%2BzlrIrm6fLz9KDj7Onj66Dh7uSg9Ojl7lDFIL5hmZg%2F4%2FrQ5SF%2BBlBe2L6tEDYJDn30OMh0INzL5fni7%2BHy5KDz6O%2Fy9OP19PO6oKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoIrD9PLsoKugw6CtoMPv8Pmg6e3h5%2BWg6e7076Dj7Onw4u%2Fh8uSKw%2FTy7KCroNigraDD9fSg6e3h5%2BWg6e7076Dj7Onw4u%2Fh8uSgoKCKw%2FTy7KCroNqgraDV7uTvoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoIrD9PLsoKug2aCtoNLl5O%2BgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCuUR2hRg';
};

drawing.addEventListener('mousedown', (e) => {
  const handleMouseMove = (e) => {
    clearCanvas(drawing, drawingCtx, false);
    drawShape(drawingCtx, e);
  };

  const handleMouseUp = (e) => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);

    endDrawShape(drawingCtx, e);
    clearCanvas(drawing, drawingCtx, false);
  };

  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);

  clearCanvas(drawing, drawingCtx, false);
  startDrawShape(drawingCtx, e, {
    color,
    type: Date.now() - lastClickTime < 200 ? Type.RECT : Type.ARROW,
  });
});

const convertTouchEvent = ({ touches: [{ clientX, clientY }] }) => ({
  clientX,
  clientY,
});

drawing.addEventListener('touchstart', (e) => {
  let lastEvent = convertTouchEvent(e);

  const handleTouchMove = (e) => {
    lastEvent = convertTouchEvent(e);
    clearCanvas(drawing, drawingCtx, false);
    drawShape(drawingCtx, lastEvent);
  };

  const handleTouchEnd = (e) => {
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleTouchEnd);
    window.removeEventListener('touchcancel', handleTouchEnd);

    endDrawShape(drawingCtx, lastEvent);
    clearCanvas(drawing, drawingCtx, false);
  };

  window.addEventListener('touchmove', handleTouchMove);
  window.addEventListener('touchend', handleTouchEnd);
  window.addEventListener('touchcancel', handleTouchEnd);

  clearCanvas(drawing, drawingCtx, false);
  startDrawShape(drawingCtx, lastEvent, {
    color,
    type: Date.now() - lastClickTime < 200 ? Type.RECT : Type.ARROW,
  });
});

drawing.addEventListener('click', () => {
  lastClickTime = Date.now();
});

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

document.querySelector('.share-btn').addEventListener('click', copy);

document.querySelector('.download-btn').addEventListener('click', (e) => {
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = 'drarrow_diagram.png';
  a.click();
});

document
  .querySelector('.fullscreen-btn')
  .addEventListener('click', toggleFullscreen);

document.querySelector('.clear-btn').addEventListener('click', () => {
  initState();
  saveStateToURL();
  redrawState();
});

document.querySelector('.info-btn').addEventListener('click', showInfo);

window.addEventListener('resize', resize);
window.addEventListener('keyup', (e) => {
  const { code, ctrlKey, metaKey, shiftKey } = e;
  switch (code) {
    case 'Escape':
      hideModal({ forced: true });
      break;
    case 'KeyC':
      if (ctrlKey || metaKey) {
        copy();
      }
      break;
    case 'KeyX':
      if (ctrlKey || metaKey) {
        copy().then(() => {
          initState();
          saveStateToURL();
          redrawState();
        });
      }
      break;
    case 'KeyZ':
      if (ctrlKey || metaKey) {
        if (shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      break;
    case 'KeyY':
      if (ctrlKey || metaKey) {
        redo();
      }
      break;
  }
});

window.addEventListener('fullscreenchange', updateFullscreenBtn);

window.addEventListener('popstate', () => {
  loadStateFromURL();
  redrawState();
});

if (
  localStorage.getItem('visited') ||
  new URLSearchParams(window.location.search).get('a')
) {
  setStateCanvas(canvas);
  loadStateFromURL();
  resize();
} else {
  localStorage.setItem('visited', '1');
  showInfo();
}
