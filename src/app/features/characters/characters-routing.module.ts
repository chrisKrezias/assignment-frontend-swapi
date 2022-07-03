import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CharacterDetailsComponent } from './pages/character-details/character-details.component';
import { CharactersListComponent } from './pages/characters-list/characters-list.component';

const routes: Routes = [
  { path: '', component: CharactersListComponent },
  { path: ':id', component: CharacterDetailsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CharactersRoutingModule { }
