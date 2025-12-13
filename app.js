/* couple-bonk app.js
   - Phaser 3 tek dosya
   - Arka plan hem menüde hem oyunda
   - Pack sistemi: ?code=AYSEMEHMET => packs/AYSEMEHMET.json + packs/AYSEMEHMET_face.jpg
   - Silah butonları altta
   - Sinir barı vurmayınca hızlı düşer
   - Pause menüsü: Resume / Restart / Main Menu
   - Yumruk emojisi kaldırıldı
   - Tava = 🍳, Yastık = 🛏️ (yatak değil diye istemiştin ama emoji seti sınırlı; istersen 🧸/☁️ da yaparız)
*/

(() => {
  // -----------------------------
  // Helpers
  // -----------------------------
  const qs = new URLSearchParams(location.search);
  const CODE = (qs.get("code") || "DEMO").trim();
  const PACK_BASE = `/packs/${CODE}`;
  const PACK_JSON = `${PACK_BASE}.json`;
  // yüz dosyan sende jpg olmuştu
  const PACK_FACE = `${PACK_BASE}_face.jpg`;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const WEAPONS = [
    { key: "hand",  label: "🖐️", name: "Tokat",  sounds: ["slap1", "slap2", "slap3"],  score: 1,  shake: 6,  hitScale: 1.00 },
    { key: "pillow",label: "🧸", name: "Yastık", sounds: ["pillow1","pillow2","pillow3"], score: 2, shake: 4,  hitScale: 1.02 },
    { key: "pan",   label: "🍳", name: "Yumurta Tavası", sounds: ["pan1","pan2","pan3"], score: 3, shake: 8,  hitScale: 1.03 },
  ];

  // -----------------------------
  // Global runtime state
  // -----------------------------
  const R = {
    pack: null,
    weaponKey: "hand",
    music: null,
    musicStarted: false,
  };

  // -----------------------------
  // Scenes
  // -----------------------------
  class BootScene extends Phaser.Scene {
    constructor() { super("Boot"); }
    preload() {
      // Minimal UI font vibe
      this.load.image("bg", "/assets/bg.jpg");
      this.load.image("girlBase", "/assets/girl_base.png");
      this.load.image("bodyBase", "/assets/body_base.png");
      this.load.audio("musicIntro", "/assets/music_intro.mp3");

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

      // Pack JSON + face
      this.load.json("pack", PACK_JSON);
      this.load.image("face", PACK_FACE);

      // Simple loading overlay
      const { width, height } = this.scale;
      const g = this.add.graphics();
      const title = this.add.text(width/2, height*0.42, "Yükleniyor…", {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "22px",
        color: "#ffffff"
      }).setOrigin(0.5);

      const barBg = this.add.rectangle(width/2, height*0.5, Math.min(320, width*0.7), 10, 0xffffff, 0.15);
      const barFill = this.add.rectangle(barBg.x - barBg.width/2, barBg.y, 2, 10, 0xffffff, 0.9).setOrigin(0,0.5);

      this.load.on("progress", (p) => {
        barFill.width = clamp(barBg.width * p, 2, barBg.width);
      });

      this.load.on("complete", () => {
        title.destroy();
        barBg.destroy();
        barFill.destroy();
        g.destroy();
      });
    }

    create() {
      // Pack fallback
      const pk = this.cache.json.get("pack") || {};
      R.pack = {
        title: pk.title || "DEMO 💘 DEMO",
        subtitle: pk.subtitle || "Basit oynanış • aşırı iyi his • gösterince güldürür",
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

      // Background
      this.bg = this.add.image(width/2, height/2, "bg").setDisplaySize(width, height).setDepth(-50);

      // Dark overlay card
      const cardW = Math.min(420, width*0.88);
      const cardH = Math.min(620, height*0.78);
      const card = this.add.rectangle(width/2, height/2, cardW, cardH, 0x0b0f1a, 0.78);
      card.setStrokeStyle(2, 0xffffff, 0.08);
      card.setRadius(18);

      // Title
      this.add.text(width/2, height*0.18, R.pack.title, {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "34px",
        fontStyle: "800",
        color: "#ffffff"
      }).setOrigin(0.5);

      this.add.text(width/2, height*0.23, R.pack.subtitle, {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "14px",
        color: "rgba(255,255,255,0.72)"
      }).setOrigin(0.5);

      // Face preview (circle)
      const faceSize = Math.min(160, width*0.34);
      const faceX = width/2;
      const faceY = height*0.33;

      const face = this.add.image(faceX, faceY, "face");
      const maskG = this.make.graphics({ x: 0, y: 0, add: false });
      maskG.fillStyle(0xffffff);
      maskG.fillCircle(faceX, faceY, faceSize/2);
      face.setMask(maskG.createGeometryMask());
      face.setDisplaySize(faceSize, faceSize);

      // subtle glow ring
      const ring = this.add.graphics();
      ring.lineStyle(3, 0xffffff, 0.18);
      ring.strokeCircle(faceX, faceY, faceSize/2 + 6);

      // Start button
      const btnY = height*0.50;
      const btnW = Math.min(320, width*0.70);
      const btnH = 54;

      const btn = this.add.rectangle(width/2, btnY, btnW, btnH, 0xffffff, 0.12);
      btn.setStrokeStyle(2, 0xffffff, 0.16);
      btn.setRadius(14);
      btn.setInteractive({ useHandCursor: true });

      const btnText = this.add.text(width/2, btnY, "BAŞLA", {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "20px",
        fontStyle: "800",
        color: "#ffffff"
      }).setOrigin(0.5);

      this.add.text(width/2, btnY + 34, R.pack.startHint, {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "12px",
        color: "rgba(255,255,255,0.65)"
      }).setOrigin(0.5);

      this.add.text(width/2, height*0.78, R.pack.footer, {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "12px",
        color: "rgba(255,255,255,0.70)"
      }).setOrigin(0.5);

      // Couple preview (girl + body, small, side-by-side)
      // Kız boyutu “taşıyor” demiştin → burada biraz küçülttüm.
      const previewY = height*0.63;
      const girl = this.add.image(width/2 - 70, previewY, "girlBase").setOrigin(0.5, 1);
      girl.setScale(Math.min(0.30, width/900));

      const body = this.add.image(width/2 + 70, previewY, "bodyBase").setOrigin(0.5, 1);
      body.setScale(Math.min(0.34, width/900));

      // music: start on first user gesture
      const startMusic = () => {
        if (R.musicStarted) return;
        R.musicStarted = true;
        if (!R.music) {
          R.music = this.sound.add("musicIntro", { loop: true, volume: 0.55 });
        }
        if (!R.music.isPlaying) R.music.play();
      };

      const goGame = () => {
        startMusic();
        this.scene.start("Game");
      };

      btn.on("pointerdown", goGame);
      this.input.once("pointerdown", startMusic);
      this.input.keyboard?.once("keydown", startMusic);

      // responsive
      this.scale.on("resize", (s) => {
        this.scene.restart();
      });
    }
  }

  class GameScene extends Phaser.Scene {
    constructor() { super("Game"); }

    create() {
      const { width, height } = this.scale;

      // Background
      this.bg = this.add.image(width/2, height/2, "bg").setDisplaySize(width, height).setDepth(-50);

      // state
      this.score = 0;
      this.combo = 0;
      this.lastHitAt = 0;
      this.anger = 1.0; // 0..1
      this.pausedUI = null;

      // Layout anchors
      this.centerX = width/2;
      this.centerY = height/2;

      // Characters
      // Body behind
      this.body = this.add.image(this.centerX, height*0.80, "bodyBase").setOrigin(0.5, 1);
      this.body.setScale(Math.min(0.60, width/520));

      // Face (circle) above body neck
      this.faceSize = Math.min(width, height) * 0.32; // sabit tutacağız, büyüme hatasını engeller
      this.face = this.add.image(this.centerX, height*0.38, "face").setOrigin(0.5, 0.5);

      this.faceMaskG = this.make.graphics({ x: 0, y: 0, add: false });
      this.face.setMask(this._makeFaceMask());

      this._fitFace();

      // Girl in front
      this.girl = this.add.image(this.centerX - width*0.20, height*0.92, "girlBase").setOrigin(0.5, 1);
      this.girl.setScale(Math.min(0.72, width/520)); // oyun içi daha büyük kalsın

      // Idle bobbing (combo hızlandırır)
      this._startIdleTweens();

      // HUD (premium-ish)
      const font = "system-ui, -apple-system, Segoe UI, Roboto, Arial";
      this.txtScore = this.add.text(16, 14, `Skor: 0`, { fontFamily: font, fontSize: "20px", color: "#ffffff", fontStyle: "800" }).setDepth(50);
      this.txtCombo = this.add.text(16, 40, `Combo: 0 x1`, { fontFamily: font, fontSize: "14px", color: "rgba(255,215,0,0.95)", fontStyle: "700" }).setDepth(50);
      this.txtWeapon = this.add.text(width - 16, 40, `Silah: ${this._weaponLabel()}`, { fontFamily: font, fontSize: "14px", color: "rgba(255,255,255,0.85)", fontStyle: "700" }).setOrigin(1,0).setDepth(50);

      // Pause button (biraz aşağı indirdim, yazıyla çakışmasın)
      this.btnPause = this.add.text(width - 16, 72, "⏸", {
        fontFamily: font, fontSize: "22px", color: "rgba(255,255,255,0.9)"
      }).setOrigin(1,0).setDepth(60).setInteractive({ useHandCursor: true });

      this.btnPause.on("pointerdown", () => this._openPause());

      // Anger bar (right) - fill UP, decay fast when not hitting
      this.angerX = width - 24;
      this.angerY = height*0.22;
      this.angerH = height*0.60;
      this.angerW = 10;

      this.angerBg = this.add.rectangle(this.angerX, this.angerY + this.angerH/2, this.angerW, this.angerH, 0xffffff, 0.10).setOrigin(0.5,0.5).setDepth(40);
      this.angerFill = this.add.rectangle(this.angerX, this.angerY + this.angerH, this.angerW, 2, 0xff4d4d, 0.95).setOrigin(0.5,1).setDepth(41);

      // Weapon buttons bottom
      this._buildWeaponBar();

      // Input: hit anywhere except UI
      this.hitZone = this.add.zone(0, 0, width, height).setOrigin(0,0).setDepth(1);
      this.hitZone.setInteractive();

      this.hitZone.on("pointerdown", (p) => {
        if (this._isPaused()) return;
        // ignore if clicking on weapon buttons area
        if (p.y > height - 120) return;
        this._hit();
      });

      // start music on first interaction if not already
      this.input.once("pointerdown", () => {
        if (R.music && !R.music.isPlaying) R.music.play();
      });

      // update loop timer
      this.time.addEvent({
        delay: 50,
        loop: true,
        callback: () => this._tick(),
      });

      // Responsive resize
      this.scale.on("resize", () => {
        this.scene.restart();
      });
    }

    // -----------------------------
    // Face mask & sizing
    // -----------------------------
    _makeFaceMask() {
      const { width, height } = this.scale;
      this.faceMaskG.clear();
      this.faceMaskG.fillStyle(0xffffff);
      this.faceMaskG.fillCircle(this.face.x, this.face.y, this.faceSize/2);
      return this.faceMaskG.createGeometryMask();
    }

    _fitFace() {
      // Face size fixed to avoid “büyüyor” bug
      this.face.setDisplaySize(this.faceSize, this.faceSize);
    }

    // -----------------------------
    // Idle tweens
    // -----------------------------
    _startIdleTweens() {
      const baseDur = 900;
      const calcDur = () => clamp(baseDur - this.combo*18, 260, 900);

      // clear old
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

    _refreshIdleSpeed() {
      // restart tweens with new speed based on combo
      this._startIdleTweens();
    }

    // -----------------------------
    // Weapons UI
    // -----------------------------
    _weaponLabel() {
      const w = WEAPONS.find(x => x.key === R.weaponKey) || WEAPONS[0];
      return `${w.label} ${w.name}`;
    }

    _buildWeaponBar() {
      const { width, height } = this.scale;
      const barH = 98;
      const pad = 14;
      const gap = 10;
      const btnSize = 72;

      this.weaponBarBg = this.add.rectangle(width/2, height - barH/2, width, barH, 0x000000, 0.35).setDepth(100);
      this.weaponBtns = [];

      const totalW = WEAPONS.length * btnSize + (WEAPONS.length - 1) * gap;
      let startX = width/2 - totalW/2 + btnSize/2;
      const y = height - barH/2;

      WEAPONS.forEach((w, i) => {
        const x = startX + i * (btnSize + gap);

        const box = this.add.rectangle(x, y, btnSize, btnSize, 0xffffff, 0.08).setDepth(110);
        box.setStrokeStyle(2, 0xffffff, 0.10);
        box.setRadius(14);
        box.setInteractive({ useHandCursor: true });

        const txt = this.add.text(x, y - 2, w.label, {
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
          fontSize: "30px",
          color: "#ffffff"
        }).setOrigin(0.5).setDepth(111);

        const sel = this.add.rectangle(x, y, btnSize, btnSize, 0xffffff, 0).setDepth(112);
        sel.setStrokeStyle(2, 0xffffff, 0.35);
        sel.setRadius(14);
        sel.setVisible(w.key === R.weaponKey);

        box.on("pointerdown", () => {
          if (this._isPaused()) return;
          R.weaponKey = w.key;
          this.sound.play("switchSfx", { volume: 0.35 });
          this.txtWeapon.setText(`Silah: ${this._weaponLabel()}`);
          this.weaponBtns.forEach(b => b.sel.setVisible(b.key === R.weaponKey));
        });

        this.weaponBtns.push({ key: w.key, box, txt, sel });
      });

      // little hint for mobile
      if (isMobile()) {
        this.add.text(16, this.scale.height - 118, "Alttan silah seç", {
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
          fontSize: "12px",
          color: "rgba(255,255,255,0.55)"
        }).setDepth(120);
      }
    }

    // -----------------------------
    // Game logic
    // -----------------------------
    _hit() {
      const now = this.time.now;
      const dt = now - this.lastHitAt;

      // combo logic
      if (dt < 900) this.combo += 1;
      else this.combo = 1;

      this.lastHitAt = now;

      // anger fill
      this.anger = clamp(this.anger + 0.055, 0, 1);

      // scoring + weapon
      const w = WEAPONS.find(x => x.key === R.weaponKey) || WEAPONS[0];
      const mult = 1 + clamp(Math.floor(this.combo / 10), 0, 9); // x1..x10
      this.score += w.score * mult;

      // update hud
      this.txtScore.setText(`Skor: ${this.score}`);
      this.txtCombo.setText(`Combo: ${this.combo} x${mult}`);

      // sounds (random)
      const s = pick(w.sounds);
      this.sound.play(s, { volume: 0.75 });

      // camera shake
      this.cameras.main.shake(90, w.shake / 1000);

      // face reaction: quick scale + tiny rotation (then reset)
      this.tweens.add({
        targets: this.face,
        scale: 1.0 * w.hitScale,
        angle: Phaser.Math.Between(-6, 6),
        duration: 70,
        yoyo: true,
        ease: "Quad.out",
        onComplete: () => {
          this.face.scale = 1;
          this.face.angle = 0;
        }
      });

      // body nudge (prevent “aşağı düşme” by always restoring)
      const bodyY0 = this.body.y;
      this.tweens.add({
        targets: this.body,
        y: bodyY0 + 3,
        duration: 70,
        yoyo: true,
        ease: "Sine.inOut",
        onComplete: () => { this.body.y = bodyY0; }
      });

      // girl “kayma” yok: sadece mini rotate
      this.tweens.add({
        targets: this.girl,
        angle: Phaser.Math.Between(-4, 4),
        duration: 60,
        yoyo: true,
        ease: "Sine.inOut",
        onComplete: () => { this.girl.angle = 0; }
      });

      // idle speed increases with combo
      this._refreshIdleSpeed();
    }

    _tick() {
      if (this._isPaused()) return;

      // anger decay: hızlı düşsün istemiştin
      const now = this.time.now;
      const since = now - this.lastHitAt;

      // vurmayınca daha hızlı düşer; combo varsa daha da hızlı düşsün ki bastırsın
      const baseDecay = 0.010; // per tick (~20 ticks/s => 0.2/s)
      const extra = since > 800 ? 0.020 : 0.006;
      const comboFactor = clamp(this.combo / 60, 0, 1) * 0.012;

      this.anger = clamp(this.anger - (baseDecay + extra + comboFactor), 0, 1);

      // update anger bar (fills UP)
      const fillH = clamp(this.angerH * this.anger, 2, this.angerH);
      this.angerFill.height = fillH;
      this.angerFill.y = this.angerY + this.angerH;

      // if anger empties, drop combo faster
      if (this.anger <= 0.02 && this.combo > 0) {
        this.combo = Math.max(0, this.combo - 1);
        const mult = 1 + clamp(Math.floor(this.combo / 10), 0, 9);
        this.txtCombo.setText(`Combo: ${this.combo} x${mult}`);
        this._refreshIdleSpeed();
      }

      // keep face mask synced (because tweens move y)
      this.face.setMask(this._makeFaceMask());
    }

    // -----------------------------
    // Pause UI
    // -----------------------------
    _isPaused() {
      return !!this.pausedUI;
    }

    _openPause() {
      if (this._isPaused()) return;

      const { width, height } = this.scale;
      const font = "system-ui, -apple-system, Segoe UI, Roboto, Arial";

      const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.55).setDepth(1000);
      const panelW = Math.min(360, width*0.84);
      const panelH = 260;

      const panel = this.add.rectangle(width/2, height/2, panelW, panelH, 0x0b0f1a, 0.92).setDepth(1001);
      panel.setStrokeStyle(2, 0xffffff, 0.10);
      panel.setRadius(18);

      const title = this.add.text(width/2, height/2 - 92, "Durduruldu", {
        fontFamily: font, fontSize: "22px", color: "#ffffff", fontStyle: "800"
      }).setOrigin(0.5).setDepth(1002);

      const mkBtn = (y, text, onClick) => {
        const w = panelW * 0.78;
        const h = 46;
        const r = this.add.rectangle(width/2, y, w, h, 0xffffff, 0.10).setDepth(1002);
        r.setStrokeStyle(2, 0xffffff, 0.14);
        r.setRadius(14);
        r.setInteractive({ useHandCursor: true });
        const t = this.add.text(width/2, y, text, {
          fontFamily: font, fontSize: "16px", color: "#ffffff", fontStyle: "700"
        }).setOrigin(0.5).setDepth(1003);

        r.on("pointerdown", onClick);
        return [r, t];
      };

      const y1 = height/2 - 20;
      const y2 = height/2 + 38;
      const y3 = height/2 + 96;

      const resume = mkBtn(y1, "Devam", () => this._closePause());
      const restart = mkBtn(y2, "Restart", () => { this._closePause(true); this.scene.restart(); });
      const menu = mkBtn(y3, "Ana Menü", () => { this._closePause(true); this.scene.start("Menu"); });

      this.pausedUI = [overlay, panel, title, ...resume, ...restart, ...menu];
    }

    _closePause(destroyOnly = false) {
      if (!this.pausedUI) return;
      this.pausedUI.forEach(o => o?.destroy());
      this.pausedUI = null;
      if (!destroyOnly) {
        // noop
      }
    }
  }

  // -----------------------------
  // Phaser config
  // -----------------------------
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
    audio: {
      disableWebAudio: false
    },
    scene: [BootScene, MenuScene, GameScene],
  };

  // Ensure #game exists
  if (!document.getElementById("game")) {
    const d = document.createElement("div");
    d.id = "game";
    document.body.style.margin = "0";
    document.body.appendChild(d);
  }

  new Phaser.Game(config);
})();
