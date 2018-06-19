import { Component, OnInit, ViewChild } from '@angular/core';
import { ColumnsComponent as Columns } from '../../columns/columns.component'

@Component({
    selector: 'app-test-columns',
    templateUrl: './columns.component.html',
    styleUrls: ['./columns.component.css']
})
export class ColumnsComponent implements OnInit {

    constructor() { }

    @ViewChild(Columns) columns: Columns

    ngOnInit() {
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
    }

    private onSort(ascending: boolean) { alert(ascending) }
}
