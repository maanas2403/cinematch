const API_KEY = '1ffd7b3687d86736a4388cff1233050b'; // Replace with your TMDb API key
const BASE_URL = 'https://api.themoviedb.org/3';
const heading = document.getElementById('pageTitle');
let selectedMovieId = null;  // To keep track of selected movie

// Fetch movie suggestions as user types
document.addEventListener("DOMContentLoaded", function () {
    const modeToggle = document.getElementById("modeToggle");
    const body = document.body;

    // Check for saved user preference for dark mode
    const isDarkMode = localStorage.getItem("dark-mode") === "true";
    if (isDarkMode) {
        body.classList.add("dark-mode");
        modeToggle.textContent = "Switch to Light Mode";
    } else {
        body.classList.add("light-mode");
        modeToggle.textContent = "Switch to Dark Mode";
    }

    // Toggle dark/light mode
    modeToggle.addEventListener("click", function () {
        if (body.classList.contains("dark-mode")) {
            body.classList.remove("dark-mode");
            body.classList.add("light-mode");
            modeToggle.textContent = "Switch to Dark Mode";
            localStorage.setItem("dark-mode", "false"); // Save preference
        } else {
            body.classList.remove("light-mode");
            body.classList.add("dark-mode");
            modeToggle.textContent = "Switch to Light Mode";
            localStorage.setItem("dark-mode", "true"); // Save preference
        }
    });
});
async function fetchMovieSuggestions() {
    const movieTitle = document.getElementById('movieInput').value;
    const suggestionsDiv = document.getElementById('suggestions');

    if (movieTitle.length < 3) {
        suggestionsDiv.innerHTML = '';  // Clear suggestions for short inputs
        document.getElementById('searchButton').disabled = true;
        return;
    }

    const searchUrl = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(movieTitle)}`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    if (searchData.results.length === 0) {
        suggestionsDiv.innerHTML = '<div class="suggestion-item">No results found</div>';
        return;
    }

    suggestionsDiv.innerHTML = '';
    searchData.results.slice(0, 5).forEach(movie => {
        const suggestionItem = document.createElement('div');
        suggestionItem.classList.add('suggestion-item');
        suggestionItem.innerText = `${movie.title} (${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'})`;
        suggestionItem.onclick = () => selectMovie(movie);
        suggestionsDiv.appendChild(suggestionItem);
    });
}

// Select a movie from suggestions and enable search button
function selectMovie(movie) {
    document.getElementById('movieInput').value = `${movie.title} (${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'})`;
    document.getElementById('suggestions').innerHTML = '';  // Clear suggestions
    selectedMovieId = movie.id;
    document.getElementById('searchButton').disabled = false;  // Enable search button
}

// Fetch selected movie and its recommendations
async function getMovieRecommendations() {
    if (!selectedMovieId) return;  // No movie selected

    const movieUrl = `${BASE_URL}/movie/${selectedMovieId}?api_key=${API_KEY}`;
    const movieResponse = await fetch(movieUrl);
    const movie = await movieResponse.json();

    displaySelectedMovie(movie);

    // Get recommendations
    const recommendationsUrl = `${BASE_URL}/movie/${selectedMovieId}/recommendations?api_key=${API_KEY}`;
    const recommendationsResponse = await fetch(recommendationsUrl);
    const recommendationsData = await recommendationsResponse.json();

    displayRecommendations(recommendationsData.results);
}

function displaySelectedMovie(movie) {
    const selectedMovieDiv = document.getElementById('selectedMovie');
    selectedMovieDiv.innerHTML = `
        <div class="selected-movie-poster">
            <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}" onclick="showMovieDetails(${movie.id})">
        </div>
        <h3>${movie.title} (${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'})</h3>
    `;
    document.getElementById('selectedMovieContainer').style.display = 'block';
}

function displayRecommendations(movies) {
    const recommendationsDiv = document.getElementById('recommendations');
    recommendationsDiv.innerHTML = '';  // Clear previous results

    // Show the recommendations container
    document.getElementById('recommendationsContainer').style.display = 'block';

    movies.forEach(movie => {
        const movieDiv = document.createElement('div');
        movieDiv.classList.add('movie-container');  // Added this class
        movieDiv.innerHTML = `
            <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}" onclick="showMovieDetails(${movie.id})">
            <h4>${movie.title} (${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'})</h4>
        `;
        recommendationsDiv.appendChild(movieDiv);
    });
}

async function showMovieDetails(movieId) {
    const detailsUrl = `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`;
    const detailsResponse = await fetch(detailsUrl);
    const movie = await detailsResponse.json();

    document.getElementById('movieTitle').innerText = movie.title;
    document.getElementById('moviePoster').src = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
    document.getElementById('releaseDate').innerText = movie.release_date;
    document.getElementById('votecount').innerText = movie.vote_count;
    document.getElementById('popularity').innerText = movie.popularity;
    document.getElementById('voteAverage').innerText = movie.vote_average;
    document.getElementById('plot').innerText = movie.overview;

    const castList = document.getElementById('castList');
    castList.innerHTML = '';  // Clear previous cast details
    movie.credits.cast.slice(0, 5).forEach(castMember => {
        const castItem = document.createElement('li');
        castItem.innerText = `${castMember.name} as ${castMember.character}`;
        castList.appendChild(castItem);
    });

    // Show modal
    document.getElementById('movieModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('movieModal').style.display = 'none';
}

function resetInitialState() {
    movieInput.value = ''; // Clear the input box
    suggestions.innerHTML = ''; // Clear the suggestions
    document.getElementById('selectedMovieContainer').style.display = 'none' ; // Clear the selected movie display
    document.getElementById('recommendationsContainer').style.display = 'none'; // Clear the recommendations display
}
heading.addEventListener('click', resetInitialState);
