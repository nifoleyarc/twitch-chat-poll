let votingActive = false; // Статус голосования
let uniqueVotes = new Set(); // Хранение уникальных пользователей
let countdownInterval = null; // Таймер для обратного отсчета

const widget = document.getElementById("widget");
const voteCountElem = document.getElementById("vote-count");
const countdownTimerElem = document.getElementById("countdown-timer");

// Функция начала голосования
function startVoting(duration) {
  if (votingActive) {
    endVoting(); // Если голосование уже идет, завершить его
    return;
  }

  votingActive = true; // Устанавливаем флаг активности голосования
  uniqueVotes.clear(); // Очищаем список уникальных голосов
  voteCountElem.textContent = "Всего проголосовало: 0"; // Обновляем счетчик

  widget.style.display = "flex"; // Показываем виджет

  let timeLeft = duration; // Устанавливаем время голосования

  // Запускаем таймер обратного отсчета
  countdownInterval = setInterval(() => {
    timeLeft -= 1;
    countdownTimerElem.textContent = timeLeft;

    // Меняем цвет таймера на красный, если осталось менее 10 секунд
    countdownTimerElem.style.color = timeLeft <= 10 ? "red" : "blue";

    if (timeLeft <= 0) {
      endVoting(); // Завершаем голосование при окончании времени
    }
  }, 1000);
}

// Функция завершения голосования
function endVoting() {
  clearInterval(countdownInterval); // Останавливаем таймер
  votingActive = false; // Сбрасываем статус голосования

  // Определяем победителя
  const result = [...uniqueVotes].sort(
    (a, b) => uniqueVotes[b] - uniqueVotes[a]
  )[0] || "Нет голосов";

  voteCountElem.textContent = `Победитель: ${result}`; // Отображаем результат

  // Скрываем виджет через 30 секунд
  setTimeout(() => {
    widget.style.display = "none";
  }, 30000);
}

// Обработка команды !голосование
ComfyJS.onCommand = (user, command, message, flags, extra) => {
  if ((flags.mod || flags.broadcaster) && command === "голосование") {
    const duration = parseInt(message) || 90; // Длительность голосования из команды
    startVoting(duration); // Запуск голосования
  }
};

// Обработка сообщений чата
ComfyJS.onChat = (user, message, flags, self, extra) => {
  if (votingActive && /^[1-9]0?$/.test(message.trim())) {
    uniqueVotes.add(user); // Добавляем уникального пользователя
    voteCountElem.textContent = `Всего проголосовало: ${uniqueVotes.size}`; // Обновляем счетчик
  }
};

// Получение имени канала из URL
const urlParams = new URLSearchParams(window.location.search);
const channel = urlParams.get("channel");

if (channel) {
  ComfyJS.Init(channel); // Инициализация ComfyJS для указанного канала
} else {
  console.error("Channel name is not specified in the URL."); // Ошибка, если канал не указан
}
