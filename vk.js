(function () {
  const params = new URLSearchParams(location.search);
  const isVKLaunch = ["vk_app_id", "vk_user_id", "vk_access_token", "sign"]
    .some((key) => params.has(key)) || /(^|\.)vk\.ru$|(^|\.)vk\.com$/i.test(new URL(document.referrer || location.href).hostname);
  if (!isVKLaunch) return;

  function initializeBridge() {
    const bridge = window.vkBridge;
    if (!bridge || typeof bridge.send !== "function") return;
    bridge.send("VKWebAppInit").catch((error) => {
      console.info("VK Bridge initialization was not accepted.", error);
    });
  }

  if (window.vkBridge) {
    initializeBridge();
    return;
  }

  const script = document.createElement("script");
  script.src = "https://unpkg.com/@vkontakte/vk-bridge/dist/browser.min.js";
  script.async = true;
  script.addEventListener("load", initializeBridge, { once: true });
  script.addEventListener("error", () => {
    console.info("VK Bridge could not be loaded; the game continues without VK APIs.");
  }, { once: true });
  document.head.append(script);
})();
