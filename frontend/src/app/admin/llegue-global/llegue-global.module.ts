import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LlegueGlobalPageRoutingModule } from './llegue-global-routing.module';

import { LlegueGlobalPage } from './llegue-global.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LlegueGlobalPageRoutingModule
  ],
  declarations: [LlegueGlobalPage]
})
export class LlegueGlobalPageModule {}
