import { Component, AfterViewInit, ViewChildren, ViewChild, ElementRef, QueryList, Renderer2 } from '@angular/core'

export interface IColumns {
    name: string
    columns: IColumn[]
}

export interface IColumn {
    name: string
    onSort?: (ascending: boolean)=>void
}

@Component({
  selector: '[app-columns]',
  templateUrl: './columns.component.html',
  styleUrls: ['./columns.component.css']
})
export class ColumnsComponent implements AfterViewInit {

    constructor(private renderer: Renderer2) {}
    @ViewChild("columnsRow") columnsRow: ElementRef
    @ViewChildren("th") ths: QueryList<ElementRef>

    columns: IColumns = {
        name: "Nil",
        columns: []            
    }

    ngAfterViewInit() {
        // this.ths.forEach((th, i) => {
        //     this.renderer.setStyle(th.nativeElement, "width", `${(i * 10)}%`)
        // })
    }

    private onMouseMove(evt: MouseEvent) {
        const th = <HTMLElement>evt.target
        if (th.localName == "th" && (th.offsetLeft > 0 || evt.pageX - th.getBoundingClientRect().left > 10)
            && (th.offsetLeft + th.offsetWidth < this.columnsRow.nativeElement.offsetWidth || evt.pageX - th.getBoundingClientRect().left < 4)
            && (th.getBoundingClientRect().left + th.offsetWidth - evt.pageX < 4 || evt.pageX - th.getBoundingClientRect().left < 4)) {
            this.renderer.addClass(th, "pointer-ew")
            this.grippingReady = true
            this.previous = evt.pageX - th.getBoundingClientRect().left < 4
        }
        else {
            this.renderer.removeClass(th, "pointer-ew")
            this.grippingReady = false
        }
    }
    
    private onMouseDown(evt: MouseEvent) {
        const column = <HTMLElement>evt.target
        if (!this.grippingReady) {
            // if (this.columns[columnIndex].onSort) {
            //     const ascending = column.classList.contains("sortAscending")
            //     this.columns[columnIndex].onSort!(!ascending)
            //     for (let i = 0; i < ths.length; i++) {
            //         ths[i].classList.remove("sortAscending")
            //         ths[i].classList.remove("sortDescending")
            //     }

            //     column.classList.add(ascending ? "sortDescending" : "sortAscending")
            // }
        }
        else
            this.beginColumnDragging(evt.pageX, column)
    }

    beginColumnDragging(startGripPosition: number, targetColumn: HTMLElement) {
        document.body.style.cursor = 'ew-resize'

        let currentHeader: HTMLElement
        if (!this.previous)
            currentHeader = targetColumn
        else
            currentHeader = <HTMLElement>targetColumn.previousElementSibling
        const nextHeader = <HTMLElement>currentHeader.nextElementSibling
        const currentLeftWidth = currentHeader.offsetWidth
        const sumWidth = currentLeftWidth + nextHeader.offsetWidth

        const onmove = (evt: MouseEvent) => {
            this.renderer.setStyle(document.body, "cursor", 'ew-resize')
            var diff = evt.pageX - startGripPosition

            if (currentLeftWidth + diff < 15)
                diff = 15 - currentLeftWidth
            else if (diff > sumWidth - currentLeftWidth - 15)
                diff = sumWidth - currentLeftWidth - 15

            const combinedWidth = this.getCombinedWidth(currentHeader, nextHeader)

            let leftWidth = currentLeftWidth + diff
            let rightWidth = sumWidth - currentLeftWidth - diff
            const factor = combinedWidth / sumWidth
            leftWidth = leftWidth * factor
            rightWidth = rightWidth * factor

            currentHeader.style.width = leftWidth + '%'
            nextHeader.style.width = rightWidth + '%'
            const columnsWidths = this.getWidths()
            //localStorage[this.id] = JSON.stringify(columnsWidths)

            evt.preventDefault()
        }

        const onup = (evt: MouseEvent) => {
            document.body.style.cursor = null
            window.removeEventListener('mousemove', onmove)
            window.removeEventListener('mouseup', onup)
        }

        window.addEventListener('mousemove', onmove)
        window.addEventListener('mouseup', onup)
    }

    private getWidths() {
        let widths = new Array()
        this.ths.forEach((th, i) => {
            widths[i] = th.nativeElement.style.width
            if (!widths[i])
                widths[i] = (100 / this.columns.columns.length) + '%'
        })
        return widths
    }
    
    private getCombinedWidth(column: HTMLElement, nextColumn: HTMLElement) {
        const firstWidth = column.style.width
            ? parseFloat(column.style.width.substr(0, column.style.width.length - 1))
            : 100 / this.columns.columns.length
        const secondWidth = nextColumn.style.width
            ? parseFloat(nextColumn.style.width.substr(0, nextColumn.style.width.length - 1))
            : 100 / this.columns.columns.length
        return firstWidth + secondWidth
    }

    private previous = false
    private grippingReady = false
}
