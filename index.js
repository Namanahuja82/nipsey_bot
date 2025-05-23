require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');  // Add express

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const moodOptions = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: 'Energetic', callback_data: 'energetic' },
        { text: 'Sad', callback_data: 'sad' },
        { text: 'Wanna Party', callback_data: 'party' }
      ]
    ]
  }
};

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'What mood are you in?', moodOptions);
});

bot.on('callback_query', async (query) => {
  const mood = query.data;
  const chatId = query.message.chat.id;

  await bot.sendMessage(chatId, `Getting songs for your "${mood}" mood...`);

  const prompt = `
  Based on the mood "${mood}", suggest 3 songs by Nipsey Hussle that fit this vibe. Just give song names, no explanations.
  `;

  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY
        }
      }
    );

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No songs found.';
    bot.sendMessage(chatId, `Here are your Nipsey Hussle tracks:\n\n${text}`);
  } catch (error) {
    console.error(error.response?.data || error.message);
    bot.sendMessage(chatId, 'Sorry, there was an error fetching the songs.');
  }
});

// === ADD THIS EXPRESS SERVER AT THE END ===
const app = express();

app.get('/', (req, res) => {
  res.send('Bot is alive!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
