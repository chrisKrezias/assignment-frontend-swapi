import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom, Observable, Subject, bufferWhen, map, shareReplay, filter, pipe } from 'rxjs';
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
      this.peopleObservable = this.getPagesItems<IPeopleResponseItem>(SwapiRequestType.People);
    }

    return this.peopleObservable;
  }

  public getSpeciesObservable(): Observable<ISpeciesResponseItem[]> {
    if (!this.speciesObservable) {
      this.speciesObservable = this.getPagesItems<ISpeciesResponseItem>(SwapiRequestType.Species);
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
      this.filmsObservable = this.getPagesItems<IFilmResponseItem>(SwapiRequestType.Films);
    }

    return this.filmsObservable;
  }

  public getPersonObservable(characterUrl: string): Observable<IPeopleResponseItem> {
    return this.http.get<IPeopleResponseItem>(characterUrl);
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
