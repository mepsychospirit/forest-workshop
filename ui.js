(function (game) {
  const translations = {
    ru: {
      pageTitle: "Лесная мастерская", brandName: "Лесная мастерская", brandSubtitle: "Твоя мастерская в сердце леса", newGame: "Новая игра", resetTitle: "Начать заново",
      zoneEyebrow: "Тихая долина · твоя новая история", zoneTitle: "Добро пожаловать в долину", zoneDescription: "Начни с леса, построй мастерскую и преврати древесину в прибыль.", statsAria: "Твоя мастерская", balanceLabel: "Монеты", incomeLabel: "Потенциал выручки", lifetimeLabel: "Заработано за всё время", resourcesAria: "На складе",
      mapTitle: "Твоя долина", mapSubtitle: "Выбирай здание, заходи внутрь и развивай производство", mapStall: "Рыночная площадь", mapStallDescription: "Открой ручную продажу ящиков. Каждое улучшение добавляет 0,5 монеты к цене.", mapForestDescription: "Здесь начинается путь каждого бревна.", mapMillDescription: "Превращай брёвна в крепкие доски.", mapPackingDescription: "Собирай доски в готовые ящики для продажи.", mapSelect: "Выбрать", mapUpgrade: "Улучшить · {cost}", mapOpen: "Открыть · {cost}", mapLocked: "Нужно заработать {amount}", mapMarketUnlocked: "Цена ящика: {price} монет · уровень {level}",
      logsLabel: "Брёвна", planksLabel: "Доски", cratesLabel: "Ящики", productionTitle: "Производство", productionNote: "Линия работает автоматически", forestName: "Лесная делянка", millName: "Лесопилка", packingName: "Мастерская упаковки", logsPerSecond: "брёвен / сек", planksPerSecond: "досок / сек", cratesPerSecond: "ящиков / сек", level: "Уровень {level}", upgradeButton: "Улучшить · {cost}", upgradeAria: "Улучшить: {building}, стоимость {cost} монет", marketTitle: "Рынок", marketDescription: "Ящики ждут на складе. Отправляй партии вручную и получай выручку.", shipButton: "Отгрузить склад", rewardButton: "Видео-бонус · +30 сек.", shippedLabel: "Отправлено", cratesUnit: "ящиков", priceLabel: "Цена", coinsPerCrate: "монет / ящик",
      saveFooter: "Прогресс сохраняется в браузере и, на платформе, в профиле Яндекс Игр. Офлайн-производство работает до 8 часов; ящики можно продать после возвращения.", coins: "монет", incomePerSecond: "{amount} / сек", resetConfirm: "Начать новую игру? Текущий прогресс будет удалён.", resetNotice: "Мастерская открыта заново.", shipmentNotice: "Отправлено {quantity} ящиков · +{earnings} монет", rewardedNotice: "Бонус за просмотр: +{bonus} монет.", rewardedUnavailable: "Видео сейчас недоступно. Попробуйте позже.", rewardedFailed: "Не удалось запустить видео.", offlineNotice: "Пока вас не было ({minutes} мин), произведено {amount} ящиков. Продай их на рынке.", cloudNotice: "Загружено облачное сохранение · за время отсутствия произведено {amount} ящиков. Продай их на рынке."
    },
    en: {
      pageTitle: "Forest Workshop", brandName: "Forest Workshop", brandSubtitle: "A small business among the trees", newGame: "New game", resetTitle: "Start over", zoneEyebrow: "Quiet Valley · Lot 01", zoneTitle: "The work begins", zoneDescription: "Harvest timber, process it, and send finished crates to the market.", statsAria: "Workshop statistics", balanceLabel: "Balance", incomeLabel: "Potential sales", lifetimeLabel: "Total earned", resourcesAria: "Resources", mapTitle: "Workshop map", mapSubtitle: "Grow your settlement and unlock new opportunities", mapStall: "Market square", mapStallDescription: "Unlock manual crate sales. Each upgrade adds 0.5 coins to the price.", mapForestDescription: "Produces logs for the workshop.", mapMillDescription: "Turns logs into planks.", mapPackingDescription: "Packs planks into goods for the market.", mapSelect: "Select", mapUpgrade: "Upgrade · {cost}", mapOpen: "Unlock · {cost}", mapLocked: "Earn {amount} to unlock", mapMarketUnlocked: "Crate price: {price} coins · level {level}", logsLabel: "Logs", planksLabel: "Planks", cratesLabel: "Crates", productionTitle: "Production", productionNote: "Your production line runs automatically", forestName: "Forest plot", millName: "Sawmill", packingName: "Packing shop", logsPerSecond: "logs / sec", planksPerSecond: "planks / sec", cratesPerSecond: "crates / sec", level: "Level {level}", upgradeButton: "Upgrade · {cost}", upgradeAria: "Upgrade: {building}, costs {cost} coins", marketTitle: "Market", marketDescription: "Crates wait in storage. Ship a batch to receive coins.", shipButton: "Ship stock", rewardButton: "Video bonus · +30 sec", shippedLabel: "Shipped", cratesUnit: "crates", priceLabel: "Price", coinsPerCrate: "coins / crate", saveFooter: "Progress is saved in this browser and, on Yandex Games, to your profile. Production runs offline for up to 8 hours; crates wait for you to sell them.", coins: "coins", incomePerSecond: "{amount} / sec", resetConfirm: "Start a new game? Your current progress will be deleted.", resetNotice: "Your workshop is ready for a fresh start.", shipmentNotice: "Shipped {quantity} crates · +{earnings} coins", rewardedNotice: "Viewing bonus: +{bonus} coins.", rewardedUnavailable: "Video is unavailable right now. Try again later.", rewardedFailed: "Could not start the video.", offlineNotice: "While you were away ({minutes} min), production made {amount} crates. Ship them at the market.", cloudNotice: "Cloud save loaded · {amount} crates produced while away. Ship them at the market."
    }
  };
  let currentLanguage = "ru";
  let lastPanelRenderAt = 0;
  game.marketResource = game.marketResource || "crates";
  const elements = Object.fromEntries(["cash", "income", "lifetime", "logs", "planks", "crates", "resetButton", "notice"].map((id) => [id, document.getElementById(id)]));
  const zoneConfig = {
    river: { level: "watermill", input: "water", output: "flour", rate: 0.47, cap: "warehouseCap", unlock: 3, baseCost: 70, step: 45, name: "Речная пристань", inputName: "воды", outputName: "муки", icon: "assets/ui/market.svg" },
    quarry: { level: "stonework", input: "stone", output: "bricks", rate: 0.32, cap: "warehouseCap", unlock: 6, baseCost: 120, step: 70, name: "Каменоломня", inputName: "камня", outputName: "кирпичей", icon: "assets/ui/09_kamen.png" },
    farm: { level: "farmLevel", input: "water", output: "grain", rate: 0.28, cap: "warehouseCap", unlock: 4, baseCost: 90, step: 55, name: "Ферма", inputName: "воды", outputName: "зерна", icon: "assets/ui/15_ferma.png" },
    tools: { level: "toolshopLevel", input: "planks", output: "tools", rate: 0, cap: "warehouseCap", unlock: 7, baseCost: 160, step: 90, name: "Инструментальная", inputName: "досок + 2 камня", outputName: "инструментов", icon: "assets/ui/20_laboratoriya.png" }
  };
  function locationLevel(key, state = game.getState()) {
    if (zoneConfig[key]) return state[zoneConfig[key].level];
    if (key === "market") return state.marketLevel;
    if (key === "warehouse") return game.economy.warehouseLevel();
    return state[key] ?? 1;
  }
  const mapInfo = {
    forest: { title: "forestName", description: "mapForestDescription", icon: "assets/ui/forest.svg" }, mill: { title: "millName", description: "mapMillDescription", icon: "assets/ui/sawmill.svg" }, packing: { title: "packingName", description: "mapPackingDescription", icon: "assets/ui/packing.svg" }, market: { title: "mapStall", description: "mapStallDescription", icon: "assets/ui/market.svg" }
  };
  const warehouseResources = [
    { id: "logs", name: "Брёвна", icon: "assets/ui/02_brevno.png" }, { id: "planks", name: "Доски", icon: "assets/ui/03_doski.png" }, { id: "crates", name: "Ящики", icon: "assets/ui/04_yashchik.png" },
    { id: "water", name: "Вода", icon: "assets/ui/47_voda.png" }, { id: "grain", name: "Зерно", icon: "assets/ui/10_zerno.png" }, { id: "flour", name: "Мука", icon: "assets/ui/11_muka.png" },
    { id: "stone", name: "Камень", icon: "assets/ui/09_kamen.png" }, { id: "bricks", name: "Кирпичи", icon: "assets/ui/22_stroyka.png" }, { id: "tools", name: "Инструменты", icon: "assets/ui/20_laboratoriya.png" }
  ];
  function translate(key, values = {}) {
    const template = translations[currentLanguage][key] || translations.ru[key] || key;
    return template.replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
  }
  function applyLanguage(languageCode) {
    const normalizedCode = String(languageCode || "ru").toLowerCase().split(/[-_]/)[0]; currentLanguage = translations[normalizedCode] ? normalizedCode : "ru";
    document.documentElement.lang = currentLanguage; document.title = translate("pageTitle");
    document.querySelectorAll("[data-i18n]").forEach((element) => { element.textContent = translate(element.dataset.i18n); });
    document.querySelectorAll("[data-i18n-title]").forEach((element) => { element.title = translate(element.dataset.i18nTitle); });
    document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => { element.setAttribute("aria-label", translate(element.dataset.i18nAriaLabel)); });
    game.render();
  }
  function compact(value) {
    const numeric = Number(value); if (!Number.isFinite(numeric)) return "0";
    const sign = numeric < 0 ? "-" : ""; const absolute = Math.abs(numeric);
    if (absolute < 1000) return sign + new Intl.NumberFormat(currentLanguage === "en" ? "en-US" : "ru-RU", { maximumFractionDigits: Number.isInteger(absolute) ? 0 : 1 }).format(absolute);
    const tier = Math.floor(Math.log10(absolute) / 3); const scaled = absolute / Math.pow(1000, tier); let suffix = "";
    if (tier === 1) suffix = "k"; else if (tier === 2) suffix = "M"; else if (tier === 3) suffix = "B"; else if (tier === 4) suffix = "T";
    else { let index = tier - 5; while (index >= 0) { suffix = String.fromCharCode(65 + (index % 26)) + suffix; index = Math.floor(index / 26) - 1; } }
    const decimals = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
    return `${sign}${scaled.toFixed(decimals).replace(/\.0+$|(?<=\.[0-9])0+$/g, "")}${suffix}`;
  }
  function compactRate(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric === 0) return "0";
    if (Math.abs(numeric) < 1) return numeric.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    return compact(numeric);
  }
  function compactStock(value) {
    const numeric = Number(value);
    if (numeric > 0 && numeric < 1) return numeric.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    return compact(numeric);
  }
  function showNotice(message) { elements.notice.textContent = message; clearTimeout(game.noticeTimeout); game.noticeTimeout = setTimeout(() => { elements.notice.textContent = ""; }, 5000); }
  function xpForNextLevel() { const state = game.getState(); return 50 + (state.playerLevel - 1) * 35; }
  function addXp(amount) {
    const state = game.getState(); state.playerXp += amount;
    while (state.playerXp >= xpForNextLevel()) { state.playerXp -= xpForNextLevel(); state.playerLevel += 1; showNotice(`Новый уровень игрока · уровень ${state.playerLevel}`); }
  }
  function zoneUpgradeCost(key) { const state = game.getState(); const config = zoneConfig[key]; return config.baseCost + (state[config.level] - 1) * config.step; }
  function zoneCollectionState(key, state = game.getState()) {
    const cap = game.economy.warehouseCapacity();
    if (key === "river") return { ready: state.water < cap, reason: "Склад воды заполнен", resource: "вода", amount: Math.min(state.weeklyEvent === "drought" ? 2 : 3, cap - state.water) };
    if (key === "quarry") return { ready: state.stone < cap, reason: "Склад камня заполнен", resource: "камень", amount: Math.min(2, cap - state.stone) };
    if (key === "farm") return { ready: state.water >= 1 && state.grain < cap, reason: state.water < 1 ? "Нужна вода" : "Склад зерна заполнен", resource: "зерно", amount: Math.min(3 + state.farmLevel, cap - state.grain) };
    if (key === "tools") return { ready: state.planks >= 2 && state.stone >= 2 && state.tools < cap, reason: state.planks < 2 || state.stone < 2 ? "Нужно 2 доски и 2 камня" : "Склад инструментов заполнен", resource: "инструмент", amount: 1 };
    return null;
  }
  function renderMap() {
    const state = game.getState(); const selectedNode = mapInfo[game.selectedMapNode] ? game.selectedMapNode : "forest"; const info = mapInfo[selectedNode];
    document.querySelectorAll(".map-node").forEach((node) => { node.classList.toggle("is-selected", node.dataset.map === selectedNode); node.classList.toggle("is-locked", node.dataset.map === "market" && state.marketLevel < 1); });
    document.getElementById("mapDetailIcon").src = info.icon; document.getElementById("mapDetailTitle").textContent = translate(info.title);
    document.getElementById("mapDetailDescription").textContent = game.selectedMapNode === "market" && state.marketLevel > 0 ? translate("mapMarketUnlocked", { price: compact(game.economy.cratePrice()), level: state.marketLevel }) : translate(info.description);
    const action = document.getElementById("mapAction");
    if (game.selectedMapNode === "market") { const cost = game.economy.marketUpgradeCost(); action.textContent = state.marketLevel ? translate("mapUpgrade", { cost: compact(cost) }) : translate("mapOpen", { cost: compact(cost) }); action.disabled = state.cash < cost; }
    else { action.textContent = translate("mapSelect"); action.disabled = false; }
    document.getElementById("mapProgress").textContent = `${1 + (state.marketLevel > 0 ? 1 : 0)} / 4`;
    document.getElementById("mapMarketStatus").textContent = state.marketLevel ? translate("level", { level: state.marketLevel }) : translate("mapOpen", { cost: compact(game.economy.marketUpgradeCost()) });
  }
  function openLocation(key) { game.selectedMapNode = key; document.getElementById("millLocation").classList.add("is-open"); document.getElementById("millLocation").setAttribute("aria-hidden", "false"); game.locationControlsKey = null; renderLocation(); }
  function closeMillLocation() { document.getElementById("millLocation").classList.remove("is-open"); document.getElementById("millLocation").setAttribute("aria-hidden", "true"); }
  function renderLocation(options = {}) {
    const state = game.getState(); const key = game.selectedMapNode;
    const names = { forest: "Лесная делянка", mill: "Лесопилка", packing: "Мастерская упаковки", market: "Рыночная площадь", warehouse: "Центральный склад" };
    const icons = { forest: "assets/ui/forest.svg", mill: "assets/ui/sawmill.svg", packing: "assets/ui/packing.svg", market: "assets/ui/market.svg", warehouse: "assets/ui/14_sklad.png" };
    const descriptions = { forest: "Заготавливает брёвна для всей мастерской.", mill: "Превращай брёвна в крепкие доски.", packing: "Упаковывает доски в ящики.", market: "Отправляй готовые товары и развивай торговлю.", warehouse: "Здесь хранятся материалы и готовые товары долины." };
    const io = { forest: { input: "Время", output: "Брёвна", amount: state.logs, cap: game.economy.warehouseCapacity(), rate: game.economy.rateFor("forest"), inputAmount: 0, inputCap: 1, rateUnit: "брёвен / сек", machine: "Лес работает", hint: "Древесина поступает автоматически" }, mill: { input: "Брёвна", output: "Доски", amount: state.planks, cap: game.economy.warehouseCapacity(), rate: game.economy.rateFor("mill"), inputAmount: state.logs, inputCap: game.economy.warehouseCapacity(), rateUnit: "досок / сек", machine: state.logs > 0 ? "Пилит древесину" : "Ждёт брёвна", hint: "Станок работает автоматически, когда есть брёвна" }, packing: { input: "Доски", output: "Ящики", amount: state.crates, cap: game.economy.warehouseCapacity(), rate: game.economy.rateFor("packing"), inputAmount: state.planks, inputCap: game.economy.warehouseCapacity(), rateUnit: "ящиков / сек", machine: state.planks > 0 ? "Упаковывает товар" : "Ждёт доски", hint: "Упаковка автоматически использует доски" }, market: { input: "Ящики", output: "Монеты", amount: state.cash, cap: Math.max(100, state.cash), rate: game.economy.incomeRate(), inputAmount: state.crates, inputCap: game.economy.warehouseCapacity(), rateUnit: "монет / сек", machine: state.marketLevel ? "Рынок открыт" : "Рынок закрыт", hint: "Продажа выполняется вручную" } }[key];
    const capacity = game.economy.warehouseCapacity(); const maxStored = Math.max(...warehouseResources.map((item) => Number(state[item.id]) || 0));
    const warehouseInventory = document.getElementById("warehouseInventory"); warehouseInventory.hidden = key !== "warehouse";
    const warehouseOverview = document.getElementById("warehouseOverview"); warehouseOverview.hidden = key !== "warehouse";
    document.getElementById("millLocation").classList.toggle("is-warehouse", key === "warehouse");
    document.getElementById("millLocationTitle").textContent = names[key]; document.getElementById("locationBuildingIcon").src = icons[key]; document.querySelector(".location-hero h2").textContent = key === "mill" ? "Доски рождаются здесь" : key === "warehouse" ? "Все запасы долины в одном месте" : descriptions[key]; document.querySelector(".location-hero .location-copy > p:last-child").textContent = descriptions[key];
    document.querySelector(".location-subtitle").textContent = ({ forest: "Добыча древесины", mill: "Производство досок", packing: "Производство ящиков", market: "Ручная продажа товаров", warehouse: "Запасы и вместимость" })[key];
    document.getElementById("locationEyebrow").firstChild.textContent = `${names[key].toUpperCase()} · УРОВЕНЬ `;
    document.getElementById("locationMillLevel").textContent = compact(locationLevel(key, state));
    if (key === "warehouse") {
      const upgradeCost = game.economy.warehouseUpgradeCost();
      document.getElementById("warehouseLevelValue").textContent = compact(game.economy.warehouseLevel());
      document.getElementById("warehouseCapacityValue").textContent = compact(capacity);
      document.getElementById("warehousePeakValue").textContent = `${compactStock(maxStored)} / ${compact(capacity)}`;
      if (warehouseInventory.dataset.ready !== "true") {
        warehouseInventory.innerHTML = warehouseResources.map((item) => `<article class="warehouse-item" data-warehouse-item="${item.id}"><header><img src="${item.icon}" alt=""><strong>${item.name}</strong><span class="warehouse-count"></span></header><div class="warehouse-item-track"><span></span></div></article>`).join("");
        warehouseInventory.dataset.ready = "true";
      }
      for (const item of warehouseResources) {
        const card = warehouseInventory.querySelector(`[data-warehouse-item="${item.id}"]`); const amount = Number(state[item.id]) || 0;
        card.querySelector(".warehouse-count").textContent = `${compactStock(amount)} / ${compact(capacity)}`;
        card.querySelector(".warehouse-item-track span").style.width = `${Math.min(100, amount / capacity * 100)}%`;
        card.classList.toggle("is-full", amount >= capacity);
      }
    } else {
      document.getElementById("locationInputTitle").textContent = io.input; document.getElementById("locationOutputTitle").textContent = io.output; document.getElementById("millLocationLogs").textContent = compactStock(io.inputAmount); document.getElementById("millLocationPlanks").textContent = compactStock(io.amount); document.getElementById("millLocationRate").textContent = compactRate(io.rate); document.getElementById("locationRateLabel").textContent = "Производство:"; document.getElementById("locationRateUnit").textContent = io.rateUnit; document.getElementById("millMachineStatus").textContent = io.machine; document.getElementById("millMachineHint").textContent = io.hint; document.getElementById("millLogProgress").style.width = `${Math.min(100, io.inputAmount / io.inputCap * 100)}%`; document.getElementById("warehouseFill").style.width = `${Math.min(100, io.amount / io.cap * 100)}%`; document.getElementById("millLogHint").textContent = `${compactStock(io.inputAmount)} / ${compact(io.inputCap)} на складе`;
    }
    const primary = document.getElementById("locationPrimaryAction"); const secondary = document.getElementById("locationSecondaryAction");
    const tradePanel = document.getElementById("marketTrade");
    tradePanel.hidden = key !== "market";
    if (key === "market") {
      primary.hidden = true;
      secondary.hidden = false;
      secondary.textContent = state.marketLevel ? `Улучшить рынок · ${compact(game.economy.marketUpgradeCost())}` : `Открыть рынок · ${compact(game.economy.marketUpgradeCost())}`; secondary.disabled = false;
      const resourceSelect = document.getElementById("marketResource");
      if (!resourceSelect.options.length) {
        resourceSelect.innerHTML = game.economy.sellableResources.map((item) => `<option value="${item.id}">${item.name}</option>`).join("");
      }
      if (resourceSelect.value !== game.marketResource) resourceSelect.value = game.marketResource;
      const item = game.economy.sellableResources.find((entry) => entry.id === game.marketResource) || game.economy.sellableResources[0];
      const quantity = Math.floor(state[item.id]);
      const estimate = quantity * game.economy.salePrice(item.id) * (item.id === "crates" ? (game.economy.activeEvent()?.id === "market" ? 1.5 : 1) * (state.weeklyEvent === "fair" ? 1.35 : 1) * (state.weeklyEvent === "guild" && quantity >= 10 ? 1.25 : 1) * (game.economy.activeEvent()?.id === "merchant" && !state.eventMerchantUsed ? 1.5 : 1) : 1);
      document.getElementById("marketStock").textContent = compactStock(quantity);
      document.getElementById("marketResourceName").textContent = `${item.name.toLowerCase()} на складе`;
      document.getElementById("marketTradeEstimate").textContent = `${compact(estimate)} монет`;
      document.getElementById("marketSell").textContent = quantity > 0 ? `Продать всё · +${compact(estimate)}` : "Нет товара для продажи";
      document.getElementById("marketSell").disabled = state.marketLevel < 1 || quantity < 1;
    } else if (key === "warehouse") {
      primary.hidden = false; primary.textContent = `Улучшить склад · ${compact(game.economy.warehouseUpgradeCost())}`; primary.disabled = state.cash < game.economy.warehouseUpgradeCost();
      secondary.hidden = true;
    } else {
      primary.hidden = false;
      secondary.hidden = false;
      const cost = game.economy.upgradeCost(key);
      primary.textContent = `Улучшить · ${compact(cost)}`; primary.disabled = state.cash < cost;
      secondary.textContent = `${compactRate(io.rate)} / сек`; secondary.disabled = true;
    }
    document.getElementById("upgradeHint").textContent = key === "market" ? (state.marketLevel ? "Выбери товар, чтобы увидеть стоимость полного запаса." : `Открой рынок за ${compact(game.economy.marketUpgradeCost())} монет, чтобы продавать товары.`) : key === "warehouse" ? `Улучшение добавит 50 единиц к лимиту каждого ресурса. Постройки и производство продолжат работу.` : descriptions[key];
  }
  function renderEvent() {
    const state = game.getState(); const card = document.getElementById("eventCard"); const event = game.economy.activeEvent();
    if (!event) { card.hidden = true; return; }
    card.hidden = false; document.getElementById("eventIcon").textContent = event.icon; document.getElementById("eventTitle").textContent = event.title;
    document.getElementById("eventDescription").textContent = event.id === "order" ? `${event.description} Прогресс: ${compact(Math.min(12, state.eventOrderProgress))}/12.` : event.id === "merchant" ? `${event.description} Осталось: ${compact(Math.ceil((state.eventUntil - Date.now()) / 1000))} сек.` : event.description;
    document.getElementById("eventTimer").textContent = `${Math.max(0, Math.ceil((state.eventUntil - Date.now()) / 1000))} сек.`;
    const action = document.getElementById("eventAction"); action.hidden = !["order", "merchant"].includes(event.id);
  }
  function renderTutorial() {
    const state = game.getState(); const card = document.getElementById("tutorialCard"); const step = state.tutorialStep || 0;
    const steps = [["🪵", "Шаг 1 · Заготовь брёвна", "Зайди на лесную делянку и дождись первых 3 брёвен.", state.totalLogsProduced - state.tutorialStartLogs, 3], ["🪚", "Шаг 2 · Улучши лес", "Улучши лесную делянку на один уровень.", state.forest - state.tutorialStartForest, 1], ["🪵", "Шаг 3 · Сделай доски", "Дождись, пока лесопилка изготовит 5 досок.", state.totalPlanksProduced - state.tutorialStartPlanks, 5], ["📦", "Шаг 4 · Открой рынок", "Продай первую партию ящиков на рынке.", state.shipped - state.tutorialStartShipped, 1], ["🌟", "Готово · Долина развивается", "Обучение завершено. Теперь выполняй заказы и открывай новые зоны.", 1, 1]];
    card.hidden = step >= 5; if (card.hidden) return;
    const current = steps[step]; document.getElementById("tutorialIcon").textContent = current[0]; document.getElementById("tutorialTitle").textContent = current[1]; document.getElementById("tutorialDescription").textContent = current[2]; document.getElementById("tutorialCount").textContent = `${Math.min(Number(current[3]), current[4])} / ${current[4]}`;
    const action = document.getElementById("tutorialClaim"); const restart = document.getElementById("tutorialRestart"); action.hidden = step !== 4; restart.hidden = step === 0 || step === 4;
    document.querySelectorAll(".field-object").forEach((item) => item.classList.toggle("is-tutorial-target", item.dataset.field === ["forest", "forest", "mill", "market"][step]));
  }
  function showLogPop(count = 1) {
    const layer = document.getElementById("locationFx"); if (!layer || !document.getElementById("millLocation").classList.contains("is-open")) return;
    for (let i = 0; i < Math.min(count, 5); i += 1) { const log = document.createElement("img"); log.src = "assets/ui/02_brevno.png"; log.alt = ""; log.className = "fx-log"; log.style.left = `${35 + Math.random() * 35}%`; log.style.animationDelay = `${i * 90}ms`; layer.append(log); setTimeout(() => log.remove(), 1400); }
  }
  function showCoinFloat(amount) {
    if (!(amount > 0)) return;
    const target = document.getElementById("fieldCash") || elements.cash;
    const bounds = target?.getBoundingClientRect?.();
    const floater = document.createElement("div"); floater.className = "coin-floater"; floater.textContent = `+${compact(amount)} 🪙`;
    floater.style.left = bounds ? `${bounds.left + bounds.width / 2}px` : "80%";
    floater.style.top = bounds ? `${bounds.top}px` : "92px";
    document.body.append(floater); setTimeout(() => floater.remove(), 1500);
  }
  function pulse(target) {
    if (!target) return;
    target.classList.remove("is-changing"); void target.offsetWidth; target.classList.add("is-changing");
    setTimeout(() => target.classList.remove("is-changing"), 650);
  }
  function playUpgradeFx() {
    pulse(document.querySelector(".location-hero") || document.querySelector(`.field-object[data-field="${game.selectedMapNode}"]`));
    const target = document.querySelector(`.field-object[data-field="${game.selectedMapNode}"]`); if (target) pulse(target);
  }
  function playCartDelivery() {
    const cart = document.getElementById("marketCart"); if (!cart) return;
    cart.classList.remove("is-moving"); void cart.offsetWidth; cart.classList.add("is-moving"); setTimeout(() => cart.classList.remove("is-moving"), 2200);
  }
  function showResourceGain(id, amount) {
    if (!(amount > 0)) return;
    const node = document.getElementById(id); if (!node) return;
    pulse(node.closest(".field-resource") || node);
    const bounds = node.getBoundingClientRect?.(); const floater = document.createElement("div"); floater.className = "resource-floater";
    floater.textContent = `+${compact(amount)}`; floater.style.left = bounds ? `${bounds.left + bounds.width / 2}px` : "50%"; floater.style.top = bounds ? `${bounds.top}px` : "45%";
    document.body.append(floater); setTimeout(() => floater.remove(), 1100);
  }
  function renderUtilities() {
    const state = game.getState();
    document.getElementById("restoreLocalSave").hidden = !game.yandex.hasLocalBackup();
    document.getElementById("profilePlayerLevel").textContent = compact(state.playerLevel); document.getElementById("profileLifetime").textContent = compact(state.lifetime); document.getElementById("profileLevels").textContent = compact(state.forest + state.mill + state.packing + state.watermill + state.stonework + state.farmLevel + state.toolshopLevel + game.economy.warehouseLevel()); document.getElementById("profileShipped").textContent = compact(state.shipped);
    const xpRequired = xpForNextLevel(); const xpProgress = Math.min(100, state.playerXp / xpRequired * 100);
    document.getElementById("profileXpText").textContent = `${compact(state.playerXp)} / ${compact(xpRequired)}`;
    const xpProgressBar = document.getElementById("profileXpProgress");
    xpProgressBar.setAttribute("aria-valuemax", xpRequired); xpProgressBar.setAttribute("aria-valuenow", Math.min(state.playerXp, xpRequired));
    document.getElementById("profileXpFill").style.width = `${xpProgress}%`;
    const achievements = [{ title: "Первая партия", description: "Отправь 10 ящиков", progress: state.shipped, goal: 10, icon: "assets/ui/achievements.svg" }, { title: "Большая мастерская", description: "Достигни 5 уровня лесопилки", progress: state.mill, goal: 5, icon: "assets/ui/sawmill.svg" }, { title: "Торговец долины", description: "Заработай 1 000 монет", progress: state.lifetime, goal: 1000, icon: "assets/ui/market.svg" }, { title: "Новые берега", description: "Достигни 3 уровня игрока", progress: state.playerLevel, goal: 3, icon: "assets/ui/collection.svg" }];
    document.getElementById("achievementList").innerHTML = achievements.map((a) => `<article class="achievement-item ${a.progress >= a.goal ? "is-complete" : ""}"><img src="${a.icon}" alt=""><div><strong>${a.title}</strong><span>${a.description}</span><div class="collection-progress"><span style="width:${Math.min(100, a.progress / a.goal * 100)}%"></span></div></div><small>${compact(Math.min(a.progress, a.goal))}/${a.goal}</small></article>`).join("");
    const items = [
      { icon: "assets/ui/collection.svg", title: "Дух леса", rarity: "Редкий", found: state.rareForestSpirit, progress: state.shipped, goal: 1, source: "Отправьте первую партию ящиков", bonus: "Увеличивает производство на 5%" },
      { icon: "assets/ui/20_laboratoriya.png", title: "Золотой инструмент", rarity: "Эпический", found: state.rareGoldenTool, progress: state.tools, goal: 1, source: "Создайте инструмент", bonus: "Увеличивает цену продажи на 5%" },
      { icon: "assets/ui/15_ferma.png", title: "Семена лунного мака", rarity: "Редкий", found: state.rareSeed, progress: state.grain, goal: 25, source: "Соберите 25 единиц зерна", bonus: "Увеличивает вместимость склада" },
      { icon: "assets/ui/09_kamen.png", title: "Сердце горы", rarity: "Эпический", found: state.rareMineral, progress: state.bricks, goal: 20, source: "Произведите 20 кирпичей", bonus: "Ускоряет каменную мастерскую" },
      { icon: "assets/ui/75_sunduk.png", title: "Знак хранителя", rarity: "Редкое украшение", found: state.rareDecoration, progress: state.shipped, goal: 100, source: "Отправьте сто ящиков на рынок", bonus: "Увеличивает запас офлайн-дохода" }
    ];
    document.getElementById("collectionGrid").innerHTML = items.map((item) => { const progress = Math.min(Number(item.progress || 0), item.goal); return `<article class="collection-item ${item.found ? "is-found" : ""}"><img src="${item.icon}" alt=""><div><strong>${item.title} ${item.found ? "✓" : ""}</strong><span class="collection-rarity">${item.rarity}</span><small>${item.found ? `Получен · ${item.bonus}` : `${item.source} · ${compact(progress)}/${item.goal}`}</small><div class="collection-progress"><span style="width:${Math.min(100, progress / item.goal * 100)}%"></span></div></div></article>`; }).join("");
  }
  function render(options = {}) {
    const state = game.getState(); const economy = game.economy; const rates = { forest: economy.rateFor("forest"), mill: economy.rateFor("mill"), packing: economy.rateFor("packing") };
    elements.cash.textContent = `${compact(state.cash)} ${translate("coins")}`; elements.income.textContent = translate("incomePerSecond", { amount: compact(economy.incomeRate()) }); elements.lifetime.textContent = compact(state.lifetime);
    elements.logs.textContent = compact(state.logs); elements.planks.textContent = compact(state.planks); elements.crates.textContent = compact(state.crates);
    ["marketPrice", "shipped"].forEach((id) => { const node = document.getElementById(id); if (node) node.textContent = id === "marketPrice" ? `${compact(economy.cratePrice())} ${translate("coinsPerCrate")}` : compact(state.shipped); });
    const rewardedVideoAvailable = typeof game.ysdk?.adv?.showRewardedVideo === "function"; const boosterActive = state.boosterUntil > Date.now();
    const boosterButton = document.getElementById("rewardBooster"); const coinRewardButton = document.getElementById("rewardCoins");
    boosterButton.disabled = !rewardedVideoAvailable || game.rewardedAdInProgress || boosterActive; coinRewardButton.disabled = !rewardedVideoAvailable || game.rewardedAdInProgress;
    boosterButton.textContent = boosterActive ? `×2 · ещё ${compact(Math.ceil((state.boosterUntil - Date.now()) / 1000))} сек.` : "▶ ×2 производство · 60 сек.";
    document.getElementById("rewardStatus").textContent = boosterActive ? `Ускорение активно · ${compact(Math.ceil((state.boosterUntil - Date.now()) / 1000))} сек.` : "Бонусы за просмотр видео";
    const fieldValues = { fieldCash: state.cash, fieldLogs: state.logs, fieldPlanks: state.planks, fieldCrates: state.crates, fieldIncome: economy.incomeRate(), fieldWater: state.water, fieldFlour: state.flour, fieldGrain: state.grain, fieldStone: state.stone, fieldBricks: state.bricks, fieldTools: state.tools };
    Object.entries(fieldValues).forEach(([id, value]) => { const node = document.getElementById(id); if (node) node.textContent = id === "fieldIncome" ? `${compactRate(value)}/сек` : compactStock(value); });
    document.getElementById("fieldWaterResource")?.toggleAttribute("hidden", state.playerLevel < 3); document.getElementById("fieldFlourResource")?.toggleAttribute("hidden", state.playerLevel < 3); document.getElementById("fieldGrainResource")?.toggleAttribute("hidden", state.playerLevel < 4); document.getElementById("fieldStoneResource")?.toggleAttribute("hidden", state.playerLevel < 6); document.getElementById("fieldBricksResource")?.toggleAttribute("hidden", state.playerLevel < 6); document.getElementById("fieldToolsResource")?.toggleAttribute("hidden", state.playerLevel < 7);
    const currentAmounts = { fieldLogs: state.logs, fieldPlanks: state.planks, fieldCrates: state.crates };
    if (game.hasRenderedOnce) {
      for (const [id, value] of Object.entries(currentAmounts)) {
        const before = Math.floor(game.previousAmounts[id] || 0); const after = Math.floor(value);
        if (after > before) showResourceGain(id, after - before);
      }
      const cashGain = state.cash - game.previousCash;
      if (cashGain >= 1) showCoinFloat(cashGain);
    }
    game.previousAmounts = Object.fromEntries(Object.entries(currentAmounts).map(([id, value]) => [id, value]));
    game.previousCash = state.cash; game.hasRenderedOnce = true;
    const locations = [{ resource: "farm", level: "farmLevel", unlock: 4, status: "Поле готово к посеву" }, { resource: "river", level: "watermill", unlock: 3, status: "Пристань снабжает мастерскую" }, { resource: "quarry", level: "stonework", unlock: 6, status: "Добыча камня доступна" }, { resource: "tools", level: "toolshopLevel", unlock: 7, status: "Инструментальная мастерская" }];
    for (const location of locations) {
      const { resource, level, unlock } = location; const open = state.playerLevel >= unlock; const field = document.querySelector(`.field-object[data-field="${resource}"]`); const collection = zoneCollectionState(resource, state); const fieldId = `field${resource[0].toUpperCase()}${resource.slice(1)}`;
      if (field) { field.classList.toggle("is-locked", !open); field.disabled = !open; field.classList.toggle("is-collectible", open && collection.ready); }
      const levelNode = document.getElementById(`${fieldId}Level`); if (levelNode) levelNode.textContent = open ? compact(locationLevel(resource, state)) : "🔒";
      const statusNode = document.getElementById(`${fieldId}Status`); if (statusNode) statusNode.textContent = !open ? `Уровень ${unlock}` : collection.ready ? `+${compact(collection.amount)} ${collection.resource}` : collection.reason;
      const upgradeButton = document.querySelector(`[data-upgrade-zone="${resource}"]`); const cost = zoneUpgradeCost(resource); const blockedByMarket = !state.marketLevel && state.cash >= cost && state.cash - cost < game.economy.marketUpgradeCost();
      if (upgradeButton) { upgradeButton.hidden = !open; upgradeButton.disabled = state.cash < cost || blockedByMarket; upgradeButton.title = blockedByMarket ? `Сначала открой рынок · ${compact(game.economy.marketUpgradeCost())}` : `Улучшить · ${compact(cost)} монет`; upgradeButton.setAttribute("aria-label", `${upgradeButton.title}: ${zoneConfig[resource].name}`); }
    }
    document.getElementById("mapForestLevel").textContent = translate("level", { level: state.forest }); document.getElementById("mapMillLevel").textContent = translate("level", { level: state.mill }); document.getElementById("mapPackingLevel").textContent = translate("level", { level: state.packing });
    document.getElementById("fieldMarketLevel").textContent = state.marketLevel ? compact(state.marketLevel) : "🔒"; document.getElementById("fieldMarketStatus").textContent = state.marketLevel ? "Открыт" : "Закрыт";
    document.getElementById("fieldWarehouseLevel").textContent = compact(economy.warehouseLevel()); document.getElementById("fieldWarehouseStatus").textContent = "Открыть";
    const capacity = economy.warehouseCapacity();
    const fieldNext = document.getElementById("fieldNextProduction"); const next = state.crates >= capacity ? "Ящики готовы к отправке · открой рынок." : state.planks >= capacity ? "Производство досок ждёт свободного места." : state.logs >= capacity ? "Лес ждёт свободного места для новых брёвен." : state.logs < 1 ? `Следующие брёвна через ${compact(1 / rates.forest)} сек.` : state.planks < 1 ? `Следующая доска через ${compact(1 / rates.mill)} сек.` : `Следующий ящик через ${compact(1 / rates.packing)} сек.`; fieldNext.textContent = next;
    const now = Date.now();
    if (!options.light || now - lastPanelRenderAt >= 1000) {
      renderMap();
      if (document.getElementById("millLocation").classList.contains("is-open")) renderLocation();
      renderTutorial(); renderEvent(); game.orders.renderOrder(); game.retention.updateRetention();
      if (document.querySelector(".utility-panel.is-open")) renderUtilities();
      lastPanelRenderAt = now;
    }
    const logCount = Math.floor(state.logs); if (logCount > game.previousLogCount) showLogPop(Math.min(4, logCount - game.previousLogCount)); game.previousLogCount = logCount;
    document.querySelectorAll(".field-object[data-field]").forEach((item) => {
      const key = item.dataset.field;
      const running = key === "forest" || (key === "mill" && state.logs >= 1) || (key === "packing" && state.planks >= 1);
      item.classList.toggle("is-working", running && !item.classList.contains("is-locked"));
    });
    document.getElementById("millLocation")?.classList.toggle("is-mill-running", game.selectedMapNode === "mill" && state.logs >= 1);
  }
  game.ui = { translate, applyLanguage, compact, showNotice, xpForNextLevel, addXp, zoneConfig, zoneCollectionState, zoneUpgradeCost, renderMap, openLocation, closeMillLocation, renderLocation, renderEvent, renderTutorial, showLogPop, showCoinFloat, playUpgradeFx, playCartDelivery, renderUtilities };
  game.translate = translate; game.compact = compact; game.showNotice = showNotice; game.xpForNextLevel = xpForNextLevel; game.addXp = addXp; game.zoneConfig = zoneConfig; game.zoneUpgradeCost = zoneUpgradeCost; game.openLocation = openLocation; game.closeMillLocation = closeMillLocation; game.renderLocation = renderLocation; game.showCoinFloat = showCoinFloat; game.playCartDelivery = playCartDelivery; game.renderUtilities = renderUtilities; game.applyLanguage = applyLanguage; game.render = render;
})(window.ForestGame = window.ForestGame || {});
