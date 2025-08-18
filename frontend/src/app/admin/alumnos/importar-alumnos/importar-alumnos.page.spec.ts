import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImportarAlumnosPage } from './importar-alumnos.page';

describe('ImportarAlumnosPage', () => {
  let component: ImportarAlumnosPage;
  let fixture: ComponentFixture<ImportarAlumnosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportarAlumnosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
