import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { VisualizacionLlegadasPageRoutingModule } from './visualizacion-llegadas-routing.module';
import { VisualizacionLlegadasPage } from './visualizacion-llegadas.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VisualizacionLlegadasPageRoutingModule
  ],
  declarations: [VisualizacionLlegadasPage]
})
export class VisualizacionLlegadasPageModule {}
