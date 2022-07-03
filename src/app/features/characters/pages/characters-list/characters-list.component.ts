import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { map, Observable, combineLatest, startWith } from 'rxjs';
import { ISelectOption } from '../../models/select-option.model';
import { IPeopleResponseItem } from '../../models/swapi-response.model';
import { SwapiService } from '../../services/swapi.service';

const AllOption: ISelectOption = {
  value: "All",
  label: "All"
}

@Component({
  selector: 'app-characters-list',
  templateUrl: './characters-list.component.html',
  styleUrls: ['./characters-list.component.scss']
})
export class CharactersListComponent {
  public peopleObservable: Observable<IPeopleResponseItem[]>;
  public speciesOptionsObservable: Observable<ISelectOption[]>;
  public filmsOptionsObservable: Observable<ISelectOption[]>;
  public dateRangeObservable: Observable<DateRange>;
  public filters: FormGroup;

  constructor(private swapiService: SwapiService, private fb: FormBuilder) {
    this.filters = this.getFilters();
    this.peopleObservable = this.getPeopleObservable();
    this.speciesOptionsObservable = this.getSpeciesOptionsObservable();
    this.filmsOptionsObservable = this.getFilmsOptionsObservable();
    this.dateRangeObservable = this.getDateRangeObservable();
  }

  private getPeopleObservable() {
    return combineLatest([
      this.swapiService.getPeopleObservable(),
      this.filters.valueChanges.pipe(startWith(this.filters.value))
    ]).pipe(map(([people, { film, specie, dateRange }]) => {
      return people.filter(person =>
        (film === AllOption.value || person.films.includes(film))
        && (specie === AllOption.value || person.species.includes(specie))
      );
    }));
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

  private getDateRangeObservable(): Observable<DateRange> {
    return this.swapiService.getPeopleObservable().pipe(
      map(people => {
        const dates = [...new Set(people.map(person => person.birth_year))].map(date => {
          const dateNumber = parseInt(date.replace("BBY", "").replace("ABY", "")) * (date.includes("BBY") ? -1 : 1);
          return {
            label: date,
            value: dateNumber
          };
        }).sort((a, b) => a.value - b.value);
        return {
          min: dates[0],
          max: dates[dates.length - 1]
        }
      })
    );
  }

  private getFilters(): FormGroup {
    return this.fb.group({
      film: AllOption.value,
      specie: AllOption.value,
      dateRange: ""
    });
  }
}

interface DateRange {
  min: ISelectOption | undefined;
  max: ISelectOption | undefined;
}