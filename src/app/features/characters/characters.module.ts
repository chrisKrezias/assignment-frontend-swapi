import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { CharactersRoutingModule } from './characters-routing.module';
import { CharactersListComponent } from './pages/characters-list/characters-list.component';
import { SwapiService } from './services/swapi.service';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    CharactersListComponent
  ],
  imports: [
    CommonModule,
    CharactersRoutingModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [
    SwapiService
  ]
})
export class CharactersModule { }
