/* global Phaser, COIN_DASH */
// Bright, minimal title screen: waits for Space before the round (timer + drones) begins.
class Title extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    const c = COIN_DASH, cx = c.width / 2, ink = '#1f3a5f', soft = '#6b7f99';
    const font = (size, style = 'normal', color = ink) =>
      ({ fontFamily: 'system-ui, Segoe UI, sans-serif', fontSize: `${size}px`, fontStyle: style, color });
    this.add.rectangle(cx, c.height / 2, c.width, c.height, 0xdff1ff);
    for (const [x, y, w] of [[90, 70, 120], [690, 110, 150], [120, 430, 140], [700, 440, 110]]) {
      const cloud = this.add.ellipse(x, y, w, w * 0.42, 0xffffff, 0.75);
      this.tweens.add({ targets: cloud, x: x + 30, duration: 6000 + w * 20, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    const card = this.add.graphics();
    card.fillStyle(0x9cc4e4, 0.25).fillRoundedRect(cx - 258, 66, 516, 380, 28);
    card.fillStyle(0xffffff, 1).fillRoundedRect(cx - 260, 60, 520, 380, 28);
    card.fillStyle(0xf1f8ff, 1).fillRoundedRect(cx - 220, 172, 440, 92, 18);
    this.add.text(cx, 108, 'Coin Dash', font(42, 'bold')).setOrigin(0.5);
    this.add.text(cx, 148, `Grab coins, dodge drones — you have ${c.roundSeconds} seconds.`, font(16, 'normal', soft)).setOrigin(0.5);

    // Animated demo preview: the player glides toward a bobbing, spinning coin while a drone drifts.
    const player = this.add.rectangle(cx - 170, 218, 22, 22, c.colors.player).setStrokeStyle(2, 0x3fbfa5);
    this.tweens.add({ targets: player, x: cx - 40, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const coin = this.add.circle(cx + 10, 218, 11, c.colors.coin).setStrokeStyle(3, 0xf0b429);
    this.tweens.add({ targets: coin, y: 208, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: coin, scaleX: 0.25, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const drone = this.add.rectangle(cx + 150, 200, 22, 22, c.colors.drone).setStrokeStyle(2, 0xe04a5f);
    this.tweens.add({ targets: drone, y: 238, angle: 90, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Legend: what to collect and what to avoid.
    this.add.circle(cx - 130, 300, 10, c.colors.coin).setStrokeStyle(3, 0xf0b429);
    this.add.text(cx - 112, 300, 'Collect', font(18, 'bold')).setOrigin(0, 0.5);
    this.add.rectangle(cx + 50, 300, 20, 20, c.colors.drone).setStrokeStyle(2, 0xe04a5f);
    this.add.text(cx + 70, 300, 'Avoid', font(18, 'bold')).setOrigin(0, 0.5);

    // Pill-shaped "button" prompt that gently pulses.
    const pill = this.add.graphics();
    pill.fillStyle(0x4c9aff, 1).fillRoundedRect(-140, -25, 280, 50, 25);
    const prompt = this.add.container(cx, 378, [pill,
      this.add.text(0, 0, 'Press Space to start', font(20, 'bold', '#ffffff')).setOrigin(0.5)]);
    this.tweens.add({ targets: prompt, scale: 1.06, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.add.text(cx, 470, 'Move: arrow keys / WASD  ·  Restart: R', font(15, 'normal', '#5b7390')).setOrigin(0.5);

    this.input.keyboard.once('keydown-SPACE', () => this.scene.start('CoinDash'));
  }
}
class CoinDash extends Phaser.Scene {
  constructor() { super('CoinDash'); }

  create() {
    const c = COIN_DASH;
    this.score = 0;
    this.finished = false;
    this.paused = false;
    // Deadline is set on the first update so it counts from when this scene actually runs.
    this.deadline = 0;
    this.droneSpeed = c.droneSpeed;
    this.physics.world.setBounds(0, 44, c.width, c.height - 44);
    this.add.grid(c.width / 2, c.height / 2, c.width, c.height, 40, 40,
      c.colors.background, 1, 0x24334b, 0.45);
    this.hud = this.add.text(18, 12, '', { font: '18px monospace', color: '#ffffff' });
    this.player = this.add.rectangle(c.width / 2, c.height / 2, 24, 24, c.colors.player);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.coin = this.add.circle(100, 100, 9, c.colors.coin);
    this.physics.add.existing(this.coin);
    this.coin.body.setCircle(9);
    this.placeCoin();
    this.drones = this.physics.add.group();
    for (let i = 0; i < c.droneCount; i++) {
      const drone = this.add.rectangle(90 + i * 270, 100, 26, 26, c.colors.drone);
      this.drones.add(drone);
      drone.body.setCollideWorldBounds(true).setBounce(1, 1);
      const angle = (35 + i * 105) * Math.PI / 180;
      drone.body.setVelocity(Math.cos(angle) * c.droneSpeed, Math.sin(angle) * c.droneSpeed);
    }
    this.physics.add.overlap(this.player, this.coin, () => {
      if (this.finished) return;
      this.score++;
      this.placeCoin();
    });
    this.physics.add.overlap(this.player, this.drones, () => this.finish('A drone caught you!'));
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,R');
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
    this.pauseText = this.add.text(c.width / 2, c.height / 2, 'PAUSED',
      { font: '48px monospace', color: '#ffffff' }).setOrigin(0.5).setDepth(10).setVisible(false);
    this.input.keyboard.on('keydown-P', () => this.togglePause());
  }

  togglePause() {
    if (this.finished) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.pausedAt = this.time.now;
      this.physics.pause();
    } else {
      // Push the deadline back by however long the game was paused.
      this.deadline += this.time.now - this.pausedAt;
      this.physics.resume();
    }
    this.pauseText.setVisible(this.paused);
  }

  placeCoin() {
    const c = COIN_DASH;
    // Avoid spawning the next coin directly underneath the player.
    let x, y;
    do {
      x = Phaser.Math.Between(25, c.width - 25);
      y = Phaser.Math.Between(70, c.height - 25);
    } while (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 60);
    this.coin.setPosition(x, y);
    this.coin.body.reset(x, y);
  }

  update(time, delta) {
    if (this.finished || this.paused) return;
    const c = COIN_DASH;
    if (!this.deadline) this.deadline = this.time.now + c.roundSeconds * 1000;
    // Derive elapsed time from the deadline so paused time doesn't speed up the drones.
    const elapsedSeconds = Math.max(0, c.roundSeconds - (this.deadline - this.time.now) / 1000);
    const speedSteps = Math.floor(elapsedSeconds / c.droneSpeedIntervalSeconds);
    const targetSpeed = Math.min(c.droneMaxSpeed, c.droneSpeed + speedSteps * c.droneSpeedStep);
    // Ease into each 10-second increase without changing the current bounce direction.
    this.droneSpeed = Math.min(targetSpeed, this.droneSpeed + c.droneAcceleration * delta / 1000);
    this.drones.children.iterate(drone => {
      const velocity = drone.body.velocity;
      const speed = Math.hypot(velocity.x, velocity.y);
      if (speed > 0) {
        drone.body.setVelocity(velocity.x / speed * this.droneSpeed,
          velocity.y / speed * this.droneSpeed);
      }
    });
    const dx = Number(this.cursors.right.isDown || this.keys.D.isDown)
      - Number(this.cursors.left.isDown || this.keys.A.isDown);
    const dy = Number(this.cursors.down.isDown || this.keys.S.isDown)
      - Number(this.cursors.up.isDown || this.keys.W.isDown);
    const direction = new Phaser.Math.Vector2(dx, dy).normalize().scale(COIN_DASH.playerSpeed);
    this.player.body.setVelocity(direction.x, direction.y);
    const seconds = Math.max(0, Math.ceil((this.deadline - this.time.now) / 1000));
    this.hud.setText(`Coins: ${this.score}                       Time: ${seconds}s`);
    if (seconds === 0) this.finish('Time is up!');
  }

  finish(reason) {
    if (this.finished) return;
    this.finished = true;
    this.physics.pause();
    const c = COIN_DASH;
    this.add.rectangle(c.width / 2, c.height / 2, 460, 150, 0x0a1120, 0.95);
    this.add.text(c.width / 2, c.height / 2,
      `${reason}\n${this.score} coins collected\nPress R to try again`,
      { font: '24px monospace', color: '#ffffff', align: 'center', lineSpacing: 12 }
    ).setOrigin(0.5);
  }
}
window.coinDashGame = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: COIN_DASH.width,
  height: COIN_DASH.height,
  backgroundColor: COIN_DASH.colors.background,
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
  scene: [Title, CoinDash]
});
