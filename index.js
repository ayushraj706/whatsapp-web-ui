const connectToWhatsApp = require('./lib/whatsapp');
const { Telegraf } = require('telegraf');
const db = require('./lib/firebase');
const config = require('./config');
const cron = require('node-cron');

const bot = new Telegraf(config.telegramToken);

async function start() {
    const sock = await connectToWhatsApp();

    // Telegram Bot Commands
    bot.start((ctx) => ctx.reply('BaseKey Bridge Active! Use /schedule <number> <HH:mm> <message>'));

    bot.command('schedule', async (ctx) => {
        const args = ctx.message.text.split(' ');
        if (args.length < 4) return ctx.reply('❌ Error! Format: /schedule 919876543210 14:30 Hello');

        const data = {
            number: args[1],
            time: args[2],
            message: args.slice(3).join(' '),
            status: 'pending',
            createdAt: Date.now()
        };

        await db.ref('schedules').push(data);
        ctx.reply(`✅ Scheduled for ${data.number} at ${data.time}`);
    });

    // Scheduler Engine (Har minute check karega)
    cron.schedule('* * * * *', async () => {
        const now = new Date().toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false, 
            timeZone: config.timezone 
        });

        const snapshot = await db.ref('schedules').orderByChild('status').equalTo('pending').once('value');
        
        snapshot.forEach((child) => {
            const val = child.val();
            if (val.time === now) {
                sock.sendMessage(val.number + '@s.whatsapp.net', { text: val.message })
                    .then(() => {
                        child.ref.update({ status: 'sent' });
                        console.log(`[BaseKey] Message sent to ${val.number}`);
                    })
                    .catch(err => console.error('Error sending msg:', err));
            }
        });
    });

    bot.launch();
    console.log('🤖 Telegram Bot Started');
}

start();
