(function (game) {
  const { MAX_OFFLINE_SECONDS } = game.constants;
  game.getState = () => game.state;
  game.setState = (state) => { game.state = state; };
  game.manualShipments = 0; game.lastFullscreenAt = 0; game.lastCoinFxAt = 0; game.previousLogCount = Math.floor(game.state.logs);
  game.selectedMapNode = "forest"; game.locationControlsKey = null; game.selectedUtility = null;
  game.ysdk = null; game.rewardedAdInProgress = false; game.player = null; game.gameplayStarted = false; game.cloudSaveTimer = null; game.cloudSaveInFlight = false;
  game.awaySeconds = Math.min(MAX_OFFLINE_SECONDS, Math.max(0, (Date.now() - game.state.lastSaved) / 1000));
  let previousTick = Date.now(); let lastSave = previousTick; let tickHandle = 0;
  game.save = function () { game.saveLocal(); game.yandex.queueCloudSave(); };
  const track = (name, params) => game.analytics?.track(name, params);
  function saveBeforeExit() { game.save(); game.yandex.queueCloudSave(true); }
  const missingControls = [];
  function bindControl(id, eventName, handler) {
    const element = document.getElementById(id);
    if (!element) { missingControls.push(id); return; }
    element.addEventListener(eventName, handler);
  }
  function resetGame() {
    if (!window.confirm(game.translate("resetConfirm"))) return;
    game.setState(game.defaults()); game.selectedMapNode = "forest"; game.locationControlsKey = null; game.previousLogCount = 0; game.manualShipments = 0;
    game.save(); game.yandex.queueCloudSave(true); game.closeMillLocation(); game.render(); game.showNotice(game.translate("resetNotice"));
  }
  bindControl("rewardBooster", "click", () => game.yandex.showRewardedAd("booster"));
  bindControl("rewardCoins", "click", () => game.yandex.showRewardedAd("coins"));
  bindControl("dailyQuestClaim", "click", () => { const state = game.getState(); const goal = Math.min(25, 5 + (state.playerLevel - 1) * 2); if (state.dailyClaimed || state.dailyProgress < goal) return; state.dailyClaimed = 1; state.cash += 80; state.lifetime += 80; game.addXp(20); track("daily_reward_claimed", { level: state.playerLevel }); game.render(); game.save(); });
  function collectZone(key) {
    const state = game.getState(); const config = game.zoneConfig[key]; if (!config) return;
    if (state.playerLevel < config.unlock) { game.showNotice(`${config.name} откроется на ${config.unlock} уровне игрока.`); return; }
    const collection = game.ui.zoneCollectionState(key, state);
    if (!collection?.ready) { game.showNotice(collection?.reason || "Пока нечего собрать."); return; }
    const capacity = game.economy.warehouseCapacity();
    if (key === "river") state.water = Math.min(capacity, state.water + collection.amount);
    else if (key === "quarry") state.stone = Math.min(capacity, state.stone + collection.amount);
    else if (key === "farm" && state.water >= 1) { state.water -= 1; state.grain = Math.min(capacity, state.grain + collection.amount); }
    else if (key === "tools" && state.planks >= 2 && state.stone >= 2 && state.tools < capacity) { state.planks -= 2; state.stone -= 2; state.tools += collection.amount; state.rareGoldenTool = 1; game.addXp(8); }
    else return;
    game.addXp(key === "river" ? 3 : key === "quarry" ? 5 : key === "farm" ? 4 : 0); game.showNotice(`Собрано: +${collection.amount} ${collection.resource}.`); game.render(); game.save();
  }
  function upgradeZone(key) {
    const state = game.getState(); const config = game.zoneConfig[key]; if (!config || state.playerLevel < config.unlock) return;
    const cost = game.zoneUpgradeCost(key); const marketCost = game.economy.marketUpgradeCost();
    if (state.cash < cost || (!state.marketLevel && state.cash >= cost && state.cash - cost < marketCost)) { game.showNotice(`Нужно ${game.compact(cost)} монет и сначала открыть рынок.`); return; }
    state.cash -= cost; state[config.level] += 1; track("zone_upgraded", { zone: key, level: state[config.level] }); game.playUpgradeFx(); game.render(); game.save();
  }
  document.querySelectorAll("[data-upgrade-zone]").forEach((button) => button.addEventListener("click", (event) => { event.stopPropagation(); upgradeZone(button.dataset.upgradeZone); }));
  bindControl("streakClaim", "click", () => { const state = game.getState(); if (state.streakClaimed || !state.streak) return; const reward = state.streak * 15; state.streakClaimed = 1; state.cash += reward; state.lifetime += reward; track("streak_reward_claimed", { streak: state.streak }); game.render(); game.save(); });
  bindControl("weeklyClaim", "click", () => { const state = game.getState(); const weekly = game.retention.activeWeeklyEvent(); if (state.weeklyClaimed || state.weeklyProgress < weekly.goal) return; state.weeklyClaimed = 1; state.cash += weekly.reward; state.lifetime += weekly.reward; game.addXp(weekly.xp); track("weekly_reward_claimed", { event: weekly.id }); game.render(); game.save(); });
  bindControl("prestigeAction", "click", () => {
    const state = game.getState(); if (state.playerLevel < 10 || state.marketLevel < 1) return;
    if (!window.confirm("Начать новый цикл? Уровни, запасы, текущий заказ и короткое событие сбросятся. Дневной и недельный прогресс, уже полученные награды и серия входов сохранятся.")) return;
    const choice = state.prestigeChoice || "speed";
    Object.assign(state, { cash: 30, logs: 0, planks: 0, crates: 0, water: 0, stone: 0, flour: 0, bricks: 0, farm: 0, tools: 0, forest: 1, mill: 1, packing: 1, marketLevel: 0, watermill: 1, stonework: 1, warehouseCap: 100, farmLevel: 1, toolshopLevel: 1, playerLevel: 1, playerXp: 0, orderProgress0: 0, orderProgress: 0, selectedOrder: 0, eventType: "", eventUntil: 0, eventOrderGoal: 0, eventOrderProgress: 0, eventMerchantUsed: 0, nextEventAt: Date.now() + 45000, boosterUntil: 0 });
    state.prestige += 1; state.prestigeSpeed += choice === "speed" ? 1 : 0; state.prestigeValue += choice === "value" ? 1 : 0; state.prestigeStorage += choice === "storage" ? 1 : 0; state.rareForestSpirit = 1;
    game.showNotice(`Престиж ${state.prestige} получен · бонус: ${choice}`); game.render(); game.save();
  });
  document.querySelectorAll("[data-prestige]").forEach((button) => button.addEventListener("click", () => { game.getState().prestigeChoice = button.dataset.prestige; game.render(); game.save(); }));
  bindControl("resetButton", "click", resetGame);
  bindControl("restoreLocalSave", "click", () => {
    if (!game.yandex.hasLocalBackup()) return;
    if (!window.confirm("Заменить текущее сохранение локальным прогрессом до синхронизации?")) return;
    if (game.yandex.restoreLocalBackup()) game.renderUtilities();
  });
  bindControl("orderClaim", "click", () => {
    const state = game.getState(); const order = game.orders.currentOrder(); if (state.playerLevel < order.unlock || game.orders.orderAmount(order) < order.requirement) return;
    const reward = game.orders.orderReward(order); state.cash += reward; state.lifetime += reward; game.addXp(order.xp); state.orderId += 1; track("order_completed", { resource: order.resource, level: state.playerLevel });
    if (order.resource !== "crates") state[order.resource] -= order.requirement; if (order.resource === "crates") state.orderProgress0 = 0;
    game.showNotice(`${order.title} выполнен · +${reward} монет · +${order.xp} опыта`); game.render(); game.save();
  });
  bindControl("eventAction", "click", () => { const event = game.economy.activeEvent(); if (!event) return; game.openLocation("market"); });
  bindControl("tutorialClaim", "click", () => { const state = game.getState(); if (state.tutorialStep !== 4) return; state.cash += 50; state.lifetime += 50; state.tutorialStep = 5; track("tutorial_completed", { level: state.playerLevel }); document.getElementById("tutorialCard")?.classList.add("is-complete"); game.render(); game.save(); game.showNotice("Обучение завершено · +50 монет. Отличное начало!"); });
  function restartTutorial() { const state = game.getState(); state.tutorialStartLogs = state.totalLogsProduced; state.tutorialStartForest = state.forest; state.tutorialStartPlanks = state.totalPlanksProduced; state.tutorialStartShipped = state.shipped; state.tutorialStep = 0; game.render(); game.save(); }
  bindControl("tutorialRestart", "click", () => { restartTutorial(); game.showNotice("Подсказки запущены заново. Следуй выделенным объектам на поле."); });
  bindControl("helpOpen", "click", () => document.getElementById("helpDialog")?.showModal());
  bindControl("helpTutorialRestart", "click", () => { restartTutorial(); document.getElementById("helpDialog")?.close(); game.showNotice("Обучение запущено заново."); });
  document.querySelectorAll(".map-node").forEach((node) => node.addEventListener("click", () => { game.selectedMapNode = node.dataset.map; game.renderMap(); game.openLocation(game.selectedMapNode); }));
  document.querySelectorAll(".field-object").forEach((node) => node.addEventListener("click", () => { const key = node.dataset.field; if (game.zoneConfig[key]) { collectZone(key); return; } if (key === "market" && game.getState().marketLevel < 1) { game.selectedMapNode = "market"; game.openLocation("market"); return; } game.openLocation(key); }));
  bindControl("locationBack", "click", game.closeMillLocation);
  bindControl("locationPrimaryAction", "click", () => {
    const key = game.selectedMapNode;
    if (key === "warehouse") game.economy.upgradeWarehouse();
    else if (key !== "market") game.economy.upgrade(key);
  });
  bindControl("locationSecondaryAction", "click", () => {
    if (game.selectedMapNode !== "market") return;
    const state = game.getState(); const cost = game.economy.marketUpgradeCost();
    if (state.cash < cost) { game.showNotice(`Нужно ещё ${game.compact(cost - state.cash)} монет.`); return; }
    state.cash -= cost; state.marketLevel += 1; game.render(); game.save();
  });
  bindControl("marketResource", "change", () => {
    game.marketResource = document.getElementById("marketResource").value;
    game.renderLocation();
  });
  bindControl("marketSell", "click", () => {
    const resource = game.marketResource || "crates";
    const sold = game.economy.sellResource(resource, game.getState()[resource]);
    if (sold) track("resource_sold", { resource, quantity: sold });
  });
  bindControl("mapAction", "click", () => {
    if (game.selectedMapNode === "market") { const state = game.getState(); const cost = game.economy.marketUpgradeCost(); if (state.cash < cost) return; state.cash -= cost; state.marketLevel += 1; game.render(); game.save(); }
    else game.openLocation(game.selectedMapNode);
  });
  document.querySelectorAll(".side-button").forEach((button) => button.addEventListener("click", () => { const panel = document.getElementById(button.dataset.panel); if (!panel) { missingControls.push(button.dataset.panel || "utility-panel"); return; } const wasOpen = panel.classList.contains("is-open"); document.querySelectorAll(".utility-panel").forEach((item) => { item.classList.remove("is-open"); item.setAttribute("aria-hidden", "true"); }); document.querySelectorAll(".side-button").forEach((item) => item.classList.remove("is-active")); if (!wasOpen) { panel.classList.add("is-open"); panel.setAttribute("aria-hidden", "false"); button.classList.add("is-active"); game.renderUtilities(); } }));
  document.querySelectorAll(".utility-close").forEach((button) => button.addEventListener("click", () => { const panel = button.closest(".utility-panel"); panel.classList.remove("is-open"); panel.setAttribute("aria-hidden", "true"); document.querySelectorAll(".side-button").forEach((item) => item.classList.remove("is-active")); }));
  if (missingControls.length) {
    const errorPanel = document.getElementById("gameError");
    if (errorPanel) { errorPanel.hidden = false; errorPanel.textContent = `Некоторые кнопки не подключены: ${missingControls.join(", ")}. Перезагрузите игру.`; }
    console.error("Missing game controls", missingControls);
  }
  if (game.awaySeconds >= 10) { const producedCrates = game.economy.simulate(game.awaySeconds); if (producedCrates > 0) { track("offline_production_claimed", { seconds: Math.floor(game.awaySeconds), crates: Math.floor(producedCrates) }); game.showNotice(game.translate("offlineNotice", { minutes: game.compact(game.awaySeconds / 60), amount: game.compact(producedCrates) })); } }
  try {
    game.render();
  } catch (error) {
    console.error("Initial game render failed", error);
    const errorPanel = document.getElementById("gameError");
    if (errorPanel) { errorPanel.hidden = false; errorPanel.textContent = `Не удалось запустить интерфейс: ${error.message}`; }
    game.showNotice("Не удалось загрузить мастерскую. Перезагрузите игру.");
  }
  game.save();
  track("game_session_started", { level: game.getState().playerLevel, returning: game.getState().lastVisitKey !== game.retention.dayKey() });
  function gameLoop() {
    const tick = Date.now();
    const elapsed = Math.min(MAX_OFFLINE_SECONDS, Math.max(0, (tick - previousTick) / 1000));
    previousTick = tick;
    try {
      game.economy.updateEvents(tick);
      game.economy.simulate(elapsed);
      game.render({ light: true });
      if (tick - lastSave >= 5000) { game.save(); lastSave = tick; }
    } catch (error) {
      console.error("Game loop failed", error);
      const errorPanel = document.getElementById("gameError");
      if (errorPanel) { errorPanel.hidden = false; errorPanel.textContent = `Ошибка игры: ${error.message}`; }
    }
    tickHandle = window.setTimeout(gameLoop, 250);
  }
  tickHandle = window.setTimeout(gameLoop, 250);
  document.addEventListener("visibilitychange", () => { if (document.hidden) game.yandex.stopGameplay(); else game.yandex.startGameplay(); });
  window.addEventListener("pagehide", saveBeforeExit);
  game.yandex.initializeYandexGames();
})(window.ForestGame = window.ForestGame || {});
