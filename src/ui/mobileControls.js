export function isTouchDevice() {
  return 'ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0;
}

// Plavi red (grid/cancel) i zupcanik za meni - SAMO za tablet/mobitel, jer ti
// uredjaji nemaju tipkovnicu za G/Escape precice. Na desktopu ovi elementi
// ostaju sakriveni (CSS, vidi 'touch-device' klasa na <body>) i sve i dalje
// radi preko postojecih tipkovnickih precica.
export class MobileControls {
  constructor({ gridBtn, cancelBtn, menuBtn, onToggleGrid, onCancel, onMenu }) {
    this._gridBtn = gridBtn;
    this._cancelBtn = cancelBtn;
    this._menuBtn = menuBtn;
    this._active = isTouchDevice();
    if (!this._active) return;
    document.body.classList.add('touch-device');

    this._onGrid = onToggleGrid;
    this._onCancel = onCancel;
    this._onMenu = onMenu;
    gridBtn.addEventListener('click', this._onGrid);
    cancelBtn.addEventListener('click', this._onCancel);
    menuBtn.addEventListener('click', this._onMenu);
  }

  // #mobile-grid-btn/#mobile-cancel-btn/#mobile-menu-btn su STATICNI DOM
  // elementi iz index.html (nikad se ne recreiraju) - bez ovoga bi svaki
  // Exit->Start Again dodao JOS jedan set listenera na iste gumbe.
  destroy() {
    if (!this._active) return;
    this._gridBtn.removeEventListener('click', this._onGrid);
    this._cancelBtn.removeEventListener('click', this._onCancel);
    this._menuBtn.removeEventListener('click', this._onMenu);
  }
}
