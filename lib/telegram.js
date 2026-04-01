const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { Telegraf } = require('telegraf');
const db = require('./firebase');

let client;
let bot;

async function connectTelegram(apiId, apiHash, sessionStr, botToken) {
    // 1. UserBot Connection (MTProto)
    const session = new StringSession(sessionStr || "");
    client = new TelegramClient(session, parseInt(apiId), apiHash, {
        connectionRetries: 5,
    });
    await client.connect();

    // 2. Bot Connection
    bot = new Telegraf(botToken);
    bot.launch();

    console.log("✅ Telegram API & Bot Connected!");
    return { client, bot };
}

module.exports = { connectTelegram, getClient: () => client, getBot: () => bot };
