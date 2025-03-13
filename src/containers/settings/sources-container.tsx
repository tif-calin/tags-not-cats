import intl from "react-intl-universal"
import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../../scripts/reducer"
import SourcesTab from "../../components/settings/sources"
import {
  addSource,
  RssSource,
  updateSource,
  deleteSource,
  SourceOpenTarget,
  deleteSources,
  toggleSourceHidden,
} from "../../scripts/models/source"
import { importOPML, exportOPML } from "../../scripts/models/group"
import { AppDispatch, validateFavicon } from "../../scripts/utils"
import { saveSettings, toggleSettings } from "../../scripts/models/app"
import { SyncService } from "../../schema-types"

const getSources = (state: RootState) => state.sources
const getServiceOn = (state: RootState) =>
  state.service.type !== SyncService.None
const getSIDs = (state: RootState) => state.app.settings.sids

const mapStateToProps = createSelector(
  [getSources, getServiceOn, getSIDs],
  (sources, serviceOn, sids) => ({
    sources: sources,
    serviceOn: serviceOn,
    sids: sids,
  })
)

const mapDispatchToProps = (dispatch: AppDispatch) => {
  return {
    acknowledgeSIDs: () => dispatch(toggleSettings(true)),
    addSource: (url: string) => dispatch(addSource({ url })),
    updateSourceName: (source: RssSource, name: string) => {
      dispatch(updateSource({ ...source, name: name } as RssSource))
    },
    updateSourceIcon: async (source: RssSource, iconUrl: string) => {
      dispatch(saveSettings())
      if (await validateFavicon(iconUrl)) {
        dispatch(updateSource({ ...source, iconurl: iconUrl }))
      } else {
        window.utils.showErrorBox(intl.get("sources.badIcon"), "")
      }
      dispatch(saveSettings())
    },
    updateSourceOpenTarget: (source: RssSource, target: SourceOpenTarget) => {
      dispatch(updateSource({ ...source, openTarget: target } as RssSource))
    },
    updateFetchFrequency: (source: RssSource, frequency: number) => {
      dispatch(
        updateSource({
          ...source,
          fetchFrequency: frequency,
        } as RssSource)
      )
    },
    deleteSource: (source: RssSource) => dispatch(deleteSource(source)),
    deleteSources: (sources: RssSource[]) => dispatch(deleteSources(sources)),
    importOPML: () => dispatch(importOPML()),
    exportOPML: () => dispatch(exportOPML()),
    toggleSourceHidden: (source: RssSource) =>
      dispatch(toggleSourceHidden(source)),
  }
}

const SourcesTabContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(SourcesTab)
export default SourcesTabContainer
