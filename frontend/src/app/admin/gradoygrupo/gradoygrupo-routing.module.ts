import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GradoygrupoPage } from './gradoygrupo.page';

const routes: Routes = [
  {
    path: '',
    component: GradoygrupoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GradoygrupoPageRoutingModule {}
