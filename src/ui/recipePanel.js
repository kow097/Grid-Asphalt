export class RecipePanel {
  constructor(container) {
    this.container = container;
    this.building = null;
    this.recipes = [];
  }

  get isOpen() {
    return !!this.building;
  }

  open(building, recipes) {
    this.building = building;
    this.recipes = recipes;
    this._render();
    this.container.classList.remove('hidden');
  }

  close() {
    this.building = null;
    this.container.classList.add('hidden');
  }

  _render() {
    const items = this.recipes.map(r => {
      const inputText = r.inputs.map(i => `${i.amount}x ${i.type}`).join(' + ');
      const active = this.building.recipe?.id === r.id;
      return `
        <button data-recipe-id="${r.id}" class="${active ? 'active' : ''}">
          ${inputText} → ${r.outputAmount}x ${r.output} (${r.processTime}s)
        </button>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="recipe-panel-box">
        <h3>Select Recipe</h3>
        ${items}
        <button id="recipe-close-btn">Close</button>
      </div>
    `;

    this.container.querySelectorAll('button[data-recipe-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const recipe = this.recipes.find(r => r.id === btn.dataset.recipeId);
        if (recipe) {
          this.building.recipe = recipe;
          this.building.inputBuffer = {};
          this.building.outputBuffer = 0;
          this.building.active = false;
          this.building.progress = 0;
        }
        this.close();
      });
    });

    this.container.querySelector('#recipe-close-btn').addEventListener('click', () => this.close());
  }
}
