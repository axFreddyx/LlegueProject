import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GradoygrupoPage } from './gradoygrupo.page';

describe('GradoygrupoPage', () => {
  let component: GradoygrupoPage;
  let fixture: ComponentFixture<GradoygrupoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GradoygrupoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
