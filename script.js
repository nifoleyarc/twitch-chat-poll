const pollContainer = document.getElementById("poll-container");
const pollInstructions = document.getElementById("poll-instructions");
const pollTimer = document.getElementById("poll-timer");
const pollResults = document.getElementById("poll-results");

let pollActive = false; // Указывает, активно ли голосование
let pollDuration = 60; // Продолжительность голосования по умолчанию
let countdownInterval; // Таймер обратного отсчета
let votes = {}; // Хранение голосов

// Функция запуска голосования
function startPoll(duration) {
  pollActive = true;
  pollDuration = duration;
  votes = {}; // Очищаем предыдущие голоса
  pollResults.classList.add("hidden");
  pollTimer.textContent = pollDuration;
  pollTimer.classList.remove("red");
  pollContainer.classList.remove("hidden"); // Показываем виджет

  // Запуск таймера обратного отсчета
  countdownInterval = setInterval(() => {
    pollDuration -= 1;
    pollTimer.textContent = pollDuration;
    if (pollDuration <= 10) {
      pollTimer.classList.add("red"); // Меняем цвет на красный
    }
    if (pollDuration <= 0) {
      endPoll();
    }
  }, 1000);
}

// Функция завершения голосования
function endPoll() {
  clearInterval(countdownInterval); // Останавливаем таймер
  pollActive = false;

  // Подсчёт голосов
  const voteCounts = Object.values(votes).reduce((acc, vote) => {
    acc[vote] = (acc[vote] || 0) + 1;
    return acc;
  }, {});

  const winner = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])[0];
  const winnerText = winner ? `Победитель голосования: ${winner[0]}` : "Нет голосов";
  pollResults.textContent = `${winnerText} (${Object.keys(votes).length} участников)`;
  pollResults.classList.remove("hidden");

  // Скрываем виджет через 15 секунд
  setTimeout(() => {
    pollContainer.classList.add("hidden");
  }, 15000);
}

// Инициализация ComfyJS
const urlParams = new URLSearchParams(window.location.search);
const channel = urlParams.get("channel") || "ВашКанал"; // Получаем имя канала из URL
ComfyJS.Init(channel);

// Обработка сообщений из чата
ComfyJS.OnChat = (user, message, flags, self, extra) => {
  if (flags.mod || flags.broadcaster) { // Только модераторы или стример
    const [command, duration] = message.split(" ");
    if (command === "!голосование") {
      const pollTime = parseInt(duration); // Попытка преобразовать параметр времени
      if (pollActive) {
        endPoll(); // Завершаем текущее голосование
      } else {
        startPoll(isNaN(pollTime) ? 60 : pollTime); // Используем параметр или 60 секунд по умолчанию
      }
    }
  }

  // Учёт голосов пользователей
  if (
    pollActive &&
    /^\d$/.test(message) &&
    parseInt(message) >= 1 &&
    parseInt(message) <= 6
  ) {
    if (!votes[user]) { // Учитываем голос только один раз
      votes[user] = parseInt(message);
    }
  }
};
