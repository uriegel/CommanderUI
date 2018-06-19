{
    "targets": [
        {
            "target_name": "addon",
            "sources": [
                "addon.cpp",
                "IconExtractor.cpp",
                "MemoryStream.cpp",
                "utf8.cpp",
                "worker.cpp"
            ],
            "include_dirs" : [
                "<!(node -e \"require('nan')\")"
            ],
            "cflags": ["-Wall", "-std=c++14"],
            'link_settings': {
                "libraries": [ "gdiplus.lib" ]
            }            
        }
    ]
}