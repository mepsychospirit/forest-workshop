(function (game) {
  const weeklyEvents = [
    { id: "festival", icon: "🎪", title: "Лесной фестиваль", description: "Производство всей долины ускорено на 25%.", goal: 40, goalText: "произвести ящиков", reward: 350, xp: 80 },
    { id: "stone", icon: "🪨", title: "Каменный сезон", description: "Кирпичная мастерская производит на 50% больше.", goal: 30, goalText: "получить кирпичей", reward: 420, xp: 95 },
    { id: "fair", icon: "🏪", title: "Большая ярмарка", description: "Рынок платит на 35% больше за каждый ящик.", goal: 500, goalText: "заработать монет на продаже", reward: 500, xp: 110 },
    { id: "drought", icon: "☀️", title: "Засуха", description: "Пристань даёт на 1 единицу воды меньше, заказ на муку приносит на 50% больше монет.", goal: 25, goalText: "произвести муки", reward: 300, xp: 75 },
    { id: "guild", icon: "🧳", title: "Торговая гильдия", description: "За партии от 10 ящиков гильдия платит на 25% больше.", goal: 35, goalText: "отправить ящиков", reward: 600, xp: 130 }
  ];
  function weeklyEventForKey(key) {
    let hash = 2166136261;
    for (const char of key) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
    return weeklyEvents[(hash >>> 0) % weeklyEvents.length];
  }
  function activeWeeklyEvent() { const state = game.getState(); return weeklyEvents.find((event) => event.id === state.weeklyEvent) || weeklyEvents[0]; }
  function dayKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
  function dayNumber(key) {
    const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(key || "");
    if (!match) return NaN;
    return Math.floor(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 86400000);
  }
  function weekId(date = new Date()) {
    const thursday = new Date(date); thursday.setHours(0, 0, 0, 0); thursday.setDate(thursday.getDate() + 4 - (thursday.getDay() || 7));
    const yearStart = new Date(thursday.getFullYear(), 0, 1); const week = Math.ceil((((thursday - yearStart) / 86400000) + 1) / 7);
    return `${thursday.getFullYear()}-${week}`;
  }
  function weekEndsAt(date = new Date()) {
    const end = new Date(date); const daysUntilMonday = (8 - end.getDay()) % 7 || 7;
    end.setDate(end.getDate() + daysUntilMonday); end.setHours(0, 0, 0, 0); return end;
  }
  function updateRetention() {
    const state = game.getState(); const today = dayKey(); let changed = false;
    if (state.dailyKey !== today) { state.dailyKey = today; state.dailyProgress = 0; state.dailyClaimed = 0; changed = true; }
    if (state.lastVisitKey !== today) {
      const daysBetween = state.lastVisitKey ? dayNumber(today) - dayNumber(state.lastVisitKey) : 0;
      state.streak = !state.lastVisitKey ? 1 : daysBetween === 1 ? Math.min(7, state.streak + 1) : 1;
      state.lastVisitKey = today; state.streakClaimed = 0; changed = true;
    }
    const thisWeek = weekId();
    if (state.weeklyKey !== thisWeek) { state.weeklyKey = thisWeek; state.weeklyEvent = weeklyEventForKey(thisWeek).id; state.weeklyProgress = 0; state.weeklyClaimed = 0; changed = true; }
    const dailyGoal = Math.min(25, 5 + (state.playerLevel - 1) * 2);
    document.getElementById("dailyQuestText").textContent = `Отправь ${dailyGoal} ящиков: ${Math.min(state.dailyProgress, dailyGoal)}/${dailyGoal}. Награда: 80 монет и 20 опыта.`;
    document.getElementById("dailyQuestClaim").disabled = state.dailyClaimed || state.dailyProgress < dailyGoal;
    document.getElementById("streakText").textContent = `День ${state.streak}/7. Бонус за вход: ${state.streak * 15} монет.`;
    document.getElementById("streakClaim").disabled = state.streakClaimed;
    const weeklyText = document.getElementById("weeklyText"); if (weeklyText) weeklyText.textContent = activeWeeklyEvent().description;
    const weekly = activeWeeklyEvent(); const weeklyAmount = state.weeklyProgress;
    document.getElementById("weeklyEventIcon").textContent = weekly.icon;
    document.getElementById("weeklyEventTitle").textContent = weekly.title;
    document.getElementById("weeklyEventDescription").textContent = `${weekly.description} Цель: ${game.compact(Math.min(weeklyAmount, weekly.goal))}/${weekly.goal} ${weekly.goalText}.`;
    const remainingMs = Math.max(0, weekEndsAt().getTime() - Date.now());
    const remainingDays = Math.floor(remainingMs / 86400000); const remainingHours = Math.floor((remainingMs % 86400000) / 3600000); const remainingMinutes = Math.floor((remainingMs % 3600000) / 60000);
    const timeLeft = remainingDays ? `${remainingDays} д ${remainingHours} ч` : remainingHours ? `${remainingHours} ч ${remainingMinutes} м` : `${remainingMinutes} м`;
    document.getElementById("weeklyEventMeta").textContent = state.weeklyClaimed ? "Награда получена" : `${timeLeft} · +${weekly.reward} мон. / +${weekly.xp} опыта`;
    const weeklyClaim = document.getElementById("weeklyClaim"); weeklyClaim.disabled = state.weeklyClaimed || weeklyAmount < weekly.goal;
    weeklyClaim.textContent = state.weeklyClaimed ? "Получено" : "Забрать";
    document.getElementById("prestigeAction").disabled = state.playerLevel < 10 || state.marketLevel < 1;
    document.getElementById("prestigeText").textContent = state.prestige ? `Престиж ${state.prestige} · скорость +${state.prestigeSpeed * 5}%, цена +${state.prestigeValue * 5}%, вместимость +${state.prestigeStorage * 50}.` : "Доступен после 10 уровня игрока и открытия рынка.";
    document.querySelectorAll("[data-prestige]").forEach((button) => button.classList.toggle("is-selected", button.dataset.prestige === state.prestigeChoice));
    if (game.selectedZone) game.renderZoneDetails();
    if (changed) game.save();
  }
  game.retention = { weeklyEvents, weeklyEventForKey, activeWeeklyEvent, dayKey, dayNumber, weekId, weekEndsAt, updateRetention };
})(window.ForestGame = window.ForestGame || {});
