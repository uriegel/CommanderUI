import { Injectable } from '@angular/core'
import { Subject, Observable, BehaviorSubject } from 'rxjs'
import { Item, Response, Get, Process } from '../model/model'

function formatParams(params) {
    return "?" + Object
        .keys(params)
        .map(key => key+"="+encodeURIComponent(params[key]))
        .join("&")
}

@Injectable({
    providedIn: 'root'
})
export class ConnectionService {
    get serverEvents(): Observable<string>  {
        return this.serverEventsSubject
    }

    get ready(): Observable<boolean>  {
        return this.readySubject
    }

    constructor() {
        this.source.onopen = () => this.readySubject.next(true)

        this.source.addEventListener("commander", (evt: MessageEvent) => {
            console.log("Commander event", evt)
            this.serverEventsSubject.next(evt.data as string)
        })
       
    }

    get(requestNr: number, source: number, path: string) {
        const get: Get = {
            requestNr: requestNr,
            source: source,
            path: path,
        }
        return this.post<Response>("get", formatParams(get))
    }

    // process(commanderView: CommanderView, index: number) {
    //     const process: Process = {
    //         index: index || 0,
    //         commanderView: commanderView
    //     } 
    //     return this.post<Response>("process", formatParams(process))
    // }

    private post<T>(method: string, param = "") {
        return new Promise<T>((res, rej) => {
            const request = new XMLHttpRequest()
            request.open('POST', `${this.baseUrl}/request/${method}${param}`, true)
            request.setRequestHeader('Content-Type', 'application/json; charset=utf-8')
            request.onload = evt => {
                var result = <T>JSON.parse(request.responseText)
                res(result)
            }
            request.send()
        })
    }

    private readonly source = new EventSource("events")
    private readonly baseUrl = "http://localhost:20000"
    private readonly readySubject = new BehaviorSubject<boolean>(false)
    private readonly serverEventsSubject = new Subject<string>()
}

