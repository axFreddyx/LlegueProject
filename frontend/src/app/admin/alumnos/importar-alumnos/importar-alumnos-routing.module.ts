import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ImportarAlumnosPage } from './importar-alumnos.page';

const routes: Routes = [
  {
    path: '',
    component: ImportarAlumnosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ImportarAlumnosPageRoutingModule {}
