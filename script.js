"use strict";

const STORAGE_KEY = "meowCafeTycoonSaveV1";
const SAVE_VERSION = 1;
const DEBUG_MODE = false;
const MAX_TABLES = 8;
const MAX_READY_DRINKS = 3;
const AUTO_SAVE_MS = 30000;
const INPUT_LOCK_MS = 280;

const GAME_DATA = {
  cats: {
    cheese: {
      id: "cheese",
      name: "치즈냥",
      emoji: "🐱",
      price: 0,
      effect: "손님 만족도 +5%",
      satisfactionBonus: 0.05
    },
    black: {
      id: "black",
      name: "검은냥",
      emoji: "🐈‍⬛",
      price: 820,
      effect: "팁 획득 확률 +18%",
      tipChanceBonus: 0.18
    },
    siamese: {
      id: "siamese",
      name: "샴냥",
      emoji: "🐈",
      price: 980,
      effect: "음료 판매 금액 +12%",
      revenueBonus: 0.12
    },
    chubby: {
      id: "chubby",
      name: "뚱냥",
      emoji: "😺",
      price: 1180,
      effect: "손님 방문 속도 +14%",
      visitSpeedMultiplier: 0.86
    }
  },
  furniture: {
    plantShelf: {
      id: "plantShelf",
      name: "햇살 화분",
      emoji: "🪴",
      price: 280,
      effect: "판매 금액 +3%",
      revenueBonus: 0.03,
      x: 83,
      y: 31
    },
    softSofa: {
      id: "softSofa",
      name: "포근 쿠션 소파",
      emoji: "🛋️",
      price: 460,
      effect: "손님 만족도 +4%",
      satisfactionBonus: 0.04,
      x: 80,
      y: 59
    },
    latteLamp: {
      id: "latteLamp",
      name: "라떼 조명",
      emoji: "🏮",
      price: 640,
      effect: "팁 확률 +6%",
      tipChanceBonus: 0.06,
      x: 50,
      y: 24
    }
  },
  equipment: {
    basicMachine: {
      id: "basicMachine",
      name: "기본 커피 머신",
      emoji: "☕",
      price: 0,
      effect: "기본 음료 제작"
    },
    beanGrinder: {
      id: "beanGrinder",
      name: "원두 그라인더",
      emoji: "⚙️",
      price: 660,
      effect: "음료 제작 시간 -10%",
      brewMultiplier: 0.9
    },
    milkSteamer: {
      id: "milkSteamer",
      name: "밀크 스티머",
      emoji: "🥛",
      price: 920,
      effect: "판매 금액 +8%",
      revenueBonus: 0.08
    },
    goldTamper: {
      id: "goldTamper",
      name: "골드 탬퍼",
      emoji: "🏅",
      price: 1260,
      effect: "팁 확률 +10%",
      tipChanceBonus: 0.1
    }
  },
  customerEmojis: ["🙂", "😊", "😌", "🤎", "🧑", "👩", "👨"],
  orders: ["카페라떼", "아메리카노", "바닐라 라떼", "카푸치노"]
};

const DEFAULT_STATE = {
  coins: 500,
  level: 1,
  xp: 0,
  totalSales: 0,
  ownedCats: ["cheese"],
  ownedFurniture: [],
  ownedEquipment: ["basicMachine"],
  upgrades: {
    tables: 2,
    coffeeMachine: 1,
    interior: 1,
    visitSpeed: 1
  }
};

const runtime = {
  customers: [],
  customerId: 0,
  readyDrinks: 0,
  isBrewing: false,
  brewStart: 0,
  brewEnd: 0,
  nextCustomerAt: 0,
  nextEventAt: 0,
  influencerUntil: 0,
  luckyNextCustomer: false,
  cupEventEndsAt: 0,
  catActors: {},
  rafId: 0,
  saveIntervalId: 0,
  eventBannerTimeoutId: 0,
  activeShopTab: "cats",
  lastHudSecond: -1,
  actionLocks: {},
  started: false,
  eventsBound: false
};

let state = loadGame();
let els = {};

document.addEventListener("DOMContentLoaded", initGame);

function initGame() {
  if (runtime.started) return;
  cacheElements();
  if (!hasRequiredElements()) {
    console.warn("Meow Cafe Tycoon could not start because required DOM elements are missing.");
    return;
  }
  bindEvents();
  normalizeState();
  initializeCats();
  renderAll();
  const now = performance.now();
  runtime.nextCustomerAt = now + 900;
  runtime.nextEventAt = now + randomBetween(18000, 26000);
  runtime.saveIntervalId = window.setInterval(saveGame, AUTO_SAVE_MS);
  window.addEventListener("beforeunload", saveGame);
  runtime.rafId = requestAnimationFrame(gameLoop);
  runtime.started = true;
  exposeDebugTools();
  showToast("카페 오픈! 손님이 곧 찾아옵니다.");
}

function cacheElements() {
  els = {
    coinCount: document.getElementById("coinCount"),
    levelLabel: document.getElementById("levelLabel"),
    xpLabel: document.getElementById("xpLabel"),
    xpFill: document.getElementById("xpFill"),
    eventBanner: document.getElementById("eventBanner"),
    cafeStage: document.getElementById("cafeStage"),
    furnitureLayer: document.getElementById("furnitureLayer"),
    tableLayer: document.getElementById("tableLayer"),
    customerLayer: document.getElementById("customerLayer"),
    catLayer: document.getElementById("catLayer"),
    floatingLayer: document.getElementById("floatingLayer"),
    coffeeMachine: document.getElementById("coffeeMachine"),
    machineStatus: document.getElementById("machineStatus"),
    machineProgressFill: document.getElementById("machineProgressFill"),
    cupEventButton: document.getElementById("cupEventButton"),
    tableSummary: document.getElementById("tableSummary"),
    drinkSummary: document.getElementById("drinkSummary"),
    customerSummary: document.getElementById("customerSummary"),
    salesSummary: document.getElementById("salesSummary"),
    quickSaveButton: document.getElementById("quickSaveButton"),
    openShopButton: document.getElementById("openShopButton"),
    openCatsButton: document.getElementById("openCatsButton"),
    sideUpgradeList: document.getElementById("sideUpgradeList"),
    mobileUpgradeList: document.getElementById("mobileUpgradeList"),
    shopModal: document.getElementById("shopModal"),
    catsModal: document.getElementById("catsModal"),
    upgradeModal: document.getElementById("upgradeModal"),
    settingsModal: document.getElementById("settingsModal"),
    shopItems: document.getElementById("shopItems"),
    catCollection: document.getElementById("catCollection"),
    settingsButton: document.getElementById("settingsButton"),
    manualSaveButton: document.getElementById("manualSaveButton"),
    resetGameButton: document.getElementById("resetGameButton"),
    levelUpToast: document.getElementById("levelUpToast"),
    toastRoot: document.getElementById("toastRoot")
  };
}

function bindEvents() {
  if (runtime.eventsBound) return;
  bindPointer(els.coffeeMachine, handleMachineClick);
  bindPointer(els.customerLayer, handleCustomerClick);
  bindPointer(els.catLayer, handleCatClick);
  bindPointer(els.cupEventButton, collectCupEvent);
  bindPointer(els.openShopButton, () => openShop("cats"));
  bindPointer(els.openCatsButton, openCatsModal);
  bindPointer(els.quickSaveButton, () => {
    saveGame();
    showToast("게임을 저장했습니다.");
  });
  bindPointer(els.settingsButton, () => openModal("settingsModal"));
  bindPointer(els.manualSaveButton, () => {
    saveGame();
    showToast("게임을 저장했습니다.");
  });
  bindPointer(els.resetGameButton, resetGame);

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    bindPointer(button, () => closeModal(button.dataset.closeModal));
  });

  document.querySelectorAll("[data-nav-action]").forEach((button) => {
    bindPointer(button, () => handleBottomNav(button.dataset.navAction));
  });

  document.querySelectorAll("[data-shop-tab]").forEach((button) => {
    bindPointer(button, () => openShop(button.dataset.shopTab));
  });

  bindPointer(els.shopItems, (event) => {
    const button = event.target.closest("[data-buy-id]");
    if (!button) return;
    buyShopItem(button.dataset.buyType, button.dataset.buyId);
  });

  bindPointer(els.sideUpgradeList, handleUpgradeClick);
  bindPointer(els.mobileUpgradeList, handleUpgradeClick);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAllModals();
    }
  });
  runtime.eventsBound = true;
}

function hasRequiredElements() {
  return Object.values(els).every(Boolean);
}

function bindPointer(element, handler) {
  if (!element || typeof element.addEventListener !== "function") return;
  element.addEventListener("pointerup", handler);
}

function isActionLocked(key, duration = INPUT_LOCK_MS) {
  const now = performance.now();
  if (runtime.actionLocks[key] && now - runtime.actionLocks[key] < duration) {
    return true;
  }
  runtime.actionLocks[key] = now;
  return false;
}

function loadGame() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return cloneDefaultState();
    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object") return cloneDefaultState();
    return {
      ...cloneDefaultState(),
      ...parsed,
      saveVersion: parsed.saveVersion || SAVE_VERSION,
      ownedCats: sanitizeOwnedIds(parsed.ownedCats, GAME_DATA.cats, ["cheese"]),
      ownedFurniture: sanitizeOwnedIds(parsed.ownedFurniture, GAME_DATA.furniture, []),
      ownedEquipment: sanitizeOwnedIds(parsed.ownedEquipment, GAME_DATA.equipment, ["basicMachine"]),
      upgrades: {
        ...DEFAULT_STATE.upgrades,
        ...(typeof parsed.upgrades === "object" && parsed.upgrades ? parsed.upgrades : {}),
        tables: parsed.tableCount || parsed.upgrades?.tables || DEFAULT_STATE.upgrades.tables,
        coffeeMachine: parsed.coffeeMachineLevel || parsed.upgrades?.coffeeMachine || DEFAULT_STATE.upgrades.coffeeMachine
      }
    };
  } catch (error) {
    console.warn("Save data could not be loaded.", error);
    return cloneDefaultState();
  }
}

function saveGame() {
  try {
    normalizeState();
    const payload = {
      ...state,
      saveVersion: SAVE_VERSION,
      tableCount: state.upgrades.tables,
      coffeeMachineLevel: state.upgrades.coffeeMachine,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("Save data could not be written.", error);
  }
}

function normalizeState() {
  state.saveVersion = SAVE_VERSION;
  state.upgrades = {
    ...DEFAULT_STATE.upgrades,
    ...(state.upgrades && typeof state.upgrades === "object" ? state.upgrades : {})
  };
  state.ownedCats = sanitizeOwnedIds(state.ownedCats, GAME_DATA.cats, ["cheese"]);
  state.ownedFurniture = sanitizeOwnedIds(state.ownedFurniture, GAME_DATA.furniture, []);
  state.ownedEquipment = sanitizeOwnedIds(state.ownedEquipment, GAME_DATA.equipment, ["basicMachine"]);
  state.coins = sanitizeInteger(state.coins, DEFAULT_STATE.coins, 0);
  state.level = sanitizeInteger(state.level, DEFAULT_STATE.level, 1);
  state.xp = sanitizeInteger(state.xp, DEFAULT_STATE.xp, 0);
  state.totalSales = sanitizeInteger(state.totalSales, DEFAULT_STATE.totalSales, 0);
  state.upgrades.tables = clamp(Math.floor(Number(state.upgrades.tables) || 2), 2, MAX_TABLES);
  state.upgrades.coffeeMachine = Math.max(1, Math.floor(Number(state.upgrades.coffeeMachine) || 1));
  state.upgrades.interior = Math.max(1, Math.floor(Number(state.upgrades.interior) || 1));
  state.upgrades.visitSpeed = Math.max(1, Math.floor(Number(state.upgrades.visitSpeed) || 1));
  if (!state.ownedCats.includes("cheese")) state.ownedCats.unshift("cheese");
  if (!state.ownedEquipment.includes("basicMachine")) state.ownedEquipment.unshift("basicMachine");
}

function gameLoop(timestamp) {
  updateBrewing(timestamp);
  updateCustomers(timestamp);
  updateCatMovement(timestamp);
  updateCupEvent(timestamp);
  maybeSpawnCustomer(timestamp);
  maybeTriggerRandomEvent(timestamp);
  updateTimedHud(timestamp);
  runtime.rafId = requestAnimationFrame(gameLoop);
}

function renderAll() {
  renderHud();
  renderTables();
  renderFurniture();
  renderCustomers();
  renderCats();
  renderUpgrades();
  renderShop();
  renderCatCollection();
}

function renderHud() {
  const xpToNext = getXpToNextLevel(state.level);
  const xpPercent = clamp((state.xp / xpToNext) * 100, 0, 100);
  els.coinCount.textContent = formatNumber(state.coins);
  els.levelLabel.textContent = `Lv. ${state.level}`;
  els.xpLabel.textContent = `${state.xp} / ${xpToNext} XP`;
  els.xpFill.style.width = `${xpPercent}%`;
  els.tableSummary.textContent = `${state.upgrades.tables}개`;
  els.drinkSummary.textContent = `${runtime.readyDrinks}잔`;
  els.customerSummary.textContent = `${runtime.customers.filter((customer) => customer.status !== "leaving").length}명`;
  els.salesSummary.textContent = `${state.totalSales}회`;
  updateMachineStatus();
}

function addCoins(amount) {
  const safeAmount = sanitizeInteger(amount, 0, 0);
  if (safeAmount <= 0) return 0;
  state.coins = sanitizeInteger(state.coins, 0, 0) + safeAmount;
  pulseCoins();
  return safeAmount;
}

function spendCoins(amount) {
  const safeAmount = sanitizeInteger(amount, 0, 0);
  if (safeAmount <= 0 || state.coins < safeAmount) return false;
  state.coins -= safeAmount;
  return true;
}

function pulseCoins() {
  const coinBox = els.coinCount?.closest?.(".coins");
  if (!coinBox) return;
  coinBox.classList.remove("bump");
  void coinBox.offsetWidth;
  coinBox.classList.add("bump");
}

function updateTimedHud(timestamp) {
  const second = Math.floor(timestamp / 1000);
  if (second === runtime.lastHudSecond) return;
  runtime.lastHudSecond = second;
  renderCats();
  renderHud();
}

function renderTables() {
  const positions = getTablePositions(state.upgrades.tables);
  els.tableLayer.innerHTML = positions.map((position, index) => (
    `<div class="table" style="left:${position.x}%; top:${position.y}%;" data-label="T${index + 1}" aria-label="테이블 ${index + 1}"></div>`
  )).join("");
}

function renderFurniture() {
  const items = state.ownedFurniture
    .map((id) => GAME_DATA.furniture[id])
    .filter(Boolean)
    .map((item) => (
      `<div class="furniture-prop" style="left:${item.x}%; top:${item.y}%;" title="${item.name}">${item.emoji}</div>`
    ));
  els.furnitureLayer.innerHTML = items.join("");
}

function renderCustomers() {
  const positions = getTablePositions(state.upgrades.tables);
  els.customerLayer.innerHTML = runtime.customers.map((customer) => {
    const tablePosition = positions[customer.tableIndex] || { x: 50, y: 70 };
    const isSeating = customer.status === "seating";
    const x = isSeating ? Math.max(12, tablePosition.x - 13) : tablePosition.x;
    const y = isSeating ? tablePosition.y - 6 : tablePosition.y - 11;
    const className = `customer status-${customer.status}${customer.status === "leaving" ? " leaving" : ""}`;
    const status = getCustomerStatus(customer);
    const lucky = customer.lucky ? `<span class="lucky-tag">★ 행운</span>` : "";
    return `
      <div class="${className}" style="left:${x}%; top:${y}%;" data-customer-id="${customer.id}">
        <button type="button" aria-label="${status.aria}">
          <span class="status-bubble" aria-hidden="true">${status.icon}</span>
          <span class="customer-emoji" aria-hidden="true">${customer.emoji}</span>
          <span class="customer-name">${status.label}</span>
          <span class="customer-hint">${status.hint}</span>
          ${lucky}
        </button>
      </div>
    `;
  }).join("");
}

function renderCats() {
  for (const catId of state.ownedCats) {
    if (!runtime.catActors[catId]) createCatActor(catId);
  }

  els.catLayer.innerHTML = state.ownedCats.map((catId) => {
    const cat = GAME_DATA.cats[catId];
    const actor = runtime.catActors[catId];
    if (!cat || !actor) return "";
    const cooldownLeft = Math.max(0, Math.ceil((actor.cooldownUntil - performance.now()) / 1000));
    const cooldownText = cooldownLeft > 0 ? `${cooldownLeft}s` : "쓰다듬기";
    return `
      <div class="cat" style="left:${actor.x}%; top:${actor.y}%;" data-cat-id="${cat.id}">
        <button type="button" aria-label="${cat.name} 쓰다듬기">
          <span class="cat-emoji" aria-hidden="true">${cat.emoji}</span>
          <span class="cat-name">${cat.name}</span>
          <span class="cat-cooldown">${cooldownText}</span>
        </button>
      </div>
    `;
  }).join("");
}

function renderShop() {
  if (!els.shopItems) return;
  document.querySelectorAll("[data-shop-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.shopTab === runtime.activeShopTab);
  });

  const data = GAME_DATA[runtime.activeShopTab];
  els.shopItems.innerHTML = Object.values(data).map((item) => {
    const owned = isOwned(runtime.activeShopTab, item.id);
    const canAfford = state.coins >= item.price;
    const buttonText = owned ? "보유 중" : canAfford ? `${formatNumber(item.price)}코인 구매` : "코인 부족";
    const disabled = owned || !canAfford ? "disabled" : "";
    const buttonClass = owned ? "buy-button owned" : canAfford ? "buy-button" : "buy-button locked";
    const priceLine = owned
      ? `<div class="owned-line"><span>상태</span><strong>보유 중</strong></div>`
      : `<div class="price-line"><span>가격</span><strong>${formatNumber(item.price)} 코인</strong></div>`;
    return `
      <article class="shop-card">
        <div class="shop-icon" aria-hidden="true">${item.emoji}</div>
        <h3>${item.name}</h3>
        <p>${item.effect}</p>
        ${priceLine}
        <button class="${buttonClass}" type="button" data-buy-type="${runtime.activeShopTab}" data-buy-id="${item.id}" ${disabled}>
          ${buttonText}
        </button>
      </article>
    `;
  }).join("");
}

function renderCatCollection() {
  els.catCollection.innerHTML = Object.values(GAME_DATA.cats).map((cat) => {
    const owned = state.ownedCats.includes(cat.id);
    const status = owned ? "카페에서 활동 중" : `${formatNumber(cat.price)} 코인`;
    return `
      <article class="cat-card">
        <div class="cat-icon" aria-hidden="true">${cat.emoji}</div>
        <h3>${cat.name}</h3>
        <p>${cat.effect}</p>
        <div class="${owned ? "owned-line" : "price-line"}">
          <span>${owned ? "상태" : "가격"}</span>
          <strong>${status}</strong>
        </div>
      </article>
    `;
  }).join("");
}

function renderUpgrades() {
  const upgrades = getUpgradeDefinitions();
  const markup = upgrades.map((upgrade) => {
    const disabled = upgrade.disabled || state.coins < upgrade.cost ? "disabled" : "";
    const label = upgrade.disabled ? "최대" : `${formatNumber(upgrade.cost)}코인`;
    return `
      <article class="upgrade-item">
        <div class="upgrade-copy">
          <strong>${upgrade.name}</strong>
          <span>${upgrade.description}</span>
        </div>
        <button class="upgrade-button ${upgrade.disabled ? "maxed" : ""}" type="button" data-upgrade-id="${upgrade.id}" ${disabled}>
          ${label}
        </button>
      </article>
    `;
  }).join("");
  els.sideUpgradeList.innerHTML = markup;
  els.mobileUpgradeList.innerHTML = markup;
}

function handleMachineClick(event) {
  event.preventDefault();
  if (isActionLocked("machine")) return;
  if (runtime.isBrewing) {
    showToast("음료를 제작 중입니다.");
    return;
  }

  if (runtime.readyDrinks >= MAX_READY_DRINKS) {
    showToast(`완성 음료는 최대 ${MAX_READY_DRINKS}잔까지 보관할 수 있습니다.`);
    return;
  }

  const waitingForDrink = runtime.customers.filter((customer) => customer.status === "ordered").length;
  if (waitingForDrink <= runtime.readyDrinks) {
    showToast("주문을 먼저 받은 뒤 음료를 제작하세요.");
    return;
  }

  const now = performance.now();
  runtime.isBrewing = true;
  runtime.brewStart = now;
  runtime.brewEnd = now + getBrewDuration();
  updateMachineStatus();
  showToast("☕ 커피 제작을 시작했습니다.");
}

function updateBrewing(timestamp) {
  if (!runtime.isBrewing) return;
  const progress = clamp((timestamp - runtime.brewStart) / (runtime.brewEnd - runtime.brewStart), 0, 1);
  els.machineProgressFill.style.width = `${progress * 100}%`;
  els.machineStatus.textContent = `만드는 중 ${Math.round(progress * 100)}%`;

  if (timestamp >= runtime.brewEnd) {
    runtime.isBrewing = false;
    runtime.readyDrinks += 1;
    els.machineProgressFill.style.width = "0%";
    showFloatingText(els.cafeStage, "☕ 완성", 18, 23);
    showToast("음료가 완성되었습니다. 주문한 손님에게 전달하세요.");
    renderHud();
  }
}

function updateMachineStatus() {
  els.coffeeMachine.classList.toggle("brewing", runtime.isBrewing);
  els.coffeeMachine.classList.toggle("ready", !runtime.isBrewing && runtime.readyDrinks > 0);
  if (runtime.isBrewing) {
    const remaining = Math.max(0, Math.ceil((runtime.brewEnd - performance.now()) / 1000));
    els.machineStatus.textContent = `만드는 중 ${remaining}s`;
    return;
  }
  if (runtime.readyDrinks > 0) {
    els.machineStatus.textContent = `☕ 음료 완성! ${runtime.readyDrinks}잔`;
    return;
  }
  els.machineStatus.textContent = "주문 대기";
  els.machineProgressFill.style.width = "0%";
}

function handleCustomerClick(event) {
  const node = event.target.closest("[data-customer-id]");
  if (!node) return;
  event.preventDefault();
  if (isActionLocked(`customer-${node.dataset.customerId}`)) return;
  const customer = runtime.customers.find((item) => item.id === Number(node.dataset.customerId));
  if (!customer || customer.status === "leaving") return;

  if (customer.status === "seating") {
    showToast("손님이 자리에 앉는 중입니다.");
    return;
  }

  if (customer.status === "waitingOrder") {
    customer.status = "ordered";
    customer.orderTakenAt = performance.now();
    showFloatingText(node, customer.order, 50, 5);
    showToast(`${customer.order} 주문을 받았습니다.`);
    renderCustomers();
    renderHud();
    return;
  }

  if (customer.status === "ordered") {
    if (runtime.readyDrinks <= 0) {
      showToast("완성된 음료가 없습니다. 커피 머신을 눌러 제작하세요.");
      return;
    }
    runtime.readyDrinks -= 1;
    customer.status = "served";
    customer.servedAt = performance.now();
    customer.payAt = customer.servedAt + randomBetween(2800, 4300);
    showFloatingText(node, "음료 전달", 50, 0);
    showToast("손님이 음료를 마시고 있습니다.");
    renderCustomers();
    renderHud();
    return;
  }

  if (customer.status === "served") {
    showToast("손님이 음료를 즐기는 중입니다.");
    return;
  }

  if (customer.status === "readyToPay") {
    showToast("결제 중입니다. 곧 코인이 지급됩니다.");
  }
}

function updateCustomers(timestamp) {
  let changed = false;
  for (const customer of runtime.customers) {
    if (customer.status === "seating" && timestamp >= customer.seatAt) {
      customer.status = "waitingOrder";
      changed = true;
    }

    if (customer.status === "served" && timestamp >= customer.payAt) {
      customer.status = "readyToPay";
      customer.paymentAt = timestamp + 750;
      changed = true;
    }

    if (customer.status === "readyToPay" && timestamp >= customer.paymentAt) {
      completePayment(customer, timestamp);
      changed = true;
    }
  }

  const before = runtime.customers.length;
  runtime.customers = runtime.customers.filter((customer) => customer.status !== "leaving" || timestamp < customer.leaveAt);
  if (before !== runtime.customers.length) changed = true;

  if (changed) {
    renderCustomers();
    renderHud();
  }
}

function completePayment(customer, timestamp) {
  const reward = calculateReward(customer);
  addCoins(reward.total);
  state.totalSales += 1;
  addXp(customer.lucky ? 34 : 24);
  customer.status = "leaving";
  customer.leaveAt = timestamp + 650;
  const positions = getTablePositions(state.upgrades.tables);
  const tablePosition = positions[customer.tableIndex] || { x: 50, y: 70 };
  showFloatingText(els.cafeStage, `+${reward.amount}코인`, tablePosition.x, tablePosition.y - 22);
  if (reward.tip > 0) {
    showFloatingText(els.cafeStage, `TIP +${reward.tip}`, tablePosition.x + 4, tablePosition.y - 31);
    showToast(`팁 ${reward.tip}코인을 받았습니다.`);
  }
  showToast(`💰 ${reward.total}코인을 획득했습니다.`);
  saveGame();
}

function maybeSpawnCustomer(timestamp) {
  if (timestamp < runtime.nextCustomerAt) return;
  spawnCustomer();
  runtime.nextCustomerAt = timestamp + getCustomerInterval();
}

function spawnCustomer() {
  const openTable = findOpenTableIndex();
  if (openTable === -1) return;

  const order = pick(GAME_DATA.orders);
  const lucky = runtime.luckyNextCustomer || Math.random() < 0.06;
  runtime.luckyNextCustomer = false;
  runtime.customerId += 1;
  runtime.customers.push({
    id: runtime.customerId,
    tableIndex: openTable,
    status: "seating",
    order,
    emoji: pick(GAME_DATA.customerEmojis),
    lucky,
    arrivedAt: performance.now(),
    seatAt: performance.now() + 650
  });
  renderCustomers();
  renderHud();
  showToast(lucky ? "행운의 손님이 도착했습니다." : "새 손님이 테이블에 앉았습니다.");
}

function findOpenTableIndex() {
  for (let index = 0; index < state.upgrades.tables; index += 1) {
    const occupied = runtime.customers.some((customer) => customer.tableIndex === index && customer.status !== "leaving");
    if (!occupied) return index;
  }
  return -1;
}

function getCustomerStatus(customer) {
  const map = {
    seating: {
      icon: "🚪",
      label: "자리 찾는 중",
      hint: "잠시만요",
      aria: "자리를 찾는 손님"
    },
    waitingOrder: {
      icon: "☕?",
      label: "주문 대기",
      hint: "손님 선택",
      aria: `${customer.order} 주문 받기`
    },
    ordered: {
      icon: "⏳",
      label: "음료 대기",
      hint: "커피 제작",
      aria: `${customer.order} 전달 대기 손님`
    },
    served: {
      icon: "☕😊",
      label: "마시는 중",
      hint: "만족",
      aria: "음료를 마시는 손님"
    },
    readyToPay: {
      icon: "💰",
      label: "결제 준비",
      hint: "계산 중",
      aria: "결제를 준비하는 손님"
    },
    leaving: {
      icon: "👋",
      label: "퇴장 중",
      hint: "다음 손님",
      aria: "결제 후 퇴장하는 손님"
    }
  };
  return map[customer.status] || map.waitingOrder;
}

function initializeCats() {
  state.ownedCats.forEach((catId) => createCatActor(catId));
}

function createCatActor(catId) {
  runtime.catActors[catId] = {
    x: randomBetween(24, 76),
    y: randomBetween(58, 84),
    targetX: randomBetween(24, 76),
    targetY: randomBetween(58, 84),
    speed: randomBetween(0.0015, 0.0025),
    nextMoveAt: performance.now() + randomBetween(2200, 4600),
    cooldownUntil: 0
  };
}

function updateCatMovement(timestamp) {
  const catNodes = els.catLayer.querySelectorAll("[data-cat-id]");
  catNodes.forEach((node) => {
    const actor = runtime.catActors[node.dataset.catId];
    if (!actor) return;

    if (timestamp >= actor.nextMoveAt) {
      actor.targetX = randomBetween(20, 82);
      actor.targetY = randomBetween(57, 86);
      actor.nextMoveAt = timestamp + randomBetween(6800, 11000);
    }

    actor.x += (actor.targetX - actor.x) * actor.speed * 16;
    actor.y += (actor.targetY - actor.y) * actor.speed * 16;
    node.style.left = `${actor.x}%`;
    node.style.top = `${actor.y}%`;
  });
}

function handleCatClick(event) {
  const node = event.target.closest("[data-cat-id]");
  if (!node) return;
  event.preventDefault();
  if (isActionLocked(`cat-${node.dataset.catId}`)) return;
  const catId = node.dataset.catId;
  const actor = runtime.catActors[catId];
  const cat = GAME_DATA.cats[catId];
  if (!actor || !cat) return;

  const now = performance.now();
  if (now < actor.cooldownUntil) {
    const seconds = Math.ceil((actor.cooldownUntil - now) / 1000);
    showToast(`${cat.name}은 ${seconds}초 뒤 다시 쓰다듬을 수 있습니다.`);
    return;
  }

  const bonus = 10 + Math.floor(state.level * 2);
  addCoins(bonus);
  actor.cooldownUntil = now + 9000;
  showHeart(node);
  showFloatingText(node, `+${bonus}코인`, 50, 0);
  showFloatingText(node, "골골골~", 50, 22);
  showToast(`🐱 ${cat.name}을 쓰다듬었습니다.`);
  renderHud();
  saveGame();
}

function maybeTriggerRandomEvent(timestamp) {
  if (timestamp < runtime.nextEventAt) return;
  const eventType = pick(["cup", "influencer", "lucky"]);
  if (eventType === "cup") triggerCupEvent(timestamp);
  if (eventType === "influencer") triggerInfluencerEvent(timestamp);
  if (eventType === "lucky") triggerLuckyCustomerEvent();
  runtime.nextEventAt = timestamp + randomBetween(36000, 56000);
}

function triggerCupEvent(timestamp) {
  runtime.cupEventEndsAt = timestamp + 9000;
  els.cupEventButton.classList.remove("hidden");
  els.cupEventButton.style.left = `${randomBetween(28, 78)}%`;
  els.cupEventButton.style.top = `${randomBetween(52, 82)}%`;
  showEventBanner("고양이가 컵을 떨어뜨렸습니다! 제한시간 안에 컵을 눌러 보너스를 받으세요.");
}

function collectCupEvent(event) {
  event.preventDefault();
  if (isActionLocked("cup-event")) return;
  if (runtime.cupEventEndsAt <= 0) return;
  runtime.cupEventEndsAt = 0;
  els.cupEventButton.classList.add("hidden");
  const bonus = 85 + state.level * 5;
  addCoins(bonus);
  showFloatingText(els.cafeStage, `+${bonus}코인`, 54, 52);
  showToast("떨어진 컵을 정리하고 보너스를 받았습니다.");
  renderHud();
  saveGame();
}

function updateCupEvent(timestamp) {
  if (runtime.cupEventEndsAt > 0 && timestamp >= runtime.cupEventEndsAt) {
    runtime.cupEventEndsAt = 0;
    els.cupEventButton.classList.add("hidden");
    showEventBanner("컵 정리 기회를 놓쳤습니다.");
  }
}

function triggerInfluencerEvent(timestamp) {
  runtime.influencerUntil = timestamp + 16000;
  showEventBanner("고양이 인플루언서가 방문했습니다! 잠시 손님 방문 속도가 빨라집니다.");
}

function triggerLuckyCustomerEvent() {
  runtime.luckyNextCustomer = true;
  showEventBanner("행운의 손님 등장 예고! 다음 손님은 팁을 크게 지급합니다.");
  if (findOpenTableIndex() !== -1) {
    runtime.nextCustomerAt = performance.now() + 800;
  }
}

function showEventBanner(message) {
  els.eventBanner.textContent = message;
  els.eventBanner.classList.add("show");
  if (runtime.eventBannerTimeoutId) {
    window.clearTimeout(runtime.eventBannerTimeoutId);
  }
  runtime.eventBannerTimeoutId = window.setTimeout(() => {
    els.eventBanner.classList.remove("show");
    runtime.eventBannerTimeoutId = 0;
  }, 5200);
}

function openShop(tab) {
  runtime.activeShopTab = tab || runtime.activeShopTab;
  renderShop();
  openModal("shopModal");
}

function openCatsModal() {
  renderCatCollection();
  openModal("catsModal");
}

function handleBottomNav(action) {
  if (action === "cafe") {
    closeAllModals();
    els.cafeStage.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  if (action === "cats") openCatsModal();
  if (action === "shop") openShop(runtime.activeShopTab);
  if (action === "upgrades") {
    renderUpgrades();
    openModal("upgradeModal");
  }
}

function buyShopItem(type, id) {
  if (isActionLocked(`shop-${type}-${id}`)) return;
  const item = GAME_DATA[type]?.[id];
  if (!item || isOwned(type, id)) return;
  if (state.coins < item.price) {
    showToast("코인이 부족합니다.");
    renderShop();
    return;
  }

  if (!spendCoins(item.price)) {
    showToast("코인이 부족합니다.");
    renderShop();
    return;
  }
  if (type === "cats") {
    state.ownedCats.push(id);
    createCatActor(id);
    showToast(`🛒 ${item.name} 구매 완료!`);
  }
  if (type === "furniture") {
    state.ownedFurniture.push(id);
    showToast(`🛒 ${item.name} 구매 완료!`);
  }
  if (type === "equipment") {
    state.ownedEquipment.push(id);
    showToast(`🛒 ${item.name} 구매 완료!`);
  }

  renderAll();
  saveGame();
}

function isOwned(type, id) {
  if (type === "cats") return state.ownedCats.includes(id);
  if (type === "furniture") return state.ownedFurniture.includes(id);
  if (type === "equipment") return state.ownedEquipment.includes(id);
  return false;
}

function handleUpgradeClick(event) {
  const button = event.target.closest("[data-upgrade-id]");
  if (!button) return;
  const upgradeId = button.dataset.upgradeId;
  buyUpgrade(upgradeId);
}

function buyUpgrade(upgradeId) {
  if (isActionLocked(`upgrade-${upgradeId}`)) return;
  const upgrade = getUpgradeDefinitions().find((item) => item.id === upgradeId);
  if (!upgrade || upgrade.disabled) return;
  if (state.coins < upgrade.cost) {
    showToast("업그레이드에 필요한 코인이 부족합니다.");
    renderUpgrades();
    return;
  }

  if (!spendCoins(upgrade.cost)) {
    showToast("업그레이드에 필요한 코인이 부족합니다.");
    renderUpgrades();
    return;
  }
  if (upgradeId === "tables") {
    state.upgrades.tables = clamp(state.upgrades.tables + 1, 2, MAX_TABLES);
    renderTables();
  }
  if (upgradeId === "coffeeMachine") state.upgrades.coffeeMachine += 1;
  if (upgradeId === "interior") state.upgrades.interior += 1;
  if (upgradeId === "visitSpeed") state.upgrades.visitSpeed += 1;

  showToast(`${upgrade.name} 완료`);
  renderAll();
  saveGame();
}

function getUpgradeDefinitions() {
  return [
    {
      id: "tables",
      name: "테이블 추가",
      cost: getUpgradeCost("tables"),
      disabled: state.upgrades.tables >= MAX_TABLES,
      description: `현재 ${state.upgrades.tables}개 · 동시에 받을 수 있는 손님 수 증가`
    },
    {
      id: "coffeeMachine",
      name: "커피 머신 업그레이드",
      cost: getUpgradeCost("coffeeMachine"),
      disabled: false,
      description: `Lv.${state.upgrades.coffeeMachine} · 제작 시간 ${Math.round(getBrewDuration() / 100) / 10}초`
    },
    {
      id: "interior",
      name: "카페 인테리어 업그레이드",
      cost: getUpgradeCost("interior"),
      disabled: false,
      description: `Lv.${state.upgrades.interior} · 손님 결제 금액 증가`
    },
    {
      id: "visitSpeed",
      name: "손님 방문 속도 업그레이드",
      cost: getUpgradeCost("visitSpeed"),
      disabled: false,
      description: `Lv.${state.upgrades.visitSpeed} · 다음 방문 간격 단축`
    }
  ];
}

function getUpgradeCost(type) {
  if (type === "tables") return Math.round(260 + (state.upgrades.tables - 2) * 210);
  if (type === "coffeeMachine") return Math.round(360 * Math.pow(state.upgrades.coffeeMachine, 1.38));
  if (type === "interior") return Math.round(390 * Math.pow(state.upgrades.interior, 1.42));
  if (type === "visitSpeed") return Math.round(320 * Math.pow(state.upgrades.visitSpeed, 1.34));
  return 9999;
}

function getBrewDuration() {
  const upgradeReduction = Math.pow(0.86, state.upgrades.coffeeMachine - 1);
  const equipmentMultiplier = getOwnedBonus("brewMultiplier", true);
  return Math.max(1200, 4300 * upgradeReduction * equipmentMultiplier);
}

function getCustomerInterval() {
  const upgradeMultiplier = Math.pow(0.9, state.upgrades.visitSpeed - 1);
  const catMultiplier = getOwnedBonus("visitSpeedMultiplier", true);
  const influencerMultiplier = performance.now() < runtime.influencerUntil ? 0.55 : 1;
  return Math.max(2200, 7200 * upgradeMultiplier * catMultiplier * influencerMultiplier);
}

function calculateReward(customer) {
  const base = 62 + (state.level - 1) * 4;
  const interiorBonus = 1 + (state.upgrades.interior - 1) * 0.12;
  const revenueBonus = 1 + getOwnedBonus("revenueBonus", false);
  const satisfactionBonus = 1 + getOwnedBonus("satisfactionBonus", false);
  const luckyBonus = customer.lucky ? 1.25 : 1;
  const amount = Math.round(base * interiorBonus * revenueBonus * satisfactionBonus * luckyBonus);
  const tipChance = clamp(0.12 + getOwnedBonus("tipChanceBonus", false) + (customer.lucky ? 0.62 : 0), 0, 0.92);
  let tip = 0;
  if (Math.random() < tipChance) {
    const tipRate = customer.lucky ? randomBetween(0.55, 0.95) : randomBetween(0.16, 0.34);
    tip = Math.round(amount * tipRate);
  }
  return {
    amount,
    total: amount + tip,
    tip
  };
}

function getOwnedBonus(key, multiply) {
  const collections = [
    state.ownedCats.map((id) => GAME_DATA.cats[id]),
    state.ownedFurniture.map((id) => GAME_DATA.furniture[id]),
    state.ownedEquipment.map((id) => GAME_DATA.equipment[id])
  ];
  const values = collections.flat().filter(Boolean).map((item) => item[key]).filter((value) => typeof value === "number");
  if (multiply) {
    return values.reduce((total, value) => total * value, 1);
  }
  return values.reduce((total, value) => total + value, 0);
}

function addXp(amount) {
  state.xp += amount;
  let leveledUp = false;
  while (state.xp >= getXpToNextLevel(state.level)) {
    state.xp -= getXpToNextLevel(state.level);
    state.level += 1;
    addCoins(90 + state.level * 15);
    leveledUp = true;
  }
  if (leveledUp) {
    showLevelUp();
    showToast(`🎉 카페 레벨이 ${state.level}이 되었습니다.`);
  }
}

function getXpToNextLevel(level) {
  return Math.round(85 + level * 35 + level * level * 7);
}

function getTablePositions(count) {
  const rows = count <= 3 ? 1 : count <= 6 ? 2 : 3;
  const cols = Math.ceil(count / rows);
  const positions = [];
  const xStart = cols === 1 ? 50 : 28;
  const xEnd = cols === 1 ? 50 : 76;
  const yStart = rows === 1 ? 72 : rows === 2 ? 62 : 56;
  const yEnd = rows === 1 ? 72 : rows === 2 ? 80 : 84;

  for (let index = 0; index < count; index += 1) {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const x = cols === 1 ? 50 : xStart + ((xEnd - xStart) * col) / Math.max(1, cols - 1);
    const y = rows === 1 ? yStart : yStart + ((yEnd - yStart) * row) / Math.max(1, rows - 1);
    positions.push({ x, y });
  }
  return positions;
}

function openModal(id) {
  closeAllModals();
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("hidden");
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("hidden");
}

function closeAllModals() {
  ["shopModal", "catsModal", "upgradeModal", "settingsModal"].forEach(closeModal);
}

function resetGame() {
  const confirmed = window.confirm("정말 게임 데이터를 초기화하시겠습니까?\n모든 진행 상황이 삭제됩니다.");
  if (!confirmed) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Save data could not be removed.", error);
  }
  state = cloneDefaultState();
  runtime.customers = [];
  runtime.readyDrinks = 0;
  runtime.isBrewing = false;
  runtime.catActors = {};
  normalizeState();
  initializeCats();
  closeAllModals();
  renderAll();
  showToast("게임이 초기화되었습니다.");
}

function exposeDebugTools() {
  if (!DEBUG_MODE || typeof window === "undefined") return;
  window.meowDebug = {
    addCoins(amount = 1000) {
      addCoins(amount);
      renderAll();
      saveGame();
    },
    spawnCustomer() {
      spawnCustomer();
    },
    levelUp() {
      state.xp = getXpToNextLevel(state.level);
      addXp(0);
      renderAll();
      saveGame();
    },
    resetSave() {
      localStorage.removeItem(STORAGE_KEY);
    }
  };
}

function showToast(message) {
  if (!els.toastRoot) return;
  while (els.toastRoot.children.length >= 4) {
    els.toastRoot.children[0].remove();
  }
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  els.toastRoot.appendChild(toast);
  window.setTimeout(() => {
    toast.remove();
  }, 3300);
}

function showLevelUp() {
  els.levelUpToast.textContent = `🎉 CAFE LEVEL UP! Lv.${state.level}`;
  els.levelUpToast.classList.remove("hidden");
  window.setTimeout(() => {
    els.levelUpToast.classList.add("hidden");
  }, 1700);
}

function showFloatingText(parent, text, xPercent, yPercent) {
  if (!parent || typeof parent.appendChild !== "function") return;
  const node = document.createElement("span");
  node.className = "floating-text";
  node.textContent = text;
  node.style.left = `${xPercent}%`;
  node.style.top = `${yPercent}%`;
  parent.appendChild(node);
  node.addEventListener("animationend", () => node.remove(), { once: true });
}

function showHeart(parent) {
  if (!parent || typeof parent.appendChild !== "function") return;
  const node = document.createElement("span");
  node.className = "heart-pop";
  node.textContent = "♥";
  parent.appendChild(node);
  node.addEventListener("animationend", () => node.remove(), { once: true });
}

function formatNumber(value) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function cloneDefaultState() {
  return {
    saveVersion: SAVE_VERSION,
    ...JSON.parse(JSON.stringify(DEFAULT_STATE))
  };
}

function sanitizeInteger(value, fallback, min) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.floor(number));
}

function sanitizeOwnedIds(value, source, fallback) {
  const ids = Array.isArray(value) ? value : fallback;
  const knownIds = new Set(Object.keys(source));
  return [...new Set(ids.filter((id) => knownIds.has(id)))];
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
