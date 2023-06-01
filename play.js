const config = require("./config.json");

const { default: OBSWebSocket } = require("obs-websocket-js");
const obs = new OBSWebSocket();
const address = config.obsUrl;
const password = config.obsPassword;

console.log(address, password);

class Play {
  constructor() {
    this.game = null;
    obs.connect(address, password).then(() => {
      console.log("Connected to the OBS WebSocket server.");
    });
  }
  async find(player) {
    if (!this.game)
      throw new Error("Game is initialized yet pls retry at find");
    const fetchedPlayers = this.game.players.find((p) => p.player === player);
    if (!fetchedPlayers) {
      return { is: false };
    }
    return { is: true, guess: fetchedPlayers.guess };
  }
  async add(player, guess) {
    if (!this.game) throw new Error("Game is initialized yet pls retry at add");
    this.game.players.push({ player: player, guess: guess });
    await obs.call("SetInputSettings", {
      inputName: config.configSource,
      inputSettings: { text: `${player} guessed ${guess}!` },
    });
  }
  async newGame() {
    this.game = { players: [], winners: [], endGuess: null };
  }
  async end(guess) {
    if (!this.game) throw new Error("Game is initialized yet pls retry at end");
    const players = this.game.players;
    const closestGuesses = players.reduce(
      (closest, player) => {
        console.log(closest, player);
        const diff = Math.abs(
          player.guess - Number(guess.replace(",", "."))
        ).toFixed(2);
        console.log(diff, "diff", player.guess, guess);
        console.log(this);
        if (diff < closest.diff) {
          return { players: [player.player], diff };
        } else if (diff === closest.diff) {
          closest.players.push(player.player);
        }
        return closest;
      },
      { players: [], diff: Infinity }
    );

    const closestPlayers = closestGuesses.players.join(", ");
    console.log(`The closest guesses were made by ${closestPlayers}`);
    await obs.call("SetInputSettings", {
      inputName: config.endSource,
      inputSettings: {
        text: `The winner is ${closestPlayers}\nwith a difference of ${Number(
          closestGuesses.diff
        )}`,
      },
    });
    this.newGame();
    return closestGuesses;
  }
}
module.exports = Play;
