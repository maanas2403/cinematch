// const API_KEY = '1ffd7b3687d86736a4388cff1233050b'; // Replace with your TMDb API key
// const BASE_URL = 'https://api.themoviedb.org/3';
// const heading = document.getElementById('pageTitle');
// let selectedMovieId = null;  // To keep track of selected movie

// // Fetch movie suggestions as user types
// document.addEventListener("DOMContentLoaded", function () {
//     const modeToggle = document.getElementById("modeToggle");
//     const body = document.body;

//     // Check for saved user preference for dark mode
//     const isDarkMode = localStorage.getItem("dark-mode") === "true";
//     if (isDarkMode) {
//         body.classList.add("dark-mode");
//         modeToggle.textContent = "Switch to Light Mode";
//     } else {
//         body.classList.add("light-mode");
//         modeToggle.textContent = "Switch to Dark Mode";
//     }

//     // Toggle dark/light mode
//     modeToggle.addEventListener("click", function () {
//         if (body.classList.contains("dark-mode")) {
//             body.classList.remove("dark-mode");
//             body.classList.add("light-mode");
//             modeToggle.textContent = "Switch to Dark Mode";
//             localStorage.setItem("dark-mode", "false"); // Save preference
//         } else {
//             body.classList.remove("light-mode");
//             body.classList.add("dark-mode");
//             modeToggle.textContent = "Switch to Light Mode";
//             localStorage.setItem("dark-mode", "true"); // Save preference
//         }
//     });
// });
// async function fetchMovieSuggestions() {
//     const movieTitle = document.getElementById('movieInput').value;
//     const suggestionsDiv = document.getElementById('suggestions');
//     suggestionsDiv.style.width='100%';
//     if (movieTitle.length < 3) {
//         suggestionsDiv.innerHTML = '';  // Clear suggestions for short inputs
//         document.getElementById('searchButton').disabled = true;
//         return;
//     }

//     const searchUrl = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(movieTitle)}`;
//     const searchResponse = await fetch(searchUrl);
//     const searchData = await searchResponse.json();
    
//     if (searchData.results.length === 0) {
//         suggestionsDiv.innerHTML = '<div class="suggestion-item">No results found</div>';
//         return;
//     }

//     suggestionsDiv.innerHTML = '';
//     searchData.results.slice(0, 5).forEach(movie => {
//         const suggestionItem = document.createElement('div');
//         suggestionItem.classList.add('suggestion-item');
//         suggestionItem.innerText = `${movie.title} (${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'})`;
//         suggestionItem.onclick = () => selectMovie(movie);
//         suggestionsDiv.appendChild(suggestionItem);
//     });
// }

// // Select a movie from suggestions and enable search button
// function selectMovie(movie) {
//     document.getElementById('movieInput').value = `${movie.title} (${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'})`;
//     document.getElementById('suggestions').innerHTML = '';  // Clear suggestions
//     selectedMovieId = movie.id;
//     document.getElementById('searchButton').disabled = false;  // Enable search button
// }

// // Fetch selected movie and its recommendations
// async function getMovieRecommendations() {
//     if (!selectedMovieId) return;  // No movie selected

//     const movieUrl = `${BASE_URL}/movie/${selectedMovieId}?api_key=${API_KEY}`;
//     const movieResponse = await fetch(movieUrl);
//     const movie = await movieResponse.json();

//     displaySelectedMovie(movie);

//     // Get recommendations
//     const recommendationsUrl = `${BASE_URL}/movie/${selectedMovieId}/recommendations?api_key=${API_KEY}`;
//     const recommendationsResponse = await fetch(recommendationsUrl);
//     const recommendationsData = await recommendationsResponse.json();

//     displayRecommendations(recommendationsData.results);
// }

// function displaySelectedMovie(movie) {
//     document.getElementById('suggestions').style.width='0%';
//     const selectedMovieDiv = document.getElementById('selectedMovie');
//     selectedMovieDiv.innerHTML = `
//         <div class="selected-movie-poster">
//             <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}" onclick="showMovieDetails(${movie.id})">
//         </div>
//         <h3>${movie.title} (${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'})</h3>
//     `;
//     document.getElementById('selectedMovieContainer').style.display = 'block';
// }

// function displayRecommendations(movies) {
//     const recommendationsDiv = document.getElementById('recommendations');
//     recommendationsDiv.innerHTML = '';  // Clear previous results

//     // Show the recommendations container
//     document.getElementById('recommendationsContainer').style.display = 'block';

//     movies.forEach(movie => {
//         const movieDiv = document.createElement('div');
//         movieDiv.classList.add('movie-container');  // Added this class
//         movieDiv.innerHTML = `
//             <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}" onclick="showMovieDetails(${movie.id})">
//             <h4>${movie.title} (${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'})</h4>
//         `;
//         recommendationsDiv.appendChild(movieDiv);
//     });
// }
// function formatRuntime(minutes) {
//     if (minutes < 60) {
//         return `${minutes} minutes`;
//     }
    
//     const hours = Math.floor(minutes / 60);
//     const remainingMinutes = minutes % 60;
    
//     if (remainingMinutes === 0) {
//         return `${hours} hour${hours > 1 ? 's' : ''}`;
//     } else {
//         return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
//     }
// }
// async function showMovieDetails(movieId) {
//     const detailsUrl = `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`;
//     const detailsResponse = await fetch(detailsUrl);
//     const movie = await detailsResponse.json();
//     const genres = movie.genres.map(genre => genre.name).join(', ');
//     document.getElementById('movieTitle').innerText = movie.title;
//     document.getElementById('moviePoster').src = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
//     document.getElementById('releaseDate').innerText = movie.release_date;
//     document.getElementById('votecount').innerText = movie.vote_count;
//     document.getElementById('popularity').innerText = movie.popularity;
//     document.getElementById('voteAverage').innerText = movie.vote_average;
//     document.getElementById('plot').innerText = movie.overview;
//     document.getElementById('genres').innerText = `Genres: ${genres}`;
//     const formattedRuntime = formatRuntime(movie.runtime);
//     document.getElementById('runtime').innerText = `${formattedRuntime}`;
//     const homepageLink = document.getElementById('homepageLink');
//     if (movie.homepage) {
//         homepageLink.href = movie.homepage;
//         homepageLink.style.display = 'block';  // Show the homepage link
//         homepageLink.innerText = `Visit ${movie.title} Homepage`;  // Set the link text
//     } else {
//         homepageLink.style.display = 'none';  // Hide the link if no homepage is available
//     }
//     const castList = document.getElementById('castList');
//     castList.innerHTML = '';  // Clear previous cast details
//     movie.credits.cast.slice(0, 5).forEach(castMember => {
//         const castItem = document.createElement('li');
//         castItem.innerText = `${castMember.name} as ${castMember.character}`;
//         castList.appendChild(castItem);
//     });

//     // Show modal
//     document.getElementById('movieModal').style.display = 'flex';
// }

// function closeModal() {
//     document.getElementById('movieModal').style.display = 'none';
// }

// function resetInitialState() {
//     movieInput.value = ''; // Clear the input box
//     suggestions.innerHTML = ''; // Clear the suggestions
//     document.getElementById('selectedMovieContainer').style.display = 'none' ; // Clear the selected movie display
//     document.getElementById('recommendationsContainer').style.display = 'none'; // Clear the recommendations display
const API_KEY = '1ffd7b3687d86736a4388cff1233050b';
const BASE_URL = 'https://api.themoviedb.org/3';

const heading = document.getElementById('pageTitle');

let selectedMovieId = null;
let selectedMediaType = null;

// Dark / Light Mode
document.addEventListener("DOMContentLoaded", function () {
    const modeToggle = document.getElementById("modeToggle");
    const body = document.body;

    const isDarkMode = localStorage.getItem("dark-mode") === "true";

    if (isDarkMode) {
        body.classList.add("dark-mode");
        modeToggle.textContent = "Switch to Light Mode";
    } else {
        body.classList.add("light-mode");
        modeToggle.textContent = "Switch to Dark Mode";
    }

    modeToggle.addEventListener("click", function () {
        if (body.classList.contains("dark-mode")) {
            body.classList.remove("dark-mode");
            body.classList.add("light-mode");

            modeToggle.textContent = "Switch to Dark Mode";

            localStorage.setItem("dark-mode", "false");
        } else {
            body.classList.remove("light-mode");
            body.classList.add("dark-mode");

            modeToggle.textContent = "Switch to Light Mode";

            localStorage.setItem("dark-mode", "true");
        }
    });
});

// Fetch movie + TV suggestions
async function fetchMovieSuggestions() {
    const movieTitle = document.getElementById('movieInput').value;
    const suggestionsDiv = document.getElementById('suggestions');

    suggestionsDiv.style.width = '100%';

    if (movieTitle.length < 3) {
        suggestionsDiv.innerHTML = '';
        document.getElementById('searchButton').disabled = true;
        return;
    }

    const searchUrl =
        `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(movieTitle)}`;

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    const filteredResults = searchData.results.filter(
        item => item.media_type === 'movie' || item.media_type === 'tv'
    );

    if (filteredResults.length === 0) {
        suggestionsDiv.innerHTML =
            '<div class="suggestion-item">No results found</div>';
        return;
    }

    suggestionsDiv.innerHTML = '';

    filteredResults.slice(0, 5).forEach(item => {

        const suggestionItem = document.createElement('div');

        suggestionItem.classList.add('suggestion-item');

        const title = item.title || item.name;

        const year = item.release_date
            ? item.release_date.split('-')[0]
            : item.first_air_date
            ? item.first_air_date.split('-')[0]
            : 'N/A';

        const typeLabel =
            item.media_type === 'movie'
                ? '🎬 Movie'
                : '📺 TV Show';

        suggestionItem.innerText =
            `${title} (${year}) - ${typeLabel}`;

        suggestionItem.onclick = () => selectMovie(item);

        suggestionsDiv.appendChild(suggestionItem);
    });
}

// Select movie or TV show
function selectMovie(item) {

    const title = item.title || item.name;

    const year = item.release_date
        ? item.release_date.split('-')[0]
        : item.first_air_date
        ? item.first_air_date.split('-')[0]
        : 'N/A';

    document.getElementById('movieInput').value =
        `${title} (${year})`;

    document.getElementById('suggestions').innerHTML = '';

    selectedMovieId = item.id;
    selectedMediaType = item.media_type;

    document.getElementById('searchButton').disabled = false;
}

// Get recommendations
async function getMovieRecommendations() {

    if (!selectedMovieId || !selectedMediaType) return;

    const detailsUrl =
        `${BASE_URL}/${selectedMediaType}/${selectedMovieId}?api_key=${API_KEY}`;

    const detailsResponse = await fetch(detailsUrl);

    const item = await detailsResponse.json();

    displaySelectedMovie(item);

    const recommendationsUrl =
        `${BASE_URL}/${selectedMediaType}/${selectedMovieId}/recommendations?api_key=${API_KEY}`;

    const recommendationsResponse = await fetch(recommendationsUrl);

    const recommendationsData = await recommendationsResponse.json();

    displayRecommendations(recommendationsData.results);
}

// Display selected item
function displaySelectedMovie(movie) {

    document.getElementById('suggestions').style.width = '0%';

    const selectedMovieDiv = document.getElementById('selectedMovie');

    const title = movie.title || movie.name;

    const year = movie.release_date
        ? movie.release_date.split('-')[0]
        : movie.first_air_date
        ? movie.first_air_date.split('-')[0]
        : 'N/A';

    // Detect type icon
    const typeLabel =
        selectedMediaType === 'tv'
            ? '📺 TV Show'
            : '🎬 Movie';

    selectedMovieDiv.innerHTML = `
        <div class="selected-movie-poster">
            <img 
                src="https://image.tmdb.org/t/p/w500${movie.poster_path}" 
                alt="${title}" 
                onclick="showMovieDetails(${movie.id})"
            >
        </div>

        <h3>
            ${typeLabel}<br>
            ${title} (${year})
        </h3>
    `;

    document.getElementById('selectedMovieContainer').style.display = 'block';
}

// Display recommendations
function displayRecommendations(movies) {

    const recommendationsDiv = document.getElementById('recommendations');

    recommendationsDiv.innerHTML = '';

    document.getElementById('recommendationsContainer').style.display = 'block';

    movies.forEach(movie => {

        const movieDiv = document.createElement('div');

        movieDiv.classList.add('movie-container');

        const title = movie.title || movie.name;

        const year = movie.release_date
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
                 ${title} (${year}) ${typeLabel}
            </h4>
        `;

        recommendationsDiv.appendChild(movieDiv);
    });
}

// Format runtime
function formatRuntime(minutes) {

    if (!minutes) return 'N/A';

    if (minutes < 60) {
        return `${minutes} minutes`;
    }

    const hours = Math.floor(minutes / 60);

    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
        return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
    }
}

// Show details modal
async function showMovieDetails(movieId) {

    const detailsUrl =
        `${BASE_URL}/${selectedMediaType}/${movieId}?api_key=${API_KEY}&append_to_response=credits`;

    const detailsResponse = await fetch(detailsUrl);

    const movie = await detailsResponse.json();

    const title = movie.title || movie.name;

    const genres = movie.genres.map(
        genre => genre.name
    ).join(', ');

    document.getElementById('movieTitle').innerText = title;

    document.getElementById('moviePoster').src =
        `https://image.tmdb.org/t/p/w500${movie.poster_path}`;

    document.getElementById('releaseDate').innerText =
        movie.release_date || movie.first_air_date || 'N/A';

    document.getElementById('votecount').innerText =
        movie.vote_count;

    document.getElementById('popularity').innerText =
        movie.popularity;

    document.getElementById('voteAverage').innerText =
        movie.vote_average;

    document.getElementById('plot').innerText =
        movie.overview;

    document.getElementById('genres').innerText =
        `Genres: ${genres}`;

    // Runtime / Episodes
    let runtimeText = 'N/A';

    if (selectedMediaType === 'movie') {
        runtimeText = formatRuntime(movie.runtime);
    } else if (selectedMediaType === 'tv') {
        runtimeText =
            `${movie.number_of_seasons} Season(s), ${movie.number_of_episodes} Episodes`;
    }

    document.getElementById('runtime').innerText =
        runtimeText;

    // Homepage
    const homepageLink =
        document.getElementById('homepageLink');

    if (movie.homepage) {

        homepageLink.href = movie.homepage;

        homepageLink.style.display = 'block';

        homepageLink.innerText =
            `Visit ${title} Homepage`;

    } else {

        homepageLink.style.display = 'none';
    }

    // Cast
    const castList = document.getElementById('castList');

    castList.innerHTML = '';

    movie.credits.cast.slice(0, 5).forEach(castMember => {

        const castItem = document.createElement('li');

        castItem.innerText =
            `${castMember.name} as ${castMember.character}`;

        castList.appendChild(castItem);
    });

    // Show modal
    document.getElementById('movieModal').style.display = 'flex';
}

// Close modal
function closeModal() {
    document.getElementById('movieModal').style.display = 'none';
}

// Reset page
function resetInitialState() {

    movieInput.value = '';

    suggestions.innerHTML = '';

    document.getElementById('selectedMovieContainer').style.display = 'none';

    document.getElementById('recommendationsContainer').style.display = 'none';
}

// Click heading to reset
heading.addEventListener('click', resetInitialState);
// }
// heading.addEventListener('click', resetInitialState);
