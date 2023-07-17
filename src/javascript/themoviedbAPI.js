import axios from 'axios';

axios.defaults.baseURL = 'https://api.themoviedb.org/3';

export class ThemoviedbAPI {
  #API_KEY = '4e8b8f45c0829e2ad6672060c0ee58b0';
  totalMovies = 0;
  query = '';
  genres = [];

  constructor() {
    this.WATCH_KEY = 'Watched';
    this.QUEUE_KEY = 'Queue';
  }
  async fetchFavouritesMovies(page) {
    const params = new URLSearchParams({
      api_key: this.#API_KEY,
      page: page,
    });

    const { data } = await axios.get('/trending/movie/week', { params });
    return data;
  }

  async fetchMoviesByQuery(page) {
    const params = new URLSearchParams({
      api_key: this.#API_KEY,
      query: this.query,
      page: page,
    });

    const { data } = await axios.get('/search/movie', { params });
    return data;
  }

  async fetchMovieById(id) {
    const params = new URLSearchParams({
      api_key: this.#API_KEY,
    });
    return await fetch(
      `https://api.themoviedb.org/3/movie/${id}?${params}`
    ).then(response => {
      if (!response.ok) {
        throw new Error('Oops, there is no movie with that name');
      }
      return response.json();
    });
  }

  async fetchTrailerById(id) {
    const params = new URLSearchParams({
      api_key: this.#API_KEY,
    });
    return await fetch(
      `https://api.themoviedb.org/3/movie/${id}/videos?${params}`
    ).then(response => {
      if (!response.ok) {
        throw new Error('Oops, there is no movie with that name');
      }
      return response.json();
    });
  }

  async fetchGenres() {
    const params = new URLSearchParams({
      api_key: '663bd5fd8d905b7ce2d57e9867d3492e',
    });
    const allGenres = await axios.get('/genre/movie/list', { params });
    this.genres = allGenres.data.genres;

    return allGenres;
  }
}
