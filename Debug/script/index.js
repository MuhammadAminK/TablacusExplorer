//Tablacus Explorer

te.ClearEvents();
var g_Bar = "";
var Addon = 1;
var Addons = {"_stack": []};
var Init = false;
var OpenMode = SBSP_SAMEBROWSER;
var ExtraMenus = {};
var ExtraMenuCommand = [];
var g_arBM = [];

var GetAddress = null;
var ShowContextMenu = null;

var g_tidResize = null;
var xmlWindow = null;
var g_Panels = [];
var g_KeyCode = {};
var g_KeyState = [
	[0x1d0000, 0x2000],
	[0x2a0000, 0x1000],
	[0x380000, 0x4000],
	["Win",    0x8000],
	["Ctrl",   0x2000],
	["Shift",  0x1000],
	["Alt",    0x4000]
];
var g_dlgs = {};
var Addon_Id = "";

RunEvent1 = function (en, a1, a2, a3)
{
	var eo = eventTE[en];
	for (var i in eo) {
		try {
			eo[i](a1, a2, a3);
		}
		catch (e) {
			ShowError(e, en, i);
		}
	}
}

RunEvent2 = function (en, a1, a2, a3, a4)
{
	var eo = eventTE[en];
	for (var i in eo) {
		try {
			var hr = eo[i](a1, a2, a3, a4);
			if (isFinite(hr) && hr != S_OK) {
				return hr; 
			}
		}
		catch (e) {
			ShowError(e, en, i);
		}
	}
	return S_OK; 
}

RunEvent3 = function (en, a1, a2, a3, a4, a5, a6, a7, a8, a9)
{
	var eo = eventTE[en];
	var ea = eventTA[en];
	for (var i in eo) {
		try {
			var hr = eo[i](a1, a2, a3, a4, a5, a6, a7, a8, a9);
			if (isFinite(hr)) {
				return hr; 
			}
		}
		catch (e) {
			ShowError(e, en, i);
		}
	}
}

RunEvent4 = function (en, a1, a2)
{
	var eo = eventTE[en];
	for (var i in eo) {
		try {
			var r = eo[i](a1, a2);
			if (r !== undefined) {
				return r; 
			}
		}
		catch (e) {
			ShowError(e, en, i);
		}
	}
}

PanelCreated = function (Ctrl)
{
	RunEvent1("PanelCreated", Ctrl);
}

ChangeView = function (Ctrl)
{
	te.Data.bSaveConfig = true;
	ChangeTabName(Ctrl);
	RunEvent1("ChangeView", Ctrl);
}

SetAddress = function (s)
{
	RunEvent1("SetAddress", s);
}

ChangeTabName = function (Ctrl)
{
	Ctrl.Title = GetTabName(Ctrl);
}

GetTabName = function (Ctrl)
{
	if (Ctrl.FolderItem) {
		var en = "GetTabName";
		var eo = eventTE[en];
		for (var i in eo) {
			try {
				var s = eo[i](Ctrl);
				if (s) {
					return s;
				}
			}
			catch (e) {
				ShowError(e, en, i);
			}
		}
		return Ctrl.FolderItem.Name;
	}
}

CloseView = function (Ctrl)
{
	return RunEvent2("CloseView", Ctrl);
}

DeviceChanged = function (Ctrl)
{
	g_tidDevice = null;
	RunEvent1("DeviceChanged", Ctrl);
}

ListViewCreated = function (Ctrl)
{
	RunEvent1("ListViewCreated", Ctrl);
}

TabViewCreated = function (Ctrl)
{
	RunEvent1("TabViewCreated", Ctrl);
}

TreeViewCreated = function (Ctrl)
{
	RunEvent1("TreeViewCreated", Ctrl);
}

SetAddrss = function (s)
{
	RunEvent1("SetAddrss", s);
}

RestoreFromTray = function ()
{
	api.ShowWindow(te.hwnd, api.IsIconic(te.hwnd) ? SW_RESTORE : SW_SHOW);
	RunEvent1("RestoreFromTray");
}

Finalize = function ()
{
	RunEvent1("Finalize");
	SaveConfig();
}

SetGestureText = function (Ctrl, Text)
{
	RunEvent3("SetGestureText", Ctrl, Text);
}

IsSavePath = function (path)
{
	var en = "IsSavePath";
	var eo = eventTE[en];
	for (var i in eo) {
		try {
			if (!eo[i](path)) {
				return false;
			}
		}
		catch (e) {
			ShowError(e, en, i);
		}
	}
	return !IsSearchPath(path);
}

Lock = function (Ctrl, nIndex, turn)
{
	var FV = Ctrl[nIndex];
	if (FV) {
		if (turn) {
			FV.Data.Lock = !FV.Data.Lock;
		}
		RunEvent1("Lock", Ctrl, nIndex, FV.Data.Lock);
	}
}

LoadConfig = function ()
{
	var xml = OpenXml("window.xml", true, false);
	if (xml) {
		xmlWindow = xml;
		arKey = ["Conf", "Tab", "Tree", "View"]
		for (var j in arKey) {
			var key = arKey[j];
			var items = xml.getElementsByTagName(key);
			if (items.length == 0 && j == 0) {
				items = xml.getElementsByTagName('Config');
			}
			for (var i = 0; i < items.length; i++) {
				var item = items[i];
				var s = item.text;
				if (s == "0") {
					s = 0;
				}
				te.Data[key + "_" + item.getAttribute("Id")] = s;
			}
		}
		var items = xml.getElementsByTagName('Window');
		for (var i = 0; i < items.length; i++) {
			var item = items[i];
			var x = item.getAttribute("Left");
			var y = item.getAttribute("Top")
			if (x > -30000 && y > -30000) {
				api.MoveWindow(te.hwnd, x, y, item.getAttribute("Width"), item.getAttribute("Height"), 0);
				var nCmdShow = item.getAttribute("CmdShow");
				if (nCmdShow != SW_SHOWNORMAL) {
					api.ShowWindow(te.hwnd, nCmdShow);
				}
			}
		}
	}
	else {
		xmlWindow = "Init";
	}
}

SaveConfig = function ()
{
	RunEvent1("SaveConfig");
	if (te.Data.bSaveMenus) {
		te.Data.bSaveMenus = false;
		SaveXmlEx("menus.xml", te.Data.xmlMenus);
	}
	if (te.Data.bSaveAddons) {
		te.Data.bSaveAddons = false;
		SaveXmlEx("addons.xml", te.Data.Addons);
	}
	if (te.Data.bSaveConfig) {
		te.Data.bChanged = false;
		SaveXml(fso.BuildPath(te.Data.DataFolder, "config\\window.xml"), true);
	}
}

Resize = function ()
{
	if (!g_tidResize) {
		clearTimeout(g_tidResize);
		g_tidResize = setTimeout(Resize2, 500);
	}
}

Resize2 = function ()
{
	if (g_tidResize) {
		clearTimeout(g_tidResize);
		g_tidResize = null;
	}
	o = document.getElementById("toolbar");
	if (o) {
		te.offsetTop = o.offsetHeight;
	}
	else {
		te.offsetTop = 0;
	}

	var h = 0;
	o = document.getElementById("bottombar");
	if (o) {
		te.offsetBottom = o.offsetHeight;
		o = document.getElementById("client");
		if (o) {
			h = (document.documentElement ? document.documentElement.offsetHeight : document.body.offsetHeight) - te.offsetBottom - te.offsetTop;
			o.style.height = ((h >= 0) ? h : 0) + "px";
		}
	}
	o = document.getElementById("leftbarT");
	if (o) {
		var i = h;
		o.style.height = ((i >= 0) ? i : 0) + "px";
		i = o.clientHeight - o.style.height.replace(/\D/g, "");

		var h2 = o.clientHeight - document.getElementById("LeftBar1").offsetHeight - document.getElementById("LeftBar3").offsetHeight;
		o = document.getElementById("LeftBar2");
		o.style.height = h2 - i + "px";
	}
	o = document.getElementById("rightbarT");
	if (o) {
		var i = h;
		o.style.height = ((i >= 0) ? i : 0) + "px";
	}

	var w2 = 0;
	var w = 0;
	var o = te.Data.Locations;
	if (o.LeftBar1 || o.LeftBar2 || o.LeftBar3) {
		w = te.Data.Conf_LeftBarWidth;
	}
	var o = document.getElementById("leftbar");
	if (o) {
		w = (w > 0) ? w : 0;
		o.style.width = w + "px";
		for (var i = 1; i <= 3; i++) {
			var ob = document.getElementById("LeftBar" + i);
			if (ob && api.StrCmpI(ob.style.display, "none")) {
				pt = GetPos(ob);
				o.style.width = w + "px";
				w2 = w;
				break;
			}
		}
	}
	te.offsetLeft = w2;

	w2 = 0;
	w = 0;
	var o = te.Data.Locations;
	if (o.RightBar1 || o.RightBar2 || o.RightBar3) {
		w = te.Data.Conf_RightBarWidth;
	}
	var o = document.getElementById("rightbar");
	if (o) {
		w = (w > 0) ? w : 0;
		o.style.width = w + "px";
		for (var i = 1; i <= 3; i++) {
			var ob = document.getElementById("RightBar" + i);
			if (ob && api.StrCmpI(ob.style.display, "none")) {
				o.style.width = w + "px";
				w2 = w;
				break;
			}
		}
	}
	te.offsetRight = w2;
	o = document.getElementById("Background");
	if (o) {
		w = (document.documentElement ? document.documentElement.offsetWidth : document.body.offsetWidth) - te.offsetLeft - te.offsetRight;
		if (w > 0) {
			o.style.width = w + "px";
		}
	}
	RunEvent1("Resize");
}

LoadLang = function (bAppend)
{
	if (!bAppend) {
		MainWindow.Lang = {};
		MainWindow.LangSrc = {};
	}
	var filename = fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "lang\\" + GetLangId() + ".xml");
	LoadLang2(filename);
}

Refresh = function ()
{
	var FV = te.Ctrl(CTRL_FV);
	if (FV) {
		FV.Refresh();
	}
}

AddFavorite = function (FolderItem)
{
	var xml = te.Data.xmlMenus;
	var menus = xml.getElementsByTagName("Favorites");
	if (menus && menus.length) {
		var item = xml.createElement("Item");
		if (!FolderItem) {
			var FV = te.Ctrl(CTRL_FV);
			if (FV) {
				FolderItem = FV.FolderItem;
			}
		}
		if (!FolderItem) {
			return false;
		}
		var s = InputDialog(GetText("Add Favorite"), api.GetDisplayNameOf(FolderItem, SHGDN_INFOLDER));
		if (s) {
			item.setAttribute("Name", s);
			item.setAttribute("Filter", "");
			item.text = api.GetDisplayNameOf(FolderItem, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_FORPARSINGEX);
			if (fso.FileExists(item.text)) {
				item.text = api.PathQuoteSpaces(item.text);
				item.setAttribute("Type", "Exec");
			}
			else {
				item.setAttribute("Type", "Open");
			}
			menus[0].appendChild(item);
			SaveXmlEx("menus.xml", xml);
			return true;
		}
	}
	return false;
}

CreateNewFolder = function (Ctrl, pt)
{
	var path = InputDialog(GetText("New Folder"), "");
	if (path) {
		if (!path.match(/^[A-Z]:\\|^\\/i)) {
			var FV = GetFolderView(Ctrl, pt);
			path = fso.BuildPath(FV.FolderItem.Path, path);
		}
		CreateFolder(path);
	}
}

CreateNewFile = function (Ctrl, pt)
{
	var path = InputDialog(GetText("New File"), "");
	if (path) {
		if (!path.match(/^[A-Z]:\\|^\\/i)) {
			var FV = GetFolderView(Ctrl, pt);
			path = fso.BuildPath(FV.FolderItem.Path, path);
		}
		CreateFile(path);
	}
}

CancelFilterView = function (FV)
{
	if (IsSearchPath(FV) || FV.FilterView) {
		FV.Navigate(null, SBSP_PARENT);
		return S_OK;
	}
	return S_FALSE;
}

IsSearchPath = function (FI)
{
	return api.PathMatchSpec(api.GetDisplayNameOf(FI, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING), "search-ms:*");
}

GetCommandId = function (hMenu, s, ContextMenu)
{
	var arMenu = [hMenu];
	var wId = 0;
	if (s) {
		var sl = GetText(s);
		var mii = api.Memory("MENUITEMINFO");
		mii.cbSize = mii.Size;
		mii.fMask = MIIM_SUBMENU | MIIM_ID | MIIM_FTYPE | MIIM_STATE;
		while (arMenu.length) {
			hMenu = arMenu.pop();
			if (ContextMenu) {
				ContextMenu.HandleMenuMsg(WM_INITMENUPOPUP, hMenu, 0);
			}
			var i = api.GetMenuItemCount(hMenu);
			if (i == 1 && ContextMenu && osInfo.dwMajorVersion > 5) {
				setTimeout('api.EndMenu()', 200);
				api.TrackPopupMenuEx(hMenu, TPM_RETURNCMD, 0, 0, te.hwnd, null, ContextMenu);
				i = api.GetMenuItemCount(hMenu);
			}
			while (i-- > 0) {
				if (api.GetMenuItemInfo(hMenu, i, true, mii) && !(mii.fType & MFT_SEPARATOR) && !(mii.fState & MFS_DISABLED)) {
					var title = api.GetMenuString(hMenu, i, MF_BYPOSITION);
					if (title) {
						var a = title.split(/\t/);
						if (api.PathMatchSpec(a[0], s) || api.PathMatchSpec(a[0], sl) || api.PathMatchSpec(a[1], s) || (ContextMenu && api.PathMatchSpec(ContextMenu.GetCommandString(mii.wId - 1, GCS_VERB), s))) {
							wId = mii.hSubMenu ? api.TrackPopupMenuEx(mii.hSubMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, ContextMenu) : mii.wId;
							arMenu.length = 0;
							break;
						}
						if (mii.hSubMenu) {
							arMenu.push(mii.hSubMenu);
						}
					}
				}
			}
			if (ContextMenu) {
				ContextMenu.HandleMenuMsg(WM_UNINITMENUPOPUP, hMenu, 0);
			}
		}
	}
	return wId;
};

OpenSelected = function (Ctrl, NewTab)
{
	if (Ctrl.Type <= CTRL_EB) {
		var Exec = [];
		var Selected = Ctrl.SelectedItems();
		for (var i in Selected) {
			var Item = Selected.Item(i);
			var bFolder = Item.IsFolder;
			if (!bFolder) {
				if (Item.IsLink) {
					var path = "";
					try {
						path = Item.GetLink.Path;
					} catch (e) {
						if (e.number == api.LowPart(0x800a0046)) {
							var sc = wsh.CreateShortcut(Item.Path);
							if (sc) {
								path = sc.TargetPath;
							}
						}
					}
					bFolder = path == "" || fso.FolderExists(path);
				}
			}
			if (bFolder) {
			 	Ctrl.Navigate(Item, NewTab);
			 	NewTab |= SBSP_NEWBROWSER;
			}
			else {
				Exec.push(Item);
			}
		}
		if (Exec.length) {
			if (Selected.Count != Exec.length) {
				Selected = te.FolderItems();
				for (var i = 0; i < Exec.length; i++) {
					Selected.AddItem(Exec[i]);
				}
			}
			InvokeCommand(Selected, 0, te.hwnd, null, null, null, SW_SHOWNORMAL, 0, 0, Ctrl, CMF_DEFAULTONLY);
		}
	}
	return S_OK;
}

SendCommand = function (Ctrl, nVerb)
{
	if (nVerb) {
		var hwnd = Ctrl.hwndView;
		if (!hwnd) {
			var FV = te.Ctrl(CTRL_FV);
			if (FV) {
				hwnd = FV.hwndView;
			}
		}
		api.SendMessage(hwnd, WM_COMMAND, nVerb, 0);
	}
}

IncludeObject = function (FV, Item)
{
	if (api.PathMatchSpec(Item.Name, FV.Data.Filter)) {
		return S_OK;
	}
	return S_FALSE;
}

EnableDragDrop = function ()
{
}

DisableImage = function (img, bDisable)
{
	if (img) {
		if (api.QuadPart(document.documentMode) < 10) {
			img.style.filter = bDisable ? "gray(); alpha(style=0,opacity=48);": "";
		}
		else {
			var s = img.src;
			if (bDisable) {
				if (s.match(/^data:image\/png/i)) {
					img.src = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ' + img.offsetWidth + ' ' + img.offsetHeight + '"><filter id="G"><feColorMatrix type="saturate" values="0.1" /></filter><image width="' + img.width + '" height="' + img.height + '" xlink:href="' + img.src + '" filter="url(#G)" opacity=".48"></image></svg>');
				}
			}
			else if (s.match(/^data:image\/svg/i) && decodeURIComponent(s).match(/href="([^"]*)/i)) {
				img.src = RegExp.$1
			}
		}
	}
}

//Events

te.OnCreate = function (Ctrl)
{
	if (!Ctrl.Data && Ctrl.Type != CTRL_TE) {
		Ctrl.Data = te.Object();
	}
	RunEvent1("Create", Ctrl);
	if (Ctrl.Type == CTRL_TE) {
		RunCommandLine(api.GetCommandLine());
	}
}

te.OnClose = function (Ctrl)
{
	if (Ctrl.Type == CTRL_TC) {
		var o = document.getElementById("Panel_" + Ctrl.Id);
		if (o) {
			o.style.display = "none";
		}
	}
	return RunEvent2("Close", Ctrl);
}

AddEvent("Close", function (Ctrl)
{
	switch (Ctrl.Type) {
		case CTRL_TE:
			Finalize();
			if (api.GetThreadCount() && wsh.Popup(GetText("File is in operation."), 0, TITLE, MB_ICONSTOP | MB_ABORTRETRYIGNORE) != IDIGNORE) {
				return S_FALSE;
			}
			api.SHChangeNotifyDeregister(te.Data.uRegisterId);
			break;
		case CTRL_WB:
			break;
		case CTRL_SB:
		case CTRL_EB:
			if (Ctrl.Data.Lock) {
				return S_FALSE;
			}
			return CloseView(Ctrl);
		case CTRL_TC:
			break;
	}
});

te.OnViewCreated = function (Ctrl)
{
	switch (Ctrl.Type) {
		case CTRL_SB:
		case CTRL_EB:
			ListViewCreated(Ctrl);
			ChangeView(Ctrl);
			break;
		case CTRL_TC:
			TabViewCreated(Ctrl);
			break;
		case CTRL_TV:
			TreeViewCreated(Ctrl);
			break;
	}
	RunEvent1("ViewCreated", Ctrl);
}

te.OnBeforeNavigate = function (Ctrl, fs, wFlags, Prev)
{
	if (Ctrl.Data.Lock && (wFlags & SBSP_NEWBROWSER) == 0) {
		return E_ACCESSDENIED;
	}
	return RunEvent2("BeforeNavigate", Ctrl, fs, wFlags, Prev);
}

ShowStatusText = function (Ctrl, Text, iPart)
{
	RunEvent1("StatusText", Ctrl, Text, iPart);
	return S_OK; 
}

te.OnStatusText = ShowStatusText;

te.OnKeyMessage = function (Ctrl, hwnd, msg, key, keydata)
{
	var hr = RunEvent3("KeyMessage", Ctrl, hwnd, msg, key, keydata);
	if (isFinite(hr)) {
		return hr; 
	}
	if (msg == WM_KEYDOWN || msg == WM_SYSKEYDOWN) {
		var nKey = ((keydata >> 16) & 0x17f) | GetKeyShift();
		te.Data.cmdKey = nKey;
		switch (Ctrl.Type) {
			case CTRL_SB:
			case CTRL_EB:
				var strClass = api.GetClassName(hwnd);
				if (api.PathMatchSpec(strClass, WC_LISTVIEW + ";DirectUIHWND")) {
					if (KeyExecEx(Ctrl, "List", nKey, hwnd) === S_OK) {
						return S_OK;
					}
				}
				break;
			case CTRL_TV:
				var strClass = api.GetClassName(hwnd);
				if (api.strcmpi(strClass, WC_TREEVIEW) == 0) {
					if (KeyExecEx(Ctrl, "Tree", nKey, hwnd) === S_OK) {
						return S_OK;
					}
				}
				break;
			case CTRL_WB:
				if (KeyExecEx(Ctrl, "Browser", nKey, hwnd) === S_OK) {
					return S_OK;
				}
				break;
			default:
				if (window.g_menu_click) {
					if (key == VK_RETURN) {
						var hSubMenu = api.GetSubMenu(window.g_menu_handle, window.g_menu_pos);
						if (hSubMenu) {
							var mii = api.Memory("MENUITEMINFO");
							mii.cbSize = mii.Size;
							mii.fMask = MIIM_SUBMENU;
							api.SetMenuItemInfo(window.g_menu_handle, window.g_menu_pos, true, mii);
							api.DestroyMenu(hSubMenu);
							api.PostMessage(hwnd, WM_CHAR, VK_LBUTTON, 0);
						}
						window.g_menu_button = api.GetKeyState(VK_SHIFT) >= 0 ? 1 : 2;
						if (api.GetKeyState(VK_CONTROL) < 0) {
							window.g_menu_button = 3;
						}
					}
				}
				break;
		}
		if (Ctrl.Type != CTRL_TE) {
			if (KeyExecEx(Ctrl, "All", nKey, hwnd) === S_OK) {
				return S_OK;
			}
		}
	}
	return S_FALSE; 
}

te.OnMouseMessage = function (Ctrl, hwnd, msg, wParam, pt)
{
	var hr = RunEvent3("MouseMessage", Ctrl, hwnd, msg, wParam, pt);
	if (isFinite(hr)) {
		return hr; 
	}
	if (msg == WM_MOUSEWHEEL) {
		var Ctrl2 = te.CtrlFromPoint(pt);
		if (Ctrl2) {
			g_mouse.str = GetGestureKey() + GetGestureButton() + (wParam > 0 ? "8" : "9");
			if (api.GetKeyState(VK_RBUTTON) < 0) {
				g_mouse.CancelButton = true;
			}
			var hr = g_mouse.Exec(Ctrl2, hwnd, pt);
			g_mouse.EndGesture(false);
			if (hr == S_OK) {
				return hr;
			}
			if (Ctrl2.Type == CTRL_TC) {
				ChangeTab(Ctrl2, wParam > 0 ? -1 : 1)
				return S_OK;
			}
			var hwnd2 = api.WindowFromPoint(pt);
			if (hwnd2 && hwnd != hwnd2) {
				api.SetFocus(hwnd2);
				api.SendMessage(hwnd2, msg, wParam & 0xffff0000, pt.x + (pt.y << 16));
				return S_OK;
			}
		}
	}
	if (msg == WM_LBUTTONUP || msg == WM_RBUTTONUP || msg == WM_MBUTTONUP || msg == WM_XBUTTONUP) {
		if (g_mouse.GetButton(msg, wParam) == g_mouse.str.charAt(0)) {
			var hr = S_FALSE;
			var bButton = false;
			if (msg == WM_RBUTTONUP) {
				if (g_mouse.RButton >= 0) {
					g_mouse.RButtonDown(true);
					bButton = api.strcmpi(g_mouse.str, "2") == 0;
				}
				else if (Ctrl.Type == CTRL_SB || Ctrl.Type == CTRL_EB) {
					var iItem = Ctrl.HitTest(pt, LVHT_ONITEM);
					if (iItem < 0 && !IsDrag(pt, te.Data.pt)) {
						Ctrl.SelectItem(null, SVSI_DESELECTOTHERS);
					}
				}
			}
			if (g_mouse.str.length >= 2 || !IsDrag(pt, te.Data.pt)) {
				hr = g_mouse.Exec(te.CtrlFromWindow(g_mouse.hwndGesture), g_mouse.hwndGesture, pt);
			}
			var s = g_mouse.str;
			g_mouse.EndGesture(false);
			if (g_mouse.bCapture) {
				api.ReleaseCapture();
				g_mouse.bCapture = false;
			}
			if (g_mouse.CancelButton || hr == S_OK) {
				g_mouse.CancelButton = false;
				return S_OK;
			}
			if (bButton) {
				api.PostMessage(g_mouse.hwndGesture, WM_CONTEXTMENU, g_mouse.hwndGesture, pt.x + (pt.y << 16));
				return S_OK;
			}
		}
	}
	if (msg == WM_LBUTTONDOWN || msg == WM_RBUTTONDOWN || msg == WM_MBUTTONDOWN || msg == WM_XBUTTONDOWN) {
		if (g_mouse.str.length == 0) {
			te.Data.pt = pt;
			g_mouse.ptGesture.x = pt.x;
			g_mouse.ptGesture.y = pt.y;
			g_mouse.hwndGesture = hwnd;
		}
		g_mouse.str += g_mouse.GetButton(msg, wParam);
		g_mouse.StartGestureTimer();
		SetGestureText(Ctrl, GetGestureKey() + g_mouse.str);
		if (msg == WM_RBUTTONDOWN) {
			if (te.Data.Conf_Gestures >= 2) {
				var iItem = -1;
				if (Ctrl.Type == CTRL_SB || Ctrl.Type == CTRL_EB) {
					iItem = Ctrl.HitTest(pt, LVHT_ONITEM);
					if (iItem < 0) {
						return S_OK;
					}
				}
				if (te.Data.Conf_Gestures == 3) {
					g_mouse.RButton = iItem;
					g_mouse.StartGestureTimer();
					return S_OK;
				}
			}
		}
	}
	if (msg == WM_LBUTTONDBLCLK || msg == WM_RBUTTONDBLCLK || msg == WM_MBUTTONDBLCLK || msg == WM_XBUTTONDBLCLK) {
		var strClass = api.GetClassName(hwnd);
		if (api.strcmpi(strClass, WC_HEADER)) {
			te.Data.pt = pt;
			g_mouse.str = g_mouse.GetButton(msg, wParam);
			g_mouse.str += g_mouse.str;
			var hr = g_mouse.Exec(Ctrl, hwnd, pt);
			g_mouse.EndGesture(false);
			if (hr == S_OK) {
				return hr;
			}
		}
	}

	if (msg == WM_MOUSEMOVE) {
		if (api.GetKeyState(VK_ESCAPE) < 0) {
			g_mouse.EndGesture(false);
		}
		if (g_mouse.str.length && (te.Data.Conf_Gestures > 1 && api.GetKeyState(VK_RBUTTON) < 0) || (te.Data.Conf_Gestures && (api.GetKeyState(VK_MBUTTON) < 0 || api.GetKeyState(VK_XBUTTON1) < 0 || api.GetKeyState(VK_XBUTTON2) < 0))) {
			var x = (pt.x - g_mouse.ptGesture.x);
			var y = (pt.y - g_mouse.ptGesture.y);
			if (Math.abs(x) + Math.abs(y) >= 20) {
				if (te.Data.Conf_TrailSize) {
					var hdc = api.GetWindowDC(te.hwnd);
					if (hdc) {
						var rc = api.Memory("RECT");
						api.GetWindowRect(te.hwnd, rc);
						api.MoveToEx(hdc, g_mouse.ptGesture.x - rc.left, g_mouse.ptGesture.y - rc.top, null);
						var pen1 = api.CreatePen(PS_SOLID, te.Data.Conf_TrailSize, te.Data.Conf_TrailColor);
						var hOld = api.SelectObject(hdc, pen1);
						api.LineTo(hdc, pt.x - rc.left, pt.y - rc.top);
						api.SelectObject(hdc, hOld);
						api.DeleteObject(pen1);
						g_mouse.bTrail = true;
						api.ReleaseDC(te.hwnd, hdc);
					}
				}
				g_mouse.ptGesture.x = pt.x;
				g_mouse.ptGesture.y = pt.y;
				var s = (Math.abs(x) >= Math.abs(y)) ? ((x < 0) ? "L" : "R") :  ((y < 0) ? "U" : "D");

				if (s != g_mouse.str.charAt(g_mouse.str.length - 1)) {
					g_mouse.str += s;
					SetGestureText(Ctrl, GetGestureKey() + g_mouse.str);
				}
				if (!g_mouse.bCapture) {
					api.SetCapture(g_mouse.hwndGesture);
					g_mouse.bCapture = true;
				}
				g_mouse.StartGestureTimer();
			}
		}
	}
	return g_mouse.str.length >= 2 ? S_OK : S_FALSE;
}

te.OnCommand = function (Ctrl, hwnd, msg, wParam, lParam)
{
	te.Data.bSaveConfig = true;
	var hr = RunEvent3("Command", Ctrl, hwnd, msg, wParam, lParam);
	return isFinite(hr) ? hr : S_FALSE; 
}

te.OnInvokeCommand = function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon)
{
	te.Data.bSaveConfig = true;
	var hr = RunEvent3("InvokeCommand", ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon);
	if (isFinite(hr)) {
		return hr; 
	}
	var Items = ContextMenu.Items();
	var Exec = [];
	if (isFinite(Verb)) {
		Verb = ContextMenu.GetCommandString(Verb, GCS_VERB);
	}
	NewTab = SBSP_SAMEBROWSER;
	for (var i = 0; i < Items.Count; i++) {
		if (Verb && !api.PathMatchSpec(Verb, "runas")) {
			var path = Items.Item(i).Path;
			var cmd = api.AssocQueryString(ASSOCF_NONE, ASSOCSTR_COMMAND, path, api.strcmpi(Verb, "Default") ? Verb : null).replace(/"?%1"?|%L/g, api.PathQuoteSpaces(path)).replace(/%\*|%I/g, "");
			if (cmd) {
				ShowStatusText(te, Verb + ":" + cmd, 1);
				if (api.PathMatchSpec(Verb, "open") && api.PathMatchSpec(cmd, "*\Explorer.exe /idlist,*;rundll32.exe *fldr.dll,RouteTheCall*")) {
					Navigate(Items.Item(i), NewTab);
				 	NewTab |= SBSP_NEWBROWSER;
					continue;
				}
				if (cmd.indexOf("%") < 0) {
					var cmd2 = ExtractMacro(te, cmd);
					if (api.strcmpi(cmd, cmd2)) {
						wsh.Run(cmd2, nShow, false);
						continue;
					}
				}
			}
			if (api.PathMatchSpec(Verb, "open") && IsFolderEx(Items.Item(i))) {
				Navigate(Items.Item(i), NewTab);
			 	NewTab |= SBSP_NEWBROWSER;
				continue;
			}
		}
		Exec.push(Items.Item(i));
	}
	if (Items.Count != Exec.length) {
		if (Exec.length) {
			var Selected = te.FolderItems();
			for (var i = 0; i < Exec.length; i++) {
				Selected.AddItem(Exec[i]);
			}
			InvokeCommand(Selected, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon, ContextMenu.FolderView);
		}
		return S_OK;
	}
	ShowStatusText(te, (Verb || "") + ":" + (Items.Count == 1 ? Items.Item(0).Path : Items.Count), 1);
	return S_FALSE; 
}

te.OnDragEnter = function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
{
	var hr = E_NOTIMPL;
	var dwEffect = pdwEffect[0];
	var en = "DragEnter";
	var eo = eventTE[en];
	for (var i in eo) {
		try {
			pdwEffect[0] = dwEffect;
			var hr2 = eo[i](Ctrl, dataObj, grfKeyState, pt, pdwEffect);
			if (isFinite(hr2) && hr != S_OK) {
				hr = hr2;
			}
		}
		catch (e) {
			ShowError(e, en, i);
		}
	}
	g_mouse.str = "";
	return hr; 
}

te.OnDragOver = function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
{
	var dwEffect = pdwEffect[0];
	var en = "DragOver";
	var eo = eventTE[en];
	for (var i in eo) {
		try {
			pdwEffect[0] = dwEffect;
			var hr = eo[i](Ctrl, dataObj, grfKeyState, pt, pdwEffect);
			if (isFinite(hr)) {
				return hr; 
			}
		}
		catch (e) {
			ShowError(e, en, i);
		}
	}
	return E_NOTIMPL; 
}

te.OnDrop = function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
{
	var dwEffect = pdwEffect[0];
	var en = "Drop";
	var eo = eventTE[en];
	for (var i in eo) {
		try {
			pdwEffect[0] = dwEffect;
			var hr = eo[i](Ctrl, dataObj, grfKeyState, pt, pdwEffect);
			if (isFinite(hr)) {
				return hr; 
			}
		}
		catch (e) {
			ShowError(e, en, i);
		}
	}
	return E_NOTIMPL; 
}

te.OnDragleave = function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
{
	var hr = E_NOTIMPL;
	var en = "Dragleave";
	var eo = eventTE[en];
	for (var i in eo) {
		try {
			var hr2 = eo[i](Ctrl, dataObj, grfKeyState, pt, pdwEffect);
			if (isFinite(hr2) && hr != S_OK) {
				hr = hr2;
			}
		}
		catch (e) {
			ShowError(e, en, i);
		}
	}
	g_mouse.str = "";
	return hr; 
}

te.OnSelectionChanging = function (Ctrl)
{
	var hr = RunEvent3("SelectionChanging", Ctrl);
	return isFinite(hr) ? hr : S_OK;
}

te.OnSelectionChanged = function (Ctrl, uChange)
{
	if (Ctrl.Type == CTRL_TC && Ctrl.SelectedIndex >= 0) {
		ChangeView(Ctrl.Selected);
	}
	var hr = RunEvent3("SelectionChanged", Ctrl, uChange);
	return isFinite(hr) ? hr : S_OK;
}

te.OnShowContextMenu = function (Ctrl, hwnd, msg, wParam, pt)
{
	var hr = RunEvent3("ShowContextMenu", Ctrl, hwnd, msg, wParam, pt);
	if (isFinite(hr)) {
		return hr; 
	}
	switch (Ctrl.Type) {
		case CTRL_SB:
		case CTRL_EB:
			var Selected = Ctrl.SelectedItems();
			if (Selected.Count) {
				if (ExecMenu(Ctrl, "Context", pt, 1) == S_OK) {
					return S_OK;
				}
			}
			else {
				if (ExecMenu(Ctrl, "ViewContext", pt, 1) == S_OK) {
					return S_OK;
				}
			}
			break;
		case CTRL_TV:
			if (ExecMenu(Ctrl, "Tree", pt, 1) == S_OK) {
				return S_OK;
			}
			break;
		case CTRL_TC:
			if (ExecMenu(Ctrl, "Tabs", pt, 1) == S_OK) {
				return S_OK;
			}
			break;
		case CTRL_WB:
			if (ShowContextMenu) {
				return ShowContextMenu(Ctrl, hwnd, msg, wParam, pt);
			}
			if (wParam == CONTEXT_MENU_DEFAULT) {
				return S_OK;
			}
			break;
		case CTRL_TE:
			api.GetSystemMenu(te.hwnd, true);
			var hMenu = api.GetSystemMenu(te.hwnd, false);
			var menus = te.Data.xmlMenus.getElementsByTagName("System");
			if (menus && menus.length) {
				var items = menus[0].getElementsByTagName("Item");
				var arMenu = OpenMenu(items, null);
				MakeMenus(hMenu, menus, arMenu, items);
			}
			api.DestroyMenu(hMenu);
			break;
	}
	return S_FALSE;
}

te.OnDefaultCommand = function (Ctrl)
{
	if (api.GetKeyState(VK_MENU) < 0) {
		return S_FALSE;
	}
	var hr = RunEvent3("DefaultCommand", Ctrl);
	if (isFinite(hr)) {
		return hr; 
	}
	if (ExecMenu(Ctrl, "Default", null, 2) != S_OK) {
		InvokeCommand(Ctrl.SelectedItems(), 0, te.hwnd, null, null, null, SW_SHOWNORMAL, 0, 0, Ctrl, CMF_DEFAULTONLY);
	}
	return S_OK;
}

te.OnItemClick = function (Ctrl, Item, HitTest, Flags)
{
	var hr = RunEvent3("ItemClick", Ctrl, Item, HitTest, Flags);
	return isFinite(hr) ? hr : S_FALSE;
}

te.OnSystemMessage = function (Ctrl, hwnd, msg, wParam, lParam)
{
	if (msg == WM_KILLFOCUS && Ctrl.Type == CTRL_TE) {
		g_mouse.str = "";
		SetGestureText(Ctrl, "");
	}
	var hr = RunEvent3("SystemMessage", Ctrl, hwnd, msg, wParam, lParam);
	if (isFinite(hr)) {
		return hr; 
	}
	switch (Ctrl.Type) {
		case CTRL_WB:
			if (msg == WM_KILLFOCUS) {
				try {
					document.selection.empty();
				} catch (e) {}
			}
			break;
		case CTRL_TE:
			switch (msg) {
				case WM_DESTROY:
					api.ImageList_Destroy(Ctrl.Data.himlTC);
					break;
				case WM_DEVICECHANGE:
					if (wParam == DBT_DEVICEARRIVAL || wParam == DBT_DEVICEREMOVECOMPLETE) {
						DeviceChanged();
					}
					break;
				case WM_SETFOCUS:
					var FV = te.Ctrl(CTRL_FV);
					if (FV) {
						api.SetFocus(FV.hwnd);
					}
					break;
				case WM_ACTIVATE:
					if (te.Data.bSaveMenus) {
						te.Data.bSaveMenus = false;
						SaveXmlEx("menus.xml", te.Data.xmlMenus);
					}
					if (te.Data.bSaveAddons) {
						te.Data.bSaveAddons = false;
						SaveXmlEx("addons.xml", te.Data.Addons);
					}
					if (te.Data.bReload) {
						te.Data.bReload = false;
						te.Reload();
					}
					break;
				case WM_SYSCOMMAND:
					if (wParam < 0xf000) {
						var menus = te.Data.xmlMenus.getElementsByTagName("System");
						if (menus && menus.length) {
							var items = menus[0].getElementsByTagName("Item");
							if (items) {
								var item = items[wParam - 1];
								if (item) {
									Exec(Ctrl, item.text, item.getAttribute("Type"), null);
									return 1;
								}
							}
						}
					}
					break;
				case WM_COPYDATA:
					var cd = api.Memory("COPYDATASTRUCT", 1, lParam);
					var hr = RunEvent3("CopyData", Ctrl, cd, wParam);
					if (isFinite(hr)) {
						return hr; 
					}
					if (cd.dwData == 0 && cd.cbData) {
						var strData = api.SysAllocStringByteLen(cd.lpData, cd.cbData);
						RestoreFromTray();
						RunCommandLine(strData);
						return S_OK;
					}
					break;
			}
			break;
		case CTRL_TC:
			if (msg == WM_SHOWWINDOW && wParam == 0) {
				var o = document.getElementById("Panel_" + Ctrl.Id);
				if (o) {
					o.style.display = "none";
				}
			}
			break;
	}
	return 0; 
};

te.OnMenuMessage = function (Ctrl, hwnd, msg, wParam, lParam)
{
	var hr = RunEvent3("MenuMessage", Ctrl, hwnd, msg, wParam, lParam);
	if (isFinite(hr)) {
		return hr; 
	}
	switch (msg) {
		case WM_INITMENUPOPUP:
			var s = api.GetMenuString(wParam, 0, MF_BYPOSITION);
			if (api.PathMatchSpec(s, "\t*Script\t*")) {
				var ar = s.split("\t");
				api.DeleteMenu(wParam, 0, MF_BYPOSITION);
				ExecScriptEx(Ctrl, ar[2], ar[1], hwnd);
			}
			break;
		case WM_MENUSELECT:
			if (lParam) {
				var s = wParam & 0xffff;
				var hSubMenu = api.GetSubMenu(lParam, s);
				if ((wParam >> 16) & MF_POPUP) {
					if (hSubMenu) {
						window.g_menu_handle = lParam;
						window.g_menu_pos = s;
					}
				}
				window.g_menu_string = api.GetMenuString(lParam, s, hSubMenu ? MF_BYPOSITION : MF_BYCOMMAND);
			}
			break;
		case WM_EXITMENULOOP:
			window.g_menu_click = false;
			var en = "ExitMenuLoop";
			var eo = eventTE[en];
			try {
				while (eo && eo.length) {
					eo.shift()();
				}
			}
			catch (e) {
				ShowError(e, en);
			}
			while (g_arBM.length) {
				api.DeleteObject(g_arBM.pop());
			}
			break;
		case WM_MENUCHAR:
			if (window.g_menu_click && (wParam & 0xffff) == VK_LBUTTON) {
				return MNC_EXECUTE << 16 + window.g_menu_pos;
			}
			break;
	}
	return S_FALSE; 
};

te.OnAppMessage = function (Ctrl, hwnd, msg, wParam, lParam)
{
	var hr = RunEvent3("AppMessage", Ctrl, hwnd, msg, wParam, lParam);
	if (isFinite(hr)) {
		return hr; 
	}
	if (msg == TWM_CHANGENOTIFY) {
		var pidls = te.FolderItems();
		var hLock = api.SHChangeNotification_Lock(wParam, lParam, pidls);
		if (hLock) {
			if (pidls.lEvent & (SHCNE_DRIVEREMOVED | SHCNE_MEDIAREMOVED | SHCNE_NETUNSHARE | SHCNE_RENAMEFOLDER | SHCNE_RMDIR | SHCNE_SERVERDISCONNECT)) {
				var cFV = te.Ctrls(CTRL_FV);
				for (var i in cFV) {
					var FV = cFV[i];
					if (api.ILIsEqual(FV, pidls[0])) {
						if (pidls.lEvent == SHCNE_RENAMEFOLDER && !FV.Data.Lock) {
							FV.Navigate(api.GetDisplayNameOf(pidls[1], SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_FORPARSINGEX), SBSP_SAMEBROWSER);
						}
						else {
							FV.Suspend();
						}
					}
					else if (api.ILIsParent(pidls[0], FV, true)) {
						if (pidls.lEvent == SHCNE_RENAMEFOLDER && !FV.Data.Lock) {
							FV.Navigate(api.GetDisplayNameOf(FV, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING).replace(api.GetDisplayNameOf(pidls[0], SHGDN_FORADDRESSBAR | SHGDN_FORPARSING), api.GetDisplayNameOf(pidls[1], SHGDN_FORADDRESSBAR | SHGDN_FORPARSING)), SBSP_SAMEBROWSER);
						}
						else {
							FV.Suspend();
						}
					}
				}
			}
			api.SHChangeNotification_Unlock(hLock);
		}
		return S_OK;
	}
	return S_FALSE;
}

te.OnNewWindow = function (Ctrl, dwFlags, UrlContext, Url)
{
	var hr = RunEvent3("NewWindow", Ctrl, dwFlags, UrlContext, Url);
	if (isFinite(hr)) {
		return hr; 
	}
	var Path = api.PathCreateFromUrl(Url);
	var FolderItem = api.ILCreateFromPath(Path);
	if (FolderItem.IsFolder) {
		Navigate(FolderItem, SBSP_NEWBROWSER);
		return S_OK;
	}
	return S_FALSE;
}

te.OnClipboardText = function (Items)
{
	var r = RunEvent4("ClipboardText", Items);
	if (r !== undefined) {
		return r; 
	}
	var s = [];
	for (var i = Items.Count; i > 0; s.unshift(api.PathQuoteSpaces(api.GetDisplayNameOf(Items.Item(--i), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING)))) {
	}
	return s.join(" ");
}

te.OnArrange = function (Ctrl, rc)
{
	if (Ctrl.Type == CTRL_TC) {
		var o = g_Panels[Ctrl.Id];
		if (!o) {
			var s = ['<table id="Panel_$" class="layout" style="position: absolute; z-index: 1;">'];
			s.push('<tr><td id="InnerLeft_$" class="sidebar" style="width: 0px; display: none"></td><td><div id="InnerTop_$" style="display: none"></div>');
			s.push('<table id="InnerTop2_$" class="layout" style="width: 100%">');
			s.push('<tr><td id="Inner1Left_$" class="toolbar1"></td><td id="Inner1Center_$" class="toolbar2" style="white-space: nowrap;"></td><td id="Inner1Right_$" class="toolbar3"></td></tr></table>');
			s.push('<table id="InnerView_$" class="layout" style="width: 100%"><tr><td id="Inner2Left_$" style="width: 0px"></td><td id="Inner2Center_$"></td><td id="Inner2Right_$" style="width: 0px"></td></tr></table>');
			s.push('<div id="InnerBottom_$"></div></td><td id="InnerRight_$" class="sidebar" style="width: 0px; display: none"></td></tr></table>');
			document.getElementById("Panel").insertAdjacentHTML("BeforeEnd", s.join("").replace(/\$/g, Ctrl.Id));
			PanelCreated(Ctrl);
			o = document.getElementById("Panel_" + Ctrl.Id);
			g_Panels[Ctrl.Id] = o;
			ApplyLang(o);
		}
		o.style.left = rc.Left + "px";
		o.style.top = rc.Top + "px";
		if (Ctrl.Visible) {
			o.style.display = !document.documentMode || api.strcmpi(o.tagName, "td") ? "block" : "table-cell";
		}
		else {
			o.style.display = "none";
		}
		var i = rc.Right - rc.Left
		o.style.width = (i >=0 ? i : 0) + "px";
		i = rc.Bottom - rc.Top;
		o.style.height = (i >=0 ? i : 0) + "px";
		rc.Top += document.getElementById("InnerTop_" + Ctrl.Id).offsetHeight + document.getElementById("InnerTop2_" + Ctrl.Id).offsetHeight;
		var w1 = 0;
		var w2 = 0;
		var x = '';
		for (i = 0; i <= 1; i++) {
			w1 += api.QuadPart(document.getElementById("Inner" + x + "Left_" + Ctrl.Id).style.width.replace(/\D/g, ""));
			w2 += api.QuadPart(document.getElementById("Inner" + x + "Right_" + Ctrl.Id).style.width.replace(/\D/g, ""));
			x = '2';
		}
		rc.Left += w1;
		rc.Right -= w2;
		rc.Bottom -= document.getElementById("InnerBottom_" + Ctrl.Id).offsetHeight;
		o = document.getElementById("Inner2Center_" + Ctrl.Id).style;
		i = rc.Right - rc.Left;
		o.width = i > 0 ? i + "px" : "0px";
		i = rc.Bottom - rc.Top;
		o.height = i > 0 ? i + "px" : "0px";
	}
	RunEvent1("Arrange", Ctrl, rc);
}

te.OnVisibleChanged = function (Ctrl)
{
	if (Ctrl.Type == CTRL_TC) {
		var o = g_Panels[Ctrl.Id];
		if (o) {
			if (Ctrl.Visible) {
				o.style.display = !document.documentMode || api.strcmpi(o.tagName, "td") ? "block" : "table-cell";
			}
			else {
				o.style.display = "none";
			}
		}
		if (Ctrl.Visible && Ctrl.SelectedIndex >= 0) {
			ChangeView(Ctrl.Selected);
			for (var i = Ctrl.Count; i--;) {
				ChangeTabName(Ctrl[i])
			}
		}
	}
	RunEvent1("VisibleChanged", Ctrl);
}

te.OnWindowRegistered = function (Ctrl)
{
	RunEvent1("WindowRegistered", Ctrl);
}

te.OnToolTip = function (Ctrl, Index)
{
	return RunEvent4("ToolTip", Ctrl, Index);
}

te.OnHitTest = function (Ctrl, pt, flags)
{
	var hr = RunEvent3("HitTest", Ctrl, pt, flags);
	return isFinite(hr) ? hr : -1;
}

te.OnGetPaneState = function (Ctrl, ep, peps)
{
	var hr = RunEvent3("GetPaneState", Ctrl, ep, peps);
	return isFinite(hr) ? hr : -1;
}

te.OnTranslatePath = function (Ctrl, Path)
{
	return RunEvent4("TranslatePath", Ctrl, Path);
}

// Browser Events

AddEventEx(window, "load", function ()
{
	ApplyLang(document);

	setTimeout(function ()
	{
		te.LockUpdate();
		if (api.strcmpi(typeof(xmlWindow), "string") == 0) {
			var TC = te.CreateCtrl(CTRL_TC, 0, 0, "100%", "100%", te.Data.Tab_Style, te.Data.Tab_Align, te.Data.Tab_TabWidth, te.Data.Tab_TabHeight);
			TC.Selected.Navigate2(HOME_PATH, SBSP_NEWBROWSER, te.Data.View_Type, te.Data.View_ViewMode, te.Data.View_fFlags, te.Data.View_Options, te.Data.View_ViewFlags, te.Data.View_IconSize, te.Data.Tree_Align, te.Data.Tree_Width, te.Data.Tree_Style, te.Data.Tree_EnumFlags, te.Data.Tree_RootStyle, te.Data.Tree_Root);
		}
		else if (xmlWindow) {
			LoadXml(xmlWindow);
			xmlWindow = null;
		}
		setTimeout(function ()
		{
			var a, i, j, root, menus, items;
			root = te.Data.xmlMenus.documentElement;
			if (root) {
				menus = root.childNodes;
				for (i = menus.length; i--;) {
					items = menus[i].getElementsByTagName("Item");
					for (j = items.length; j--;) {
						a = items[j].getAttribute("Name").split(/\\t/);
						if (a.length > 1) {
							SetKeyExec("List", a[1], items[j].text, items[j].getAttribute("Type"), true);
						}
					}
				}
			}
			DeviceChanged();
			Resize();
			var cTC = te.Ctrls(CTRL_TC);
			for (var i in cTC) {
				if (cTC[i].SelectedIndex >= 0) {
					ChangeView(cTC[i].Selected);
				}
			}
			te.UnlockUpdate();
		}, 100);
	}, 1);
	if (api.GetKeyState(VK_SHIFT) < 0 && api.GetKeyState(VK_CONTROL) < 0) {
		ShowOptions("Tab=Add-ons");
	}
});

AddEventEx(window, "resize", Resize);

AddEventEx(window, "beforeunload", Finalize);

document.body.onselectstart = function (e)
{
	var s = (e || event).srcElement.tagName;
	return api.PathMatchSpec(s, "input;textarea");
};

//

function InitMenus()
{
	te.Data.xmlMenus = OpenXml("menus.xml", false, true);
}

function ArrangeAddons()
{
	te.Data.Locations = te.Object();
	window.IconSize = te.Data.Conf_IconSize;
	var xml = OpenXml("addons.xml", false, true);
	te.Data.Addons = xml;
	if (api.GetKeyState(VK_SHIFT) < 0 && api.GetKeyState(VK_CONTROL) < 0) {
		IsSavePath = function (path)
		{
			return false;
		}
		return;
	}
	var AddonId = [];
	var root = xml.documentElement;
	if (root) {
		var items = root.childNodes;
		if (items) {
			var arError = [];
			for (var i = 0; i < items.length; i++) {
				var item = items[i];
				var Id = item.nodeName;
				window.Error_source = Id;
				if (!AddonId[Id]) {
					var Enabled = api.QuadPart(item.getAttribute("Enabled"));
					if (Enabled & 6) {
						LoadLang2(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "addons\\" + Id + "\\lang\\" + GetLangId() + ".xml"));
					}
					if (Enabled & 8) {
						LoadAddon("vbs", Id, arError);
					}
					if (Enabled & 1) {
						LoadAddon("js", Id, arError);
					}
					AddonId[Id] = true;
				}
				window.Error_source = "";
			}
			if (arError.length) {
				setTimeout(function () {
					wsh.Popup(arError.join("\n\n"), 9, TITLE, MB_ICONSTOP);
				}, 500);
			}
		}
	}
}

LoadAddon = function(ext, Id, arError)
{
	try {
		var ado = te.CreateObject("Adodb.Stream");
		ado.CharSet = "utf-8";
		ado.Open();
		var fname = fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "addons") + "\\" + Id + "\\script." + ext;
		ado.LoadFromFile(fname);
		var s = ado.ReadText();
		ado.Close();
		if (api.strcmpi(ext, "js") == 0) {
			(new Function(s))(Id);
		}
		else if (api.strcmpi(ext, "vbs") == 0) {
			var fn = api.GetScriptDispatch(s, "VBScript", {"_Addon_Id": {"Addon_Id": Id}, window: window},
				function (ei, SourceLineText, dwSourceContext, lLineNumber, CharacterPosition)
				{
					arError.push(api.SysAllocString(ei.bstrDescription) + "\n" + fname);
				}
			);
			if (fn) {
				Addons["_stack"].push(fn);
			}
		}
	}
	catch (e) {
		arError.push((e.description || e.toString()) + "\n" + fname);
	}
}

function GetAddonLocation(strName)
{
	var items = te.Data.Addons.getElementsByTagName(strName);
	return (items.length ? items[0].getAttribute("Location") : null);
}

function SetAddon(strName, Location, Tag)
{
	if (strName) {
		var s = GetAddonLocation(strName);
		if (s) {
			Location = s;
		}
	}
	if (Tag) {
		if (strName) {
			if (!te.Data.Locations[Location]) {
				te.Data.Locations[Location] = te.Array();
			}
			te.Data.Locations[Location].push(strName);
		}
		var o = document.getElementById(Location);
		if (api.strcmpi(typeof(Tag), "string") == 0) {
			o.insertAdjacentHTML("BeforeEnd", Tag);
		}
		else if (Tag.join) {
			o.insertAdjacentHTML("BeforeEnd", Tag.join(""));
		}
		else {
			o.appendChild(Tag);
		}
		o.style.display = !document.documentMode || api.strcmpi(o.tagName, "td") ? "block" : "table-cell";
	}
	return Location;
}

function InitCode()
{
	var types = 
	{
		Key:   ["All", "List", "Tree", "Browser"],
		Mouse: ["All", "List", "Tree", "Tabs", "Browser"]
	};
	var i;
	for (i = 0; i < 3; i++) {
		g_KeyState[i][0] = api.GetKeyNameText(g_KeyState[i][0]);
	}
	i = g_KeyState.length;
	while (i-- > 4 && g_KeyState[i][0] == g_KeyState[i - 4][0]) {
		g_KeyState.pop();
	}
	for (var j = 256; j >= 0; j -= 256) {
		for (var i = 128; i > 0; i--) {
			var v = api.GetKeyNameText((i + j) * 0x10000);
			if (v && v.charCodeAt(0) > 32) {
				g_KeyCode[v.toUpperCase()] = i + j;
			}
		}
	}
	for (var i in types) {
		eventTE[i] = {};
		for (var j in types[i]) {
			eventTE[i][types[i][j]] = {};
		}
	}
}

SetKeyExec = function (mode, strKey, path, type, bLast)
{
	if (strKey) {
		strKey = GetKeyKey(strKey);
		var KeyMode = eventTE.Key[mode];
		if (KeyMode) {
			if (!KeyMode[strKey]) {
				KeyMode[strKey] = [];
			}
			if (bLast) {
				KeyMode[strKey].push([path, type]);
			}
			else {
				KeyMode[strKey].unshift([path, type]);
			}
		}
	}
}

SetGestureExec = function (mode, strGesture, path, type, bLast)
{
	if (strGesture) {
		strGesture = strGesture.toUpperCase();
		var MouseMode = eventTE.Mouse[mode];
		if (MouseMode) {
			if (!MouseMode[strGesture]) {
				MouseMode[strGesture] = [];
			}
			if (bLast) {
				MouseMode[strGesture].push([path, type]);
			}
			else {
				MouseMode[strGesture].unshift([path, type]);
			}
		}
	}
}

ArExec = function (Ctrl, ar, pt, hwnd)
{
	for (var i in ar) {
		var cmd = ar[i];
		if (Exec(Ctrl, cmd[0], cmd[1], hwnd, pt) === S_OK) {
			return S_OK;
		}
	}
	return S_FALSE;
}

GestureExec = function (Ctrl, mode, str, pt, hwnd)
{
	return ArExec(Ctrl, eventTE.Mouse[mode][str], pt, hwnd || Ctrl.hwnd);
}

KeyExec = function (Ctrl, mode, str, hwnd)
{
	return KeyExecEx(Ctrl, mode, GetKeyKey(str), hwnd || Ctrl.hwnd);
}

KeyExecEx = function (Ctrl, mode, nKey, hwnd)
{
	return ArExec(Ctrl, eventTE.Key[mode][nKey], pt, hwnd);
}

function InitMouse()
{
	if (!te.Data.Conf_Gestures) {
		te.Data.Conf_Gestures = 2;
	}
	if (!te.Data.Conf_TrailColor) {
		te.Data.Conf_TrailColor = 0xff00;
	}
	if (!te.Data.Conf_TrailSize) {
		te.Data.Conf_TrailSize = 2;
	}
	if (!te.Data.Conf_GestureTimeout) {
		te.Data.Conf_GestureTimeout = 3000;
	}
}

g_mouse = 
{
	str: "",
	CancelButton: false,
	ptGesture: api.Memory("POINT"),
	hwndGesture: null,
	tidGesture: null,
	bCapture: false,
	RButton: -1,
	bTrail: false,
	bDblClk: false,

	StartGestureTimer: function ()
	{
		var i = te.Data.Conf_GestureTimeout;
		if (i) {
			clearTimeout(this.tidGesture);
			this.tidGesture = setTimeout("g_mouse.EndGesture(true)", i);
		}
	},

	EndGesture: function (button)
	{
		clearTimeout(this.tidGesture);
		if (this.bCapture) {
			api.ReleaseCapture();
			this.bCapture = false;
		}
		if (this.RButton >= 0) {
			this.RButtonDown(false)
		}
		this.str = "";
		g_bRButton = false;
		SetGestureText(Ctrl, "");
		if (this.bTrail) {
			api.RedrawWindow(te.hwnd, null, 0, RDW_INVALIDATE | RDW_ERASE | RDW_FRAME | RDW_ALLCHILDREN);
			this.bTrail = false;
		}
	},

	RButtonDown: function (mode)
	{
		if (api.strcmpi(this.str, "2") == 0) {
			var item = api.Memory("LVITEM");
			item.iItem = this.RButton;
			item.mask = LVIF_STATE;
			item.stateMask = LVIS_SELECTED;
			api.SendMessage(this.hwndGesture, LVM_GETITEM, 0, item);
			if (!(item.state & LVIS_SELECTED)) {
				if (mode) {
					var Ctrl = te.CtrlFromWindow(this.hwndGesture);
					Ctrl.SelectItem(Ctrl.Items.Item(this.RButton), SVSI_SELECT | SVSI_FOCUSED | SVSI_DESELECTOTHERS);
				}
				else {
					var ptc = api.Memory("POINT");
					ptc = te.Data.pt.clone();
					api.ScreenToClient(this.hwndGesture, ptc);
					api.SendMessage(this.hwndGesture, WM_RBUTTONDOWN, 0, ptc.x + (ptc.y << 16));
				}
			}
		}
		this.RButton = -1;
	},

	GetButton: function (msg, wParam)
	{
		if (msg >= WM_LBUTTONDOWN && msg <= WM_LBUTTONDBLCLK) {
			return "1";
		}
		if (msg >= WM_RBUTTONDOWN && msg <= WM_RBUTTONDBLCLK) {
			return "2";
		}
		if (msg >= WM_MBUTTONDOWN && msg <= WM_MBUTTONDBLCLK) {
			return "3";
		}
		if (msg >= WM_XBUTTONDOWN && msg <= WM_XBUTTONDBLCLK) {
			switch (wParam >> 16) {
				case XBUTTON1:
					return "4";
				case XBUTTON2:
					return "5";
			}
		}
		return "";
	},

	Exec: function (Ctrl, hwnd, pt)
	{
		var hr;
		this.str = GetGestureKey() + this.str;
		te.Data.cmdMouse = this.str;
		if (!Ctrl) {
			return S_FALSE;
		}
		var s = null;
		switch (Ctrl.Type) {
			case CTRL_SB:
			case CTRL_EB:
				s = "List";
				break;
			case CTRL_TV:
				s = "Tree";
				break;
			case CTRL_TC:
				s = "Tabs";
				break;
			case CTRL_WB:
				s = "Browser";
				break;
			default:
				if (this.str.length) {
					if (window.g_menu_click != 2) {
						window.g_menu_button = this.str;
					}
					if (window.g_menu_click) {
						var hSubMenu = api.GetSubMenu(window.g_menu_handle, window.g_menu_pos);
						if (hSubMenu) {
							var mii = api.Memory("MENUITEMINFO");
							mii.cbSize = mii.Size;
							mii.fMask = MIIM_SUBMENU;
							if (api.SetMenuItemInfo(window.g_menu_handle, window.g_menu_pos, true, mii)) {
								api.DestroyMenu(hSubMenu);
							}
						}
						if (this.str > 2) {
							window.g_menu_click = 2;
							var lParam = pt.x + (pt.y << 16);
							api.PostMessage(hwnd, WM_LBUTTONDOWN, 0, lParam);
							api.PostMessage(hwnd, WM_LBUTTONUP, 0, lParam);
						}
					}
				}
				break;
		}
		if (s) {
			hr = GestureExec(Ctrl, s, this.str, pt, hwnd);
			if (hr === S_OK) {
				return hr;
			}
		}
		if (Ctrl.Type != CTRL_TE) {
			hr = GestureExec(Ctrl, "All", this.str, pt, hwnd);
			if (hr === S_OK) {
				return hr;
			}
		}
		return S_FALSE;
	}
};

g_basic =
{
	Func:
	{
		"":
		{
			Exec: function (Ctrl, s, type, hwnd, pt)
			{
				var lines = s.split(/\r?\n/);
				for (var i in lines) {
					var cmd = lines[i].split(",");
					var Id = cmd.shift();
					var hr = Exec(Ctrl, cmd.join(","), Id, hwnd, pt);
					if (hr != S_OK) {
						break;
					}
				}
				return S_OK;
			},

			Ref: function (s, pt)
			{
				var lines = s.split(/\r?\n/);
				var last = lines.length ? lines[lines.length - 1] : "";
				if (last.match(/^([^,]+),$/)) {
					var Id = GetSourceText(RegExp.$1);
					var r = OptionRef(Id, "", pt);
					if (typeof r == "string") {
						return s + r + "\n";
					}
					return r;
				}
				else {
					var arFunc = [];
					RunEvent1("AddType", arFunc);
					var r = g_basic.Popup(arFunc, s, pt);
					return r == 1 ? 1 : s + (s.length && !s.match(/\n$/) ? "\n" : "") + r + ",";
				}
			}
		},

		Open:
		{
			Exec: function (Ctrl, s, type, hwnd, pt)
			{
				return ExecOpen(Ctrl, s, type, hwnd, pt, OpenMode);
			},

			Drop: DropOpen,
			Ref: BrowseForFolder
		},

		"Open in New Tab":
		{
			Exec: function (Ctrl, s, type, hwnd, pt)
			{
				return ExecOpen(Ctrl, s, type, hwnd, pt, SBSP_NEWBROWSER);
			},

			Drop: DropOpen,
			Ref: BrowseForFolder
		},

		"Open in Background":
		{
			Exec: function (Ctrl, s, type, hwnd, pt)
			{
				return ExecOpen(Ctrl, s, type, hwnd, pt, SBSP_NEWBROWSER | SBSP_ACTIVATE_NOFOCUS);
			},

			Drop: DropOpen,
			Ref: BrowseForFolder
		},

		Exec:
		{
			Exec: function (Ctrl, s, type, hwnd, pt)
			{
				s = ExtractMacro(Ctrl, s);
				try {
					wsh.Run(s);
				}
				catch (e) {
					ShowError(e, s);
				}
				return S_OK;
			},

			Drop: function (Ctrl, s, type, hwnd, pt, dataObj, grfKeyState, pdwEffect, bDrop)
			{
				if (!pdwEffect) {
					pdwEffect = api.Memory("DWORD");
				}
				var re = /%Selected%/i;
				if (s.match(re)) {
					pdwEffect[0] = DROPEFFECT_LINK;
					if (bDrop) {
						var ar = [];
						for (var i = dataObj.Count; i > 0; ar.unshift(api.PathQuoteSpaces(api.GetDisplayNameOf(dataObj.Item(--i), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING)))) {
						}
						s = s.replace(re, ar.join(" "));
					}
					else {
						return S_OK;
					}
				}
				else {
					pdwEffect[0] = DROPEFFECT_NONE;
					return S_OK;
				}
			},

			Ref: OpenDialog
		},

		RunAs:
		{
			Exec: function (Ctrl, s, type, hwnd, pt)
			{
				s = ExtractMacro(Ctrl, s);
				try {
					sha.ShellExecute(s, "", "", "RunAs");
					wsh.Run(s);
				}
				catch (e) {
					ShowError(e, s);
				}
				return S_OK;
			}
		},

		JScript:
		{
			Exec: ExecScriptEx,
			Drop: DropScript,
			Ref: OpenDialog
		},

		VBScript:
		{
			Exec: ExecScriptEx,
			Drop: DropScript,
			Ref: OpenDialog
		},

		"Selected Items": 
		{
			Exec: function (Ctrl, s, type, hwnd, pt)
			{
				var fn = g_basic.Func[type].Cmd[s];
				if (fn) {
					return fn(Ctrl);
				}
				else {
					return Exec(Ctrl, s + " %Selected%", "Exec", hwnd, pt);
				}
			},

			Ref: function (s, pt)
			{
				var r = g_basic.Popup(g_basic.Func["Selected Items"].Cmd, s, pt);
				if (api.strcmpi(r, GetText("Send to...")) == 0) {
					var Folder = sha.NameSpace(ssfSENDTO);
					if (Folder) {
						var Items = Folder.Items();
						var hMenu = api.CreatePopupMenu();
						for (i = 0; i < Items.Count; i++) {
							api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, i + 1, Items.Item(i).Name);
						}
						var nVerb = api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, null);
						api.DestroyMenu(hMenu);
						if (nVerb) {
							return api.PathQuoteSpaces(Items.Item(nVerb - 1).Path);
						}
					}
					return 1;
				}
				if (api.strcmpi(r, GetText("Open with...")) == 0) {
					r = OpenDialog(s);
					if (!r) {
						r = 1;
					}
				}
				return r;
			},

			Cmd:
			{
				Open: function (Ctrl)
				{
					return OpenSelected(Ctrl, OpenMode);
				},
				"Open in New Tab": function (Ctrl)
				{
					return OpenSelected(Ctrl, SBSP_NEWBROWSER);
				},
				"Open in Background": function (Ctrl)
				{
					return OpenSelected(Ctrl, SBSP_NEWBROWSER | SBSP_ACTIVATE_NOFOCUS);
				},
				Exec: function (Ctrl)
				{
					if (Ctrl.Type <= CTRL_EB) {
						InvokeCommand(Ctrl.SelectedItems(), 0, te.hwnd, null, null, null, SW_SHOWNORMAL, 0, 0, Ctrl, CMF_DEFAULTONLY);
					}
					return S_OK;
				},
				"Open with...": undefined,
				"Send to...": undefined
			}

		},

		Tabs:
		{
			Exec: function (Ctrl, s, type, hwnd, pt)
			{
				var fn = g_basic.Func[type].Cmd[s];
				if (fn) {
					return fn(Ctrl, pt);
				}
				else {
					var FV = GetFolderView(Ctrl, pt, true);
					if (FV) {
						var TC = FV.Parent;
						if (s.match(/^\d/)) {
							TC.SelectedIndex = api.QuadPart(s);
						}
						else if (s.match(/^\-/)) {
							TC.SelectedIndex = TC.Count + api.QuadPart(s);
						}
					}
				}
				return S_OK;
			},

			Cmd:
			{
				"Close Tab": function (Ctrl, pt)
				{
					var FV = GetFolderView(Ctrl, pt, true);
					FV && FV.Close();
				},
				"Close Other Tabs": function (Ctrl, pt)
				{
					var FV = GetFolderView(Ctrl, pt);
					if (FV) {
						var TC = FV.Parent;
						var nIndex = GetFolderView(Ctrl, pt, true) ? FV.Index : -1;
						for (var i = TC.Count; i--;) {
							if (i != nIndex) {
								TC[i].Close();
							}
						}
					}
				},
				"Close Tabs on Left": function (Ctrl, pt)
				{
					var FV = GetFolderView(Ctrl, pt, true);
					if (FV) {
						var TC = FV.Parent;
						for (var i = FV.Index; i--;) {
							TC[i].Close();
						}
					}
				},
				"Close Tabs on Right": function (Ctrl, pt)
				{
					var FV = GetFolderView(Ctrl, pt, true);
					if (FV) {
						var TC = FV.Parent;
						var nIndex = FV.Index;
						for (var i = TC.Count; --i > nIndex;) {
							TC[i].Close();
						}
					}
				},
				"New Tab": function (Ctrl, pt)
				{
					var FV = GetFolderView(Ctrl, pt);
					if (HOME_PATH) {
						NavigateFV(FV, HOME_PATH, SBSP_NEWBROWSER);
					}
					else {
						NavigateFV(FV, null, SBSP_RELATIVE | SBSP_NEWBROWSER);
					}
				},
				Lock: function (Ctrl, pt)
				{
					var FV = GetFolderView(Ctrl, pt);
					FV && Lock(FV.Parent, FV.Index, true);
				},
				"Previous Tab": function (Ctrl, pt)
				{
					var FV = GetFolderView(Ctrl, pt);
					FV && ChangeTab(FV.Parent, -1);
				},
				"Next Tab": function (Ctrl, pt)
				{
					var FV = GetFolderView(Ctrl, pt);
					FV && ChangeTab(FV.Parent, 1);
				},
				"Up": function (Ctrl, pt)
				{
					var FV = GetFolderView(Ctrl, pt);
					FV && FV.Navigate(null, SBSP_PARENT | OpenMode);
				},
				"Back": function (Ctrl, pt)
				{
					var FV = GetFolderView(Ctrl, pt);
					FV && FV.Navigate(null, SBSP_NAVIGATEBACK);
				},
				"Forward": function (Ctrl, pt)
				{
					var FV = GetFolderView(Ctrl, pt);
					FV && FV.Navigate(null, SBSP_NAVIGATEFORWARD);
				},
				"Refresh": function (Ctrl, pt)
				{
					var FV = GetFolderView(Ctrl, pt);
					FV && FV.Refresh();
				},
				"Switch Explorer Engine": function (Ctrl, pt)
				{
					var FV = GetFolderView(Ctrl, pt);
					if (FV) {
						FV.Type = (FV.Type == CTRL_SB) ? CTRL_EB : CTRL_SB;
					}
				},
				"Open in Explorer": function (Ctrl, pt)
				{
					var FV = GetFolderView(Ctrl, pt);
					FV && OpenInExplorer(FV);
				}
			}
		},

		Edit: 
		{
			Exec: function (Ctrl, s, type, hwnd, pt)
			{
				var hMenu = te.MainMenu(FCIDM_MENU_EDIT);
				var nVerb = GetCommandId(hMenu, s);
				SendCommand(Ctrl, nVerb);
				api.DestroyMenu(hMenu);
				return S_OK;
			},

			Ref: function (s, pt)
			{
				return g_basic.PopupMenu(te.MainMenu(FCIDM_MENU_EDIT), null, pt);
			}
		},

		View: 
		{
			Exec: function (Ctrl, s, type, hwnd, pt)
			{
				var hMenu = te.MainMenu(FCIDM_MENU_VIEW);
				var nVerb = GetCommandId(hMenu, s);
				SendCommand(Ctrl, nVerb);
				api.DestroyMenu(hMenu);
				return S_OK;
			},

			Ref: function (s, pt)
			{
				return g_basic.PopupMenu(te.MainMenu(FCIDM_MENU_VIEW), null, pt);
			}
		},

		Context: 
		{
			Exec: function (Ctrl, s, type, hwnd, pt)
			{
				var Selected;
				if (Ctrl.Type <= CTRL_EB) {
					Selected = Ctrl.SelectedItems();
				}
				else if (Ctrl.Type == CTRL_TV ) {
					Selected = Ctrl.SelectedItem;
				}
				else {
					var FV = te.Ctrl(CTRL_FV);
					Selected = FV.SelectedItems();
				}
				if (Selected && Selected.Count) {
					var ContextMenu = api.ContextMenu(Selected, FV);
					if (ContextMenu) {
						var hMenu = api.CreatePopupMenu();
						ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_EXTENDEDVERBS);
						var nVerb = GetCommandId(hMenu, s, ContextMenu);
						ContextMenu.InvokeCommand(0, te.hwnd, nVerb ? nVerb - 1 : s, null, null, SW_SHOWNORMAL, 0, 0);
						api.DestroyMenu(hMenu);
					}
				}
				return S_OK;
			},

			Ref: function (s, pt)
			{
				var FV = te.Ctrl(CTRL_FV);
				if (FV) {
					var Selected = FV.SelectedItems();
					if (!Selected.Count) {
						Selected = api.GetModuleFileName(null);
					}
					var ContextMenu = api.ContextMenu(Selected, FV);
					if (ContextMenu) {
						var hMenu = api.CreatePopupMenu();
						ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_EXTENDEDVERBS);
						return g_basic.PopupMenu(hMenu, ContextMenu, pt);
					}
				}
			}
		},

		ViewContext: 
		{
			Exec: function (Ctrl, s, type, hwnd, pt)
			{
				var FV = te.Ctrl(CTRL_FV);
				if (FV) {
					var ContextMenu = FV.ViewMenu();
					if (ContextMenu) {
						var hMenu = api.CreatePopupMenu();
						ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_EXTENDEDVERBS);
						var nVerb = GetCommandId(hMenu, s, ContextMenu);
						ContextMenu.InvokeCommand(0, te.hwnd, nVerb ? nVerb - 1 : s, null, null, SW_SHOWNORMAL, 0, 0);
						api.DestroyMenu(hMenu);
					}
				}
				return S_OK;
			},

			Ref: function (s, pt)
			{
				var FV = te.Ctrl(CTRL_FV);
				if (FV) {
					var ContextMenu = FV.ViewMenu();
					if (ContextMenu) {
						var hMenu = api.CreatePopupMenu();
						ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_EXTENDEDVERBS);
						return g_basic.PopupMenu(hMenu, ContextMenu, pt);
					}
				}
			}
		},

		Tools:
		{
			Cmd:
			{
				"New Folder": CreateNewFolder,
				"New File": CreateNewFile,
				"Copy Full Path": function (Ctrl, pt)
				{
					var FV = GetFolderView(Ctrl, pt);
					var Selected = FV.SelectedItems();
					var s = [];
					var nCount = Selected.Count;
					if (nCount) {
						while (--nCount >= 0) {
							s.unshift(api.PathQuoteSpaces(api.GetDisplayNameOf(Selected.Item(nCount), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING)));
						}
					}
					else {
						s.push(api.PathQuoteSpaces(api.GetDisplayNameOf(FV, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING)));
					}
					clipboardData.setData("text", s.join(" "));
				},
				"Run Dialog": function (Ctrl, pt)
				{
					var FV = GetFolderView(Ctrl, pt);
					api.ShRunDialog(te.hwnd, 0, FV ? FV.FolderItem.Path : null, null, null, 0);
				},
				Search: function (Ctrl, pt)
				{
					var FV = GetFolderView(Ctrl, pt);
					if (FV) {
						var s = InputDialog(GetText("Search"), IsSearchPath(FV) ? api.GetDisplayNameOf(FV, SHGDN_INFOLDER) : "");
						if (s) {
							FV.FilterView(s);
						}
						else if (s === "") {
							CancelFilterView(FV);
						}
					}
				},
				"Add to Favorites": AddFavorite,
				"Reload Customize": function ()
				{
					te.reload();
				},
				"Load Layout": LoadLayout,
				"Save Layout": SaveLayout,
				"Close Application": function ()
				{
					api.PostMessage(te.hwnd, WM_CLOSE, 0, 0);
				}
			}
		},

		Options:
		{
			Exec: function (Ctrl, s, type, hwnd, pt)
			{
				ShowOptions("Tab=" + s);
				return S_OK;
			},

			Ref: function (s, pt)
			{
				return g_basic.Popup(g_basic.Func.Options.List, s, pt);
			},

			List: ["General", "Add-ons", "Menus", "Tabs", "Tree", "List"]
		},

		Key:
		{
			Exec: function (Ctrl, s, type, hwnd, pt)
			{
				wsh.SendKeys(s);
				return S_OK;
			}
		},

		"Add-ons":
		{
			Cmd:{}
		},

		Menus:
		{
			Ref: function (s, pt)
			{
				return g_basic.Popup(g_basic.Func.Menus.List, s, pt);
			},

			List: ["Open", "Close", "Separator", "Break", "BarBreak"]
		}
	},

	Exec: function (Ctrl, s, type, hwnd, pt)
	{
		var fn = g_basic.Func[type].Cmd[s];
		if (!pt) {
			pt = api.Memory("POINT");
			api.GetCursorPos(pt);
		}
		fn && fn(Ctrl, pt);
		return S_OK;
	},

	Popup: function (Cmd, strDefault, pt)
	{
		var i, j, s;
		var ar = [];
		if (Cmd.length) {
			ar = Cmd;
		}
		else {
			for (i in Cmd) {
				ar.push(i);
			}
		}
		var hMenu = api.CreatePopupMenu();
		for (i = 0; i < ar.length; i++) {
			if (ar[i]) {
				api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, i + 1, GetText(ar[i]));
			}
		}
		var nVerb = api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, null);
		s = api.GetMenuString(hMenu, nVerb, MF_BYCOMMAND);
		api.DestroyMenu(hMenu);
		if (nVerb == 0) {
			return 1;
		}
		return s;
	},

	PopupMenu: function (hMenu, ContextMenu, pt)
	{
		var Verb;
		for (var i = api.GetMenuItemCount(hMenu); i--;) {
			if (api.GetMenuString(hMenu, i, MF_BYPOSITION)) {
				api.EnableMenuItem(hMenu, i, MF_ENABLED | MF_BYPOSITION);
			}
			else {
				api.DeleteMenu(hMenu, i, MF_BYPOSITION);
			}
		}
		window.g_menu_click = true;
		var nVerb = api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, ContextMenu);
		if (nVerb == 0) {
			api.DestroyMenu(hMenu);
			return 1;
		}
		if (ContextMenu) {
			Verb = ContextMenu.GetCommandString(nVerb - 1, GCS_VERB);
		}
		if (!Verb) {
			Verb = window.g_menu_string;
			if ((Verb + "").match(/\t(.*)$/)) {
				Verb = RegExp.$1;
			}
		}
		api.DestroyMenu(hMenu);
		return Verb;
	}
};

AddEvent("Exec", function (Ctrl, s, type, hwnd, pt, dataObj, grfKeyState, pdwEffect, bDrop)
{
	var fn = g_basic.Func[type];
	if (fn) {
		if (dataObj) {
			if (fn.Drop) {
				return fn.Drop(Ctrl, s, type, hwnd, pt, dataObj, grfKeyState, pdwEffect, bDrop);
			}
			pdwEffect[0] = DROPEFFECT_NONE;
			return E_NOTIMPL;
		}
		if (fn.Exec) {
			return fn.Exec(Ctrl, s, type, hwnd, pt);
		}
		return g_basic.Exec(Ctrl, s, type, hwnd, pt);
	}
});

AddEvent("AddType", function (arFunc)
{
	for (var i in g_basic.Func) {
		arFunc.push(i);
	}
});

AddType = function (strType, o)
{
	g_basic.Func[strType] = o;
};

AddTypeEx = function (strType, strTitle, fn)
{
	var type = g_basic.Func[strType];
	if (type && type.Cmd) {
		type.Cmd[strTitle] = fn;
	}
};

AddEvent("OptionRef", function (Id, s, pt)
{
	var fn = g_basic.Func[Id];
	if (fn) {
		var r;
		if (fn.Ref) {
			return fn.Ref(s, pt);
		}
		if (fn.Cmd) {
			return g_basic.Popup(fn.Cmd, s, pt);
		}
	}
});

AddEvent("OptionEncode", function (Id, p)
{
	if (Id === "") {
		var lines = p.s.split(/\r?\n/);
		for (var i in lines) {
			if (lines[i].match(/^([^,]+),(.*)$/)) {
				var p2 = { s: RegExp.$2 };
				Id = GetSourceText(RegExp.$1);
				OptionEncode(Id, p2);
				lines[i] = [Id, p2.s].join(",");
			}
		}
		p.s = lines.join("\n");
		return S_OK;
	}
	if (g_basic.Func[Id]) {
		p.s = GetSourceText(p.s);
		return S_OK;
	}


});

AddEvent("OptionDecode", function (Id, p)
{
	if (Id === "") {
		var lines = p.s.split(/\r?\n/);
		for (var i in lines) {
			if (lines[i].match(/^([^,]+),(.*)$/)) {
				var p2 = { s: RegExp.$2 };
				Id = RegExp.$1;
				OptionDecode(Id, p2);
				lines[i] = [GetText(Id), p2.s].join(",");
			}
		}
		p.s = lines.join("\n");
		return S_OK;
	}
	if (g_basic.Func[Id]) {
		var s = GetText(p.s);
		if (GetSourceText(s) == p.s) {
			p.s = GetText(p.s);
			return S_OK;
		}
		return S_OK;
	}
});

//Init

if (!te.Data) {
	te.Data = te.Object();
	te.Data.CustColors = api.Memory("int", 16);
	//Default Value
	te.Data.Tab_Style = TCS_HOTTRACK | TCS_MULTILINE | TCS_RAGGEDRIGHT | TCS_SCROLLOPPOSITE | TCS_HOTTRACK | TCS_TOOLTIPS;
	te.Data.Tab_Align = TCA_TOP;
	te.Data.Tab_TabWidth = 96;
	te.Data.Tab_TabHeight = 0;

	te.Data.View_Type = CTRL_SB;
	te.Data.View_ViewMode = FVM_DETAILS;
	te.Data.View_fFlags = FWF_SHOWSELALWAYS | FWF_NOWEBVIEW;
	te.Data.View_Options = EBO_SHOWFRAMES | EBO_ALWAYSNAVIGATE;
	te.Data.View_ViewFlags = CDB2GVF_SHOWALLFILES;
	te.Data.View_IconSize = 0;

	te.Data.Tree_Align = 0;
	te.Data.Tree_Width = 200;
	te.Data.Tree_Style = NSTCS_HASEXPANDOS | NSTCS_SHOWSELECTIONALWAYS | NSTCS_HASLINES | NSTCS_BORDER;
	te.Data.Tree_EnumFlags = SHCONTF_FOLDERS;
	te.Data.Tree_RootStyle = NSTCRS_VISIBLE | NSTCRS_EXPANDED;
	te.Data.Tree_Root = 0;

	te.Data.Installed = fso.GetParentFolderName(api.GetModuleFileName(null));
	var DataFolder = te.Data.Installed;

	var pf = [ssfPROGRAMFILES, ssfPROGRAMFILESx86];
	var x = api.sizeof("HANDLE") / 4;
	for (var i = 0; i < x; i++) {
		var s = api.GetDisplayNameOf(pf[i], SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
		var l = s.replace(/\s*\(x86\)$/i, "").length;
		if (api.StrCmpNI(s, DataFolder, l) == 0) {
			DataFolder = fso.BuildPath(api.GetDisplayNameOf(ssfAPPDATA, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING), "Tablacus\\Explorer");
			var ParentFolder = fso.GetParentFolderName(DataFolder);
			if (!fso.FolderExists(ParentFolder)) {
				if (fso.CreateFolder(ParentFolder)) {
					if (!fso.FolderExists(DataFolder)) {
						fso.CreateFolder(DataFolder);
					}
				}
			}
			break;
		}
	}
	CreateFolder2(fso.BuildPath(DataFolder, "config"));
	if (!document.documentMode) {
		var s = fso.BuildPath(DataFolder, "cache");
		CreateFolder2(s);
		CreateFolder2(fso.BuildPath(s, "bitmap"));
		CreateFolder2(fso.BuildPath(s, "icon"));
		CreateFolder2(fso.BuildPath(s, "file"));
	}

	te.Data.DataFolder = DataFolder;
	te.Data.Conf_Lang = GetLangId();

	if (api.GetKeyState(VK_SHIFT) < 0 && api.GetKeyState(VK_CONTROL) < 0) {
		xmlWindow = "Init";
	}
	else {
		LoadConfig();
	}
	te.Data.uRegisterId = api.SHChangeNotifyRegister(te.hwnd, SHCNRF_InterruptLevel | SHCNRF_ShellLevel | SHCNRF_NewDelivery, SHCNE_DRIVEREMOVED | SHCNE_MEDIAREMOVED | SHCNE_NETUNSHARE | SHCNE_RENAMEFOLDER | SHCNE_RMDIR | SHCNE_SERVERDISCONNECT | SHCNE_DRIVEADD | SHCNE_DRIVEADDGUI | SHCNE_MEDIAINSERTED | SHCNE_NETSHARE, TWM_CHANGENOTIFY, ssfDESKTOP, true);
}

InitCode();
InitMouse();
InitMenus();
LoadLang();
ArrangeAddons();
