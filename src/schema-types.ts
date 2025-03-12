export class SourceGroup {
  isMultiple: boolean
  sids: number[]
  name?: string
  expanded?: boolean
  index?: number // available only from menu or groups tab container

  constructor(sids: number[], name: string = null) {
    name = (name && name.trim()) || "Source group"
    if (sids.length == 1) {
      this.isMultiple = false
    } else {
      this.isMultiple = true
      this.name = name
      this.expanded = true
    }
    this.sids = sids
  }
}

export const enum ViewType {
  Cards,
  List,
  Magazine,
  Compact,
  Customized,
}

export const enum ViewConfigs {
  ShowCover = 1 << 0,
  ShowSnippet = 1 << 1,
  FadeRead = 1 << 2,
}

export const enum ThemeSettings {
  Default = "system",
  Light = "light",
  Dark = "dark",
}

export const enum SearchEngines {
  Google,
  Bing,
  Baidu,
  DuckDuckGo,
}

export const enum ImageCallbackTypes {
  OpenExternal,
  OpenExternalBg,
  SaveAs,
  Copy,
  CopyLink,
}

export const enum SyncService {
  None,
  Fever,
  Feedbin,
  GReader,
  Inoreader,
  Miniflux,
  Nextcloud,
}
export interface ServiceConfigs {
  importGroups?: boolean
  type: SyncService
}

export const enum WindowStateListenerType {
  Maximized,
  Focused,
  Fullscreen,
}

export interface TouchBarTexts {
  markAll: string
  menu: string
  notifications: string
  refresh: string
  search: string
}

export type SchemaTypes = {
  fetchInterval: number
  filterType: number
  fontFamily: string
  fontSize: number
  listViewConfigs: ViewConfigs
  locale: string
  menuOn: boolean
  pac: string
  pacOn: boolean
  searchEngine: SearchEngines
  serviceConfigs: ServiceConfigs
  sourceGroups: SourceGroup[]
  theme: ThemeSettings
  useNeDB: boolean
  version: string
  view: ViewType
}
