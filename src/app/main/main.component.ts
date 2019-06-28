import { Component, OnInit } from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import Swal from 'sweetalert2';
import {Cell} from '../models/cell';
import {CellCheck} from '../models/cell-check';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

  nbRows = '10';
  nbCols = '10';
  errorRow = '';
  errorCol = '';
  rowArray = [];
  colArray = [];
  tdStyle;
  needReset = false;

  constructor(private translate: TranslateService) { }

  ngOnInit() {
  }

  validInput($event: KeyboardEvent) {
    if ($event != null && $event.key === 'Enter') {
      this.go();
    } else {
      const regex = '^[0-9]+$';
      const row = parseInt(this.nbRows);
      const col = parseInt(this.nbCols);

      if (!this.nbRows.match(regex)) {
        this.errorRow = this.translate.instant('input.warning');
      } else {
        this.errorRow = '';
        if (row < 10) {
          this.errorRow = this.translate.instant('input.warning');
        } else if (row > 100) {
          this.errorRow = this.translate.instant('input.warning');
        } else {
          this.errorRow = '';
        }
      }

      if (!this.nbCols.match(regex)) {
        this.errorCol = this.translate.instant('input.warning');
      } else {
        this.errorCol = '';
        if (col < 10) {
          this.errorCol = this.translate.instant('input.warning');
        } else if (col > 100) {
          this.errorCol = this.translate.instant('input.warning');
        } else {
          this.errorCol = '';
        }
      }
    }
  }

  async go() {
    this.validInput(null);
    if (this.errorRow === '' && this.errorCol === '') {
      if (this.needReset) {
        this.reset();
      }
      this.rowArray = new Array(parseInt(this.nbRows));
      this.colArray = new Array(parseInt(this.nbCols));
      Swal.fire({
        title: this.translate.instant('swal.waitTitle'),
        text: this.translate.instant('swal.waitText'),
        showConfirmButton: false,
        type: 'info',
        customClass: {
          title: 'swal_title'
        },
        allowEnterKey: false,
        allowEscapeKey: false,
        onBeforeOpen: () => {
          Swal.showLoading();
        }
      });
      // Obligated to use promise if we want to let time for the grid to be build
      // It's ugly, I know but don't know of a better way
      await new Promise(resolve => setTimeout(resolve, 0));
      this.setTdStyle();
      await new Promise(resolve => setTimeout(resolve, 0));
      this.generateLab();
      Swal.close();
      this.needReset = true;
    }
  }

  setTdStyle() {
    let height = '25px';
    let width = '25px';

    if (parseInt(this.nbRows) > 55 || parseInt(this.nbCols) > 55) {
      height = '20px';
      width = '20px';
    }
    if (parseInt(this.nbRows) > 80 || parseInt(this.nbCols) > 80) {
      height = '15px';
      width = '15px';
    }

    this.tdStyle = {
      'height': height,
      'width': width
    };
  }

  generateLab() {
    // Generate the lab
    const nbCells = ((parseInt(this.nbRows)) * (parseInt(this.nbCols))) - 1;
    const s = Math.floor(Math.random() * (parseInt(this.nbCols) - 1) + 1);
    const start: Cell = new Cell(0, s);
    // remove top border for the enter
    const startCell = document.getElementById('cell' + start.toString());
    startCell.style.borderTop = '0';
    startCell.style.backgroundColor = '#cc5200';
    const stack = [];
    const historyTab = [];
    stack.push(start);
    historyTab.push(start);
    let current: Cell = new Cell(-1, -1);
    while (current.toString() !== start.toString()) {
      if (current.toString() === '-1.-1') {
        current = start;
      }
      const row = current.row;
      const col = current.col;
      // Check the adjacent cells
      const validTab = this.checkCells(row, col, historyTab);
      // If the tab don't contains cells, return to the last one
      if (validTab.length === 0) {
        stack.pop();
        current = stack[stack.length - 1];
      } else {
        // Get nextCell
        const rnd = Math.floor(Math.random() * (validTab.length));
        const nextCell = validTab[rnd];
        // Remove border
        const currentCell = document.getElementById('cell' + current.toString());
        this.openWall(nextCell, currentCell);
        // Set the current for the next one and put it in histTab
        current = nextCell.cell;
        historyTab.push(current);
        stack.push(current);
      }
    }
    // Remove bot border for the end
    const e = Math.floor(Math.random() * (parseInt(this.nbCols) - 1) + 1);
    const end: Cell = new Cell(parseInt(this.nbRows) - 1, e);
    const endCell = document.getElementById('cell' + end.toString());
    endCell.style.borderBottom = '0';
    endCell.style.backgroundColor = '#b82e8a';
  }

  checkCells(row, col, historyTab) {
    const validTab = [];
    // check top
    if (row > 0) {
      const top = new Cell((row - 1), col);
      const indexTop = (historyTab.filter(cell => cell.toString() === top.toString())).length;
      if (indexTop === 0) {
        validTab.push(new CellCheck(top, 'top'));
      }
    }
    // check right
    if (col < parseInt(this.nbCols) - 1) {
      const right = new Cell(row, (col + 1));
      const indexRight = (historyTab.filter(cell => cell.toString() === right.toString())).length;
      if (indexRight === 0) {
        validTab.push(new CellCheck(right, 'right'));
      }
    }
    // check left
    if (col > 0) {
      const left = new Cell(row, (col - 1));
      const indexLeft = (historyTab.filter(cell => cell.toString() === left.toString())).length;
      if (indexLeft === 0) {
        validTab.push(new CellCheck(left, 'left'));
      }
    }
    // check bot
    if (row < parseInt(this.nbRows) - 1) {
      const bot = new Cell((row + 1), col);
      const indexBot = (historyTab.filter(cell => cell.toString() === bot.toString())).length;
      if (indexBot === 0) {
        validTab.push(new CellCheck(bot, 'bot'));
      }
    }
    return validTab;
  }

  openWall(nextCell, currentCell) {
    // Remove the border given which direction
    const newCell = document.getElementById('cell' + nextCell.cell.toString());
    if (nextCell.position === 'top') {
      currentCell.style.borderTop = '0';
      newCell.style.borderBottom = '0';
    } else if (nextCell.position === 'right') {
      currentCell.style.borderRight = '0';
      newCell.style.borderLeft = '0';
    } else if (nextCell.position === 'left') {
      currentCell.style.borderLeft = '0';
      newCell.style.borderRight = '0';
    } else {
      currentCell.style.borderBottom = '0';
      newCell.style.borderTop = '0';
    }
  }

  reset() {
    this.tdStyle = {
      'border': '1px solid white',
      'background-color': ''
    };
  }

  resolve() {

  }
}
