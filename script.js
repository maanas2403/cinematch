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
    // FETCH SELECTED TITLE
    // =========================

    const detailsUrl =
        `${BASE_URL}/${selectedMediaType}/${selectedMovieId}?api_key=${API_KEY}&append_to_response=credits`;

    const detailsResponse =
        await fetch(detailsUrl);

    const item =
        await detailsResponse.json();

    displaySelectedMovie(item);

    // =========================
    // BASIC INFO
    // =========================

    const originalLanguage =
        item.original_language;

    const selectedGenres =
        item.genres.map(g => g.id);

    const selectedYear =
        item.release_date
            ? parseInt(item.release_date.split('-')[0])
            : item.first_air_date
            ? parseInt(item.first_air_date.split('-')[0])
            : 2000;

    const selectedIsAnimation =
        item.genres.some(
            g => g.name === 'Animation'
        );

    const isHindi =
        originalLanguage === 'hi';

    // =========================
    // RECOMMENDATIONS API
    // =========================

    const recPromises = [];

    for (let i = 1; i <= 5; i++) {

        recPromises.push(

            fetch(
                `${BASE_URL}/${selectedMediaType}/${selectedMovieId}/recommendations?api_key=${API_KEY}&page=${i}`
            )
        );
    }

    // =========================
    // SIMILAR API
    // =========================

    const similarPromises = [];

    for (let i = 1; i <= 5; i++) {

        similarPromises.push(

            fetch(
                `${BASE_URL}/${selectedMediaType}/${selectedMovieId}/similar?api_key=${API_KEY}&page=${i}`
            )
        );
    }

    // =========================
    // SAME GENRE DISCOVER
    // =========================

    const discoverPromises = [];

    for (let i = 1; i <= 3; i++) {

        discoverPromises.push(

            fetch(

                `${BASE_URL}/discover/${selectedMediaType}?api_key=${API_KEY}`
                + `&with_genres=${selectedGenres.join(',')}`
                + `&with_original_language=${originalLanguage}`
                + `&vote_count.gte=50`
                + `&sort_by=popularity.desc`
                + `&page=${i}`
            )
        );
    }

    // =========================
    // CAST FILMOGRAPHY
    // =========================

    const topCast =
        item.credits.cast.slice(0, 5);

    const castPromises = [];

    topCast.forEach(actor => {

        castPromises.push(

            fetch(
                `${BASE_URL}/person/${actor.id}/${selectedMediaType}_credits?api_key=${API_KEY}`
            )
        );
    });

    // =========================
    // FETCH EVERYTHING
    // =========================

    const [

        recResponses,
        similarResponses,
        discoverResponses,
        castResponses

    ] = await Promise.all([

        Promise.all(recPromises),

        Promise.all(similarPromises),

        Promise.all(discoverPromises),

        Promise.all(castPromises)
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

    const castResults =
        await Promise.all(
            castResponses.map(r => r.json())
        );

    // =========================
    // SOURCE SCORING
    // =========================

    const recMovies =
        recResults.flatMap(r =>

            r.results.map(movie => ({

                ...movie,

                sourceScore: isHindi
                    ? 120
                    : 500
            }))
        );

    const similarMovies =
        similarResults.flatMap(r =>

            r.results.map(movie => ({

                ...movie,

                sourceScore: isHindi
                    ? 140
                    : 450
            }))
        );

    const discoverMovies =
        discoverResults.flatMap(r =>

            r.results.map(movie => ({

                ...movie,

                sourceScore: isHindi
                    ? 100
                    : 250
            }))
        );

    const castMovies =
        castResults.flatMap(r =>

            (r.cast || []).map(movie => ({

                ...movie,

                sourceScore: isHindi
                    ? 300
                    : 350
            }))
        );

    // =========================
    // COMBINE
    // =========================

    let combined = [

        ...recMovies,
        ...similarMovies,
        ...discoverMovies,
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
    // HARD FILTERS
    // =========================

    combined = combined.filter(movie => {

        // Remove selected title
        if (movie.id === selectedMovieId) {

            return false;
        }

        // Missing posters
        if (!movie.poster_path) {

            return false;
        }

        // Weak entries
        if (movie.vote_count < 30) {

            return false;
        }

        // Adult titles
        if (movie.adult) {

            return false;
        }

        // STRICT LANGUAGE FILTER
        if (
            movie.original_language !==
            originalLanguage
        ) {

            return false;
        }

        // Animation mismatch
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

            combined.slice(0, 100).map(async movie => {

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
        // YEAR
        // =========================

        const movieYear =
            movie.release_date
                ? parseInt(movie.release_date.split('-')[0])
                : movie.first_air_date
                ? parseInt(movie.first_air_date.split('-')[0])
                : null;

        const yearDifference =
            movieYear
                ? Math.abs(
                    movieYear - selectedYear
                )
                : 999;

        // =========================
        // GENRE OVERLAP
        // =========================

        let overlap = 0;

        movie.genre_ids.forEach(id => {

            if (
                selectedGenres.includes(id)
            ) {

                overlap++;
            }
        });

        const hasGenreMatch =
            overlap > 0;

        // =========================
        // CAST OVERLAP
        // =========================

        let castOverlap = 0;

        let leadActorMatch = false;

        if (
            movie.credits &&
            movie.credits.cast &&
            item.credits &&
            item.credits.cast
        ) {

            const selectedCast =
                item.credits.cast
                    .slice(0, 5);

            const movieCast =
                movie.credits.cast
                    .slice(0, 5);

            selectedCast.forEach(

                (actor, index) => {

                    const exists =
                        movieCast.some(
                            a => a.id === actor.id
                        );

                    if (exists) {

                        castOverlap++;

                        // Lead actor only
                        if (index === 0) {

                            leadActorMatch = true;
                        }
                    }
                }
            );
        }

        // =========================
        // HINDI LOGIC
        // =========================

        if (isHindi) {

            // GROUP 1
            // SAME ERA + LEAD ACTOR

            if (
                yearDifference <= 5 &&
                leadActorMatch
            ) {

                movie.finalScore += 5000;
            }

            // GROUP 2
            // SAME ERA + SAME GENRE

            else if (
                yearDifference <= 5 &&
                hasGenreMatch
            ) {

                movie.finalScore += 4000;
            }

            // GROUP 3
            // OUTSIDE ERA + SAME GENRE

            else if (
                yearDifference > 5 &&
                hasGenreMatch
            ) {

                movie.finalScore += 2500;
            }

            // GROUP 4
            // OUTSIDE ERA + LEAD ACTOR

            else if (
                yearDifference > 5 &&
                leadActorMatch
            ) {

                movie.finalScore += 1200;
            }

            // Extra cast boost
            movie.finalScore +=
                castOverlap * 200;

            // Extra genre boost
            movie.finalScore +=
                overlap * 80;

            // Same era bonus
            if (yearDifference <= 5) {

                movie.finalScore += 700;
            }

            // Penalize far away era
            if (yearDifference >= 20) {

                movie.finalScore -= 400;
            }

            // Popularity low importance
            movie.finalScore +=
                movie.popularity * 0.01;
        }

       // =========================
// HOLLYWOOD / NON-HINDI
// =========================

else {

    // =========================
    // HEAVY GENRE PRIORITY
    // =========================

    movie.finalScore +=
        overlap * 220;

    // Perfect genre match

    if (
        overlap >=
        selectedGenres.length - 1
    ) {

        movie.finalScore += 500;
    }

    // =========================
    // MODERATE CAST BOOST
    // =========================

    movie.finalScore +=
        castOverlap * 60;

    // =========================
    // YEAR LIGHT IMPORTANCE
    // =========================

    if (yearDifference <= 5) {

        movie.finalScore += 120;

    } else if (yearDifference <= 10) {

        movie.finalScore += 60;
    }

    // =========================
    // QUALITY MATTERS
    // =========================

    movie.finalScore +=
        movie.vote_average * 25;

    // =========================
    // POPULARITY MATTERS
    // =========================

    movie.finalScore +=
        movie.popularity * 0.18;

    // =========================
    // PENALIZE LOW GENRE MATCH
    // =========================

    if (overlap === 0) {

        movie.finalScore -= 300;
    }
}
        // =========================
        // GLOBAL RATING
        // =========================

        movie.finalScore +=
            movie.vote_average * 15;

        // =========================
        // VOTE RELIABILITY
        // =========================

        movie.finalScore +=
            Math.log10(
                movie.vote_count + 1
            ) * 25;

        // =========================
        // PENALIZE WEAK FILMS
        // =========================

        if (movie.vote_average < 5.5) {

            movie.finalScore -= 120;
        }
    });

    // =========================
    // HINDI PRIORITY SORTING
    // =========================

    if (isHindi) {

        detailedMovies.sort((a, b) => {

            const getPriority = movie => {

                const movieYear =
                    movie.release_date
                        ? parseInt(movie.release_date.split('-')[0])
                        : movie.first_air_date
                        ? parseInt(movie.first_air_date.split('-')[0])
                        : 0;

                const yearDifference =
                    Math.abs(
                        movieYear - selectedYear
                    );

                let overlap = 0;

                movie.genre_ids.forEach(id => {

                    if (
                        selectedGenres.includes(id)
                    ) {

                        overlap++;
                    }
                });

                let leadActorMatch = false;

                if (
                    movie.credits &&
                    movie.credits.cast &&
                    item.credits &&
                    item.credits.cast
                ) {

                    const selectedLead =
                        item.credits.cast[0];

                    if (selectedLead) {

                        leadActorMatch =
                            movie.credits.cast
                                .slice(0, 5)
                                .some(
                                    actor =>
                                        actor.id ===
                                        selectedLead.id
                                );
                    }
                }

                // GROUP 1
                if (
                    yearDifference <= 5 &&
                    leadActorMatch
                ) {

                    return 1;
                }

                // GROUP 2
                if (
                    yearDifference <= 5 &&
                    overlap > 0
                ) {

                    return 2;
                }

                // GROUP 3
                if (
                    yearDifference > 5 &&
                    overlap > 0
                ) {

                    return 3;
                }

                // GROUP 4
                if (
                    yearDifference > 5 &&
                    leadActorMatch
                ) {

                    return 4;
                }

                return 5;
            };

            const priorityA =
                getPriority(a);

            const priorityB =
                getPriority(b);

            // PRIORITY FIRST
            if (priorityA !== priorityB) {

                return priorityA - priorityB;
            }

            // THEN SCORE
            return (
                b.finalScore -
                a.finalScore
            );
        });

    } else {

        // Hollywood normal sorting
        detailedMovies.sort(

            (a, b) =>

                b.finalScore - a.finalScore
        );
    }

    // =========================
    // DISPLAY
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
    `${BASE_URL}/${selectedMediaType}/${movieId}?api_key=${API_KEY}&append_to_response=credits,watch/providers`;

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
        `${genres}`;

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
    // =========================
// OTT PROVIDERS
// =========================

const ottProviders =
    document.getElementById(
        'ottProviders'
    );

const providerData =
    movie["watch/providers"];

if (
    providerData &&
    providerData.results
) {

    const indiaProviders =
        providerData.results.IN;

    const usProviders =
        providerData.results.US;

    const providers =
        indiaProviders || usProviders;

    if (
        providers &&
        providers.flatrate
    ) {

        const providerNames =
            providers.flatrate
                .slice(0, 5)
                .map(
                    p => p.provider_name
                )
                .join(", ");

        // TMDB watch link
        const watchLink =
            providers.link;

        ottProviders.innerHTML =
            `
            <strong>Available On:</strong>
            ${providerNames}
            <br>
            <a
                href="${watchLink}"
                target="_blank"
            >
                Watch Here
            </a>
            `;

    } else {

        ottProviders.innerHTML =
            `<strong>Available On:</strong> Not Available`;
    }

} else {

    ottProviders.innerHTML =
        `<strong>Available On:</strong> Not Available`;
}
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
