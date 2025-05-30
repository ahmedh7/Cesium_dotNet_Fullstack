import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeometriesTable } from './geometries-table';

describe('GeometriesTable', () => {
  let component: GeometriesTable;
  let fixture: ComponentFixture<GeometriesTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeometriesTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeometriesTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
