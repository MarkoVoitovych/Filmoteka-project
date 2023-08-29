import 'dotenv/config';
import Pagination from 'tui-pagination';
import 'tui-pagination/dist/tui-pagination.css';
import { Notify } from 'notiflix/build/notiflix-notify-aio';

import { refs } from './javascript/refs';
import { renderMarkup } from './javascript/renderMarkup';
import { themoviedbAPI } from './javascript/themoviedbAPI';
import { getItems } from './javascript/movie-modal';
import { spinnerPlay, spinnerStop } from './javascript/spiner';
import { callfooterModal } from './javascript/footerModal';
import { scrollFunction } from './javascript/scroll';
import { renderGenres } from './javascript/renderGenres';
import { paginOptions, paginOptionsLess } from './javascript/paginOptions';

export let allProducts = null;

let options = null;
if (window.screen.width <= 480) {
  options = paginOptionsLess;
} else {
  options = paginOptions;
}
const pagination = new Pagination(refs.paginationContainer, options);
const page = pagination.getCurrentPage();

try {
  spinnerPlay();
  startPage();
  refs.footerLink.addEventListener('click', callfooterModal);
  window.addEventListener('scroll', scrollFunction);
} catch (error) {
  Notify.failure('Ооps, something went wrong, please try again');
} finally {
  spinnerStop();
}

refs.formEl.addEventListener('submit', onSearchFormSubmit);
pagination.on('beforeMove', loadMoreFavouritesMovies);

pagination.on('afterMove', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

async function startPage() {
  await themoviedbAPI.fetchGenres();
  const trendMovies = await themoviedbAPI.fetchFavouritesMovies(page);

  pagination.reset(trendMovies.total_results);

  const markup = trendMovies.results
    .map(movie => {
      const genres = renderGenres(movie, [...themoviedbAPI.genres]);
      return renderMarkup(movie, genres);
    })
    .join('');
  refs.gallery.innerHTML = markup;
  allProducts = [...getItems(refs.gallery)];
}

async function onSearchFormSubmit(event) {
  event.preventDefault();
  themoviedbAPI.query = event.target.elements.search.value;
  if (!themoviedbAPI.query) {
    return '';
  }
  try {
    if (document.querySelector('.input-error')) {
      document.querySelector('.input-error').remove();
    }
    spinnerPlay();
    const searchMovies = await themoviedbAPI.fetchMoviesByQuery(page);
    const markup = searchMovies.results
      .map(movie => {
        const genres = renderGenres(movie, [...themoviedbAPI.genres]);
        return renderMarkup(movie, genres);
      })
      .join('');

    pagination.off('beforeMove', loadMoreFavouritesMovies);
    pagination.off('beforeMove', loadMoreMoviesByQuery);
    pagination.on('beforeMove', loadMoreMoviesByQuery);
    pagination.reset(searchMovies.total_results);

    refs.gallery.innerHTML = markup;
    allProducts = [...getItems(refs.gallery)];
    refs.noResultsTitle.classList.add('visually-hidden');
    refs.noResultsImg.classList.add('visually-hidden');
    refs.gallerySection.classList.remove('gallery-section--hidden');
    refs.btnUpWrapper.classList.remove('visually-hidden');

    if (searchMovies.total_results === 0) {
      refs.formEl.insertAdjacentHTML(
        'afterend',
        `<div class="input-error">
       Search result not successful. Enter the correct movie name  
      </div>`
      );
      refs.noResultsTitle.classList.remove('visually-hidden');
      refs.noResultsImg.classList.remove('visually-hidden');
      refs.gallerySection.classList.add('gallery-section--hidden');
      refs.btnUpWrapper.classList.add('visually-hidden');
      refs.paginationContainer.style.display = 'none';
    } else {
      refs.paginationContainer.style.display = 'block';
    }
  } catch (err) {
    Notify.failure('Ооps, something went wrong, please try again');
  } finally {
    spinnerStop();
  }
  event.target.reset();
}

async function loadMoreFavouritesMovies(event) {
  const currentPage = event.page;
  try {
    spinnerPlay();
    const genresIds = await themoviedbAPI.fetchGenres();
    const trendMovies = await themoviedbAPI.fetchFavouritesMovies(currentPage);

    const markup = trendMovies.results
      .map(movie => {
        const genres = renderGenres(movie, [...themoviedbAPI.genres]);
        return renderMarkup(movie, genres);
      })
      .join('');
    refs.gallery.innerHTML = markup;
    allProducts = [...getItems(refs.gallery)];
  } catch (error) {
    Notify.failure('Ооps, something went wrong, please try again');
  } finally {
    spinnerStop();
  }
}

async function loadMoreMoviesByQuery(event) {
  const currentPage = event.page;
  try {
    spinnerPlay();
    const searchMovies = await themoviedbAPI.fetchMoviesByQuery(currentPage);
    const markup = searchMovies.results
      .map(movie => {
        const genres = renderGenres(movie, [...themoviedbAPI.genres]);
        return renderMarkup(movie, genres);
      })
      .join('');
    refs.gallery.innerHTML = markup;
    allProducts = [...getItems(refs.gallery)];
  } catch (error) {
    Notify.failure('Ооps, something went wrong, please try again');
  } finally {
    spinnerStop();
  }
}

const Theme = {
  LIGHT: 'light-theme',
  DARK: 'dark-theme',
};

const STORAGE_KEY = 'themeKey';

const checkBox = document.querySelector('.theme-switch__toggle');
const body = document.querySelector('body');

checkBox.addEventListener('change', onChange);
isTheme();

function onChange(e) {
  if (e.target.checked) {
    body.classList.remove('ligth-theme');
    body.classList.add('dark-theme');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Theme.DARK));
  } else {
    body.classList.remove('dark-theme');
    body.classList.add('ligth-theme');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Theme.LIGHT));
  }
}

function isTheme() {
  const saveTheme = localStorage.getItem(STORAGE_KEY);
  if (!saveTheme) {
    body.classList.add('ligth-theme');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Theme.LIGHT));
  } else {
    const parseTheme = JSON.parse(saveTheme);
    if (parseTheme === 'dark-theme') {
      body.classList.add('dark-theme');
      checkBox.checked = true;
    }
  }
}
