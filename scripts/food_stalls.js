import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
    getFirestore,
    collection,
    getDocs,
    getDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import {
    resolveHawkerCenterImage,
    resolveStallImage,
    setImageBackground,
    setImageSrc
} from "./image-paths.js";

/* =========================
   Firebase config
========================= */
const firebaseConfig = {
    apiKey: "AIzaSyDac46txTyLdtBlJ4gvcvl2yxTlduC_FUE",
    authDomain: "hawkers-native.firebaseapp.com",
    projectId: "hawkers-native",
    storageBucket: "hawkers-native.firebasestorage.app",
    messagingSenderId: "25256491882",
    appId: "1:25256491882:web:99a54c487373e155278313"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const MENU_ITEMS_API = "http://localhost:3000/menu-items/public";

const params = new URLSearchParams(window.location.search);
const hawkerCenterId = params.get('centerId');
const mockCuisineMode = params.get('mockCuisines') === 'true';

// Mock data is only used for the Live Server preview.
// The normal page still reads Firestore stalls and SQL cuisine tags.
const MOCK_HAWKER_CENTRE = {
    name: 'Maxwell Food Centre',
    description: 'A popular Singapore hawker centre with local favourites and heritage stalls.',
    imagePath: 'user_pages/hawker.jpg'
};

const MOCK_MERCHANTS = [
    {
        id: '01-01',
        name: "Ben's Chicken Rice",
        imagePath: 'food_stall/maxwell _food_center/chicken rice stall.jpg',
        cuisines: ['Chinese', 'Hainanese', 'Singaporean']
    },
    {
        id: '01-02',
        name: 'Zhen Zhen Porridge',
        imagePath: 'food_stall/maxwell _food_center/zhen_zhen_porridge.jpg',
        cuisines: ['Chinese', 'Porridge', 'Singaporean']
    },
    {
        id: '01-03',
        name: 'Maxwell Fuzhou Oyster Cake',
        imagePath: 'food_stall/maxwell _food_center/maxwell_fuzhou_oyster_cake.jpg',
        cuisines: ['Chinese', 'Fuzhou', 'Snacks']
    },
    {
        id: '01-04',
        name: 'Taste Fusion Hainanese Chicken Chop',
        imagePath: 'food_stall/maxwell _food_center/taste_fusion_hiananese_chicken_chop.jpg',
        cuisines: ['Hainanese', 'Singaporean', 'Western']
    }
];

let selectedCuisine = "all";
let merchantCards = [];

/* =========================
   CREATE A MERCHANT CARD
========================= */
function createItem(id, name, img, cuisineNames) {
    const item = document.createElement('div');
    item.classList.add('item');
    item.dataset.searchText = `${name} ${cuisineNames.join(" ")}`.toLowerCase();
    item.dataset.cuisines = cuisineNames.join("|");

    const imagePath = resolveStallImage(hawkerCenterId, name, img);
    setImageBackground(item, imagePath, "user_pages/hawker.jpg");

    const foodStallId = document.createElement('p');
    foodStallId.classList.add('highlight');
    foodStallId.textContent = `#${id}`;

    const foodStallName = document.createElement('p');
    foodStallName.textContent = name;

    const cuisineTags = document.createElement('div');
    cuisineTags.className = 'merchant-cuisine-tags';

    if (cuisineNames.length === 0) {
        const pending = document.createElement('span');
        pending.className = 'merchant-cuisine-pending';
        pending.textContent = 'Cuisine data pending';
        cuisineTags.appendChild(pending);
    } else {
        cuisineNames.forEach(cuisineName => {
            const tag = document.createElement('span');
            tag.className = 'merchant-cuisine-tag';
            tag.textContent = cuisineName;
            cuisineTags.appendChild(tag);
        });
    }

    item.appendChild(foodStallId);
    item.appendChild(foodStallName);
    item.appendChild(cuisineTags);

    item.addEventListener('click', () => {
        window.location.href = `order.html?centerId=${hawkerCenterId}&stallId=${id}`;
    });

    return item;
}

/* =========================
   LOAD SQL CUISINE TAGS
========================= */
async function loadCuisineMap() {
    const cuisineMap = new Map();

    // Mock mode keeps Live Server previews independent from MSSQL.
    if (mockCuisineMode) {
        for (let i = 0; i < MOCK_MERCHANTS.length; i += 1) {
            cuisineMap.set(
                MOCK_MERCHANTS[i].id,
                MOCK_MERCHANTS[i].cuisines
            );
        }
        return cuisineMap;
    }

    try {
        const response = await fetch(
            `${MENU_ITEMS_API}?centreId=${encodeURIComponent(hawkerCenterId)}`
        );
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Unable to load cuisine filters');
        }

        data.menuItems.forEach(menuItem => {
            if (!menuItem.customerStallId) return;

            if (!cuisineMap.has(menuItem.customerStallId)) {
                cuisineMap.set(menuItem.customerStallId, []);
            }

            menuItem.cuisines.forEach(cuisineName => {
                const stallCuisines = cuisineMap.get(menuItem.customerStallId);
                if (!stallCuisines.includes(cuisineName)) {
                    stallCuisines.push(cuisineName);
                }
            });
        });

        return cuisineMap;
    } catch (error) {
        console.error('Cuisine filter error:', error);
        const message = document.getElementById('cuisine-filter-message');
        message.textContent = 'Cuisine filters are temporarily unavailable.';
        message.classList.add('error');
        return cuisineMap;
    }
}

function renderCuisineFilters(cuisineMap) {
    const filterContainer = document.getElementById('cuisine-filters');
    const message = document.getElementById('cuisine-filter-message');
    const cuisineNames = [];

    cuisineMap.forEach(stallCuisines => {
        stallCuisines.forEach(cuisineName => {
            if (!cuisineNames.includes(cuisineName)) {
                cuisineNames.push(cuisineName);
            }
        });
    });

    cuisineNames.sort();
    filterContainer.innerHTML = '';

    if (cuisineNames.length === 0) {
        if (!message.classList.contains('error')) {
            message.textContent =
                'Cuisine filters will appear when SQL menu items are available.';
        }
        return;
    }

    const allCuisines = ['all', ...cuisineNames];
    allCuisines.forEach(cuisineName => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'cuisine-filter-button';
        button.dataset.cuisine = cuisineName;
        button.textContent = cuisineName === 'all' ? 'All cuisines' : cuisineName;

        if (cuisineName === selectedCuisine) {
            button.classList.add('active');
        }

        button.addEventListener('click', () => {
            selectedCuisine = cuisineName;

            document.querySelectorAll('.cuisine-filter-button').forEach(filterButton => {
                filterButton.classList.toggle(
                    'active',
                    filterButton.dataset.cuisine === selectedCuisine
                );
            });

            applyMerchantFilters();
        });

        filterContainer.appendChild(button);
    });

    message.classList.remove('error');
    message.textContent = 'Filter merchants using cuisines set by their vendors.';
}

function applyMerchantFilters() {
    const searchValue = document.getElementById('search').value.toLowerCase().trim();
    let visibleCount = 0;

    merchantCards.forEach(card => {
        const cuisineNames = card.dataset.cuisines
            ? card.dataset.cuisines.split('|')
            : [];
        const matchesSearch = card.dataset.searchText.includes(searchValue);
        const matchesCuisine =
            selectedCuisine === 'all' || cuisineNames.includes(selectedCuisine);
        const isVisible = matchesSearch && matchesCuisine;

        card.style.display = isVisible ? '' : 'none';
        if (isVisible) visibleCount += 1;
    });

    let emptyMessage = document.getElementById('no-filter-results');

    if (visibleCount === 0 && merchantCards.length > 0) {
        if (!emptyMessage) {
            emptyMessage = document.createElement('div');
            emptyMessage.id = 'no-filter-results';
            emptyMessage.className = 'no-filter-results';
            emptyMessage.textContent = 'No merchants match this cuisine and search.';
            document.querySelector('.container').appendChild(emptyMessage);
        }
    } else if (emptyMessage) {
        emptyMessage.remove();
    }
}

/* =========================
   LOAD MERCHANT CARDS
========================= */
async function loadCards() {
    const container = document.querySelector('.container');

    if (mockCuisineMode) {
        const cuisineMap = await loadCuisineMap();

        for (let i = 0; i < MOCK_MERCHANTS.length; i += 1) {
            const merchant = MOCK_MERCHANTS[i];
            const item = createItem(
                merchant.id,
                merchant.name,
                merchant.imagePath,
                merchant.cuisines
            );
            merchantCards.push(item);
            container.appendChild(item);
        }

        renderCuisineFilters(cuisineMap);
        applyMerchantFilters();
        return;
    }

    const [snapshot, cuisineMap] = await Promise.all([
        getDocs(collection(db, `hawker-centers/${hawkerCenterId}/food-stalls`)),
        loadCuisineMap()
    ]);

    snapshot.forEach(documentSnapshot => {
        const data = documentSnapshot.data();
        const item = createItem(
            documentSnapshot.id,
            data.name,
            data.imagePath,
            cuisineMap.get(documentSnapshot.id) || []
        );
        merchantCards.push(item);
        container.appendChild(item);
    });

    renderCuisineFilters(cuisineMap);
    applyMerchantFilters();
}

/* =========================
   LOAD HAWKER CENTRE
========================= */
async function loadHawkerCenter() {
    const hawkerCenterTitle = document.querySelector("#hawker-center-description h2");
    const hawkerCenterDescription = document.querySelector("#hawker-center-description p");
    const hawkerCenterImage = document.querySelector("#hawker-center-info img");

    if (mockCuisineMode) {
        hawkerCenterTitle.textContent = MOCK_HAWKER_CENTRE.name;
        hawkerCenterDescription.textContent = MOCK_HAWKER_CENTRE.description;
        setImageSrc(
            hawkerCenterImage,
            MOCK_HAWKER_CENTRE.imagePath,
            "user_pages/hawker.jpg"
        );
        return;
    }

    const docRef = doc(db, "hawker-centers", hawkerCenterId);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
        const data = snapshot.data();
        hawkerCenterTitle.textContent = data.name;
        hawkerCenterDescription.textContent = data.description;
        setImageSrc(
            hawkerCenterImage,
            resolveHawkerCenterImage(hawkerCenterId, data.name, data.imagePath),
            "user_pages/hawker.jpg"
        );
    } else {
        console.log("Hawker center does not exist");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadHawkerCenter();
    loadCards();

    const searchBar = document.getElementById('search');
    searchBar.addEventListener('input', applyMerchantFilters);
});
