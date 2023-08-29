import { refs } from './refs';
import { allProducts } from '/src/index';
import { createModalMarkUp } from './renderModalMarkUp';
import { themoviedbAPI } from './themoviedbAPI';
import BigPicture from 'bigpicture';
import { set, get } from './localStorageUse';
import { spinnerPlay, spinnerStop } from './spiner';

export function getItems(parent) {
  const lightboxedCard = parent.childNodes;
  const allProducts = [...lightboxedCard];
  lightboxedCard.forEach(item => item.addEventListener('click', openLightbox));
  return allProducts;
}

function getSelectedItem(event, array) {
  const selectedProduct = array.find(
    item => item.dataset.id === event.currentTarget.dataset.id
  );
  return selectedProduct;
}

function openLightbox(event) {
  event.preventDefault();
  let innerElements = [];
  [...event.currentTarget.children].forEach(el =>
    innerElements.push([...el.children])
  );
  innerElements = innerElements.flatMap(el => el);
  if (
    event.target === event.currentTarget ||
    [...event.currentTarget.children].includes(event.target) ||
    innerElements.includes(event.target)
  ) {
    onFilmCardClick(event);
  }
  return;
}

async function onFilmCardClick(event) {
  const selectedProduct = await getSelectedItem(event, allProducts);

  const filmId = selectedProduct.dataset.id;
  try {
    spinnerPlay();
    themoviedbAPI.fetchMovieById(filmId).then(result => {
      const data = result;

      const posterPath = data.poster_path
        ? `https://image.tmdb.org/t/p/w300${data.poster_path}`
        : `https://astoriamuseums.org/wp-content/uploads/2020/10/OFM-poster-not-available.png`;
      const releaseYear = new Date(Date.parse(data.release_date)).getFullYear();
      const filmData = {
        id: data.id,
        poster: posterPath,
        title: data.title.replaceAll("'", '`'),
        originalTitle: data.original_title.replaceAll("'", '`'),
        genres: [],
        popularity: data.popularity.toFixed(1),
        overview: data.overview.replaceAll("'", '`'),
        vote_average: data.vote_average.toFixed(1),
        vote_count: data.vote_count,
        release_date: releaseYear,
      };

      const stringifiedJSONFilmData = JSON.stringify(filmData);
      data.genres.forEach(genre => {
        filmData.genres.push(genre.name);
      });
      filmData.genres = filmData.genres.join(', ');

      createModalMarkUp(filmData, stringifiedJSONFilmData);

      getTrailer(filmId);

      const addToWatchedBtn = document.querySelector(
        '.lightbox-modal__watched-button'
      );

      const addToQuequeBtn = document.querySelector(
        '.lightbox-modal__queque-button'
      );
      checkLocalStorage(
        themoviedbAPI.WATCH_KEY,
        filmData,
        addToWatchedBtn,
        'Added to watched'
      );
      checkLocalStorage(
        themoviedbAPI.QUEUE_KEY,
        filmData,
        addToQuequeBtn,
        'Added to queque'
      );

      addToWatchedBtn.addEventListener('click', onAddToWatchedClick);
      addToQuequeBtn.addEventListener('click', onAddToQuequeClick);
    });
  } catch (error) {
    Notify.failure('Ооps, something went wrong, please try again');
  } finally {
    spinnerStop();
  }
}

function getTrailer(filmId) {
  try {
    themoviedbAPI.fetchTrailerById(filmId).then(result => {
      const trailers = result.results;
      if (trailers.length > 0) {
        const trailerBtn = document.querySelector('.lightbox-modal__trailer');
        trailerBtn.classList.remove('is-hidden');
        const officialTrailer = trailers.find(
          el =>
            el.name === 'Official Trailer' ||
            el.name.includes('Official') ||
            el.name[0]
        );
        const trailerKey = officialTrailer.key;

        trailerBtn.addEventListener('click', ontrailerBtnClick);

        function ontrailerBtnClick(e) {
          BigPicture({
            el: e.target,
            ytSrc: `${trailerKey}`,
          });
        }
      }
    });
  } catch {
    er => {
      console.log(er);
    };
  }
}

function onAddToWatchedClick(event) {
  event.preventDefault();
  event.target.textContent = 'Added to watched';
  event.target.disabled = true;

  set(themoviedbAPI.WATCH_KEY, event.target.dataset.id);
}

function onAddToQuequeClick(event) {
  event.preventDefault();
  event.target.textContent = 'Added to queque';
  event.target.disabled = true;
  set(themoviedbAPI.QUEUE_KEY, event.target.dataset.id);
}

function checkLocalStorage(key, filmData, btn, btnText) {
  const locStorage = get(key);
  const currentFilm = filmData;
  const includesFilm = locStorage.find(film => film.id === currentFilm.id);

  if (includesFilm) {
    btn.textContent = `${btnText}`;
    btn.disabled = true;
  }
}
