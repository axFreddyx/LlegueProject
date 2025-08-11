import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LlegueGlobalPage } from './llegue-global.page';

describe('LlegueGlobalPage', () => {
  let component: LlegueGlobalPage;
  let fixture: ComponentFixture<LlegueGlobalPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LlegueGlobalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
