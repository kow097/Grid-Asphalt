// Placeholder - stvarno renderiranje minimape je odvojen (veci) zadatak,
// dogovoreno s korisnikom da se radi sljedece. Ovo samo postavlja UI skeleton:
// klik na minimapu otvara veliku mapu preko cijelog zaslona.
export class Minimap {
  constructor(container, overlayContainer) {
    this.container = container;
    this.overlay = overlayContainer;
    this.visible = false;

    this.container.addEventListener('click', () => this.open());
  }

  open() {
    this.visible = true;
    this.overlay.classList.remove('hidden');
    this.overlay.innerHTML = `
      <div class="minimap-overlay-box">
        <div class="minimap-overlay-placeholder">Velika mapa - dolazi u sljedecem zadatku</div>
        <button id="minimap-close-btn">Close</button>
      </div>
    `;
    this.overlay.querySelector('#minimap-close-btn').addEventListener('click', () => this.close());
  }

  close() {
    this.visible = false;
    this.overlay.classList.add('hidden');
  }
}
