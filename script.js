const widget = document.getElementById("widget");
const message = document.getElementById("message");
const result = document.getElementById("result");
const countdownElement = document.getElementById("countdown");
const voterCountElement = document.getElementById("voterCount");

let votingActive = false;
let votes = {}; // Объект для хранения голосов
let userVotes = {}; // Объект для отслеживания, кто уже голосовал
let timer;
let countdownInterval;

// Получаем имя канала из URL
const urlParams = new URLSearchParams(window.location.search);
const channelName = urlParams.get("channel");

if (!channelName) {
  console.error("Имя канала не указано. Добавьте параметр ?channel=ИмяКанала в URL.");
  message.textContent = "Ошибка: Укажите канал через URL (например, ?channel=YourChannel)";
  widget.style.display = "block";
} else {
  // Инициализация ComfyJS с заданным каналом
  ComfyJS.Init(channelName);

  ComfyJS.onCommand = (user, command, message, flags, extra) => {
    if (command === "опрос" && isAllowedToStart(user, flags)) {
      handleVotingCommand(message);
    }
  };
}

function isAllowedToStart(user, flags) {
  // Проверяем, может ли пользователь начать голосование --- return flags.mod || user.toLowerCase() === channelName.toLowerCase();
  return flags.broadcaster || user == "nikothann";
}

function handleVotingCommand(message) {
  if (votingActive) {
    // Если голосование уже активно, завершить его досрочно
    endVoting();
  } else {
    // Если голосование не активно, начать новое
    const args = message.split(" ");
    const duration = parseInt(args[0], 10); // Длительность голосования в секундах
    startVoting(isNaN(duration) ? 90 : duration); // Если длительность не указана, используем 90 секунд
  }
}

function startVoting(duration) {
  votingActive = true;
  votes = {};
  userVotes = {}; // Очищаем данные о голосах пользователей

  widget.style.display = "block";
  message.textContent = `Отправьте в чат номер (цифру), за который хотите проголосовать`;
  result.textContent = "";
  voterCountElement.textContent = `Кол-во проголосовавших: 0`;

  let remainingTime = duration;

  // Устанавливаем начальный текст таймера
  countdownElement.textContent = `${remainingTime}`;
  countdownElement.style.color = "blue";

  // Запускаем интервал обновления таймера
  countdownInterval = setInterval(() => {
    remainingTime--;
    countdownElement.textContent = `${remainingTime}`;

    // Меняем цвет текста на красный, если осталось менее 10 секунд
    if (remainingTime <= 10) {
      countdownElement.style.color = "red";
    }

    if (remainingTime <= 0) {
      clearInterval(countdownInterval);
    }
  }, 1000);

  // Логика для подсчета голосов
  ComfyJS.onChat = (user, message) => {
    if (votingActive) {
      const vote = parseInt(message.trim(), 10);
      if (vote >= 1 && vote <= 10) {
        // Проверяем, голосовал ли пользователь
        if (!userVotes[user]) {
          userVotes[user] = vote; // Запоминаем, что пользователь проголосовал
          votes[vote] = (votes[vote] || 0) + 1; // Увеличиваем счетчик для выбранного числа

          // Обновляем количество проголосовавших
          voterCountElement.textContent = `Кол-во проголосовавших: ${Object.keys(userVotes).length}`;
        }
      }
    }
  };

  timer = setTimeout(() => endVoting(), duration * 1000); // Завершить голосование через указанное время
}

function endVoting() {
  if (!votingActive) return; // Если голосование уже завершено, ничего не делаем

  votingActive = false;

  // Скрыть таймер
  countdownElement.textContent = "";
  countdownElement.style.display = "none";

  // Найти самый популярный ответ
  let maxVotes = 0;
  let winner = null;

  for (const [key, value] of Object.entries(votes)) {
    if (value > maxVotes) {
      maxVotes = value;
      winner = key;
    }
  }

  // Добавляем класс "winner" для стилизации сообщения о победителе
  message.classList.add("winner");
  message.textContent = `Победитель голосования: #${winner || "Нет ответа"}`;

  clearTimeout(timer); // Останавливаем таймер, если голосование завершено досрочно

  setTimeout(() => {
    widget.style.display = "none";
    message.classList.remove("winner"); // Убираем класс после скрытия виджета
    countdownElement.style.display = "block"; // Восстанавливаем видимость таймера для следующего голосования
  }, 10 * 1000); // Скрыть через 10 секунд
}

