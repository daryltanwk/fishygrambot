require('dotenv').config();
const Telebot = require('telebot');

export const bot = new Telebot(process.env.BOT_API_KEY);
bot.start();
