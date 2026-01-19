
// File: js/data.js
const mockUsers = [
    {
        id: 1,
        name: "Sarah",
        age: 23,
        bio: "Adventure seeker. Loves hiking and coffee. ☕️🏔️",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
        socials: { snapchat: true, instagram: true }
    },
    {
        id: 2,
        name: "Jessica",
        age: 21,
        bio: "Art student 🎨. Living life one color at a time.",
        image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
        socials: { instagram: true }
    },
    {
        id: 3,
        name: "Emily",
        age: 24,
        bio: "Digital Nomad. Currently in Bali. Let's swap travel stories!",
        image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
        socials: { snapchat: true }
    },
    {
        id: 4,
        name: "Chloe",
        age: 22,
        bio: "Music is my life. 🎧 What's on your playlist?",
        image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80",
        socials: { instagram: true, tiktok: true }
    },
    {
        id: 5,
        name: "Anna",
        age: 20,
        bio: "Just looking for someone to play Mario Kart with.",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
        socials: { snapchat: true, instagram: true }
    }
];

// File: js/state.js
const STORAGE_KEY = 'hoop_clone_state';

const defaultState = {
    gems: 100, // Initial bonus
    requestedUsers: [], // IDs of users we requested
    seenUsers: [], // IDs of users we swiped specifically
};

function loadState() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    return defaultState;
}

function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function spendGems(amount, user = null) {
    const state = loadState();
    if (state.gems >= amount) {
        state.gems -= amount;
        if (user) {
            state.requestedUsers.push(user);
        }
        saveState(state);
        return true;
    }
    return false;
}

function addGems(amount) {
    const state = loadState();
    state.gems += amount;
    saveState(state);
    return state.gems;
}

function getGemBalance() {
    return loadState().gems;
}

function getRequestedUsers() {
    return loadState().requestedUsers;
}

// File: js/app.js
class App {
    constructor() {
        this.users = [...mockUsers];
        this.currentIndex = 0;
        this.cardStack = document.getElementById('card-stack');
        this.gemCountEl = document.getElementById('gem-count');
        this.notificationEl = document.getElementById('notification');
        this.adOverlay = document.getElementById('ad-overlay');

        this.startX = 0;
        this.currentCard = null;
        this.isDragging = false;

        this.init();
    }

    init() {
        this.updateGemDisplay();
        this.renderCards();
        this.setupControls();
        this.setupNavigation();
        this.setupShop();
    }

    updateGemDisplay() {
        // Update top bar
        const balance = getGemBalance();
        this.gemCountEl.textContent = balance;

        // Update profile stat
        const profileCount = document.getElementById('profile-gem-count');
        if (profileCount) profileCount.textContent = balance;
    }

    /* --- Navigation Logic --- */
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all
                navItems.forEach(n => n.classList.remove('active'));
                btn.classList.add('active');

                // Switch View
                const target = btn.dataset.target; // discovery, shop, profile
                this.switchView(target);
            });
        });
    }

    switchView(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));

        // Show target
        const targetEl = document.getElementById(`view-${viewName}`);
        if (targetEl) {
            targetEl.classList.remove('hidden');
            // Small delay to allow display:block to apply before opacity transition
            setTimeout(() => targetEl.classList.add('active'), 10);

            if (viewName === 'profile') {
                this.renderProfile();
            }
        }
    }

    /* --- Shop Logic --- */
    setupShop() {
        // Watch Ad
        document.getElementById('btn-watch-ad').addEventListener('click', () => {
            this.watchAd();
        });

        // Buy Packs
        document.querySelectorAll('.shop-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = parseInt(btn.dataset.gems);
                addGems(amount);
                this.updateGemDisplay();
                this.showNotification(`Purchased ${amount} Gems!`, '💎');
            });
        });
    }

    watchAd() {
        this.adOverlay.classList.remove('hidden');

        // Simulate 3s Ad
        setTimeout(() => {
            this.adOverlay.classList.add('hidden');
            addGems(50);
            this.updateGemDisplay();
            this.showNotification('You earned 50 Gems!', '🎉');
        }, 3000);
    }

    /* --- Profile Logic --- */
    renderProfile() {
        const list = document.getElementById('requests-list');
        const requests = getRequestedUsers();

        if (requests.length === 0) {
            list.innerHTML = '<div class="empty-list" style="text-align:center; opacity:0.5; margin-top:20px;">No requests yet.</div>';
            return;
        }

        list.innerHTML = requests.map(user => `
            <div class="request-item">
                <img src="${user.image}" class="req-avatar" />
                <div class="req-info">
                    <h4>${user.name}</h4>
                    <span style="font-size:0.8rem; opacity:0.7">Requested via Hoop</span>
                </div>
                <div class="req-status">Sent</div>
            </div>
        `).join('');
    }

    /* --- Card Logic --- */
    renderCards() {
        // Clear existing
        this.cardStack.innerHTML = '';
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state hidden';
        emptyState.innerHTML = `<h2>No more profiles!</h2><p>Check back later.</p>`;
        this.cardStack.appendChild(emptyState);

        // Render remaining cards
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

            // Store data on element for easy access
            card.dataset.userId = JSON.stringify(user);

            this.cardStack.appendChild(card);
        });

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
        const opacity = Math.min(Math.abs(diff) / 300, 1);
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
            this.currentCard.style.transition = 'transform 0.3s ease';
            this.currentCard.style.transform = 'translateX(0) rotate(0)';
        }
    }

    passCard() {
        this.currentCard.classList.add('swipe-left');
        this.processSwipe();
    }

    attemptRequest() {
        // Get user data from card
        let user = null;
        try {
            user = JSON.parse(this.currentCard.dataset.userId);
        } catch (e) { }

        if (spendGems(10, user)) {
            this.currentCard.classList.add('swipe-right');
            this.showNotification('Request Sent!', '👻');
            this.updateGemDisplay();
            this.processSwipe();
        } else {
            this.showNotification('Not enough gems!', '💎');
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
        const btnPass = document.getElementById('btn-pass');
        if (btnPass) {
            btnPass.addEventListener('click', () => {
                if (this.currentCard) this.passCard();
            });
        }

        const btnRequest = document.getElementById('btn-request');
        if (btnRequest) {
            btnRequest.addEventListener('click', () => {
                if (this.currentCard) this.attemptRequest();
            });
        }
    }

    showNotification(title, icon = '👻') {
        const notif = this.notificationEl;
        notif.querySelector('h4').textContent = title;
        notif.querySelector('.icon').textContent = icon;

        notif.classList.remove('hidden');
        setTimeout(() => {
            notif.classList.add('hidden');
        }, 2000);
    }
}

// Start App
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
