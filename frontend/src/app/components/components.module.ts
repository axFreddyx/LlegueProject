import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { RealTimeChartComponent } from './real-time-chart/real-time-chart.component';

@NgModule({
  declarations: [RealTimeChartComponent],
  imports: [CommonModule, IonicModule],
  exports: [RealTimeChartComponent], // 👈 muy importante
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ComponentsModule {}
