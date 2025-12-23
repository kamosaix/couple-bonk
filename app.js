// ✅ Base-safe URL builder (Netlify subpath / SPA route / localhost hepsinde çalışsın)
const BASE_URL = (() => {
  const baseTag = document.querySelector("base");
  if (baseTag && baseTag.href) return baseTag.href;
  // bulunduğun klasörün path'ini baz al ("/demo/index.html" -> "/demo/")
  return window.location.origin + window.location.pathname.replace(/[^/]*$/, "");
})();

const A = (p) => new URL(String(p).replace(/^\//, ""), BASE_URL).toString();

const params = new URLSearchParams(window.location.search);

// "DEMO" lafı göz yoruyor: default'ı Ayşe-Mehmet yaptım, pack yoksa otomatik DEMO'ya düşer.
const codeParam = params.get("code");
const code = codeParam || "AYSE_MEHMET";
const packUrl = A(`packs/${code}.json`);
async function loadPack() {
  let res = await fetch(packUrl, { cache: "no-store" });

  // Custom pack yoksa DEMO'ya düş (oyun patlamasın).
  if (!res.ok) {
    const fallbackUrl = A(`packs/DEMO.json`);
    res = await fetch(fallbackUrl, { cache: "no-store" });
  }

  if (!res.ok) throw new Error("Pack bulunamadı: " + (res.url || packUrl));
  return await res.json();
}

function ensureBgm(scene) {
  if (window.__COUPLE_BONK_BGM && window.__COUPLE_BONK_BGM.isPlaying) return;
  const bgm = scene.sound.add("bgm", { loop: true, volume: 0.55 });
  bgm.play();
  window.__COUPLE_BONK_BGM = bgm;
}

const UI_FONT = "system-ui, -apple-system, Segoe UI, Arial";

function drawPremiumBg(scene, keepIntroImage = true) {
  const { width, height } = scene.scale;

  const grad = scene.add.graphics();
  grad.fillGradientStyle(0x180d2a, 0x180d2a, 0x05060a, 0x05060a, 1);
  grad.fillRect(0, 0, width, height);

  const vignette = scene.add.graphics();
  vignette.fillStyle(0x000000, 0.35);
  vignette.fillRect(0, 0, width, height);
  vignette.setBlendMode(Phaser.BlendModes.MULTIPLY);

  const noise = scene.add.graphics();
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const a = Math.random() * 0.06;
    noise.fillStyle(0xffffff, a);
    noise.fillRect(x, y, 1, 1);
  }
  noise.setBlendMode(Phaser.BlendModes.OVERLAY);

  if (keepIntroImage) {
    const bg = scene.add.image(width / 2, height / 2, "bg_intro");
    bg.setDisplaySize(width, height);
    bg.setAlpha(0.22);
    bg.setBlendMode(Phaser.BlendModes.NORMAL);
    scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.18);
  }
}

/* ---------------- PRELOAD (loading screen) ---------------- */
class PreloadScene extends Phaser.Scene {
  constructor(){ super("Preload"); }

  preload(){
    const { width, height } = this.scale;

    // Simple background
    this.add.rectangle(width/2, height/2, width, height, 0x0b0b12, 1);

    const title = this.add.text(width/2, height/2 - 46, "Yükleniyor…", {
      fontFamily: UI_FONT, fontSize: "22px", color: "#fff", fontStyle: "900"
    }).setOrigin(0.5);

    const hint = this.add.text(width/2, height/2 - 16, "Telefonun naz yaparsa sabret 😈", {
      fontFamily: UI_FONT, fontSize: "12px", color: "#cfcfe6"
    }).setOrigin(0.5);

    const barW = Math.min(320, width - 60);
    const barH = 14;
    const x = width/2 - barW/2;
    const y = height/2 + 22;

    const box = this.add.graphics();
    box.fillStyle(0xffffff, 0.12);
    box.fillRoundedRect(x, y, barW, barH, 8);

    const bar = this.add.graphics();

    const percentText = this.add.text(width/2, y + 28, "0%", {
      fontFamily: UI_FONT, fontSize: "12px", color: "#fff", fontStyle: "800"
    }).setOrigin(0.5);

    this.load.on("progress", (p) => {
      bar.clear();
      bar.fillStyle(0xffffff, 0.75);
      bar.fillRoundedRect(x, y, Math.max(8, barW * p), barH, 8);
      percentText.setText(Math.round(p*100) + "%");
    });

    this.load.on("complete", () => {
      bar.destroy(); box.destroy();
      title.destroy(); hint.destroy(); percentText.destroy();
    });

    // Debug: hangi dosya patlıyor gör (arka fon gelmiyor = çoğu zaman 404)
    this.load.on("loaderror", (file) => {
      console.warn("[LOAD ERROR]", file?.key, file?.src || file);
    });

    // Common assets (heavy ones) — ❌ baştaki "/" Netlify subpath'te çöp oluyor, ✅ A() ile düzeltildi
    this.load.image("bg_intro", A("assets/bg_room.jpg"));
    this.load.audio("bgm", A("assets/music_intro.mp3"));

    this.load.image("body_base", A("assets/body_base.png"));
    this.load.image("girl_base", A("assets/girl_base.png"));

    this.load.audio("switch", A("sounds/switch.mp3"));

    this.load.audio("slap1", A("sounds/slap1.mp3"));
    this.load.audio("slap2", A("sounds/slap2.mp3"));
    this.load.audio("slap3", A("sounds/slap3.mp3"));

    this.load.audio("slipper1", A("sounds/slipper1.mp3"));
    this.load.audio("slipper2", A("sounds/slipper2.mp3"));
    this.load.audio("slipper3", A("sounds/slipper3.mp3"));

    this.load.audio("pillow1", A("sounds/pillow1.mp3"));
    this.load.audio("pillow2", A("sounds/pillow2.mp3"));
    this.load.audio("pillow3", A("sounds/pillow3.mp3"));

    this.load.audio("pan1", A("sounds/pan1.mp3"));
    this.load.audio("pan2", A("sounds/pan2.mp3"));
    this.load.audio("pan3", A("sounds/pan3.mp3"));
  }

  create(){
    this.scene.start("Boot");
  }
}

/* ---------------- BOOT (fetch pack + load face) ---------------- */
class BootScene extends Phaser.Scene {
  constructor(){ super("Boot"); }

  async create(){
    try {
      const pack = await loadPack();

      // Load face dynamically (per customer)
      this.load.image("face", pack.face);

      this.load.once("complete", () => {
        this.scene.start("Splash", { pack });
      });

      this.load.start();
    } catch (e) {
      // Fail screen
      const { width, height } = this.scale;
      this.add.rectangle(width/2, height/2, width, height, 0x0b0b12, 1);
      this.add.text(width/2, height/2 - 10, "Pack bulunamadı 💀", {
        fontFamily: UI_FONT, fontSize: "20px", color: "#fff", fontStyle: "900"
      }).setOrigin(0.5);
      this.add.text(width/2, height/2 + 22, `${e}`, {
        fontFamily: UI_FONT, fontSize: "12px", color: "#cfcfe6"
      }).setOrigin(0.5);
    }
  }
}

/* ---------------- SPLASH ---------------- */
class SplashScene extends Phaser.Scene {
  constructor(){ super("Splash"); }
  init(data){ this.pack = data.pack; }

  create(){
    const { width, height } = this.scale;

    drawPremiumBg(this, true);
    ensureBgm(this);

    const cardW = Math.min(360, width - 40);
    const cardH = 580;
    const cardX = width / 2;
    const cardY = height / 2;

    const card = this.add.graphics();
    card.fillStyle(0x0b0b12, 0.82);
    card.fillRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 22);
    card.lineStyle(2, 0xffffff, 0.14);
    card.strokeRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 22);

    const rawTitle = (this.pack.title || "").trim();
    const title = (!rawTitle || /demo/i.test(rawTitle)) ? "Ayşe ❤️ Mehmet" : rawTitle;
    this.add.text(width / 2, cardY - 270, title, {
      fontFamily: UI_FONT, fontSize: "28px", color: "#fff", fontStyle: "800"
    }).setOrigin(0.5).setShadow(0, 3, "#000", 12);

// Couple Preview
    const frameY = cardY - 75;
    const frameW = Math.min(150, (width - 84) / 2);
    const frameH = 210;

    const leftX  = width / 2 - frameW / 2 - 18;
    const rightX = width / 2 + frameW / 2 + 18;

    const frames = this.add.graphics();
    const drawBox = (cx) => {
      frames.fillStyle(0xffffff, 0.10);
      frames.fillRoundedRect(cx - frameW / 2, frameY - frameH / 2, frameW, frameH, 18);
      frames.lineStyle(2, 0xffffff, 0.12);
      frames.strokeRoundedRect(cx - frameW / 2, frameY - frameH / 2, frameW, frameH, 18);
    };
    drawBox(leftX);
    drawBox(rightX);

    const girlName = this.pack.girlName || "SEN";
    const boyName  = this.pack.boyName  || "O";

    this.add.text(leftX, frameY - frameH / 2 + 10, girlName, {
      fontFamily: UI_FONT, fontSize: "12px", color: "#ffd1f3", fontStyle: "900"
    }).setOrigin(0.5, 0);

    this.add.text(rightX, frameY - frameH / 2 + 10, "", {
      fontFamily: UI_FONT, fontSize: "12px", color: "#cfe8ff", fontStyle: "900"
    }).setOrigin(0.5, 0).setAlpha(0);

    // Girl preview
    const girl = this.add.image(leftX, frameY + frameH / 2 - 18, "girl_base");
    girl.setOrigin(0.5, 1);
    girl.setDisplaySize(frameW * 0.84, (frameW * 0.84) * (girl.height / girl.width));

    // Boy preview
    const body = this.add.image(rightX, frameY + 45, "body_base");
    const targetBW = frameW * 0.98;
    body.setDisplaySize(targetBW, targetBW * (body.height / body.width));

    const bodyTop = body.y - body.displayHeight / 2;
    const faceSize = Math.min(frameW * 0.66, 96);
    const face = this.add.image(rightX, bodyTop + 48, "face").setDisplaySize(faceSize, faceSize);

    const mg = this.make.graphics({ add: false });
    mg.fillCircle(face.x, face.y, faceSize / 2);
    face.setMask(mg.createGeometryMask());

    this.add.text(width / 2, frameY - 12, "💘", { fontFamily: UI_FONT, fontSize: "26px" }).setOrigin(0.5);

    // idle
    this.tweens.add({ targets: girl, y: girl.y - 6, duration: 650, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.tweens.add({ targets: body, y: body.y - 4, duration: 700, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.tweens.add({ targets: face, y: face.y - 3, duration: 700, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    // Start button
    const btnW = Math.min(300, width - 80);
    const btnH = 56;
    const btnY = cardY + 160;

    const btn = this.add.graphics();
    btn.fillStyle(0xffffff, 0.14);
    btn.fillRoundedRect(width / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH, 18);
    btn.lineStyle(2, 0xffffff, 0.18);
    btn.strokeRoundedRect(width / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH, 18);

    this.add.text(width / 2, btnY - 12, "BAŞLA", {
      fontFamily: UI_FONT, fontSize: "18px", color: "#fff", fontStyle: "900"
    }).setOrigin(0.5).setShadow(0, 3, "#000", 12);

    this.add.text(width / 2, btnY + 12, "Ekrana dokun = vur • Alttan silah seç", {
      fontFamily: UI_FONT, fontSize: "11px", color: "#cfcfe6"
    }).setOrigin(0.5);

    const hit = this.add.rectangle(width / 2, btnY, btnW, btnH, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true });

    hit.on("pointerdown", () => {
      const all = [girl, body, face];
      this.tweens.add({ targets: all, scale: 1.03, duration: 120, yoyo: true, ease: "Quad.easeOut" });
      this.time.delayedCall(120, () => this.scene.start("Game", { pack: this.pack }));
    });
}
}

/* ---------------- GAME ---------------- */
class GameScene extends Phaser.Scene {
  constructor(){ super("Game"); }

  init(data){
    this.pack = data.pack;

    this.timeLeft = 60;
    this.score = 0;
    this.displayScore = 0;

    this.combo = 0;
    this.mult = 1;
    this.lastHitAt = 0;
    this.comboWindowMs = 750;
    this.bestCombo = 0;

    this.anger = 0;
    this.ended = false;
    // Rage mode
    this.rageActive = false;
    this.rageSelecting = false;
    this.rageQueued = false;       // FULL olunca bir kere aç
    this.rageWeaponKey = null;

    // UI (seçim + aktif rage)
    this.rageOverlay = null;       // kırmızı additive perde
    this.rageDim = null;           // siyah karartma (okunabilirlik)
    this.ragePanel = null;         // seçim modal container
    this.ragePlate = null;         // üstte banner container
    this.rageCountdownText = null; // süre / shot göstergesi

    // timers
    this.rageTimer = null;         // hard timeout
    this.rageDrainEvent = null;    // barı (anger) süre gibi akıt
    this.rageAutoEvent = null;     // terlik yağmuru gibi auto event
    this.rageLockUntil = 0;        // modal açılınca spam click kilidi

    // hadouken
    this.rageHadoukenShots = 0;
    this.rageHadoukenCdUntil = 0;
this.weapon = "slap";
    this.bottomBarH = 110;

    this.hitBusy = false;
    this.isPaused = false;

    this.totalHits = 0;
  }

  makeText(x, y, txt, size = 16, color = "#fff", weight = "700") {
    return this.add.text(x, y, txt, {
      fontFamily: UI_FONT,
      fontSize: `${size}px`,
      color,
      fontStyle: weight
    }).setShadow(0, 3, "#000", 12);
  }

  roundedPanel(x, y, w, h, r = 18, a = 0.60) {
    const g = this.add.graphics();
    g.fillStyle(0x0b0b12, a);
    g.fillRoundedRect(x - w/2, y - h/2, w, h, r);
    g.lineStyle(2, 0xffffff, 0.10);
    g.strokeRoundedRect(x - w/2, y - h/2, w, h, r);
    return g;
  }

  create(){
    const { width, height } = this.scale;

    drawPremiumBg(this, true);
    ensureBgm(this);

    this.roundedPanel(width/2, 48, width - 26, 92, 20, 0.62);

    this.scoreText = this.makeText(24, 16, "Skor: 0", 18, "#fff", "900").setOrigin(0,0);
    this.comboText = this.makeText(24, 42, "Combo: 0  x1", 13, "#ffcc00", "800").setOrigin(0,0);

    const girlName = this.pack.girlName || "SEN";
    const boyName  = this.pack.boyName  || "O";
    this.nameText = this.makeText(24, 64, `${girlName} vs ${boyName}`, 12, "#d9d9ff", "700").setOrigin(0,0);

    this.timeText = this.makeText(width - 22, 16, `${this.timeLeft}s`, 18, "#fff", "900").setOrigin(1,0);
    this.weaponLabel = this.makeText(width - 22, 42, "", 13, "#b7e3ff", "800").setOrigin(1,0);

    this.pauseBtn = this.makeText(width - 46, 64, "⏸", 18, "#fff", "900")
      .setOrigin(0.5,0).setInteractive({ useHandCursor: true });
    this.pauseBtn.on("pointerdown", () => this.openPauseOverlay());

    this.toastText = this.makeText(width/2, 124, "", 18, "#fff", "900").setOrigin(0.5).setAlpha(0);

    // Anger bar
    this.barX = width - 30;
    this.barBottomY = height/2 + 115;
    this.barMaxHeight = 230;

    this.barBg = this.add.graphics();
    this.barBg.fillStyle(0x11111a, 0.88);
    this.barBg.fillRoundedRect(this.barX - 8, this.barBottomY - this.barMaxHeight, 16, this.barMaxHeight, 8);
    this.barBg.lineStyle(2, 0xffffff, 0.10);
    this.barBg.strokeRoundedRect(this.barX - 8, this.barBottomY - this.barMaxHeight, 16, this.barMaxHeight, 8);

    this.barFill = this.add.graphics();
    this.drawBar();

    // Characters
    this.body = this.add.image(width/2, (height - this.bottomBarH)/2 + 120, "body_base");
    const targetBodyW = Math.min(width * 0.82, 330);
    this.body.setDisplaySize(targetBodyW, targetBodyW * (this.body.height / this.body.width));

    const bodyTopY = this.body.y - this.body.displayHeight/2;
    const faceY = bodyTopY + 70;
    const faceSize = Math.min(width * 0.46, 190);
    this.faceBaseSize = faceSize;

    this.face = this.add.image(this.body.x, faceY, "face").setDisplaySize(faceSize, faceSize);
    const maskG = this.make.graphics({ add:false });
    maskG.fillCircle(this.face.x, this.face.y, faceSize/2);
    this.face.setMask(maskG.createGeometryMask());

    this.girl = this.add.image(width * 0.23, height - this.bottomBarH - 15, "girl_base");
    const baseGirlW = Math.min(width * 0.62, 260);
    this.girl.setDisplaySize(baseGirlW * 0.88, (baseGirlW * 0.88) * (this.girl.height / this.girl.width));
    this.girl.setOrigin(0.5, 1);

    this.girlHomeX = this.girl.x;
    this.girlHomeY = this.girl.y;
    this.bodyHomeY = this.body.y;
    this.faceHomeY = this.face.y;
    this.faceHomeX = this.face.x;

    this.hitFlash = this.add.rectangle(width/2, height/2, width, height, 0xffffff, 0).setDepth(9999);

    // Weapons
    this.weapons = {
      slap:    { label: "👋 Tokat",  base: 1, anger: 1, sounds: ["slap1","slap2","slap3"], fx: "👋" },
      slipper: { label: "🥿 Terlik", base: 2, anger: 2, sounds: ["slipper1","slipper2","slipper3"], fx: "🥿" },
      pillow:  { label: "☁️ Yastık", base: 3, anger: 1, sounds: ["pillow1","pillow2","pillow3"], fx: "☁️" },
      pan:     { label: "🍳 Tava",   base: 5, anger: 4, sounds: ["pan1","pan2","pan3"], fx: "🍳" }
    };

    // Rage-only weapons (bar dolunca seçilecek)
    this.rageWeapons = {
      rage_slipper_rain: { label: "🥿 Terlik Yağmuru", base: 6, anger: 0, sounds: ["slipper1","slipper2","slipper3"], fx: "🥿" },
      rage_belt:         { label: "🪢 Kemer",         base: 8, anger: 0, sounds: ["slap1","slap2","slap3"], fx: "🪢" },
      rage_hadouken:     { label: "🌀 Hadouken",      base:10, anger: 0, sounds: ["pan1","pan2","pan3"], fx: "🌀" }
    };

    this.updateWeaponUI();
    this.createWeaponBar();
    this.startIdleBobbing();

    // Timer
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.ended || this.isPaused) return;
        this.timeLeft--;
        this.timeText.setText(`${this.timeLeft}s`);
        if (this.timeLeft <= 0) this.endGame(this.pack.endReason || "Süre bitti 😈");
      }
    });

    // Anger decay
    this.angerDecayEvent = this.time.addEvent({
      delay: 120,
      loop: true,
      callback: () => {
        if (this.ended || this.isPaused) return;

        const now = this.time.now;
        const idleMs = now - this.lastHitAt;
        if (idleMs < 520) return;

        let baseDecay =
          (this.weapon === "pan") ? 0.95 :
          (this.weapon === "slipper") ? 1.10 :
          (this.weapon === "slap") ? 1.25 : 1.55;

        if (this.anger > 0) {
          this.anger = Math.max(0, this.anger - baseDecay);
          this.drawBar();
        }
      }
    });

    // Tap = hit
    this.input.on("pointerdown", (p) => {
      if (this.ended) return;
      if (this.rageSelecting) return; // modal açıkken spam click oyunu tetiklemesin
      if (this.isPaused) return;
      if (p.y >= height - this.bottomBarH) return;
      this.hit();
    });
  }

  /* ---------- NEW: “vurmayı hissettir” efekt seti ---------- */
  spawnBruise() {
    const comboBoost = Math.min(1.0, this.combo / 18);
    const alpha = 0.18 + comboBoost * 0.14;

    const x = this.face.x + Phaser.Math.Between(-30, 30);
    const y = this.face.y + Phaser.Math.Between(-12, 28);

    const g = this.add.graphics().setDepth(8000);
    g.fillStyle(0xff2d55, alpha);
    g.fillCircle(x, y, Phaser.Math.Between(18, 28));
    g.fillStyle(0x7a1b2a, alpha * 0.55);
    g.fillCircle(x + 6, y + 4, Phaser.Math.Between(10, 18));

    this.tweens.add({
      targets: g,
      alpha: 0,
      duration: 680,
      ease: "Quad.easeOut",
      onComplete: () => g.destroy()
    });
  }

  faceFlash() {
    const s = this.add.circle(
      this.face.x,
      this.face.y,
      this.faceBaseSize * 0.52,
      0xffffff,
      0.10
    ).setDepth(7999);

    this.tweens.add({
      targets: s,
      alpha: 0,
      duration: 120,
      ease: "Quad.easeOut",
      onComplete: () => s.destroy()
    });
  }

  spawnSparks() {
    const n = 6 + Math.min(6, Math.floor(this.combo / 6));
    for (let i = 0; i < n; i++) {
      const p = this.add.circle(
        this.face.x + Phaser.Math.Between(-10, 10),
        this.face.y + Phaser.Math.Between(-10, 10),
        Phaser.Math.Between(2, 4),
        0xffffff,
        0.92
      ).setDepth(8001);

      this.tweens.add({
        targets: p,
        x: `+=${Phaser.Math.Between(-46, 46)}`,
        y: `+=${Phaser.Math.Between(-46, 34)}`,
        alpha: 0,
        duration: Phaser.Math.Between(170, 260),
        ease: "Quad.easeOut",
        onComplete: () => p.destroy()
      });
    }
  }

  cameraKick(dir, mag = 10) {
    const cam = this.cameras.main;
    cam.scrollX = 0;
    this.tweens.add({
      targets: cam,
      scrollX: dir * mag,
      duration: 55,
      yoyo: true,
      ease: "Quad.easeOut",
      onComplete: () => cam.setScroll(0, 0)
    });
  }

  faceDisplace(dir, mult = 1) {
    // vurulan yön hissi: yüz hafif kayıp geri gelsin
    const k = this.getActiveWeaponKey();
    const kick =
      (k === "pan") ? 10 :
      (k === "slipper") ? 8 :
      (k === "slap") ? 6 :
      (k === "rage_belt") ? 11 :
      (k === "rage_hadouken") ? 12 :
      4;

    const finalKick = kick * mult;
this.tweens.killTweensOf(this.face);
    this.face.x = this.faceHomeX;

    this.tweens.add({
      targets: this.face,
      x: this.faceHomeX + dir * finalKick,
      duration: 45,
      yoyo: true,
      ease: "Quad.easeOut",
      onComplete: () => { this.face.x = this.faceHomeX; }
    });
  }
  /* -------------------------------------------------------- */

  hitStop(ms = 60) {
    // Mobilde setTimeout bazen kafayı yiyor (tab arka plana gidince vs) → tween timeScale düşük kalıp
    // “karakter durdu” gibi hissettiriyor. Phaser time ile garanti geri alıyoruz.
    const prev = (typeof this.tweens.timeScale === "number") ? this.tweens.timeScale : 1;

    // önceki geri-al event'i varsa iptal et
    if (this.__hitStopEvent && this.__hitStopEvent.remove) {
      this.__hitStopEvent.remove(false);
      this.__hitStopEvent = null;
    }

    this.tweens.timeScale = 0.08;

    // Phaser clock ile geri al
    this.__hitStopEvent = this.time.delayedCall(ms, () => {
      // scene kapanmış olabilir
      if (!this.tweens) return;
      this.tweens.timeScale = prev;
    });
  }

  impactRing() {
    const x = this.face.x;
    const y = this.face.y;

    const ring = this.add.graphics().setDepth(9000);
    const startR = this.faceBaseSize * 0.42;
    const endR = this.faceBaseSize * 0.62;

    const state = { r: startR, a: 0.65 };
    const draw = () => {
      ring.clear();
      ring.lineStyle(4, 0xffffff, state.a);
      ring.strokeCircle(x, y, state.r);
    };
    draw();

    this.tweens.add({
      targets: state,
      r: endR,
      a: 0,
      duration: 160,
      ease: "Quad.easeOut",
      onUpdate: draw,
      onComplete: () => ring.destroy()
    });
  }

  scoreCountUp(toValue) {
    const from = this.displayScore;
    const obj = { v: from };

    this.tweens.add({
      targets: obj,
      v: toValue,
      duration: 140,
      ease: "Quad.easeOut",
      onUpdate: () => {
        this.displayScore = Math.round(obj.v);
        this.scoreText.setText("Skor: " + this.displayScore);
      },
      onComplete: () => {
        this.displayScore = toValue;
        this.scoreText.setText("Skor: " + this.displayScore);
      }
    });
  }

  toast(msg) {
    this.toastText.setText(msg).setAlpha(1);
    this.tweens.killTweensOf(this.toastText);
    this.tweens.add({ targets: this.toastText, alpha: 0, duration: 720 });
  }

  drawBar() {
    this.barFill.clear();
    const h = (this.anger / 100) * this.barMaxHeight;
    this.barFill.fillStyle(0xff4d6d, 1);
    this.barFill.fillRoundedRect(this.barX - 8, this.barBottomY - h, 16, h, 8);
  }


  getActiveWeaponKey() {
    return this.rageActive ? this.rageWeaponKey : this.weapon;
  }

  getActiveWeapon() {
    const k = this.getActiveWeaponKey();
    return this.rageActive ? this.rageWeapons[k] : this.weapons[k];
  }


  enterRageSelection() {
    if (this.ended) return;
    if (this.rageActive || this.rageSelecting) return;

    this.rageSelecting = true;
    this.isPaused = true;

    const { width, height } = this.scale;

    // Spam click kazası olmasın: modal açılınca kısa kilit + basılı tut seçimi
    this.rageLockUntil = this.time.now + 450;
    const HOLD_MS = 420;

    // karartma + kırmızı perde (okunabilirlik >>>)
    if (this.rageDim) this.rageDim.destroy();
    this.rageDim = this.add
      .rectangle(width/2, height/2, width, height, 0x000000, 1.0)
      .setDepth(9400)
      .setInteractive(); // tıklamaları "yutar"

    if (!this.rageOverlay) {
      this.rageOverlay = this.add
        .rectangle(width/2, height/2, width, height, 0xff0000, 0.0)
        .setDepth(9500)
        .setBlendMode(Phaser.BlendModes.NORMAL);
    } else {
      this.rageOverlay.setDepth(9500);
    }

    this.tweens.killTweensOf(this.rageOverlay);
    this.tweens.add({
      targets: this.rageOverlay,
      alpha: { from: 0.0, to: 0.0 },
      duration:  1,
      ease: "Quad.easeOut"
    });

    // Panel
    const panelW = Math.min(440, width - 34);
    const panelH = 360;

    if (this.ragePanel) { this.ragePanel.destroy(true); this.ragePanel = null; }
    this.ragePanel = this.add.container(0, 0).setDepth(9999);

    const bg = this.add.graphics();
    bg.fillStyle(0x0b0b12, 1.0);
    bg.fillRoundedRect(width/2 - panelW/2, height/2 - panelH/2, panelW, panelH, 24);
    bg.lineStyle(2, 0xffffff, 0.14);
    bg.strokeRoundedRect(width/2 - panelW/2, height/2 - panelH/2, panelW, panelH, 24);

    // Başlık – büyük, stroke'lu, okunur
    const t = this.add.text(width/2, height/2 - panelH/2 + 44, "RAGE MODE", {
      fontFamily: UI_FONT,
      fontSize: "34px",
      color: "#ffffff",
      fontStyle: "900",
      align: "center"
    }).setOrigin(0.5).setShadow(0, 4, "#000", 16).setStroke("#000000", 8);

    const sub = this.add.text(width/2, height/2 - panelH/2 + 82, "Silahını seç: basılı tut (0.4 sn)", {
      fontFamily: UI_FONT,
      fontSize: "14px",
      color: "#ffffff",
      fontStyle: "800",
      align: "center"
    }).setOrigin(0.5).setShadow(0, 2, "#000", 10);

    // hold state (tek seçim)
    if (!this.__rageHoldState) this.__rageHoldState = { key: null, tween: null, fill: null };

    const cancelHold = () => {
      const hs = this.__rageHoldState;
      if (hs?.tween) { hs.tween.stop(); hs.tween = null; }
      if (hs?.fill) { hs.fill.scaleX = 0; hs.fill = null; }
      if (hs) hs.key = null;
    };

    const mkChoice = (cy, key, title, desc) => {
      const bw = panelW - 48;
      const bh = 74;
      const x0 = width/2 - bw/2;
      const y0 = cy - bh/2;

      const g = this.add.graphics();
      g.fillStyle(0xffffff, 0.06);
      g.fillRoundedRect(x0, y0, bw, bh, 18);
      g.lineStyle(2, 0xffffff, 0.12);
      g.strokeRoundedRect(x0, y0, bw, bh, 18);

      const ttl = this.add.text(x0 + 18, cy - 14, title, {
        fontFamily: UI_FONT, fontSize: "18px", color: "#fff", fontStyle: "900"
      }).setOrigin(0, 0.5).setShadow(0, 2, "#000", 12).setStroke("#000", 10);

      const ds = this.add.text(x0 + 18, cy + 14, desc, {
        fontFamily: UI_FONT, fontSize: "13px", color: "#ffffff", fontStyle: "700"
      }).setOrigin(0, 0.5).setShadow(0, 2, "#000", 10);

      // Hold progress bar
      const pbBg = this.add.rectangle(x0 + 16, y0 + bh - 12, bw - 32, 7, 0xffffff, 0.12).setOrigin(0, 0.5);
      const pbFill = this.add.rectangle(x0 + 16, y0 + bh - 12, bw - 32, 7, 0xffffff, 0.92).setOrigin(0, 0.5);
      pbFill.scaleX = 0;

      const zone = this.add.rectangle(width/2, cy, bw, bh, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });

      zone.on("pointerover", () => {
        g.clear();
        g.fillStyle(0xff0000, 0.12);
        g.fillRoundedRect(x0, y0, bw, bh, 18);
        g.lineStyle(2, 0xffffff, 0.22);
        g.strokeRoundedRect(x0, y0, bw, bh, 18);
      });

      zone.on("pointerout", () => {
        g.clear();
        g.fillStyle(0xffffff, 0.06);
        g.fillRoundedRect(x0, y0, bw, bh, 18);
        g.lineStyle(2, 0xffffff, 0.12);
        g.strokeRoundedRect(x0, y0, bw, bh, 18);
        cancelHold();
      });

      zone.on("pointerup", () => cancelHold());

      zone.on("pointerdown", () => {
        if (this.time.now < this.rageLockUntil) return;

        // yeni hold başlat
        cancelHold();
        this.__rageHoldState.key = key;
        this.__rageHoldState.fill = pbFill;

        pbFill.scaleX = 0;

        this.__rageHoldState.tween = this.tweens.add({
          targets: pbFill,
          scaleX: 1,
          duration: HOLD_MS,
          ease: "Linear",
          onComplete: () => {
            if (!this.__rageHoldState) return;
            if (this.__rageHoldState.key === key && this.rageSelecting) {
              this.startRage(key);
            }
          }
        });
      });

      this.ragePanel.add([g, ttl, ds, pbBg, pbFill, zone]);
    };

    mkChoice(height/2 - 40, "rage_slipper_rain", "🥿 Terlik Yağmuru", "Yağmur gibi terlik: komik kaos + seri isabet");
    mkChoice(height/2 + 46, "rage_belt", "🪢 Kemer", "Tok şak modu: daha sert sarsıntı + daha yüksek skor");
    mkChoice(height/2 + 132, "rage_hadouken", "🌀 Hadouken", "3 atışlık ulti: enerji topu + patlama efekti");

    const hint = this.add.text(width/2, height/2 + panelH/2 - 26, "Yanlışlıkla seçilmez: basılı tutman şart 😈", {
      fontFamily: UI_FONT,
      fontSize: "12px",
      color: "#ffffff",
      fontStyle: "800",
      align: "center"
    }).setOrigin(0.5).setShadow(0, 2, "#000", 10);

    this.ragePanel.add([bg, t, sub, hint]);
  }



  spawnRageSlipper() {
    if (!this.rageActive || this.rageWeaponKey !== "rage_slipper_rain") return;
    if (this.ended || this.isPaused) return;

    const { width } = this.scale;
    const fromLeft = Phaser.Math.Between(0, 1) === 0;

    const startX = fromLeft ? -30 : (width + 30);
    const startY = this.face.y + Phaser.Math.Between(-140, 60);

    const endX = this.face.x + Phaser.Math.Between(-14, 14);
    const endY = this.face.y + Phaser.Math.Between(-8, 18);

    const s = this.add.text(startX, startY, "🥿", { fontFamily: UI_FONT, fontSize: "46px" })
      .setOrigin(0.5)
      .setDepth(8200)
      .setAlpha(0.95);

    this.tweens.add({
      targets: s,
      x: endX,
      y: endY,
      angle: Phaser.Math.Between(-50, 50),
      duration: 190,
      ease: "Quad.easeIn",
      onComplete: () => {
        if (this.ended) { s.destroy(); return; }

        // mini-impact
        this.faceFlash();
        this.spawnSparks();
        this.cameraKick(fromLeft ? 1 : -1, 6);
        this.impactRing();

        const add = 2 * this.mult;
        this.score += add;
        this.scoreCountUp(this.score);
        this.floatingScore(add);

        // ses (slipper seti)
        this.playWeaponSound();

        s.destroy();
      }
    });
  }

  castBelt() {
    if (!this.rageActive || this.rageWeaponKey !== "rage_belt") return;
    if (this.ended || this.isPaused) return;
    if (this.hitBusy) return;
    this.hitBusy = true;

    // reset transforms (spam tıklamada drift olmasın)
    this.face.setScale(1);
    this.face.setDisplaySize(this.faceBaseSize, this.faceBaseSize);
    this.body.y = this.bodyHomeY;
    this.face.y = this.faceHomeY;
    this.face.x = this.faceHomeX;

    this.totalHits++;
    this.updateComboAndMultiplier();

    // kemer sağ/sol gelsin (komik kaos)
    const dir = (Math.random() < 0.5) ? 1 : -1;

    this.hitStop(95);
    this.impactRing();

    // whip arc (tok görünür)
    const arc = this.add.graphics().setDepth(9050);
    arc.lineStyle(10, 0xffffff, 0.34);
    arc.beginPath();
    const cx = this.face.x - dir * 70;
    const cy = this.face.y - 42;
    // sağdan vuruyorsa açı ters
    const a0 = dir > 0 ? Math.PI * 1.18 : Math.PI * 0.02;
    const a1 = dir > 0 ? Math.PI * 0.02 : Math.PI * 1.18;
    arc.arc(cx, cy, 140, a0, a1, dir < 0);
    arc.strokePath();

    this.tweens.add({
      targets: arc,
      alpha: 0,
      duration: 220,
      ease: "Quad.easeOut",
      onComplete: () => arc.destroy()
    });

    // emoji whip + fx
    this.spawnBeltWhip(dir);
    this.spawnWeaponFx();

    // impact
    this.faceFlash();
    this.spawnBruise();
    this.spawnSparks();
    this.spawnImpactFx();
    this.hitScreenFlash();

    this.cameras.main.shake(190, 0.022);
    this.cameraKick(dir, 18);
    this.faceDisplace(dir, 2.2);

    this.girlRecoil();
    this.targetReaction();

    // ses: slap + "çat" (pan)
    this.playWeaponSound();
    this.sound.play("pan1", { volume: 0.42, rate: 1.35 });

    // skor (kemer tok)
    const add = 16 * this.mult;
    this.score += add;
    this.scoreCountUp(this.score);
    this.floatingScore(add);

    // ikinci şak (bonus) → daha iyi his
    this.time.delayedCall(80, () => {
      if (this.ended || this.isPaused) return;
      if (!this.rageActive || this.rageWeaponKey !== "rage_belt") return;

      this.faceFlash();
      this.spawnSparks();
      this.spawnImpactFx();
      this.hitScreenFlash();

      this.cameras.main.shake(120, 0.014);
      this.cameraKick(dir, 10);
      this.faceDisplace(dir, 1.4);

      const add2 = 7 * this.mult;
      this.score += add2;
      this.scoreCountUp(this.score);
      this.floatingScore(add2);

      const k = Phaser.Utils.Array.GetRandom(["slap1", "slap2", "slap3"]);
      this.sound.play(k, { volume: 0.7, rate: Phaser.Math.FloatBetween(1.05, 1.15) });
    });

    this.time.delayedCall(150, () => {
      this.hitBusy = false;
      this.startIdleBobbing();
    });
  }



  castHadouken() {
    if (!this.rageActive || this.rageWeaponKey !== "rage_hadouken") return;
    if (this.ended || this.isPaused) return;

    const now = this.time.now;
    if (now < this.rageHadoukenCdUntil) return;

    if (this.rageHadoukenShots <= 0) {
      this.endRage();
      return;
    }

    // cooldown + shot harca
    this.rageHadoukenCdUntil = now + 300;
    this.rageHadoukenShots--;

    // ulti de "hit" sayılır (combo çalışsın)
    this.totalHits++;
    this.updateComboAndMultiplier();

    const sx = this.girl.x + 78;
    const sy = this.girl.y - 120;

    const ex = this.face.x;
    const ey = this.face.y - 10;

    const dir = (sx < ex) ? 1 : -1;

    // launch ses + charge
    this.sound.play("pan2", { volume: 0.55, rate: Phaser.Math.FloatBetween(0.92, 1.04) });
    this.sound.play("switch", { volume: 0.35, rate: Phaser.Math.FloatBetween(0.95, 1.05) });

    const charge = this.add.text(sx - 10, sy - 6, "✨", { fontFamily: UI_FONT, fontSize: "42px" })
      .setOrigin(0.5)
      .setDepth(8998)
      .setAlpha(0.0);
    this.tweens.add({
      targets: charge,
      alpha: { from: 0.0, to: 1.0 },
      scale: { from: 0.7, to: 1.5 },
      duration: 120,
      ease: "Quad.easeOut",
      yoyo: true,
      onComplete: () => charge.destroy()
    });

    const ball = this.add.text(sx, sy, "🌀", { fontFamily: UI_FONT, fontSize: "86px" })
      .setOrigin(0.5)
      .setDepth(9000)
      .setAlpha(0.98)
      .setAngle(dir * 10)
      .setShadow(0, 0, "#ffffff", 22);

    // trail (daha belirgin)
    const trailEvent = this.time.addEvent({
      delay: 35,
      loop: true,
      callback: () => {
        if (!ball || !ball.active) return;
        const t = this.add.text(ball.x, ball.y, "✨", { fontFamily: UI_FONT, fontSize: "26px" })
          .setOrigin(0.5)
          .setDepth(8999)
          .setAlpha(0.95);
        this.tweens.add({
          targets: t,
          alpha: 0,
          scale: 1.9,
          duration: 260,
          ease: "Quad.easeOut",
          onComplete: () => t.destroy()
        });
      }
    });

    this.tweens.add({
      targets: ball,
      x: ex,
      y: ey,
      angle: dir * 280,
      duration: 260,
      ease: "Cubic.easeIn",
      onComplete: () => {
        if (trailEvent) trailEvent.remove(false);

        // MEGA IMPACT
        this.hitStop(120);
        this.cameras.main.shake(260, 0.028);

        this.hitScreenFlash();
        this.spawnImpactFx();
        this.spawnSparks();
        this.spawnSparks();
        this.faceFlash();
        this.spawnBruise();

        this.cameraKick(dir, 22);
        this.faceDisplace(dir, 2.4);
        this.impactRing();

        // patlama emoji
        const boom = this.add.text(ex, this.face.y, "💥", { fontFamily: UI_FONT, fontSize: "78px" })
          .setOrigin(0.5)
          .setDepth(9050)
          .setAlpha(0.95);
        this.tweens.add({
          targets: boom,
          scale: { from: 0.85, to: 1.45 },
          alpha: { from: 0.95, to: 0 },
          duration: 200,
          ease: "Quad.easeOut",
          onComplete: () => boom.destroy()
        });

        // impact ses
        this.sound.play("pan3", { volume: 0.9, rate: Phaser.Math.FloatBetween(0.95, 1.05) });

        const add = 22 * this.mult;
        this.score += add;
        this.scoreCountUp(this.score);
        this.floatingScore(add);

        ball.destroy();

        // shotlar biterse rage kapat
        if (this.rageHadoukenShots <= 0) {
          this.time.delayedCall(220, () => this.endRage());
        }
      }
    });
  }



  startRage(key) {
    if (!this.rageSelecting) return;

    // seçim panelini kapat
    if (this.ragePanel) { this.ragePanel.destroy(true); this.ragePanel = null; }
    if (this.__rageHoldState) { 
      if (this.__rageHoldState.tween) this.__rageHoldState.tween.stop();
      this.__rageHoldState = null;
    }

    this.rageSelecting = false;
    this.isPaused = false;

    this.rageActive = true;
    this.rageWeaponKey = key;

    const { width, height } = this.scale;
    const duration = (key === "rage_hadouken") ? 9000 : 7000;
    this.rageEndsAt = this.time.now + duration;

    // Rage sırasında bar = süre (FULL → boşalıyor)
    this.anger = 100;
    this.drawBar();

    // karartmayı biraz aç (oyun görünür ama yazılar okunur)
    if (this.rageDim) {
      this.rageDim.disableInteractive();
      this.rageDim.setDepth(9400);
      this.tweens.add({ targets: this.rageDim, alpha: 0.22, duration: 220, ease: "Quad.easeOut" });
    }

    // kırmızı perde pulse
    if (this.rageOverlay) {
      this.rageOverlay.setDepth(9500);
      this.rageOverlay.setBlendMode(Phaser.BlendModes.NORMAL);
      this.tweens.killTweensOf(this.rageOverlay);
      this.tweens.add({
        targets: this.rageOverlay,
        alpha: { from: 0.18, to: 0.30 },
        duration: 520,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
    }

    // üst banner
    if (this.ragePlate) { this.ragePlate.destroy(true); this.ragePlate = null; }
    this.ragePlate = this.add.container(0, 0).setDepth(10050);

    const plateW = Math.min(360, width - 34);
    const plateH = 56;

    const plateBg = this.add.graphics();
    plateBg.fillStyle(0x000000, 0.92);
    plateBg.fillRoundedRect(width/2 - plateW/2, 16, plateW, plateH, 18);
    plateBg.lineStyle(2, 0xffffff, 0.18);
    plateBg.strokeRoundedRect(width/2 - plateW/2, 16, plateW, plateH, 18);

    const title = this.add.text(width/2, 32, "RAGE MODE", {
      fontFamily: UI_FONT,
      fontSize: "18px",
      color: "#fff",
      fontStyle: "900"
    }).setOrigin(0.5).setStroke("#000", 10).setShadow(0, 2, "#000", 12);

    const w = this.rageWeapons[key];
    const sub = this.add.text(width/2, 54, w ? w.label : "", {
      fontFamily: UI_FONT,
      fontSize: "13px",
      color: "rgba(255,255,255,0.90)",
      fontStyle: "800"
    }).setOrigin(0.5).setShadow(0, 2, "#000", 10);

    this.ragePlate.add([plateBg, title, sub]);

    // sayaç
    if (this.rageCountdownText) { this.rageCountdownText.destroy(); this.rageCountdownText = null; }
    this.rageCountdownText = this.add.text(width - 14, 86, "", {
      fontFamily: UI_FONT,
      fontSize: "14px",
      color: "#fff",
      fontStyle: "900",
      align: "right"
    }).setOrigin(1, 0).setStroke("#000", 6).setShadow(0, 2, "#000", 12).setDepth(10060);

    // hadouken: 3 shot
    this.rageHadoukenShots = (key === "rage_hadouken") ? 3 : 0;
    this.rageHadoukenCdUntil = 0;

    // terlik yağmuru: auto spawn
    if (this.rageAutoEvent) { this.rageAutoEvent.remove(false); this.rageAutoEvent = null; }
    if (key === "rage_slipper_rain") {
      this.rageAutoEvent = this.time.addEvent({
        delay: 140,
        loop: true,
        callback: () => {
          if (!this.rageActive || this.ended || this.isPaused) return;
          this.spawnRageSlipper();
        }
      });
    }

    // bar/sayaç güncelle
    if (this.rageDrainEvent) { this.rageDrainEvent.remove(false); this.rageDrainEvent = null; }
    this.rageDrainEvent = this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        if (!this.rageActive) return;
        const now = this.time.now;
        const remain = Math.max(0, this.rageEndsAt - now);

        // hadouken'da "shot" da göster
        if (this.rageWeaponKey === "rage_hadouken") {
          this.rageCountdownText.setText(`🌀 x${this.rageHadoukenShots}  |  ${(remain/1000).toFixed(1)}s`);
        } else {
          this.rageCountdownText.setText(`🔥 ${(remain/1000).toFixed(1)}s`);
        }

        // barı süre gibi akıt
        this.anger = (remain / duration) * 100;
        this.drawBar();

        if (remain <= 0) this.endRage();
      }
    });

    // hard timeout (fail-safe)
    if (this.rageTimer) this.rageTimer.remove(false);
    this.rageTimer = this.time.delayedCall(duration + 50, () => this.endRage());

    this.updateWeaponUI();

    // mini "girdi" sinyali
    this.hitScreenFlash();
    this.cameraKick(0, 0);
  }




  endRage() {
    if (!this.rageActive) return;

    this.rageActive = false;
    this.rageWeaponKey = null;
    this.rageHadoukenShots = 0;
    this.rageHadoukenCdUntil = 0;

    if (this.rageTimer) { this.rageTimer.remove(false); this.rageTimer = null; }
    if (this.rageDrainEvent) { this.rageDrainEvent.remove(false); this.rageDrainEvent = null; }
    if (this.rageAutoEvent) { this.rageAutoEvent.remove(false); this.rageAutoEvent = null; }

    if (this.rageCountdownText) { this.rageCountdownText.destroy(); this.rageCountdownText = null; }
    if (this.ragePlate) { this.ragePlate.destroy(true); this.ragePlate = null; }

    // overlay kapat
    if (this.rageOverlay) {
      this.tweens.killTweensOf(this.rageOverlay);
      this.tweens.add({
        targets: this.rageOverlay,
        alpha: 0.0,
        duration: 260,
        ease: "Quad.easeOut",
        onComplete: () => {
          if (this.rageOverlay) { this.rageOverlay.destroy(); this.rageOverlay = null; }
        }
      });
    }

    if (this.rageDim) {
      this.tweens.add({
        targets: this.rageDim,
        alpha: 0.0,
        duration: 240,
        ease: "Quad.easeOut",
        onComplete: () => { if (this.rageDim) { this.rageDim.destroy(); this.rageDim = null; } }
      });
    }

    // bar boşalsın
    this.anger = 0;
    this.drawBar();

    this.updateWeaponUI();
  }



  spawnSlipperRain() {
    const { width } = this.scale;
    const endX = this.face.x + Phaser.Math.Between(-12, 12);
    const endY = this.face.y + Phaser.Math.Between(-6, 10);

    const count = 7;
    for (let i = 0; i < count; i++) {
      this.time.delayedCall(i * 45, () => {
        const startX = (Math.random() < 0.5) ? -30 : (width + 30);
        const y = endY + Phaser.Math.Between(-35, 35);
        const fx = this.add.text(startX, y, "🥿", { fontSize: "48px", fontFamily: UI_FONT }).setOrigin(0.5);

        this.tweens.add({
          targets: fx,
          x: endX + Phaser.Math.Between(-18, 18),
          y: y + Phaser.Math.Between(-10, 10),
          angle: Phaser.Math.Between(-70, 70),
          duration: 170,
          ease: "Quad.easeOut",
          onComplete: () => fx.destroy()
        });
      });
    }
  }

  spawnBeltWhip(dir) {
    const { width } = this.scale;
    const startX = (Math.random() < 0.5) ? -40 : (width + 40);
    const y = this.face.y + Phaser.Math.Between(-18, 18);

    const whip = this.add.text(startX, y, "🪢", { fontSize: "56px", fontFamily: UI_FONT }).setOrigin(0.5);
    whip.setScale(1.15);

    this.tweens.add({
      targets: whip,
      x: this.face.x + dir * 8,
      duration: 120,
      ease: "Cubic.easeOut",
      onComplete: () => whip.destroy()
    });
  }

  spawnHadouken() {
    const { width } = this.scale;

    const fromLeft = (Math.random() < 0.5);
    const startX = fromLeft ? -50 : (width + 50);
    const y = this.face.y + Phaser.Math.Between(-18, 18);

    const ball = this.add.text(startX, y, "🌀", { fontSize: "62px", fontFamily: UI_FONT }).setOrigin(0.5);
    ball.setScale(1.05);

    // trail
    const trail = [];
    for (let i = 0; i < 4; i++) {
      const t = this.add.text(startX, y, "✨", { fontSize: "28px", fontFamily: UI_FONT }).setOrigin(0.5);
      t.setAlpha(0.0);
      trail.push(t);
    }

    this.tweens.add({
      targets: ball,
      x: this.face.x,
      duration: 240,
      ease: "Quad.easeOut",
      onUpdate: () => {
        for (let i = 0; i < trail.length; i++) {
          const t = trail[i];
          const lag = (i + 1) * 0.08;
          t.x += (ball.x - t.x) * lag;
          t.y += (ball.y - t.y) * lag;
          t.setAlpha(0.25);
        }
      },
      onComplete: () => {
        ball.destroy();
        trail.forEach(t => t.destroy());

        // patlama
        const boom = this.add.text(this.face.x, this.face.y, "💥", { fontSize: "64px", fontFamily: UI_FONT }).setOrigin(0.5);
        this.tweens.add({
          targets: boom,
          scale: { from: 0.8, to: 1.35 },
          alpha: { from: 1, to: 0 },
          duration: 180,
          ease: "Quad.easeOut",
          onComplete: () => boom.destroy()
        });

        this.hitScreenFlash();
        this.impactRing();
      }
    });
  }

  updateWeaponUI() {
    const w = this.getActiveWeapon();
    const prefix = this.rageActive ? "RAGE" : "Silah";
    this.weaponLabel.setText(`${prefix}: ${w.label}`);
if (this.weaponButtons) {
      for (const k of Object.keys(this.weaponButtons)) {
        const sel = (k === this.weapon);
        this.weaponButtons[k].bg.setAlpha(sel ? 0.92 : 0.22);
        this.weaponButtons[k].txt.setScale(sel ? 1.18 : 1.0);
      }
    }
  }

  createWeaponBar() {
    const { width, height } = this.scale;
    const barY = height - this.bottomBarH;

    const g = this.add.graphics();
    g.fillStyle(0x0b0b12, 0.74);
    g.fillRoundedRect(10, barY + 10, width - 20, this.bottomBarH - 20, 22);
    g.lineStyle(2, 0xffffff, 0.10);
    g.strokeRoundedRect(10, barY + 10, width - 20, this.bottomBarH - 20, 22);

    const keys = ["slap", "slipper", "pillow", "pan"];
    const emojis = { slap: "👋", slipper: "🥿", pillow: "☁️", pan: "🍳" };
    const pad = 14;
    const btnW = (width - pad * (keys.length + 1)) / keys.length;
    const btnH = this.bottomBarH - 36;

    this.weaponButtons = {};

    keys.forEach((k, i) => {
      const x = pad + btnW/2 + i * (btnW + pad);
      const y = barY + this.bottomBarH/2 + 6;

      const bg = this.add.rectangle(x, y, btnW, btnH, 0xffffff, 0.22)
        .setStrokeStyle(2, 0xffffff, 0.12)
        .setInteractive({ useHandCursor: true });

      const txt = this.add.text(x, y - 16, emojis[k], { fontSize: "30px", fontFamily: UI_FONT }).setOrigin(0.5);

      const set = () => {
        if (this.ended || this.isPaused) return;
        this.weapon = k;
        this.sound.play("switch", { volume: 0.65 });
        this.updateWeaponUI();
        this.toast(this.weapons[k].label);
      };

      bg.on("pointerdown", set);
      txt.setInteractive({ useHandCursor: true }).on("pointerdown", set);

      this.weaponButtons[k] = { bg, txt };
    });

    this.updateWeaponUI();
  }

  startIdleBobbing() {
    this.stopIdleBobbing();

    const t = Math.min(1, this.combo / 20);
    const speed = 1 + t * 1.2;

    this.idleGirlTween = this.tweens.add({
      targets: this.girl,
      y: this.girlHomeY - 6,
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    this.idleBodyTween = this.tweens.add({
      targets: this.body,
      y: this.bodyHomeY - 3,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    this.idleFaceTween = this.tweens.add({
      targets: this.face,
      y: this.faceHomeY - 2,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      delay: 80
    });

    this.idleGirlTween.timeScale = speed;
    this.idleBodyTween.timeScale = speed;
    this.idleFaceTween.timeScale = speed;
  }

  stopIdleBobbing() {
    if (this.idleGirlTween) { this.idleGirlTween.stop(); this.idleGirlTween = null; }
    if (this.idleBodyTween) { this.idleBodyTween.stop(); this.idleBodyTween = null; }
    if (this.idleFaceTween) { this.idleFaceTween.stop(); this.idleFaceTween = null; }

    if (this.girl) { this.girl.x = this.girlHomeX; this.girl.y = this.girlHomeY; this.girl.setAngle(0); }
    if (this.body) this.body.y = this.bodyHomeY;
    if (this.face) {
      this.face.x = this.faceHomeX;
      this.face.y = this.faceHomeY;
      this.face.setAngle(0);
      this.face.setScale(1);
      this.face.setDisplaySize(this.faceBaseSize, this.faceBaseSize);
    }
  }

  playWeaponSound() {
    const w = this.getActiveWeapon();
    const key = Phaser.Utils.Array.GetRandom(w.sounds);
    const rate = Phaser.Math.FloatBetween(0.95, 1.05);
    this.sound.play(key, { volume: 0.9, rate });
  }

  spawnWeaponFx() {
    const w = this.getActiveWeapon();
    const { width } = this.scale;

    // sağlı-sollu gelsin (random)
    const startX = (Math.random() < 0.5) ? -20 : (width + 20);
const endX = this.face.x + Phaser.Math.Between(-10, 10);
    const endY = this.face.y + Phaser.Math.Between(-5, 12);

    const glyph = (this.rageActive && this.rageWeaponKey === "rage_belt") ? "🪢" : w.fx;

    const fx = this.add.text(startX, endY - 10, glyph, { fontSize: "54px", fontFamily: UI_FONT }).setOrigin(0.5);

    this.tweens.add({
      targets: fx,
      x: endX,
      duration: (this.weapon === "pan") ? 120 : 95,
      ease: "Quad.easeOut",
      onComplete: () => fx.destroy()
    });
  }

  spawnImpactFx() {
    const x = this.face.x + Phaser.Math.Between(-25, 25);
    const y = this.face.y + Phaser.Math.Between(-35, -10);

    const meme = Math.random() < 0.06
      ? Phaser.Utils.Array.GetRandom(["💀", "🤡", "🫠", "😵‍💫", "😭"])
      : "💥";

    const impact = this.add.text(x, y, meme, { fontSize: "44px", fontFamily: UI_FONT }).setOrigin(0.5);
    impact.setScale(0.8).setAlpha(0.95);

    this.tweens.add({
      targets: impact,
      scale: 1.25,
      alpha: 0,
      duration: 140,
      ease: "Quad.easeOut",
      onComplete: () => impact.destroy()
    });
  }

  hitScreenFlash() {
    this.hitFlash.setAlpha(0.06);
    this.tweens.killTweensOf(this.hitFlash);
    this.tweens.add({ targets: this.hitFlash, alpha: 0, duration: 95, ease: "Quad.easeOut" });
  }

  girlRecoil() {
    this.tweens.killTweensOf(this.girl);
    this.girl.x = this.girlHomeX;
    this.girl.y = this.girlHomeY;

    const dir = (this.girlHomeX < this.face.x) ? 1 : -1;
    const k = this.getActiveWeaponKey();
    const push = (k === "pan") ? 18 : (k === "slipper" ? 14 : (k === "slap" ? 12 : (k === "rage_belt" ? 20 : (k === "rage_hadouken" ? 18 : 8))));
    const tilt = (k === "pan") ? 10 : (k === "slipper" ? 8 : (k === "rage_belt" ? 12 : (k === "rage_hadouken" ? 10 : 6)));

    this.tweens.add({
      targets: this.girl,
      x: this.girlHomeX + dir * push,
      angle: -dir * tilt,
      duration: 70,
      yoyo: true,
      ease: "Quad.easeOut",
      onComplete: () => {
        this.girl.setAngle(0);
        this.girl.x = this.girlHomeX;
        this.girl.y = this.girlHomeY;
      }
    });
  }

  targetReaction() {
    const k = this.getActiveWeaponKey();

    if (k === "pan" || k === "rage_hadouken") this.cameras.main.shake(230, 0.024);
    else if (k === "rage_belt") this.cameras.main.shake(200, 0.020);
    else if (k === "slipper" || k === "rage_slipper_rain") this.cameras.main.shake(140, 0.014);
    else if (k === "slap") this.cameras.main.shake(95, 0.010);
    else this.cameras.main.shake(55, 0.006);

    const amp =
      (k === "pan" || k === "rage_hadouken") ? 20 :
      (k === "rage_belt") ? 18 :
      (k === "slipper" || k === "rage_slipper_rain") ? 14 : 10;

    const dur = (k === "pillow") ? 70 : 55;

    this.tweens.add({
      targets: this.face,
      angle: { from: -amp, to: amp },
      duration: dur,
      yoyo: true,
      repeat: 2,
      onComplete: () => this.face.setAngle(0)
    });

    const bodyKick = (k === "pan" || k === "rage_hadouken") ? 7 : (k === "pillow") ? 2 : (k === "rage_belt" ? 6 : 3);
    this.tweens.add({
      targets: this.body,
      y: this.bodyHomeY + bodyKick,
      duration: 60,
      yoyo: true,
      ease: "Quad.easeOut",
      onComplete: () => { this.body.y = this.bodyHomeY; }
    });

    this.tweens.add({
      targets: this.face,
      scaleX: 0.92,
      scaleY: 1.06,
      duration: 55,
      yoyo: true,
      ease: "Quad.easeOut",
      onComplete: () => {
        this.face.setScale(1);
        this.face.setDisplaySize(this.faceBaseSize, this.faceBaseSize);
      }
    });
  }

  floatingScore(add) {
    const baseTexts = this.pack.hitText || ["BONK!", "OF YA!", "YETER!", "YİNE Mİ?", "SUS LAN 😭", "KAFAN GİTTİ", "SABRIM TAŞTI"];
    const flavor = {
      slap: ["Paf!", "Şlap!", "Hop!"],
      slipper: ["TERLİK!", "ŞAK!", "DING!"],
      pillow: ["POF!", "Pıt!", "Yumuşak 😌"],
      pan: ["CLANG!", "KÜT!", "TAVA!"]
    };
    const pool = [...baseTexts, ...flavor[this.weapon]];
    const t = Phaser.Utils.Array.GetRandom(pool);

    const txt = this.add.text(this.face.x, this.face.y - 150, `+${add}  ${t}`, {
      fontFamily: UI_FONT, fontSize: "20px", color: "#fff", fontStyle: "900"
    }).setOrigin(0.5).setShadow(0, 3, "#000", 12);

    this.tweens.add({
      targets: txt,
      y: "-=30",
      alpha: 0,
      duration: 540,
      onComplete: () => txt.destroy()
    });
  }

  updateComboAndMultiplier() {
    const now = this.time.now;

    if (now - this.lastHitAt <= this.comboWindowMs) this.combo++;
    else this.combo = 1;

    this.lastHitAt = now;

    if (this.combo >= 25) this.mult = 5;
    else if (this.combo >= 15) this.mult = 3;
    else if (this.combo >= 7) this.mult = 2;
    else this.mult = 1;

    if (this.combo > this.bestCombo) this.bestCombo = this.combo;
    this.comboText.setText(`Combo: ${this.combo}  x${this.mult}`);
  }

  playTwoFrame(impactFn) {
    this.tweens.killTweensOf(this.girl);
    this.girl.x = this.girlHomeX;
    this.girl.y = this.girlHomeY;

    const dir = (this.girlHomeX < this.face.x) ? 1 : -1;
    const back = (this.weapon === "pan") ? 6 : (this.weapon === "slipper" ? 5 : 4);
    const preTilt = (this.weapon === "pan") ? 4 : 3;

    this.tweens.add({
      targets: this.girl,
      x: this.girlHomeX - dir * back,
      angle: dir * preTilt,
      duration: 45,
      ease: "Quad.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: this.face,
          scaleX: 1.03,
          scaleY: 0.97,
          duration: 45,
          yoyo: true,
          ease: "Quad.easeOut",
          onComplete: () => {
            this.face.setScale(1);
            this.face.setDisplaySize(this.faceBaseSize, this.faceBaseSize);
          }
        });

        impactFn(); // ✅ yumruk yok, sadece fx/ses/reaksiyon

        this.tweens.add({
          targets: this.girl,
          x: this.girlHomeX,
          angle: 0,
          duration: 70,
          ease: "Quad.easeOut",
          onComplete: () => {
            this.girl.x = this.girlHomeX;
            this.girl.y = this.girlHomeY;
            this.girl.setAngle(0);
          }
        });
      }
    });
  }
  hit() {
    if (this.ended) return;
    if (this.rageSelecting) return;
    if (this.isPaused) return;

    // Rage: Hadouken → tık = enerji topu
    if (this.rageActive && this.rageWeaponKey === "rage_hadouken") {
      this.castHadouken();
      return;
    }
    // Rage: Kemer → tık = kemer şak
    if (this.rageActive && this.rageWeaponKey === "rage_belt") {
      this.castBelt();
      return;
    }
    if (this.hitBusy) return;
    this.hitBusy = true;

    this.face.setScale(1);
    this.face.setDisplaySize(this.faceBaseSize, this.faceBaseSize);
    this.body.y = this.bodyHomeY;
    this.face.y = this.faceHomeY;
    this.face.x = this.faceHomeX;

    this.totalHits++;
    this.updateComboAndMultiplier();

    const w = this.getActiveWeapon();
    let add = w.base * this.mult;

    // Rage bonus + özel efektler (seçilen silaha göre)
    if (this.rageActive) {
      if (this.rageWeaponKey === "rage_slipper_rain") {
        add += 3 * this.mult; // bonus damage
      } else if (this.rageWeaponKey === "rage_belt") {
        add += 5 * this.mult;
      } else if (this.rageWeaponKey === "rage_hadouken") {
        add += 7 * this.mult;
      }
    }

    this.score += add;
    this.scoreCountUp(this.score);

    this.anger = Math.min(100, this.anger + w.anger);
    this.drawBar();

    
    // öfke barı FULL → rage seçim ekranı (tek sefer)
    if (this.anger >= 100 && !this.rageActive && !this.rageSelecting && !this.rageQueued) {
      this.rageQueued = true;
      // vurma animasyonu bitsin diye minicik gecikme
      this.time.delayedCall(180, () => {
        this.rageQueued = false;
        this.enterRageSelection();
      });
    }

    const dir = (this.girlHomeX < this.face.x) ? 1 : -1;

    // silaha göre daha tok hitStop
    const k = this.getActiveWeaponKey();
    const hs =
      (k === "pan" || k === "rage_hadouken") ? 105 :
      (k === "rage_belt") ? 95 :
      (k === "slipper" || k === "rage_slipper_rain") ? 80 :
      (k === "slap") ? 62 : 55;
    this.hitStop(hs);

    this.impactRing();

    const impact = () => {
      // NEW: görsel "vuruldu" hissi
      this.faceFlash();
      this.spawnBruise();
      this.spawnSparks();
      const rk = this.rageActive ? (this.rageWeaponKey === "rage_belt" ? 2.0 : (this.rageWeaponKey === "rage_hadouken" ? 2.6 : 1.4)) : 1.0;
      this.cameraKick(dir, 10 * rk);
      this.faceDisplace(dir, rk);

      // mevcut efektler
      if (this.rageActive) {
        if (this.rageWeaponKey === "rage_slipper_rain") {
          this.spawnSlipperRain();
        } else if (this.rageWeaponKey === "rage_belt") {
          this.spawnBeltWhip(dir);
        } else if (this.rageWeaponKey === "rage_hadouken") {
          if (this.rageHadoukenShots > 0) {
            this.spawnHadouken();
            this.rageHadoukenShots--;
            if (this.rageHadoukenShots <= 0) this.endRage();
          } else {
            this.endRage();
          }
        }
      } else {
        this.spawnWeaponFx();
      }
      this.spawnImpactFx();
      this.hitScreenFlash();
      this.girlRecoil();
      this.targetReaction();
      this.playWeaponSound();
      this.floatingScore(add);
    };

    this.playTwoFrame(impact);

    this.time.delayedCall(130, () => {
      this.hitBusy = false;
      this.startIdleBobbing();
    });
  }

  openPauseOverlay() {
    if (this.ended || this.isPaused) return;
    this.isPaused = true;
    this.tweens.pauseAll();

    const { width, height } = this.scale;
    this.pauseLayer = this.add.container(0, 0).setDepth(10000);

    const dim = this.add.rectangle(width/2, height/2, width*1.6, height*1.6, 0x000000, 0.62).setInteractive();

    const panelW = Math.min(360, width - 40);
    const panelH = 300;
    const p = this.add.graphics();
    p.fillStyle(0x0b0b12, 0.92);
    p.fillRoundedRect(width/2 - panelW/2, height/2 - panelH/2, panelW, panelH, 22);
    p.lineStyle(2, 0xffffff, 0.16);
    p.strokeRoundedRect(width/2 - panelW/2, height/2 - panelH/2, panelW, panelH, 22);

    const title = this.makeText(width/2, height/2 - 115, "Duraklatıldı ⏸", 22, "#fff", "900").setOrigin(0.5);

    const mkBtn = (y, label) => {
      const w = panelW - 70, h = 48;
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 0.12);
      g.fillRoundedRect(width/2 - w/2, y - h/2, w, h, 16);
      g.lineStyle(2, 0xffffff, 0.14);
      g.strokeRoundedRect(width/2 - w/2, y - h/2, w, h, 16);

      const t = this.makeText(width/2, y - 10, label, 16, "#fff", "900").setOrigin(0.5);
      const hit = this.add.rectangle(width/2, y, w, h, 0x000000, 0.001).setInteractive({ useHandCursor: true });
      return { hit, g, t };
    };

    const b1 = mkBtn(height/2 - 20, "Devam");
    const b2 = mkBtn(height/2 + 40, "Tekrar Başla");
    const b3 = mkBtn(height/2 + 100, "Ana Menü");

    b1.hit.on("pointerdown", () => this.closePauseOverlay());
    b2.hit.on("pointerdown", () => {
      this.isPaused = false;
      this.tweens.resumeAll();
      this.scene.start("Game", { pack: this.pack });
    });
    b3.hit.on("pointerdown", () => {
      this.isPaused = false;
      this.tweens.resumeAll();
      this.scene.start("Splash", { pack: this.pack });
    });

    this.pauseLayer.add([dim, p, title, b1.g, b1.t, b1.hit, b2.g, b2.t, b2.hit, b3.g, b3.t, b3.hit]);
  }

  closePauseOverlay() {
    if (!this.isPaused) return;
    this.isPaused = false;
    if (this.pauseLayer) { this.pauseLayer.destroy(true); this.pauseLayer = null; }
    this.tweens.resumeAll();
  }

  endGame(reason) {
    if (this.ended) return;
    this.ended = true;

    this.stopIdleBobbing();
    this.tweens.resumeAll();
    this.isPaused = false;
    if (this.pauseLayer) { this.pauseLayer.destroy(true); this.pauseLayer = null; }

    const { width, height } = this.scale;

    this.add.rectangle(width/2, height/2, width*1.2, height*1.2, 0x000000, 0.60);

    const panelW = Math.min(360, width - 40);
    const panelH = 390;
    const p = this.add.graphics();
    p.fillStyle(0x0b0b12, 0.93);
    p.fillRoundedRect(width/2 - panelW/2, height/2 - panelH/2, panelW, panelH, 22);
    p.lineStyle(2, 0xffffff, 0.16);
    p.strokeRoundedRect(width/2 - panelW/2, height/2 - panelH/2, panelW, panelH, 22);

    this.makeText(width/2, height/2 - 170, reason, 22, "#fff", "900").setOrigin(0.5);

    const girlName = this.pack.girlName || "SEN";
    const boyName  = this.pack.boyName  || "O";

    this.add.text(
      width/2,
      height/2 - 112,
      `${girlName} vs ${boyName}\n\nSkor: ${this.score}\nEn iyi combo: ${this.bestCombo}\nToplam vuruş: ${this.totalHits}`,
      { fontFamily: UI_FONT, fontSize: "15px", color: "#ddd", align: "center", fontStyle: "800" }
    ).setOrigin(0.5).setShadow(0, 3, "#000", 12);

    const mkBtn = (y, label) => {
      const w = panelW - 70, h = 50;
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 0.12);
      g.fillRoundedRect(width/2 - w/2, y - h/2, w, h, 16);
      g.lineStyle(2, 0xffffff, 0.14);
      g.strokeRoundedRect(width/2 - w/2, y - h/2, w, h, 16);
      const t = this.makeText(width/2, y - 10, label, 16, "#fff", "900").setOrigin(0.5);
      const hit = this.add.rectangle(width/2, y, w, h, 0x000000, 0.001).setInteractive({ useHandCursor: true });
      return { hit, g, t };
    };

    const b1 = mkBtn(height/2 + 78, "Tekrar Başla");
    const b2 = mkBtn(height/2 + 138, "Ana Menü");

    b1.hit.on("pointerdown", () => this.scene.start("Game", { pack: this.pack }));
    b2.hit.on("pointerdown", () => this.scene.start("Splash", { pack: this.pack }));
  }
}

/* ---------------- BOOTSTRAP ---------------- */
(async () => {
  // Create game first (scenes will handle pack fetch)
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game",
    width: 390,
    height: 844,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [PreloadScene, BootScene, SplashScene, GameScene]
  });

  game.scene.start("Preload");
})();
