const params = new URLSearchParams(window.location.search);
const code = params.get("code") || "DEMO";
const packUrl = `packs/${code}.json`; // ✅ relative (Netlify-safe)

async function loadPack() {
  const res = await fetch(packUrl, { cache: "no-store" });
  if (!res.ok) throw new Error("Pack bulunamadı: " + packUrl);
  return await res.json();
}

function ensureBgm(scene) {
  if (window.__COUPLE_BONK_BGM && window.__COUPLE_BONK_BGM.isPlaying) return;
  if (!scene.cache.audio.exists("bgm")) return;
  const bgm = scene.sound.add("bgm", { loop: true, volume: 0.55 });
  bgm.play();
  window.__COUPLE_BONK_BGM = bgm;
}

const UI_FONT = "system-ui, -apple-system, Segoe UI, Arial";

/**
 * ✅ Background:
 * - Always draws a nice gradient base
 * - If bg texture exists, overlays it
 * - Never fails silently (Netlify asset path issues won't blank screen)
 */
function drawPremiumBg(scene) {
  const { width, height } = scene.scale;

  // base gradient
  const grad = scene.add.graphics();
  grad.fillGradientStyle(0x180d2a, 0x180d2a, 0x05060a, 0x05060a, 1);
  grad.fillRect(0, 0, width, height);

  // overlay image only if loaded
  if (scene.textures.exists("bg")) {
    const bg = scene.add.image(width / 2, height / 2, "bg");
    bg.setDisplaySize(width, height);
    bg.setAlpha(0.28);
  }

  // vignette
  const vignette = scene.add.graphics();
  vignette.fillStyle(0x000000, 0.25);
  vignette.fillRect(0, 0, width, height);
  vignette.setBlendMode(Phaser.BlendModes.MULTIPLY);

  // tiny noise
  const noise = scene.add.graphics();
  for (let i = 0; i < 650; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const a = Math.random() * 0.05;
    noise.fillStyle(0xffffff, a);
    noise.fillRect(x, y, 1, 1);
  }
  noise.setBlendMode(Phaser.BlendModes.OVERLAY);
}

/* ---------------- PRELOAD ---------------- */
class PreloadScene extends Phaser.Scene {
  constructor() {
    super("Preload");
  }

  preload() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x0b0b12, 1);

    const title = this.add
      .text(width / 2, height / 2 - 46, "Yükleniyor…", {
        fontFamily: UI_FONT,
        fontSize: "22px",
        color: "#fff",
        fontStyle: "900",
      })
      .setOrigin(0.5);

    const hint = this.add
      .text(width / 2, height / 2 - 16, "Netlify naz yaparsa dosya yolu suçlu 😈", {
        fontFamily: UI_FONT,
        fontSize: "12px",
        color: "#cfcfe6",
      })
      .setOrigin(0.5);

    const barW = Math.min(320, width - 60);
    const barH = 14;
    const x = width / 2 - barW / 2;
    const y = height / 2 + 22;

    const box = this.add.graphics();
    box.fillStyle(0xffffff, 0.12);
    box.fillRoundedRect(x, y, barW, barH, 8);

    const bar = this.add.graphics();

    const percentText = this.add
      .text(width / 2, y + 28, "0%", {
        fontFamily: UI_FONT,
        fontSize: "12px",
        color: "#fff",
        fontStyle: "800",
      })
      .setOrigin(0.5);

    this.load.on("progress", (p) => {
      bar.clear();
      bar.fillStyle(0xffffff, 0.75);
      bar.fillRoundedRect(x, y, Math.max(8, barW * p), barH, 8);
      percentText.setText(Math.round(p * 100) + "%");
    });

    this.load.on("complete", () => {
      bar.destroy();
      box.destroy();
      title.destroy();
      hint.destroy();
      percentText.destroy();
    });

    // ✅ Background (Netlify-safe): put file at public/assets/bg.png
    // URL test: https://.../assets/bg.png
    this.load.image("bg", "assets/bg.png");

    // music + common
    this.load.audio("bgm", "assets/music_intro.mp3");

    this.load.image("body_base", "assets/body_base.png");
    this.load.image("girl_base", "assets/girl_base.png");

    this.load.audio("switch", "sounds/switch.mp3");

    this.load.audio("slap1", "sounds/slap1.mp3");
    this.load.audio("slap2", "sounds/slap2.mp3");
    this.load.audio("slap3", "sounds/slap3.mp3");

    this.load.audio("slipper1", "sounds/slipper1.mp3");
    this.load.audio("slipper2", "sounds/slipper2.mp3");
    this.load.audio("slipper3", "sounds/slipper3.mp3");

    this.load.audio("pillow1", "sounds/pillow1.mp3");
    this.load.audio("pillow2", "sounds/pillow2.mp3");
    this.load.audio("pillow3", "sounds/pillow3.mp3");

    this.load.audio("pan1", "sounds/pan1.mp3");
    this.load.audio("pan2", "sounds/pan2.mp3");
    this.load.audio("pan3", "sounds/pan3.mp3");
  }

  create() {
    this.scene.start("Boot");
  }
}

/* ---------------- BOOT ---------------- */
class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  async create() {
    try {
      const pack = await loadPack();

      // ✅ face path also relative-safe
      // example pack.face: "faces/face.png"
      this.load.image("face", pack.face);

      this.load.once("complete", () => {
        this.scene.start("Splash", { pack });
      });

      this.load.start();
    } catch (e) {
      const { width, height } = this.scale;
      this.add.rectangle(width / 2, height / 2, width, height, 0x0b0b12, 1);
      this.add
        .text(width / 2, height / 2 - 10, "Pack bulunamadı 💀", {
          fontFamily: UI_FONT,
          fontSize: "20px",
          color: "#fff",
          fontStyle: "900",
        })
        .setOrigin(0.5);
      this.add
        .text(width / 2, height / 2 + 22, `${e}`, {
          fontFamily: UI_FONT,
          fontSize: "12px",
          color: "#cfcfe6",
        })
        .setOrigin(0.5);
    }
  }
}

/* ---------------- SPLASH ---------------- */
class SplashScene extends Phaser.Scene {
  constructor() {
    super("Splash");
  }
  init(data) {
    this.pack = data.pack;
  }

  create() {
    const { width, height } = this.scale;

    drawPremiumBg(this);
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
    this.add
      .text(width / 2, cardY - 270, title, {
        fontFamily: UI_FONT,
        fontSize: "28px",
        color: "#fff",
        fontStyle: "800",
      })
      .setOrigin(0.5)
      .setShadow(0, 3, "#000", 12);

    const tagline = this.pack.tagline || "Basit oynanış • tok his • paylaşınca güldürür";
    this.add
      .text(width / 2, cardY - 235, tagline, {
        fontFamily: UI_FONT,
        fontSize: "12px",
        color: "#d9d9ff",
        align: "center",
        wordWrap: { width: cardW - 40 },
      })
      .setOrigin(0.5);

    // previews
    const frameY = cardY - 75;
    const frameW = Math.min(150, (width - 84) / 2);
    const frameH = 210;

    const leftX = width / 2 - frameW / 2 - 18;
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
    const boyName = this.pack.boyName || "O";

    this.add
      .text(leftX, frameY - frameH / 2 + 10, girlName, {
        fontFamily: UI_FONT,
        fontSize: "12px",
        color: "#ffd1f3",
        fontStyle: "900",
      })
      .setOrigin(0.5, 0);

    this.add
      .text(rightX, frameY - frameH / 2 + 10, boyName, {
        fontFamily: UI_FONT,
        fontSize: "12px",
        color: "#cfe8ff",
        fontStyle: "900",
      })
      .setOrigin(0.5, 0);

    const girl = this.add.image(leftX, frameY + frameH / 2 - 18, "girl_base");
    girl.setOrigin(0.5, 1);
    girl.setDisplaySize(frameW * 0.84, (frameW * 0.84) * (girl.height / girl.width));

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

    this.tweens.add({ targets: girl, y: girl.y - 6, duration: 650, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.tweens.add({ targets: body, y: body.y - 4, duration: 700, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.tweens.add({ targets: face, y: face.y - 3, duration: 700, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    // start button
    const btnW = Math.min(300, width - 80);
    const btnH = 56;
    const btnY = cardY + 160;

    const btn = this.add.graphics();
    btn.fillStyle(0xffffff, 0.14);
    btn.fillRoundedRect(width / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH, 18);
    btn.lineStyle(2, 0xffffff, 0.18);
    btn.strokeRoundedRect(width / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH, 18);

    this.add
      .text(width / 2, btnY - 12, "BAŞLA", {
        fontFamily: UI_FONT,
        fontSize: "18px",
        color: "#fff",
        fontStyle: "900",
      })
      .setOrigin(0.5)
      .setShadow(0, 3, "#000", 12);

    this.add
      .text(width / 2, btnY + 12, "Ekrana dokun = vur • Alttan silah seç", {
        fontFamily: UI_FONT,
        fontSize: "11px",
        color: "#cfcfe6",
      })
      .setOrigin(0.5);

    const hit = this.add
      .rectangle(width / 2, btnY, btnW, btnH, 0x000000, 0.001)
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
  constructor() {
    super("Game");
  }

  init(data) {
    this.pack = data.pack;
    this.timeLeft = 60;
    this.score = 0;
    this.displayScore = 0;

    this.combo = 0;
    this.mult = 1;
    this.lastHitAt = 0;
    this.comboWindowMs = 750;
    this.bestCombo = 0;

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
      fontStyle: weight,
    }).setShadow(0, 3, "#000", 12);
  }

  create() {
    const { width, height } = this.scale;

    drawPremiumBg(this);
    ensureBgm(this);

    // UI
    const panel = this.add.graphics();
    panel.fillStyle(0x0b0b12, 0.62);
    panel.fillRoundedRect(10, 10, width - 20, 92, 20);
    panel.lineStyle(2, 0xffffff, 0.10);
    panel.strokeRoundedRect(10, 10, width - 20, 92, 20);

    this.scoreText = this.makeText(24, 16, "Skor: 0", 18, "#fff", "900").setOrigin(0, 0);
    this.comboText = this.makeText(24, 42, "Combo: 0  x1", 13, "#ffcc00", "800").setOrigin(0, 0);

    this.timeText = this.makeText(width - 22, 16, `${this.timeLeft}s`, 18, "#fff", "900").setOrigin(1, 0);
    this.weaponLabel = this.makeText(width - 22, 42, "", 13, "#b7e3ff", "800").setOrigin(1, 0);

    // characters
    this.body = this.add.image(width / 2, (height - this.bottomBarH) / 2 + 120, "body_base");
    const targetBodyW = Math.min(width * 0.82, 330);
    this.body.setDisplaySize(targetBodyW, targetBodyW * (this.body.height / this.body.width));

    const bodyTopY = this.body.y - this.body.displayHeight / 2;
    const faceY = bodyTopY + 70;
    const faceSize = Math.min(width * 0.46, 190);
    this.faceBaseSize = faceSize;

    this.face = this.add.image(this.body.x, faceY, "face").setDisplaySize(faceSize, faceSize);
    const maskG = this.make.graphics({ add: false });
    maskG.fillCircle(this.face.x, this.face.y, faceSize / 2);
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

    this.hitFlash = this.add.rectangle(width / 2, height / 2, width, height, 0xffffff, 0).setDepth(9999);

    this.weapons = {
      slap: { label: "👋 Tokat", base: 1, sounds: ["slap1", "slap2", "slap3"] },
      slipper: { label: "🥿 Terlik", base: 2, sounds: ["slipper1", "slipper2", "slipper3"] },
      pillow: { label: "🛋️ Yastık", base: 3, sounds: ["pillow1", "pillow2", "pillow3"] },
      pan: { label: "🍳 Tava", base: 5, sounds: ["pan1", "pan2", "pan3"] },
    };

    this.updateWeaponUI();
    this.createWeaponBar();

    // timer
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.isPaused) return;
        this.timeLeft--;
        this.timeText.setText(`${this.timeLeft}s`);
        if (this.timeLeft <= 0) this.endGame();
      },
    });

    // tap = hit
    this.input.on("pointerdown", (p) => {
      if (this.isPaused) return;
      if (p.y >= height - this.bottomBarH) return;
      this.hit();
    });
  }

  updateWeaponUI() {
    this.weaponLabel.setText(`Silah: ${this.weapons[this.weapon].label}`);
    if (!this.weaponButtons) return;
    for (const k of Object.keys(this.weaponButtons)) {
      const sel = k === this.weapon;
      this.weaponButtons[k].bg.setAlpha(sel ? 0.9 : 0.22);
      this.weaponButtons[k].txt.setScale(sel ? 1.18 : 1.0);
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
      const x = pad + btnW / 2 + i * (btnW + pad);
      const y = barY + this.bottomBarH / 2 + 6;

      const bg = this.add
        .rectangle(x, y, btnW, btnH, 0xffffff, 0.22)
        .setStrokeStyle(2, 0xffffff, 0.12)
        .setInteractive({ useHandCursor: true });

      const txt = this.add.text(x, y - 16, emojis[k], { fontSize: "30px", fontFamily: UI_FONT }).setOrigin(0.5);

      const set = () => {
        if (this.isPaused) return;
        this.weapon = k;
        if (this.cache.audio.exists("switch")) this.sound.play("switch", { volume: 0.65 });
        this.updateWeaponUI();
      };

      bg.on("pointerdown", set);
      txt.setInteractive({ useHandCursor: true }).on("pointerdown", set);

      this.weaponButtons[k] = { bg, txt };
    });

    this.updateWeaponUI();
  }

  updateCombo() {
    const now = this.time.now;
    this.combo = now - this.lastHitAt <= this.comboWindowMs ? this.combo + 1 : 1;
    this.lastHitAt = now;

    if (this.combo >= 25) this.mult = 5;
    else if (this.combo >= 15) this.mult = 3;
    else if (this.combo >= 7) this.mult = 2;
    else this.mult = 1;

    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.comboText.setText(`Combo: ${this.combo}  x${this.mult}`);
  }

  hitStop(ms = 60) {
    const prev = this.tweens.timeScale ?? 1;
    this.tweens.timeScale = 0.08;
    window.setTimeout(() => {
      this.tweens.timeScale = prev;
    }, ms);
  }

  playWeaponSound() {
    const w = this.weapons[this.weapon];
    const key = Phaser.Utils.Array.GetRandom(w.sounds);
    const rate = Phaser.Math.FloatBetween(0.95, 1.05);
    if (this.cache.audio.exists(key)) this.sound.play(key, { volume: 0.9, rate });
  }

  hit() {
    if (this.hitBusy) return;
    this.hitBusy = true;

    this.totalHits++;
    this.updateCombo();

    const w = this.weapons[this.weapon];
    const add = w.base * this.mult;
    this.score += add;
    this.scoreText.setText("Skor: " + this.score);

    const dir = this.girlHomeX < this.face.x ? 1 : -1;

    const hs = this.weapon === "pan" ? 90 : this.weapon === "slipper" ? 75 : this.weapon === "slap" ? 62 : 55;
    this.hitStop(hs);

    // ✅ “dövme” hissi: poz boz + geri topla
    this.cameras.main.shake(this.weapon === "pan" ? 120 : 80, this.weapon === "pan" ? 0.012 : 0.009);

    this.tweens.add({
      targets: this.face,
      x: this.faceHomeX + dir * (this.weapon === "pan" ? 10 : 6),
      y: this.faceHomeY + 6,
      angle: -dir * (this.weapon === "pan" ? 14 : 10),
      duration: 60,
      yoyo: true,
      ease: "Quad.easeOut",
      onComplete: () => {
        this.face.x = this.faceHomeX;
        this.face.y = this.faceHomeY;
        this.face.angle = 0;
      },
    });

    this.tweens.add({
      targets: this.body,
      y: this.bodyHomeY + (this.weapon === "pan" ? 7 : 4),
      duration: 55,
      yoyo: true,
      ease: "Quad.easeOut",
      onComplete: () => (this.body.y = this.bodyHomeY),
    });

    this.hitFlash.setAlpha(0.06);
    this.tweens.add({ targets: this.hitFlash, alpha: 0, duration: 110, ease: "Quad.easeOut" });

    this.playWeaponSound();

    this.time.delayedCall(140, () => {
      this.hitBusy = false;
    });
  }

  endGame() {
    this.isPaused = true;
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width * 1.2, height * 1.2, 0x000000, 0.60);
    const p = this.add.graphics();
    const panelW = Math.min(360, width - 40);
    const panelH = 320;

    p.fillStyle(0x0b0b12, 0.93);
    p.fillRoundedRect(width / 2 - panelW / 2, height / 2 - panelH / 2, panelW, panelH, 22);
    p.lineStyle(2, 0xffffff, 0.16);
    p.strokeRoundedRect(width / 2 - panelW / 2, height / 2 - panelH / 2, panelW, panelH, 22);

    this.makeText(width / 2, height / 2 - 110, "Bitti 😈", 24, "#fff", "900").setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 - 50, `Skor: ${this.score}\nBest combo: ${this.bestCombo}\nHits: ${this.totalHits}`, {
        fontFamily: UI_FONT,
        fontSize: "15px",
        color: "#ddd",
        align: "center",
        fontStyle: "800",
      })
      .setOrigin(0.5);

    const btn = this.add
      .rectangle(width / 2, height / 2 + 90, panelW - 70, 52, 0xffffff, 0.14)
      .setStrokeStyle(2, 0xffffff, 0.14)
      .setInteractive({ useHandCursor: true });

    this.makeText(width / 2, height / 2 + 76, "Ana Menü", 16, "#fff", "900").setOrigin(0.5);

    btn.on("pointerdown", () => this.scene.start("Splash", { pack: this.pack }));
  }
}

/* ---------------- BOOTSTRAP ---------------- */
(() => {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game", // ✅ index.html’de <div id="game"></div> şart
    width: 390,
    height: 844,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [PreloadScene, BootScene, SplashScene, GameScene],
  });

  game.scene.start("Preload");
})();
