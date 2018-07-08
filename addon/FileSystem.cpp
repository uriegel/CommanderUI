#include <Windows.h>
#include <Shlobj.h>
#include <string>
#include <sstream>
#include <vector>
#include "FileSystem.h"
#include "Helpers.h"
#include "utf8.h"
using namespace std;

using GetFileVersionInfoFunction = BOOL(__stdcall*)(const wchar_t* filename, DWORD nill, DWORD length, void* data);
using VerQueryValueFunction = BOOL(__stdcall*)(void* block, const wchar_t* sub_block, void** buffer, UINT* length);

const wchar_t* windowClass = L"CommanderChild";

GetFileVersionInfoFunction CreateGetFileVersionInfo() {
	auto module = LoadLibraryW(L"Api-ms-win-core-version-l1-1-0.dll");
	return reinterpret_cast<GetFileVersionInfoFunction>(GetProcAddress(module, "GetFileVersionInfoW"));
}

VerQueryValueFunction CreateVerQueryValue() {
	auto module = LoadLibraryW(L"Api-ms-win-core-version-l1-1-0.dll");
	return reinterpret_cast<VerQueryValueFunction>(GetProcAddress(module, "VerQueryValueW"));
}

static GetFileVersionInfoFunction GetRawFileVersion{ CreateGetFileVersionInfo() };
static VerQueryValueFunction VerRawQueryValue{ CreateVerQueryValue() };

void GetFileItems(const wstring& directory, vector<FileItem>& results) {
	auto searchString = directory + L"\\*.*"s;
	WIN32_FIND_DATAW w32fd{ 0 };
	auto ret = FindFirstFileW(searchString.c_str(), &w32fd);
	while (FindNextFileW(ret, &w32fd) == TRUE) {
		if (wcscmp(w32fd.cFileName, L"..") != 0) {
			FileItem item{
				Utf8Encode(w32fd.cFileName),
				(w32fd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) == FILE_ATTRIBUTE_DIRECTORY,
				(w32fd.dwFileAttributes & FILE_ATTRIBUTE_HIDDEN) == FILE_ATTRIBUTE_HIDDEN,
				static_cast<uint64_t>(w32fd.nFileSizeHigh) << 32 | w32fd.nFileSizeLow,
				ConvertWindowsTimeToUnixTime(w32fd.ftLastWriteTime)
			};
			results.push_back(item);
		}
	}
}

void GetDriveInfo(vector<DriveInfo>& results) {
	wchar_t buffer[1000];
	auto result = GetLogicalDriveStringsW(sizeof(buffer) / 2, buffer);
	auto count = result / 4;
	for (unsigned i = 0; i < count; i++)
	{
		DriveInfo di;
		auto name = buffer + i * 4;
		di.Name = Utf8Encode(name);

		WIN32_FILE_ATTRIBUTE_DATA data{ 0 };
		GetFileAttributesExW(name, GetFileExInfoStandard, &data);
		di.IsReady = data.dwFileAttributes != 0;
		if (di.IsReady)
		{
			wchar_t text[50];
			GetVolumeInformationW(name, text, sizeof(text) / 2, nullptr, nullptr, nullptr, nullptr, 0);
			di.VolumeLabel = Utf8Encode(text);
			di.Type = GetDriveTypeW(name);

			ULARGE_INTEGER nil{ 0 };
			GetDiskFreeSpaceExW(name, &nil, &di.TotalSize, &nil);
			results.push_back(di);
		}
	}
}

void GetFileVersion(const wstring& path, string& info) {
	char buffer[1000];
	if (!GetRawFileVersion(path.c_str(), 0, sizeof(buffer), buffer)) 
		return; 

	VS_FIXEDFILEINFO *fixedFileInfo{ nullptr };
	uint32_t len{ 0 };
	VerRawQueryValue(buffer, L"\\", reinterpret_cast<void**>(&fixedFileInfo), &len);

	int file_major = HIWORD(fixedFileInfo->dwFileVersionMS);
	int file_minor = LOWORD(fixedFileInfo->dwFileVersionMS);
	int file_build = HIWORD(fixedFileInfo->dwFileVersionLS);
	int file_private = LOWORD(fixedFileInfo->dwFileVersionLS);

	stringstream result;
	result << file_major << "." << file_minor << "." << file_private << "." << file_build;
	info = move(result.str());
}

HWND CreateParent() 
{
    return CreateWindowW(windowClass, L"", WS_POPUP | WS_VISIBLE,
        0, 20, 0, 20, GetForegroundWindow(), nullptr, GetModuleHandleW(L"addon.node"), nullptr);
}


int CreateDirectory(const wstring& path) {
    auto result = SHCreateDirectoryExW(GetForegroundWindow(), path.c_str(), nullptr);
    if (result == 5) 
    {
        SHFILEOPSTRUCTW fo{ 0 };
        fo.hwnd = CreateParent();
		fo.fFlags = FOF_NOCONFIRMATION | FOF_NOCONFIRMMKDIR;
		fo.wFunc = FO_MOVE;
		wchar_t temppath[MAX_PATH + 1000];
		memset(temppath, 0, sizeof(temppath));
        GetTempPathW(MAX_PATH, temppath);
        wcscat(temppath, L"commandernewfolder");
        SHCreateDirectoryExW(fo.hwnd, temppath, nullptr);

		fo.pFrom = temppath;
        wchar_t destpath[MAX_PATH + 1000];
        memset(destpath, 0, sizeof(destpath));
        wcscpy(destpath, path.c_str());
		fo.pTo = destpath;
		result = SHFileOperationW(&fo);

        DestroyWindow(fo.hwnd);

        RemoveDirectoryW(temppath);
    }
    return result;
}

LRESULT CALLBACK WndProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam)
{
    switch (message)
    {
    default:
        return DefWindowProc(hWnd, message, wParam, lParam);
    }
    return 0;
}

void RegisterClass()
{
    WNDCLASSEXW wcex;

    wcex.cbSize = sizeof(WNDCLASSEX);

    wcex.style          = CS_HREDRAW | CS_VREDRAW;
    wcex.lpfnWndProc    = WndProc;
    wcex.cbClsExtra     = 0;
    wcex.cbWndExtra     = 0;
    wcex.hInstance      = GetModuleHandleW(L"addon.node");
    wcex.hIcon          = 0;
    wcex.hCursor        = LoadCursor(nullptr, IDC_ARROW);
    wcex.hbrBackground  = (HBRUSH)(COLOR_WINDOW+1);
    wcex.lpszMenuName   = 0;
    wcex.lpszClassName  = windowClass;
    wcex.hIconSm        = 0;

    RegisterClassExW(&wcex);
}