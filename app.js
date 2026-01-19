import { mockUsers } from './data.js';
import { loadState, spendGems, getGemBalance } from './state.js';

class App {
    constructor() {
        this.users = [...mockUsers];
        this.currentIndex = 0;
        this.cardStack = document.getElementById('card-stack');
        this.gemCountEl = document.getElementById('gem-count');
        this.notificationEl = document.getElementById('notification');

        this.startX = 0;
        this.currentCard = null;
        this.isDragging = false;

        this.init();
    }

    init() {
        this.updateGemDisplay();
        this.renderCards();
        this.setupControls();
    }

    updateGemDisplay() {
        this.gemCountEl.textContent = getGemBalance();
    }

    renderCards() {
        // Clear existing
        this.cardStack.innerHTML = '';
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state hidden';
        emptyState.innerHTML = `<h2>No more profiles!</h2><p>Check back later.</p>`;
        this.cardStack.appendChild(emptyState);

        // Render remaining cards
        // We only render the current and next few cards for performance
        const visibleUsers = this.users.slice(this.currentIndex, this.currentIndex + 3).reverse();

        if (visibleUsers.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }

        visibleUsers.forEach((user, index) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.style.backgroundImage = `url(${user.image})`;

            // Generate Badges
            let badges = '';
            if (user.socials.snapchat) badges += `<span class="platform-badge" style="color:yellow">👻 Snap</span>`;
            if (user.socials.instagram) badges += `<span class="platform-badge" style="color:pink">📸 Insta</span>`;

            card.innerHTML = `
                <div class="card-overlay">
                    <h2 class="card-name">${user.name}, <span class="card-age">${user.age}</span></h2>
                    <div class="social-platforms">${badges}</div>
                    <p class="card-bio">${user.bio}</p>
                </div>
            `;

            this.cardStack.appendChild(card);
        });

        // Re-bind events to top card
        this.bindCardEvents();
    }

    bindCardEvents() {
        const cards = document.querySelectorAll('.card');
        if (cards.length === 0) return;

        this.currentCard = cards[cards.length - 1]; // Last added is visually on top

        // Touch Events
        this.currentCard.addEventListener('touchstart', (e) => this.inputStart(e.touches[0].clientX));
        this.currentCard.addEventListener('touchmove', (e) => this.inputMove(e.touches[0].clientX));
        this.currentCard.addEventListener('touchend', () => this.inputEnd());

        // Mouse Events
        this.currentCard.addEventListener('mousedown', (e) => this.inputStart(e.clientX));
        document.addEventListener('mousemove', (e) => this.inputMove(e.clientX));
        document.addEventListener('mouseup', () => this.inputEnd());
    }

    inputStart(x) {
        if (!this.currentCard) return;
        this.startX = x;
        this.isDragging = true;
        this.currentCard.style.transition = 'none';
    }

    inputMove(x) {
        if (!this.isDragging || !this.currentCard) return;
        const currentX = x;
        const diff = currentX - this.startX;
        const rotate = diff * 0.1;

        this.currentCard.style.transform = `translateX(${diff}px) rotate(${rotate}deg)`;

        // Simple opacity fade based on distance
        const opacity = Math.min(Math.abs(diff) / 300, 1);
        // Could imply Overlay color change here
    }

    inputEnd() {
        if (!this.isDragging || !this.currentCard) return;
        this.isDragging = false;

        const currentTransform = this.currentCard.style.transform;
        const match = currentTransform.match(/translateX\(([-0-9.]+)px\)/);
        const diff = match ? parseFloat(match[1]) : 0;
        const threshold = 100;

        if (diff > threshold) {
            this.attemptRequest();
        } else if (diff < -threshold) {
            this.passCard();
        } else {
            // Reset
            this.currentCard.style.transition = 'transform 0.3s ease';
            this.currentCard.style.transform = 'translateX(0) rotate(0)';
        }
    }

    passCard() {
        this.currentCard.classList.add('swipe-left');
        this.processSwipe();
    }

    attemptRequest() {
        if (spendGems(10)) {
            this.currentCard.classList.add('swipe-right');
            this.showNotification();
            this.updateGemDisplay();
            this.processSwipe();
        } else {
            alert("Not enough gems! 💎");
            // Reset card
            this.currentCard.style.transition = 'transform 0.3s ease';
            this.currentCard.style.transform = 'translateX(0) rotate(0)';
        }
    }

    processSwipe() {
        setTimeout(() => {
            this.currentIndex++;
            this.renderCards();
        }, 300);
    }

    setupControls() {
        document.getElementById('btn-pass').addEventListener('click', () => {
            if (this.currentCard) this.passCard();
        });
        document.getElementById('btn-request').addEventListener('click', () => {
            if (this.currentCard) this.attemptRequest();
        });
    }

    showNotification() {
        this.notificationEl.classList.remove('hidden');
        setTimeout(() => {
            this.notificationEl.classList.add('hidden');
        }, 2000);
    }
}

// Start App
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
