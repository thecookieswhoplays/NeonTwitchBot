"use strict";

const tmi = require("tmi.js");
const config = require("./config.json");
const prefix = config.prefix;
const Play = require("./play.js"); //const db = new FileStorage("db.json");
const regex = /^([1-9]\d{0,3}(\.\d{1,2})?|0\.\d{1,2}|0,\d{1,2})$/;

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
    const guess = message.split(" ")[1];
    if (!regex.test(guess)) {
      const msg =
        tags.username + " You need to use this format. !join [0.01, 9999]";
      return client.say(config.channels[0], msg);
    }
    const f = await play.find(tags.username);
    if (f.is) {
      console.log(f);
      return client.say(
        config.channels[0],
        tags.username + " You are already registered with the guess " + f.guess
      );
    }
    play.add(tags.username, guess);
    if (config.sendJoinMsg) {
      return client.say(
        config.channels[0],
        `Registerd ${tags.username} with guess ${guess}!`
      );
    } else return;
  }
  if (message.startsWith(prefix + "end")) {
    console.log(tags);
    console.log(config.botMods.includes(tags.username));
    console.log(tags.mod);
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
        "Could not end the game because it is not there Weird :("
      );
    }
    const guess = message.split(" ")[1];
    if (!regex.test(guess)) {
      const msg =
        tags.username + " You need to use this format. !join [0.01, 9999]";
      return client.say(config.channels[0], msg);
    }
    const ended = await play.end(guess);
    console.log(ended);
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

async function worker(arg, cb) {
  const re = await arg();
  cb(null, re);
}
