import { Component, Output, EventEmitter } from '@angular/core'

// TODO: event control vertical size changes to commanderViews
// TODO: replace button with menu command
// TODO: status bar with binding to current item in current list

@Component({
  selector: 'app-commander',
  templateUrl: './commander.component.html',
  styleUrls: ['./commander.component.css']
})
export class CommanderComponent {

    isViewVisible = false

    private onClick() { this.isViewVisible = !this.isViewVisible }
}