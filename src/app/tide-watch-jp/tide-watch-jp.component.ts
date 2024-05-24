import { HttpClient, HttpClientModule, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { ECharts, EChartsInitOpts, EChartsOption } from 'echarts';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { FormsModule } from '@angular/forms';
import * as echarts from 'echarts';

interface Station {
  index: number;
  no: string;
  id: string;
  name: string;
  lat: string;
  lon: string;
}

interface TideData {
  time: string;
  value: number;
  high?: boolean;
  low?: boolean;
}

interface Preference {
  id: string;
  start: number;
  end: number;
}

@Component({
  selector: 'app-tide-watch-jp',
  standalone: true,
  imports: [
    NgxEchartsDirective,
    HttpClientModule,
    FormsModule,
    DropdownModule,
    CalendarModule
  ],
  templateUrl: './tide-watch-jp.component.html',
  styleUrl: './tide-watch-jp.component.scss',
  providers: [
    provideEcharts()
  ]
})
export class TideWatchJpComponent implements OnInit {
  #http = inject(HttpClient)
  echartInstance: ECharts | undefined;
  echartInitOptions: any = {renderer: 'svg'};
  echartOptions: EChartsOption = {};

  stations: Station[] = [];
  selectedStation: Station | undefined;
  tides: TideData[] = []

  calendarDate: (Date|null)[] = [new Date(), null];

  constructor() {
  }

  private savePreference() {
    localStorage.setItem('preference', JSON.stringify({
      id: this.selectedStation?.id,
      start: this.calendarDate[0]?.getTime(),
      end: this.calendarDate[1]?.getTime()
    }));
  }

  ngOnInit(): void {
    const pref = JSON.parse(localStorage.getItem('preference') || "{}");
    this.calendarDate = [
      pref.start ? new Date(pref.start) : new Date(),
      pref.end ? new Date(pref.end) : null
    ];
    this.#http.get<Station[]>('assets/station.json')
      .subscribe(data => {
        this.stations = data;
        this.selectedStation
          = data.find(i => i.id === pref.id) || data[0];
        this.onChange(null);
      });
  }

  public onChartInit(instance: ECharts): void {
    this.echartInstance = instance;
    console.log(instance);
  }

  public onChange(event: any): void {
    this.savePreference();
    this.#http.get<string>(`assets/2024/${this.selectedStation?.id}.txt`,
      {observe: 'response', responseType: 'text' as 'json'})
        .subscribe((data: HttpResponse<string>) => {
          this.tides = this.createData(data.body);
          this.createChart(this.tides);
        });
  }

  public onSelectDate(value: Date): void {
    this.savePreference();
    this.createChart(this.tides);
  }

  private formatDate(date: Date | null): string {
    if (!date) {
      return '';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
  
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  private createData(suisan: string | null): TideData[] {
    const tides: TideData[] = [];
    const list = suisan ? suisan.split('\n') : [];
    for (let i = 0; i < list.length - 1; i++) {
      const yy = parseInt(list[i].substring(72, 74));
      const mm = parseInt(list[i].substring(74, 76));
      const dd = parseInt(list[i].substring(76, 78));
      const date = new Date(2000 + yy, mm - 1, dd);
      const high = Array(24);
      const low = Array(24);
      for (let j = 0; j < 8; j++) {
        const hh = parseInt(list[i].substring(80 + 7 * j, 82 + 7 * j));
        if (hh === 99) {
          continue;
        }
        const mi = parseInt(list[i].substring(82 + 7 * j, 84 + 7 * j));
        date.setHours(hh, mi);
        const choui = parseInt(list[i].substring(84 + 7 * j, 87 + 7 * j));
        if (j < 4) {
          if (mi === 0) {
            high[hh] = true;
          } else {
            tides.push({time: this.formatDate(date), value: choui, high: true});
          }
        } else {
          if (mi === 0) {
            low[hh] = true;
          } else {
            tides.push({time: this.formatDate(date), value: choui, low: true});
          }
        }
      }
      for (let j = 0; j < 24; j++) {
        const choui = parseInt(list[i].substring(j * 3, j * 3 + 3));
        date.setHours(j, 0);
        tides.push({time: this.formatDate(date), value: choui, high: high[j], low: low[j]});
      }
    }
    tides.sort((a, b) => a.time.localeCompare(b.time));
    return tides;
  }

  private createChart(data: TideData[]): void {
    this.calendarDate[0]?.setHours(0, 0, 0);
    const startDate = this.formatDate(this.calendarDate[0]);
    if (this.calendarDate[1]) {
      this.calendarDate[1].setHours(23, 59, 59);
    } else {
      this.calendarDate[0]?.setHours(23, 59, 59);
    }
    const endDate = this.calendarDate[1]
      ? this.formatDate(this.calendarDate[1])
      : this.formatDate(this.calendarDate[0]);
    const visibleData = data
      .filter(i => i.time >= startDate && i.time <= endDate)
      .map(i => [i.time, i.value]);
    const markPoint = data
      .filter(i => i.high || i.low)
      .map(i => ({
        name: 'Mark',
        symbol: 'pin',
        coord: [i.time, i.value],
        value: i.time.substring(11, 16),
        itemStyle: {
          color: i.high ? 'red' : 'blue'
        }
      }));

    this.echartOptions = {
      grid: {
        left: 40,
        right: 40,
        top: 40,
        height: '390px',
        containLabel: true
      },
      xAxis: {
        type: 'time',
        axisLabel: {
          formatter: '{MM}/{dd}\n{HH}:{mm}',
        },
        axisPointer: {
          label: {
            show: true,
            formatter: (params) => {
              return echarts.format.formatTime('MM/dd\nhh:mm', params.value);
            }
          },
          handle: {
            show: false
          }
        },
        splitArea: {
          show: true
        }
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          type: 'line',
          lineStyle: {
            width: 0
          },
          symbol: 'none',
          smooth: true,
          data: visibleData,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: 'rgba(58,77,233,0.3)'
              },
              {
                offset: 1,
                color: 'rgba(58,77,233,1)'
              }
            ])
          },
          markPoint: {
            data: markPoint
          }
        }
      ],
      tooltip: {
        trigger: 'axis',
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        },
        {
          type: 'slider',
          start: 0,
          end: 100,
          moveHandleSize: 12,
          handleSize: '100%',
          height: 50,
          bottom: 16
        }
      ],
    };
  }
}
