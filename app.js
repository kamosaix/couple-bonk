const params = new URLSearchParams(window.location.search);
const code = params.get("code") || "DEMO";
const packUrl = `/packs/${code}.json`;

async function loadPack() {
  const res = await fetch(packUrl, { cache: "no-store" });
  if (!res.ok) throw new Error("Pack bulunamadı: " + packUrl);
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

    // Common assets (heavy ones)
    this.load.image("bg_intro", "/assets/bg_real.jpg");
    this.load.audio("bgm", "/assets/music_intro.mp3");

    this.load.image("body_base", "/assets/body_base.png");
    this.load.image("girl_base", "/assets/girl_base.png");

    this.load.audio("switch", "/sounds/switch.mp3");

    this.load.audio("slap1", "/sounds/slap1.mp3");
    this.load.audio("slap2", "/sounds/slap2.mp3");
    this.load.audio("slap3", "/sounds/slap3.mp3");

    this.load.audio("slipper1", "/sounds/slipper1.mp3");
    this.load.audio("slipper2", "/sounds/slipper2.mp3");
    this.load.audio("slipper3", "/sounds/slipper3.mp3");

    this.load.audio("pillow1", "/sounds/pillow1.mp3");
    this.load.audio("pillow2", "/sounds/pillow2.mp3");
    this.load.audio("pillow3", "/sounds/pillow3.mp3");

    this.load.audio("pan1", "/sounds/pan1.mp3");
    this.load.audio("pan2", "/sounds/pan2.mp3");
    this.load.audio("pan3", "/sounds/pan3.mp3");
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

    const title = this.pack.title || "Couple Bonk";
    this.add.text(width / 2, cardY - 270, title, {
      fontFamily: UI_FONT, fontSize: "28px", color: "#fff", fontStyle: "800"
    }).setOrigin(0.5).setShadow(0, 3, "#000", 12);

    const tagline = this.pack.tagline || "Basit oynanış • aşırı iyi his • gösterince güldürür";
    this.add.text(width / 2, cardY - 235, tagline, {
      fontFamily: UI_FONT, fontSize: "12px", color: "#d9d9ff", align: "center",
      wordWrap: { width: cardW - 40 }
    }).setOrigin(0.5);

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

    this.add.text(rightX, frameY - frameH / 2 + 10, boyName, {
      fontFamily: UI_FONT, fontSize: "12px", color: "#cfe8ff", fontStyle: "900"
    }).setOrigin(0.5, 0);

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

    this.add.text(width / 2, cardY + 260, "Kişiye özel: kafa foto + isimler + sesler", {
      fontFamily: UI_FONT, fontSize: "12px", color: "#ddd"
    }).setOrigin(0.5);
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

    this.hitFlash = this.add.rectangle(width/2, height/2, width, height, 0xffffff, 0).setDepth(9999);

    // Weapons
    this.weapons = {
      slap:    { label: "👋 Tokat",  base: 1, anger: 1, sounds: ["slap1","slap2","slap3"], fx: "👋" },
      slipper: { label: "🥿 Terlik", base: 2, anger: 2, sounds: ["slipper1","slipper2","slipper3"], fx: "🥿" },
      pillow:  { label: "🛋️ Yastık", base: 3, anger: 1, sounds: ["pillow1","pillow2","pillow3"], fx: "🛋️" },
      pan:     { label: "🍳 Tava",   base: 5, anger: 4, sounds: ["pan1","pan2","pan3"], fx: "🍳" }
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
      if (this.ended || this.isPaused) return;
      if (p.y >= height - this.bottomBarH) return;
      this.hit();
    });
  }

  hitStop(ms = 60) {
    const prev = this.tweens.timeScale ?? 1;
    this.tweens.timeScale = 0.08;
    window.setTimeout(() => {
      if (this.ended) return;
      this.tweens.timeScale = prev;
    }, ms);
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

  updateWeaponUI() {
    const w = this.weapons[this.weapon];
    this.weaponLabel.setText(`Silah: ${w.label}`);

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
    const emojis = { slap: "👋", slipper: "🥿", pillow: "🛋️", pan: "🍳" };
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
      this.face.y = this.faceHomeY;
      this.face.setAngle(0);
      this.face.setScale(1);
      this.face.setDisplaySize(this.faceBaseSize, this.faceBaseSize);
    }
  }

  playWeaponSound() {
    const w = this.weapons[this.weapon];
    const key = Phaser.Utils.Array.GetRandom(w.sounds);
    const rate = Phaser.Math.FloatBetween(0.95, 1.05);
    this.sound.play(key, { volume: 0.9, rate });
  }

  spawnWeaponFx() {
    const w = this.weapons[this.weapon];
    const { width } = this.scale;

    const startX = (this.girlHomeX < this.face.x) ? -20 : (width + 20);
    const endX = this.face.x + Phaser.Math.Between(-10, 10);
    const endY = this.face.y + Phaser.Math.Between(-5, 12);

    const fx = this.add.text(startX, endY - 10, w.fx, { fontSize: "54px", fontFamily: UI_FONT }).setOrigin(0.5);

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
    const push = (this.weapon === "pan") ? 18 : (this.weapon === "slipper" ? 14 : (this.weapon === "slap" ? 12 : 8));
    const tilt = (this.weapon === "pan") ? 10 : (this.weapon === "slipper" ? 8 : 6);

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
    if (this.weapon === "pan") this.cameras.main.shake(210, 0.020);
    else if (this.weapon === "slipper") this.cameras.main.shake(130, 0.013);
    else if (this.weapon === "slap") this.cameras.main.shake(95, 0.010);
    else this.cameras.main.shake(55, 0.006);

    const amp = (this.weapon === "pan") ? 18 : (this.weapon === "slipper" ? 14 : 10);
    const dur = (this.weapon === "pillow") ? 70 : 55;

    this.tweens.add({
      targets: this.face,
      angle: { from: -amp, to: amp },
      duration: dur,
      yoyo: true,
      repeat: 2,
      onComplete: () => this.face.setAngle(0)
    });

    const bodyKick = (this.weapon === "pan") ? 6 : (this.weapon === "pillow") ? 2 : 3;
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
    if (this.ended || this.isPaused) return;
    if (this.hitBusy) return;
    this.hitBusy = true;

    this.face.setScale(1);
    this.face.setDisplaySize(this.faceBaseSize, this.faceBaseSize);
    this.body.y = this.bodyHomeY;
    this.face.y = this.faceHomeY;

    this.totalHits++;
    this.updateComboAndMultiplier();

    const w = this.weapons[this.weapon];
    const add = w.base * this.mult;

    this.score += add;
    this.scoreCountUp(this.score);

    this.anger = Math.min(100, this.anger + w.anger);
    this.drawBar();

    this.hitStop(60);
    this.impactRing();

    const impact = () => {
      this.spawnWeaponFx();
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
