(() => {
  const qs = new URLSearchParams(location.search);
  const CODE = (qs.get("code") || "DEMO").trim();
  const PACK_BASE = `/packs/${CODE}`;
  const PACK_JSON = `${PACK_BASE}.json`;
  const PACK_FACE = `${PACK_BASE}_face.jpg`;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const WEAPONS = [
    { key: "hand",   label: "🖐️", name: "Tokat",         sounds: ["slap1", "slap2", "slap3"],         score: 1, shake: 6,  hitScale: 1.00 },
    { key: "pillow", label: "🧸", name: "Yastık",        sounds: ["pillow1", "pillow2", "pillow3"],   score: 2, shake: 4,  hitScale: 1.02 },
    { key: "pan",    label: "🍳", name: "Yumurta Tavası",sounds: ["pan1", "pan2", "pan3"],            score: 3, shake: 8,  hitScale: 1.03 },
  ];

  const R = { pack: null, weaponKey: "hand", music: null, musicStarted: false };

  // --------- UI Helpers (rounded rect without setRadius) ----------
  function roundedRect(scene, x, y, w, h, r, fillColor, fillAlpha, strokeColor, strokeAlpha, depth = 0) {
    const g = scene.add.graphics().setDepth(depth);
    g.fillStyle(fillColor, fillAlpha);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, r);
    if (strokeColor != null) {
      g.lineStyle(2, strokeColor, strokeAlpha ?? 1);
      g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, r);
    }
    return g;
  }

  function circleMask(scene, x, y, radius) {
    const mg = scene.make.graphics({ x: 0, y: 0, add: false });
    mg.fillStyle(0xffffff);
    mg.fillCircle(x, y, radius);
    return mg.createGeometryMask();
  }

  class BootScene extends Phaser.Scene {
    constructor() { super("Boot"); }
    preload() {
      this.load.image("bg", "/assets/bg.jpg");
      this.load.image("girlBase", "/assets/girl_base.png");
      this.load.image("bodyBase", "/assets/body_base.png");
      this.load.audio("musicIntro", "/assets/music_intro.mp3");

      this.load.audio("slap1", "/sounds/slap1.mp3");
      this.load.audio("slap2", "/sounds/slap2.mp3");
      this.load.audio("slap3", "/sounds/slap3.mp3");
      this.load.audio("pillow1", "/sounds/pillow1.mp3");
      this.load.audio("pillow2", "/sounds/pillow2.mp3");
      this.load.audio("pillow3", "/sounds/pillow3.mp3");
      this.load.audio("pan1", "/sounds/pan1.mp3");
      this.load.audio("pan2", "/sounds/pan2.mp3");
      this.load.audio("pan3", "/sounds/pan3.mp3");
      this.load.audio("switchSfx", "/sounds/switch.mp3");

      this.load.json("pack", PACK_JSON);
      this.load.image("face", PACK_FACE);

      const { width, height } = this.scale;

      const title = this.add.text(width / 2, height * 0.42, "Yükleniyor…", {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "22px",
        color: "#ffffff"
      }).setOrigin(0.5);

      const barW = Math.min(320, width * 0.7);
      const barBg = this.add.rectangle(width / 2, height * 0.5, barW, 10, 0xffffff, 0.15);
      const barFill = this.add.rectangle(barBg.x - barW / 2, barBg.y, 2, 10, 0xffffff, 0.9).setOrigin(0, 0.5);

      this.load.on("progress", (p) => { barFill.width = clamp(barW * p, 2, barW); });

      // debug: hangi dosya patlıyor gör
      this.load.on("loaderror", (file) => console.warn("LOAD ERROR:", file?.key, file?.src));
      this.load.on("fileerror", (file) => console.warn("FILE ERROR:", file?.key, file?.src));

      this.load.on("complete", () => {
        title.destroy(); barBg.destroy(); barFill.destroy();
      });

      // güvenlik: 6sn sonra menüye zorla geç
      setTimeout(() => {
        try {
          if (this.scene.isActive("Boot")) this.scene.start("Menu");
        } catch (e) {}
      }, 6000);
    }

    create() {
      const pk = this.cache.json.get("pack") || {};
      R.pack = {
        title: pk.title || "DEMO 💘 DEMO",
        subtitle: pk.subtitle || "Basit oynanış • gösterince güldürür",
        startHint: pk.startHint || "Ekrana dokun = vur • Alttan silah seç",
        footer: pk.footer || "Kişiye özel: kafa foto + isimler + sesler",
        names: pk.names || { attacker: "O", target: "O" },
      };
      this.scene.start("Menu");
    }
  }

  class MenuScene extends Phaser.Scene {
    constructor() { super("Menu"); }

    create() {
      const { width, height } = this.scale;

      this.add.image(width / 2, height / 2, "bg").setDisplaySize(width, height).setDepth(-50);

      // card (rounded via graphics)
      const cardW = Math.min(420, width * 0.88);
      const cardH = Math.min(620, height * 0.78);
      const cardY = height / 2;

      const card = roundedRect(this, width / 2, cardY, cardW, cardH, 18, 0x0b0f1a, 0.78, 0xffffff, 0.08, 0);

      this.add.text(width / 2, height * 0.18, R.pack.title, {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "34px",
        color: "#ffffff",
        fontStyle: "800"
      }).setOrigin(0.5);

      this.add.text(width / 2, height * 0.23, R.pack.subtitle, {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "14px",
        color: "rgba(255,255,255,0.72)"
      }).setOrigin(0.5);

      // face circle preview
      const faceSize = Math.min(160, width * 0.34);
      const faceX = width / 2;
      const faceY = height * 0.33;

      const face = this.add.image(faceX, faceY, "face");
      face.setMask(circleMask(this, faceX, faceY, faceSize / 2));
      face.setDisplaySize(faceSize, faceSize);

      const ring = this.add.graphics();
      ring.lineStyle(3, 0xffffff, 0.18);
      ring.strokeCircle(faceX, faceY, faceSize / 2 + 6);

      // Start button (rounded)
      const btnY = height * 0.50;
      const btnW = Math.min(320, width * 0.70);
      const btnH = 54;
      const btn = roundedRect(this, width / 2, btnY, btnW, btnH, 14, 0xffffff, 0.12, 0xffffff, 0.16, 2);
      const btnHit = this.add.rectangle(width / 2, btnY, btnW, btnH, 0x000000, 0).setInteractive({ useHandCursor: true }).setDepth(3);

      this.add.text(width / 2, btnY, "BAŞLA", {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "20px",
        color: "#ffffff",
        fontStyle: "800"
      }).setOrigin(0.5).setDepth(3);

      this.add.text(width / 2, btnY + 34, R.pack.startHint, {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "12px",
        color: "rgba(255,255,255,0.65)"
      }).setOrigin(0.5);

      this.add.text(width / 2, height * 0.78, R.pack.footer, {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "12px",
        color: "rgba(255,255,255,0.70)"
      }).setOrigin(0.5);

      // couple preview: smaller girl so it doesn't overflow
      const previewY = height * 0.63;
      const girl = this.add.image(width / 2 - 70, previewY, "girlBase").setOrigin(0.5, 1);
      girl.setScale(Math.min(0.28, width / 900));

      const body = this.add.image(width / 2 + 70, previewY, "bodyBase").setOrigin(0.5, 1);
      body.setScale(Math.min(0.32, width / 900));

      const startMusic = () => {
        if (R.musicStarted) return;
        R.musicStarted = true;
        if (!R.music) R.music = this.sound.add("musicIntro", { loop: true, volume: 0.55 });
        if (!R.music.isPlaying) R.music.play();
      };

      const goGame = () => { startMusic(); this.scene.start("Game"); };

      btnHit.on("pointerdown", goGame);
      this.input.once("pointerdown", startMusic);
      this.input.keyboard?.once("keydown", startMusic);

      this.scale.on("resize", () => this.scene.restart());
    }
  }

  class GameScene extends Phaser.Scene {
    constructor() { super("Game"); }

    create() {
      const { width, height } = this.scale;

      this.add.image(width / 2, height / 2, "bg").setDisplaySize(width, height).setDepth(-50);

      this.score = 0;
      this.combo = 0;
      this.lastHitAt = 0;
      this.anger = 1.0;
      this.pausedUI = null;

      this.body = this.add.image(width / 2, height * 0.82, "bodyBase").setOrigin(0.5, 1);
      this.body.setScale(Math.min(0.60, width / 520));

      this.faceSize = Math.min(width, height) * 0.32;
      this.face = this.add.image(width / 2, height * 0.38, "face");
      this.face.setDisplaySize(this.faceSize, this.faceSize);
      this.face.setMask(circleMask(this, this.face.x, this.face.y, this.faceSize / 2));

      this.girl = this.add.image(width / 2 - width * 0.20, height * 0.92, "girlBase").setOrigin(0.5, 1);
      this.girl.setScale(Math.min(0.72, width / 520));

      this._startIdleTweens();

      const font = "system-ui, -apple-system, Segoe UI, Roboto, Arial";
      this.txtScore = this.add.text(16, 14, `Skor: 0`, { fontFamily: font, fontSize: "20px", color: "#fff", fontStyle: "800" }).setDepth(50);
      this.txtCombo = this.add.text(16, 40, `Combo: 0 x1`, { fontFamily: font, fontSize: "14px", color: "rgba(255,215,0,0.95)", fontStyle: "700" }).setDepth(50);
      this.txtWeapon = this.add.text(width - 16, 40, `Silah: ${this._weaponLabel()}`, { fontFamily: font, fontSize: "14px", color: "rgba(255,255,255,0.85)", fontStyle: "700" }).setOrigin(1, 0).setDepth(50);

      this.btnPause = this.add.text(width - 16, 72, "⏸", { fontFamily: font, fontSize: "22px", color: "rgba(255,255,255,0.9)" })
        .setOrigin(1, 0).setDepth(60).setInteractive({ useHandCursor: true });
      this.btnPause.on("pointerdown", () => this._openPause());

      // anger bar
      this.angerX = width - 24;
      this.angerY = height * 0.22;
      this.angerH = height * 0.60;
      this.angerW = 10;

      this.angerBg = this.add.rectangle(this.angerX, this.angerY + this.angerH / 2, this.angerW, this.angerH, 0xffffff, 0.10).setDepth(40);
      this.angerFill = this.add.rectangle(this.angerX, this.angerY + this.angerH, this.angerW, 2, 0xff4d4d, 0.95).setOrigin(0.5, 1).setDepth(41);

      this._buildWeaponBar();

      this.hitZone = this.add.zone(0, 0, width, height).setOrigin(0, 0).setDepth(1).setInteractive();
      this.hitZone.on("pointerdown", (p) => {
        if (this._isPaused()) return;
        if (p.y > height - 120) return;
        this._hit();
      });

      this.time.addEvent({ delay: 50, loop: true, callback: () => this._tick() });

      this.scale.on("resize", () => this.scene.restart());
    }

    _weaponLabel() {
      const w = WEAPONS.find(x => x.key === R.weaponKey) || WEAPONS[0];
      return `${w.label} ${w.name}`;
    }

    _buildWeaponBar() {
      const { width, height } = this.scale;
      const barH = 98;

      this.add.rectangle(width / 2, height - barH / 2, width, barH, 0x000000, 0.35).setDepth(100);

      const gap = 10;
      const btnSize = 72;
      const totalW = WEAPONS.length * btnSize + (WEAPONS.length - 1) * gap;
      let startX = width / 2 - totalW / 2 + btnSize / 2;
      const y = height - barH / 2;

      this.weaponBtns = [];

      WEAPONS.forEach((w, i) => {
        const x = startX + i * (btnSize + gap);

        const box = roundedRect(this, x, y, btnSize, btnSize, 14, 0xffffff, 0.08, 0xffffff, 0.10, 110);
        const hit = this.add.rectangle(x, y, btnSize, btnSize, 0x000000, 0).setDepth(111).setInteractive({ useHandCursor: true });
        const txt = this.add.text(x, y - 2, w.label, { fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial", fontSize: "30px", color: "#fff" })
          .setOrigin(0.5).setDepth(112);

        const sel = this.add.graphics().setDepth(113);
        sel.lineStyle(2, 0xffffff, 0.35);
        sel.strokeRoundedRect(x - btnSize / 2, y - btnSize / 2, btnSize, btnSize, 14);
        sel.setVisible(w.key === R.weaponKey);

        hit.on("pointerdown", () => {
          if (this._isPaused()) return;
          R.weaponKey = w.key;
          this.sound.play("switchSfx", { volume: 0.35 });
          this.txtWeapon.setText(`Silah: ${this._weaponLabel()}`);
          this.weaponBtns.forEach(b => b.sel.setVisible(b.key === R.weaponKey));
        });

        this.weaponBtns.push({ key: w.key, sel });
      });

      if (isMobile()) {
        this.add.text(16, height - 118, "Alttan silah seç", {
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
          fontSize: "12px",
          color: "rgba(255,255,255,0.55)"
        }).setDepth(120);
      }
    }

    _startIdleTweens() {
      const baseDur = 900;
      const calcDur = () => clamp(baseDur - this.combo * 18, 260, 900);

      if (this.idleTweens) this.idleTweens.forEach(t => t?.remove());
      this.idleTweens = [];

      const mkTween = (target, ampY) => {
        const t = this.tweens.add({
          targets: target,
          y: target.y - ampY,
          duration: calcDur(),
          yoyo: true,
          repeat: -1,
          ease: "Sine.inOut",
        });
        this.idleTweens.push(t);
      };

      mkTween(this.girl, 10);
      mkTween(this.body, 6);
      mkTween(this.face, 7);
    }

    _refreshIdleSpeed() { this._startIdleTweens(); }

    _hit() {
      const now = this.time.now;
      const dt = now - this.lastHitAt;

      if (dt < 900) this.combo += 1;
      else this.combo = 1;

      this.lastHitAt = now;

      this.anger = clamp(this.anger + 0.055, 0, 1);

      const w = WEAPONS.find(x => x.key === R.weaponKey) || WEAPONS[0];
      const mult = 1 + clamp(Math.floor(this.combo / 10), 0, 9);
      this.score += w.score * mult;

      this.txtScore.setText(`Skor: ${this.score}`);
      this.txtCombo.setText(`Combo: ${this.combo} x${mult}`);

      this.sound.play(pick(w.sounds), { volume: 0.75 });

      this.cameras.main.shake(90, w.shake / 1000);

      this.tweens.add({
        targets: this.face,
        scale: 1.0 * w.hitScale,
        angle: Phaser.Math.Between(-6, 6),
        duration: 70,
        yoyo: true,
        ease: "Quad.out",
        onComplete: () => { this.face.scale = 1; this.face.angle = 0; }
      });

      const bodyY0 = this.body.y;
      this.tweens.add({
        targets: this.body,
        y: bodyY0 + 3,
        duration: 70,
        yoyo: true,
        ease: "Sine.inOut",
        onComplete: () => { this.body.y = bodyY0; }
      });

      this.tweens.add({
        targets: this.girl,
        angle: Phaser.Math.Between(-4, 4),
        duration: 60,
        yoyo: true,
        ease: "Sine.inOut",
        onComplete: () => { this.girl.angle = 0; }
      });

      this._refreshIdleSpeed();
    }

    _tick() {
      if (this._isPaused()) return;

      const now = this.time.now;
      const since = now - this.lastHitAt;

      const baseDecay = 0.010;
      const extra = since > 800 ? 0.020 : 0.006;
      const comboFactor = clamp(this.combo / 60, 0, 1) * 0.012;

      this.anger = clamp(this.anger - (baseDecay + extra + comboFactor), 0, 1);

      const fillH = clamp(this.angerH * this.anger, 2, this.angerH);
      this.angerFill.height = fillH;
      this.angerFill.y = this.angerY + this.angerH;

      if (this.anger <= 0.02 && this.combo > 0) {
        this.combo = Math.max(0, this.combo - 1);
        const mult = 1 + clamp(Math.floor(this.combo / 10), 0, 9);
        this.txtCombo.setText(`Combo: ${this.combo} x${mult}`);
        this._refreshIdleSpeed();
      }

      // mask follow
      this.face.setMask(circleMask(this, this.face.x, this.face.y, this.faceSize / 2));
    }

    _isPaused() { return !!this.pausedUI; }

    _openPause() {
      if (this._isPaused()) return;

      const { width, height } = this.scale;
      const font = "system-ui, -apple-system, Segoe UI, Roboto, Arial";

      const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.55).setDepth(1000);
      const panelW = Math.min(360, width * 0.84);
      const panelH = 260;

      const panel = roundedRect(this, width / 2, height / 2, panelW, panelH, 18, 0x0b0f1a, 0.92, 0xffffff, 0.10, 1001);

      const title = this.add.text(width / 2, height / 2 - 92, "Durduruldu", {
        fontFamily: font, fontSize: "22px", color: "#ffffff", fontStyle: "800"
      }).setOrigin(0.5).setDepth(1002);

      const mkBtn = (y, text, onClick) => {
        const bw = panelW * 0.78;
        const bh = 46;
        const bg = roundedRect(this, width / 2, y, bw, bh, 14, 0xffffff, 0.10, 0xffffff, 0.14, 1002);
        const hit = this.add.rectangle(width / 2, y, bw, bh, 0x000000, 0).setDepth(1003).setInteractive({ useHandCursor: true });
        const t = this.add.text(width / 2, y, text, {
          fontFamily: font, fontSize: "16px", color: "#ffffff", fontStyle: "700"
        }).setOrigin(0.5).setDepth(1004);
        hit.on("pointerdown", onClick);
        return [bg, hit, t];
      };

      const y1 = height / 2 - 20;
      const y2 = height / 2 + 38;
      const y3 = height / 2 + 96;

      const resume = mkBtn(y1, "Devam", () => this._closePause());
      const restart = mkBtn(y2, "Restart", () => { this._closePause(true); this.scene.restart(); });
      const menu = mkBtn(y3, "Ana Menü", () => { this._closePause(true); this.scene.start("Menu"); });

      this.pausedUI = [overlay, panel, title, ...resume, ...restart, ...menu];
    }

    _closePause(destroyOnly = false) {
      if (!this.pausedUI) return;
      this.pausedUI.forEach(o => o?.destroy?.());
      this.pausedUI = null;
    }
  }

  const config = {
    type: Phaser.AUTO,
    parent: "game",
    backgroundColor: "#000000",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 540,
      height: 960
    },
    scene: [BootScene, MenuScene, GameScene],
  };

  if (!document.getElementById("game")) {
    const d = document.createElement("div");
    d.id = "game";
    document.body.style.margin = "0";
    document.body.appendChild(d);
  }

  new Phaser.Game(config);
})();
