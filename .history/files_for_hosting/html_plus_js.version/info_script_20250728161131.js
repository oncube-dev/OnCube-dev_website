const API_KEY = 'AIzaSyD_5JR2KFtfjfmsiwnueCyyJkvWOh__aOI';
const CHANNEL_ID = 'UCACwRQLU0Bq5yxijfnBPRfQ';

let startDate = null;

async function fetchLastVideoDate() {
    try {
        const apiUrl = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=1`;
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Ошибка запроса к YouTube API');
        const data = await response.json();
        const video = data.items && data.items[0];
        if (video && video.snippet && video.snippet.publishedAt) {
            startDate = new Date(video.snippet.publishedAt);
        } else {
            throw new Error('Не удалось получить дату видео');
        }
    } catch (e) {
        document.getElementById('timer').textContent = 'Ошибка загрузки даты видео!';
        console.error(e);
    }
}

function updateTimer() {
    if (!startDate) return;
    const now = new Date();
    let diff = now - startDate;
    if (diff < 0) diff = 0;
    let seconds = Math.floor(diff / 1000);
    const days = Math.floor(seconds / (24 * 3600));
    seconds %= 24 * 3600;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds %= 60;
    function plural(n, one, two, five) {
        n = Math.abs(n) % 100;
        let n1 = n % 10;
        if (n > 10 && n < 20) return five;
        if (n1 > 1 && n1 < 5) return two;
        if (n1 == 1) return one;
        return five;
    }
    const daysText = plural(days, 'день', 'дня', 'дней');
    const hoursText = plural(hours, 'час', 'часа', 'часов');
    const minutesText = plural(minutes, 'минута', 'минуты', 'минут');
    const secondsText = plural(seconds, 'секунда', 'секунды', 'секунд');
    document.getElementById('timer').textContent = `${days} ${daysText} ${hours} ${hoursText} ${minutes} ${minutesText} ${seconds} ${secondsText}`;
}

async function initTimer() {
    document.getElementById('timer').textContent = 'Загрузка даты видео...';
    await fetchLastVideoDate();
    if (startDate) {
        updateTimer();
        setInterval(updateTimer, 1000);
    }
}
initTimer();

// Тема
const toggleBtn = document.getElementById('theme-toggle');
let themePref = localStorage.getItem('theme');
let isDark = themePref === null ? true : themePref === 'dark';
setTheme(isDark);
toggleBtn.onclick = () => {
    isDark = !isDark;
    setTheme(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
};
function setTheme(isDark) {
    if (isDark) {
        document.body.classList.remove('light-theme');
        toggleBtn.textContent = '☀️';
    } else {
        document.body.classList.add('light-theme');
        toggleBtn.textContent = '🌙';
    }
}