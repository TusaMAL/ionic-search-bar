import { Component, Input, Output, EventEmitter, AfterViewInit, OnChanges } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { AlertController, Alert } from 'ionic-angular';

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
}

const HTML_TEMPLATE = `
  <ion-navbar *ngIf="filterOptions">
    <ion-buttons left *ngIf="filterOptions.length > 1">
        <button (tap)="showAlert()" ion-button icon-only>
            <ion-icon name="funnel">
            </ion-icon>
        </button>
    </ion-buttons>
    <ion-searchbar [placeholder]="placeholder + selectedFilter.label" showCancelButton="true" (ionInput)="onInput($event.target.value)"></ion-searchbar>
  </ion-navbar>
`;

const CSS_STYLE = '';

@Component({
  selector: 'search-bar',
  template: HTML_TEMPLATE,
  styles: [CSS_STYLE]
})

export class SearchBarComponent implements OnChanges, AfterViewInit {

  // Example usage:
  // <search-bar 
  // [placeholder]="'Buscando por: '" 
  // [filterArray]="arr" 
  // (filteredEmitter)="filtered($event)"
  // (selectedEmitter)="selected($event)"
  // [returnAsObservable]="true"
  // [filterOptions]="filterOptions"
  // [alertText]="['Selecione o filtro', '', 'Cancelar', 'Selecionar']"
  // ></search-bar>
  /**
   * Text to be shown on the searchbar
   */
  @Input() placeholder: string;
  /**
   * Options to receive as filter must be an array with objects
   * each of the objects are one of the filter
   * MUST HAVE AT LEAST ONE!
   * ex:
   * the label is what will be shown on the list
   * the value is the object itself, example: "propertyObject.subpropertyObjectString" or "propertyString"
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
   * Array with the text to display on the alert
   * Ex: ['Title', 'Subtitle', 'Cancel Button', 'Select Button']
   */
  @Input() alertText: Array<any>;
  /**
   * Send for the parent the filtered Array or Observable
   */
  @Output() filteredEmitter = new EventEmitter<Array<any> | Observable<Array<any>>>();
  /**
   * Send for the parent the selected filter
   */
  @Output() selectedEmitter = new EventEmitter<FilterModel>();
  private _selectedFilter: FilterModel;
  get selectedFilter() {
    return this._selectedFilter;
  }
  private _alert: Alert;

  constructor(
    private alertCtrl: AlertController
  ) {
    this.filterArray = [];
    this.alertText = [];
    this.placeholder = 'Search by: ';
    this._selectedFilter = new FilterModel();
  }

  /**
   * Setting default options on view initialization
   */
  ngAfterViewInit() {
    if (!this.filterOptions) {
      return console.warn("Search-Bar: Couldn't initialize search-bar component please send at least one filter option to filterOptions array!");
    }
    
    this._selectedFilter = this.filterOptions[0];

    if (this.returnAsObservable) {
      this.filteredEmitter.emit(of(this.filterArray));
    } else {
      this.filteredEmitter.emit(this.filterArray);
    }
    this.placeholder ? this.placeholder : 'Search by: ';
  }

  ngOnChanges() {
    if (this.returnAsObservable) {
      this.filteredEmitter.emit(of(this.filterArray));
    } else {
      this.filteredEmitter.emit(this.filterArray);
    }
  }

  /**
   * Creating filtering alert
   */
  showAlert() {
    this._alert = this.alertCtrl.create({
      title: this.alertText[0] ? this.alertText[0] : 'Select filter',
      subTitle: this.alertText[1] ? this.alertText[1] : '',
      buttons: [
        {
          text: this.alertText[2] ? this.alertText[2] : 'Cancel',
        },
        {
          text: this.alertText[3] ? this.alertText[3] : 'OK',
          handler: (data: FilterModel) => {
            if (data) {
              this._selectedFilter = data;
              this.selectedEmitter.emit(this._selectedFilter);
            }
          }
        }
      ]
    });
    this.filterOptions.forEach(option => {
      this._alert.addInput({
        type: 'radio',
        value: option,
        label: option.label,
        checked: this._selectedFilter.value == option.value ? true : false
      });
    });
    this._alert.present();
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
            throw new Error(`Property ${p} not exists in structure.`);
          else
            currentData = currentData[p];
        }
        
        return (currentData.toString().toLocaleLowerCase().indexOf(value.toLocaleLowerCase()) > -1);
      })
    }
    if (this.returnAsObservable) {
      this.filteredEmitter.emit(of(backupList));
    } else {
      this.filteredEmitter.emit(backupList);
    }
  }

}
