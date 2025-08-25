// src/app/pages/editar-perfil/editar-perfil.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { EditarPerfilPage } from './editar-perfil.page';

const routes: Routes = [
  { path: '', component: EditarPerfilPage }
];

@NgModule({
  declarations: [EditarPerfilPage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ]
})
export class EditarPerfilPageModule {}
