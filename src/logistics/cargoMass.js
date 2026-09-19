// Masa po jedinici tereta (proizvoljne jedinice, relativne) - koristi se
// SAMO za usporavanje kamiona (teze = sporije), ne utjece na capacity/cijenu.
// Nepoznat tip pada na 1.0 (prosjecna gustoca).
const MASS_PER_UNIT = {
  iron: 1.3,
  copper: 1.2,
  coal: 0.9,
  stone: 1.5,
  oil: 0.8,
  iron_ingot: 1.4,
  copper_ingot: 1.3,
  steel: 1.6,
  motor: 1.8,
  circuit: 0.5,
  gear: 1.2,
  wire: 0.7,
};

// Referentna gustoca kapaciteta = 1.0/jedinica, pa je loadRatio=1 kad je
// PUN kamion prosjecno teskog tereta. Gusci teret (npr. steel=1.6) moze
// prijeci loadRatio=1 - zato je gornja granica 1.3, ne 1, da ne uspori
// PREVISE cak ni najgusci moguci teret.
const MAX_SLOWDOWN = 0.35; // pun, prosjecno tezak teret usporava max 35%
const LOAD_RATIO_CAP = 1.3;

export function cargoSpeedFactor(cargo, capacity) {
  if (!cargo || capacity <= 0) return 1;
  const mass = cargo.amount * (MASS_PER_UNIT[cargo.type] ?? 1);
  const loadRatio = Math.min(LOAD_RATIO_CAP, mass / capacity);
  return 1 - loadRatio * MAX_SLOWDOWN;
}
