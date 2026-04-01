const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { Telegraf } = require('telegraf');

let client;
let bot;

async function initTelegram(apiId, apiHash, sessionStr, botToken) {
    const session = new StringSession(sessionStr || "");
    client = new TelegramClient(session, parseInt(apiId), apiHash, {
        connectionRetries: 5,
    });

    await client.connect();
    
    if (botToken) {
        bot = new Telegraf(botToken);
        bot.launch();
    }

    return { client, bot };
}

module.exports = { 
    initTelegram, 
    getClient: () => client, 
    getBot: () => bot 
};
