export class TruckPanel {
  constructor(container, onCreateRoute, onFinishRoute) {
    this.container = container;
    this.onCreateRoute = onCreateRoute;
    this.onFinishRoute = onFinishRoute;
    this.armed = false;
    this.canFinish = false;

    this.container.innerHTML = `<button id="create-route-btn">Create Route</button>`;
    this.button = this.container.querySelector('#create-route-btn');
    this.button.addEventListener('click', () => {
      if (this.canFinish) this.onFinishRoute();
      else if (!this.armed) this.onCreateRoute();
    });
  }

  update(selectedTruck, routeArmed, pendingWaypoints) {
    this.container.style.display = selectedTruck ? 'block' : 'none';
    if (!selectedTruck) return;

    const n = pendingWaypoints?.length ?? 0;
    this.armed = routeArmed;
    this.canFinish = routeArmed && n >= 2;

    if (this.canFinish) {
      this.button.textContent = `Finish Route (${n} points)`;
      this.button.disabled = false;
    } else if (routeArmed) {
      this.button.textContent = n === 0 ? 'Click point 1...' : `Click point ${n + 1}... (min 2)`;
      this.button.disabled = true;
    } else {
      this.button.textContent = 'Create Route';
      this.button.disabled = false;
    }
  }
}
