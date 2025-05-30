import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShapefilesTable } from './shapefiles-table';

describe('ShapefilesTable', () => {
  let component: ShapefilesTable;
  let fixture: ComponentFixture<ShapefilesTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShapefilesTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShapefilesTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
