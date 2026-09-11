export class InputHandler {
  constructor(canvas, camera, config) {
    this.canvas = canvas;
    this.camera = camera;
    this.config = config;
    this.dragging = false;
    this.lastX = 0;
    this.lastY = 0;

    canvas.addEventListener('mousedown', this._onMouseDown.bind(this));
    canvas.addEventListener('mousemove', this._onMouseMove.bind(this));
    canvas.addEventListener('mouseup', this._onMouseUp.bind(this));
    canvas.addEventListener('mouseleave', this._onMouseUp.bind(this));
    canvas.addEventListener('wheel', this._onWheel.bind(this), { passive: false });
  }

  _onMouseDown(e) {
    this.dragging = true;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
  }

  _onMouseMove(e) {
    if (!this.dragging) return;
    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;
    this.camera.pan(dx, dy);
    this.lastX = e.clientX;
    this.lastY = e.clientY;
  }

  _onMouseUp() {
    this.dragging = false;
  }

  _onWheel(e) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    this.camera.zoomAt(factor, this.config.CAMERA_ZOOM_MIN, this.config.CAMERA_ZOOM_MAX);
  }
}
