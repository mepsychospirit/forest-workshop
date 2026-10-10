(function (game) {
  const { CLOUD_SAVE_KEY, MAX_OFFLINE_SECONDS, STORAGE_KEY } = game.constants;
  function scheduleCloudSave(delay) {
    if (game.cloudSaveTimer) return;
    game.cloudSaveTimer = setTimeout(async () => {
      game.cloudSaveTimer = null;
      if (game.cloudSaveInFlight) { scheduleCloudSave(5000); return; }
      const player = game.player;
      if (typeof player?.setData !== "function") return;
      game.cloudSaveInFlight = true;
      game.cloudSaveDirty = false;
      try {
        await player.setData({ [CLOUD_SAVE_KEY]: { ...game.getState() } }, false);
      } catch {
        game.cloudSaveDirty = true;
      } finally {
        game.cloudSaveInFlight = false;
        if (game.cloudSaveDirty) scheduleCloudSave(10000);
      }
    }, delay);
  }
  function queueCloudSave(flush = false) {
    if (game.vk?.isVKLaunch) { game.vk.queueCloudSave(flush); return; }
    const player = game.player;
    if (typeof player?.setData !== "function") return;
    if (flush) {
      clearTimeout(game.cloudSaveTimer); game.cloudSaveTimer = null;
      try { Promise.resolve(player.setData({ [CLOUD_SAVE_KEY]: { ...game.getState() } }, true)).catch(() => { game.cloudSaveDirty = true; scheduleCloudSave(10000); }); } catch { game.cloudSaveDirty = true; scheduleCloudSave(10000); }
      return;
    }
    game.cloudSaveDirty = true;
    scheduleCloudSave(30000);
  }
  function startGameplay() {
    const api = game.ysdk?.features?.GameplayAPI;
    if (game.gameplayStarted || document.hidden || typeof api?.start !== "function") return;
    try { api.start(); game.gameplayStarted = true; } catch {}
  }
  function stopGameplay() {
    const api = game.ysdk?.features?.GameplayAPI;
    if (!game.gameplayStarted || typeof api?.stop !== "function") return;
    try { api.stop(); } catch {}
    game.gameplayStarted = false;
  }
  function loadYandexScript() {
    if (window.YaGames) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const isYandexHost = /(^|\\.)yandex\\.(ru|net|com)$/i.test(location.hostname);
      script.src = isYandexHost ? "/sdk.js" : "https://yandex.ru/games/sdk/v2"; script.async = true;
      const timeout = setTimeout(() => reject(new Error("SDK load timed out")), 10000);
      script.addEventListener("load", () => { clearTimeout(timeout); resolve(); }, { once: true });
      script.addEventListener("error", () => { clearTimeout(timeout); reject(new Error("SDK failed to load")); }, { once: true });
      document.head.append(script);
    });
  }
  function isYandexGamesHost() {
    const host = String(location.hostname || "").toLowerCase();
    return host === "yandex.ru" || host.endsWith(".yandex.ru") ||
      host === "yandex.net" || host.endsWith(".yandex.net") ||
      host === "yandex.com" || host.endsWith(".yandex.com");
  }
  function cloudSaveIsAhead(cloud, local) {
    const progress = (save) => [
      save.prestige,
      save.playerLevel,
      save.marketLevel,
      [3, 4, 6, 7].filter((level) => save.playerLevel >= level).length,
      [save.rareForestSpirit, save.rareGoldenTool, save.rareSeed, save.rareMineral, save.rareDecoration].reduce((total, found) => total + Number(Boolean(found)), 0),
      save.shipped,
      save.lifetime,
      save.forest + save.mill + save.packing + save.watermill + save.stonework + save.farmLevel + save.toolshopLevel,
      save.logs + save.planks + save.crates + save.water + save.grain + save.flour + save.stone + save.bricks + save.tools,
      save.cash,
      save.lastSaved
    ];
    const cloudProgress = progress(cloud); const localProgress = progress(local);
    for (let index = 0; index < cloudProgress.length; index += 1) {
      if (cloudProgress[index] !== localProgress[index]) return cloudProgress[index] > localProgress[index];
    }
    return false;
  }
  game.cloudSaveIsAhead = cloudSaveIsAhead;
  function restoreLocalBackup() {
    try {
      const backup = game.normalizeSave(JSON.parse(localStorage.getItem(`${STORAGE_KEY}-before-cloud-restore`)));
      if (!backup) return false;
      game.setState(backup); localStorage.removeItem(`${STORAGE_KEY}-before-cloud-restore`);
      game.saveLocal(); queueCloudSave(true); game.render();
      game.showNotice("Локальный прогресс восстановлен."); return true;
    } catch { return false; }
  }
  function hasLocalBackup() {
    try { return Boolean(localStorage.getItem(`${STORAGE_KEY}-before-cloud-restore`)); }
    catch { return false; }
  }
  async function initializeYandexGames() {
    // VK and other hosts run the game in an iframe. Do not request the
    // Yandex SDK there: ads/cloud save are optional and local save remains
    // available, while the game UI must start immediately.
    if (location.protocol === "file:" || !isYandexGamesHost()) return;
    try {
      await loadYandexScript();
      if (!window.YaGames) throw new Error("YaGames is unavailable");
      game.ysdk = await window.YaGames.init();
      game.applyLanguage(game.ysdk.environment?.i18n?.lang);
      try { game.ysdk.features?.LoadingAPI?.ready(); } catch {}
      startGameplay();
      try {
        game.player = await game.ysdk.getPlayer();
        const remote = await game.player.getData([CLOUD_SAVE_KEY]);
        const cloudSave = game.normalizeSave(remote?.[CLOUD_SAVE_KEY]);
        if (cloudSave && cloudSaveIsAhead(cloudSave, game.getState())) {
          try { localStorage.setItem(`${STORAGE_KEY}-before-cloud-restore`, JSON.stringify(game.getState())); } catch {}
          const cloudAwaySeconds = Math.min(MAX_OFFLINE_SECONDS, Math.max(0, (Date.now() - cloudSave.lastSaved) / 1000));
          game.setState(cloudSave);
          const producedCrates = game.economy.simulate(cloudAwaySeconds);
          game.render(); game.save();
          if (producedCrates > 0) game.showNotice(game.translate("cloudNotice", { amount: game.compact(producedCrates) }));
        } else game.save();
      } catch {}
      game.render();
    } catch (error) { console.info("Yandex Games SDK is unavailable; using local save.", error); }
  }
  function showFullscreenAd() {
    if (typeof game.ysdk?.adv?.showFullscreenAdv !== "function") return;
    game.lastFullscreenAt = Date.now(); stopGameplay();
    try { game.ysdk.adv.showFullscreenAdv({ callbacks: { onOpen: stopGameplay, onClose: startGameplay, onError: startGameplay } }); }
    catch { startGameplay(); }
  }
  function showRewardedAd(rewardType) {
    if (game.vk?.isVKLaunch) { void game.vk.showRewardedAd(rewardType); return; }
    if (game.rewardedAdInProgress || typeof game.ysdk?.adv?.showRewardedVideo !== "function") return;
    const state = game.getState();
    if (rewardType === "booster" && state.boosterUntil > Date.now()) return;
    game.rewardedAdInProgress = true; game.render(); stopGameplay();
    let rewarded = false; let closed = false; let watchdog = 0;
    const finishAd = () => { if (closed) return; closed = true; clearTimeout(watchdog); game.rewardedAdInProgress = false; startGameplay(); game.render(); };
    watchdog = setTimeout(() => { finishAd(); game.showNotice("Реклама не ответила. Попробуй ещё раз."); }, 90000);
    try {
      Promise.resolve(game.ysdk.adv.showRewardedVideo({ callbacks: {
        onOpen: stopGameplay,
        onRewarded: () => {
          if (rewarded || closed) return; rewarded = true;
          if (rewardType === "booster") { state.boosterUntil = Math.max(Date.now(), state.boosterUntil) + 60000; game.showNotice("Лесные духи удвоили производство на 60 секунд!"); }
          else if (rewardType === "coins") { const bonus = game.economy.rewardedCoinBonus(); state.cash += bonus; state.lifetime += bonus; game.showNotice(game.translate("rewardedNotice", { bonus: game.compact(bonus) })); }
          else return;
          game.render(); game.save();
        },
        onClose: () => { const completed = rewarded; finishAd(); if (!completed) game.showNotice("Ролик закрыт до завершения. Награды нет."); },
        onError: () => { finishAd(); game.showNotice(game.translate("rewardedUnavailable")); }
      } })).catch(() => { if (closed) return; finishAd(); game.showNotice(game.translate("rewardedFailed")); });
    } catch { finishAd(); game.showNotice(game.translate("rewardedFailed")); }
  }
  game.yandex = { queueCloudSave, startGameplay, stopGameplay, initializeYandexGames, showFullscreenAd, showRewardedAd, restoreLocalBackup, hasLocalBackup };
})(window.ForestGame = window.ForestGame || {});
