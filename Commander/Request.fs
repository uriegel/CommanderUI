module Request
open System.Runtime.Serialization
open WebServer
open Commander

[<DataContract>]
type Affe = {
    [<field: DataMember(Name="name")>]
    name: string
    [<field: DataMember(Name="email")>]
    email: string
    [<field: DataMember(Name="nothing", EmitDefaultValue=false)>]
    nothing: string
}

let requestOK (headers: WebServer.RequestHeaders) = 
    headers.path.StartsWith "/Request"

let run request = 
    async {
        let urlQuery = UrlQuery.create request.data.header.path
        match urlQuery.method with
        | "close" -> 
            do! Response.asyncSendJson request Seq.empty
            shutdown ()
        | _ -> failwith "Unknown command"

        let urlQuery = UrlQuery.create request.data.header.path
        let path = urlQuery.Query "path"
        let isVisble = urlQuery.Query "isVisible"
        do! Response.asyncSendJson request {
             name = "Uwe"
             email = "uriegel@hotmail.de"
             nothing = null
        }     
    }