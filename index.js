const mineflayer = require('mineflayer');
const axios = require('axios');
const { webhookURL, messageId } = require('./config');

const botOptions = {
  host: 'the8ghzlethalhvh.aternos.me',
  port: 44725,
  username: 'PornStarRecoded'
};

let bot;
const updateInterval = 4000; // Update every 4 seconds

const createBot = () => {
  bot = mineflayer.createBot(botOptions);

  bot.on('login', () => {
    console.log('Bot logged in');
    runPeriodicTasks();
    runCommand('/register PornStarRecoded');
    runCommand('/login PornStarRecoded');
  });

  bot.on('message', async message => {
    const messageContent = message.toString().trim();
    if (messageContent) {
      await sendMessageToWebhook(messageContent);
    } else {
      console.log('Received an empty message, not sending to webhook.');
    }
  });

  bot.on('playerJoined', player => console.log(`Player ${player.username} joined the server`));

  bot.on('end', () => {
    console.log('Bot disconnected, reconnecting in 5 seconds...');
    setTimeout(createBot, 5000);
  });

  bot.on('error', err => {
    if (err.code === 'ECONNRESET') {
      console.error('Connection reset by peer, reconnecting in 5 seconds...');
      bot.end();
    } else {
      console.error('Bot encountered an error:', err);
    }
  });
};

const sendMessageToWebhook = async () => {
  try {
    const embed = await createPlayerListEmbed();

    const payload = {
      content: 'PlayerList',
      embeds: [embed]
    };

    if (!messageId) {
      // Send a new message if messageId is not provided
      await axios.post(webhookURL, payload);
    } else {
      // Edit the existing message if messageId is provided
      await axios.patch(`${webhookURL}/messages/${messageId}`, payload);
    }
  } catch (error) {
    console.error('Error sending message to webhook:', error.message);
  }
};

const runPeriodicTasks = () => {
  setInterval(async () => {
    await sendMessageToWebhook();
  }, updateInterval);
};

const runCommand = (command) => {
  console.log(`Running command: ${command}`);
  bot.chat(command);
};

const createPlayerListEmbed = async () => {
  try {
    const players = await getOnlinePlayers();
    const playerList = players.map(player => `- ${player}`).join('\n');
    return {
      title: 'Online Players',
      description: playerList || 'No players online',
      color: 3066993 // Color in hex, #00FF00 is green
    };
  } catch (error) {
    console.error('Error creating player list embed:', error.message);
    return {
      title: 'Online Players',
      description: 'Error retrieving player list',
      color: 15158332 // Color in hex, #FF0000 is red
    };
  }
};

const getOnlinePlayers = () => {
  // Include the bot's own username in the player list
  return Object.values(bot.players)
    .map(player => player.username); // Include all players
};

createBot();
