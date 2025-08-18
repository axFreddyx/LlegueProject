import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisualizacionLlegadasPage } from './visualizacion-llegadas.page';

describe('VisualizacionLlegadasPage', () => {
  let component: VisualizacionLlegadasPage;
  let fixture: ComponentFixture<VisualizacionLlegadasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(VisualizacionLlegadasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
