(function (game) {
  const { buildings } = game.constants;
  const getState = () => game.getState();
  const compact = (...args) => game.compact(...args);
  const showNotice = (...args) => game.showNotice(...args);
  const render = (...args) => game.render(...args);
  const save = (...args) => game.save(...args);
  const playCartDelivery = (...args) => game.playCartDelivery(...args);
  const showFullscreenAd = (...args) => game.yandex.showFullscreenAd(...args);
  const translate = (...args) => game.translate(...args);
  const eventDuration = 45000;
  const eventCatalog = [
    { id: "order", icon: "📦", title: "Большой заказ", description: "Рынку нужно 12 ящиков. Выполни заказ до конца события и получи награду." },
    { id: "rain", icon: "🌧️", title: "Дождь в долине", description: "Лесозаготовка замедлена на 30%, зато лесные духи берегут запасы." },
    { id: "market", icon: "📈", title: "Удачный рынок", description: "Цена каждого ящика выросла на 50% на время события." },
    { id: "merchant", icon: "🧳", title: "Приехал торговец", description: "Продай партию ящиков торговцу и получи дополнительную выплату." },
    { id: "festival", icon: "🎪", title: "Лесной фестиваль", description: "Праздничный спрос ускоряет всю производственную цепочку на 25%." },
    { id: "speed", icon: "✨", title: "Духи леса", description: "Вся мастерская работает вдвое быстрее." }
  ];
  const sellableResources = [
    { id: "logs", name: "Брёвна", basePrice: 1 }, { id: "planks", name: "Доски", basePrice: 3 },
    { id: "crates", name: "Ящики", basePrice: 12 }, { id: "water", name: "Вода", basePrice: 1 },
    { id: "grain", name: "Зерно", basePrice: 3 }, { id: "flour", name: "Мука", basePrice: 5 },
    { id: "stone", name: "Камень", basePrice: 2 }, { id: "bricks", name: "Кирпичи", basePrice: 6 },
    { id: "tools", name: "Инструменты", basePrice: 20 }
  ];
  function rateFor(key) { const state = getState(); return buildings[key].rate + buildings[key].increment * (state[key] - 1); }
  function cratePrice() { const state = getState(); return (12 + state.marketLevel * 0.5) * (1 + state.prestigeValue * 0.05 + (state.rareGoldenTool ? 0.05 : 0)); }
  function marketUpgradeCost() { const state = getState(); return state.marketLevel ? 40 + state.marketLevel * 25 : 25; }
  function salePrice(resource) {
    const state = getState(); const item = sellableResources.find((entry) => entry.id === resource);
    if (!item) return 0;
    if (resource === "crates") return cratePrice();
    return item.basePrice * (1 + state.marketLevel * 0.04 + state.prestigeValue * 0.05);
  }
  function activeEvent() { const state = getState(); return eventCatalog.find((item) => item.id === state.eventType && state.eventUntil > Date.now()) || null; }
  function startRandomEvent() {
    const state = getState();
    if (activeEvent()) return;
    const choices = eventCatalog.filter((item) => item.id !== state.eventType);
    const event = choices[Math.floor(Math.random() * choices.length)];
    state.eventType = event.id; state.eventUntil = Date.now() + eventDuration; state.eventOrderProgress = 0; state.eventMerchantUsed = 0;
    const eventCard = document.getElementById("eventCard");
    if (eventCard) { eventCard.classList.remove("is-new"); void eventCard.offsetWidth; eventCard.classList.add("is-new"); }
    showNotice(`Событие началось: ${event.title}`); save();
  }
  function updateEvents(now) {
    const state = getState();
    if (state.eventType && state.eventUntil <= now) {
      if (state.eventType === "order" && state.eventOrderProgress >= 12) { state.cash += 120; state.lifetime += 120; showNotice("Большой заказ выполнен · награда +120 монет"); }
      state.eventType = ""; state.eventUntil = 0; state.nextEventAt = now + 45000; save();
    }
    if (!state.eventType && state.nextEventAt <= now) startRandomEvent();
  }
  function saleRate() { return Math.min(rateFor("packing"), 0.62); }
  function incomeRate() { return Math.min(rateFor("forest"), rateFor("mill"), saleRate()) * cratePrice(); }
  function rewardedCoinBonus() { return Math.max(1, Math.round(incomeRate() * 60)); }
  function warehouseCapacity() { const state = getState(); return state.warehouseCap + state.prestigeStorage * 50 + (state.rareSeed ? 50 : 0); }
  function warehouseLevel() { return Math.max(1, Math.floor((getState().warehouseCap - 100) / 50) + 1); }
  function warehouseUpgradeCost() { return 100 + (warehouseLevel() - 1) * 75; }
  function upgradeWarehouse() {
    const state = getState(); const cost = warehouseUpgradeCost();
    if (!canSpendBeforeMarket(cost)) return false;
    state.cash -= cost; state.warehouseCap += 50; game.playUpgradeFx(); render(); save();
    showNotice("Склад улучшен · лимит каждого ресурса увеличен на 50."); return true;
  }
  function simulate(seconds) {
    const state = getState();
    if (seconds <= 0) return 0;
    const tickTime = Date.now();
    const event = eventCatalog.find((item) => item.id === state.eventType && state.eventUntil > tickTime);
    let productionMultiplier = state.boosterUntil > tickTime ? 2 : 1;
    if (state.weeklyEvent === "festival") productionMultiplier *= 1.25;
    productionMultiplier *= 1 + state.prestigeSpeed * 0.05 + (state.rareForestSpirit ? 0.05 : 0) + Math.min(0.25, state.tools * 0.01);
    if (event?.id === "festival") productionMultiplier *= 1.25;
    if (event?.id === "speed") productionMultiplier *= 2;
    const forestMultiplier = event?.id === "rain" ? 0.7 : 1;
    const outputCap = warehouseCapacity();
    const producedLogs = Math.min(rateFor("forest") * seconds * productionMultiplier * forestMultiplier, Math.max(0, outputCap - state.logs));
    state.logs += producedLogs; state.totalLogsProduced += producedLogs;
    const sawn = Math.min(state.logs, rateFor("mill") * seconds * productionMultiplier, Math.max(0, outputCap - state.planks));
    state.logs -= sawn; state.planks += sawn; state.totalPlanksProduced += sawn;
    const packed = Math.min(state.planks, rateFor("packing") * seconds * productionMultiplier, Math.max(0, outputCap - state.crates));
    state.planks -= packed; state.crates += packed;
    if (state.weeklyEvent === "festival") state.weeklyProgress += packed;
    const farmed = state.playerLevel >= 4 ? Math.min(state.water, (0.28 + state.farmLevel * 0.1) * seconds * productionMultiplier, Math.max(0, outputCap - state.grain)) : 0;
    state.water -= farmed; state.grain += farmed;
    const waterFlour = state.playerLevel >= 3 ? Math.min(state.water, (0.35 + state.watermill * 0.12) * seconds * productionMultiplier) : 0;
    const grainFlour = Math.min(state.grain, (0.2 + state.farmLevel * 0.08) * seconds * productionMultiplier);
    const milled = Math.min(waterFlour + grainFlour, Math.max(0, outputCap - state.flour));
    const waterUsed = Math.min(state.water, milled * (waterFlour / Math.max(0.000001, waterFlour + grainFlour)));
    state.water -= waterUsed; state.grain = Math.max(0, state.grain - (milled - waterUsed)); state.flour += milled;
    const stoneMultiplier = state.weeklyEvent === "stone" ? 1.5 : 1;
    const fired = state.playerLevel >= 6 ? Math.min(state.stone, (0.22 + state.stonework * 0.1) * seconds * productionMultiplier * stoneMultiplier * (state.rareMineral ? 1.1 : 1), Math.max(0, outputCap - state.bricks)) : 0;
    state.stone -= fired; state.bricks += fired;
    if (state.weeklyEvent === "stone") state.weeklyProgress += fired;
    if (state.weeklyEvent === "drought") state.weeklyProgress += milled;
    return packed;
  }
  function upgradeCost(key) { const state = getState(); const building = buildings[key]; return building.cost + building.step * (state[key] - 1); }
  function canSpendBeforeMarket(cost, notify = true) {
    const state = getState();
    if (state.cash < cost) { if (notify) showNotice(`Не хватает ${compact(cost - state.cash)} монет.`); return false; }
    if (!state.marketLevel && state.marketUpgradeSeen && state.cash - cost < marketUpgradeCost()) { if (notify) showNotice(`Сначала открой рынок · сохрани ${compact(marketUpgradeCost())} монет.`); return false; }
    return true;
  }
  function upgrade(key) {
    const state = getState(); const cost = upgradeCost(key);
    if (!canSpendBeforeMarket(cost)) return false;
    state.cash -= cost; state[key] += 1; game.playUpgradeFx(); render(); save(); return true;
  }
  function sellResource(resource, requestedAmount) {
    const state = getState();
    if (state.marketLevel < 1) return 0;
    const item = sellableResources.find((entry) => entry.id === resource);
    if (!item) return 0;
    const quantity = Math.min(Math.floor(getState()[resource]), Math.floor(Number(requestedAmount)));
    if (!Number.isFinite(quantity) || quantity < 1) return 0;
    const event = activeEvent();
    let earnings = quantity * salePrice(resource);
    if (resource === "crates") {
      earnings *= (event?.id === "market" ? 1.5 : 1) * (state.weeklyEvent === "fair" ? 1.35 : 1);
      if (state.weeklyEvent === "guild" && quantity >= 10) earnings *= 1.25;
      if (event?.id === "merchant" && !state.eventMerchantUsed) { earnings *= 1.5; state.eventMerchantUsed = 1; }
      state.shipped += quantity; state.dailyProgress += quantity;
      const crateOrder = game.orders.marketOrders[0];
      state.orderProgress0 = Math.min(crateOrder.requirement, state.orderProgress0 + quantity);
      if (event?.id === "order") state.eventOrderProgress += quantity;
      if (state.weeklyEvent === "fair") state.weeklyProgress += earnings;
      if (state.weeklyEvent === "guild") state.weeklyProgress += quantity;
    }
    playCartDelivery(); state[resource] -= quantity; state.cash += earnings; state.lifetime += earnings;
    render(); save();
    game.manualShipments += 1;
    showNotice(`Продано: ${compact(quantity)} ${item.name.toLowerCase()} · +${compact(earnings)} монет`);
    if (resource === "crates" && game.manualShipments % 3 === 0 && Date.now() - game.lastFullscreenAt >= 120000) showFullscreenAd();
    return quantity;
  }
  function shipAll() { const state = getState(); sellResource("crates", Math.floor(state.crates)); }
  game.economy = { eventCatalog, sellableResources, rateFor, cratePrice, salePrice, marketUpgradeCost, activeEvent, updateEvents, saleRate, incomeRate, rewardedCoinBonus, warehouseCapacity, warehouseLevel, warehouseUpgradeCost, upgradeWarehouse, simulate, upgradeCost, canSpendBeforeMarket, upgrade, sellResource, shipAll };
})(window.ForestGame = window.ForestGame || {});
