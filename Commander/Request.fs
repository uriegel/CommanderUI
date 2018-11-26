module Request
open System
open System.IO
open System.Drawing
open System.Drawing.Imaging
open System.Runtime.InteropServices
open Model
open WebServer

let getRoot () = 
        let getResponseDriveItem index (item: Item) = { 
                itemType = ItemType.Directory
                index = index
                icon = item.icon
                items = [| item.name; item.extension; string item.size |] 
                isCurrent = index = 0 //indexToSelect
                isHidden = item.isHidden
            }

        DriveInfo.GetDrives () 
        |> Array.filter (fun drive -> drive.IsReady)
        |> Array.sortBy (fun n -> n.Name)
        |> Array.map createDriveItem
        |> Array.mapi getResponseDriveItem

            // fun d -> Seq.append d [| 
            //                         { kind = "Drive"; parent = null; name = "Registry"; fullname = null; imageUrl = "images/registry.png";
            //                             ext = null; isHidden=false; dateTime = null; fileSize = 0L; }
            //                         { kind = "Drive"; parent = null; name = "Dienste"; fullname = null; imageUrl = "images/service.png";
            //                             ext = null; isHidden=false; dateTime = null; fileSize = 0L }
            //                         { kind = "Drive"; parent = null; name = "Favoriten"; fullname = null; imageUrl = "images/favorite.png";
            //                             ext = null; isHidden=false; dateTime = null; fileSize = 0L } |])

        //let driveResult = { currentDirectory = "drives"; items = Seq.toArray drives }

let run request = 
    let query = UrlQuery.create request.data.header.path

    let requestId = query.Query "requestId"
    let callerId = query.Query "callerId"
    let path = query.Query "path"
    async {
        match path with
        | Some path ->
            let response = 
                match path with
                | "root" -> getRoot ()
                | _ -> getRoot ()
            let str = Json.serialize response.response
            do! Response.asyncSendJsonString request str
            match response.continuation with
            | Some continuation -> continuation ()
            | None -> ()
        | None -> do! FixedResponses.asyncSendServerError request
    }

//=====================================================================

let notModified = DateTime.Parse("02.02.2012 14:00")
let (| IsCommanderView | _ |) (arg: UrlQueryType) = 
    match arg.Query "commanderView" with
    | Some commanderView -> 
        match LanguagePrimitives.EnumOfValue<int, CommanderView> <| int commanderView with
        | CommanderView.Left -> Some Commander.leftProcessor
        | CommanderView.Right -> Some Commander.leftProcessor
        | _ -> None
    | _ -> None

let requestOK (headers: WebServer.RequestHeaders) = headers.path.StartsWith "/request"

let getIcon (ext: string option) (idStrOption: string option) = async {

    let rec getIconHandle callCount = async {
        match ext with 
        | None -> return (Icon.ExtractAssociatedIcon @"C:\Windows\system32\SHELL32.dll").Handle
        | Some ext ->
            let path = 
                match idStrOption with
                | Some id -> 
                    let path = 
                        match LanguagePrimitives.EnumOfValue<int, CommanderView> <| int id with 
                        | CommanderView.Left -> Commander.leftProcessor.getCurrentPath ()
                        | _ -> Commander.rightProcessor.getCurrentPath ()
                    Path.Combine (path, ext)
                | None -> ext
            let mutable shinfo = Api.ShFileInfo () 
            Api.SHGetFileInfo (path, Api.FileAttributeNormal, &shinfo, Marshal.SizeOf shinfo, 
                Api.SHGetFileInfoConstants.ICON 
                ||| Api.SHGetFileInfoConstants.SMALLICON 
                ||| Api.SHGetFileInfoConstants.USEFILEATTRIBUTES 
                ||| Api.SHGetFileInfoConstants.TYPENAME) |> ignore
            if shinfo.hIcon <> IntPtr.Zero then
                return shinfo.hIcon
            else
                if callCount < 3 then
                    do! Async.Sleep 20
                    return! getIconHandle <| callCount + 1
                else 
                    return (Icon.ExtractAssociatedIcon @"C:\Windows\system32\SHELL32.dll").Handle
    }

    let! iconHandle = getIconHandle 0
    use icon = Icon.FromHandle iconHandle
    use bitmap = icon.ToBitmap ()
    let ms = new MemoryStream()
    bitmap.Save (ms, ImageFormat.Png)
    ms.Capacity <- int ms.Length
    Api.DestroyIcon iconHandle |> ignore
    return ms.GetBuffer ()
}
let runn request = 

    let asyncProcessorRequest query predicate = async {
        let processor = 
            match query with
            | IsCommanderView processor -> Some processor
            | _ -> None
        match processor with
        | Some processor -> 
            let response = predicate processor query
            let str = Json.serialize response.response
            do! Response.asyncSendJsonString request str
            match response.continuation with
            | Some continuation -> continuation ()
            | None -> ()
        | None -> do! Response.asyncSendJsonString request ""        
    }

    async {
        let query = UrlQuery.create request.data.header.path
        match query.method with
        | "get" -> do! asyncProcessorRequest query (fun processor query -> processor.get (query.Query "path") None)
        | "process" ->
            match query.Query "index" with
            | Some index -> do! asyncProcessorRequest query (fun processor query -> processor.processItem <| int index)
            | None -> do! Response.asyncSendJsonString request ""
        | "icon" ->
            let! bytes = getIcon <| query.Query "path" <| query.Query "id"
            do! Response.asyncSendFileBytes request "image/png" notModified (Some bytes)
        | _ -> failwith "Unknown command"
    }