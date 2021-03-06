import { Component, OnInit} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { Cell } from '../models/cell';
import { CellCheck } from '../models/cell-check';
import { Position} from '../models/position.enum';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

  nbRows = '10';
  nbCols = '10';
  tick = '';
  errorRow = '';
  errorCol = '';
  errorTick = '';
  rowArray = [];
  colArray = [];
  tdStyle;
  needHardReset = false;
  needReset = false;
  isGenerated = false;
  isResolved = false;
  clickedCell: Cell[] = [];
  startCell: Cell;
  endCell: Cell;
  year;
  disableBtn = false;
  printBtnDisabled = true;
  currentClickedCell: Cell = null;

  constructor(private translate: TranslateService, private apiService: ApiService) {}

  ngOnInit() {
    const currentDate = new Date();
    this.year = currentDate.getFullYear();

    // Call the KPI api
    this.apiService.insertKpi();
  }

  validInput($event: KeyboardEvent) {
    if ($event != null && $event.key === 'Enter') {
      if (!this.disableBtn) {
        this.generate();
      }
    } else {
      const regex = '^[0-9]+$';
      const row = parseInt(this.nbRows, 10);
      const col = parseInt(this.nbCols, 10);
      const tick = parseInt(this.tick, 10);

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

      if (this.tick !== '' && !this.tick.match(regex)) {
        this.errorTick = this.translate.instant('input.warningTick');
      } else {
        this.errorTick = '';
        if (tick < 0) {
          this.errorTick = this.translate.instant('input.warningTick');
        } else if (tick > 200) {
          this.errorTick = this.translate.instant('input.warningTick');
        } else {
          this.errorTick = '';
        }
      }
    }
  }

  async generate() {
    this.validInput(null);
    if (this.errorRow === '' && this.errorCol === '' && this.errorTick === '') {
      if (this.needHardReset) {
        this.reset();
      }
      this.rowArray = new Array(parseInt(this.nbRows, 10));
      this.colArray = new Array(parseInt(this.nbCols, 10));
      Swal.fire({
        title: this.translate.instant('swal.waitTitle'),
        text: this.translate.instant('swal.waitText'),
        showConfirmButton: false,
        type: 'info',
        customClass: {
          title: 'swal_title'
        },
        allowOutsideClick: false,
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
      this.printBtnDisabled = false;
      Swal.close();
    }
  }

  setTdStyle() {
    let height = '25px';
    let width = '25px';

    if (parseInt(this.nbRows, 10) > 55 || parseInt(this.nbCols, 10) > 55) {
      height = '20px';
      width = '20px';
    }
    if (parseInt(this.nbRows, 10) > 80 || parseInt(this.nbCols, 10) > 80) {
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
    const s = Math.floor(Math.random() * (parseInt(this.nbCols, 10) - 1) + 1);
    const start: Cell = new Cell(0, s);
    // remove top border for the enter
    const startCell = document.getElementById('cell' + start.toString());
    startCell.style.borderTop = '5px dotted #cc5200';
    this.startCell = start;
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
    const e = Math.floor(Math.random() * (parseInt(this.nbCols, 10) - 1) + 1);
    this.endCell = new Cell(parseInt(this.nbRows, 10) - 1, e);
    const endCell = document.getElementById('cell' + this.endCell.toString());
    endCell.style.borderBottom = '5px dotted #b82e8a';
    this.isGenerated = true;
    this.needHardReset = true;
  }

  checkCells(row, col, historyTab) {
    const validTab = [];
    // check top
    if (row > 0) {
      const top = new Cell((row - 1), col);
      const indexTop = (historyTab.filter(cell => cell.toString() === top.toString())).length;
      if (indexTop === 0) {
        validTab.push(new CellCheck(top, Position.Top));
      }
    }
    // check right
    if (col < parseInt(this.nbCols, 10) - 1) {
      const right = new Cell(row, (col + 1));
      const indexRight = (historyTab.filter(cell => cell.toString() === right.toString())).length;
      if (indexRight === 0) {
        validTab.push(new CellCheck(right, Position.Right));
      }
    }
    // check left
    if (col > 0) {
      const left = new Cell(row, (col - 1));
      const indexLeft = (historyTab.filter(cell => cell.toString() === left.toString())).length;
      if (indexLeft === 0) {
        validTab.push(new CellCheck(left, Position.Left));
      }
    }
    // check bot
    if (row < parseInt(this.nbRows, 10) - 1) {
      const bot = new Cell((row + 1), col);
      const indexBot = (historyTab.filter(cell => cell.toString() === bot.toString())).length;
      if (indexBot === 0) {
        validTab.push(new CellCheck(bot, Position.Bot));
      }
    }
    return validTab;
  }

  openWall(nextCell, currentCell) {
    // Remove the border given which direction
    const newCell = document.getElementById('cell' + nextCell.cell.toString());
    if (nextCell.position === Position.Top) {
      currentCell.style.borderTop = '0';
      newCell.style.borderBottom = '0';
    } else if (nextCell.position === Position.Right) {
      currentCell.style.borderRight = '0';
      newCell.style.borderLeft = '0';
    } else if (nextCell.position === Position.Left) {
      currentCell.style.borderLeft = '0';
      newCell.style.borderRight = '0';
    } else {
      currentCell.style.borderBottom = '0';
      newCell.style.borderTop = '0';
    }
  }

  resetClick() {
    if (this.needReset) {
      this.clickedCell = [];
      this.isResolved = false;
      // Alternating because if we set the same one, it doesn't update
      if (this.tdStyle['background-color'] === '') {
        this.tdStyle['background-color'] = '#2a2a2a';
      } else {
        this.tdStyle['background-color'] = '';
      }
    }
  }

  reset() {
    this.clickedCell = [];
    this.isResolved = false;
    this.tdStyle = {
      'border': '1px solid white',
      'background-color': ''
    };
  }

  async resolve() {
    // Deactivate the buttons
    this.disableBtn = true;
    this.printBtnDisabled = true;
    // If isGenerated is false, labyrinth didn't get generated, so warn the user
    if (this.isGenerated === false) {
      Swal.fire({
        title: this.translate.instant('swal.resolveTitle'),
        type: 'warning',
        customClass: {
          title: 'swal_title'
        },
      });
    } else {
      // If it's already resolved, don't redo it
      if (this.isResolved === false) {
        const visitedCell = [];
        const tabCell = [];
        let currentCell = this.startCell;
        visitedCell.push(currentCell);
        this.colorCell(currentCell, '#b30000');
        while (currentCell.toString() !== this.endCell.toString()) {
          // If tick is set, do it
          if (this.tick !== '') {
            await new Promise(resolve => setTimeout(resolve, parseInt(this.tick, 10)));
          }
          const validTab = this.checkCellsResolve(currentCell, visitedCell);
          // If empty, go back
          if (validTab.length === 0) {
            this.decolorCell(currentCell);
            tabCell.pop();
            currentCell = tabCell[tabCell.length - 1];
          } else {
            // Choose a random cell
            const i = Math.floor(Math.random() * validTab.length);
            currentCell = validTab[i];
            visitedCell.push(currentCell);
            tabCell.push(currentCell);
            this.colorCell(currentCell, '#b30000');
          }
        }
      }
      this.needReset = true;
      this.isResolved = true;
    }
    // Re-activate the buttons
    this.disableBtn = false;
    this.printBtnDisabled = false;
  }

  checkCellsResolve(currentCell: Cell, visitedCell) {
    const r = currentCell.row;
    const c = currentCell.col;
    const topCell = new Cell(r - 1, c);
    const rightCell = new Cell(r, c + 1);
    const leftCell = new Cell(r, c - 1);
    const botCell = new Cell(r + 1, c);
    const validTab = [];

    // Check if topCell is valid & not already been visited
    if (topCell.row >= 0 && visitedCell.filter(x => x.toString() === topCell.toString()).length === 0) {
      // Check if no border
      if (!this.checkBorder(Position.Top, currentCell)) {
        validTab.push(topCell);
      }
    }
    // Check if rightCell is valid & not already been visited
    if (rightCell.col < parseInt(this.nbCols, 10) && visitedCell.filter(x => x.toString() === rightCell.toString()).length === 0) {
      // Check if no border
      if (!this.checkBorder(Position.Right, currentCell)) {
        validTab.push(rightCell);
      }
    }
    // Check if leftCell is valid & not already been visited
    if (leftCell.col >= 0 && visitedCell.filter(x => x.toString() === leftCell.toString()).length === 0) {
      // Check if no border
      if (!this.checkBorder(Position.Left, currentCell)) {
        validTab.push(leftCell);
      }
    }
    // Check if botCell is valid & not already been visited
    if (botCell.row < parseInt(this.nbRows, 10) && visitedCell.filter(x => x.toString() === botCell.toString()).length === 0) {
      // Check if no border
      if (!this.checkBorder(Position.Bot, currentCell)) {
        validTab.push(botCell);
      }
    }
    return validTab;
  }

  cellClick(r, c) {
    const newCell = new Cell(r, c);
    const currentCell = this.clickedCell[this.clickedCell.length - 1];
    const alreadyClicked = this.clickedCell.filter(x => x.toString() === newCell.toString()).length !== 0;
    // If empty, new game
    if (this.clickedCell.length === 0) {
      // Since new game, need start cell to be clicked
      if (newCell.toString() === this.startCell.toString()) {
        this.colorCell(newCell, '#008ae6');
      }
    } else {
      // If end end, color cell + swal for announcement
      if (newCell.toString() === this.endCell.toString()) {
        this.colorCell(newCell, '#008ae6');
        Swal.fire({
          title: this.translate.instant('swal.endTitle'),
          text: this.translate.instant('swal.endText'),
          type: 'success',
          customClass: {
            title: 'swal_title'
          },
        });
        return;
      } else if (newCell.toString() === currentCell.toString()) {
        // If same cell, remove it
        this.decolorCell(newCell);
      } else if (!alreadyClicked) {
        // Check if cell is adjacent
        const position = this.checkAdjacent(currentCell, r, c);
        // if adjacentCell not set, do nothing since not adjacent, otherwise check if the 2 cells
        // are separated by a border
        if (position !== null) {
          const haveBorder = this.checkBorder(position, newCell);
          if (!haveBorder) {
            this.colorCell(newCell, '#008ae6');
          }
        }
      }
    }
    this.needReset = true;
  }

  checkAdjacent(currentCell, r, c) {
    const topCell = new Cell(+r - 1, c);
    const rightCell = new Cell(r, +c + 1);
    const leftCell = new Cell(r, +c - 1);
    const botCell = new Cell(+r + 1, c);
    let position: Position = null;
    if (topCell.toString() === currentCell.toString()) {
      position = Position.Top;
    } else if (rightCell.toString() === currentCell.toString()) {
      position = Position.Right;
    } else if (leftCell.toString() === currentCell.toString()) {
      position = Position.Left;
    } else if (botCell.toString() === currentCell.toString()) {
      position = Position.Bot;
    }
    return position;
  }

  checkBorder(position: Position, newCell) {
    const newCellDom = document.getElementById('cell' + newCell.toString());
    let haveBorder = false;
    // Check if the style is empty, because it's empty at first and we added
    // the 0px border. So if it's not empty, it's because we removed the border
    if (position === Position.Top) {
      if (newCellDom.style.borderTop === '') {
        haveBorder = true;
      }
    } else if (position === Position.Right) {
      if (newCellDom.style.borderRight === '') {
        haveBorder = true;
      }
    } else if (position === Position.Left) {
      if (newCellDom.style.borderLeft === '') {
        haveBorder = true;
      }
    } else {
      if (newCellDom.style.borderBottom === '') {
        haveBorder = true;
      }
    }
    return haveBorder;
  }

  colorCell(newCell, color) {
    const newCellDom = document.getElementById('cell' + newCell.toString());
    this.clickedCell.push(newCell);
    newCellDom.style.backgroundColor = color;
  }

  decolorCell(newCell) {
    const newCellDom = document.getElementById('cell' + newCell.toString());
    this.clickedCell.pop();
    newCellDom.style.backgroundColor = '';
  }

  mouseEvent(e) {
    if (this.isResolved) {
      return;
    }
    // First click
    if (this.currentClickedCell == null) {
      this.currentClickedCell = this.getCellByDocument(e);
    } else {
      // Second click
      const secondCell = this.getCellByDocument(e);
      // Check if same cell
      if (secondCell.toString() === this.currentClickedCell.toString()) {
        this.cellClick(this.currentClickedCell.row, +this.currentClickedCell.col);
        this.currentClickedCell = null;
        return;
      }
      let position;
      let cpt = 0;
      // Check if it's in the same line/column & which direction to check after
      if (this.currentClickedCell.row === secondCell.row) {
        if (secondCell.col > this.currentClickedCell.col) {
          position = Position.Right;
          cpt = secondCell.col - this.currentClickedCell.col;
        } else {
          position = Position.Left;
          cpt = this.currentClickedCell.col - secondCell.col;
        }
      } else if (this.currentClickedCell.col === secondCell.col) {
        if (secondCell.row > this.currentClickedCell.row) {
          position = Position.Bot;
          cpt = secondCell.row - this.currentClickedCell.row;
        } else {
          position = Position.Top;
          cpt = this.currentClickedCell.row - secondCell.row;
        }
      }
      if (position !== undefined && cpt !== 0) {
        // Check if there's a border between the two cell
        for (let i = 0; i < cpt; i++) {
          if (this.checkBorderMouseDrag(position, i)) {
            this.currentClickedCell = null;
            return;
          }
        }
        // Color all the cells
        this.colorCellMouseDrag(cpt, position);
      }
      this.currentClickedCell = null;
    }
  }

  getCellByDocument(document) {
    const tabId = document.srcElement.id.substring(4, document.srcElement.id.length).split('.');
    return new Cell(tabId[0], tabId[1]);
  }

  checkBorderMouseDrag(position, i) {
    let result;
    if (position === Position.Top) {
      result = this.checkBorder(position, new Cell(+this.currentClickedCell.row - i, this.currentClickedCell.col));
    } else if (position === Position.Right) {
      result = this.checkBorder(position, new Cell(this.currentClickedCell.row, +this.currentClickedCell.col + i));
    } else if (position === Position.Left) {
      result = this.checkBorder(position, new Cell(this.currentClickedCell.row, +this.currentClickedCell.col - i));
    } else {
      result = this.checkBorder(position, new Cell(+this.currentClickedCell.row + i, this.currentClickedCell.col));
    }
    return result;
  }

  colorCellMouseDrag(cpt, position) {
    for (let i = 0; i < cpt + 1; i++) {
      if (position === Position.Top) {
        this.cellClick(+this.currentClickedCell.row - i, this.currentClickedCell.col);
      } else if (position === Position.Right) {
        this.cellClick(this.currentClickedCell.row, +this.currentClickedCell.col + i);
      } else if (position === Position.Left) {
        this.cellClick(this.currentClickedCell.row, +this.currentClickedCell.col - i);
      } else {
        this.cellClick(+this.currentClickedCell.row + i, this.currentClickedCell.col);
      }
    }
  }
}
