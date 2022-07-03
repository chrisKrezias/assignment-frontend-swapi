import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';
import { IPeopleResponseItem } from '../../models/swapi-response.model';
import { SwapiService } from '../../services/swapi.service';

@Component({
  selector: 'app-character-details',
  templateUrl: './character-details.component.html',
  styleUrls: ['./character-details.component.scss']
})
export class CharacterDetailsComponent {
  public personObservable: Observable<IPeopleResponseItem | null>;

  constructor(private swapiService: SwapiService, private route: ActivatedRoute) {
    this.personObservable = this.getPersonObservable();
  }

  private getPersonObservable() {
    return this.route.paramMap.pipe(
      switchMap(paramMap => {
        const id = paramMap.get("id");
        return id ? this.swapiService.getPersonObservable(id) : of(null);
      })
    )
  }
}