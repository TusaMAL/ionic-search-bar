import { Component, Input, Output, EventEmitter, AfterViewInit, OnChanges } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { AlertController, Alert } from 'ionic-angular';
import { AlertInputOptions } from 'ionic-angular/umd/components/alert/alert-options';

/**
 * Generated class for the SearchBarComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */

export class FilterModel {
  /**
   * Label to show on the alert
   */
  label: string;
  /**
   * Value of the property on the array that will be used to filter
   */
  value: string;

  /**
   * Type of filter
   */
  type?: EFilterType = EFilterType.TEXT;
}

export enum EFilterType {
  TEXT = 'text',
  EMAIL = 'email',
  NUMBER = 'number',
  DATE = 'date'
}

const HTML_TEMPLATE = `
  <ion-navbar *ngIf="filterOptions">
    <ion-buttons left *ngIf="filterOptions.length > 1">
        <button (tap)="showAlert()" ion-button icon-only>
            <ion-icon name="funnel">
            </ion-icon>
        </button>
    </ion-buttons>
    <ion-searchbar [type]="selectedFilter.type" [placeholder]="placeholder + selectedFilter.label" showCancelButton="true" (ionInput)="onInput($event.target.value)"></ion-searchbar>
  </ion-navbar>
`;

const CSS_STYLE = '';

@Component({
  selector: 'search-bar',
  template: HTML_TEMPLATE,
  styles: [CSS_STYLE]
})

export class SearchBarComponent implements OnChanges, AfterViewInit {

  // <search-bar 
  // placeholder="Buscando por: "
  // [filterOptions]="filterOptions"
  // [filterArray]="arr" 
  // (onFilter)="filtered($event)"
  // (onSelect)="selected($event)"
  // [returnAsObservable]="true"
  // alertTitle="Selecione o filtro"
  // alertOkBtn="Selecionar"
  // alertSubTitle="OMG"
  // alertCancelBtn="Cancelar"
  // >
  // </search-bar>
  /**
   * Text to be shown on the searchbar
   */
  @Input() placeholder: string;
  /**
   * Options to receive as filter must be an array with objects
   * each of the objects are one of the filters
   * MUST HAVE AT LEAST ONE!
   * ex:
   * the label is what will be shown on the list
   * the value is the property to filter example: "propertyObject.subpropertyObjectString" or "propertyString"
   * {
   *    label: string;
   *    value: string;
   * }
   * 
   * if have more than one then the funnel icon will be shown
   */
  @Input() filterOptions: Array<any>;
  /**
   * Array to be filtered
   */
  @Input() filterArray: Array<any>;
  /**
   * Return the array as an observable if true
   */
  @Input() returnAsObservable: boolean;
  /**
   * Alert Title
   * default value: "Select Filter"
   */
  @Input() alertTitle: string;
  /**
   * Alert sub title if doesn't receive a value it will be null
   */
  @Input() alertSubTitle: string;
  /**
   * Alert cancel button
   * default value: "Cancel"
   */
  @Input() alertCancelBtn: string;
  /**
   * Alert ok button
   * default value: "OK"
   */
  @Input() alertOkBtn: string;

  /**
   * Send for the parent the filtered Array or Observable
   */
  @Output() onFilter = new EventEmitter<Array<any> | Observable<Array<any>>>();
  /**
   * Send for the parent the selected filter
   */
  @Output() onSelect= new EventEmitter<FilterModel>();
  private _selectedFilter: FilterModel;
  get selectedFilter() {
    return this._selectedFilter;
  }

  constructor(
    private alertCtrl: AlertController
  ) {
    this.filterArray = [];
    this.alertCancelBtn = 'Cancel';
    this.alertOkBtn = 'OK';
    this.alertSubTitle = '';
    this.alertTitle = 'Select filter';
    this.placeholder = 'Search by: ';
    this._selectedFilter = new FilterModel();

  }

  /**
   * Setting default options on view initialization
   */
  ngAfterViewInit() {
    if (!this.filterOptions) {
      return console.error("Search-Bar: Couldn't initialize search-bar component please send at least one filter option to filterOptions array!");
    }
    
    this._selectedFilter = this.filterOptions[0];

    if (this.returnAsObservable) {
      this.onFilter.emit(of(this.filterArray));
    } else {
      this.onFilter.emit(this.filterArray);
    }
  }

  ngOnChanges() {
    if (this.returnAsObservable) {
      this.onFilter.emit(of(this.filterArray));
    } else {
      this.onFilter.emit(this.filterArray);
    }
  }

  /**
   * Creating filtering alert
   */
  showAlert() {

    // adding the inputs to the alert
    let inputsOptions: Array<AlertInputOptions> = new Array<AlertInputOptions>();
    for (let option of this.filterOptions) {
      inputsOptions.push({
        type: 'radio',
        value: option,
        label: option.label,
        checked: this._selectedFilter.value == option.value ? true : false
      });
    }

    // create and present alertCtrl
    this.alertCtrl.create({
      title: this.alertTitle,
      subTitle: this.alertSubTitle,
      inputs: inputsOptions,
      buttons: [
        this.alertCancelBtn,
        {
          text: this.alertOkBtn,
          handler: (data: FilterModel) => {
            if (data) {
              if(!data.type)
                data.type = EFilterType.TEXT;
              this._selectedFilter = data;
              this.onSelect.emit(this._selectedFilter);
            }
          }
        }
      ]
    }).present();
  }

  /**
   * Receives the value to filter on the array
   * @param value search term
   */
  onInput(value: string) {
    let backupList = this.filterArray;
    if (value && value.trim() != "") {
      backupList = backupList.filter(prop => {
        
        // filter in tree
        let propFilter = this._selectedFilter.value.split('.');
        let currentData = prop;
        for(let p of propFilter) {
          if(!currentData[p]) 
            throw new Error(`Property ${p} doesn't exists.`);
          else
            currentData = currentData[p];
        }

        // filter date
        if(this._selectedFilter.type == EFilterType.DATE) {
          let gmt = new Date().toString().split('GMT')[1];
          let day1: Date = new Date(currentData);
          let day2: Date = new Date(`${value} GMT${gmt}`);
          currentData = `${day1.getFullYear()}-${day1.getMonth()}-${day1.getDate()}`;
          value = `${day2.getFullYear()}-${day2.getMonth()}-${day2.getDate()}`;
        }
        
        return (currentData.toString().toLocaleLowerCase().indexOf(value.toLocaleLowerCase()) > -1);
      })
    }
    if (this.returnAsObservable) {
      this.onFilter.emit(of(backupList));
    } else {
      this.onFilter.emit(backupList);
    }
  }

}
