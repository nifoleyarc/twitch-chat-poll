const widget = document.getElementById("widget");
const message = document.getElementById("message");
const result = document.getElementById("result");

let votingActive = false;
let votes = {}; // Объект для хранения голосов
let userVotes = {}; // Объект для отслеживания, кто уже голосовал
let timer;

// Переменные для канала и модераторов
const urlParams = new URLSearchParams(window.location.search);
const channelName = urlParams.get("channel");
const allowedModerators = ["Nikothann"]; // Список модераторов, которые могут начать голосование ["Moderator_1", "Moderator_2", ...]

if (!channelName) {
  console.error("Имя канала не указано. Добавьте параметр ?channel=ИмяКанала в URL.");
  message.textContent = "Ошибка: Укажите канал через URL (например, ?channel=YourChannel)";
  widget.style.display = "block";
} else {
  // Инициализация ComfyJS с заданным каналом
  ComfyJS.Init(channelName);

  ComfyJS.onCommand = (user, command, message, flags, extra) => {
    if (command === "голосование" && isAllowedToStart(user, flags)) {
      const args = message.split(" ");
      const duration = parseInt(args[0], 10); // Длительность голосования в секундах
      startVoting(isNaN(duration) ? 90 : duration); // Если длительность не указана, используем 90 секунд
    }
  };
}

function isAllowedToStart(user, flags) {
  // Проверяем, может ли пользователь начать голосование
  return (
    user === channelName || // Владелец канала
    allowedModerators.includes(user) || // Допустимые модераторы
    flags.mod // Модератор с флагом mod
  );
}

function startVoting(duration) {
  if (votingActive) return; // Если голосование уже идет, ничего не делаем
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

  timer = setTimeout(() => endVoting(duration), duration * 1000); // Завершить голосование через указанное время
}

function endVoting(duration) {
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
  result.textContent = `С результатом: ${maxVotes || 0} голосов`;

  setTimeout(() => {
    widget.style.display = "none";
  }, 15 * 1000); // Скрыть через 15 секунд
}
