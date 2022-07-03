import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, bufferWhen, map, shareReplay, filter, pipe, switchMap, zip, of, lastValueFrom } from 'rxjs';
import { IFilmResponseItem, ISwapiResponse, IPeopleResponseItem, IStarshipResponseItem, ISpeciesResponseItem } from '../models/swapi-response.model';

enum SwapiRequestType {
  People,
  Starships,
  Films,
  Species
}

const SWAPI_URL = "https://swapi.dev/api";

const ApiUrlMap: { [key in SwapiRequestType]: string } = {
  [SwapiRequestType.People]: `${SWAPI_URL}/people`,
  [SwapiRequestType.Species]: `${SWAPI_URL}/species`,
  [SwapiRequestType.Starships]: `${SWAPI_URL}/starships`,
  [SwapiRequestType.Films]: `${SWAPI_URL}/films`,
};

@Injectable()
export class SwapiService {
  private pagesReceivedSubject: Subject<SwapiRequestType>;
  private peopleObservable!: Observable<IPeopleResponseItem[]>;
  private speciesObservable!: Observable<ISpeciesResponseItem[]>;
  private starshipsObservable!: Observable<IStarshipResponseItem[]>;
  private filmsObservable!: Observable<IFilmResponseItem[]>;

  constructor(private http: HttpClient) {
    this.pagesReceivedSubject = new Subject<SwapiRequestType>();
  }

  public getPeopleObservable(): Observable<IPeopleResponseItem[]> {
    if (!this.peopleObservable) {
      this.peopleObservable = this.getPagesItems<IPeopleResponseItem>(SwapiRequestType.People).pipe(
        map(people =>
          people.sort((a, b) =>
            (a.name > b.name) ? 1 : -1
          ).map(person => ({
            ...person,
            id: person.url.replace("https://swapi.dev/api/people/", "").replace("/", "")
          }))
        )
      );
    }

    return this.peopleObservable;
  }

  public getSpeciesObservable(): Observable<ISpeciesResponseItem[]> {
    if (!this.speciesObservable) {
      this.speciesObservable = this.getPagesItems<ISpeciesResponseItem>(SwapiRequestType.Species).pipe(
        map(species => species.sort((a, b) =>
          (a.name > b.name) ? 1 : -1
        ))
      );
    }

    return this.speciesObservable;
  }

  public getStarshipsObservable(): Observable<IStarshipResponseItem[]> {
    if (!this.starshipsObservable) {
      this.starshipsObservable = this.getPagesItems<IStarshipResponseItem>(SwapiRequestType.Starships);
    }

    return this.starshipsObservable;
  }

  public getFilmsObservable(): Observable<IFilmResponseItem[]> {
    if (!this.filmsObservable) {
      this.filmsObservable = this.getPagesItems<IFilmResponseItem>(SwapiRequestType.Films).pipe(
        map(films => films.sort((a, b) =>
          a.episode_id - b.episode_id
        ))
      );
    }

    return this.filmsObservable;
  }

  public getPersonObservable(id: string): Observable<IPeopleResponseItem> {
    const url = `${ApiUrlMap[SwapiRequestType.People]}/${id}`
    return this.http.get<IPeopleResponseItem>(url).pipe(
      switchMap(person => {
        console.log(person)
        const speciesObservables = person.species.length ? zip(...person.species.map(specie => this.http.get<ISpeciesResponseItem>(specie))) : of([]);
        const filmsObservables = person.films.length ? zip(...person.films.map(film => this.http.get<IFilmResponseItem>(film))) : of([]);
        const starshipObservables = person.starships.length ? zip(...person.starships.map(starship => this.http.get<IStarshipResponseItem>(starship))) : of([]);
        return zip(speciesObservables, filmsObservables, starshipObservables, of(person))
      }),
      map(([species, films, starships, person]) => ({
        ...person,
        species: species.map(specie => specie.name),
        films: films.map(film => film.title),
        starships: starships.map(starship => starship.name),
      }))
    );
  }

  private getPagesItems<T>(type: SwapiRequestType): Observable<T[]> {
    const apiUrl = ApiUrlMap[type];
    const subject = new Subject<T>();
    const observable = subject.asObservable().pipe(
      bufferWhen(() => this.pagesReceivedSubject.pipe(filter(receivedType => receivedType === type))),
      map(collection => collection.flatMap(item => item)),
      shareReplay(1)
    ) as Observable<T[]>;
    this.getPagesRecursion(apiUrl, type, subject);
    return observable;
  }

  private async getPagesRecursion(url: string, type: SwapiRequestType, subject: Subject<any>): Promise<void> {
    const response = await lastValueFrom<ISwapiResponse>(this.http.get<ISwapiResponse>(url));
    subject.next(response.results);

    if (response.next) {
      this.getPagesRecursion(response.next, type, subject);
    } else {
      this.pagesReceivedSubject.next(type);
    }
  }
}
