import intl from "react-intl-universal";
import { saveSettings } from "./models/app";
import { createSourceGroup, addSourceToGroup } from "./models/group";
import { fetchItemsRequest, fetchItemsIntermediate, fetchItemsSuccess } from "./models/item";
import { addSource, RssSource } from "./models/source";
import { AppThunk, domParser } from "./utils";

function outlineToSource(outline: Element): [ReturnType<typeof addSource>, string] | null {
  const url = outline.getAttribute("xmlUrl");
  const name = outline.getAttribute("title") || outline.getAttribute("text");
  const iconurl = outline.getAttribute("tncr:iconurl");

  return url ? [addSource({ url: url.trim(), name, batch: true, iconurl }), url] : null;
}

export function importOPML(): AppThunk {
  return async dispatch => {
    const filters = [{ name: intl.get("sources.opmlFile"), extensions: ["xml", "opml"] }];
    window.utils.showOpenDialog(filters).then(data => {
      if (!data) return;

      dispatch(saveSettings());
      const doc = domParser.parseFromString(data, "text/xml").getElementsByTagName("body");
      if (doc.length == 0) {
        dispatch(saveSettings());
        return;
      }
      const parseError = doc[0].getElementsByTagName("parsererror");
      if (parseError.length > 0) {
        dispatch(saveSettings());
        window.utils.showErrorBox(
          intl.get("sources.errorParse"),
          intl.get("sources.errorParseHint")
        );
        return;
      }
      const sources: [ReturnType<typeof addSource>, number, string][] = [];
      const errors: [string, any][] = [];
      for (let el of doc[0].children) {
        const type = el.getAttribute("type");

        switch (type) {
          case "rss":
            const source = outlineToSource(el);
            if (source) sources.push([source[0], -1, source[1]]);
            break;
          default:
            const groupName = el.getAttribute("title") || el.getAttribute("text");
            console.warn("Unknown <outline> type:", type, groupName);
          case "bucket":
            const gid = dispatch(createSourceGroup(groupName));
            for (let child of el.children) {
              const source = outlineToSource(child);
              if (source) sources.push([source[0], gid, source[1]]);
            }
            break;
        }
      }
      dispatch(fetchItemsRequest(sources.length));
      let promises = sources.map(([s, gid, url]) => {
        return dispatch(s)
          .then(sid => {
            if (sid !== null && gid > -1) dispatch(addSourceToGroup(gid, sid));
          })
          .catch(err => errors.push([url, err]))
          .finally(() => dispatch(fetchItemsIntermediate()));
      });
      Promise.allSettled(promises).then(() => {
        dispatch(fetchItemsSuccess([], {}));
        dispatch(saveSettings());
        if (errors.length > 0) {
          window.utils.showErrorBox(
            intl.get("sources.errorImport", {
              count: errors.length,
            }),
            errors
              .map(e => {
                return e[0] + "\n" + String(e[1]);
              })
              .join("\n"),
            intl.get("context.copy")
          );
        }
      });
    });
  };
}

let feedExportCache: Record<RssSource["sid"], HTMLElement> = {};
function sourceToOutline(source: RssSource, xml: Document, tagName?: string) {
  feedExportCache[source.sid] ||= xml.createElement("outline");
  const outline = feedExportCache[source.sid];

  outline.setAttribute("text", source.name);
  outline.setAttribute("title", source.name);
  outline.setAttribute("type", "rss");
  outline.setAttribute("xmlUrl", source.url);
  if (tagName) {
    const existingTags = outline.getAttribute("category") || "";
    outline.setAttribute("category", [existingTags, tagName].filter(Boolean).join(","));
  }
  if (source.iconurl) outline.setAttribute("tncr:iconurl", source.iconurl);

  return outline;
}

export function exportOPML(): AppThunk {
  return (_, getState) => {
    const filters = [{ name: intl.get("sources.opmlFile"), extensions: ["opml"] }];

    const todaysDate = new Date().toISOString().split("T")[0];
    const todaysDateShort = todaysDate.substring(2).replace(/-/g, "");

    window.utils.showSaveDialog(filters, `*/tncr${todaysDateShort}.opml`).then(write => {
      if (!write) return;

      const state = getState();
      const xml = domParser.parseFromString(
        `<?xml version="1.0" encoding="UTF-8"?><opml version="2.0"><head><title>Tags Not Cats RSS Export</title><dateCreated>${todaysDate}</dateCreated></head><body></body></opml>`,
        "text/xml"
      );
      const opml = xml.getElementsByTagName("opml")[0];
      opml.setAttribute("xmlns:tncr", "urn:tags-not-cats-rss:");
      const body = xml.getElementsByTagName("body")[0];
      feedExportCache = {};
      for (let group of state.groups) {
        if (group.isMultiple) {
          let outline = xml.createElement("outline");
          outline.setAttribute("text", group.name);
          outline.setAttribute("title", group.name);
          outline.setAttribute("type", "bucket");
          body.appendChild(outline);

          for (let sid of group.sids) {
            body.appendChild(sourceToOutline(state.sources[sid], xml, group.name));
          }
        } else {
          body.appendChild(sourceToOutline(state.sources[group.sids[0]], xml));
        }
      }
      feedExportCache = {};
      write(new XMLSerializer().serializeToString(xml), intl.get("settings.writeError"));
    });
  };
}
