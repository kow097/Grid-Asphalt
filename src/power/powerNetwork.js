const DIRECTIONS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Koliko energije zgrada trosi po tick-u dok radi. Namjerno fiksno/jednostavno
// (bez tier-ova) - MVP iz ROADMAP.md stavke 17-20.
const POWER_DRAW = {
  extractor: 5,
  smelter: 8,
  factory: 8,
  assembler: 8,
  conveyor: 1,
  merger: 1,
};

function neighborBuildings(world, x, y) {
  const result = [];
  for (const [dx, dy] of DIRECTIONS) {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= world.width || ny >= world.height) continue;
    const b = world.tiles[ny * world.width + nx].building;
    if (b) result.push(b);
  }
  return result;
}

// Prazni/puni baterije da pokriju manjak/visak, pa SVIM potrosacima u
// mrezi postavlja isti powered (fer "sve ili nista" - bez prioriteta
// medu zgradama, izbjegava komplicirano djelomicno gasenje).
function resolveNetwork(plants, batteries, consumers) {
  const supply = plants.reduce((sum, p) => sum + p.output, 0);
  const demand = consumers.reduce((sum, c) => sum + (POWER_DRAW[c.kind] ?? 1), 0);
  let deficit = demand - supply;

  if (deficit > 0) {
    for (const battery of batteries) {
      if (deficit <= 0) break;
      const drawn = Math.min(battery.charge, deficit);
      battery.charge -= drawn;
      deficit -= drawn;
    }
  } else {
    let surplus = -deficit;
    for (const battery of batteries) {
      if (surplus <= 0) break;
      const stored = Math.min(battery.capacity - battery.charge, surplus);
      battery.charge += stored;
      surplus -= stored;
    }
  }

  const powered = deficit <= 0;
  for (const consumer of consumers) consumer.powered = powered;
}

// Poziva se svaki tick iz Engine._update() PRIJE nego extractori/procesori/
// conveyori citaju .powered u svom update(). BFS po power_pole tileovima -
// dvije susjedne pole celije su ista mreza; sve sto fizicki dodiruje bilo
// koji pole u toj mrezi (plant/battery/potrosac) ulazi u nju.
// VAZNO: zgrade koje NISU fizicki spojene ni na jedan pole se NE diraju -
// ostaju na svom default powered=true (postavljenom u konstruktoru).
// Power mreza je namjerno OPCIONALAN kasni sustav: samo zgrade koje igrac
// SVJESNO prikljuci na mrezu mogu ostati bez struje zbog manjka; sve ostalo
// radi normalno kao i prije nego je I11-I13 tech otkljucan.
export function updatePowerNetworks(state) {
  const { world, powerPoles } = state;

  const visited = new Set();
  for (const startPole of powerPoles) {
    const startKey = `${startPole.x},${startPole.y}`;
    if (visited.has(startKey)) continue;

    const plants = new Set();
    const batteries = new Set();
    const consumers = new Set();
    const queue = [startPole];
    visited.add(startKey);

    while (queue.length) {
      const pole = queue.pop();
      for (const neighbor of neighborBuildings(world, pole.x, pole.y)) {
        if (neighbor.kind === 'power_pole') {
          const key = `${neighbor.x},${neighbor.y}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push(neighbor);
          }
        } else if (neighbor.kind === 'power_plant') {
          plants.add(neighbor);
        } else if (neighbor.kind === 'battery') {
          batteries.add(neighbor);
        } else if (neighbor.requiresPower) {
          consumers.add(neighbor);
        }
      }
    }

    resolveNetwork([...plants], [...batteries], [...consumers]);
  }
}
