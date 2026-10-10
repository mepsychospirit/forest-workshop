(function (game) {
  const marketOrders = [
    { title: "Заказ лесного кафе", resource: "crates", requirement: 8, reward: 55, xp: 18, unlock: 1 },
    { title: "Пекарня у реки", resource: "flour", requirement: 12, reward: 105, xp: 30, unlock: 3 },
    { title: "Строительство моста", resource: "bricks", requirement: 18, reward: 180, xp: 48, unlock: 6 },
    { title: "Поставки пекарям", resource: "grain", requirement: 15, reward: 90, xp: 28, unlock: 4 },
    { title: "Оснащение мастерской", resource: "tools", requirement: 5, reward: 210, xp: 55, unlock: 7 }
  ];
  function currentOrder() { const state = game.getState(); return marketOrders[state.selectedOrder % marketOrders.length]; }
  function orderReward(order = currentOrder()) { const state = game.getState(); return Math.round(order.reward * (state.weeklyEvent === "drought" && order.resource === "flour" ? 1.5 : 1)); }
  function orderAmount(order = currentOrder()) { const state = game.getState(); return order.resource === "crates" ? state.orderProgress0 : state[order.resource]; }
  function renderOrder() {
    const state = game.getState(); const order = currentOrder(); const amount = orderAmount(order);
    const complete = amount >= order.requirement; const orderLocked = state.playerLevel < order.unlock;
    document.getElementById("orderTitle").textContent = order.title;
    const resourceLabel = { crates: "ящиков", flour: "муки", bricks: "кирпичей", grain: "зерна", tools: "инструментов" }[order.resource];
    document.getElementById("orderDescription").textContent = orderLocked ? `Откроется на уровне ${order.unlock}. Награда: ${orderReward(order)} монет и ${order.xp} опыта.` : `Нужно ${order.requirement} ${resourceLabel}. Награда: ${orderReward(order)} монет и ${order.xp} опыта. Уровень ${state.playerLevel} · ${state.playerXp}/${game.xpForNextLevel()} опыта.`;
    document.getElementById("orderProgress").textContent = `${game.compact(Math.min(amount, order.requirement))} / ${order.requirement}`;
    const button = document.getElementById("orderClaim");
    button.disabled = !complete || orderLocked;
    button.textContent = orderLocked ? `Откроется · ур. ${order.unlock}` : complete ? `Забрать · +${orderReward(order)}` : "Заказ в работе";
    const options = document.getElementById("orderOptions");
    if (options.dataset.ready !== "true") {
      options.innerHTML = marketOrders.map((item, index) => `<button class="order-option" type="button" data-order-index="${index}"></button>`).join("");
      options.dataset.ready = "true";
      options.addEventListener("click", (event) => {
        const option = event.target.closest("[data-order-index]"); if (!option) return;
        game.getState().selectedOrder = Number(option.dataset.orderIndex); game.render(); game.save();
      });
    }
    options.querySelectorAll(".order-option").forEach((option) => {
      const item = marketOrders[Number(option.dataset.orderIndex)]; const locked = state.playerLevel < item.unlock;
      const itemResource = { crates: "ящиков", flour: "муки", bricks: "кирпичей", grain: "зерна", tools: "инструментов" }[item.resource];
      option.disabled = locked;
      option.textContent = locked ? `🔒 ур. ${item.unlock} · ${item.title}` : `${item.title} · ${item.requirement} ${{ crates: "ящ.", flour: "муки", bricks: "кирп.", grain: "зерна", tools: "инстр." }[item.resource]} · ${orderReward(item)} мон.`;
      option.setAttribute("aria-label", locked ? `${item.title}, доступно с уровня ${item.unlock}` : `${item.title}: ${item.requirement} ${itemResource}, награда ${orderReward(item)} монет`);
      option.classList.toggle("is-selected", Number(option.dataset.orderIndex) === state.selectedOrder);
    });
  }
  game.orders = { marketOrders, currentOrder, orderReward, orderAmount, renderOrder };
})(window.ForestGame = window.ForestGame || {});
