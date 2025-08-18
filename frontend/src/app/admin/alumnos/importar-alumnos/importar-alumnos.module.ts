import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { ImportarAlumnosPage } from './importar-alumnos.page';

const routes: Routes = [
  { path: '', component: ImportarAlumnosPage }
];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [ImportarAlumnosPage]
})
export class ImportarAlumnosPageModule {}
