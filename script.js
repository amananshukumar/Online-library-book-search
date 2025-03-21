
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const googleBooksResults = document.getElementById("googleBooksResults");
const googleBooksPagination = document.getElementById("googleBooksPagination");
const openLibraryResults = document.getElementById("openLibraryResults");
const openLibraryPagination = document.getElementById("openLibraryPagination");
const loadingPlaceholder = document.getElementById("loadingPlaceholder");

const RESULTS_PER_PAGE = 10;


function showLoading() {
    googleBooksResults.innerHTML = "";
    openLibraryResults.innerHTML = "";
    googleBooksPagination.innerHTML = "";
    openLibraryPagination.innerHTML = "";
    loadingPlaceholder.style.display = "flex";
}

function hideLoading() {
    loadingPlaceholder.style.display = "none";
}


function displayNoResults(container, message) {
    container.innerHTML = `<p class="no-results">${message}</p>`;
}


async function fetchGoogleBooks(query, startIndex) {
    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${query}&startIndex=${startIndex}&maxResults=${RESULTS_PER_PAGE}`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.totalItems === 0) {
            displayNoResults(googleBooksResults, "No books found on Google Books.");
            return;
        }

        renderGoogleBooksResults(data.items);
        renderPagination(googleBooksPagination, data.totalItems, startIndex, fetchGoogleBooks, query);
    } catch (error) {
        console.error("Error fetching Google Books:", error);
    }
}


async function fetchOpenLibrary(query, page) {
    const apiUrl = `https://openlibrary.org/search.json?q=${query}&page=${page}`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.docs.length === 0) {
            displayNoResults(openLibraryResults, "No books found on Open Library.");
            return;
        }

        renderOpenLibraryResults(data.docs);
        renderPagination(openLibraryPagination, data.numFound, (page - 1) * RESULTS_PER_PAGE, fetchOpenLibrary, query);
    } catch (error) {
        console.error("Error fetching Open Library:", error);
    }
}


function renderGoogleBooksResults(books) {
    googleBooksResults.innerHTML = books
        .map(
            (book) => `
            <div class="result-card">
                <img src="${book.volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x200'}" alt="${book.volumeInfo.title}" />
                <h3>${book.volumeInfo.title}</h3>
                <p>${book.volumeInfo.authors?.join(", ") || "Unknown Author"}</p>
                <a href="${book.volumeInfo.previewLink}" target="_blank">Read More</a>
            </div>`
        )
        .join("");
}

function renderOpenLibraryResults(books) {
    openLibraryResults.innerHTML = books
        .map(
            (book) => `
            <div class="result-card">
                <img src="https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg" alt="${book.title}" onerror="this.src='https://via.placeholder.com/128x200';" />
                <h3>${book.title}</h3>
                <p>${book.author_name?.join(", ") || "Unknown Author"}</p>
                <a href="https://openlibrary.org${book.key}" target="_blank">Read More</a>
            </div>`
        )
        .join("");
}


function renderPagination(container, totalItems, currentIndex, fetchFunction, query) {
    container.innerHTML = "";

    const totalPages = Math.ceil(totalItems / RESULTS_PER_PAGE);
    const currentPage = Math.floor(currentIndex / RESULTS_PER_PAGE) + 1;

  
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (currentPage > 1) {
        const prevButton = document.createElement("button");
        prevButton.textContent = "« Prev";
        prevButton.className = "pagination-button";
        prevButton.onclick = () => {
            showLoading();
            fetchFunction(query, (currentPage - 2) * RESULTS_PER_PAGE);
        };
        container.appendChild(prevButton);
    }

    for (let i = startPage; i <= endPage; i++) {
        const button = document.createElement("button");
        button.textContent = i;
        button.className = i === currentPage ? "pagination-button active" : "pagination-button";
        button.onclick = () => {
            showLoading();
            fetchFunction(query, (i - 1) * RESULTS_PER_PAGE);
        };
        container.appendChild(button);
    }

    if (currentPage < totalPages) {
        const nextButton = document.createElement("button");
        nextButton.textContent = "Next »";
        nextButton.className = "pagination-button";
        nextButton.onclick = () => {
            showLoading();
            fetchFunction(query, currentPage * RESULTS_PER_PAGE);
        };
        container.appendChild(nextButton);
    }
}

async function performSearch() {
    const query = searchInput.value.trim();

    if (!query) {
        alert("Please enter a search term.");
        return;
    }

    showLoading();

    await Promise.all([fetchGoogleBooks(query, 0), fetchOpenLibrary(query, 1)]);

    hideLoading();
}

searchButton.addEventListener("click", performSearch);

searchInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
        performSearch();
    }
});
