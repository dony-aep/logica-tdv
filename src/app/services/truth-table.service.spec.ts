import { TestBed } from '@angular/core/testing';

import { TruthTableService } from './truth-table.service';

describe('TruthTableService', () => {
  let service: TruthTableService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TruthTableService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should accept ñ inside a variable name', () => {
    const data = service.generateTableFromExpression('año ∧ p');
    expect(data.vars).toEqual(['año', 'p']);
    expect(data.rows.length).toBe(4);
  });

  it('should keep a leading ñ instead of dropping it', () => {
    const data = service.generateTableFromExpression('ñu ∨ q');
    expect(data.vars).toEqual(['ñu', 'q']);
  });
});
