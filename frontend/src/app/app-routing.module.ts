import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'create/cuenta',
    loadChildren: () => import('./admin/pautorizada/create/create.module').then(m => m.CreatePageModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'create/alumnos',
    loadChildren: () => import('./admin/alumnos/create/create.module').then(m => m.CreatePageModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'ver/alumnos',
    loadChildren: () => import('./admin/alumnos/ver/ver.module').then(m => m.VerPageModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'gradoygrupo',
    loadChildren: () => import('./admin/gradoygrupo/gradoygrupo.module').then(m => m.GradoygrupoPageModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'ver/padres',
    loadChildren: () => import('./admin/pautorizada/ver/ver.module').then(m => m.VerPageModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'ver/docentes',
    loadChildren: () => import('./admin/docente/ver/ver.module').then(m => m.VerPageModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'alumnos',
    loadChildren: () => import('./docente/alumnos/alumnos.module').then(m => m.AlumnosPageModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['docente'] }
  },
  {
    path: 'llegue',
    loadChildren: () => import('./autorizada/llegue/llegue.module').then(m => m.LleguePageModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['persona_autorizada'] }
  },
  {
    path: 'unauthorized',
    loadChildren: () => import('./screen/unauthorized/unauthorized.module').then(m => m.UnauthorizedPageModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
