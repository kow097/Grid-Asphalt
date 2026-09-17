const CLICK_MOVE_THRESHOLD = 5;

export class InputHandler {
  constructor(canvas, camera, config) {
    this.canvas = canvas;
    this.camera = camera;
    this.config = config;
    this.dragging = false;
    this.dragBuildActive = false;
    this.lastX = 0;
    this.lastY = 0;
    this.downX = 0;
    this.downY = 0;
    this.onClick = null;
    this.onHover = null;
    this.onDragBuild = null;
    this.onDragStart = null;
    this.onDragEnd = null;
    this.isDragBuildMode = () => false;

    // Pinch-to-zoom stanje (touch). Odvojeno od dragging/dragBuildActive -
    // dok su 2 prsta na ekranu, NIKAD se ne interpretira kao pan/tap/drag-build.
    this.pinchActive = false;
    this.pinchStartDist = 0;
    this.pinchStartZoom = 1;

    // Spremamo bound reference (ne pozivamo .bind() inline) - destroy() ih
    // koristi da ukloni TOCNO iste funkcije koje su ovdje registrirane.
    this._boundMouseDown = this._onMouseDown.bind(this);
    this._boundMouseMove = this._onMouseMove.bind(this);
    this._boundMouseUp = this._onMouseUp.bind(this);
    this._boundWheel = this._onWheel.bind(this);
    this._boundTouchStart = this._onTouchStart.bind(this);
    this._boundTouchMove = this._onTouchMove.bind(this);
    this._boundTouchEnd = this._onTouchEnd.bind(this);

    canvas.addEventListener('mousedown', this._boundMouseDown);
    canvas.addEventListener('mousemove', this._boundMouseMove);
    canvas.addEventListener('mouseup', this._boundMouseUp);
    canvas.addEventListener('mouseleave', this._boundMouseUp);
    canvas.addEventListener('wheel', this._boundWheel, { passive: false });

    // touch-action:none (CSS) + preventDefault ovdje sprjecava browserov
    // native scroll/pinch-zoom stranice i sintetske mouse evente koje bi
    // inace touch mogao naknadno okinuti (dupli/konfliktni handling).
    canvas.addEventListener('touchstart', this._boundTouchStart, { passive: false });
    canvas.addEventListener('touchmove', this._boundTouchMove, { passive: false });
    canvas.addEventListener('touchend', this._boundTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', this._boundTouchEnd, { passive: false });
  }

  // Uklanja SVE listenere koje je konstruktor dodao na canvas - bez ovoga
  // bi svaki Exit->Start Again ciklus (main.js ponovno koristi ISTI
  // #game-canvas element) ostavio "zombie" InputHandler koji i dalje
  // reagira na klikove/touch iako ga trenutni Engine vise ne koristi.
  destroy() {
    this.canvas.removeEventListener('mousedown', this._boundMouseDown);
    this.canvas.removeEventListener('mousemove', this._boundMouseMove);
    this.canvas.removeEventListener('mouseup', this._boundMouseUp);
    this.canvas.removeEventListener('mouseleave', this._boundMouseUp);
    this.canvas.removeEventListener('wheel', this._boundWheel);
    this.canvas.removeEventListener('touchstart', this._boundTouchStart);
    this.canvas.removeEventListener('touchmove', this._boundTouchMove);
    this.canvas.removeEventListener('touchend', this._boundTouchEnd);
    this.canvas.removeEventListener('touchcancel', this._boundTouchEnd);
  }

  _onMouseDown(e) {
    this.dragging = true;
    this.dragBuildActive = this.isDragBuildMode();
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.downX = e.clientX;
    this.downY = e.clientY;

    if (this.dragBuildActive) {
      const rect = this.canvas.getBoundingClientRect();
      this.onDragStart?.(e.clientX - rect.left, e.clientY - rect.top);
    }
  }

  _onMouseMove(e) {
    if (!this.dragging) {
      const rect = this.canvas.getBoundingClientRect();
      this.onHover?.(e.clientX - rect.left, e.clientY - rect.top);
      return;
    }

    if (this.dragBuildActive) {
      const rect = this.canvas.getBoundingClientRect();
      this.onHover?.(e.clientX - rect.left, e.clientY - rect.top);
      return;
    }

    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;
    this.camera.pan(dx, dy);
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.onHover?.(null, null);
  }

  _onMouseUp(e) {
    const rect = this.canvas.getBoundingClientRect();
    const moved = Math.hypot(e.clientX - this.downX, e.clientY - this.downY);

    if (this.dragBuildActive && moved >= CLICK_MOVE_THRESHOLD) {
      this.onDragBuild?.(this.downX - rect.left, this.downY - rect.top, e.clientX - rect.left, e.clientY - rect.top);
    } else if (this.dragging && this.onClick && moved < CLICK_MOVE_THRESHOLD) {
      this.onClick(e.clientX - rect.left, e.clientY - rect.top);
    }

    if (this.dragBuildActive) this.onDragEnd?.();
    this.dragging = false;
    this.dragBuildActive = false;
  }

  cancelDragBuild() {
    if (!this.dragBuildActive) return;
    this.dragBuildActive = false;
    this.dragging = false;
    this.onDragEnd?.();
  }

  _onWheel(e) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    this.camera.zoomAt(factor, this.config.CAMERA_ZOOM_MIN, this.config.CAMERA_ZOOM_MAX);
  }

  // --- Touch: 1 prst = isto sto i mis (tap=klik, drag=pan/drag-build),
  // 2 prsta = pinch-zoom. Normalizira touch u {clientX,clientY} pa poziva
  // ISTE _onMouse* metode - nema duplicirane logike, ponasanje ostaje
  // dosljedno mišu na svim uredajima.
  _touchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  _onTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 2) {
      this.cancelDragBuild();
      this.dragging = false;
      this.pinchActive = true;
      this.pinchStartDist = this._touchDistance(e.touches);
      this.pinchStartZoom = this.camera.zoom;
      return;
    }
    if (e.touches.length === 1 && !this.pinchActive) {
      const t = e.touches[0];
      this._onMouseDown({ clientX: t.clientX, clientY: t.clientY });
    }
  }

  _onTouchMove(e) {
    e.preventDefault();
    if (this.pinchActive) {
      if (e.touches.length < 2) return;
      const dist = this._touchDistance(e.touches);
      const factor = dist / this.pinchStartDist;
      const target = this.pinchStartZoom * factor;
      this.camera.zoom = Math.min(this.config.CAMERA_ZOOM_MAX, Math.max(this.config.CAMERA_ZOOM_MIN, target));
      return;
    }
    if (e.touches.length === 1) {
      const t = e.touches[0];
      this._onMouseMove({ clientX: t.clientX, clientY: t.clientY });
    }
  }

  _onTouchEnd(e) {
    e.preventDefault();
    if (this.pinchActive) {
      // Cekamo da SVI prsti odu prije nego dopustimo novi gestu (pan/tap) -
      // izbjegava neocekivan "skok" ako jedan prst ostane na ekranu tren
      // nakon sto je pinch zavrsio.
      if (e.touches.length === 0) this.pinchActive = false;
      return;
    }
    const t = e.changedTouches[0];
    if (t) this._onMouseUp({ clientX: t.clientX, clientY: t.clientY });
  }
}
