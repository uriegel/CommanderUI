import { Component, AfterViewInit, ViewChild, ElementRef, TemplateRef, Renderer2 } from '@angular/core'
import { Observable } from 'rxjs'
import { ScrollbarComponent as Scrollbar } from '../scrollbar/scrollbar.component'
import { ColumnsComponent as Columns } from '../columns/columns.component'

export interface Item {
    isDirectory: boolean
    name: string
    ext?: string
    time?: Date
    size?: number
}

@Component({
  selector: 'app-table-view',
  templateUrl: './table-view.component.html',
  styleUrls: ['./table-view.component.css']
})
export class TableViewComponent implements AfterViewInit {

    @ViewChild("table") table: ElementRef
    @ViewChild(Scrollbar) scrollbar: Scrollbar
    @ViewChild(Columns) columns: Columns

    items: Observable<Item[]>

    constructor(private renderer: Renderer2) {}

    ngAfterViewInit() {
        this.table.nativeElement.tabIndex = 1

        window.addEventListener('resize', () => this.resizeChecking())

        this.columns.columns = {
            name: "Columns",
            columns: [
                { name: "Name", onSort: a => this.onSort(a) },
                { name: "Erw.", onSort: a => this.onSort(a) },
                { name: "Datum" },
                { name: "Größe", onSort: a => this.onSort(a) },
                { name: "Version", onSort: a => this.onSort(a) }
            ]            
        }

        this.resizeChecking()
    }

    resizeChecking() {
        if (this.table.nativeElement.parentElement.clientHeight != this.recentHeight) {
            const isFocused = this.table.nativeElement.contains(document.activeElement)
            this.recentHeight = this.table.nativeElement.parentElement.clientHeight
            const tableCapacityOld = this.tableCapacity
  //          this.calculateTableHeight()
            // const itemsCountOld = Math.min(tableCapacityOld + 1, this.items.length - this.startPosition)
            // const itemsCountNew = Math.min(this.tableCapacity + 1, this.items.length - this.startPosition)
            // if (itemsCountNew < itemsCountOld) {
            //     for (i = itemsCountOld - 1; i >= itemsCountNew; i--)
            //         this.tbody.children[i].remove()
            // }
            // else
            //     for (var i = itemsCountOld; i < itemsCountNew; i++) {
            //         const node = this.itemsControl.createItem(this.items[i + this.startPosition])
            //         this.tbody.appendChild(node)
            //     }

            // this.scrollbar.itemsChanged(this.items.length, this.tableCapacity)
            this.renderer.setStyle(this.table.nativeElement, "clip", `rect(0px, auto, ${this.recentHeight}px, 0px)`)

            if (isFocused)
                focus()
        }
    }

    private onSort(ascending: boolean) { alert(ascending) }

    /**
    * Die Anzahl der Einträge, die dieses TableView in der momentanen Größe tatsächlich auf dem Bildschirm anzeigen kann
    */
   private tableCapacity = -1
   private recentHeight = 0
}
