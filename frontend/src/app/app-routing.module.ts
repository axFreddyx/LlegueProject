import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'create/cuenta',
    loadChildren: () => import('./admin/pautorizada/create/create.module').then( m => m.CreatePageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'create/alumnos',
    loadChildren: () => import('./admin/alumnos/create/create.module').then( m => m.CreatePageModule)
  },
  {
    path: 'ver/alumnos',
    loadChildren: () => import('./admin/alumnos/ver/ver.module').then( m => m.VerPageModule)
  },
  {
    path: 'gradoygrupo',
    loadChildren: () => import('./admin/gradoygrupo/gradoygrupo.module').then( m => m.GradoygrupoPageModule)
  },  {
    path: 'llegue',
    loadChildren: () => import('./autorizada/llegue/llegue.module').then( m => m.LleguePageModule)
  },






];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
