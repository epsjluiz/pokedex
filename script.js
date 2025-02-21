class PokeApi {
    static API_URL = 'https://pokeapi.co/api/v2';
    static ITEMS_PER_PAGE = 20;
    static MAX_POKEMON = 151;

    static convertPokeApiToPokemon(pokeDetail) {
        return {
            id: pokeDetail.id,
            name: pokeDetail.name,
            types: pokeDetail.types.map(({type}) => type.name),
            image: pokeDetail.sprites.front_default
        };
    }

    static async getPokemonDetails(pokemon) {
        try {
            const response = await fetch(pokemon.url || `${this.API_URL}/pokemon/${pokemon}`);
            const data = await response.json();
            return this.convertPokeApiToPokemon(data);
        } catch (error) {
            console.error('Error fetching Pokemon details:', error);
            return null;
        }
    }

    static async getPokemons(offset = 0) {
        const limit = this.ITEMS_PER_PAGE;
        const url = `${this.API_URL}/pokemon?offset=${offset}&limit=${limit}`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            const detailRequests = data.results.map(pokemon => 
                this.getPokemonDetails.bind(this)(pokemon)
            );
            const pokemonDetails = await Promise.all(detailRequests);
            return pokemonDetails.filter(pokemon => pokemon !== null);
        } catch (error) {
            console.error('Error fetching Pokemon:', error);
            return [];
        }
    }
}

class PokemonUI {
    constructor() {
        this.pokemonList = [];
        this.currentOffset = 0;
        this.isLoading = false;

        this.pokedexElement = document.getElementById('pokedex');
        this.searchInput = document.getElementById('search');
        this.loadMoreButton = document.getElementById('loadMore');

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.searchInput.addEventListener('input', () => this.handleSearch());
        this.loadMoreButton.addEventListener('click', () => this.loadMorePokemons());
    }

    createPokemonCard(pokemon) {
        return `
            <div class="pokemon-card ${pokemon.types[0]}">
                <img src="${pokemon.image}" alt="${pokemon.name}">
                <h3>${pokemon.name}</h3>
                <p class="id">#${String(pokemon.id).padStart(3, '0')}</p>
                <div class="types">
                    ${pokemon.types.map(type => `<span class="type ${type}">${type}</span>`).join('')}
                </div>
            </div>
        `;
    }

    displayPokemons(pokemons) {
        const pokemonCards = pokemons.map(this.createPokemonCard).join('');
        this.pokedexElement.innerHTML = pokemonCards;
    }

    async handleSearch() {
        const searchTerm = this.searchInput.value.toLowerCase();
        const filteredPokemons = this.pokemonList.filter(pokemon => 
            pokemon.name.toLowerCase().includes(searchTerm) ||
            pokemon.id.toString().includes(searchTerm)
        );
        this.displayPokemons(filteredPokemons);
    }

    async loadMorePokemons() {
        if (this.isLoading || this.currentOffset >= PokeApi.MAX_POKEMON) return;

        try {
            this.isLoading = true;
            this.loadMoreButton.disabled = true;
            this.loadMoreButton.textContent = 'Loading...';

            const newPokemons = await PokeApi.getPokemons(this.currentOffset);
            this.pokemonList = [...this.pokemonList, ...newPokemons];
            this.currentOffset += PokeApi.ITEMS_PER_PAGE;

            this.displayPokemons(this.pokemonList);
        } catch (error) {
            console.error('Error loading more pokemon:', error);
        } finally {
            this.isLoading = false;
            this.loadMoreButton.disabled = false;
            this.loadMoreButton.textContent = 'Load More';
            this.loadMoreButton.style.display = 
                this.currentOffset >= PokeApi.MAX_POKEMON ? 'none' : 'block';
        }
    }

    init() {
        this.loadMorePokemons();
    }
}

const pokemonUI = new PokemonUI();
pokemonUI.init();
