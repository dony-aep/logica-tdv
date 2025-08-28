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
});
