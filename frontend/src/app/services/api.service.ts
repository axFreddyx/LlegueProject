import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor( private http:HttpClient) { }
  url = environment.apiUrl

      register(
      username:string,
      email:string,
      password:string){
      return this.http.post(this.url + "/auth/local/register",{username,email,password});
    }

    login(data:any){
      return this.http.post(this.url + "/auth/local",data);
    }
}
