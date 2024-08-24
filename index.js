const mineflayer = require('mineflayer');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { token, channelId, messageId } = require('./config');

const botOptions = {
  host: 'the8ghzlethalhvh.aternos.me',
  port: 44725,
  username: 'PornStarRecoded'
};

let bot;
const updateInterval = 4000; // Update every 4 seconds
let discordClient;
let discordMessage;

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
      await sendMessageToDiscord(messageContent);
    } else {
      console.log('Received an empty message, not sending to Discord.');
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

const sendMessageToDiscord = async () => {
  if (!discordClient || !discordClient.isReady()) return;

  try {
    const channel = await discordClient.channels.fetch(channelId);
    if (!discordMessage) {
      discordMessage = await channel.send({
        content: 'PlayerList',
        embeds: [await createPlayerListEmbed()]
      });
    } else {
      await discordMessage.edit({
        content: 'PlayerList',
        embeds: [await createPlayerListEmbed()]
      });
    }
  } catch (error) {
    console.error('Error sending message to Discord:', error.message);
  }
};

const runPeriodicTasks = () => {
  setInterval(async () => {
    if (discordClient && discordClient.isReady()) {
      await sendMessageToDiscord();
    }
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
    return new EmbedBuilder()
      .setTitle('Online Players')
      .setDescription(playerList || 'No players online')
      .setColor('#00FF00'); // Green color
  } catch (error) {
    console.error('Error creating player list embed:', error.message);
    return new EmbedBuilder()
      .setTitle('Online Players')
      .setDescription('Error retrieving player list')
      .setColor('#FF0000'); // Red color for error
  }
};

const getOnlinePlayers = () => {
  return Object.values(bot.players)
    .map(player => player.username); // Include all players
};

const initializeDiscordBot = () => {
  discordClient = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
  });

  discordClient.once('ready', async () => {
    console.log(`Logged in as ${discordClient.user.tag}`);
    await sendMessageToDiscord(); // Send initial message
  });

  discordClient.on('error', console.error);

  discordClient.login(token);
};

// Initialize and start the bots
initializeDiscordBot();
createBot();
