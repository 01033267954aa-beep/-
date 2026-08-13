"use strict";

const STORAGE_KEY = "meowCafeTycoonSaveV1";
const SAVE_VERSION = 1;
const DEBUG_MODE = false;
const MAX_TABLES = 8;
const MAX_READY_ITEMS = 3;
const AUTO_SAVE_MS = 30000;
const INPUT_LOCK_MS = 280;
const CONFIG = {
  customerSpawnMin: 6200,
  customerSpawnMax: 9200,
  minimumSpawnDelay: 2800,
  fullCafeRetryDelay: 3000,
  craftingSpawnSlowdown: 1.38,
  toastDuration: 2100,
  maxToasts: 3,
  readyItemLimit: MAX_READY_ITEMS,
  baseCustomerPatience: 88000,
  patiencePerDifficulty: 9000,
  activeOrderLimits: [
    { level: 1, max: 2 },
    { level: 4, max: 3 },
    { level: 7, max: 4 }
  ],
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
  coffeePointerMinimumSpeed: 0.029,
  bakingDuration: 7600,
  toastDurationMs: 5400,
  pourDuration: 5200,
  blendDuration: 6200,
  qualityWindows: {
    coffee: { perfect: 10, good: 28 },
    milk: { perfect: 9, good: 24 },
    baking: { perfect: 10, good: 26 },
    toast: { perfect: 11, good: 27 },
    pour: { perfect: 8, good: 23 },
    blend: { perfect: 9, good: 24 }
  }
};

const QUALITY_DEFS = {
  perfect: {
    key: "perfect",
    label: "Perfect",
    tipBonus: 0.18,
    xpBonus: 8,
    satisfactionBonus: 0.14,
    consumeTimeMultiplier: 0.86
  },
  good: {
    key: "good",
    label: "Good",
    tipBonus: 0,
    xpBonus: 0,
    satisfactionBonus: 0,
    consumeTimeMultiplier: 1
  },
  okay: {
    key: "okay",
    label: "Okay",
    tipBonus: 0,
    xpBonus: 0,
    satisfactionBonus: 0,
    consumeTimeMultiplier: 1.1
  }
};

const MENU_ITEMS = {
  americano: {
    id: "americano",
    name: "아메리카노",
    category: "coffee",
    price: 68,
    xp: 24,
    machine: "coffeeMachine",
    difficulty: 1,
    baseTime: 7600,
    unlockLevel: 1,
    image: "./assets/drinks/americano.webp",
    emoji: "☕",
    gameType: "americano"
  },
  toast: {
    id: "toast",
    name: "토스트",
    category: "bread",
    price: 82,
    xp: 26,
    machine: "oven",
    difficulty: 1,
    baseTime: 5400,
    unlockLevel: 2,
    image: "./assets/food/toast.webp",
    emoji: "🍞",
    gameType: "toast"
  },
  orangeJuice: {
    id: "orangeJuice",
    name: "오렌지 주스",
    category: "juice",
    price: 94,
    xp: 28,
    machine: "blender",
    difficulty: 2,
    baseTime: 6200,
    unlockLevel: 3,
    image: "./assets/drinks/orange-juice.webp",
    emoji: "🍊",
    gameType: "orangeJuice"
  },
  cafeLatte: {
    id: "cafeLatte",
    name: "카페라떼",
    category: "coffee",
    price: 108,
    xp: 32,
    machine: "coffeeMachine",
    difficulty: 2,
    baseTime: 9000,
    unlockLevel: 4,
    image: "./assets/drinks/latte.webp",
    emoji: "🥛",
    gameType: "cafeLatte"
  },
  croissant: {
    id: "croissant",
    name: "크루아상",
    category: "bread",
    price: 118,
    xp: 34,
    machine: "oven",
    difficulty: 2,
    baseTime: 7600,
    unlockLevel: 5,
    image: "./assets/food/croissant.webp",
    emoji: "🥐",
    gameType: "croissant"
  },
  strawberryJuice: {
    id: "strawberryJuice",
    name: "딸기 주스",
    category: "juice",
    price: 126,
    xp: 36,
    machine: "blender",
    difficulty: 3,
    baseTime: 7200,
    unlockLevel: 6,
    image: "./assets/drinks/strawberry-juice.webp",
    emoji: "🍓",
    gameType: "strawberryJuice"
  }
};

const MACHINE_DATA = {
  coffeeMachine: {
    id: "coffeeMachine",
    name: "커피 머신",
    emoji: "☕",
    category: "coffee",
    unlockLevel: 1,
    statusElement: "machineStatus",
    element: "coffeeMachine",
    sound: "coffee-brew"
  },
  oven: {
    id: "oven",
    name: "오븐",
    emoji: "🥐",
    category: "bread",
    unlockLevel: 2,
    statusElement: "ovenStatus",
    element: "ovenMachine",
    sound: "oven"
  },
  blender: {
    id: "blender",
    name: "블렌더",
    emoji: "🍹",
    category: "juice",
    unlockLevel: 3,
    statusElement: "blenderStatus",
    element: "blenderMachine",
    sound: "blender"
  }
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
    oven: {
      id: "oven",
      name: "베이킹 오븐",
      emoji: "🥐",
      price: 0,
      effect: "Lv.2부터 빵 메뉴 제작"
    },
    blender: {
      id: "blender",
      name: "주스 블렌더",
      emoji: "🍹",
      price: 0,
      effect: "Lv.3부터 주스 메뉴 제작"
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
  customerEmojis: ["🙂", "😊", "😌", "🤎", "🧑", "👩", "👨"]
};

const DEFAULT_STATE = {
  coins: 500,
  level: 1,
  xp: 0,
  totalSales: 0,
  ownedCats: ["cheese"],
  ownedFurniture: [],
  ownedEquipment: ["basicMachine", "oven", "blender"],
  unlockedMenus: ["americano"],
  tutorialSeen: {},
  readyItems: [],
  upgrades: {
    tables: 2,
    coffeeMachine: 1,
    oven: 1,
    blender: 1,
    interior: 1,
    visitSpeed: 1
  }
};

const runtime = {
  customers: [],
  customerId: 0,
  readyDrinks: 0,
  readyDrinkQueue: [],
  readyItems: [],
  isBrewing: false,
  brewStart: 0,
  brewEnd: 0,
  coffeeMiniGame: null,
  miniGame: null,
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
  hydrateRuntimeReadyItems();
  updateMenuUnlocks(false);
  initializeCats();
  renderAll();
  hydrateObjectAssets();
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
    orderList: document.getElementById("orderList"),
    readyShelf: document.getElementById("readyShelf"),
    coffeeMachine: document.getElementById("coffeeMachine"),
    ovenMachine: document.getElementById("ovenMachine"),
    blenderMachine: document.getElementById("blenderMachine"),
    bakeryShowcase: document.getElementById("bakeryShowcase"),
    machineStatus: document.getElementById("machineStatus"),
    ovenStatus: document.getElementById("ovenStatus"),
    blenderStatus: document.getElementById("blenderStatus"),
    machineProgressFill: document.getElementById("machineProgressFill"),
    cupEventButton: document.getElementById("cupEventButton"),
    tableSummary: document.getElementById("tableSummary"),
    drinkSummary: document.getElementById("drinkSummary"),
    customerSummary: document.getElementById("customerSummary"),
    salesSummary: document.getElementById("salesSummary"),
    missionChip: document.getElementById("missionChip"),
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
    coffeeMiniGameTitle: document.getElementById("coffeeMiniGameTitle"),
    coffeeMiniGameSubtitle: document.getElementById("coffeeMiniGameSubtitle"),
    miniGameVisual: document.getElementById("miniGameVisual"),
    miniGameProp: document.getElementById("miniGameProp"),
    miniGameIcon: document.getElementById("miniGameIcon"),
    miniGameSteps: document.getElementById("miniGameSteps"),
    miniGameBody: document.getElementById("miniGameBody"),
    miniGameActionButton: document.getElementById("miniGameActionButton"),
    miniGameSecondaryButton: document.getElementById("miniGameSecondaryButton"),
    coffeeStream: document.getElementById("coffeeStream"),
    coffeeResultBadge: document.getElementById("coffeeResultBadge")
  };
}

function bindEvents() {
  if (runtime.eventsBound) return;
  bindPointer(els.coffeeMachine, handleMachineClick);
  bindPointer(els.ovenMachine, handleMachineClick);
  bindPointer(els.blenderMachine, handleMachineClick);
  bindPointer(els.bakeryShowcase, handleShowcaseClick);
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
  bindPointer(els.miniGameActionButton, (event) => MiniGameManager.primaryAction(event));
  bindPointer(els.miniGameSecondaryButton, (event) => MiniGameManager.secondaryAction(event));

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
    if (event.code === "Space" && !els.coffeeModal.classList.contains("hidden")) {
      event.preventDefault();
      MiniGameManager.primaryAction(event);
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
      ownedEquipment: sanitizeOwnedIds(parsed.ownedEquipment, GAME_DATA.equipment, DEFAULT_STATE.ownedEquipment),
      unlockedMenus: sanitizeMenuIds(parsed.unlockedMenus, getMenuIdsUnlockedByLevel(parsed.level || DEFAULT_STATE.level)),
      tutorialSeen: parsed.tutorialSeen && typeof parsed.tutorialSeen === "object" ? parsed.tutorialSeen : {},
      readyItems: sanitizeReadyItems(parsed.readyItems || migrateReadyDrinks(parsed.readyDrinkQueue)),
      upgrades: {
        ...DEFAULT_STATE.upgrades,
        ...(typeof parsed.upgrades === "object" && parsed.upgrades ? parsed.upgrades : {}),
        tables: parsed.tableCount || parsed.upgrades?.tables || DEFAULT_STATE.upgrades.tables,
        coffeeMachine: parsed.coffeeMachineLevel || parsed.upgrades?.coffeeMachine || DEFAULT_STATE.upgrades.coffeeMachine,
        oven: parsed.ovenLevel || parsed.upgrades?.oven || DEFAULT_STATE.upgrades.oven,
        blender: parsed.blenderLevel || parsed.upgrades?.blender || DEFAULT_STATE.upgrades.blender
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
      readyItems: sanitizeReadyItems(runtime.readyItems),
      tableCount: state.upgrades.tables,
      coffeeMachineLevel: state.upgrades.coffeeMachine,
      ovenLevel: state.upgrades.oven,
      blenderLevel: state.upgrades.blender,
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
  state.ownedEquipment = sanitizeOwnedIds(state.ownedEquipment, GAME_DATA.equipment, DEFAULT_STATE.ownedEquipment);
  const levelUnlockedMenus = getMenuIdsUnlockedByLevel(state.level || DEFAULT_STATE.level);
  state.unlockedMenus = sanitizeMenuIds(state.unlockedMenus, levelUnlockedMenus).filter((id) => levelUnlockedMenus.includes(id));
  state.tutorialSeen = state.tutorialSeen && typeof state.tutorialSeen === "object" ? state.tutorialSeen : {};
  state.readyItems = sanitizeReadyItems(state.readyItems);
  state.coins = sanitizeInteger(state.coins, DEFAULT_STATE.coins, 0);
  state.level = sanitizeInteger(state.level, DEFAULT_STATE.level, 1);
  state.xp = sanitizeInteger(state.xp, DEFAULT_STATE.xp, 0);
  state.totalSales = sanitizeInteger(state.totalSales, DEFAULT_STATE.totalSales, 0);
  state.upgrades.tables = clamp(Math.floor(Number(state.upgrades.tables) || 2), 2, MAX_TABLES);
  state.upgrades.coffeeMachine = Math.max(1, Math.floor(Number(state.upgrades.coffeeMachine) || 1));
  state.upgrades.oven = Math.max(1, Math.floor(Number(state.upgrades.oven) || 1));
  state.upgrades.blender = Math.max(1, Math.floor(Number(state.upgrades.blender) || 1));
  state.upgrades.interior = Math.max(1, Math.floor(Number(state.upgrades.interior) || 1));
  state.upgrades.visitSpeed = Math.max(1, Math.floor(Number(state.upgrades.visitSpeed) || 1));
  if (!state.ownedCats.includes("cheese")) state.ownedCats.unshift("cheese");
  if (!state.ownedEquipment.includes("basicMachine")) state.ownedEquipment.unshift("basicMachine");
  if (!state.ownedEquipment.includes("oven")) state.ownedEquipment.push("oven");
  if (!state.ownedEquipment.includes("blender")) state.ownedEquipment.push("blender");
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
  renderCurrentOrders();
  renderReadyShelf();
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
  els.drinkSummary.textContent = `${runtime.readyItems.length}개`;
  els.customerSummary.textContent = `${runtime.customers.filter((customer) => customer.status !== "leaving").length}명`;
  els.salesSummary.textContent = `${state.totalSales}회`;
  if (els.missionChip) {
    els.missionChip.textContent = `🎯 ${state.totalSales % 5}/5`;
  }
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
    `<div class="table" style="left:${position.x}%; top:${position.y}%; z-index:${getDepthIndex(position.y, 3)};" aria-label="테이블 ${index + 1}">
      <span class="chair chair-back" aria-hidden="true"></span>
      <span class="chair chair-left" aria-hidden="true"></span>
      <span class="chair chair-right" aria-hidden="true"></span>
      <span class="table-leg table-leg-left" aria-hidden="true"></span>
      <span class="table-leg table-leg-right" aria-hidden="true"></span>
      <span class="table-top" aria-hidden="true"></span>
    </div>`
  )).join("");
}

function renderFurniture() {
  const items = state.ownedFurniture
    .map((id) => GAME_DATA.furniture[id])
    .filter(Boolean)
    .map((item) => (
      `<div class="furniture-prop furniture-${item.id}" style="left:${item.x}%; top:${item.y}%; z-index:${getDepthIndex(item.y, 2)};" title="${item.name}" data-asset="./assets/furniture/${item.id}.webp">
        <span class="object-sprite" data-fallback="${item.emoji}" aria-hidden="true"></span>
      </div>`
    ));
  els.furnitureLayer.innerHTML = items.join("");
  hydrateObjectAssets(els.furnitureLayer);
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
    const orderBubble = customer.order && customer.status !== "seating" && customer.status !== "leaving"
      ? `<span class="order-bubble" aria-hidden="true">${getOrderShortText(customer.order)}</span>`
      : "";
    return `
      <div class="${className}" style="left:${x}%; top:${y}%; z-index:${getDepthIndex(y, 8)};" data-customer-id="${customer.id}">
        <button type="button" aria-label="${status.aria}">
          ${orderBubble}
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
      <div class="cat cat-${actor.mode} facing-${actor.direction}" style="left:${actor.x}%; top:${actor.y}%; z-index:${getDepthIndex(actor.y, 9)};" data-cat-id="${cat.id}">
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

function renderCurrentOrders() {
  if (!els.orderList) return;
  const orderedCustomers = runtime.customers.filter((customer) => customer.status === "ordered");
  if (orderedCustomers.length === 0) {
    els.orderList.textContent = "대기 중";
    return;
  }

  const counts = orderedCustomers.reduce((map, customer) => {
    const item = getMenuItem(customer.order?.itemId);
    if (!item) return map;
    map[item.id] = (map[item.id] || 0) + 1;
    return map;
  }, {});

  els.orderList.innerHTML = Object.entries(counts).map(([itemId, count]) => {
    const item = MENU_ITEMS[itemId];
    return `<span class="order-chip">${item.emoji} ${item.name}${count > 1 ? ` x${count}` : ""}</span>`;
  }).join("");
}

function renderReadyShelf() {
  if (!els.readyShelf) return;
  if (runtime.readyItems.length === 0) {
    els.readyShelf.innerHTML = `<span class="shelf-label">완성 보관대</span>`;
    return;
  }

  els.readyShelf.innerHTML = runtime.readyItems.map((readyItem, index) => {
    const item = getMenuItem(readyItem.itemId);
    if (!item) return "";
    const quality = getQualityDef(readyItem.quality);
    return `
      <span class="ready-food ready-${item.category} food-${item.id} ${index % 2 ? "ready-offset" : ""}" title="${item.name} ${quality.label}">
        <span class="ready-food-icon" aria-hidden="true">
          <span class="food-cup css-object-part"></span>
          <span class="food-liquid css-object-part"></span>
          <span class="food-foam css-object-part"></span>
          <span class="food-plate css-object-part"></span>
          <span class="food-bread css-object-part"></span>
          <span class="food-straw css-object-part"></span>
          <span class="emoji-fallback">${item.emoji}</span>
        </span>
        <span class="ready-food-quality">${quality.label[0]}</span>
      </span>
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
    const label = upgrade.locked ? `Lv.${upgrade.unlockLevel}` : upgrade.maxed ? "최대" : `${formatNumber(upgrade.cost)}코인`;
    return `
      <article class="upgrade-item">
        <div class="upgrade-copy">
          <strong>${upgrade.name}</strong>
          <span>${upgrade.description}</span>
        </div>
        <button class="upgrade-button ${upgrade.maxed ? "maxed" : ""} ${upgrade.locked ? "locked" : ""}" type="button" data-upgrade-id="${upgrade.id}" ${disabled}>
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
  const machineKey = event.currentTarget?.dataset?.machineKey || "coffeeMachine";
  if (isActionLocked(`machine-${machineKey}`)) return;
  const machine = MACHINE_DATA[machineKey];
  if (!machine) return;

  if (runtime.miniGame) {
    openModal("coffeeModal");
    renderMiniGame();
    return;
  }

  if (!isMachineUnlocked(machineKey)) {
    showToast(`${machine.emoji} ${machine.name}은 Lv.${machine.unlockLevel}에 사용할 수 있습니다.`);
    return;
  }

  if (runtime.readyItems.length >= CONFIG.readyItemLimit) {
    showToast(`완성 음식은 최대 ${CONFIG.readyItemLimit}개까지 보관할 수 있습니다.`);
    return;
  }

  const item = findNextCraftableItem(machineKey);
  if (!item) {
    showToast(`${machine.emoji} ${machine.name}로 만들 주문이 아직 없습니다.`);
    return;
  }

  MiniGameManager.start(item.id);
}

function handleShowcaseClick(event) {
  event.preventDefault();
  if (isActionLocked("bakery-showcase")) return;
  const unlockedBread = getUnlockedMenuItems().filter((item) => item.category === "bread");
  const readyBreadCount = runtime.readyItems.filter((item) => getMenuItem(item.itemId)?.category === "bread").length;
  const menuText = unlockedBread.length > 0
    ? unlockedBread.map((item) => `${item.emoji} ${item.name}`).join(", ")
    : "Lv.2부터 토스트가 해금됩니다.";
  showToast(`베이커리 쇼케이스: ${menuText}${readyBreadCount ? ` · 완성 빵 ${readyBreadCount}개` : ""}`);
}

function updateBrewing(timestamp) {
  MiniGameManager.update(timestamp);
}

function updateMachineStatus() {
  Object.values(MACHINE_DATA).forEach((machine) => {
    const node = els[machine.element];
    const status = els[machine.statusElement];
    if (!node || !status) return;
    const locked = !isMachineUnlocked(machine.id);
    const active = runtime.miniGame?.machine === machine.id && !runtime.miniGame.finished;
    const pendingCount = getPendingOrderCountForMachine(machine.id);
    const readyCount = runtime.readyItems.filter((item) => getMenuItem(item.itemId)?.machine === machine.id).length;
    node.classList.toggle("locked", locked);
    node.classList.toggle("brewing", active);
    node.classList.toggle("ready", !active && readyCount > 0);
    if (locked) {
      status.textContent = `Lv.${machine.unlockLevel} 해금`;
    } else if (active) {
      status.textContent = getMiniGamePhaseLabel(runtime.miniGame);
    } else if (pendingCount > 0) {
      status.textContent = `${pendingCount}개 주문`;
    } else if (readyCount > 0) {
      status.textContent = `${readyCount}개 완성`;
    } else {
      status.textContent = "주문 대기";
    }
  });

  if (!runtime.miniGame || runtime.miniGame.machine !== "coffeeMachine") {
    els.machineProgressFill.style.width = "0%";
  }
}

const MiniGameManager = {
  start(itemId) {
    const item = getMenuItem(itemId);
    if (!item || !isMenuUnlocked(item.id) || !isMachineUnlocked(item.machine)) return;
    cleanupMiniGame();
    const game = {
      itemId: item.id,
      machine: item.machine,
      category: item.category,
      gameType: item.gameType,
      phase: "setup",
      pointer: 50,
      direction: 1,
      speed: getMachinePointerSpeed(item.machine),
      progress: 0,
      phaseStartedAt: 0,
      phaseEndsAt: 0,
      target: 50,
      gaugeKind: "step",
      scores: [],
      quality: null,
      lastUpdate: 0,
      finished: false
    };
    runtime.miniGame = game;
    runtime.coffeeMiniGame = game;
    runtime.isBrewing = true;
    runtime.brewStart = performance.now();

    if (item.category === "coffee") startCoffeeGame(game);
    if (item.category === "bread") startBreadGame(game);
    if (item.category === "juice") startJuiceGame(game);

    openModal("coffeeModal");
    renderMiniGame();
    updateMachineStatus();
    showMachineTutorial(item.machine);
    SoundManager.play(MACHINE_DATA[item.machine]?.sound);
    showToast(`${item.emoji} ${item.name} 제조를 시작합니다.`);
  },

  update(timestamp) {
    const game = runtime.miniGame;
    if (!game || game.finished || !isTimedPhase(game.phase)) return;

    const delta = Math.min(80, timestamp - (game.lastUpdate || timestamp));
    game.lastUpdate = timestamp;

    if (game.gaugeKind === "timing" || game.gaugeKind === "milk") {
      game.pointer += game.direction * game.speed * delta;
      if (game.pointer >= 100) {
        game.pointer = 100;
        game.direction = -1;
      }
      if (game.pointer <= 0) {
        game.pointer = 0;
        game.direction = 1;
      }
    } else {
      game.progress = clamp((timestamp - game.phaseStartedAt) / Math.max(1, game.phaseEndsAt - game.phaseStartedAt) * 100, 0, 100);
    }

    const activeProgress = game.gaugeKind === "timing" || game.gaugeKind === "milk"
      ? clamp((timestamp - game.phaseStartedAt) / Math.max(1, game.phaseEndsAt - game.phaseStartedAt) * 100, 0, 100)
      : game.progress;
    if (game.machine === "coffeeMachine") {
      els.machineProgressFill.style.width = `${activeProgress}%`;
    }
    updateMiniGameLive();

    if (timestamp >= game.phaseEndsAt) {
      completeActivePhase(true);
    }
  },

  primaryAction(event) {
    event?.preventDefault?.();
    const game = runtime.miniGame;
    if (!game) return;
    if (game.finished || game.phase === "complete") {
      closeCoffeeMiniGame(event);
      return;
    }

    if (game.phase === "beans") {
      setMiniGamePhase(game, "extractReady");
      showToast("원두를 넣었습니다.");
      return;
    }
    if (game.phase === "extractReady") {
      beginTimingPhase(game, "extracting", 50, getMiniGameDuration(game, "extracting"), "timing");
      return;
    }
    if (game.phase === "extracting") {
      completeActivePhase(false);
      return;
    }
    if (game.phase === "milkReady") {
      beginTimingPhase(game, "milk", 64, 5200, "milk");
      return;
    }
    if (game.phase === "milk") {
      completeActivePhase(false);
      return;
    }
    if (game.phase === "dough") {
      setMiniGamePhase(game, "ovenReady");
      return;
    }
    if (game.phase === "ovenReady") {
      beginProgressPhase(game, "baking", 66, getMiniGameDuration(game, "baking"), "baking");
      return;
    }
    if (game.phase === "baking") {
      completeActivePhase(false);
      return;
    }
    if (game.phase === "bread") {
      beginProgressPhase(game, "toasting", 58, getMiniGameDuration(game, "toasting"), "toast");
      return;
    }
    if (game.phase === "toasting") {
      completeActivePhase(false);
      return;
    }
    if (game.phase === "orange") {
      setMiniGamePhase(game, "extractJuice");
      return;
    }
    if (game.phase === "extractJuice") {
      beginProgressPhase(game, "pouring", 72, getMiniGameDuration(game, "pouring"), "pour");
      return;
    }
    if (game.phase === "pouring") {
      completeActivePhase(false);
      return;
    }
    if (game.phase === "strawberry") {
      setMiniGamePhase(game, "liquid");
      return;
    }
    if (game.phase === "liquid") {
      setMiniGamePhase(game, "blendReady");
      return;
    }
    if (game.phase === "blendReady") {
      beginProgressPhase(game, "blending", 62, getMiniGameDuration(game, "blending"), "blend");
      return;
    }
    if (game.phase === "blending") {
      completeActivePhase(false);
      return;
    }
    if (game.phase === "pourReady") {
      finishMiniGame(game, combineQualities(game.scores));
    }
  },

  secondaryAction(event) {
    event?.preventDefault?.();
    closeCoffeeMiniGame(event);
  }
};

function startCoffeeGame(game) {
  setMiniGamePhase(game, "beans");
}

function startBreadGame(game) {
  setMiniGamePhase(game, game.gameType === "croissant" ? "dough" : "bread");
}

function startJuiceGame(game) {
  setMiniGamePhase(game, game.gameType === "orangeJuice" ? "orange" : "strawberry");
}

function setMiniGamePhase(game, phase) {
  game.phase = phase;
  game.gaugeKind = "step";
  game.progress = 0;
  game.pointer = 50;
  game.lastUpdate = 0;
  game.phaseStartedAt = 0;
  game.phaseEndsAt = 0;
  renderMiniGame();
  updateMachineStatus();
}

function beginTimingPhase(game, phase, target, duration, gaugeKind) {
  const now = performance.now();
  game.phase = phase;
  game.target = target;
  game.pointer = 50;
  game.direction = Math.random() < 0.5 ? -1 : 1;
  game.speed = getMachinePointerSpeed(game.machine);
  game.gaugeKind = gaugeKind;
  game.phaseStartedAt = now;
  game.phaseEndsAt = now + duration;
  game.lastUpdate = now;
  runtime.brewStart = now;
  runtime.brewEnd = game.phaseEndsAt;
  renderMiniGame();
  updateMachineStatus();
}

function beginProgressPhase(game, phase, target, duration, gaugeKind) {
  const now = performance.now();
  game.phase = phase;
  game.target = target;
  game.progress = 0;
  game.gaugeKind = gaugeKind;
  game.phaseStartedAt = now;
  game.phaseEndsAt = now + duration;
  game.lastUpdate = now;
  runtime.brewStart = now;
  runtime.brewEnd = game.phaseEndsAt;
  renderMiniGame();
  updateMachineStatus();
}

function completeActivePhase(timedOut) {
  const game = runtime.miniGame;
  if (!game || !isTimedPhase(game.phase)) return;
  const value = game.gaugeKind === "timing" || game.gaugeKind === "milk" ? game.pointer : game.progress;
  const quality = calculateQuality(getQualityKindForPhase(game.phase), value, game.target, timedOut);
  game.scores.push(quality.key);

  if (game.phase === "extracting" && game.gameType === "cafeLatte") {
    setMiniGamePhase(game, "milkReady");
    return;
  }
  if (game.phase === "blending") {
    setMiniGamePhase(game, "pourReady");
    return;
  }

  finishMiniGame(game, combineQualities(game.scores));
}

function finishMiniGame(game, quality) {
  if (!game || game.finished) return;
  const item = getMenuItem(game.itemId);
  if (!item) return;
  game.finished = true;
  game.phase = "complete";
  game.quality = quality;
  runtime.isBrewing = false;
  runtime.brewStart = 0;
  runtime.brewEnd = 0;

  if (runtime.readyItems.length < CONFIG.readyItemLimit) {
    runtime.readyItems.push({
      itemId: item.id,
      category: item.category,
      quality: quality.key,
      createdAt: Date.now()
    });
  }
  syncReadyItemCount();
  els.machineProgressFill.style.width = "0%";
  showFloatingText(els.cafeStage, `${quality.label} ${item.emoji}`, getMachineFloatX(item.machine), getMachineFloatY(item.machine));
  showToast(`${quality.label} ${item.name} 완성! 보관대에 놓았습니다.`);
  SoundManager.play("success");
  renderMiniGame();
  renderReadyShelf();
  renderCurrentOrders();
  renderHud();
  saveGame();
}

function renderMiniGame() {
  const game = runtime.miniGame;
  if (!game) return;
  const item = getMenuItem(game.itemId);
  const quality = game.quality ? getQualityDef(game.quality) : null;
  els.coffeeConfirm.classList.add("hidden");
  els.coffeeMiniGameTitle.textContent = `${item.emoji} ${item.name} 제조`;
  els.coffeeMiniGameSubtitle.textContent = getMiniGameStepText(game, quality);
  els.miniGameIcon.textContent = item.emoji;
  els.miniGameVisual.dataset.category = item.category;
  els.miniGameVisual.dataset.phase = game.phase;
  els.coffeeStream.classList.toggle("running", game.phase === "extracting" || game.phase === "pouring");
  els.coffeeResultBadge.textContent = quality?.label || (isTimedPhase(game.phase) ? "PLAY" : "READY");
  els.coffeeResultBadge.dataset.quality = quality?.key || "";
  renderMiniGameSteps(game);
  els.miniGameBody.innerHTML = getMiniGameBodyMarkup(game, quality);
  els.miniGameActionButton.textContent = getMiniGameActionLabel(game);
  els.miniGameSecondaryButton.classList.toggle("hidden", game.phase !== "complete");
  updateMiniGameLive();
}

function renderMiniGameSteps(game) {
  const steps = getMiniGameSteps(game);
  const activeIndex = steps.findIndex((step) => step.phases.includes(game.phase));
  els.miniGameSteps.style.gridTemplateColumns = `repeat(${steps.length}, minmax(0, 1fr))`;
  els.miniGameSteps.innerHTML = steps.map((step, index) => {
    const done = activeIndex === -1 ? game.phase === "complete" : index < activeIndex;
    const active = index === activeIndex || (game.phase === "complete" && index === steps.length - 1);
    return `<span class="brew-step ${active ? "active" : ""} ${done ? "done" : ""}">${index + 1} ${step.label}</span>`;
  }).join("");
}

function getMiniGameBodyMarkup(game, quality) {
  if (game.phase === "complete") {
    return `
      <div class="mini-finish">
        <div class="finished-cup" aria-hidden="true">${getMenuItem(game.itemId).emoji}</div>
        <div>
          <h3>${quality.label} 완성!</h3>
          <p>${getQualityText(quality)}</p>
        </div>
      </div>
    `;
  }

  if (game.gaugeKind === "timing" || game.gaugeKind === "milk") {
    return `
      <div class="timing-gauge" aria-label="타이밍 게이지">
        <div class="gauge-zones" aria-hidden="true">
          <span class="zone red"></span>
          <span class="zone yellow"></span>
          <span class="zone green"></span>
          <span class="zone yellow"></span>
          <span class="zone red"></span>
        </div>
        <span id="miniPointer" class="timing-pointer"></span>
      </div>
      <div class="extraction-progress" aria-hidden="true">
        <span id="miniProgressFill"></span>
      </div>
      <p>${game.gaugeKind === "milk" ? "우유 양이 목표 지점에 가까울 때 멈추세요." : "포인터가 초록 영역에 올 때 멈추세요."}</p>
    `;
  }

  if (game.gaugeKind === "baking") {
    return `
      <div class="bake-gauge" aria-label="굽기 게이지">
        <span class="bake-zone under">덜 익음</span>
        <span class="bake-zone ideal">적당함</span>
        <span class="bake-zone burnt">탐</span>
        <span id="miniBakePointer" class="bake-pointer"></span>
      </div>
      <p>오븐 안의 빵이 적당한 영역에 들어오면 꺼내기를 누르세요.</p>
    `;
  }

  if (game.gaugeKind === "toast") {
    return `
      <div class="toast-game">
        <span id="toastPreview" class="toast-preview" aria-hidden="true">🍞</span>
        <div class="toast-meter" aria-hidden="true"><span id="miniProgressFill"></span></div>
        <div class="toast-labels"><span>연함</span><span>황금색</span><span>진한색</span></div>
      </div>
      <p>토스트가 황금색에 가까워졌을 때 멈추세요.</p>
    `;
  }

  if (game.gaugeKind === "pour") {
    return `
      <div class="pour-game">
        <div class="pour-cup" aria-hidden="true"><span id="cupFill"></span><i></i></div>
        <div class="pour-target" aria-hidden="true"></div>
      </div>
      <p>컵의 적정선에 맞게 주스 양을 멈추세요.</p>
    `;
  }

  if (game.gaugeKind === "blend") {
    return `
      <div class="blend-game">
        <span class="blend-jar" aria-hidden="true">🍓</span>
        <div class="blend-meter" aria-hidden="true"><span id="miniProgressFill"></span></div>
        <div class="toast-labels"><span>짧음</span><span>부드러움</span><span>과함</span></div>
      </div>
      <p>블렌딩 시간이 적당할 때 멈추세요.</p>
    `;
  }

  return `
    <div class="mini-step-copy">
      <div class="bean-drop" aria-hidden="true">${getSetupIcon(game.phase)}</div>
      <div>
        <h3>${getMiniGamePhaseLabel(game)}</h3>
        <p>${getMiniGameStepText(game)}</p>
      </div>
    </div>
  `;
}

function updateMiniGameLive() {
  const game = runtime.miniGame;
  if (!game) return;
  const progress = isTimedPhase(game.phase)
    ? clamp((performance.now() - game.phaseStartedAt) / Math.max(1, game.phaseEndsAt - game.phaseStartedAt) * 100, 0, 100)
    : 0;
  const pointer = document.getElementById("miniPointer");
  if (pointer) pointer.style.left = `${game.pointer}%`;
  const progressFill = document.getElementById("miniProgressFill");
  if (progressFill) progressFill.style.width = `${game.gaugeKind === "timing" || game.gaugeKind === "milk" ? progress : game.progress}%`;
  const bakePointer = document.getElementById("miniBakePointer");
  if (bakePointer) bakePointer.style.left = `${game.progress}%`;
  const cupFill = document.getElementById("cupFill");
  if (cupFill) cupFill.style.height = `${game.progress}%`;
  const toastPreview = document.getElementById("toastPreview");
  if (toastPreview) toastPreview.style.filter = `sepia(${game.progress / 100}) saturate(${1 + game.progress / 90}) brightness(${1.12 - game.progress / 280})`;
}

function getMiniGameSteps(game) {
  const item = getMenuItem(game.itemId);
  if (item.gameType === "americano") {
    return [
      { label: "원두", phases: ["beans"] },
      { label: "추출", phases: ["extractReady", "extracting"] },
      { label: "완성", phases: ["complete"] }
    ];
  }
  if (item.gameType === "cafeLatte") {
    return [
      { label: "원두", phases: ["beans"] },
      { label: "추출", phases: ["extractReady", "extracting"] },
      { label: "우유", phases: ["milkReady", "milk"] },
      { label: "완성", phases: ["complete"] }
    ];
  }
  if (item.gameType === "croissant") {
    return [
      { label: "반죽", phases: ["dough"] },
      { label: "오븐", phases: ["ovenReady", "baking"] },
      { label: "완성", phases: ["complete"] }
    ];
  }
  if (item.gameType === "toast") {
    return [
      { label: "빵", phases: ["bread"] },
      { label: "굽기", phases: ["toasting"] },
      { label: "완성", phases: ["complete"] }
    ];
  }
  if (item.gameType === "orangeJuice") {
    return [
      { label: "오렌지", phases: ["orange"] },
      { label: "추출", phases: ["extractJuice"] },
      { label: "컵", phases: ["pouring"] },
      { label: "완성", phases: ["complete"] }
    ];
  }
  return [
    { label: "딸기", phases: ["strawberry"] },
    { label: "액체", phases: ["liquid"] },
    { label: "블렌딩", phases: ["blendReady", "blending"] },
    { label: "따르기", phases: ["pourReady"] },
    { label: "완성", phases: ["complete"] }
  ];
}

function getMiniGameActionLabel(game) {
  const labels = {
    beans: "원두 넣기",
    extractReady: "추출 시작",
    extracting: "타이밍 맞추기",
    milkReady: "우유 넣기",
    milk: "우유 양 맞추기",
    dough: "반죽 준비",
    ovenReady: "오븐에 넣기",
    baking: "꺼내기",
    bread: "빵 넣기",
    toasting: "멈추기",
    orange: "오렌지 선택",
    extractJuice: "주스 추출",
    pouring: "컵 채우기 멈추기",
    strawberry: "딸기 넣기",
    liquid: "우유 또는 물 선택",
    blendReady: "블렌딩 시작",
    blending: "블렌딩 멈추기",
    pourReady: "컵에 따르기",
    complete: "닫기"
  };
  return labels[game.phase] || "진행";
}

function getMiniGamePhaseLabel(game) {
  const labels = {
    beans: "원두 준비",
    extractReady: "추출 준비",
    extracting: "추출 중",
    milkReady: "우유 준비",
    milk: "우유 양 맞추기",
    dough: "반죽 준비",
    ovenReady: "오븐 예열",
    baking: "굽는 중",
    bread: "빵 넣기",
    toasting: "굽는 중",
    orange: "오렌지 선택",
    extractJuice: "주스 추출",
    pouring: "컵 채우기",
    strawberry: "딸기 넣기",
    liquid: "액체 선택",
    blendReady: "블렌딩 준비",
    blending: "블렌딩 중",
    pourReady: "컵에 따르기",
    complete: "완성"
  };
  return labels[game?.phase] || "제조 중";
}

function getMiniGameStepText(game, quality) {
  if (quality) return `${quality.label} 품질로 완성되었습니다. 손님 주문과 맞으면 전달할 수 있습니다.`;
  const text = {
    beans: "주문에 맞는 원두를 넣고 추출을 준비합니다.",
    extractReady: "추출을 시작한 뒤 초록 영역에서 멈추세요.",
    extracting: "포인터가 초록 영역에 올 때 타이밍을 맞추세요.",
    milkReady: "라떼에 들어갈 우유를 준비합니다.",
    milk: "우유 양이 목표 영역에 가까울 때 멈추세요.",
    dough: "크루아상 반죽을 준비합니다.",
    ovenReady: "반죽을 오븐에 넣고 굽기 타이밍을 기다립니다.",
    baking: "덜 익음, 적당함, 탐 영역 중 적당함에서 꺼내세요.",
    bread: "토스트용 빵을 넣습니다.",
    toasting: "빵 색이 황금색에 가까워졌을 때 멈추세요.",
    orange: "신선한 오렌지를 선택합니다.",
    extractJuice: "오렌지를 착즙하고 컵 채우기를 준비합니다.",
    pouring: "컵의 적정선에 맞게 주스 양을 멈추세요.",
    strawberry: "딸기를 블렌더에 넣습니다.",
    liquid: "부드럽게 만들 우유 또는 물을 선택합니다.",
    blendReady: "블렌딩 시간을 맞출 준비가 되었습니다.",
    blending: "너무 짧거나 길지 않게 블렌딩 시간을 맞추세요.",
    pourReady: "완성된 딸기 주스를 컵에 따릅니다."
  };
  return text[game.phase] || "메뉴를 준비하세요.";
}

function getQualityText(quality) {
  if (quality.key === "perfect") return "팁 가능성과 만족도, 추가 경험치가 올라갑니다.";
  if (quality.key === "good") return "기본 판매가와 기본 경험치를 받을 수 있습니다.";
  return "판매는 가능하지만 추가 팁이나 만족도 보너스는 없습니다.";
}

function getSetupIcon(phase) {
  const icons = {
    beans: "🫘",
    milkReady: "🥛",
    dough: "🥐",
    ovenReady: "🔥",
    bread: "🍞",
    orange: "🍊",
    extractJuice: "🧃",
    strawberry: "🍓",
    liquid: "🥛",
    blendReady: "🍹",
    pourReady: "🥤"
  };
  return icons[phase] || "✨";
}

function isTimedPhase(phase) {
  return ["extracting", "milk", "baking", "toasting", "pouring", "blending"].includes(phase);
}

function getQualityKindForPhase(phase) {
  if (phase === "extracting") return "coffee";
  if (phase === "milk") return "milk";
  if (phase === "baking") return "baking";
  if (phase === "toasting") return "toast";
  if (phase === "pouring") return "pour";
  if (phase === "blending") return "blend";
  return "coffee";
}

function calculateQuality(kind, value, target = 50, timedOut = false) {
  const settings = getQualitySettings(kind);
  const distance = Math.abs(value - target);
  if (!timedOut && distance <= settings.perfect) return getQualityDef("perfect");
  if (distance <= settings.good) return getQualityDef("good");
  return getQualityDef("okay");
}

function combineQualities(keys) {
  if (keys.length > 0 && keys.every((key) => key === "perfect")) return getQualityDef("perfect");
  if (keys.some((key) => key === "okay")) return getQualityDef("okay");
  return getQualityDef("good");
}

function getQualitySettings(kind) {
  const base = CONFIG.qualityWindows[kind] || CONFIG.qualityWindows.coffee;
  let perfect = base.perfect;
  let good = base.good;
  if (kind === "coffee" || kind === "milk") {
    perfect += (state.upgrades.coffeeMachine - 1) * 1.4;
    good += (state.upgrades.coffeeMachine - 1) * 0.4;
  }
  if (kind === "baking" || kind === "toast") {
    perfect += (state.upgrades.oven - 1) * 1.6;
    good += (state.upgrades.oven - 1) * 0.5;
  }
  if (kind === "pour" || kind === "blend") {
    perfect += (state.upgrades.blender - 1) * 1.6;
    good += (state.upgrades.blender - 1) * 0.5;
  }
  return {
    perfect: clamp(perfect, 6, 22),
    good: clamp(good, 18, 36)
  };
}

function getCoffeeMiniGameSettings() {
  const level = Math.max(1, state.upgrades.coffeeMachine);
  const equipmentMultiplier = getOwnedBonus("brewMultiplier", true);
  const quality = getQualitySettings("coffee");
  return {
    perfectWindow: quality.perfect * 2,
    pointerSpeed: Math.max(CONFIG.coffeePointerMinimumSpeed, CONFIG.coffeePointerBaseSpeed * Math.pow(0.94, level - 1) * equipmentMultiplier),
    duration: Math.max(5200, CONFIG.coffeeMiniGameDuration * Math.pow(0.97, level - 1))
  };
}

function getMachinePointerSpeed(machine) {
  if (machine === "coffeeMachine") return getCoffeeMiniGameSettings().pointerSpeed;
  if (machine === "oven") return Math.max(0.026, 0.038 * Math.pow(0.96, state.upgrades.oven - 1));
  if (machine === "blender") return Math.max(0.026, 0.04 * Math.pow(0.96, state.upgrades.blender - 1));
  return CONFIG.coffeePointerBaseSpeed;
}

function getMiniGameDuration(game, phase) {
  const item = getMenuItem(game.itemId);
  if (phase === "extracting") return getCoffeeMiniGameSettings().duration + (item.gameType === "cafeLatte" ? 800 : 0);
  if (phase === "baking") return Math.max(6000, CONFIG.bakingDuration * Math.pow(0.98, state.upgrades.oven - 1));
  if (phase === "toasting") return Math.max(4400, CONFIG.toastDurationMs * Math.pow(0.98, state.upgrades.oven - 1));
  if (phase === "pouring") return Math.max(4300, CONFIG.pourDuration * Math.pow(0.98, state.upgrades.blender - 1));
  if (phase === "blending") return Math.max(5200, CONFIG.blendDuration * Math.pow(0.98, state.upgrades.blender - 1));
  return item.baseTime;
}

function cancelCoffeeMiniGame(event) {
  event?.preventDefault?.();
  const game = runtime.miniGame;
  if (!game) {
    closeModal("coffeeModal");
    return;
  }
  if (isTimedPhase(game.phase)) {
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
  cleanupMiniGame();
  closeModal("coffeeModal");
  updateMachineStatus();
  showToast("제조를 취소했습니다.");
}

function closeCoffeeMiniGame(event) {
  event?.preventDefault?.();
  const phase = runtime.miniGame?.phase;
  if (isTimedPhase(phase)) {
    cancelCoffeeMiniGame(event);
    return;
  }
  if (runtime.miniGame && phase !== "complete") showToast("제조를 취소했습니다.");
  cleanupMiniGame();
  closeModal("coffeeModal");
  updateMachineStatus();
}

function cleanupMiniGame() {
  runtime.miniGame = null;
  runtime.coffeeMiniGame = null;
  runtime.isBrewing = false;
  runtime.brewStart = 0;
  runtime.brewEnd = 0;
  if (els.machineProgressFill) els.machineProgressFill.style.width = "0%";
}

function syncReadyItemCount() {
  runtime.readyItems = sanitizeReadyItems(runtime.readyItems);
  runtime.readyDrinkQueue = runtime.readyItems.filter((item) => getMenuItem(item.itemId)?.category === "coffee");
  runtime.readyDrinks = runtime.readyDrinkQueue.length;
  state.readyItems = sanitizeReadyItems(runtime.readyItems);
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
    customer.patienceEndsAt = customer.orderTakenAt + getCustomerPatience(customer);
    showFloatingText(node, getOrderShortText(customer.order), 50, 5);
    showToast(`${getOrderShortText(customer.order)} 주문을 받았습니다.`);
    renderCustomers();
    renderCurrentOrders();
    renderHud();
    return;
  }

  if (customer.status === "ordered") {
    if (runtime.readyItems.length <= 0) {
      showToast("완성된 메뉴가 없습니다. 주문에 맞는 장비를 눌러 제작하세요.");
      return;
    }
    const readyIndex = runtime.readyItems.findIndex((item) => item.itemId === customer.order?.itemId);
    if (readyIndex === -1) {
      showToast("주문한 메뉴가 아니에요!");
      return;
    }
    const readyItem = runtime.readyItems.splice(readyIndex, 1)[0];
    syncReadyItemCount();
    customer.status = "served";
    customer.servedItem = readyItem;
    customer.drinkQuality = getQualityDef(readyItem.quality);
    customer.servedAt = performance.now();
    const menuItem = getMenuItem(readyItem.itemId);
    const quality = getQualityDef(readyItem.quality);
    customer.payAt = customer.servedAt + randomBetween(3600, 5600) * (quality.consumeTimeMultiplier || 1);
    showFloatingText(node, `${quality.label} 전달`, 50, 0);
    showToast(`손님에게 ${quality.label} ${menuItem.name}을 전달했습니다.`);
    SoundManager.play("serve");
    renderCustomers();
    renderReadyShelf();
    renderCurrentOrders();
    renderHud();
    saveGame();
    return;
  }

  if (customer.status === "served") {
    showToast("손님이 메뉴를 즐기는 중입니다.");
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

    if (customer.status === "ordered" && customer.patienceEndsAt && timestamp >= customer.patienceEndsAt) {
      customer.status = "leaving";
      customer.leaveAt = timestamp + 700;
      showToast(`${getOrderShortText(customer.order)} 손님이 오래 기다려 떠났습니다.`);
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
    renderCurrentOrders();
    renderHud();
  }
}

function completePayment(customer, timestamp) {
  const reward = calculateReward(customer);
  addCoins(reward.total);
  state.totalSales += 1;
  const menuItem = getMenuItem(customer.servedItem?.itemId || customer.order?.itemId);
  const quality = getQualityDef(customer.servedItem?.quality || customer.drinkQuality?.key);
  addXp((menuItem?.xp || 24) + (customer.lucky ? 10 : 0) + (quality.xpBonus || 0));
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
  renderCurrentOrders();
  saveGame();
}

function maybeSpawnCustomer(timestamp) {
  if (timestamp < runtime.nextCustomerAt) return;
  const spawned = spawnCustomer();
  runtime.nextCustomerAt = timestamp + (spawned ? getCustomerInterval() : CONFIG.fullCafeRetryDelay);
}

function spawnCustomer() {
  if (getActiveOrderCount() >= getActiveOrderLimit()) return false;
  const openTable = findOpenTableIndex();
  if (openTable === -1) return false;

  const item = pick(getUnlockedMenuItems());
  const order = createCustomerOrder(item);
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
      icon: getMenuItem(customer.order?.itemId)?.emoji || "🧾",
      label: "주문 대기",
      hint: "손님 선택",
      aria: `${getOrderShortText(customer.order)} 주문 받기`
    },
    ordered: {
      icon: "⏳",
      label: "메뉴 대기",
      hint: getMachineShortName(getMenuItem(customer.order?.itemId)?.machine),
      aria: `${getOrderShortText(customer.order)} 전달 대기 손님`
    },
    served: {
      icon: `${getMenuItem(customer.servedItem?.itemId || customer.order?.itemId)?.emoji || "🍽"}😊`,
      label: "즐기는 중",
      hint: "만족",
      aria: "메뉴를 즐기는 손님"
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

function getMenuItem(itemId) {
  return MENU_ITEMS[itemId] || null;
}

function getQualityDef(key) {
  return QUALITY_DEFS[key] || QUALITY_DEFS.good;
}

function createCustomerOrder(item) {
  return {
    itemId: item.id,
    category: item.category,
    quality: null
  };
}

function getOrderShortText(order) {
  const item = getMenuItem(order?.itemId);
  return item ? `${item.emoji} ${item.name}` : "주문";
}

function getUnlockedMenuItems() {
  const ids = sanitizeMenuIds(state.unlockedMenus, getMenuIdsUnlockedByLevel(state.level));
  const items = ids.map((id) => MENU_ITEMS[id]).filter(Boolean);
  return items.length > 0 ? items : [MENU_ITEMS.americano];
}

function getMenuIdsUnlockedByLevel(level) {
  return Object.values(MENU_ITEMS)
    .filter((item) => item.unlockLevel <= level)
    .sort((a, b) => a.unlockLevel - b.unlockLevel)
    .map((item) => item.id);
}

function isMenuUnlocked(itemId) {
  const item = getMenuItem(itemId);
  return Boolean(item && item.unlockLevel <= state.level && state.unlockedMenus.includes(item.id));
}

function updateMenuUnlocks(showMessages) {
  const before = new Set(state.unlockedMenus || []);
  const unlocked = getMenuIdsUnlockedByLevel(state.level);
  state.unlockedMenus = sanitizeMenuIds([...before, ...unlocked], unlocked).filter((id) => unlocked.includes(id));
  if (!showMessages) return;
  unlocked.forEach((itemId) => {
    if (before.has(itemId)) return;
    const item = MENU_ITEMS[itemId];
    showLevelUpMessage(`🎉 새로운 메뉴!\n${item.emoji} ${item.name}`);
  });
  renderHud();
  renderCurrentOrders();
  updateMachineStatus();
}

function showLevelUpMessage(message) {
  els.levelUpToast.textContent = message;
  els.levelUpToast.classList.remove("hidden");
  window.setTimeout(() => {
    els.levelUpToast.classList.add("hidden");
  }, 1900);
}

function isMachineUnlocked(machineKey) {
  const machine = MACHINE_DATA[machineKey];
  if (!machine) return false;
  return state.level >= machine.unlockLevel && state.ownedEquipment.includes(getEquipmentIdForMachine(machineKey));
}

function getEquipmentIdForMachine(machineKey) {
  if (machineKey === "coffeeMachine") return "basicMachine";
  return machineKey;
}

function findNextCraftableItem(machineKey) {
  const ordered = runtime.customers
    .filter((customer) => customer.status === "ordered")
    .map((customer) => getMenuItem(customer.order?.itemId))
    .filter((item) => item && item.machine === machineKey && isMenuUnlocked(item.id));
  if (ordered.length === 0) return null;

  const orderedCounts = countBy(ordered.map((item) => item.id));
  const readyCounts = countBy(runtime.readyItems.map((item) => item.itemId));
  return ordered.find((item) => (readyCounts[item.id] || 0) < (orderedCounts[item.id] || 0)) || null;
}

function getPendingOrderCountForMachine(machineKey) {
  return runtime.customers.filter((customer) => {
    if (customer.status !== "ordered") return false;
    return getMenuItem(customer.order?.itemId)?.machine === machineKey;
  }).length;
}

function getActiveOrderCount() {
  return runtime.customers.filter((customer) => (
    customer.status === "waitingOrder" ||
    customer.status === "ordered" ||
    customer.status === "served" ||
    customer.status === "readyToPay"
  )).length;
}

function getActiveOrderLimit() {
  return CONFIG.activeOrderLimits.reduce((max, entry) => (
    state.level >= entry.level ? entry.max : max
  ), CONFIG.activeOrderLimits[0].max);
}

function getCustomerPatience(customer) {
  const item = getMenuItem(customer.order?.itemId);
  return CONFIG.baseCustomerPatience + (item?.difficulty || 1) * CONFIG.patiencePerDifficulty;
}

function getMachineShortName(machineKey) {
  return MACHINE_DATA[machineKey]?.name || "제작";
}

function getMenuSalePrice(item) {
  if (!item) return 62;
  return Math.round(item.price * (1 + getCategoryUpgradePriceBonus(item.category)));
}

function getCategoryUpgradePriceBonus(category) {
  if (category === "bread") return (state.upgrades.oven - 1) * 0.05;
  if (category === "juice") return (state.upgrades.blender - 1) * 0.05;
  return 0;
}

function getMachineFloatX(machineKey) {
  if (machineKey === "oven") return 22;
  if (machineKey === "blender") return 83;
  return 11;
}

function getMachineFloatY(machineKey) {
  if (machineKey === "oven") return 36;
  if (machineKey === "blender") return 32;
  return 24;
}

function countBy(items) {
  return items.reduce((map, item) => {
    map[item] = (map[item] || 0) + 1;
    return map;
  }, {});
}

function hydrateRuntimeReadyItems() {
  runtime.readyItems = sanitizeReadyItems(state.readyItems);
  syncReadyItemCount();
}

function sanitizeMenuIds(value, fallback) {
  const ids = Array.isArray(value) ? value : fallback;
  const knownIds = new Set(Object.keys(MENU_ITEMS));
  return [...new Set(ids.filter((id) => knownIds.has(id)))];
}

function sanitizeReadyItems(value) {
  const items = Array.isArray(value) ? value : [];
  return items
    .map((item) => ({
      itemId: item.itemId || (item.category === "coffee" ? "americano" : ""),
      category: item.category || getMenuItem(item.itemId)?.category || "coffee",
      quality: getQualityDef(item.quality || item.key)?.key,
      createdAt: Number(item.createdAt) || Date.now()
    }))
    .filter((item) => getMenuItem(item.itemId))
    .slice(-CONFIG.readyItemLimit);
}

function migrateReadyDrinks(value) {
  if (!Array.isArray(value)) return [];
  return value.map((drink) => ({
    itemId: "americano",
    category: "coffee",
    quality: drink.key || drink.quality || "good",
    createdAt: drink.createdAt || Date.now()
  }));
}

function showMachineTutorial(machineKey) {
  if (state.tutorialSeen[machineKey]) return;
  if (machineKey === "coffeeMachine") {
    state.tutorialSeen[machineKey] = true;
    return;
  }
  const messages = {
    oven: "🥐 오븐이 해금되었습니다! 빵을 넣고 적절한 굽기 타이밍에 버튼을 눌러주세요.",
    blender: "🍹 블렌더가 해금되었습니다! 주스는 컵 양이나 블렌딩 시간을 맞춰 완성합니다."
  };
  if (messages[machineKey]) {
    showToast(messages[machineKey]);
    state.tutorialSeen[machineKey] = true;
    saveGame();
  }
}

function hydrateObjectAssets(root = document) {
  if (typeof Image === "undefined") return;
  root.querySelectorAll("[data-asset]:not(.asset-checked)").forEach((node) => {
    const path = node.dataset.asset;
    node.classList.add("asset-checked");
    if (!path) return;
    const image = new Image();
    image.onload = () => {
      node.classList.add("asset-loaded");
      const sprite = node.querySelector(".object-sprite, .showcase-sprite");
      if (sprite) sprite.style.backgroundImage = `url("${path}")`;
    };
    image.onerror = () => {
      node.classList.add("asset-missing");
    };
    image.src = path;
  });
}

function getDepthIndex(y, base = 1) {
  return base + Math.round(y * 2);
}

const SoundManager = {
  enabled: false,
  sounds: {
    "coffee-brew": "./assets/sounds/coffee-brew.mp3",
    oven: "./assets/sounds/oven.mp3",
    toast: "./assets/sounds/toast.mp3",
    blender: "./assets/sounds/blender.mp3",
    "juice-pour": "./assets/sounds/juice-pour.mp3",
    order: "./assets/sounds/order.mp3",
    serve: "./assets/sounds/serve.mp3",
    success: "./assets/sounds/success.mp3"
  },
  cache: {},
  play(name) {
    if (!this.enabled) return;
    const path = this.sounds[name];
    if (!path || typeof Audio === "undefined") return;
    try {
      const audio = this.cache[name] || new Audio(path);
      this.cache[name] = audio;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch (error) {
      if (DEBUG_MODE) console.warn("Sound could not play.", name, error);
    }
  }
};

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
    node.style.zIndex = getDepthIndex(actor.y, 9);
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
  if (upgradeId === "oven") state.upgrades.oven += 1;
  if (upgradeId === "blender") state.upgrades.blender += 1;
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
      maxed: state.upgrades.tables >= MAX_TABLES,
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
      id: "oven",
      name: "오븐 업그레이드",
      cost: getUpgradeCost("oven"),
      disabled: state.level < MACHINE_DATA.oven.unlockLevel,
      locked: state.level < MACHINE_DATA.oven.unlockLevel,
      unlockLevel: MACHINE_DATA.oven.unlockLevel,
      description: `Lv.${state.upgrades.oven} · 빵 Perfect 구간 증가 · 빵 가격 +${Math.round(getCategoryUpgradePriceBonus("bread") * 100)}%`
    },
    {
      id: "blender",
      name: "블렌더 업그레이드",
      cost: getUpgradeCost("blender"),
      disabled: state.level < MACHINE_DATA.blender.unlockLevel,
      locked: state.level < MACHINE_DATA.blender.unlockLevel,
      unlockLevel: MACHINE_DATA.blender.unlockLevel,
      description: `Lv.${state.upgrades.blender} · 주스 Perfect 구간 증가 · 주스 가격 +${Math.round(getCategoryUpgradePriceBonus("juice") * 100)}%`
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
  if (type === "oven") return Math.round(340 * Math.pow(state.upgrades.oven, 1.36));
  if (type === "blender") return Math.round(360 * Math.pow(state.upgrades.blender, 1.36));
  if (type === "interior") return Math.round(390 * Math.pow(state.upgrades.interior, 1.42));
  if (type === "visitSpeed") return Math.round(320 * Math.pow(state.upgrades.visitSpeed, 1.34));
  return 9999;
}

function getCustomerInterval() {
  const upgradeMultiplier = Math.pow(0.9, state.upgrades.visitSpeed - 1);
  const catMultiplier = getOwnedBonus("visitSpeedMultiplier", true);
  const influencerMultiplier = performance.now() < runtime.influencerUntil ? 0.55 : 1;
  const craftingMultiplier = runtime.miniGame ? CONFIG.craftingSpawnSlowdown : 1;
  const baseDelay = randomBetween(CONFIG.customerSpawnMin, CONFIG.customerSpawnMax);
  return Math.max(CONFIG.minimumSpawnDelay, baseDelay * upgradeMultiplier * catMultiplier * influencerMultiplier * craftingMultiplier);
}

function calculateReward(customer) {
  const menuItem = getMenuItem(customer.servedItem?.itemId || customer.order?.itemId);
  const quality = getQualityDef(customer.servedItem?.quality || customer.drinkQuality?.key);
  const base = getMenuSalePrice(menuItem);
  const interiorBonus = 1 + (state.upgrades.interior - 1) * 0.12;
  const revenueBonus = 1 + getOwnedBonus("revenueBonus", false);
  const satisfactionBonus = 1 + getOwnedBonus("satisfactionBonus", false);
  const qualitySatisfaction = 1 + (quality.satisfactionBonus || 0);
  const luckyBonus = customer.lucky ? 1.25 : 1;
  const amount = Math.round(base * interiorBonus * revenueBonus * satisfactionBonus * qualitySatisfaction * luckyBonus);
  const tipChance = clamp(0.12 + getOwnedBonus("tipChanceBonus", false) + (quality.tipBonus || 0) + (customer.lucky ? 0.62 : 0), 0, 0.92);
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
    updateMenuUnlocks(true);
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
  runtime.readyItems = [];
  runtime.isBrewing = false;
  runtime.coffeeMiniGame = null;
  runtime.miniGame = null;
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
