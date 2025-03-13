import intl from "react-intl-universal"
import {
  SourceActionTypes,
  ADD_SOURCE,
  DELETE_SOURCE,
  addSource,
  RssSource,
  SourceState,
} from "./source"
import { SourceGroup } from "../../schema-types"
import { ActionStatus, AppThunk, domParser } from "../utils"
import { saveSettings } from "./app"
import {
  fetchItemsIntermediate,
  fetchItemsRequest,
  fetchItemsSuccess,
} from "./item"

export const CREATE_SOURCE_GROUP = "CREATE_SOURCE_GROUP"
export const ADD_SOURCE_TO_GROUP = "ADD_SOURCE_TO_GROUP"
export const REMOVE_SOURCE_FROM_GROUP = "REMOVE_SOURCE_FROM_GROUP"
export const UPDATE_SOURCE_GROUP = "UPDATE_SOURCE_GROUP"
export const REORDER_SOURCE_GROUPS = "REORDER_SOURCE_GROUPS"
export const DELETE_SOURCE_GROUP = "DELETE_SOURCE_GROUP"
export const TOGGLE_GROUP_EXPANSION = "TOGGLE_GROUP_EXPANSION"

interface CreateSourceGroupAction {
  type: typeof CREATE_SOURCE_GROUP
  group: SourceGroup
}

interface AddSourceToGroupAction {
  type: typeof ADD_SOURCE_TO_GROUP
  groupIndex: number
  sid: number
}

interface RemoveSourceFromGroupAction {
  type: typeof REMOVE_SOURCE_FROM_GROUP
  groupIndex: number
  sids: number[]
}

interface UpdateSourceGroupAction {
  type: typeof UPDATE_SOURCE_GROUP
  groupIndex: number
  group: SourceGroup
}

interface ReorderSourceGroupsAction {
  type: typeof REORDER_SOURCE_GROUPS
  groups: SourceGroup[]
}

interface DeleteSourceGroupAction {
  type: typeof DELETE_SOURCE_GROUP
  groupIndex: number
}

interface ToggleGroupExpansionAction {
  type: typeof TOGGLE_GROUP_EXPANSION
  groupIndex: number
}

export type SourceGroupActionTypes =
  | CreateSourceGroupAction
  | AddSourceToGroupAction
  | RemoveSourceFromGroupAction
  | UpdateSourceGroupAction
  | ReorderSourceGroupsAction
  | DeleteSourceGroupAction
  | ToggleGroupExpansionAction

export function createSourceGroupDone(
  group: SourceGroup
): SourceGroupActionTypes {
  return {
    type: CREATE_SOURCE_GROUP,
    group: group,
  }
}

export function createSourceGroup(name: string): AppThunk<number> {
  return (dispatch, getState) => {
    let groups = getState().groups
    for (let i = 0; i < groups.length; i += 1) {
      const g = groups[i]
      if (g.isMultiple && g.name === name) {
        return i
      }
    }
    let group = new SourceGroup([], name)
    dispatch(createSourceGroupDone(group))
    groups = getState().groups
    window.settings.saveGroups(groups)
    return groups.length - 1
  }
}

function addSourceToGroupDone(
  groupIndex: number,
  sid: number
): SourceGroupActionTypes {
  return {
    type: ADD_SOURCE_TO_GROUP,
    groupIndex: groupIndex,
    sid: sid,
  }
}

export function addSourceToGroup(groupIndex: number, sid: number): AppThunk {
  return (dispatch, getState) => {
    dispatch(addSourceToGroupDone(groupIndex, sid))
    window.settings.saveGroups(getState().groups)
  }
}

function removeSourceFromGroupDone(
  groupIndex: number,
  sids: number[]
): SourceGroupActionTypes {
  return {
    type: REMOVE_SOURCE_FROM_GROUP,
    groupIndex: groupIndex,
    sids: sids,
  }
}

export function removeSourceFromGroup(
  groupIndex: number,
  sids: number[]
): AppThunk {
  return (dispatch, getState) => {
    dispatch(removeSourceFromGroupDone(groupIndex, sids))
    window.settings.saveGroups(getState().groups)
  }
}

function deleteSourceGroupDone(groupIndex: number): SourceGroupActionTypes {
  return {
    type: DELETE_SOURCE_GROUP,
    groupIndex: groupIndex,
  }
}

export function deleteSourceGroup(groupIndex: number): AppThunk {
  return (dispatch, getState) => {
    dispatch(deleteSourceGroupDone(groupIndex))
    window.settings.saveGroups(getState().groups)
  }
}

function updateSourceGroupDone(group: SourceGroup): SourceGroupActionTypes {
  return {
    type: UPDATE_SOURCE_GROUP,
    groupIndex: group.index,
    group: group,
  }
}

export function updateSourceGroup(group: SourceGroup): AppThunk {
  return (dispatch, getState) => {
    dispatch(updateSourceGroupDone(group))
    window.settings.saveGroups(getState().groups)
  }
}

function reorderSourceGroupsDone(
  groups: SourceGroup[]
): SourceGroupActionTypes {
  return {
    type: REORDER_SOURCE_GROUPS,
    groups: groups,
  }
}

export function reorderSourceGroups(groups: SourceGroup[]): AppThunk {
  return (dispatch, getState) => {
    dispatch(reorderSourceGroupsDone(groups))
    window.settings.saveGroups(getState().groups)
  }
}

export function toggleGroupExpansion(groupIndex: number): AppThunk {
  return (dispatch, getState) => {
    dispatch({
      type: TOGGLE_GROUP_EXPANSION,
      groupIndex: groupIndex,
    })
    window.settings.saveGroups(getState().groups)
  }
}

export function fixBrokenGroups(sources: SourceState): AppThunk {
  return (dispatch, getState) => {
    const { groups } = getState()
    const sids = new Set(Object.values(sources).map(s => s.sid))
    let isBroken = false
    const newGroups: SourceGroup[] = groups
      .map(group => {
        const newGroup: SourceGroup = {
          ...group,
          sids: group.sids.filter(sid => sids.delete(sid)),
        }
        if (newGroup.sids.length !== group.sids.length) {
          isBroken = true
        }
        return newGroup
      })
      .filter(group => group.isMultiple || group.sids.length > 0)
    if (isBroken || sids.size > 0) {
      for (let sid of sids) {
        newGroups.push(new SourceGroup([sid]))
      }
      dispatch(reorderSourceGroups(newGroups))
    }
  }
}

function outlineToSource(
  outline: Element
): [ReturnType<typeof addSource>, string] | null {
  const url = outline.getAttribute("xmlUrl")
  const name = outline.getAttribute("title") || outline.getAttribute("text")
  const iconurl = outline.getAttribute("tncr:iconurl")

  return url ? [addSource({ url: url.trim(), name, batch: true, iconurl }), url] : null
}

export function importOPML(): AppThunk {
  return async dispatch => {
    const filters = [
      { name: intl.get("sources.opmlFile"), extensions: ["xml", "opml"] },
    ]
    window.utils.showOpenDialog(filters).then(data => {
      if (!data) return

      dispatch(saveSettings())
      const doc = domParser
        .parseFromString(data, "text/xml")
        .getElementsByTagName("body")
      if (doc.length == 0) {
        dispatch(saveSettings())
        return
      }
      const parseError = doc[0].getElementsByTagName("parsererror")
      if (parseError.length > 0) {
        dispatch(saveSettings())
        window.utils.showErrorBox(
          intl.get("sources.errorParse"),
          intl.get("sources.errorParseHint")
        )
        return
      }
      const sources: [ReturnType<typeof addSource>, number, string][] = []
      const errors: [string, any][] = []
      for (let el of doc[0].children) {
        const type = el.getAttribute("type")

        switch (type) {
          case "rss":
            const source = outlineToSource(el)
            if (source) sources.push([source[0], -1, source[1]])
            break
          default:
            const groupName = el.getAttribute("title") || el.getAttribute("text")
            console.warn("Unknown <outline> type:", type, groupName)
          case "bucket":
            const gid = dispatch(createSourceGroup(groupName))
            for (let child of el.children) {
              const source = outlineToSource(child)
              if (source) sources.push([source[0], gid, source[1]])
            }
            break
        }
      }
      dispatch(fetchItemsRequest(sources.length))
      let promises = sources.map(([s, gid, url]) => {
        return dispatch(s)
          .then(sid => {
            if (sid !== null && gid > -1) dispatch(addSourceToGroup(gid, sid))
          })
          .catch(err => errors.push([url, err]))
          .finally(() => dispatch(fetchItemsIntermediate()))
      })
      Promise.allSettled(promises).then(() => {
        dispatch(fetchItemsSuccess([], {}))
        dispatch(saveSettings())
        if (errors.length > 0) {
          window.utils.showErrorBox(
            intl.get("sources.errorImport", {
              count: errors.length,
            }),
            errors
              .map(e => {
                return e[0] + "\n" + String(e[1])
              })
              .join("\n"),
            intl.get("context.copy")
          )
        }
      })
    })
  }
}

let feedExportCache: Record<RssSource['sid'], HTMLElement> = {};
function sourceToOutline(source: RssSource, xml: Document, tagName?: string) {
  feedExportCache[source.sid] ||= xml.createElement("outline")
  const outline = feedExportCache[source.sid]

  outline.setAttribute("text", source.name)
  outline.setAttribute("title", source.name)
  outline.setAttribute("type", "rss")
  outline.setAttribute("xmlUrl", source.url)
  if (tagName) {
    const existingTags = outline.getAttribute("category") || ""
    outline.setAttribute("category", [existingTags, tagName].filter(Boolean).join(","))
  }
  if (source.iconurl) outline.setAttribute("tncr:iconurl", source.iconurl)

  return outline
}

export function exportOPML(): AppThunk {
  return (_, getState) => {
    const filters = [
      { name: intl.get("sources.opmlFile"), extensions: ["opml"] },
    ]

    const todaysDate = new Date().toISOString().split('T')[0]
    const todaysDateShort = todaysDate.substring(2).replace(/-/g, '')

    window.utils
      .showSaveDialog(filters, `*/tncr${todaysDateShort}.opml`)
      .then(write => {
        if (!write) return

        const state = getState()
        const xml = domParser.parseFromString(
          `<?xml version="1.0" encoding="UTF-8"?><opml version="2.0"><head><title>Tags Not Cats RSS Export</title><dateCreated>${todaysDate}</dateCreated></head><body></body></opml>`,
          "text/xml"
        )
        const opml = xml.getElementsByTagName("opml")[0]
        opml.setAttribute("xmlns:tncr", "urn:tags-not-cats-rss:")
        const body = xml.getElementsByTagName("body")[0]
        feedExportCache = {}
        for (let group of state.groups) {
          if (group.isMultiple) {
            let outline = xml.createElement("outline")
            outline.setAttribute("text", group.name)
            outline.setAttribute("title", group.name)
            outline.setAttribute("type", "bucket")
            body.appendChild(outline)

            for (let sid of group.sids) {
              body.appendChild(sourceToOutline(state.sources[sid], xml, group.name))
            }
          } else {
            body.appendChild(
              sourceToOutline(state.sources[group.sids[0]], xml)
            )
          }
        }
        feedExportCache = {}
        write(
          new XMLSerializer().serializeToString(xml),
          intl.get("settings.writeError")
        )
      })
  }
}

export type GroupState = SourceGroup[]

export function groupReducer(
  state = window.settings.loadGroups(),
  action: SourceActionTypes | SourceGroupActionTypes
): GroupState {
  switch (action.type) {
    case ADD_SOURCE:
      switch (action.status) {
        case ActionStatus.Success:
          return [...state, new SourceGroup([action.source.sid])]
        default:
          return state
      }
    case DELETE_SOURCE:
      return [
        ...state
          .map(group => ({
            ...group,
            sids: group.sids.filter(sid => sid != action.source.sid),
          }))
          .filter(g => g.isMultiple || g.sids.length == 1),
      ]
    case CREATE_SOURCE_GROUP:
      return [...state, action.group]
    case ADD_SOURCE_TO_GROUP:
      return state
        .map((g, i) => ({
          ...g,
          sids:
            i == action.groupIndex
              ? [...g.sids.filter(sid => sid !== action.sid), action.sid]
              : g.sids.filter(sid => sid !== action.sid),
        }))
        .filter(g => g.isMultiple || g.sids.length > 0)
    case REMOVE_SOURCE_FROM_GROUP:
      return [
        ...state.slice(0, action.groupIndex),
        {
          ...state[action.groupIndex],
          sids: state[action.groupIndex].sids.filter(
            sid => !action.sids.includes(sid)
          ),
        },
        ...action.sids.map(sid => new SourceGroup([sid])),
        ...state.slice(action.groupIndex + 1),
      ]
    case UPDATE_SOURCE_GROUP:
      return [
        ...state.slice(0, action.groupIndex),
        action.group,
        ...state.slice(action.groupIndex + 1),
      ]
    case REORDER_SOURCE_GROUPS:
      return action.groups
    case DELETE_SOURCE_GROUP:
      return [
        ...state.slice(0, action.groupIndex),
        ...state[action.groupIndex].sids.map(sid => new SourceGroup([sid])),
        ...state.slice(action.groupIndex + 1),
      ]
    case TOGGLE_GROUP_EXPANSION:
      return state.map((g, i) =>
        i == action.groupIndex
          ? {
              ...g,
              expanded: !g.expanded,
            }
          : g
      )
    default:
      return state
  }
}
