const DIRECTIONS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function getOutputType(building) {
  if (building.kind === 'extractor') return building.resourceNode.type;
  return building.recipe?.output ?? null;
}

export function takeOutput(building, amount) {
  return building.kind === 'extractor' ? building.collect(amount) : building.collectOutput(amount);
}

export function deliverToPort(port, questManager, market, type, amount) {
  let remaining = amount;

  if (questManager) {
    for (const quest of questManager.activeQuests) {
      if (quest.portId !== port.id || remaining <= 0) continue;
      remaining -= quest.deliver(type, remaining);
    }
  }

  if (remaining > 0) market.sell(type, remaining);
}

export function transferAdjacentOutputs(world, market, questManager) {
  const { tiles, width, height } = world;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const building = tiles[y * width + x].building;
      if (!building) continue;

      if (building.kind === 'warehouse') {
        const isOutputCell = x === building.anchorX + 1;
        if (!isOutputCell) continue;
        const slotIndex = y - building.anchorY;
        const slot = building.slots[slotIndex];
        if (!slot || slot.amount <= 0) continue;

        for (const [dx, dy] of DIRECTIONS) {
          if (slot.amount <= 0) break;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const neighborTile = tiles[ny * width + nx];

          if (neighborTile.building?.acceptInput && neighborTile.building.kind !== 'warehouse') {
            const { type, amount } = building.collectFromSlot(slotIndex, slot.amount);
            if (amount > 0) neighborTile.building.acceptInput(type, amount);
          } else if (neighborTile.port) {
            const { type, amount } = building.collectFromSlot(slotIndex, slot.amount);
            if (amount > 0) deliverToPort(neighborTile.port, questManager, market, type, amount);
          }
        }
        continue;
      }

      if (building.outputCell && (x !== building.outputCell[0] || y !== building.outputCell[1])) continue;
      if (building.outputBuffer <= 0) continue;
      const outputType = getOutputType(building);
      if (!outputType) continue;

      for (const [dx, dy] of DIRECTIONS) {
        if (building.outputBuffer <= 0) break;

        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;

        const neighborTile = tiles[ny * width + nx];

        if (neighborTile.building?.kind === 'warehouse') {
          const wh = neighborTile.building;
          const isInputCell = nx === wh.anchorX && ny === wh.anchorY;
          if (!isInputCell) continue;
          const accepted = wh.acceptInput(outputType, building.outputBuffer);
          if (accepted > 0) takeOutput(building, accepted);
          continue;
        }

        if (neighborTile.building?.acceptInput) {
          const nb = neighborTile.building;
          if (nb.inputCell && (nx !== nb.inputCell[0] || ny !== nb.inputCell[1])) continue;
          const accepted = nb.acceptInput(outputType, building.outputBuffer);
          if (accepted > 0) takeOutput(building, accepted);
          continue;
        }

        if (neighborTile.port) {
          const amount = building.outputBuffer;
          takeOutput(building, amount);
          deliverToPort(neighborTile.port, questManager, market, outputType, amount);
        }
      }
    }
  }
}
