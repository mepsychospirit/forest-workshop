(function (game) {
  const STORAGE_KEY = "forest-workshop-save-v1";
  const CLOUD_SAVE_KEY = "forestWorkshop";
  const MAX_OFFLINE_SECONDS = 8 * 60 * 60;
  const CRATE_ORDER_GOAL = 8;
  const buildings = {
    forest: { rate: 0.9, increment: 0.25, cost: 15, step: 12 },
    mill: { rate: 0.68, increment: 0.2, cost: 25, step: 18 },
    packing: { rate: 0.48, increment: 0.15, cost: 40, step: 25 }
  };
  const defaults = () => ({
    cash: 30, lifetime: 0, logs: 0, planks: 0, crates: 0,
    grain: 0, farmLevel: 1, toolshopLevel: 1, orderProgress0: 0,
    saveVersion: 3, shipped: 0, forest: 1, mill: 1, packing: 1, marketLevel: 0, boosterUntil: 0, eventType: "", eventUntil: 0, nextEventAt: Date.now() + 45000, eventOrderGoal: 0, eventOrderProgress: 0, eventMerchantUsed: 0, orderId: 0, selectedOrder: 0, orderProgress: 0, water: 0, stone: 0, flour: 0, bricks: 0, farm: 0, tools: 0, watermill: 1, stonework: 1, warehouseCap: 100, dailyKey: "", dailyProgress: 0, dailyClaimed: 0, streak: 0, lastVisitKey: "", streakClaimed: 0, weeklyEvent: "festival", weeklyKey: "", weeklyProgress: 0, weeklyClaimed: 0, prestige: 0, prestigeChoice: "speed", prestigeSpeed: 0, prestigeValue: 0, prestigeStorage: 0, rareForestSpirit: 0, rareGoldenTool: 0, rareSeed: 0, rareMineral: 0, rareDecoration: 0, playerLevel: 1, playerXp: 0, tutorialStep: 0, tutorialVersion: 2, tutorialStartLogs: 0, tutorialStartForest: 1, tutorialStartPlanks: 0, tutorialStartShipped: 0, totalLogsProduced: 0, totalPlanksProduced: 0, rewardFirstCoins: 0, rewardTrader: 0, rewardMaster: 0, lastSaved: Date.now()
  });

  function normalizeSave(saved) {
    if (!saved || typeof saved !== "object") return null;
    const normalized = defaults();
    for (const key of Object.keys(normalized)) {
      const value = saved[key];
      if (typeof normalized[key] === "number" && Number.isFinite(value)) normalized[key] = Math.max(0, value);
      else if (typeof normalized[key] === "string" && typeof value === "string") normalized[key] = value.slice(0, 80);
    }
    if (!Number.isFinite(saved.orderProgress0) && Number.isFinite(saved.orderProgress)) normalized.orderProgress0 = Math.max(0, saved.orderProgress);
    if (!Number.isFinite(saved.tutorialStep) && (normalized.lifetime > 0 || normalized.forest > 1 || normalized.mill > 1 || normalized.packing > 1)) normalized.tutorialStep = 5;
    if (!Number.isFinite(saved.tutorialVersion)) {
      if (normalized.tutorialStep < 5) {
        normalized.tutorialStep = 0;
        normalized.tutorialStartLogs = normalized.totalLogsProduced;
        normalized.tutorialStartForest = normalized.forest;
        normalized.tutorialStartPlanks = normalized.totalPlanksProduced;
        normalized.tutorialStartShipped = normalized.shipped;
      }
      normalized.tutorialVersion = 2;
    }
    normalized.forest = Math.max(1, Math.floor(normalized.forest));
    normalized.mill = Math.max(1, Math.floor(normalized.mill));
    normalized.packing = Math.max(1, Math.floor(normalized.packing));
    normalized.watermill = Math.max(1, Math.floor(normalized.watermill));
    normalized.stonework = Math.max(1, Math.floor(normalized.stonework));
    normalized.farmLevel = Math.max(1, Math.floor(normalized.farmLevel));
    normalized.toolshopLevel = Math.max(1, Math.floor(normalized.toolshopLevel));
    normalized.warehouseCap = Math.max(100, Math.floor(normalized.warehouseCap));
    normalized.selectedOrder = Math.floor(normalized.selectedOrder) % 5;
    normalized.orderProgress0 = Math.min(CRATE_ORDER_GOAL, normalized.orderProgress0);
    normalized.prestigeChoice = ["speed", "value", "storage"].includes(normalized.prestigeChoice) ? normalized.prestigeChoice : "speed";
    normalized.weeklyEvent = ["festival", "stone", "fair", "drought", "guild"].includes(normalized.weeklyEvent) ? normalized.weeklyEvent : "festival";
    normalized.dailyClaimed = normalized.dailyClaimed ? 1 : 0;
    normalized.streakClaimed = normalized.streakClaimed ? 1 : 0;
    normalized.playerLevel = Math.max(1, Math.floor(normalized.playerLevel));
    if ((saved.saveVersion || 0) < 3 && normalized.marketLevel === 0) normalized.cash = Math.max(25, normalized.cash);
    normalized.saveVersion = 3;
    return normalized;
  }

  function load() {
    try { return normalizeSave(JSON.parse(localStorage.getItem(STORAGE_KEY))) || defaults(); }
    catch { return defaults(); }
  }

  game.constants = { STORAGE_KEY, CLOUD_SAVE_KEY, MAX_OFFLINE_SECONDS, buildings };
  game.state = load();
  game.defaults = defaults;
  game.normalizeSave = normalizeSave;
  game.saveLocal = function () {
    game.state.lastSaved = Date.now();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(game.state)); } catch {}
  };
})(window.ForestGame = window.ForestGame || {});
