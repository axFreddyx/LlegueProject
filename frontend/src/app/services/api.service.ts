import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private url = environment.apiUrl;

  constructor(private http: HttpClient) {}

  register(username: string, email: string, password: string) {
    return this.http.post(this.url + "/auth/local/register", { username, email, password });
  }

  login(data: any) {
    return this.http.post(this.url + "/auth/local", data);
  }

  getAlumnos(): Observable<any> {
    return this.http.get(`${this.url}/alumnos?populate=*`);
  }

  getAlumno(id: number): Observable<any> {
    return this.http.get(`${this.url}/alumnos/${id}?populate=*`);
  }

  createAlumno(data: any): Observable<any> {
    return this.http.post(`${this.url}/alumnos`, { data });
  }

  updateAlumno(id: number, data: any): Observable<any> {
    return this.http.put(`${this.url}/alumnos/${id}`, { data });
  }

  deleteAlumno(id: number): Observable<any> {
    return this.http.delete(`${this.url}/alumnos/${id}`);
  }
}