(function (game) {
  const params = new URLSearchParams(location.search);
  let referrerHost = "";
  try { referrerHost = new URL(document.referrer).hostname; } catch {}
  const isVKLaunch = ["vk_app_id", "vk_user_id", "vk_access_token", "sign"]
    .some((key) => params.has(key)) || /(^|\.)vk\.(ru|com)$/i.test(referrerHost);

  let bridgeInit = Promise.resolve(false);
  function initBridge() {
    if (!window.vkBridge || typeof window.vkBridge.send !== "function") return Promise.resolve(false);
    return window.vkBridge.send("VKWebAppInit", {}).then(() => true);
  }

  if (isVKLaunch) {
    if (window.vkBridge) bridgeInit = initBridge();
    else {
      bridgeInit = new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/@vkontakte/vk-bridge/dist/browser.min.js";
        script.async = true;
        script.addEventListener("load", () => initBridge().then(resolve).catch((error) => {
          console.info("VK Bridge initialization failed.", error); resolve(false);
        }), { once: true });
        script.addEventListener("error", () => {
          console.info("VK Bridge could not be loaded; using local save."); resolve(false);
        }, { once: true });
        document.head.append(script);
      });
    }
  }

  const STORAGE_KEY = "forest_workshop_save";
  const MAX_STORAGE_VALUE_LENGTH = 2236;
  const SAVE_DELAY = 30000;
  const api = {
    isVKLaunch,
    ready: false,
    rewardedAdAvailable: false,
    saveTimer: null,
    saveInFlight: false,
    saveDirty: false,
    initialized: false
  };

  function renderAfterPlatformChange() {
    if (typeof game.render === "function") game.render();
  }

  function scheduleCloudSave(delay = SAVE_DELAY) {
    if (!api.saveDirty || api.saveTimer || !api.ready) return;
    api.saveTimer = setTimeout(writeCloudSave, delay);
  }

  async function writeCloudSave() {
    api.saveTimer = null;
    if (!api.ready || !api.saveDirty) return;
    if (api.saveInFlight) { scheduleCloudSave(5000); return; }
    const value = JSON.stringify(game.getState());
    if (value.length > MAX_STORAGE_VALUE_LENGTH) {
      console.info("VK Storage save exceeds the documented value limit; local save remains available.");
      return;
    }
    api.saveInFlight = true;
    api.saveDirty = false;
    try {
      const result = await window.vkBridge.send("VKWebAppStorageSet", { key: STORAGE_KEY, value });
      if (!result?.result) throw new Error("VK Storage did not confirm the save");
    } catch (error) {
      api.saveDirty = true;
      console.info("VK cloud save failed; local save remains available.", error);
    } finally {
      api.saveInFlight = false;
      if (api.saveDirty) scheduleCloudSave(60000);
    }
  }

  api.queueCloudSave = function (flush = false) {
    if (!isVKLaunch) return;
    api.saveDirty = true;
    if (flush) {
      clearTimeout(api.saveTimer);
      api.saveTimer = null;
      if (api.ready) void writeCloudSave();
      return;
    }
    scheduleCloudSave();
  };

  async function loadCloudSave() {
    clearTimeout(api.saveTimer);
    api.saveTimer = null;
    try {
      const response = await window.vkBridge.send("VKWebAppStorageGet", { keys: [STORAGE_KEY] });
      const storedValue = response?.keys?.find((entry) => entry.key === STORAGE_KEY)?.value;
      if (!storedValue) {
        api.saveDirty = true;
        void writeCloudSave();
        return;
      }
      const cloudSave = game.normalizeSave(JSON.parse(storedValue));
      if (!cloudSave) throw new Error("VK cloud save is invalid");
      const localSave = game.getState();
      if (game.cloudSaveIsAhead?.(cloudSave, localSave)) {
        try { localStorage.setItem(`${game.constants.STORAGE_KEY}-before-cloud-restore`, JSON.stringify(localSave)); } catch {}
        const awaySeconds = Math.min(game.constants.MAX_OFFLINE_SECONDS, Math.max(0, (Date.now() - cloudSave.lastSaved) / 1000));
        game.setState(cloudSave);
        const producedCrates = game.economy.simulate(awaySeconds);
        game.saveLocal();
        renderAfterPlatformChange();
        if (producedCrates > 0) game.showNotice(game.translate("cloudNotice", { amount: game.compact(producedCrates) }));
        api.saveDirty = true;
        void writeCloudSave();
      } else if (game.cloudSaveIsAhead?.(localSave, cloudSave)) {
        api.saveDirty = true;
        void writeCloudSave();
      }
    } catch (error) {
      console.info("VK cloud save could not be loaded; using local save.", error);
      api.saveDirty = true;
      void writeCloudSave();
    }
  }

  async function checkRewardedAds() {
    if (!api.ready) return;
    try {
      const response = await window.vkBridge.send("VKWebAppCheckNativeAds", { ad_format: "reward" });
      api.rewardedAdAvailable = Boolean(response?.result);
    } catch (error) {
      api.rewardedAdAvailable = false;
      console.info("VK rewarded ad availability check failed.", error);
    }
    renderAfterPlatformChange();
    if (!api.rewardedAdAvailable) setTimeout(checkRewardedAds, 60000);
  }

  api.showRewardedAd = async function (rewardType) {
    if (!api.ready || !api.rewardedAdAvailable || game.rewardedAdInProgress) {
      if (!api.rewardedAdAvailable) game.showNotice(game.translate("rewardedUnavailable"));
      return;
    }
    if (rewardType !== "booster" && rewardType !== "coins") return;
    const state = game.getState();
    if (rewardType === "booster" && state.boosterUntil > Date.now()) return;
    game.rewardedAdInProgress = true;
    api.rewardedAdAvailable = false;
    renderAfterPlatformChange();
    let rewarded = false;
    try {
      const response = await window.vkBridge.send("VKWebAppShowNativeAds", {
        ad_format: "reward",
        use_waterfall: false
      });
      if (response?.result === true) {
        rewarded = true;
        if (rewardType === "booster") {
          state.boosterUntil = Math.max(Date.now(), state.boosterUntil) + 60000;
          game.showNotice("Лесные духи удвоили производство на 60 секунд!");
        } else {
          const bonus = game.economy.rewardedCoinBonus();
          state.cash += bonus;
          state.lifetime += bonus;
          game.showNotice(game.translate("rewardedNotice", { bonus: game.compact(bonus) }));
        }
        game.save();
      } else game.showNotice(game.translate("rewardedUnavailable"));
    } catch (error) {
      console.info("VK rewarded ad failed.", error);
      game.showNotice(game.translate("rewardedFailed"));
    } finally {
      game.rewardedAdInProgress = false;
      renderAfterPlatformChange();
      setTimeout(checkRewardedAds, rewarded ? 15000 : 60000);
    }
  };

  api.initialize = async function () {
    if (!isVKLaunch || api.initialized) return;
    api.initialized = true;
    const initialized = await bridgeInit.catch((error) => {
      console.info("VK Bridge initialization failed; using local save.", error);
      return false;
    });
    if (!initialized) return;
    api.ready = true;
    await Promise.all([loadCloudSave(), checkRewardedAds()]);
    if (api.saveDirty) scheduleCloudSave();
  };

  game.vk = api;
})(window.ForestGame = window.ForestGame || {});
