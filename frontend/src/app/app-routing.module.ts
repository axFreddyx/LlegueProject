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
    loadChildren: () => import('./auth/login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'home',
    loadChildren: () => import('./admin/home/home.module').then(m => m.HomePageModule),
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
  },
  {
    path: 'periodos',
    loadChildren: () => import('./admin/periodos/periodos.module').then( m => m.PeriodosPageModule)
  },
  {
    path: 'perfil',
    loadChildren: () => import('./perfil/perfil.module').then( m => m.PerfilPageModule)
  },
  {
    path: 'ver/admins',
    loadChildren: () => import('./admin/users-admin/users-admin.module').then( m => m.UsersAdminPageModule)
  },
  {
    path: 'llegue-global',
    loadChildren: () => import('./admin/llegue-global/llegue-global.module').then( m => m.LlegueGlobalPageModule)
  },
  {
    path: 'editar/alumno/:id',
    loadChildren: () => import('./admin/alumnos/editar/editar.module').then( m => m.EditarPageModule)
  },
  {
    path: 'editar/cuenta/:id',
    loadChildren: () => import('./admin/docente/editar/editar.module').then( m => m.EditarPageModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./auth/register/register.module').then( m => m.RegisterPageModule)
  },
  {
    path: 'password-forgotten',
    loadChildren: () => import('./auth/password-forgotten/password-forgotten.module').then( m => m.PasswordForgottenPageModule)
  },  {
    path: 'importar-alumnos',
    loadChildren: () => import('./admin/alumnos/importar-alumnos/importar-alumnos.module').then( m => m.ImportarAlumnosPageModule)
  },
  {
    path: 'visualizacion-llegadas',
    loadChildren: () => import('./visualizacion/visualizacion-llegadas/visualizacion-llegadas.module').then( m => m.VisualizacionLlegadasPageModule)
  }



];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
