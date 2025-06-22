import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private url = environment.apiUrl;

  constructor(private http: HttpClient) { }

  //#region Register y login

  register(username: string, email: string, password: string, nombre: string) {
    return this.http.post(this.url + "/auth/local/register", { username, email, password, nombre });
  }

  CrearAutorizada( data: any) {
    // let options = new HttpHeaders({
    //   'Authorization': 'Bearer ' + token
    // })
    return this.http.post(this.url + "/auth/local/register", data);
  }

  login(data: any) {
    return this.http.post(this.url + "/auth/local", data);
  }

  //#endregion

  //#region Alumnos

  getAlumnos(): Observable<any> {
    return this.http.get(`${this.url}/alumnos?populate=*`);
  }

  getAlumno(id: string): Observable<any> {
    return this.http.get(`${this.url}/alumnos/${id}?populate=*`);
  }

  createAlumno(data: any): Observable<any> {
    return this.http.post(`${this.url}/alumnos`, { data });
  }

  updateAlumno(id: string, data: any): Observable<any> {
    return this.http.put(`${this.url}/alumnos/${id}`, { data });
  }

  deleteAlumno(id: string): Observable<any> {
    return this.http.delete(`${this.url}/alumnos/${id}`);
  }

  //#endregion
}