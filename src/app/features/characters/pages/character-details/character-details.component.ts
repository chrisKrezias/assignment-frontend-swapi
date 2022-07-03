import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, Observable, of, switchMap, throwError } from 'rxjs';
import { IPeopleResponseItem } from '../../models/swapi-response.model';
import { SwapiService } from '../../services/swapi.service';

@Component({
  selector: 'app-character-details',
  templateUrl: './character-details.component.html',
  styleUrls: ['./character-details.component.scss']
})
export class CharacterDetailsComponent {
  public personObservable: Observable<IPeopleResponseItem | null>;
  public showError = false;

  constructor(private swapiService: SwapiService, private route: ActivatedRoute, private router: Router) {
    this.personObservable = this.getPersonObservable();
  }

  private getPersonObservable() {
    return this.route.paramMap.pipe(
      switchMap(paramMap => {
        const id = paramMap.get("id");
        return id ? this.swapiService.getPersonObservable(id) : of(null);
      }),
      catchError((error) => {
        this.router.navigate(["404"])
        return throwError(() => error);
      })
    )
  }
}