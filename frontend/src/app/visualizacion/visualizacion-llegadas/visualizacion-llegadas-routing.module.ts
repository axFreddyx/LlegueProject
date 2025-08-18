import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VisualizacionLlegadasPage } from './visualizacion-llegadas.page';

const routes: Routes = [
  {
    path: '',
    component: VisualizacionLlegadasPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VisualizacionLlegadasPageRoutingModule {}
