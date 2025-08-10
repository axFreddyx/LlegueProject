import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LlegueGlobalPage } from './llegue-global.page';

const routes: Routes = [
  {
    path: '',
    component: LlegueGlobalPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LlegueGlobalPageRoutingModule {}
