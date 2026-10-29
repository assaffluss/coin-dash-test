// Keep tuning separate from game behaviour so features can be developed independently.
window.COIN_DASH = {
  width: 800,
  height: 500,
  roundSeconds: 60,
  playerSpeed: 240,
  droneSpeed: 105,
  droneSpeedIntervalSeconds: 10,
  droneSpeedStep: 15,
  droneMaxSpeed: 180,
  droneAcceleration: 30,
  droneCount: 3,
  goldenCoinChance: 0.2, // Each new coin has a 20% chance to be worth 3 points.
  colors: { background: 0x101c31, player: 0x71e8ce, coin: 0xffd166, goldenCoin: 0xffd700, drone: 0xff657a }
};
