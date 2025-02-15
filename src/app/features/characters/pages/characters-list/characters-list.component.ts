import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { map, Observable, combineLatest, startWith, tap, Subject, BehaviorSubject } from 'rxjs';
import { ISelectOption } from '../../models/select-option.model';
import { IPeopleListItem } from '../../models/swapi-response.model';
import { SwapiService } from '../../services/swapi.service';

const AllOption: ISelectOption = {
  value: "All",
  label: "All"
}

const dateParser = (date: string) => parseFloat(date.replace("BBY", "").replace("ABY", "")) * (date.includes("BBY") ? -1 : 1);

@Component({
  selector: 'app-characters-list',
  templateUrl: './characters-list.component.html',
  styleUrls: ['./characters-list.component.scss']
})
export class CharactersListComponent {
  public peopleObservable: Observable<IPeopleListItem[]>;
  public peoplePageObservable: Observable<IPeopleListItem[]>;
  public speciesOptionsObservable: Observable<ISelectOption[]>;
  public filmsOptionsObservable: Observable<ISelectOption[]>;
  public fromBirthDateOptionsObservable: Observable<ISelectOption[]>;
  public toBirthDateOptionsObservable: Observable<ISelectOption[]>;
  public filters: FormGroup;
  public isSidebarVisible: boolean;
  public showClearAllIcon = false;
  public showTooltip = false;
  public paginationObservable: Observable<number[]>;
  public activePageSubject = new BehaviorSubject<number>(1);

  private initialFilterValues = {
    film: AllOption.value,
    specie: AllOption.value,
    fromBirthDate: AllOption.value,
    toBirthDate: AllOption.value
  };
  private MAX_PEOPLE_PER_PAGE = 12;

  constructor(private swapiService: SwapiService, private fb: FormBuilder) {
    this.filters = this.getFilters();
    this.peopleObservable = this.getPeopleObservable();
    this.peoplePageObservable = this.getPeoplePageObservable();
    this.speciesOptionsObservable = this.getSpeciesOptionsObservable();
    this.filmsOptionsObservable = this.getFilmsOptionsObservable();
    this.fromBirthDateOptionsObservable = this.getFromBirthDatesOptionsObservable();
    this.toBirthDateOptionsObservable = this.getToBirthDatesOptionsObservable();
    this.paginationObservable = this.getPaginationObservable();
    this.isSidebarVisible = window.innerWidth >= 1024;
  }

  public clearFilters(): void {
    this.filters.setValue(this.initialFilterValues)
  }

  public setActivePage(page: number): void {
    this.activePageSubject.next(page);
  }

  private getPeopleObservable(): Observable<IPeopleListItem[]> {
    return combineLatest([
      this.swapiService.getPeopleObservable(),
      this.filters.valueChanges.pipe(
        tap(values => {
          this.showClearAllIcon = !Object.values(values).every(value => value === AllOption.value);
          this.activePageSubject.next(1)
        }),
        startWith(this.filters.value))
    ]).pipe(map(([people, { film, specie, fromBirthDate, toBirthDate }]) => {
      return people.filter(person => {
        const birthDate = dateParser(person.birth_year);
        return (film === AllOption.value || person.films.includes(film))
          && (specie === AllOption.value || person.species.includes(specie))
          && ((isNaN(birthDate) && isNaN(fromBirthDate)) || fromBirthDate === AllOption.value || birthDate >= fromBirthDate)
          && (toBirthDate === AllOption.value || birthDate <= toBirthDate)
      });
    }));
  }

  private getPeoplePageObservable(): Observable<IPeopleListItem[]> {
    return combineLatest([
      this.peopleObservable,
      this.activePageSubject
    ]).pipe(
      map(([people, page]) => {
        const start: number = (page - 1) * this.MAX_PEOPLE_PER_PAGE;
        const end: number = start + this.MAX_PEOPLE_PER_PAGE;
        return people.slice(start, end);
      })
    )
  }

  private getSpeciesOptionsObservable(): Observable<ISelectOption[]> {
    return combineLatest([
      this.swapiService.getSpeciesObservable(),
      this.peopleObservable
    ]).pipe(
      map(([species, people]) => {
        const availableSpeciesSet = new Set(people.flatMap(person => person.species));
        return [
          AllOption,
          ...species.reduce((acc, specie) => {

            if (availableSpeciesSet.has(specie.url)) {
              acc.push({
                label: specie.name,
                value: specie.url
              });
            }

            return acc
          }, [] as ISelectOption[])
        ]
      })
    );
  }

  private getFilmsOptionsObservable(): Observable<ISelectOption[]> {
    return combineLatest([
      this.swapiService.getFilmsObservable(),
      this.peopleObservable
    ]).pipe(
      map(([films, people]) => {
        const availableFilmsSet = new Set(people.flatMap(person => person.films));
        return [
          AllOption,
          ...films.reduce((acc, film) => {

            if (availableFilmsSet.has(film.url)) {
              acc.push({
                label: film.title,
                value: film.url
              });
            }

            return acc
          }, [] as ISelectOption[])
        ]
      })
    );
  }

  private getFromBirthDatesOptionsObservable(): Observable<ISelectOption[]> {
    return this.peopleObservable.pipe(
      map(people => {
        const options = [...new Set(people.map(person => person.birth_year))].map(date => ({
          label: date,
          value: dateParser(date)
        })).sort((a, b) => {
          if (isNaN(a.value)) return 1;
          if (isNaN(b.value)) return -1;
          return a.value - b.value
        });
        return [
          AllOption,
          ...options
        ];
      })
    );
  }

  private getToBirthDatesOptionsObservable(): Observable<ISelectOption[]> {
    return combineLatest([
      this.fromBirthDateOptionsObservable,
      this.filters.controls["fromBirthDate"].valueChanges.pipe(startWith(this.filters.controls["fromBirthDate"].value))
    ]).pipe(map(([options, value]) => {
      const valueOptionIndex = options.findIndex(option => option.value.toString() === value);
      return [
        AllOption,
        ...options.slice(valueOptionIndex + 1).filter(option => !isNaN(parseFloat(option.value.toString())))
      ];
    }));
  }

  private getFilters(): FormGroup {
    return this.fb.group(this.initialFilterValues);
  }

  private getPaginationObservable() {
    return this.peopleObservable.pipe(
      map(people => {
        const numberOfPages = Math.ceil(people.length / this.MAX_PEOPLE_PER_PAGE);
        return Array.from(Array(numberOfPages).keys()).map(key => key + 1);
      })
    )
  }
}