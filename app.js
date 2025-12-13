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
    { key: "hand",   label: "🖐️", name: "Tokat",         sounds: ["slap1","slap2","slap3"],      score: 1, shake: 6, hitScale: 1.00 },
    { key: "pillow", label: "🧸", name: "Yastık",        sounds: ["pillow1","pillow2","pillow3"], score: 2, shake: 4, hitScale: 1.02 },
    { key: "pan",    label: "🍳", name: "Yumurta Tavası",sounds: ["pan1","pan2","pan3"],         score: 3, shake: 8, hitScale: 1.03 },
  ];

  const R = { pack: null, weaponKey: "hand", music: null, musicStarted: false };

  // Rounded rect helper (Graphics)
  function drawRoundedRect(g, x, y, w, h, r, fillColor, fillAlpha, strokeColor, strokeAlpha, strokeW = 2) {
    g.clear();
    if (fillColor !== null) g.fillStyle(fillColor, fillAlpha);
    if (strokeColor !== null) g.lineStyle(strokeW, strokeColor, strokeAlpha);

    const rr = Math.min(r, w / 2, h / 2);
    g.beginPath();
    g.moveTo(x + rr, y);
    g.lineTo(x + w - rr, y);
    g.arc(x + w - rr, y + rr, rr, Phaser.Math.DegToRad(270), Phaser.Math.DegToRad(360), false);
    g.lineTo(x + w, y + h - rr);
    g.arc(x + w - rr, y + h - rr, rr, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(90), false);
    g.lineTo(x + rr, y + h);
    g.arc(x + rr, y + h - rr, rr, Phaser.Math.DegToRad(90), Phaser.Math.DegToRad(180), false);
    g.lineTo(x, y + rr);
    g.arc(x + rr, y + rr, rr, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(270), false);
    g.closePath();

    if (fillColor !== null) g.fillPath();
    if (strokeColor !== null) g.strokePath();
  }

  class BootScene extends Phaser.Scene {
    constructor() { super("Boot"); }
    preload() {
      // Assets
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

      // Pack
      this.load.json("pack", PACK_JSON);
      this.load.image("face", PACK_FACE);

      // Loading UI
      const { width, height } = this.scale;
      const bg = this.add.rectangle(width/2, height/2, width, height, 0x000000, 1);

      const title = this.add.text(width/2, height*0.42, "Yükleniyor…", {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "22px",
        color: "#ffffff"
      }).setOrigin(0.5);

      const barW = Math.min(320, width*0.7);
      const barBg = this.add.rectangle(width/2, height*0.5, barW, 10, 0xffffff, 0.15);
      const barFill = this.add.rectangle(barBg.x - barW/2, barBg.y, 2, 10, 0xffffff, 0.9).setOrigin(0,0.5);

      this.load.on("progress", (p) => { barFill.width = clamp(barW * p, 2, barW); });

      // Hata yakala
      this.load.on("loaderror", (file) => console.warn("LOAD ERROR:", file?.key, file?.src));

      this.load.on("complete", () => {
        bg.destroy(); title.destroy(); barBg.destroy(); barFill.destroy();
      });

      // Güvenlik: loader takılırsa geç
      setTimeout(() => {
        try {
          if (this.scene.isActive("Boot")) this.scene.start("Menu");
        } catch {}
      }, 6000);
    }

    create() {
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

      // BG
      this.add.image(width/2, height/2, "bg").setDisplaySize(width, height).setDepth(-50);

      // Card (rounded via Graphics)
      const cardW = Math.min(420, width*0.88);
      const cardH = Math.min(620, height*0.78);
      const cardX = width/2 - cardW/2;
      const cardY = height/2 - cardH/2;

      const cardG = this.add.graphics().setDepth(5);
      drawRoundedRect(cardG, cardX, cardY, cardW, cardH, 18, 0x0b0f1a, 0.78, 0xffffff, 0.08, 2);

      // Title + subtitle
      this.add.text(width/2, height*0.18, R.pack.title, {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "34px",
        fontStyle: "800",
        color: "#ffffff"
      }).setOrigin(0.5).setDepth(10);

      this.add.text(width/2, height*0.23, R.pack.subtitle, {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "14px",
        color: "rgba(255,255,255,0.72)"
      }).setOrigin(0.5).setDepth(10);

      // Face circle preview
      const faceSize = Math.min(160, width*0.34);
      const faceX = width/2;
      const faceY = height*0.33;

      const face = this.add.image(faceX, faceY, "face").setDepth(10);
      const maskG = this.make.graphics({ x: 0, y: 0, add: false });
      maskG.fillStyle(0xffffff);
      maskG.fillCircle(faceX, faceY, faceSize/2);
      face.setMask(maskG.createGeometryMask());
      face.setDisplaySize(faceSize, faceSize);

      const ring = this.add.graphics().setDepth(10);
      ring.lineStyle(3, 0xffffff, 0.18);
      ring.strokeCircle(faceX, faceY, faceSize/2 + 6);

      // Start button (rounded via Graphics + invisible hit rect)
      const btnY = height*0.50;
      const btnW = Math.min(320, width*0.70);
      const btnH = 54;

      const btnG = this.add.graphics().setDepth(10);
      drawRoundedRect(btnG, width/2 - btnW/2, btnY - btnH/2, btnW, btnH, 14, 0xffffff, 0.12, 0xffffff, 0.16, 2);

      const btnHit = this.add.rectangle(width/2, btnY, btnW, btnH, 0x000000, 0)
        .setDepth(11)
        .setInteractive({ useHandCursor: true });

      this.add.text(width/2, btnY, "BAŞLA", {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "20px",
        fontStyle: "800",
        color: "#ffffff"
      }).setOrigin(0.5).setDepth(12);

      this.add.text(width/2, btnY + 34, R.pack.startHint, {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "12px",
        color: "rgba(255,255,255,0.65)"
      }).setOrigin(0.5).setDepth(12);

      this.add.text(width/2, height*0.78, R.pack.footer, {
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        fontSize: "12px",
        color: "rgba(255,255,255,0.70)"
      }).setOrigin(0.5).setDepth(12);

      // Couple preview: girl smaller (taşma fix)
      const previewY = height*0.66;
      const girl = this.add.image(width/2 - 70, previewY, "girlBase").setOrigin(0.5, 1).setDepth(10);
      girl.setScale(Math.min(0.28, width/950));

      const body = this.add.image(width/2 + 70, previewY, "bodyBase").setOrigin(0.5, 1).setDepth(10);
      body.setScale(Math.min(0.32, width/950));

      const startMusic = () => {
        if (R.musicStarted) return;
        R.musicStarted = true;
        if (!R.music) R.music = this.sound.add("musicIntro", { loop: true, volume: 0.55 });
        if (!R.music.isPlaying) R.music.play();
      };

      btnHit.on("pointerdown", () => { startMusic(); this.scene.start("Game"); });
      this.input.once("pointerdown", startMusic);
      this.input.keyboard?.once("keydown", startMusic);

      this.scale.on("resize", () => this.scene.restart());
    }
  }

  class GameScene extends Phaser.Scene {
    constructor() { super("Game"); }

    create() {
      const { width, height } = this.scale;

      this.add.image(width/2, height/2, "bg").setDisplaySize(width, height).setDepth(-50);

      this.score = 0;
      this.combo = 0;
      this.lastHitAt = 0;
      this.anger = 1.0;
      this.pausedUI = null;

      this.body = this.add.image(width/2, height*0.80, "bodyBase").setOrigin(0.5, 1);
      this.body.setScale(Math.min(0.60, width/520));

      this.faceSize = Math.min(width, height) * 0.32;
      this.face = this.add.image(width/2, height*0.38, "face").setOrigin(0.5, 0.5);
      this.face.setDisplaySize(this.faceSize, this.faceSize);

      this.faceMaskG = this.make.graphics({ x: 0, y: 0, add: false });
      this._syncFaceMask();

      this.girl = this.add.image(width/2 - width*0.20, height*0.92, "girlBase").setOrigin(0.5, 1);
      this.girl.setScale(Math.min(0.72, width/520));

      const font = "system-ui, -apple-system, Segoe UI, Roboto, Arial";
      this.txtScore  = this.add.text(16, 14, `Skor: 0`, { fontFamily: font, fontSize: "20px", color: "#fff", fontStyle: "800" }).setDepth(50);
      this.txtCombo  = this.add.text(16, 40, `Combo: 0 x1`, { fontFamily: font, fontSize: "14px", color: "rgba(255,215,0,0.95)", fontStyle: "700" }).setDepth(50);
      this.txtWeapon = this.add.text(width - 16, 40, `Silah: ${this._weaponLabel()}`, { fontFamily: font, fontSize: "14px", color: "rgba(255,255,255,0.85)", fontStyle: "700" }).setOrigin(1,0).setDepth(50);

      // Pause button lower (çakışmasın)
      this.btnPause = this.add.text(width - 16, 72, "⏸", { fontFamily: font, fontSize: "22px", color: "rgba(255,255,255,0.9)" })
        .setOrigin(1,0).setDepth(60).setInteractive({ useHandCursor: true });
      this.btnPause.on("pointerdown", () => this._openPause());

      // Anger bar
      this.angerX = width - 24;
      this.angerY = height*0.22;
      this.angerH = height*0.60;
      this.angerW = 10;

      this.angerBg = this.add.rectangle(this.angerX, this.angerY + this.angerH/2, this.angerW, this.angerH, 0xffffff, 0.10).setDepth(40);
      this.angerFill = this.add.rectangle(this.angerX, this.angerY + this.angerH, this.angerW, 2, 0xff4d4d, 0.95).setOrigin(0.5,1).setDepth(41);

      this._buildWeaponBar();

      // idle tweens
      this._startIdleTweens();

      // Hit zone
      this.hitZone = this.add.zone(0, 0, width, height).setOrigin(0,0).setDepth(1).setInteractive();
      this.hitZone.on("pointerdown", (p) => {
        if (this._isPaused()) return;
        if (p.y > height - 120) return;
        this._hit();
      });

      this.time.addEvent({ delay: 50, loop: true, callback: () => this._tick() });

      this.scale.on("resize", () => this.scene.restart());
    }

    _syncFaceMask() {
      this.faceMaskG.clear();
      this.faceMaskG.fillStyle(0xffffff);
      this.faceMaskG.fillCircle(this.face.x, this.face.y, this.faceSize/2);
      this.face.setMask(this.faceMaskG.createGeometryMask());
    }

    _weaponLabel() {
      const w = WEAPONS.find(x => x.key === R.weaponKey) || WEAPONS[0];
      return `${w.label} ${w.name}`;
    }

    _buildWeaponBar() {
      const { width, height } = this.scale;
      const barH = 98;
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
        box.setInteractive({ useHandCursor: true });

        const txt = this.add.text(x, y - 2, w.label, {
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
          fontSize: "30px",
          color: "#ffffff"
        }).setOrigin(0.5).setDepth(111);

        const sel = this.add.rectangle(x, y, btnSize, btnSize, 0x000000, 0).setDepth(112);
        sel.setStrokeStyle(2, 0xffffff, 0.35);
        sel.setVisible(w.key === R.weaponKey);

        box.on("pointerdown", () => {
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
      const dur = () => clamp(baseDur - this.combo*18, 260, 900);

      if (this.idleTweens) this.idleTweens.forEach(t => t?.remove());
      this.idleTweens = [];

      const mk = (target, amp) => {
        const y0 = target.y;
        const t = this.tweens.add({ targets: target, y: y0 - amp, duration: dur(), yoyo: true, repeat: -1, ease: "Sine.inOut" });
        this.idleTweens.push(t);
      };

      mk(this.girl, 10);
      mk(this.body, 6);
      mk(this.face, 7);
    }

    _refreshIdleSpeed() { this._startIdleTweens(); }

    _hit() {
      const now = this.time.now;
      const dt = now - this.lastHitAt;

      if (dt < 900) this.combo += 1; else this.combo = 1;
      this.lastHitAt = now;

      this.anger = clamp(this.anger + 0.055, 0, 1);

      const w = WEAPONS.find(x => x.key === R.weaponKey) || WEAPONS[0];
      const mult = 1 + clamp(Math.floor(this.combo / 10), 0, 9);
      this.score += w.score * mult;

      this.txtScore.setText(`Skor: ${this.score}`);
      this.txtCombo.setText(`Combo: ${this.combo} x${mult}`);

      this.sound.play(pick(w.sounds), { volume: 0.75 });
      this.cameras.main.shake(90, w.shake / 1000);

      // Face reaction
      this.tweens.add({
        targets: this.face,
        scale: w.hitScale,
        angle: Phaser.Math.Between(-6, 6),
        duration: 70,
        yoyo: true,
        ease: "Quad.out",
        onComplete: () => { this.face.setScale(1); this.face.angle = 0; }
      });

      // Body nudge (no drop)
      const by0 = this.body.y;
      this.tweens.add({ targets: this.body, y: by0 + 3, duration: 70, yoyo: true, ease: "Sine.inOut", onComplete: () => (this.body.y = by0) });

      // Girl rotate only (no drifting)
      this.tweens.add({ targets: this.girl, angle: Phaser.Math.Between(-4, 4), duration: 60, yoyo: true, ease: "Sine.inOut", onComplete: () => (this.girl.angle = 0) });

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

      this._syncFaceMask();
    }

    _isPaused() { return !!this.pausedUI; }

    _openPause() {
      if (this._isPaused()) return;

      const { width, height } = this.scale;
      const font = "system-ui, -apple-system, Segoe UI, Roboto, Arial";

      const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.55).setDepth(1000);

      const panelW = Math.min(360, width*0.84);
      const panelH = 260;
      const px = width/2 - panelW/2;
      const py = height/2 - panelH/2;

      const panelG = this.add.graphics().setDepth(1001);
      drawRoundedRect(panelG, px, py, panelW, panelH, 18, 0x0b0f1a, 0.92, 0xffffff, 0.10, 2);

      const title = this.add.text(width/2, height/2 - 92, "Durduruldu", {
        fontFamily: font, fontSize: "22px", color: "#ffffff", fontStyle: "800"
      }).setOrigin(0.5).setDepth(1002);

      const mkBtn = (y, text, onClick) => {
        const bw = panelW * 0.78, bh = 46;
        const bx = width/2 - bw/2, by = y - bh/2;

        const g = this.add.graphics().setDepth(1002);
        drawRoundedRect(g, bx, by, bw, bh, 14, 0xffffff, 0.10, 0xffffff, 0.14, 2);

        const hit = this.add.rectangle(width/2, y, bw, bh, 0x000000, 0)
          .setDepth(1003).setInteractive({ useHandCursor: true });

        const t = this.add.text(width/2, y, text, {
          fontFamily: font, fontSize: "16px", color: "#ffffff", fontStyle: "700"
        }).setOrigin(0.5).setDepth(1004);

        hit.on("pointerdown", onClick);
        return [g, hit, t];
      };

      const resume = mkBtn(height/2 - 20, "Devam", () => this._closePause());
      const restart = mkBtn(height/2 + 38, "Restart", () => { this._closePause(true); this.scene.restart(); });
      const menu = mkBtn(height/2 + 96, "Ana Menü", () => { this._closePause(true); this.scene.start("Menu"); });

      this.pausedUI = [overlay, panelG, title, ...resume, ...restart, ...menu];
    }

    _closePause(destroyOnly = false) {
      if (!this.pausedUI) return;
      this.pausedUI.forEach(o => o?.destroy());
      this.pausedUI = null;
    }
  }

  const config = {
    type: Phaser.AUTO,
    parent: "game",
    backgroundColor: "#000000",
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 540, height: 960 },
    audio: { disableWebAudio: false },
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
