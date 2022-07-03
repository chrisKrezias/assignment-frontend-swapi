export interface ISwapiResponse {
    previous: string;
    next: string;
    results: (IPeopleResponseItem | IStarshipResponseItem | IFilmResponseItem)[];
}

export interface IPeopleResponseItem {
    birth_year: string;
    name: string;
    species: string[];
    starships: string[];
    films: string[];
    url: string;
    id?: string;
}

export interface ISpeciesResponseItem {
    name: string;
    url: string;
}

export interface IStarshipResponseItem {
    name: string;
    url: string;
}

export interface IFilmResponseItem {
    title: string;
    episode_id: number;
    url: string;
}