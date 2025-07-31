// --- DOM Elements ---
const questionTitleEl = document.getElementById("question-title");
const optionsEl = document.getElementById("options");
const backBtn = document.getElementById("back-btn");
const nextBtn = document.getElementById("next-btn");
const progressBar = document.getElementById("progress-bar");

// --- Age Verification Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const ageModal = document.getElementById('age-verification-modal');
    const confirmBtn = document.getElementById('age-confirm-btn');
    const denyBtn = document.getElementById('age-deny-btn');
    const closeBtn = ageModal.querySelector('.close-button');

    const isVerified = sessionStorage.getItem('ageVerified'); // Перевіряємо сесійне сховище

    if (isVerified === 'true') {
        ageModal.style.display = 'none'; // Якщо вже підтверджено, приховуємо модал
        document.body.classList.remove('modal-open'); // Видаляємо клас, якщо він був
        initializeQuiz(); // Запускаємо квіз одразу
    } else {
        ageModal.style.display = 'flex'; // Показуємо модал
        document.body.classList.add('modal-open'); // Додаємо клас для блокування прокрутки основного контенту
    }

    confirmBtn.addEventListener('click', () => {
        sessionStorage.setItem('ageVerified', 'true'); // Зберігаємо статус
        ageModal.style.display = 'none';
        document.body.classList.remove('modal-open');
        initializeQuiz(); // Запускаємо квіз
    });

    denyBtn.addEventListener('click', () => {
        sessionStorage.setItem('ageVerified', 'false'); // Зберігаємо статус (не підтверджено)
        window.location.href = 'https://www.google.com/'; // Перенаправляємо
    });

    closeBtn.addEventListener('click', () => {
        // Якщо користувач закриває модал, не підтвердивши вік, розглядаємо це як відмову
        sessionStorage.setItem('ageVerified', 'false');
        window.location.href = 'https://www.google.com/'; // Перенаправляємо
    });
});

// ПЕРЕМІСТИМО initializeQuiz() З КІНЦЯ ФАЙЛУ СЮДИ АБО ПЕРЕКОНАЙТЕСЯ, ЩО initializeQuiz()
// ВИКЛИКАЄТЬСЯ ТІЛЬКИ ПІСЛЯ ПІДТВЕРДЖЕННЯ ВІКУ.
// Якщо initializeQuiz() знаходиться в кінці script.js, тоді видаліть його звідти
// і переконайтесь, що він викликається тільки в обробниках подій confirmBtn.
// Якщо initializeQuiz() вже обгорнутий в якусь функцію-ініціалізатор, то просто переконайтесь,
// що ця функція викликається після підтвердження віку.
// У вашому випадку initializeQuiz() викликається в кінці файлу, тому його потрібно
// видалити з кінця і викликати тільки після успішної верифікації.

// ... ваш існуючий код script.js починається тут ...
// (наприклад, визначення DOM-елементів, quizData, stepHistory тощо)

// ЗАУВАЖТЕ: Якщо ви вже маєте initializeQuiz() в кінці script.js, ВИДАЛІТЬ ЙОГО ЗВІДТИ,
// оскільки тепер він викликається лише після успішної вікової верифікації.

// --- State ---
let quizData = {};
let stepHistory = ["step1"];
let userAnswers = {};
let totalSteps = 4; // Approximate number of steps for progress bar

// --- Emoji Mapping ---
const optionEmojis = {
  "Для себе": "👤",
  "Для нас обох": "👩‍❤️‍👨",
  "Для гігієни та здоров’я": "🌿",
  "Для подарунка": "🎁",
  "Жінка": "♀️",
  "Чоловік": "♂️",
  "Вагінальна стимуляція": "✨",
  "Кліторальна стимуляція": "🌸",
  "Анальна стимуляція": "🍑",
  "Ерекційні засоби": "💪",
  "Експериментальні іграшки": "⛓️",
  "Сценарний набір": "🎭",
  "Мастурбатори": "🍆",
  "Кільця": "💍",
  "Вібратори для двох": "💞",
  "Ігрові набори": "🎲",
  "Страпони": "🦄",
  "Інтимна косметика": "🧴",
  "Змазки": "💧",
  "Презервативи": "🛡️",
  "Догляд за тілом": "🧼",
  "Безпека": "⛑️",
  "Менструальні товари": "🩸",
  "Універсальний набір": "🎀",
  "Парфуми": "👃",
  "Секс-іграшка": "💖",
  "Ігровий костюм": "👯‍♀️",
  "Збуджуючі засоби": "🌶️"
};

// --- Mapping for API requests (UPDATED HERE for "Ерекційні засоби" without rings) ---
const labelToCategories = {
  "Вагінальна стимуляція": ["915236", "915248", "915249", "915308", "915305", "915306", "915307", "915309", "915310", "915245", "915348"],
  "Кліторальна стимуляція": ["915346", "915309", "915305", "915340", "915235", "915234", "915342", "915343", "915347", "915241", "915344"],
  "Анальна стимуляція": ["915170", "915184", "915185", "915186", "915187", "915188", "915189", "915190", "915191"],
  "Ерекційні засоби": ["915172", "915197", "915198", "915199", "915200"], // ОНОВЛЕНО: Тепер тільки збуджуючі засоби (без кілець)
  "Експериментальні іграшки": ["915174", "915222", "915223", "915224", "915225", "915226", "915227", "915228", "915229", "915230", "915231", "915232", "915233"],
  "Сценарний набір": ["915256"],
  "Мастурбатори": ["915252", "915291", "915292", "915293"],
  "Кільця": ["915251", "915288", "915289", "915290"], // Залишається окремо, як опція у квізі
  "Вібратори для двох": ["915255"],
  "Ігрові набори": ["915256", "915259", "915303"],
  "Страпони": ["915258", "915299", "915300", "915301", "915302"],
  "Інтимна косметика": ["915194", "915268", "915269", "915270", "915271", "915272"],
  "Змазки": ["915192", "915260", "915261", "915262", "915263", "915264"],
  "Презервативи": ["915193", "915265", "915266", "915267"],
  "Догляд за тілом": ["915271"],
  "Безпека": ["915193"],
  "Менструальні товари": ["915196"],
  "Універсальний набір": ["915256"],
  "Парфуми": ["915195", "915273", "915274"],
  "Секс-іграшка": ["915169"],
  "Ігровий костюм": ["915206"]
};

// --- Logic ---
async function initializeQuiz() {
  try {
    const response = await fetch('steps.json');
    if (!response.ok) throw new Error('Network response was not ok');
    quizData = await response.json();
    totalSteps = Object.keys(quizData).filter(k => quizData[k].question).length / 2;
    renderStep();
  } catch (error) {
    console.error('Failed to load quiz data:', error);
    if(questionTitleEl) questionTitleEl.textContent = 'Помилка завантаження';
    if(optionsEl) optionsEl.innerHTML = '<p class="error-message">Не вдалося завантажити квіз.</p>';
  }
}

function renderStep() {
  const currentStepKey = stepHistory[stepHistory.length - 1];
  const step = quizData[currentStepKey];

  if (!step) {
    if(questionTitleEl) questionTitleEl.textContent = "Готуємо товари для вибору...";
    if(optionsEl) optionsEl.innerHTML = '<div class="loader"></div>';
    if(nextBtn) nextBtn.style.display = 'none';
    if(backBtn) backBtn.style.display = 'none';

    const allAnswers = Object.values(userAnswers).flat();
    let uniqueCategoryIds = [];

    allAnswers.forEach(answerLabel => {
      const categoryMapping = labelToCategories[answerLabel];
      if (Array.isArray(categoryMapping)) {
        uniqueCategoryIds.push(...categoryMapping);
      } else if (categoryMapping) {
        uniqueCategoryIds.push(categoryMapping);
      }
    });

    uniqueCategoryIds = [...new Set(uniqueCategoryIds)];

    const params = new URLSearchParams();
    uniqueCategoryIds.forEach(id => params.append('a', id));

    if (userAnswers['step1_1']) {
        sessionStorage.setItem('gender', userAnswers['step1_1'][0]);
    } else {
        sessionStorage.removeItem('gender');
    }

    setTimeout(() => {
      window.location.href = `swipe.html?${params.toString()}`;
    }, 1500);
    return;
  }

  if(questionTitleEl) questionTitleEl.textContent = step.question;
  if(optionsEl) {
    optionsEl.innerHTML = "";
    optionsEl.className = step.multiple ? 'options multiple-choice' : 'options single-choice';
  }

  step.options.forEach(opt => {
    const isSelected = (userAnswers[currentStepKey] || []).includes(opt.label);
    const card = createOptionCard(opt, step.multiple, isSelected);
    if(optionsEl) optionsEl.appendChild(card);
  });

  updateNavigation(step);
  updateProgressBar();
}

function createOptionCard(option, isMultiple, isSelected) {
  const card = document.createElement("button");
  card.className = 'option-card';
  if (isSelected) card.classList.add('selected');

  const emoji = optionEmojis[option.label] || '❓';

  card.innerHTML = `
    <div class="option-emoji">${emoji}</div>
    <span class="option-label">${option.label}</span>
    <div class="radio-check">${isMultiple ? '✔️' : ''}</div>
  `;
  card.onclick = () => handleOptionClick(card, option, isMultiple);
  return card;
}

function handleOptionClick(cardElement, option, isMultiple) {
  const currentStepKey = stepHistory[stepHistory.length - 1];

  if (isMultiple) {
    cardElement.classList.toggle('selected');
    const currentSelections = userAnswers[currentStepKey] || [];
    if (cardElement.classList.contains('selected')) {
      userAnswers[currentStepKey] = [...currentSelections, option.label];
    } else {
      userAnswers[currentStepKey] = currentSelections.filter(ans => ans !== option.label);
    }
    updateNavigation(quizData[currentStepKey]);
  } else {
    userAnswers[currentStepKey] = [option.label];
    stepHistory.push(option.next || null);
    renderStep();
  }
}

function updateNavigation(step) {
  if(backBtn) backBtn.style.display = stepHistory.length > 1 ? 'flex' : 'none';

  if (step.multiple) {
    const hasSelection = (userAnswers[stepHistory[stepHistory.length - 1]] || []).length > 0;
    if(nextBtn) {
        nextBtn.style.display = 'flex';
        nextBtn.disabled = !hasSelection;
    }
  } else {
    if(nextBtn) nextBtn.style.display = 'none';
  }
}

function updateProgressBar() {
    const progress = (stepHistory.length / totalSteps) * 100;
    if(progressBar) progressBar.style.width = `${Math.min(progress, 100)}%`;
}

if(nextBtn) {
    nextBtn.onclick = () => {
      const currentStepKey = stepHistory[stepHistory.length - 1];
      const step = quizData[currentStepKey];
      stepHistory.push(step.next || null);
      renderStep();
    };
}

if(backBtn) {
    backBtn.onclick = () => {
      if (stepHistory.length > 1) {
        const lastStepKey = stepHistory.pop();
        delete userAnswers[lastStepKey];
        const prevStepKey = stepHistory[stepHistory.length-1];
        delete userAnswers[prevStepKey];
        renderStep();
      }
    };
}

// --- Initial Load ---
initializeQuiz();