const widget = document.getElementById("widget");
const message = document.getElementById("message");
const result = document.getElementById("result");

let votingActive = false;
let votes = {}; // Объект для хранения голосов
let userVotes = {}; // Объект для отслеживания, кто уже голосовал
let timer;

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
    if (command === "голосование" && isAllowedToStart(user, flags)) {
      handleVotingCommand(message);
    }
  };
}

function isAllowedToStart(user, flags) {
  // Проверяем, может ли пользователь начать голосование
  return flags.mod || flags.broadcaster;
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
  message.textContent = `Отправьте в чат цифру с вашим выбором. Голосование длится ${duration} секунд.`;
  result.textContent = "";

  ComfyJS.onChat = (user, message) => {
    if (votingActive) {
      const vote = parseInt(message.trim(), 10);
      if (vote >= 1 && vote <= 10) {
        // Проверяем, голосовал ли пользователь
        if (!userVotes[user]) {
          userVotes[user] = vote; // Запоминаем, что пользователь проголосовал
          votes[vote] = (votes[vote] || 0) + 1; // Увеличиваем счетчик для выбранного числа
        }
      }
    }
  };

  timer = setTimeout(() => endVoting(), duration * 1000); // Завершить голосование через указанное время
}

function endVoting() {
  if (!votingActive) return; // Если голосование уже завершено, ничего не делаем

  votingActive = false;

  // Найти самый популярный ответ
  let maxVotes = 0;
  let winner = null;

  for (const [key, value] of Object.entries(votes)) {
    if (value > maxVotes) {
      maxVotes = value;
      winner = key;
    }
  }

  message.textContent = `Победитель голосования: ${winner || "Нет ответа"}`;
  result.textContent = `Количество голосов: ${maxVotes || 0}`;

  clearTimeout(timer); // Останавливаем таймер, если голосование завершено досрочно

  setTimeout(() => {
    widget.style.display = "none";
  }, 30 * 1000); // Скрыть через 30 секунд
}
