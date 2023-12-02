// Fetch GitHub data
async function fetchGitHubData(username) {
    try {
        const response = await fetch(`https://api.github.com/users/${username}/repos`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching GitHub data:', error);
    }
}

// Render statistics
function renderStats(stats) {
    const formatMostProductiveTimeOfDay = (hour) => {
        const timeOfDay = hour < 12 ? 'Morning' : (hour < 18 ? 'Afternoon' : 'Evening');
        return `${timeOfDay} (${hour % 12 || 12}:00 - ${(hour % 12) + 1}:00)`;
    };

    const formatDayOfWeek = (day) => {
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return daysOfWeek[day];
    };

    const formatMonthSeason = (month) => {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const seasons = {
            'Winter': [11, 0, 1],
            'Spring': [2, 3, 4],
            'Summer': [5, 6, 7],
            'Autumn': [8, 9, 10]
        };

        const season = Object.entries(seasons).find(([season, monthsInSeason]) => monthsInSeason.includes(month))[0];

        return `${months[month]} (${season})`;
    };
    
    return `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div class="p-4 bg-red-600 text-white rounded">
                <h2 class="text-lg font-semibold mb-2">Total Repositories</h2>
                <p class="text-3xl font-bold">${stats.total}</p>
            </div>
            <div class="p-4 bg-green-800 text-white rounded">
                <h2 class="text-lg font-semibold mb-2">Repositories in ${stats.year}</h2>
                <p class="text-3xl font-bold">${stats.reposInYear}</p>
            </div>
            <div class="p-4 bg-red-600 text-white rounded">
                <h2 class="text-lg font-semibold mb-2">Most Starred Repository</h2>
                <p class="text-3xl font-bold">${stats.mostStarredRepo}</p>
            </div>
            <div class="p-4 bg-green-800 text-white rounded">
                <h2 class="text-lg font-semibold mb-2">Languages Used</h2>
                <p class="text-3xl font-bold">${stats.languages}</p>
            </div>
            <div class="p-4 bg-red-600 text-white rounded">
                <h2 class="text-lg font-semibold mb-2">Most Used Language</h2>
                <p class="text-3xl font-bold">${stats.mostUsedLanguage}</p>
            </div>
            <div class="p-4 bg-green-800 text-white rounded">
                <h2 class="text-lg font-semibold mb-2">First Language Used</h2>
                <p class="text-3xl font-bold">${stats.firstLanguageUsed}</p>
            </div>
            <div class="p-4 bg-red-600 text-white rounded">
                <h2 class="text-lg font-semibold mb-2">External Repos Contributed To</h2>
                <p class="text-3xl font-bold">${stats.externalReposContributedTo}</p>
            </div>
            <div class="p-4 bg-green-800 text-white rounded">
                <h2 class="text-lg font-semibold mb-2">Longest Streak (Days)</h2>
                <p class="text-3xl font-bold">${stats.longestStreak}</p>
            </div>
            <div class="p-4 bg-red-600 text-white rounded">
                <h2 class="text-lg font-semibold mb-2">Most Productive Time of the Day</h2>
                <p class="text-3xl font-bold">${formatMostProductiveTimeOfDay(stats.mostProductiveTimeOfDay)}</p>
            </div>
            <div class="p-4 bg-green-800 text-white rounded">
                <h2 class="text-lg font-semibold mb-2">Most Productive Day of the Week</h2>
                <p class="text-3xl font-bold">${formatDayOfWeek(stats.mostProductiveDayOfWeek)}</p>
            </div>
            <div class="p-4 bg-red-600 text-white rounded">
                <h2 class="text-lg font-semibold mb-2">Most Productive Month/Season</h2>
                <p class="text-3xl font-bold">${formatMonthSeason(stats.mostProductiveMonthSeason)}</p>
            </div>
        </div>
    `;
}

// Render Year in Review
async function renderYearInReview() {
    const inputElement = document.getElementById('githubUsername');
    const username = inputElement.value.trim();

    if (username === '') {
        return;
    }

    const repositories = await fetchGitHubData(username);

    // Display some creative stats
    const totalRepos = repositories.length;
    const currentYear = new Date().getFullYear();
    const currentYearRepos = repositories.filter(repo => {
        const createdAtYear = new Date(repo.created_at).getFullYear();
        const updatedAtYear = new Date(repo.updated_at).getFullYear();
        return createdAtYear === currentYear || updatedAtYear === currentYear;
    });

    const languageStats = currentYearRepos.reduce((acc, repo) => {
        const language = repo.language;
        if (language) {
            acc.languages[language] = (acc.languages[language] || 0) + 1;
        }
        return acc;
    }, { languages: {} });

    const mostUsedLanguage = Object.entries(languageStats.languages).reduce((max, [language, count]) => {
        return count > max.count ? { language, count } : max;
    }, { language: '', count: 0 }).language;

    const firstLanguageUsed = currentYearRepos
        .filter(repo => repo.language)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0]?.language || 'N/A';

    const externalReposContributedTo = new Set(currentYearRepos
        .filter(repo => repo.fork && repo.source && repo.source.owner.login !== username)
        .map(repo => repo.source.full_name)).size;

    const longestStreak = currentYearRepos.length > 0 ?
        Math.max(...currentYearRepos.map(repo => new Date(repo.pushed_at).getTime())) : 0;

    // Most Productive Time of the Day Calculation
    const productiveTimeOfDay = currentYearRepos.reduce((acc, repo) => {
        const hour = new Date(repo.created_at).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
    }, {});

    const mostProductiveTimeOfDay = Object.entries(productiveTimeOfDay).reduce((max, [hour, count]) => {
        return count > max.count ? { hour, count } : max;
    }, { hour: '', count: 0 }).hour;

    // Most Productive Day of the Week Calculation
    const productiveDayOfWeek = currentYearRepos.reduce((acc, repo) => {
        const dayOfWeek = new Date(repo.created_at).getDay();
        acc[dayOfWeek] = (acc[dayOfWeek] || 0) + 1;
        return acc;
    }, {});

    const mostProductiveDayOfWeek = Object.entries(productiveDayOfWeek).reduce((max, [day, count]) => {
        return count > max.count ? { day, count } : max;
    }, { day: '', count: 0 }).day;

    // Most Productive Month/Season Calculation
    const productiveMonthSeason = currentYearRepos.reduce((acc, repo) => {
        const month = new Date(repo.created_at).getMonth();
        acc[month] = (acc[month] || 0) + 1;
        return acc;
    }, {});

    const mostProductiveMonthSeason = Object.entries(productiveMonthSeason).reduce((max, [month, count]) => {
        return count > max.count ? { month, count } : max;
    }, { month: '', count: 0 }).month;

    // Most Starred Repository Calculation
    const mostStarredRepo = currentYearRepos.reduce((max, repo) => {
        return repo.stargazers_count > max.stars ? { name: repo.name, stars: repo.stargazers_count } : max;
    }, { name: '', stars: 0 }).name;

    const statsHtml = renderStats({
        total: totalRepos,
        year: currentYear,
        reposInYear: currentYearRepos.length,
        languages: Object.keys(languageStats.languages).length,
        mostUsedLanguage,
        firstLanguageUsed,
        externalReposContributedTo,
        longestStreak: longestStreak > 0 ? Math.floor((Date.now() - longestStreak) / (1000 * 60 * 60 * 24)) : 0,
        mostProductiveTimeOfDay,
        mostProductiveDayOfWeek,
        mostProductiveMonthSeason,
        mostStarredRepo,
    });

    const htmlContent = `
        <h1 class="text-3xl font-bold mb-4 text-pink-600">${username}'s GitHub Year in Review (${currentYear})</h1>
        ${statsHtml}
    `;

    // Show the dynamic content and hide the initial card
    document.getElementById('initialCard').classList.add('hidden');
    document.getElementById('app').innerHTML = htmlContent;
}

// Event listener for the submit button
document.getElementById('submitBtn').addEventListener('click', renderYearInReview);

