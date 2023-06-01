"use strict";

const tmi = require("tmi.js");
const config = require("./config.json");
const prefix = config.prefix;
const Play = require("./play.js"); //const db = new FileStorage("db.json");
const regex =
  /^([1-9]\d{0,3}(\.\d{1,2})?|[1-9]\d{0,3}(\,\d{1,2})?|0\.\d{1,2}|0\,\d{1,2})$/;

const play = new Play();

const client = new tmi.Client({
  options: { debug: true },
  identity: {
    username: config.name,
    password: config.auth,
  },
  channels: config.channels,
});
client
  .connect()
  .then(() => {
    play.newGame();
  })
  .catch(console.error);
client.on("message", async (channel, tags, message, self) => {
  if (message.startsWith(prefix + "join")) {
    let guess = message.split(" ")[1];
    if (!regex.test(guess)) {
      const msg =
        tags.username + " You need to use this format. !join [0.01, 9999]";
      return client.say(config.channels[0], msg);
    }
    const f = await play.find(tags.username);
    if (f.is) {
      return client.say(
        config.channels[0],
        tags.username + " You are already registered with the guess " + f.guess
      );
    }
    guess = Number(guess.replace(",", "."));
    console.log("guess", guess);
    play.add(tags.username, guess);
    if (config.sendJoinMsg) {
      return client.say(
        config.channels[0],
        `Registered ${tags.username} with guess ${guess}!`
      );
    } else return;
  }
  if (message.startsWith(prefix + "end")) {
    if (!config.botMods.includes(tags.username)) {
      return client.say(
        config.channels[0],
        "You do not have the permissions to execute this command."
      );
    }
    if (!play.game) {
      console.error("Could not find game " + play);
      return client.say(
        config.channels[0],
        "Could not end the game because it doesn't exist Weird :("
      );
    }
    const guess = message.split(" ")[1];
    if (!regex.test(guess)) {
      const msg =
        tags.username + " You need to use this format. !end [0.01, 9999]";
      return client.say(config.channels[0], msg);
    }
    if (play.game.players.length === 0) {
      return client.say(
        config.channels[0],
        tags.username +
          " There is no player in the game. If there is rerun this command."
      );
    }
    const ended = await play.end(guess);
    await client.say(
      config.channels[0],
      tags.username +
        ` The winner is ${ended.players} with a difference of ${ended.diff}`
    );
    await client.say(
      config.channels[0],
      tags.username +
        " You have successfuly ended the game. And started another"
    );
  }
});
