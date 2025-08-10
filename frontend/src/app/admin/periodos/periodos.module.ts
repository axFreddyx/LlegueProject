import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PeriodosPageRoutingModule } from './periodos-routing.module';

import { PeriodosPage } from './periodos.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PeriodosPageRoutingModule
  ],
  declarations: [PeriodosPage]
})
export class PeriodosPageModule {}
