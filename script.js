const widget = document.getElementById("widget");
const header = document.getElementById("header");
const message = document.getElementById("message");
const result = document.getElementById("result");
const countdownElement = document.getElementById("countdown");
const voterCountElement = document.getElementById("voterCount");

let votingActive = false;
let votes = {}; // Объект для хранения голосов
let userVotes = {}; // Объект для отслеживания, кто уже голосовал
let timer;
let countdownInterval;

const TWITCH_IRC_URL = "wss://irc-ws.chat.twitch.tv";
const OAUTH_TOKEN = "oauth:your_oauth_token"; // Замените на ваш токен
const TWITCH_USERNAME = "your_username"; // Замените на ваш логин Twitch
const CHANNEL_NAME = "#your_channel_name"; // Замените на имя вашего канала

const ws = new WebSocket(TWITCH_IRC_URL);

ws.onopen = () => {
  console.log("Соединение с Twitch IRC установлено.");
  ws.send(`PASS ${OAUTH_TOKEN}`);
  ws.send(`NICK ${TWITCH_USERNAME}`);
  ws.send(`JOIN ${CHANNEL_NAME}`);
};

ws.onmessage = (event) => {
  const messageData = event.data;

  if (messageData.includes("PRIVMSG")) {
    const user = messageData.split("!")[0].split(":")[1];
    const chatMessage = messageData.split("PRIVMSG")[1].split(":")[1].trim();

    if (votingActive) {
      handleVote(user, chatMessage);
    }

    if (chatMessage.startsWith("!опрос") && isAllowedToStart(user)) {
      handleVotingCommand(chatMessage);
    }
  }
};

ws.onerror = (error) => {
  console.error("Ошибка WebSocket:", error);
};

function isAllowedToStart(user) {
  return user.toLowerCase() === TWITCH_USERNAME.toLowerCase();
}

function handleVotingCommand(chatMessage) {
  if (votingActive) {
    endVoting();
  } else {
    const args = chatMessage.split(" ");
    const duration = parseInt(args[1], 10);
    startVoting(isNaN(duration) ? 90 : duration);
  }
}

function startVoting(duration) {
  votingActive = true;
  votes = {};
  userVotes = {};

  widget.style.display = "block";
  header.style.display = "block";
  message.textContent = `Напиши в чат номер варианта, за который хочешь проголосовать.`;
  result.textContent = "";
  voterCountElement.textContent = `Кол-во проголосовавших: 0`;

  let remainingTime = duration;
  countdownElement.textContent = `${remainingTime}`;

  countdownInterval = setInterval(() => {
    remainingTime--;
    countdownElement.textContent = `${remainingTime}`;

    if (remainingTime <= 10) {
      countdownElement.style.color = "red";
    }

    if (remainingTime <= 0) {
      clearInterval(countdownInterval);
    }
  }, 1000);

  timer = setTimeout(() => endVoting(), duration * 1000);
}

function handleVote(user, message) {
  const vote = parseInt(message.trim(), 10);
  if (vote >= 1 && vote <= 6 && !userVotes[user]) {
    userVotes[user] = true;
    votes[vote] = (votes[vote] || 0) + 1;
    voterCountElement.textContent = `Кол-во проголосовавших: ${Object.keys(userVotes).length}`;
  }
}

function endVoting() {
  if (!votingActive) return;

  votingActive = false;
  countdownElement.textContent = "";
  countdownElement.style.display = "none";
  voterCountElement.textContent = "";

  const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0);
  let maxVotes = 0;
  let winner = null;

  for (const [key, value] of Object.entries(votes)) {
    if (value > maxVotes) {
      maxVotes = value;
      winner = key;
    }
  }

  const results = Object.entries(votes)
    .map(([key, value]) => {
      const percentage = ((value / totalVotes) * 100).toFixed(2);
      return `Вариант #${key} набрал ${value} голос(ов) (${percentage}%)`;
    })
    .join("<br>");

  header.style.display = "none";
  message.innerHTML = `Победитель: <span style='color: #ffb400;'>#${winner || "Нет ответа"}</span>`;
  result.innerHTML = `
    Кол-во проголосовавших: ${totalVotes || 0}<br>
    ${results}
  `;

  clearTimeout(timer);

  setTimeout(() => {
    widget.style.display = "none";
    countdownElement.style.display = "block";
  }, 15 * 1000);
}
