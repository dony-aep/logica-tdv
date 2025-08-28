import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TruthTableGeneratorComponent } from './truth-table-generator.component';

describe('TruthTableGeneratorComponent', () => {
  let component: TruthTableGeneratorComponent;
  let fixture: ComponentFixture<TruthTableGeneratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TruthTableGeneratorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TruthTableGeneratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
