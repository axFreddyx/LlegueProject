import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { VerPageRoutingModule } from './ver-routing.module';

import { VerPage } from './ver.page';
import { AlumnosOrdenadorComponent } from 'src/app/components/alumnos-ordenador/alumnos-ordenador.component';
import { AcordeonAlumnosComponent } from 'src/app/components/acordeon-alumnos/acordeon-alumnos.component';
// import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VerPageRoutingModule,
  ],
  declarations: [VerPage, AlumnosOrdenadorComponent, AcordeonAlumnosComponent]
})
export class VerPageModule { }
