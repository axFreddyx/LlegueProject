import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { VisualizacionLlegadasPageRoutingModule } from './visualizacion-llegadas-routing.module';
import { VisualizacionLlegadasPage } from './visualizacion-llegadas.page';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VisualizacionLlegadasPageRoutingModule,
    ComponentsModule
  ],
  declarations: [VisualizacionLlegadasPage]
})
export class VisualizacionLlegadasPageModule {}
