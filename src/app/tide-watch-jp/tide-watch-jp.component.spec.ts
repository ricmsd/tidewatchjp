import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TideWatchJpComponent } from './tide-watch-jp.component';

describe('TideWatchJpComponent', () => {
  let component: TideWatchJpComponent;
  let fixture: ComponentFixture<TideWatchJpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TideWatchJpComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TideWatchJpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
