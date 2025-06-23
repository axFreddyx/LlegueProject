import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GradoygrupoPageRoutingModule } from './gradoygrupo-routing.module';

import { GradoygrupoPage } from './gradoygrupo.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GradoygrupoPageRoutingModule
  ],
  declarations: [GradoygrupoPage]
})
export class GradoygrupoPageModule {}
