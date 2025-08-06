import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { ApiService } from '../services/api.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private api: ApiService, private router: Router) { }

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    const role = await this.api.getUserRole();
    const expectedRoles = route.data['roles'] as string[];
  
    if (expectedRoles.includes(role)) {
      return true;
    } else {
      this.router.navigate(['/unauthorized']);
      return false;
    }
  }
}

