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

// =========================
// FETCH SELECTED MOVIE/SHOW
// =========================

const detailsUrl =
    `${BASE_URL}/${selectedMediaType}/${selectedMovieId}?api_key=${API_KEY}&append_to_response=credits`;

const detailsResponse =
    await fetch(detailsUrl);

const item =
    await detailsResponse.json();

displaySelectedMovie(item);

const originalLanguage =
    item.original_language;

// =========================
// YEAR + DECADE
// =========================

const selectedYear =
    item.release_date
        ? parseInt(item.release_date.split('-')[0])
        : item.first_air_date
        ? parseInt(item.first_air_date.split('-')[0])
        : null;

const selectedDecade =
    selectedYear
        ? Math.floor(selectedYear / 10) * 10
        : null;

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
// FETCH CAST FILMOGRAPHY
// =========================

const topCast =
    item.credits.cast.slice(0, 5);

const castMoviePromises = [];

topCast.forEach(actor => {

    const url =
        `${BASE_URL}/person/${actor.id}/${selectedMediaType}_credits?api_key=${API_KEY}`;

    castMoviePromises.push(fetch(url));
});

// =========================
// FETCH EVERYTHING
// =========================

const [
    recResponses,
    similarResponses,
    castResponses
] = await Promise.all([

    Promise.all(recPromises),

    Promise.all(similarPromises),

    Promise.all(castMoviePromises)
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

const castResults =
    await Promise.all(
        castResponses.map(r => r.json())
    );

// =========================
// SOURCE SCORES
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

const castMovies =
    castResults.flatMap(r =>

        (r.cast || []).map(movie => ({

            ...movie,

            sourceScore: 250
        }))
    );

// =========================
// COMBINE RESULTS
// =========================

let combined = [

    ...recMovies,

    ...similarMovies,

    ...castMovies
];

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
// REMOVE INVALID RESULTS
// =========================

combined = combined.filter(movie => {

    // Remove selected movie
    if (movie.id === selectedMovieId) {

        return false;
    }

    // Remove low quality entries
    if (movie.vote_count < 80) {

        return false;
    }

    // Remove adult titles
    if (movie.adult) {

        return false;
    }

    // Animation filtering
    const selectedIsAnimation =
        item.genres.some(
            g => g.name === 'Animation'
        );

    const movieIsAnimation =
        movie.genre_ids &&
        movie.genre_ids.includes(16);

    if (
        !selectedIsAnimation &&
        movieIsAnimation
    ) {

        return false;
    }

    return true;
});

// =========================
// FETCH DETAILS + CREDITS
// =========================

const detailedMovies =
    await Promise.all(

        combined.slice(0, 60).map(async movie => {

            try {

                const detailsFetch =
                    await fetch(

                        `${BASE_URL}/${selectedMediaType}/${movie.id}?api_key=${API_KEY}&append_to_response=credits`
                    );

                const details =
                    await detailsFetch.json();

                return {

                    ...movie,

                    credits: details.credits
                };

            } catch {

                return movie;
            }
        })
    );

// =========================
// SMART SCORING
// =========================

detailedMovies.forEach(movie => {

    movie.finalScore =
        movie.sourceScore || 0;

    // =========================
    // YEAR MATCHING
    // =========================

    const movieYear =
        movie.release_date
            ? parseInt(movie.release_date.split('-')[0])
            : movie.first_air_date
            ? parseInt(movie.first_air_date.split('-')[0])
            : null;

    if (selectedYear && movieYear) {

        const yearDifference =
            Math.abs(selectedYear - movieYear);

        if (yearDifference === 0) {

            movie.finalScore += 220;

        } else if (yearDifference <= 2) {

            movie.finalScore += 160;

        } else if (yearDifference <= 5) {

            movie.finalScore += 100;

        } else if (yearDifference >= 15) {

            movie.finalScore -= 100;
        }
    }

    // =========================
    // DECADE MATCHING
    // =========================

    const movieDecade =
        movieYear
            ? Math.floor(movieYear / 10) * 10
            : null;

    if (
        selectedDecade &&
        movieDecade
    ) {

        if (
            movieDecade ===
            selectedDecade
        ) {

            movie.finalScore += 250;

        } else if (

            Math.abs(
                movieDecade -
                selectedDecade
            ) === 10
        ) {

            movie.finalScore += 80;

        } else {

            movie.finalScore -= 70;
        }
    }

    // =========================
    // LANGUAGE MATCHING
    // =========================

    if (
        movie.original_language ===
        originalLanguage
    ) {

        movie.finalScore += 250;
    }

    // =========================
    // RATING BOOST
    // =========================

    movie.finalScore +=
        movie.vote_average * 18;

    // =========================
    // POPULARITY BOOST
    // =========================

    movie.finalScore +=
        movie.popularity * 0.10;

    // =========================
    // VOTE RELIABILITY
    // =========================

    movie.finalScore +=
        Math.log10(
            movie.vote_count + 1
        ) * 25;

    // =========================
    // GENRE MATCHING
    // =========================

    let genreOverlap = 0;

    movie.genre_ids.forEach(id => {

        if (
            item.genres.some(
                g => g.id === id
            )
        ) {

            genreOverlap++;
        }
    });

    movie.finalScore +=
        genreOverlap * 90;

    // Perfect genre bonus
    if (
        genreOverlap >=
        item.genres.length - 1
    ) {

        movie.finalScore += 180;
    }

    // =========================
    // CAST MATCHING
    // =========================

    if (
        movie.credits &&
        movie.credits.cast &&
        item.credits &&
        item.credits.cast
    ) {

        const selectedCast =
            item.credits.cast
                .slice(0, 8)
                .map(actor => actor.id);

        const recommendationCast =
            movie.credits.cast
                .slice(0, 8)
                .map(actor => actor.id);

        let castOverlap = 0;

        recommendationCast.forEach(actorId => {

            if (
                selectedCast.includes(actorId)
            ) {

                castOverlap++;
            }
        });

        movie.finalScore +=
            castOverlap * 140;

        if (castOverlap >= 3) {

            movie.finalScore += 250;
        }
    }

    // =========================
    // PENALIZE WEAK MOVIES
    // =========================

    if (movie.vote_average < 5.5) {

        movie.finalScore -= 120;
    }
});

// =========================
// SORT RESULTS
// =========================

detailedMovies.sort(

    (a, b) =>

        b.finalScore - a.finalScore
);

// =========================
// DISPLAY RESULTS
// =========================

displayRecommendations(detailedMovies);
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
