(function (game) {
  const STORAGE_KEY = "forest-workshop-analytics-v1";
  const MAX_EVENTS = 200;
  function track(name, params = {}) {
    if (typeof name !== "string" || !/^[a-z][a-z0-9_]{0,39}$/.test(name)) return;
    const event = { name, at: Date.now(), params: {} };
    for (const [key, value] of Object.entries(params)) {
      if (/^[a-z][a-z0-9_]{0,39}$/.test(key) && ["string", "number", "boolean"].includes(typeof value)) event.params[key] = typeof value === "string" ? value.slice(0, 80) : value;
    }
    try {
      const events = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      events.push(event);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
    } catch {}
    const configuredCounter = Number(window.FOREST_WORKSHOP_METRIKA_ID);
    if (configuredCounter > 0 && typeof window.ym === "function") {
      try { window.ym(configuredCounter, "reachGoal", name, event.params); } catch {}
    }
  }
  function readLocalEvents() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch { return []; }
  }
  game.analytics = { track, readLocalEvents };
})(window.ForestGame = window.ForestGame || {});
