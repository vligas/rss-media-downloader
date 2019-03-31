import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BrandLogoPage } from './brand-logo.page';

describe('BrandLogoPage', () => {
  let component: BrandLogoPage;
  let fixture: ComponentFixture<BrandLogoPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BrandLogoPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BrandLogoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
