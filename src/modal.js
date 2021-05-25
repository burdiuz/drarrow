export const showModal = (template) => {
  const container = document.querySelector('.modal-container');

  const templateNode = document.getElementById(template);
  const content = templateNode.content.cloneNode(true);
  container.appendChild(content);
  container.classList.remove('hidden');

  return (selector = '') =>
    document.querySelector(`.modal-container .modal ${selector}`);
};

export const hideModal = (detail = {}) => {
  const container = document.querySelector('.modal-container');

  const modal = container.querySelector('.modal');
  if (modal) {
    modal.dispatchEvent(new CustomEvent('close', { detail }));
  }

  container.innerHTML = '';
  container.classList.add('hidden');
};

export const Modal = {
  SHARE_MODAL: 'share-modal',
  RECT_CAPTION_MODAL: 'rect-caption-modal',
};

export const showShareModal = () => showModal(Modal.SHARE_MODAL);

export const showRectCaptionModal = () => showModal(Modal.RECT_CAPTION_MODAL);
