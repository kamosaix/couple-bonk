(() => {
  // =========================
  // AYARLAR
  // =========================
  const BG_PATH = "/assets/bg_intro.jpg";     // sende bg_intro.jpg var
  const MUSIC_PATH = "/assets/music_intro.mp3";

  // =========================
  // HELPERS
  // =========================
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const qs = new URLSearchParams(location.search);
  const CODE = (qs.get("code") || "DEMO").trim();

  const PACK_BASE = `/packs/${CODE}`;
  const PACK_JSON = `${PACK_BASE}.json`;
  const PACK_FACE = `${PACK_BASE}_face.jpg`;

  const DEMO_JSON = `/packs/DEMO.json`;
  const DEMO_FACE = `/packs/DEMO_face.jpg`;

  const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const WEAPONS = [
    { key: "hand",   label: "🖐️", name: "Tokat",          sounds: ["slap1","slap2","slap3"], score: 1, shake: 6,  hitScale: 1.02 },
    { key: "pillow", label: "🧸", name: "Yastık",         sounds: ["pillow1","pillow2","pillow3"], score: 2, shake: 4,  hitScale: 1.03 },
    { key: "pan",    label: "🍳", name: "Yumurta Tavası", sounds: ["pan1","pan2","pan3"], score: 3, shake: 8,  hitScale: 1.04 },
  ];

  const R = {
    pack: null,
    weaponKey: "hand",
    music: null,
    musicStarted: false,
    faceKey: "faceDemo",
  };

  function rr(scene, x, y, w, h, r, fill=0x0b0f1a, alpha=0.78, stroke=0xffffff, strokeAlpha=0.10, depth=0) {
    const g = scene.add.graphics().setDepth(depth);
    g.fillStyle(fill, alpha);
    g.fillRoundedRect(x - w/2, y - h/2, w, h, r);
    if (stroke != null) {
      g.lineStyle(2, stroke, strokeAlpha);
      g.strokeRoundedRect(x - w/2, y - h/2, w, h, r);
    }
    return g;
  }

  function circleMask(scene, x, y, radius) {
    const mg = scene.make.graphics({ x: 0, y: 0, add: false });
    mg.fillStyle(0xffffff);
    mg.fillCircle(x, y, radius);
    return mg.createGeometryMask();
  }

  function t(scene, x, y, text, size=16, color="#fff", weight="800") {
    return scene.add.text(x, y, text, {
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
      fontSize: `${size}px`,
      color,
      fontStyle: weight,
    });
  }

  function startMusic(scene) {
    if (R.musicStarted) return;
    R.musicStarted = true;
    if (!R.music) R.music = scene.sound.add("musicIntro", { loop: true, volume: 0.55 });
    if (!R.music.isPlaying) R.music.play();
  }

  // =========================
  // SCENES
  // =========================
  class BootScene extends Phaser.Scene {
    constructor() { super("Boot"); }

    preload() {
      const { width, height } = this.scale;

      // Core
      this.load.image("bg", BG_PATH);
      this.load.image("girlBase", "/assets/girl_base.png");
      this.load.image("bodyBase", "/assets/body_base.png");
      this.load.audio("musicIntro", MUSIC_PATH);

      // Sounds
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

      // Packs
      this.load.json("packDemo", DEMO_JSON);
      this.load.image("faceDemo", DEMO_FACE);

      this.load.json("packCustom", PACK_JSON);
      this.load.image("faceCustom", PACK_FACE);

      // Loading UI
      t(this, width/2, height*0.42, "Yükleniyor…", 22, "#fff", "900").setOrigin(0.5);

      const barW = Math.min(320, width*0.7);
      this.add.rectangle(width/2, height*0.50, barW, 10, 0xffffff, 0.15);
      const barFill = this.add.rectangle(width/2 - barW/2, height*0.50, 2, 10, 0xffffff, 0.9).setOrigin(0,0.5);

      this.load.on("progress", (p) => { barFill.width = clamp(barW * p, 2, barW); });
      this.load.on("loaderror", (file) => console.warn("LOAD ERROR:", file?.key, file?.src));
      this.load.on("fileerror", (file) => console.warn("FILE ERROR:", file?.key, file?.src));

      // Fail-safe
      setTimeout(() => {
        try { if (this.scene.isActive("Boot")) this.scene.start("Menu"); } catch(e) {}
      }, 7000);
    }

    create() {
      const custom = this.cache.json.get("packCustom");
      const demo = this.cache.json.get("packDemo") || {};

      const pk = custom || demo || {};
      R.pack = {
        title: pk.title || "DEMO 💘 DEMO",
        subtitle: pk.subtitle || "Basit oynanış • gösterince güldürür",
        startHint: pk.startHint || "Ekrana dokun = vur • Alttan silah seç",
        footer: pk.footer || "Kişiye özel: kafa foto + isimler + sesler",
      };

      const hasCustomFace = this.textures.exists("faceCustom");
      R.faceKey = hasCustomFace ? "faceCustom" : "faceDemo";

      this.scene.start("Menu");
    }
  }

  class MenuScene extends Phaser.Scene {
    constructor() { super("Menu"); }

    create() {
      const { width, height } = this.scale;

      // BG
      this.add.image(width/2, height/2, "bg")
        .setDisplaySize(width, height)
        .setDepth(-100);

      // Card
      const cardW = Math.min(420, width*0.88);
      const cardH = Math.min(620, height*0.78);

      // MENÜ PREVIEW: kartın ARKASINDA + küçük + altta
      // (kanka bu kısım yüzünden görüntü çorba olmuştu, şimdi kesin temiz)
      const previewY = height*0.86;
      const previewGirl = this.add.image(width/2 - 60, previewY, "girlBase")
        .setOrigin(0.5, 1)
        .setScale(Math.min(0.20, width/1200))
        .setDepth(-20)
        .setAlpha(0.92);

      const previewBody = this.add.image(width/2 + 60, previewY, "bodyBase")
        .setOrigin(0.5, 1)
        .setScale(Math.min(0.22, width/1100))
        .setDepth(-20)
        .setAlpha(0.92);

      // Kart ÖNDE
      rr(this, width/2, height/2, cardW, cardH, 18, 0x0b0f1a, 0.82, 0xffffff, 0.10, 10);

      // Title
      t(this, width/2, height*0.18, R.pack.title, 34, "#fff", "900").setOrigin(0.5).setDepth(20);
      t(this, width/2, height*0.23, R.pack.subtitle, 14, "rgba(255,255,255,0.72)", "800").setOrigin(0.5).setDepth(20);

      // Face preview
      const faceSize = Math.min(160, width*0.34);
      const faceX = width/2;
      const faceY = height*0.33;

      const face = this.add.image(faceX, faceY, R.faceKey).setDepth(20);
      face.setDisplaySize(faceSize, faceSize);
      face.setMask(circleMask(this, faceX, faceY, faceSize/2));

      const ring = this.add.graphics().setDepth(21);
      ring.lineStyle(3, 0xffffff, 0.18);
      ring.strokeCircle(faceX, faceY, faceSize/2 + 6);

      // Start button
      const btnY = height*0.50;
      const btnW = Math.min(320, width*0.70);
      const btnH = 54;

      rr(this, width/2, btnY, btnW, btnH, 14, 0xffffff, 0.12, 0xffffff, 0.18, 30);

      const btnHit = this.add.rectangle(width/2, btnY, btnW, btnH, 0x000000, 0)
        .setInteractive({ useHandCursor: true })
        .setDepth(40);

      t(this, width/2, btnY, "BAŞLA", 20, "#fff", "900").setOrigin(0.5).setDepth(41);
      t(this, width/2, btnY+34, R.pack.startHint, 12, "rgba(255,255,255,0.65)", "800").setOrigin(0.5).setDepth(41);

      t(this, width/2, height*0.78, R.pack.footer, 12, "rgba(255,255,255,0.70)", "800").setOrigin(0.5).setDepth(20);

      // music start on first gesture
      const go = () => { startMusic(this); this.scene.start("Game"); };
      btnHit.on("pointerdown", go);
      this.input.once("pointerdown", () => startMusic(this));
      this.input.keyboard?.once("keydown", () => startMusic(this));

      this.scale.on("resize", () => this.scene.restart());
    }
  }

  class GameScene extends Phaser.Scene {
    constructor() { super("Game"); }

    create() {
      const { width, height } = this.scale;

      // BG
      this.add.image(width/2, height/2, "bg").setDisplaySize(width, height).setDepth(-100);

      // State
      this.score = 0;
      this.combo = 0;
      this.lastHitAt = 0;
      this.anger = 1.0;
      this.pausedUI = null;

      // Layout anchors
      const centerX = width/2;
      const girlX = centerX - width*0.22;

      const bodyY = height*0.84;
      const faceY = height*0.38;
      const girlY = height*0.93;

      // Scales (daha stabil, telefonda devleşmez)
      const baseScale = clamp(width / 540, 0.85, 1.15);
      const bodyScale = 0.58 * baseScale;
      const girlScale = 0.68 * baseScale;

      // Body (alt sabit)
      this.body = this.add.image(centerX, bodyY, "bodyBase").setOrigin(0.5, 1);
      this.body.setScale(bodyScale);

      // Face circle
      this.faceSize = Math.min(width, height) * 0.30;
      this.face = this.add.image(centerX, faceY, R.faceKey).setOrigin(0.5,0.5);
      this.face.setDisplaySize(this.faceSize, this.faceSize);
      this.face.setMask(circleMask(this, this.face.x, this.face.y, this.faceSize/2));

      // Girl
      this.girl = this.add.image(girlX, girlY, "girlBase").setOrigin(0.5, 1);
      this.girl.setScale(girlScale);

      // Idle tweens (asla durmasın)
      this.idleGirl = this.tweens.add({ targets: this.girl, y: this.girl.y - 10, duration: 900, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      this.idleBody = this.tweens.add({ targets: this.body, y: this.body.y - 6,  duration: 900, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      this.idleFace = this.tweens.add({ targets: this.face, y: this.face.y - 7,  duration: 900, yoyo: true, repeat: -1, ease: "Sine.inOut" });

      // HUD
      this.txtScore  = t(this, 16, 14, "Skor: 0", 20, "#fff", "900").setDepth(80);
      this.txtCombo  = t(this, 16, 40, "Combo: 0 x1", 14, "rgba(255,215,0,0.95)", "900").setDepth(80);
      this.txtWeapon = t(this, width-16, 40, `Silah: ${this._weaponLabel()}`, 14, "rgba(255,255,255,0.85)", "900")
        .setOrigin(1,0).setDepth(80);

      // Pause (biraz aşağı)
      this.btnPause = t(this, width-16, 72, "⏸", 22, "rgba(255,255,255,0.9)", "900")
        .setOrigin(1,0).setDepth(90).setInteractive({ useHandCursor:true });
      this.btnPause.on("pointerdown", () => this._openPause());

      // Anger bar (fills UP)
      this.angerX = width - 24;
      this.angerY = height*0.22;
      this.angerH = height*0.60;
      this.angerW = 10;

      this.angerBg = this.add.rectangle(this.angerX, this.angerY + this.angerH/2, this.angerW, this.angerH, 0xffffff, 0.10).setDepth(60);
      this.angerFill = this.add.rectangle(this.angerX, this.angerY + this.angerH, this.angerW, 2, 0xff4d4d, 0.95).setOrigin(0.5,1).setDepth(61);

      // Weapon bar
      this._buildWeaponBar();

      // Hit zone
      this.hitZone = this.add.zone(0,0,width,height).setOrigin(0,0).setDepth(1).setInteractive();
      this.hitZone.on("pointerdown", (p) => {
        if (this._isPaused()) return;
        if (p.y > height - 120) return; // weapon bar
        this._hit();
      });

      // Ensure music continues
      this.input.once("pointerdown", () => startMusic(this));

      // Tick
      this.time.addEvent({ delay: 50, loop: true, callback: () => this._tick() });

      this.scale.on("resize", () => this.scene.restart());
    }

    _weaponLabel() {
      const w = WEAPONS.find(x => x.key === R.weaponKey) || WEAPONS[0];
      return `${w.label} ${w.name}`;
    }

    _setIdleSpeed() {
      const speed = clamp(1 + this.combo / 25, 1, 3.2);
      this.idleGirl.timeScale = speed;
      this.idleBody.timeScale = speed;
      this.idleFace.timeScale = speed;
    }

    _buildWeaponBar() {
      const { width, height } = this.scale;

      const barH = 98;
      this.add.rectangle(width/2, height - barH/2, width, barH, 0x000000, 0.35).setDepth(200);

      const gap = 10;
      const btnSize = 72;
      const totalW = WEAPONS.length * btnSize + (WEAPONS.length - 1) * gap;
      let startX = width/2 - totalW/2 + btnSize/2;
      const y = height - barH/2;

      this.weaponBtns = [];

      WEAPONS.forEach((w, i) => {
        const x = startX + i*(btnSize+gap);

        rr(this, x, y, btnSize, btnSize, 14, 0xffffff, 0.08, 0xffffff, 0.10, 210);
        const hit = this.add.rectangle(x, y, btnSize, btnSize, 0x000000, 0)
          .setDepth(211).setInteractive({ useHandCursor:true });

        this.add.text(x, y-2, w.label, { fontFamily:"system-ui,-apple-system,Segoe UI,Roboto,Arial", fontSize:"30px", color:"#fff" })
          .setOrigin(0.5).setDepth(212);

        const sel = this.add.graphics().setDepth(213);
        sel.lineStyle(2, 0xffffff, 0.35);
        sel.strokeRoundedRect(x - btnSize/2, y - btnSize/2, btnSize, btnSize, 14);
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
        t(this, 16, height - 118, "Alttan silah seç", 12, "rgba(255,255,255,0.55)", "800").setDepth(240);
      }
    }

    _hit() {
      const now = this.time.now;
      const dt = now - this.lastHitAt;

      // Combo
      if (dt < 900) this.combo += 1;
      else this.combo = 1;
      this.lastHitAt = now;

      // Anger up
      this.anger = clamp(this.anger + 0.055, 0, 1);

      const w = WEAPONS.find(x => x.key === R.weaponKey) || WEAPONS[0];
      const mult = 1 + clamp(Math.floor(this.combo/10), 0, 9);

      this.score += w.score * mult;

      this.txtScore.setText(`Skor: ${this.score}`);
      this.txtCombo.setText(`Combo: ${this.combo} x${mult}`);

      // Sound
      this.sound.play(pick(w.sounds), { volume: 0.75 });

      // Shake
      this.cameras.main.shake(90, w.shake/1000);

      // Face pop (no growth bug)
      this.tweens.add({
        targets: this.face,
        scale: w.hitScale,
        angle: Phaser.Math.Between(-6, 6),
        duration: 70,
        yoyo: true,
        ease: "Quad.out",
        onComplete: () => { this.face.scale = 1; this.face.angle = 0; }
      });

      // Body nudge (restore)
      const by = this.body.y;
      this.tweens.add({
        targets: this.body,
        y: by + 3,
        duration: 70,
        yoyo: true,
        ease: "Sine.inOut",
        onComplete: () => { this.body.y = by; }
      });

      // Girl rotate only (no sideways drift)
      this.tweens.add({
        targets: this.girl,
        angle: Phaser.Math.Between(-4, 4),
        duration: 60,
        yoyo: true,
        ease: "Sine.inOut",
        onComplete: () => { this.girl.angle = 0; }
      });

      // Idle speed up
      this._setIdleSpeed();

      // Mask follow
      this.face.setMask(circleMask(this, this.face.x, this.face.y, this.faceSize/2));
    }

    _tick() {
      if (this._isPaused()) return;

      const now = this.time.now;
      const since = now - this.lastHitAt;

      // Faster decay
      const baseDecay = 0.010;
      const extra = since > 800 ? 0.020 : 0.006;
      const comboFactor = clamp(this.combo/60, 0, 1) * 0.012;

      this.anger = clamp(this.anger - (baseDecay + extra + comboFactor), 0, 1);

      const fillH = clamp(this.angerH * this.anger, 2, this.angerH);
      this.angerFill.height = fillH;
      this.angerFill.y = this.angerY + this.angerH;

      if (this.anger <= 0.02 && this.combo > 0) {
        this.combo = Math.max(0, this.combo - 1);
        const mult = 1 + clamp(Math.floor(this.combo/10), 0, 9);
        this.txtCombo.setText(`Combo: ${this.combo} x${mult}`);
        this._setIdleSpeed();
      }

      this.face.setMask(circleMask(this, this.face.x, this.face.y, this.faceSize/2));
    }

    _isPaused() { return !!this.pausedUI; }

    _openPause() {
      if (this._isPaused()) return;

      const { width, height } = this.scale;

      const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.55).setDepth(1000);
      rr(this, width/2, height/2, Math.min(360, width*0.84), 260, 18, 0x0b0f1a, 0.92, 0xffffff, 0.10, 1001);

      const title = t(this, width/2, height/2 - 92, "Durduruldu", 22, "#fff", "900")
        .setOrigin(0.5).setDepth(1002);

      const mkBtn = (y, text, onClick) => {
        const bw = Math.min(360, width*0.84) * 0.78;
        const bh = 46;
        rr(this, width/2, y, bw, bh, 14, 0xffffff, 0.10, 0xffffff, 0.14, 1002);
        const hit = this.add.rectangle(width/2, y, bw, bh, 0x000000, 0).setDepth(1003).setInteractive({ useHandCursor:true });
        const txt = t(this, width/2, y, text, 16, "#fff", "900").setOrigin(0.5).setDepth(1004);
        hit.on("pointerdown", onClick);
        return [hit, txt];
      };

      const y1 = height/2 - 20, y2 = height/2 + 38, y3 = height/2 + 96;
      const a = mkBtn(y1, "Devam", () => this._closePause());
      const b = mkBtn(y2, "Restart", () => { this._closePause(); this.scene.restart(); });
      const c = mkBtn(y3, "Ana Menü", () => { this._closePause(); this.scene.start("Menu"); });

      this.pausedUI = [overlay, title, ...a, ...b, ...c];
    }

    _closePause() {
      if (!this.pausedUI) return;
      this.pausedUI.forEach(o => o?.destroy?.());
      this.pausedUI = null;
    }
  }

  // =========================
  // PHASER CONFIG
  // =========================
  const config = {
    type: Phaser.AUTO,
    parent: "game",
    backgroundColor: "#000000",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 540,
      height: 960,
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
