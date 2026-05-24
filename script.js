const API_KEY = '1ffd7b3687d86736a4388cff1233050b';
const BASE_URL = 'https://api.themoviedb.org/3';

const heading = document.getElementById('pageTitle');

let selectedMovieId = null;
let selectedMediaType = null;

// =========================
// DARK / LIGHT MODE
// =========================

document.addEventListener("DOMContentLoaded", function () {

    const modeToggle =
        document.getElementById("modeToggle");

    const body = document.body;

    const isDarkMode =
        localStorage.getItem("dark-mode") === "true";

    if (isDarkMode) {

        body.classList.add("dark-mode");

        modeToggle.textContent =
            "Switch to Light Mode";

    } else {

        body.classList.add("light-mode");

        modeToggle.textContent =
            "Switch to Dark Mode";
    }

    modeToggle.addEventListener("click", function () {

        if (body.classList.contains("dark-mode")) {

            body.classList.remove("dark-mode");

            body.classList.add("light-mode");

            modeToggle.textContent =
                "Switch to Dark Mode";

            localStorage.setItem(
                "dark-mode",
                "false"
            );

        } else {

            body.classList.remove("light-mode");

            body.classList.add("dark-mode");

            modeToggle.textContent =
                "Switch to Light Mode";

            localStorage.setItem(
                "dark-mode",
                "true"
            );
        }
    });
});

// =========================
// FETCH SUGGESTIONS
// =========================

async function fetchMovieSuggestions() {

    const movieTitle =
        document.getElementById('movieInput').value;

    const suggestionsDiv =
        document.getElementById('suggestions');

    suggestionsDiv.style.width = '100%';

    if (movieTitle.length < 3) {

        suggestionsDiv.innerHTML = '';

        document.getElementById(
            'searchButton'
        ).disabled = true;

        return;
    }

    const searchUrl =
        `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(movieTitle)}`;

    const searchResponse =
        await fetch(searchUrl);

    const searchData =
        await searchResponse.json();

    const filteredResults =
        searchData.results.filter(

            item =>

                item.media_type === 'movie' ||

                item.media_type === 'tv'
        );

    if (filteredResults.length === 0) {

        suggestionsDiv.innerHTML =
            '<div class="suggestion-item">No results found</div>';

        return;
    }

    suggestionsDiv.innerHTML = '';

    filteredResults.slice(0, 5).forEach(item => {

        const suggestionItem =
            document.createElement('div');

        suggestionItem.classList.add(
            'suggestion-item'
        );

        const title =
            item.title || item.name;

        const year =
            item.release_date
                ? item.release_date.split('-')[0]
                : item.first_air_date
                ? item.first_air_date.split('-')[0]
                : 'N/A';

        const typeLabel =
            item.media_type === 'movie'
                ? '🎬'
                : '📺';

        suggestionItem.innerText =
            `${typeLabel} ${title} (${year})`;

        suggestionItem.onclick =
            () => selectMovie(item);

        suggestionsDiv.appendChild(
            suggestionItem
        );
    });
}

// =========================
// SELECT MOVIE / SHOW
// =========================

function selectMovie(item) {

    const title =
        item.title || item.name;

    const year =
        item.release_date
            ? item.release_date.split('-')[0]
            : item.first_air_date
            ? item.first_air_date.split('-')[0]
            : 'N/A';

    document.getElementById(
        'movieInput'
    ).value =
        `${title} (${year})`;

    document.getElementById(
        'suggestions'
    ).innerHTML = '';

    selectedMovieId = item.id;

    selectedMediaType = item.media_type;

    document.getElementById(
        'searchButton'
    ).disabled = false;
}

// =========================
// MAIN RECOMMENDATION ENGINE
// =========================

async function getMovieRecommendations() {

    if (!selectedMovieId || !selectedMediaType) return;

    // =========================
    // FETCH SELECTED MOVIE/SHOW
    // =========================

    const detailsUrl =
        `${BASE_URL}/${selectedMediaType}/${selectedMovieId}?api_key=${API_KEY}`;

    const detailsResponse =
        await fetch(detailsUrl);

    const item =
        await detailsResponse.json();

    displaySelectedMovie(item);

    const originalLanguage =
        item.original_language;

    const genreIds =
        item.genres.map(g => g.id).join(',');

    // =========================
    // RECOMMENDATIONS API
    // =========================

    const recPromises = [];

    for (let i = 1; i <= 5; i++) {

        const url =
            `${BASE_URL}/${selectedMediaType}/${selectedMovieId}/recommendations?api_key=${API_KEY}&page=${i}`;

        recPromises.push(fetch(url));
    }

    // =========================
    // SIMILAR API
    // =========================

    const similarPromises = [];

    for (let i = 1; i <= 5; i++) {

        const url =
            `${BASE_URL}/${selectedMediaType}/${selectedMovieId}/similar?api_key=${API_KEY}&page=${i}`;

        similarPromises.push(fetch(url));
    }

    // =========================
    // DISCOVER API
    // =========================

    const discoverPromises = [];

    for (let i = 1; i <= 3; i++) {

        const url =
            `${BASE_URL}/discover/${selectedMediaType}?api_key=${API_KEY}`
            + `&with_original_language=${originalLanguage}`
            + `&with_genres=${genreIds}`
            + `&vote_average.gte=6`
            + `&vote_count.gte=100`
            + `&sort_by=vote_average.desc`
            + `&page=${i}`;

        discoverPromises.push(fetch(url));
    }

    // =========================
    // FETCH EVERYTHING
    // =========================

    const [
        recResponses,
        similarResponses,
        discoverResponses
    ] = await Promise.all([

        Promise.all(recPromises),

        Promise.all(similarPromises),

        Promise.all(discoverPromises)
    ]);

    // =========================
    // CONVERT TO JSON
    // =========================

    const recResults =
        await Promise.all(
            recResponses.map(r => r.json())
        );

    const similarResults =
        await Promise.all(
            similarResponses.map(r => r.json())
        );

    const discoverResults =
        await Promise.all(
            discoverResponses.map(r => r.json())
        );

    // =========================
    // ADD SOURCE SCORES
    // =========================

    const recMovies =
        recResults.flatMap(r =>

            r.results.map(movie => ({

                ...movie,

                sourceScore: 500
            }))
        );

    const similarMovies =
        similarResults.flatMap(r =>

            r.results.map(movie => ({

                ...movie,

                sourceScore: 400
            }))
        );

    const discoverMovies =
        discoverResults.flatMap(r =>

            r.results.map(movie => ({

                ...movie,

                sourceScore: 50
            }))
        );

    // =========================
    // COMBINE RESULTS
    // =========================

    let combined = [

        ...recMovies,

        ...similarMovies
    ];

    // Fallback discover
    if (combined.length < 40) {

        combined.push(...discoverMovies);
    }

    // =========================
    // REMOVE DUPLICATES
    // =========================

    combined = combined.filter(

        (movie, index, self) =>

            index === self.findIndex(
                m => m.id === movie.id
            )
    );

    // =========================
    // SMART SCORING
    // =========================

    combined.forEach(movie => {

        movie.finalScore =
            movie.sourceScore || 0;

        // Same language boost
        if (
            movie.original_language ===
            originalLanguage
        ) {

            movie.finalScore += 250;
        }

        // Rating boost
        movie.finalScore +=
            movie.vote_average * 18;

        // Popularity boost
        movie.finalScore +=
            movie.popularity * 0.12;

        // Vote count reliability
        movie.finalScore +=
            Math.log10(
                movie.vote_count + 1
            ) * 25;

        // Genre overlap boost
        let overlap = 0;

        movie.genre_ids.forEach(id => {

            if (
                item.genres.some(
                    g => g.id === id
                )
            ) {

                overlap++;
            }
        });

        movie.finalScore +=
            overlap * 50;

        // Penalize weak films
        if (movie.vote_average < 5.5) {

            movie.finalScore -= 100;
        }
    });

    // =========================
    // SORT BY SCORE
    // =========================

    combined.sort(

        (a, b) =>

            b.finalScore - a.finalScore
    );

    // =========================
    // DISPLAY RESULTS
    // =========================

    displayRecommendations(combined);
}

// =========================
// DISPLAY SELECTED MOVIE
// =========================

function displaySelectedMovie(movie) {

    document.getElementById(
        'suggestions'
    ).style.width = '0%';

    const selectedMovieDiv =
        document.getElementById(
            'selectedMovie'
        );

    const title =
        movie.title || movie.name;

    const year =
        movie.release_date
            ? movie.release_date.split('-')[0]
            : movie.first_air_date
            ? movie.first_air_date.split('-')[0]
            : 'N/A';

    const typeLabel =
        selectedMediaType === 'tv'
            ? '📺'
            : '🎬';

    selectedMovieDiv.innerHTML = `
        <div class="selected-movie-poster">
            <img
                src="https://image.tmdb.org/t/p/w500${movie.poster_path}"
                alt="${title}"
                onclick="showMovieDetails(${movie.id})"
            >
        </div>

        <h3>
            ${typeLabel} ${title} (${year})
        </h3>
    `;

    document.getElementById(
        'selectedMovieContainer'
    ).style.display = 'block';
}

// =========================
// DISPLAY RECOMMENDATIONS
// =========================

function displayRecommendations(movies) {

    const recommendationsDiv =
        document.getElementById(
            'recommendations'
        );

    recommendationsDiv.innerHTML = '';

    document.getElementById(
        'recommendationsContainer'
    ).style.display = 'block';

    movies.forEach(movie => {

        if (!movie.poster_path) return;

        const movieDiv =
            document.createElement('div');

        movieDiv.classList.add(
            'movie-container'
        );

        const title =
            movie.title || movie.name;

        const year =
            movie.release_date
                ? movie.release_date.split('-')[0]
                : movie.first_air_date
                ? movie.first_air_date.split('-')[0]
                : 'N/A';

        const typeLabel =
            movie.media_type === 'tv'
                ? '📺'
                : '🎬';

        movieDiv.innerHTML = `
            <img
                src="https://image.tmdb.org/t/p/w500${movie.poster_path}"
                alt="${title}"
                onclick="showMovieDetails(${movie.id})"
            >

            <h4>
                ${typeLabel} ${title} (${year})
            </h4>
        `;

        recommendationsDiv.appendChild(
            movieDiv
        );
    });
}

// =========================
// FORMAT RUNTIME
// =========================

function formatRuntime(minutes) {

    if (!minutes) return 'N/A';

    if (minutes < 60) {

        return `${minutes} minutes`;
    }

    const hours =
        Math.floor(minutes / 60);

    const remainingMinutes =
        minutes % 60;

    if (remainingMinutes === 0) {

        return `${hours} hour${hours > 1 ? 's' : ''}`;

    } else {

        return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
    }
}

// =========================
// SHOW MOVIE DETAILS
// =========================

async function showMovieDetails(movieId) {

    const detailsUrl =
        `${BASE_URL}/${selectedMediaType}/${movieId}?api_key=${API_KEY}&append_to_response=credits`;

    const detailsResponse =
        await fetch(detailsUrl);

    const movie =
        await detailsResponse.json();

    const title =
        movie.title || movie.name;

    const genres =
        movie.genres.map(
            genre => genre.name
        ).join(', ');

    const mediaIcon =
        selectedMediaType === 'tv'
            ? '📺'
            : '🎬';

    document.getElementById(
        'movieTitle'
    ).innerText =
        `${mediaIcon} ${title}`;

    document.getElementById(
        'moviePoster'
    ).src =
        `https://image.tmdb.org/t/p/w500${movie.poster_path}`;

    document.getElementById(
        'releaseDate'
    ).innerText =
        movie.release_date ||
        movie.first_air_date ||
        'N/A';

    document.getElementById(
        'votecount'
    ).innerText =
        movie.vote_count;

    document.getElementById(
        'popularity'
    ).innerText =
        movie.popularity;

    document.getElementById(
        'voteAverage'
    ).innerText =
        movie.vote_average;

    document.getElementById(
        'plot'
    ).innerText =
        movie.overview;

    document.getElementById(
        'genres'
    ).innerText =
        `Genres: ${genres}`;

    let runtimeText = 'N/A';

    if (selectedMediaType === 'movie') {

        runtimeText =
            formatRuntime(movie.runtime);

    } else if (
        selectedMediaType === 'tv'
    ) {

        runtimeText =
            `${movie.number_of_seasons} Season(s), ${movie.number_of_episodes} Episodes`;
    }

    document.getElementById(
        'runtime'
    ).innerText =
        runtimeText;

    const homepageLink =
        document.getElementById(
            'homepageLink'
        );

    if (movie.homepage) {

        homepageLink.href =
            movie.homepage;

        homepageLink.style.display =
            'block';

        homepageLink.innerText =
            `Visit ${title} Homepage`;

    } else {

        homepageLink.style.display =
            'none';
    }

    const castList =
        document.getElementById(
            'castList'
        );

    castList.innerHTML = '';

    movie.credits.cast
        .slice(0, 5)
        .forEach(castMember => {

            const castItem =
                document.createElement('li');

            castItem.innerText =
                `${castMember.name} as ${castMember.character}`;

            castList.appendChild(
                castItem
            );
        });

    document.getElementById(
        'movieModal'
    ).style.display = 'flex';
}

// =========================
// CLOSE MODAL
// =========================

function closeModal() {

    document.getElementById(
        'movieModal'
    ).style.display = 'none';
}

// =========================
// RESET PAGE
// =========================

function resetInitialState() {

    movieInput.value = '';

    suggestions.innerHTML = '';

    document.getElementById(
        'selectedMovieContainer'
    ).style.display = 'none';

    document.getElementById(
        'recommendationsContainer'
    ).style.display = 'none';
}

// =========================
// RESET ON HEADING CLICK
// =========================

heading.addEventListener(
    'click',
    resetInitialState
);
