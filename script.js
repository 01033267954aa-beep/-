"use strict";

const STORAGE_KEY = "meowCafeTycoonSaveV1";
const SAVE_VERSION = 1;
const DEBUG_MODE = false;
const MAX_TABLES = 8;
const MAX_READY_DRINKS = 3;
const AUTO_SAVE_MS = 30000;
const INPUT_LOCK_MS = 280;
const CONFIG = {
  customerSpawnMin: 4800,
  customerSpawnMax: 6800,
  minimumSpawnDelay: 1800,
  fullCafeRetryDelay: 2400,
  toastDuration: 2100,
  maxToasts: 3,
  catWalkSpeedMin: 0.0048,
  catWalkSpeedMax: 0.0074,
  catMoveDistanceMin: 8,
  catMoveDistanceMax: 22,
  catMoveDurationMin: 3200,
  catMoveDurationMax: 9400,
  catPersonalSpace: 9,
  catBounds: {
    minX: 18,
    maxX: 86,
    minY: 58,
    maxY: 86
  },
  catBlockedZones: [
    { x1: 2, y1: 12, x2: 25, y2: 42 },
    { x1: 0, y1: 40, x2: 100, y2: 51 }
  ],
  coffeeMiniGameDuration: 7600,
  coffeePointerBaseSpeed: 0.044,
  coffeePointerMinimumSpeed: 0.029
};

const GAME_DATA = {
  cats: {
    cheese: {
      id: "cheese",
      name: "치즈냥",
      emoji: "🐱",
      image: "./assets/cats/cheese-cat.webp",
      sprites: {
        idle: "./assets/cats/cheese/idle.webp",
        walk1: "./assets/cats/cheese/walk-1.webp",
        walk2: "./assets/cats/cheese/walk-2.webp",
        sleep: "./assets/cats/cheese/sleep.webp",
        sit: "./assets/cats/cheese/sit.webp"
      },
      price: 0,
      effect: "손님 만족도 +5%",
      satisfactionBonus: 0.05
    },
    black: {
      id: "black",
      name: "검은냥",
      emoji: "🐈‍⬛",
      image: "./assets/cats/black-cat.webp",
      sprites: {
        idle: "./assets/cats/black/idle.webp",
        walk1: "./assets/cats/black/walk-1.webp",
        walk2: "./assets/cats/black/walk-2.webp",
        sleep: "./assets/cats/black/sleep.webp",
        sit: "./assets/cats/black/sit.webp"
      },
      price: 820,
      effect: "팁 획득 확률 +18%",
      tipChanceBonus: 0.18
    },
    siamese: {
      id: "siamese",
      name: "샴냥",
      emoji: "🐈",
      image: "./assets/cats/siamese-cat.webp",
      sprites: {
        idle: "./assets/cats/siamese/idle.webp",
        walk1: "./assets/cats/siamese/walk-1.webp",
        walk2: "./assets/cats/siamese/walk-2.webp",
        sleep: "./assets/cats/siamese/sleep.webp",
        sit: "./assets/cats/siamese/sit.webp"
      },
      price: 980,
      effect: "음료 판매 금액 +12%",
      revenueBonus: 0.12
    },
    chubby: {
      id: "chubby",
      name: "뚱냥",
      emoji: "😺",
      image: "./assets/cats/chubby-cat.webp",
      sprites: {
        idle: "./assets/cats/chubby/idle.webp",
        walk1: "./assets/cats/chubby/walk-1.webp",
        walk2: "./assets/cats/chubby/walk-2.webp",
        sleep: "./assets/cats/chubby/sleep.webp",
        sit: "./assets/cats/chubby/sit.webp"
      },
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
  readyDrinkQueue: [],
  isBrewing: false,
  brewStart: 0,
  brewEnd: 0,
  coffeeMiniGame: null,
  nextCustomerAt: 0,
  nextEventAt: 0,
  influencerUntil: 0,
  luckyNextCustomer: false,
  cupEventEndsAt: 0,
  catActors: {},
  catSpriteCache: {},
  catLastUpdate: 0,
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
    toastRoot: document.getElementById("toastRoot"),
    coffeeModal: document.getElementById("coffeeModal"),
    coffeeCancelButton: document.getElementById("coffeeCancelButton"),
    coffeeConfirm: document.getElementById("coffeeConfirm"),
    coffeeKeepButton: document.getElementById("coffeeKeepButton"),
    coffeeConfirmCancelButton: document.getElementById("coffeeConfirmCancelButton"),
    coffeeMiniGameSubtitle: document.getElementById("coffeeMiniGameSubtitle"),
    coffeeStream: document.getElementById("coffeeStream"),
    coffeeResultBadge: document.getElementById("coffeeResultBadge"),
    coffeeStepBeans: document.getElementById("coffeeStepBeans"),
    coffeeStepExtract: document.getElementById("coffeeStepExtract"),
    coffeeStepFinish: document.getElementById("coffeeStepFinish"),
    coffeeBeanStep: document.getElementById("coffeeBeanStep"),
    coffeeExtractStep: document.getElementById("coffeeExtractStep"),
    coffeeFinishStep: document.getElementById("coffeeFinishStep"),
    addBeansButton: document.getElementById("addBeansButton"),
    startExtractionButton: document.getElementById("startExtractionButton"),
    stopExtractionButton: document.getElementById("stopExtractionButton"),
    timingPointer: document.getElementById("timingPointer"),
    extractionProgressFill: document.getElementById("extractionProgressFill"),
    coffeeFinishTitle: document.getElementById("coffeeFinishTitle"),
    coffeeFinishText: document.getElementById("coffeeFinishText"),
    coffeeDoneButton: document.getElementById("coffeeDoneButton")
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
  bindPointer(els.coffeeCancelButton, cancelCoffeeMiniGame);
  bindPointer(els.coffeeKeepButton, hideCoffeeCancelConfirm);
  bindPointer(els.coffeeConfirmCancelButton, confirmCancelCoffeeMiniGame);
  bindPointer(els.addBeansButton, addBeansToMachine);
  bindPointer(els.startExtractionButton, startExtraction);
  bindPointer(els.stopExtractionButton, stopExtraction);
  bindPointer(els.coffeeDoneButton, closeCoffeeMiniGame);

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
      if (!els.coffeeModal.classList.contains("hidden")) {
        cancelCoffeeMiniGame(event);
        return;
      }
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
    const cooldownText = cooldownLeft > 0 ? `<span class="cat-cooldown">${cooldownLeft}s</span>` : "";
    const sleepMark = actor.mode === "sleeping" ? `<span class="cat-sleep" aria-hidden="true">💤</span>` : "";
    const spritePath = getCatSpritePath(cat, actor);
    requestCatSprite(spritePath);
    const spriteLoaded = runtime.catSpriteCache[spritePath] === "loaded";
    const imageSource = spriteLoaded ? `src="${spritePath}"` : `data-src="${spritePath}"`;
    return `
      <div class="cat cat-${actor.mode} facing-${actor.direction}" style="left:${actor.x}%; top:${actor.y}%;" data-cat-id="${cat.id}">
        <button type="button" aria-label="${cat.name} 쓰다듬기">
          ${sleepMark}
          <span class="cat-sprite" data-image="${spritePath}" aria-hidden="true">
            <img class="cat-art ${spriteLoaded ? "" : "failed"}" ${imageSource} alt="" loading="lazy">
            <span class="cat-body-fallback cat-body-${cat.id}">
              <span class="cat-tail"></span>
              <span class="cat-body"></span>
              <span class="cat-head">
                <span class="cat-ear ear-left"></span>
                <span class="cat-ear ear-right"></span>
                <span class="cat-eye eye-left"></span>
                <span class="cat-eye eye-right"></span>
              </span>
              <span class="cat-leg leg-front"></span>
              <span class="cat-leg leg-back"></span>
            </span>
          </span>
          <span class="cat-name">${cat.name}</span>
          ${cooldownText}
        </button>
      </div>
    `;
  }).join("");
}

function getCatSpritePath(cat, actor) {
  if (!cat?.sprites) return cat?.image || "";
  if (actor.mode === "walking") {
    return actor.walkFrame === 2 ? cat.sprites.walk2 : cat.sprites.walk1;
  }
  if (actor.mode === "sleeping") return cat.sprites.sleep;
  if (actor.mode === "sitting") return cat.sprites.sit;
  return cat.sprites.idle;
}

function requestCatSprite(path) {
  if (!path || runtime.catSpriteCache[path] || typeof Image === "undefined") return;
  runtime.catSpriteCache[path] = "loading";
  const image = new Image();
  image.onload = () => {
    runtime.catSpriteCache[path] = "loaded";
    renderCats();
  };
  image.onerror = () => {
    runtime.catSpriteCache[path] = "missing";
  };
  image.src = path;
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
  if (runtime.coffeeMiniGame) {
    openModal("coffeeModal");
    renderCoffeeMiniGame();
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

  startCoffeeMiniGame();
}

function updateBrewing(timestamp) {
  updateCoffeeMiniGame(timestamp);
}

function updateMachineStatus() {
  els.coffeeMachine.classList.toggle("brewing", runtime.isBrewing);
  els.coffeeMachine.classList.toggle("ready", !runtime.isBrewing && runtime.readyDrinks > 0);
  if (runtime.coffeeMiniGame) {
    const labels = {
      beans: "원두 준비",
      readyToExtract: "추출 준비",
      extracting: "추출 중",
      complete: "완성"
    };
    els.machineStatus.textContent = labels[runtime.coffeeMiniGame.step] || "제조 중";
    return;
  }
  if (runtime.readyDrinks > 0) {
    els.machineStatus.textContent = `☕ 음료 완성! ${runtime.readyDrinks}잔`;
    return;
  }
  els.machineStatus.textContent = "주문 대기";
  els.machineProgressFill.style.width = "0%";
}

function startCoffeeMiniGame() {
  const now = performance.now();
  const settings = getCoffeeMiniGameSettings();
  runtime.isBrewing = true;
  runtime.brewStart = now;
  runtime.brewEnd = 0;
  runtime.coffeeMiniGame = {
    step: "beans",
    pointer: 50,
    pointerDirection: 1,
    pointerSpeed: settings.pointerSpeed,
    extractionDuration: settings.duration,
    extractionStart: 0,
    extractionEnd: 0,
    quality: null
  };
  openModal("coffeeModal");
  renderCoffeeMiniGame();
  updateMachineStatus();
  showToast("커피 제조를 시작합니다.");
}

function addBeansToMachine(event) {
  event.preventDefault();
  const miniGame = runtime.coffeeMiniGame;
  if (!miniGame || miniGame.step !== "beans") return;
  miniGame.step = "readyToExtract";
  renderCoffeeMiniGame();
  showToast("원두를 넣었습니다.");
}

function startExtraction(event) {
  event.preventDefault();
  const miniGame = runtime.coffeeMiniGame;
  if (!miniGame || miniGame.step !== "readyToExtract") return;
  const now = performance.now();
  miniGame.step = "extracting";
  miniGame.extractionStart = now;
  miniGame.extractionEnd = now + miniGame.extractionDuration;
  miniGame.pointer = 50;
  miniGame.pointerDirection = Math.random() < 0.5 ? -1 : 1;
  runtime.brewStart = miniGame.extractionStart;
  runtime.brewEnd = miniGame.extractionEnd;
  renderCoffeeMiniGame();
  updateMachineStatus();
}

function stopExtraction(event) {
  event.preventDefault();
  const miniGame = runtime.coffeeMiniGame;
  if (!miniGame || miniGame.step !== "extracting") return;
  finishCoffee(calculateCoffeeQuality(miniGame.pointer));
}

function updateCoffeeMiniGame(timestamp) {
  const miniGame = runtime.coffeeMiniGame;
  if (!miniGame || miniGame.step !== "extracting") return;

  const delta = runtime.brewStart ? Math.min(80, timestamp - (miniGame.lastUpdate || timestamp)) : 16;
  miniGame.lastUpdate = timestamp;
  miniGame.pointer += miniGame.pointerDirection * miniGame.pointerSpeed * delta;
  if (miniGame.pointer >= 100) {
    miniGame.pointer = 100;
    miniGame.pointerDirection = -1;
  }
  if (miniGame.pointer <= 0) {
    miniGame.pointer = 0;
    miniGame.pointerDirection = 1;
  }

  const progress = clamp((timestamp - miniGame.extractionStart) / Math.max(1, miniGame.extractionEnd - miniGame.extractionStart), 0, 1);
  els.timingPointer.style.left = `${miniGame.pointer}%`;
  els.extractionProgressFill.style.width = `${progress * 100}%`;
  els.machineProgressFill.style.width = `${progress * 100}%`;
  els.machineStatus.textContent = `추출 중 ${Math.round(progress * 100)}%`;

  if (timestamp >= miniGame.extractionEnd) {
    finishCoffee(calculateCoffeeQuality(miniGame.pointer, true));
  }
}

function finishCoffee(quality) {
  const miniGame = runtime.coffeeMiniGame;
  if (!miniGame || miniGame.step === "complete") return;
  miniGame.step = "complete";
  miniGame.quality = quality;
  runtime.isBrewing = false;
  runtime.readyDrinkQueue.push({
    ...quality,
    createdAt: Date.now()
  });
  syncReadyDrinkCount();
  els.machineProgressFill.style.width = "0%";
  showFloatingText(els.cafeStage, `${quality.label} ☕`, 18, 23);
  showToast(`${quality.label} 커피가 완성되었습니다.`);
  renderCoffeeMiniGame();
  renderHud();
  saveGame();
}

function calculateCoffeeQuality(pointer, timedOut = false) {
  const distance = Math.abs(pointer - 50);
  if (!timedOut && distance <= getCoffeeMiniGameSettings().perfectWindow / 2) {
    return {
      key: "perfect",
      label: "Perfect",
      revenueMultiplier: 1.12,
      tipBonus: 0.18,
      xpBonus: 8,
      drinkTimeMultiplier: 0.86
    };
  }
  if (distance <= 27) {
    return {
      key: "good",
      label: "Good",
      revenueMultiplier: 1,
      tipBonus: 0.04,
      xpBonus: 3,
      drinkTimeMultiplier: 1
    };
  }
  return {
    key: "okay",
    label: "Okay",
    revenueMultiplier: 0.92,
    tipBonus: 0,
    xpBonus: 0,
    drinkTimeMultiplier: 1.12
  };
}

function getCoffeeMiniGameSettings() {
  const level = Math.max(1, state.upgrades.coffeeMachine);
  const equipmentMultiplier = getOwnedBonus("brewMultiplier", true);
  return {
    perfectWindow: clamp(16 + (level - 1) * 2.5, 16, 28),
    pointerSpeed: Math.max(CONFIG.coffeePointerMinimumSpeed, CONFIG.coffeePointerBaseSpeed * Math.pow(0.94, level - 1) * equipmentMultiplier),
    duration: Math.max(5200, CONFIG.coffeeMiniGameDuration * Math.pow(0.97, level - 1))
  };
}

function renderCoffeeMiniGame() {
  const miniGame = runtime.coffeeMiniGame;
  if (!miniGame) return;
  const step = miniGame.step;
  const quality = miniGame.quality;
  const isExtracting = step === "extracting";
  const isComplete = step === "complete";

  els.coffeeConfirm.classList.add("hidden");
  els.coffeeBeanStep.classList.toggle("hidden", step !== "beans");
  els.coffeeExtractStep.classList.toggle("hidden", step !== "readyToExtract" && step !== "extracting");
  els.coffeeFinishStep.classList.toggle("hidden", !isComplete);
  els.startExtractionButton.classList.toggle("hidden", step !== "readyToExtract");
  els.stopExtractionButton.classList.toggle("hidden", !isExtracting);
  els.coffeeStream.classList.toggle("running", isExtracting);
  els.coffeeStepBeans.classList.toggle("active", step === "beans");
  els.coffeeStepExtract.classList.toggle("active", step === "readyToExtract" || isExtracting);
  els.coffeeStepFinish.classList.toggle("active", isComplete);
  els.coffeeStepBeans.classList.toggle("done", step !== "beans");
  els.coffeeStepExtract.classList.toggle("done", isComplete);
  els.coffeeResultBadge.textContent = quality?.label || (isExtracting ? "BREW" : "READY");
  els.coffeeResultBadge.dataset.quality = quality?.key || "";
  els.coffeeMiniGameSubtitle.textContent = getCoffeeStepText(step, quality);
  els.timingPointer.style.left = `${miniGame.pointer}%`;
  els.extractionProgressFill.style.width = isExtracting ? els.extractionProgressFill.style.width : "0%";

  if (quality) {
    els.coffeeFinishTitle.textContent = `${quality.label} 커피 완성!`;
    els.coffeeFinishText.textContent = getCoffeeQualityText(quality);
  }
}

function getCoffeeStepText(step, quality) {
  if (step === "beans") return "원두를 넣어 제조를 시작하세요.";
  if (step === "readyToExtract") return "추출을 시작한 뒤 초록 영역에서 멈추세요.";
  if (step === "extracting") return "포인터가 초록 영역에 올 때 타이밍을 맞추세요.";
  if (step === "complete") return `${quality?.label || "Good"} 품질의 커피가 준비되었습니다.`;
  return "커피를 준비하세요.";
}

function getCoffeeQualityText(quality) {
  if (quality.key === "perfect") return "손님 만족도와 팁 확률이 크게 올라갑니다.";
  if (quality.key === "good") return "기본 품질로 안정적인 만족도를 제공합니다.";
  return "주문은 완료되지만 팁 보너스는 없습니다.";
}

function cancelCoffeeMiniGame(event) {
  event?.preventDefault?.();
  const miniGame = runtime.coffeeMiniGame;
  if (!miniGame) {
    closeModal("coffeeModal");
    return;
  }
  if (miniGame.step === "extracting") {
    els.coffeeConfirm.classList.remove("hidden");
    return;
  }
  closeCoffeeMiniGame(event);
}

function hideCoffeeCancelConfirm(event) {
  event.preventDefault();
  els.coffeeConfirm.classList.add("hidden");
}

function confirmCancelCoffeeMiniGame(event) {
  event.preventDefault();
  runtime.coffeeMiniGame = null;
  runtime.isBrewing = false;
  runtime.brewStart = 0;
  runtime.brewEnd = 0;
  els.machineProgressFill.style.width = "0%";
  els.extractionProgressFill.style.width = "0%";
  closeModal("coffeeModal");
  updateMachineStatus();
  showToast("커피 제조를 취소했습니다.");
}

function closeCoffeeMiniGame(event) {
  event?.preventDefault?.();
  const step = runtime.coffeeMiniGame?.step;
  if (step === "extracting") {
    cancelCoffeeMiniGame(event);
    return;
  }
  if (runtime.coffeeMiniGame) {
    runtime.coffeeMiniGame = null;
    runtime.isBrewing = false;
    runtime.brewStart = 0;
    runtime.brewEnd = 0;
    els.machineProgressFill.style.width = "0%";
    els.extractionProgressFill.style.width = "0%";
    if (step !== "complete") showToast("커피 제조를 취소했습니다.");
  }
  closeModal("coffeeModal");
  updateMachineStatus();
}

function syncReadyDrinkCount() {
  runtime.readyDrinks = runtime.readyDrinkQueue.length;
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
    const drink = runtime.readyDrinkQueue.shift() || calculateCoffeeQuality(50, true);
    syncReadyDrinkCount();
    customer.status = "served";
    customer.drinkQuality = drink;
    customer.servedAt = performance.now();
    customer.payAt = customer.servedAt + randomBetween(2800, 4300) * (drink.drinkTimeMultiplier || 1);
    showFloatingText(node, `${drink.label} 전달`, 50, 0);
    showToast(`손님에게 ${drink.label} 커피를 전달했습니다.`);
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
  addXp((customer.lucky ? 34 : 24) + (customer.drinkQuality?.xpBonus || 0));
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
  const spawned = spawnCustomer();
  runtime.nextCustomerAt = timestamp + (spawned ? getCustomerInterval() : CONFIG.fullCafeRetryDelay);
}

function spawnCustomer() {
  const openTable = findOpenTableIndex();
  if (openTable === -1) return false;

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
  return true;
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
  const spawn = getSafeCatPosition(catId);
  runtime.catActors[catId] = {
    x: spawn.x,
    y: spawn.y,
    startX: spawn.x,
    startY: spawn.y,
    targetX: spawn.x,
    targetY: spawn.y,
    moveStart: 0,
    moveEnd: 0,
    isMoving: false,
    mode: "idle",
    modeUntil: performance.now() + randomBetween(2400, 5200),
    direction: "right",
    walkFrame: 1,
    restStreak: 0,
    cooldownUntil: 0
  };
}

function updateCatMovement(timestamp) {
  const delta = runtime.catLastUpdate ? Math.min(80, timestamp - runtime.catLastUpdate) : 16;
  runtime.catLastUpdate = timestamp;
  const catNodes = els.catLayer.querySelectorAll("[data-cat-id]");
  catNodes.forEach((node) => {
    const catId = node.dataset.catId;
    const actor = runtime.catActors[catId];
    if (!actor) return;

    if (timestamp >= actor.modeUntil) {
      chooseNextCatBehavior(catId, actor, timestamp);
    }

    if (actor.isMoving) {
      const progress = clamp((timestamp - actor.moveStart) / Math.max(1, actor.moveEnd - actor.moveStart), 0, 1);
      const eased = easeInOutSine(progress);
      actor.x = actor.startX + (actor.targetX - actor.startX) * eased;
      actor.y = actor.startY + (actor.targetY - actor.startY) * eased;
      actor.walkFrame = Math.floor(timestamp / 360) % 2 === 0 ? 1 : 2;

      if (progress >= 1) {
        actor.x = actor.targetX;
        actor.y = actor.targetY;
        actor.isMoving = false;
        chooseNextCatBehavior(catId, actor, timestamp, pickWeighted([
          ["idle", 0.45],
          ["sitting", 0.33],
          ["sleeping", 0.22]
        ]));
      }
    }

    actor.x = clamp(actor.x, CONFIG.catBounds.minX, CONFIG.catBounds.maxX);
    actor.y = clamp(actor.y, CONFIG.catBounds.minY, CONFIG.catBounds.maxY);
    node.style.left = `${actor.x}%`;
    node.style.top = `${actor.y}%`;
    node.className = `cat cat-${actor.mode} facing-${actor.direction}`;

    const cat = GAME_DATA.cats[catId];
    const image = node.querySelector(".cat-art");
    const spritePath = getCatSpritePath(cat, actor);
    requestCatSprite(spritePath);
    if (image) {
      image.dataset.src = spritePath;
      if (runtime.catSpriteCache[spritePath] === "loaded") {
        if (image.getAttribute("src") !== spritePath) image.setAttribute("src", spritePath);
        image.classList.remove("failed");
      } else {
        image.removeAttribute("src");
        image.classList.add("failed");
      }
    }
  });
}

function chooseNextCatBehavior(catId, actor, timestamp, forcedMode) {
  const mode = forcedMode || (actor.restStreak >= 2 ? "walking" : pickWeighted([
    ["walking", 0.34],
    ["idle", 0.28],
    ["sitting", 0.22],
    ["sleeping", 0.11],
    ["looking", 0.05]
  ]));

  actor.mode = mode;

  if (mode === "walking") {
    actor.restStreak = 0;
    startCatMove(catId, actor, timestamp);
    return;
  }

  actor.isMoving = false;
  actor.restStreak = (actor.restStreak || 0) + 1;
  const durationByMode = {
    idle: [2400, 5600],
    sitting: [4200, 8200],
    sleeping: [6000, 11000],
    looking: [1800, 3800]
  };
  const [minDuration, maxDuration] = durationByMode[mode] || durationByMode.idle;
  actor.modeUntil = timestamp + randomBetween(minDuration, maxDuration);

  if (mode === "looking" && Math.random() < 0.6) {
    actor.direction = actor.direction === "left" ? "right" : "left";
  }
}

function startCatMove(catId, actor, timestamp) {
  const target = getSafeCatTarget(catId, actor);
  const dx = target.x - actor.x;
  const dy = target.y - actor.y;
  const distance = Math.hypot(dx, dy);
  const speed = randomBetween(CONFIG.catWalkSpeedMin, CONFIG.catWalkSpeedMax);
  const duration = clamp(distance / speed, CONFIG.catMoveDurationMin, CONFIG.catMoveDurationMax);

  actor.startX = actor.x;
  actor.startY = actor.y;
  actor.targetX = target.x;
  actor.targetY = target.y;
  actor.moveStart = timestamp;
  actor.moveEnd = timestamp + duration;
  actor.modeUntil = actor.moveEnd;
  actor.isMoving = true;
  actor.mode = "walking";
  actor.walkFrame = 1;
  if (Math.abs(dx) > 0.25) {
    actor.direction = actor.targetX < actor.x ? "left" : "right";
  }
}

function getSafeCatPosition(catId) {
  const bounds = CONFIG.catBounds;
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const position = {
      x: randomBetween(bounds.minX + 2, bounds.maxX - 2),
      y: randomBetween(bounds.minY + 1, bounds.maxY - 1)
    };
    if (isCatPositionAllowed(position.x, position.y, catId)) return position;
  }
  return {
    x: randomBetween(bounds.minX + 4, bounds.maxX - 4),
    y: randomBetween(bounds.minY + 3, bounds.maxY - 3)
  };
}

function getSafeCatTarget(catId, actor) {
  const bounds = CONFIG.catBounds;
  for (let attempt = 0; attempt < 28; attempt += 1) {
    const angle = randomBetween(0, Math.PI * 2);
    const distance = randomBetween(CONFIG.catMoveDistanceMin, CONFIG.catMoveDistanceMax);
    const target = {
      x: clamp(actor.x + Math.cos(angle) * distance, bounds.minX, bounds.maxX),
      y: clamp(actor.y + Math.sin(angle) * distance * 0.55, bounds.minY, bounds.maxY)
    };
    if (isCatPositionAllowed(target.x, target.y, catId)) return target;
  }
  return {
    x: clamp(actor.x + randomBetween(-7, 7), bounds.minX, bounds.maxX),
    y: clamp(actor.y + randomBetween(-4, 4), bounds.minY, bounds.maxY)
  };
}

function isCatPositionAllowed(x, y, catId) {
  const blocked = CONFIG.catBlockedZones.some((zone) => (
    x >= zone.x1 && x <= zone.x2 && y >= zone.y1 && y <= zone.y2
  ));
  if (blocked) return false;

  const tooCloseToTable = getTablePositions(state.upgrades.tables).some((position) => (
    Math.abs(x - position.x) < 8 && Math.abs(y - position.y) < 6
  ));
  if (tooCloseToTable) return false;

  return Object.entries(runtime.catActors).every(([otherCatId, other]) => {
    if (otherCatId === catId || !other) return true;
    return Math.hypot(x - other.x, y - other.y) >= CONFIG.catPersonalSpace;
  });
}

function easeInOutSine(progress) {
  return -(Math.cos(Math.PI * progress) - 1) / 2;
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
  actor.isMoving = false;
  actor.mode = "petting";
  actor.modeUntil = now + 1200;
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
      description: `Lv.${state.upgrades.coffeeMachine} · Perfect 영역 ${Math.round(getCoffeeMiniGameSettings().perfectWindow)}%`
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

function getCustomerInterval() {
  const upgradeMultiplier = Math.pow(0.9, state.upgrades.visitSpeed - 1);
  const catMultiplier = getOwnedBonus("visitSpeedMultiplier", true);
  const influencerMultiplier = performance.now() < runtime.influencerUntil ? 0.55 : 1;
  const baseDelay = randomBetween(CONFIG.customerSpawnMin, CONFIG.customerSpawnMax);
  return Math.max(CONFIG.minimumSpawnDelay, baseDelay * upgradeMultiplier * catMultiplier * influencerMultiplier);
}

function calculateReward(customer) {
  const base = 62 + (state.level - 1) * 4;
  const interiorBonus = 1 + (state.upgrades.interior - 1) * 0.12;
  const revenueBonus = 1 + getOwnedBonus("revenueBonus", false);
  const satisfactionBonus = 1 + getOwnedBonus("satisfactionBonus", false);
  const qualityBonus = customer.drinkQuality?.revenueMultiplier || 1;
  const luckyBonus = customer.lucky ? 1.25 : 1;
  const amount = Math.round(base * interiorBonus * revenueBonus * satisfactionBonus * luckyBonus * qualityBonus);
  const tipChance = clamp(0.12 + getOwnedBonus("tipChanceBonus", false) + (customer.drinkQuality?.tipBonus || 0) + (customer.lucky ? 0.62 : 0), 0, 0.92);
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
  ["shopModal", "catsModal", "upgradeModal", "settingsModal", "coffeeModal"].forEach(closeModal);
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
  runtime.readyDrinkQueue = [];
  runtime.isBrewing = false;
  runtime.coffeeMiniGame = null;
  runtime.catActors = {};
  runtime.catLastUpdate = 0;
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
  while (els.toastRoot.children.length >= CONFIG.maxToasts) {
    els.toastRoot.children[0].remove();
  }
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  els.toastRoot.appendChild(toast);
  window.setTimeout(() => {
    toast.classList.add("leaving");
    window.setTimeout(() => toast.remove(), 240);
  }, CONFIG.toastDuration);
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

function pickWeighted(entries) {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
