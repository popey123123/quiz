// --- DOM Elements ---
const container = document.getElementById('swipe-container');
const likeBtn = document.getElementById('like-btn');
const skipBtn = document.getElementById('skip-btn');
const undoBtn = document.getElementById('undo-btn');
const finishBtn = document.getElementById('finish-btn');
const restartBtn = document.getElementById('restart-btn');
const actionsContainer = document.getElementById('swipe-actions');
const finishScreen = document.getElementById('finish-screen');

// --- State ---
let products = [];
let likedProducts = [];
let history = []; // To store swipe actions for undo
let currentIndex = 0;
let isDragging = false;
let startX = 0;
let currentX = 0;

// --- Mapping ---
// No longer needed here as labelToCategories is handled in script.js and IDs are passed via URL params

// --- Helper Functions ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getCleanProductName(name) {
    const half = Math.floor(name.length / 2);
    if (name.length > 10 && name.substring(0, half).trim() === name.substring(half).trim()) {
        return name.substring(0, half).trim();
    }
    return name;
}

// --- Core Logic ---
async function loadProducts() {
    const params = new URLSearchParams(window.location.search);
    const categoryIds = params.getAll('a'); // This will now correctly get all 'a' parameters (which are category IDs)

    if (!container) {
        console.error("Fatal Error: Swipe container not found in HTML.");
        return;
    }

    if (categoryIds.length === 0) {
        container.innerHTML = '<p class="error-message">Не вдалося знайти категорії. Спробуйте пройти квіз ще раз.</p>';
        return;
    }

    const randomSortDirection = Math.random() < 0.5 ? 'asc' : 'desc';

    try {
        const res = await fetch('https://quiz.loveplay.in.ua/api/products', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({productsId: categoryIds, sortDirection: randomSortDirection})
        });
        if (!res.ok) throw new Error('API Error');
        
        const data = await res.json();
        const allItems = data.flatMap(cat => cat.items || []);
        
        if (allItems.length === 0) {
             container.innerHTML = '<p class="error-message">На жаль, за вашим запитом товари не знайдені.</p>';
             if(actionsContainer) actionsContainer.style.display = 'none';
             if(finishScreen) finishScreen.style.display = 'flex';
             if(finishBtn) finishBtn.style.display = 'none';
             return;
        }

        products = shuffleArray(allItems).slice(0, 20); // Limit to 20 products for performance
        renderNextCard();
    } catch (error) {
        console.error("Failed to load products:", error);
        container.innerHTML = '<p class="error-message">Не вдалося завантажити товари.</p>';
    }
}

function renderNextCard() {
    if (currentIndex >= products.length) {
        showFinishScreen();
        return;
    }
    const product = products[currentIndex];
    const cleanName = getCleanProductName(product.name);

    // ПОПРАВКА: Перевірка, чи product.picture є масивом, як запропонував ваш друг
    let imageUrl = './placeholder.jpg'; // Заглушка за замовчуванням
    if (product.picture) {
        if (Array.isArray(product.picture) && product.picture.length > 0 && typeof product.picture[0] === 'string' && product.picture[0].startsWith('http')) {
            imageUrl = product.picture[0];
        } else if (typeof product.picture === 'string' && product.picture.startsWith('http')) {
            imageUrl = product.picture;
        }
    }

    const cardHTML = `
        <div class="swipe-card">
            <div class="swipe-card-image-wrapper">
                <img src="${imageUrl}" alt="${cleanName}" loading="lazy">
            </div>
            <div class="swipe-card-info">
                <h3>${cleanName}</h3>
                <p class="price">${product.price} грн</p>
            </div>
        </div>
    `;
    if(container) container.innerHTML = cardHTML;
    addDragListeners();
}

function showFinishScreen() {
    if(container) container.innerHTML = `<div class="swipe-card finished"><p>Ви переглянули всі товари!</p></div>`;
    if(actionsContainer) actionsContainer.style.display = 'none';
    if(finishScreen) finishScreen.style.display = 'flex';
}

function handleSwipe(isLike) {
    const card = container.querySelector('.swipe-card');
    if (!card) return;

    history.push({ product: products[currentIndex], liked: isLike });
    if(undoBtn) undoBtn.style.display = 'flex';

    const swipeClass = isLike ? 'swipe-out-right' : 'swipe-out-left';
    card.classList.add(swipeClass);

    if (isLike) {
        likedProducts.push(products[currentIndex]);
    }

    currentIndex++;
    setTimeout(renderNextCard, 300);
}

function undoSwipe() {
    if (history.length === 0) return;

    const lastAction = history.pop();
    currentIndex--;

    if (lastAction.liked) {
        likedProducts.pop();
    }
    
    if (history.length === 0 && undoBtn) {
        undoBtn.style.display = 'none';
    }

    if(actionsContainer) actionsContainer.style.display = 'flex';
    if(finishScreen) finishScreen.style.display = 'none';

    renderNextCard();
}

function finishSelection() {
    sessionStorage.setItem('likedProducts', JSON.stringify(likedProducts));
    window.location.href = 'results.html';
}

function restartQuiz() {
    sessionStorage.removeItem('likedProducts');
    sessionStorage.removeItem('gender');
    window.location.href = 'index.html';
}

// --- Drag Logic ---
function addDragListeners() {
    const card = container.querySelector('.swipe-card');
    if (!card) return;
    card.addEventListener('mousedown', startDrag);
    card.addEventListener('touchstart', startDrag, { passive: true });
    
    window.addEventListener('mousemove', drag);
    window.addEventListener('touchmove', drag, { passive: true });

    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchend', endDrag);
}

function startDrag(e) {
    isDragging = true;
    startX = e.pageX || e.touches[0].pageX;
    if(container) container.classList.add('grabbing');
}

function drag(e) {
    if (!isDragging) return;
    const card = container.querySelector('.swipe-card');
    if (!card) return;

    currentX = e.pageX || e.touches[0].pageX;
    const deltaX = currentX - startX;
    const rotation = deltaX / 20;

    card.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;
    card.style.transition = 'none';
}

function endDrag() {
    if (!isDragging) return;
    isDragging = false;
    if(container) container.classList.remove('grabbing');
    
    const card = container.querySelector('.swipe-card');
    if (!card) return;

    card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    const deltaX = currentX - startX;
    const decisionThreshold = 100;

    if (Math.abs(deltaX) > decisionThreshold) {
        handleSwipe(deltaX > 0);
    } else {
        card.style.transform = 'translateX(0) rotate(0)';
    }
    
    startX = 0;
    currentX = 0;
}

// --- Event Listeners ---
if(likeBtn) likeBtn.onclick = () => handleSwipe(true);
if(skipBtn) skipBtn.onclick = () => handleSwipe(false);
if(undoBtn) undoBtn.onclick = undoSwipe;
if(finishBtn) finishBtn.onclick = finishSelection;
if(restartBtn) restartBtn.onclick = restartQuiz;

// --- Initial Load ---
loadProducts();