let backgroundSprite; // 儲存背景圖片
let backgroundOffset = 0; // 儲存背景目前的水平偏移量
let backgroundDisplayWidth; // 儲存單張背景顯示寬度
let backgroundDisplayHeight; // 儲存單張背景顯示高度
let backgroundTotalWidth; // 儲存三張背景的總寬度

let characterSprite; // 儲存角色一的精靈圖
let walkSprite; // 儲存角色一的走路精靈圖
let magicSprite; // 儲存角色一的施法精靈圖
let magicEffectSprite; // 儲存角色一的魔法特效精靈圖

let characterX; // 儲存角色一目前的水平中心位置
let isWalking = false; // 記錄角色是否已切換為走路動畫
let facingDirection = 1; // 記錄角色朝向（1 為右，-1 為左）
let isCasting = false; // 記錄角色是否正在播放施法動畫
let magicStartFrame = 0; // 記錄施法動畫開始時的畫面計數
let magicDirection = 1; // 記錄施法時鎖定的方向
let spaceIsDown = false; // 記錄空白鍵是否已按住以避免重複觸發
let activeEffects = []; // 儲存目前畫面上飛行中的魔法特效

const frameCountInSprite = 10; // 設定站立精靈圖包含的影格數
const frameWidth = 139.5; // 設定站立動畫每格寬度
const frameHeight = 196; // 設定站立動畫每格高度

const walkFrameCount = 9; // 設定走路精靈圖包含的影格數
const walkFrameWidth = 1246 / walkFrameCount; // 計算走路動畫每格寬度
const walkFrameHeight = 198; // 設定走路動畫每格高度

const magicFrameCount = 4; // 設定施法精靈圖包含的影格數
const magicFrameWidth = 1039 / magicFrameCount; // 計算施法動畫每格寬度
const magicFrameHeight = 146; // 設定施法動畫每格高度

const effectFrameCount = 5; // 設定魔法特效精靈圖包含的影格數
const effectFrameWidth = 740 / effectFrameCount; // 計算魔法特效每格寬度
const effectFrameHeight = 19; // 設定魔法特效每格高度

const framesPerStep = 8; // 設定動畫每隔幾個畫面更新一格

function preload() {
  backgroundSprite = loadImage("bg/1.png");

  characterSprite = loadImage("1/stop/stop.png");
  walkSprite = loadImage("1/walk/walk.png");
  magicSprite = loadImage("1/magic/magic.png");
  magicEffectSprite = loadImage("1/magic_effect/magic_effect.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  imageMode(CORNER);

  characterX = (width * 2) / 3;

  updateBackgroundSize();

  frameRate(60);
}

function updateBackgroundSize() {
  // 使用 cover 方式計算背景大小，讓背景完整填滿畫布
  const scaleX = width / backgroundSprite.width;
  const scaleY = height / backgroundSprite.height;
  const backgroundScale = max(scaleX, scaleY);

  backgroundDisplayWidth = backgroundSprite.width * backgroundScale;
  backgroundDisplayHeight = backgroundSprite.height * backgroundScale;

  // 三張背景圖片水平串接
  backgroundTotalWidth = backgroundDisplayWidth * 3;

  // 限制背景偏移量，避免超出可滾動範圍
  backgroundOffset = constrain(
    backgroundOffset,
    -(backgroundTotalWidth - width),
    0
  );
}

function drawBackground() {
  // 先用天空藍填滿畫面，避免背景圖片外露
  background("#87CEEB");

  // 依序繪製三張相同背景圖片
  image(
    backgroundSprite,
    backgroundOffset,
    0,
    backgroundDisplayWidth,
    backgroundDisplayHeight
  );

  image(
    backgroundSprite,
    backgroundOffset + backgroundDisplayWidth,
    0,
    backgroundDisplayWidth,
    backgroundDisplayHeight
  );

  image(
    backgroundSprite,
    backgroundOffset + backgroundDisplayWidth * 2,
    0,
    backgroundDisplayWidth,
    backgroundDisplayHeight
  );
}

function draw() {
  const movingRight = keyIsDown(RIGHT_ARROW);
  const movingLeft = keyIsDown(LEFT_ARROW);

  const movementStep = constrain(width * 0.004, 2, 8);

  // 判斷目前背景是否已經到達左右邊界
  const backgroundAtLeftEdge = backgroundOffset >= 0;
  const backgroundAtRightEdge =
    backgroundOffset <= -(backgroundTotalWidth - width);

  if (movingRight) {
    isWalking = true;
    facingDirection = 1;

    // 尚未到背景最右側時，背景向左移動
    if (!backgroundAtRightEdge) {
      backgroundOffset -= movementStep;
    } else {
      // 背景到達最右側後，角色才向右移動
      characterX += movementStep;
    }
  } else if (movingLeft) {
    isWalking = true;
    facingDirection = -1;

    // 尚未到背景最左側時，背景向右移動
    if (!backgroundAtLeftEdge) {
      backgroundOffset += movementStep;
    } else {
      // 背景到達最左側後，角色才向左移動
      characterX -= movementStep;
    }
  } else {
    isWalking = false;
  }

  // 限制背景不能超過左右邊界
  backgroundOffset = constrain(
    backgroundOffset,
    -(backgroundTotalWidth - width),
    0
  );

  // 繪製背景
  drawBackground();

  // 角色大小為原本自動計算大小的 2/3
  const characterScale =
    min(
      (height * 0.65) / frameHeight,
      ((width * 2) / 3) / frameWidth
    ) * (2 / 3);

  const characterWidth = frameWidth * characterScale;
  const characterHeight = frameHeight * characterScale;

  // 限制角色不能離開畫布
  characterX = constrain(
    characterX,
    characterWidth / 2,
    width - characterWidth / 2
  );

  // 檢查施法動畫是否播放完畢
  if (
    isCasting &&
    frameCount - magicStartFrame >= magicFrameCount * framesPerStep
  ) {
    isCasting = false;

    // 在角色前方建立魔法特效
    activeEffects.push({
      x: characterX + magicDirection * characterWidth / 2,
      y: height - characterHeight * 0.58,
      direction: magicDirection
    });
  }

  // 根據角色狀態選擇精靈圖
  const activeSprite = isCasting
    ? magicSprite
    : isWalking
    ? walkSprite
    : characterSprite;

  const activeFrameCount = isCasting
    ? magicFrameCount
    : isWalking
    ? walkFrameCount
    : frameCountInSprite;

  const activeFrameWidth = isCasting
    ? magicFrameWidth
    : isWalking
    ? walkFrameWidth
    : frameWidth;

  const activeFrameHeight = isCasting
    ? magicFrameHeight
    : isWalking
    ? walkFrameHeight
    : frameHeight;

  const elapsedMagicFrames = frameCount - magicStartFrame;

  const frameIndex = isCasting
    ? min(
        floor(elapsedMagicFrames / framesPerStep),
        magicFrameCount - 1
      )
    : floor(frameCount / framesPerStep) % activeFrameCount;

  const sourceX = frameIndex * activeFrameWidth;

  const activeWidth = activeFrameWidth * characterScale;
  const activeHeight = activeFrameHeight * characterScale;

  // 讓角色腳部對齊畫布底部
  const characterY = height - activeHeight / 2;

  push();

  imageMode(CENTER);
  translate(characterX, characterY);

  // 施法時使用鎖定方向，平時使用目前面向
  scale(isCasting ? magicDirection : facingDirection, 1);

  image(
    activeSprite,
    0,
    0,
    activeWidth,
    activeHeight,
    sourceX,
    0,
    activeFrameWidth,
    activeFrameHeight
  );

  pop();

  // 繪製飛行中的魔法特效
  const effectScale = characterScale;
  const effectWidth = effectFrameWidth * effectScale;
  const effectHeight = effectFrameHeight * effectScale;
  const effectSpeed = max(6, width * 0.008);

  for (
    let effectIndex = activeEffects.length - 1;
    effectIndex >= 0;
    effectIndex--
  ) {
    const effect = activeEffects[effectIndex];

    effect.x += effect.direction * effectSpeed;

    // 特效飛出畫布後移除
    if (effect.x > width || effect.x < 0) {
      activeEffects.splice(effectIndex, 1);
      continue;
    }

    const effectFrameIndex =
      floor(frameCount / framesPerStep) % effectFrameCount;

    push();

    imageMode(CENTER);
    translate(effect.x, effect.y);
    scale(effect.direction, 1);

    image(
      magicEffectSprite,
      0,
      0,
      effectWidth,
      effectHeight,
      effectFrameIndex * effectFrameWidth,
      0,
      effectFrameWidth,
      effectFrameHeight
    );

    pop();
  }
}

function keyPressed() {
  if (keyCode === RIGHT_ARROW) {
    isWalking = true;
    facingDirection = 1;

    // 防止方向鍵造成網頁捲動
    return false;
  }

  if (keyCode === LEFT_ARROW) {
    isWalking = true;
    facingDirection = -1;

    // 防止方向鍵造成網頁捲動
    return false;
  }

  if (keyCode === 32) {
    // 只有空白鍵新按下且角色沒有施法時才觸發
    if (!spaceIsDown && !isCasting) {
      isCasting = true;
      magicStartFrame = frameCount;
      magicDirection = facingDirection;
    }

    spaceIsDown = true;

    // 防止空白鍵造成網頁捲動
    return false;
  }
}

function keyReleased() {
  if (keyCode === 32) {
    spaceIsDown = false;
  }
}

function windowResized() {
  // 更新畫布大小
  resizeCanvas(windowWidth, windowHeight);

  // 重新計算背景尺寸
  updateBackgroundSize();

  // 重新限制角色位置
  characterX = constrain(characterX, 1, width - 1);
}