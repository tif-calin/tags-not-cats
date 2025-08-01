import * as React from "react";
import intl from "react-intl-universal";
import {
  Label,
  DefaultButton,
  TextField,
  Stack,
  PrimaryButton,
  DetailsList,
  IColumn,
  SelectionMode,
  Selection,
  IChoiceGroupOption,
  ChoiceGroup,
  IDropdownOption,
  Dropdown,
  MessageBar,
  MessageBarType,
  Toggle,
} from "@fluentui/react";
import { SourceState, RssSource, SourceOpenTarget } from "../../scripts/models/source";
import { urlTest } from "../../scripts/utils";
import DangerButton from "../utils/danger-button";

type SourcesTabProps = {
  sources: SourceState;
  serviceOn: boolean;
  sids: number[];
  acknowledgeSIDs: () => void;
  addSource: (url: string) => void;
  updateSourceName: (source: RssSource, name: string) => void;
  updateSourceIcon: (source: RssSource, iconUrl: string) => Promise<void>;
  updateSourceOpenTarget: (source: RssSource, target: SourceOpenTarget) => void;
  updateFetchFrequency: (source: RssSource, frequency: number) => void;
  deleteSource: (source: RssSource) => void;
  deleteSources: (sources: RssSource[]) => void;
  importOPML: () => void;
  exportOPML: () => void;
  toggleSourceHidden: (source: RssSource) => void;
};

type SourcesTabState = {
  columns: IColumn[];
  selectedSource: RssSource;
  selectedSources: RssSource[];
  sortBy?: string; // 'name' | 'url'
  sortDescending?: boolean;

  announcedMessage?: string;
  newUrl?: string;
  newSourceName?: string;
  newSourceIcon?: string;
  sourceEditOption?: string;
};

const enum EditDropdownKeys {
  Name = "n",
  Icon = "i",
  Url = "u",
}

class SourcesTab extends React.Component<SourcesTabProps, SourcesTabState> {
  selection: Selection;

  constructor(props: SourcesTabProps) {
    super(props);

    const columns: IColumn[] = [
      {
        key: "favicon",
        ariaLabel: intl.get("icon"),
        fieldName: "name",
        iconName: "ImagePixel",
        isIconOnly: true,
        maxWidth: 16,
        minWidth: 16,
        name: intl.get("icon"),
        onRender: (s: RssSource) => s.iconurl && <img src={s.iconurl} className="favicon" />,
      },
      {
        key: "name",
        ariaLabel: intl.get("name"),
        data: "string",
        fieldName: "name",
        isRowHeader: true,
        isResizable: true,
        isSorted: false,
        isSortedDescending: true,
        minWidth: 180,
        name: intl.get("name"),
        onColumnClick: this._onColumnClick,
      },
      {
        key: "url",
        ariaLabel: "URL",
        data: "string",
        fieldName: "url",
        isResizable: true,
        isSorted: false,
        isSortedDescending: true,
        minWidth: 280,
        name: "URL",
        onColumnClick: this._onColumnClick,
      },
    ];

    this.state = {
      columns,
      newUrl: "",
      newSourceName: "",
      selectedSource: null,
      selectedSources: null,
    };

    this.selection = new Selection({
      getKey: s => (s as RssSource).sid,
      onSelectionChanged: () => {
        let count = this.selection.getSelectedCount();
        let sources = count ? (this.selection.getSelection() as RssSource[]) : null;
        this.setState({
          selectedSource: count === 1 ? sources[0] : null,
          selectedSources: count > 1 ? sources : null,
          newSourceName: count === 1 ? sources[0].name : "",
          newSourceIcon: count === 1 ? sources[0].iconurl || "" : "",
          sourceEditOption: EditDropdownKeys.Name,
        });
      },
    });
  }

  componentDidMount = () => {
    if (this.props.sids.length > 0) {
      for (let sid of this.props.sids) {
        this.selection.setKeySelected(String(sid), true, false);
      }
      this.props.acknowledgeSIDs();
    }
  };

  sourceEditOptions = (): IDropdownOption[] => [
    { key: EditDropdownKeys.Name, text: intl.get("name") },
    { key: EditDropdownKeys.Icon, text: intl.get("icon") },
    { key: EditDropdownKeys.Url, text: "URL" },
  ];

  onSourceEditOptionChange = (_, option: IDropdownOption) => {
    this.setState({ sourceEditOption: option.key as string });
  };

  fetchFrequencyOptions = (): IDropdownOption[] => [
    { key: "0", text: intl.get("sources.unlimited") },
    { key: "15", text: intl.get("time.minute", { m: 15 }) },
    { key: "30", text: intl.get("time.minute", { m: 30 }) },
    { key: "60", text: intl.get("time.hour", { h: 1 }) },
    { key: "120", text: intl.get("time.hour", { h: 2 }) },
    { key: "180", text: intl.get("time.hour", { h: 3 }) },
    { key: "360", text: intl.get("time.hour", { h: 6 }) },
    { key: "720", text: intl.get("time.hour", { h: 12 }) },
    { key: "1440", text: intl.get("time.day", { d: 1 }) },
  ];

  onFetchFrequencyChange = (_, option: IDropdownOption) => {
    let frequency = parseInt(option.key as string);
    this.props.updateFetchFrequency(this.state.selectedSource, frequency);
    this.setState({
      selectedSource: {
        ...this.state.selectedSource,
        fetchFrequency: frequency,
      } as RssSource,
    });
  };

  sourceOpenTargetChoices = (): IChoiceGroupOption[] => [
    {
      key: String(SourceOpenTarget.Local),
      text: intl.get("sources.rssText"),
    },
    {
      key: String(SourceOpenTarget.FullContent),
      text: intl.get("article.loadFull"),
    },
    {
      key: String(SourceOpenTarget.Webpage),
      text: intl.get("sources.loadWebpage"),
    },
    {
      key: String(SourceOpenTarget.External),
      text: intl.get("openExternal"),
    },
  ];

  updateSourceName = () => {
    let newName = this.state.newSourceName.trim();
    this.props.updateSourceName(this.state.selectedSource, newName);
    this.setState({
      selectedSource: {
        ...this.state.selectedSource,
        name: newName,
      } as RssSource,
    });
  };

  updateSourceIcon = () => {
    let newIcon = this.state.newSourceIcon.trim();
    this.props.updateSourceIcon(this.state.selectedSource, newIcon);
    this.setState({
      selectedSource: { ...this.state.selectedSource, iconurl: newIcon },
    });
  };

  handleInputChange = event => {
    const name: string = event.target.name;
    // @ts-ignore
    this.setState({ [name]: event.target.value });
  };

  addSource = (event: React.FormEvent) => {
    event.preventDefault();
    let trimmed = this.state.newUrl.trim().replace(/\/$/, "");
    if (urlTest(trimmed)) this.props.addSource(trimmed);
  };

  onOpenTargetChange = (_, option: IChoiceGroupOption) => {
    let newTarget = parseInt(option.key) as SourceOpenTarget;
    this.props.updateSourceOpenTarget(this.state.selectedSource, newTarget);
    this.setState({
      selectedSource: {
        ...this.state.selectedSource,
        openTarget: newTarget,
      } as RssSource,
    });
  };

  onToggleHidden = () => {
    this.props.toggleSourceHidden(this.state.selectedSource);
    this.setState({
      selectedSource: {
        ...this.state.selectedSource,
        hidden: !this.state.selectedSource.hidden,
      } as RssSource,
    });
  };

  render = () => {
    const items = Object.values(this.props.sources);
    if (this.state.sortBy) {
      items.sort((a, b) => {
        const key = this.state.sortBy as keyof RssSource;
        return this.state.sortDescending ? (a[key] < b[key] ? 1 : -1) : a[key] > b[key] ? 1 : -1;
      });
    }

    return (
      <div className="tab-body">
        {this.props.serviceOn && (
          <MessageBar messageBarType={MessageBarType.info}>
            {intl.get("sources.serviceWarning")}
          </MessageBar>
        )}
        <Label>{intl.get("sources.opmlFile")}</Label>
        <Stack horizontal>
          <Stack.Item>
            <PrimaryButton onClick={this.props.importOPML} text={intl.get("sources.import")} />
          </Stack.Item>
          <Stack.Item>
            <DefaultButton onClick={this.props.exportOPML} text={intl.get("sources.export")} />
          </Stack.Item>
        </Stack>

        <form onSubmit={this.addSource}>
          <Label htmlFor="newUrl">{intl.get("sources.add")}</Label>
          <Stack horizontal>
            <Stack.Item grow>
              <TextField
                onGetErrorMessage={v => (urlTest(v.trim()) ? "" : intl.get("sources.badUrl"))}
                validateOnLoad={false}
                placeholder={intl.get("sources.inputUrl")}
                value={this.state.newUrl}
                id="newUrl"
                name="newUrl"
                onChange={this.handleInputChange}
              />
            </Stack.Item>
            <Stack.Item>
              <PrimaryButton
                disabled={!urlTest(this.state.newUrl.trim())}
                type="submit"
                text={intl.get("add")}
              />
            </Stack.Item>
          </Stack>
        </form>

        <DetailsList
          compact={Object.keys(this.props.sources).length >= 10}
          items={items}
          columns={this.state.columns}
          getKey={s => s.sid}
          setKey="selected"
          selection={this.selection}
          selectionMode={SelectionMode.multiple}
        />

        {this.state.selectedSource && (
          <>
            {this.state.selectedSource.serviceRef && (
              <MessageBar messageBarType={MessageBarType.info}>
                {intl.get("sources.serviceManaged")}
              </MessageBar>
            )}
            <Label>{intl.get("sources.selected")}</Label>
            <Stack horizontal>
              <Stack.Item>
                <Dropdown
                  options={this.sourceEditOptions()}
                  selectedKey={this.state.sourceEditOption}
                  onChange={this.onSourceEditOptionChange}
                  style={{ width: 120 }}
                />
              </Stack.Item>
              {this.state.sourceEditOption === EditDropdownKeys.Name && (
                <>
                  <Stack.Item grow>
                    <TextField
                      onGetErrorMessage={v => (v.trim().length == 0 ? intl.get("emptyName") : "")}
                      validateOnLoad={false}
                      placeholder={intl.get("sources.name")}
                      value={this.state.newSourceName}
                      name="newSourceName"
                      onChange={this.handleInputChange}
                    />
                  </Stack.Item>
                  <Stack.Item>
                    <DefaultButton
                      disabled={this.state.newSourceName.trim().length == 0}
                      onClick={this.updateSourceName}
                      text={intl.get("sources.editName")}
                    />
                  </Stack.Item>
                </>
              )}
              {this.state.sourceEditOption === EditDropdownKeys.Icon && (
                <>
                  <Stack.Item grow>
                    <TextField
                      onGetErrorMessage={v => (urlTest(v.trim()) ? "" : intl.get("sources.badUrl"))}
                      validateOnLoad={false}
                      placeholder={intl.get("sources.inputUrl")}
                      value={this.state.newSourceIcon}
                      name="newSourceIcon"
                      onChange={this.handleInputChange}
                    />
                  </Stack.Item>
                  <Stack.Item>
                    <DefaultButton
                      disabled={!urlTest(this.state.newSourceIcon.trim())}
                      onClick={this.updateSourceIcon}
                      text={intl.get("edit")}
                    />
                  </Stack.Item>
                </>
              )}
              {this.state.sourceEditOption === EditDropdownKeys.Url && (
                <>
                  <Stack.Item grow>
                    <TextField disabled value={this.state.selectedSource.url} />
                  </Stack.Item>
                  <Stack.Item>
                    <DefaultButton
                      onClick={() => window.utils.writeClipboard(this.state.selectedSource.url)}
                      text={intl.get("context.copy")}
                    />
                  </Stack.Item>
                </>
              )}
            </Stack>
            {!this.state.selectedSource.serviceRef && (
              <>
                <Label>{intl.get("sources.fetchFrequency")}</Label>
                <Stack>
                  <Stack.Item>
                    <Dropdown
                      options={this.fetchFrequencyOptions()}
                      selectedKey={
                        this.state.selectedSource.fetchFrequency
                          ? String(this.state.selectedSource.fetchFrequency)
                          : "0"
                      }
                      onChange={this.onFetchFrequencyChange}
                      style={{ width: 200 }}
                    />
                  </Stack.Item>
                </Stack>
              </>
            )}
            <ChoiceGroup
              label={intl.get("sources.openTarget")}
              options={this.sourceOpenTargetChoices()}
              selectedKey={String(this.state.selectedSource.openTarget)}
              onChange={this.onOpenTargetChange}
            />
            <Stack horizontal verticalAlign="baseline">
              <Stack.Item grow>
                <Label>{intl.get("sources.hidden")}</Label>
              </Stack.Item>
              <Stack.Item>
                <Toggle checked={this.state.selectedSource.hidden} onChange={this.onToggleHidden} />
              </Stack.Item>
            </Stack>
            {!this.state.selectedSource.serviceRef && (
              <Stack horizontal>
                <Stack.Item>
                  <DangerButton
                    onClick={() => this.props.deleteSource(this.state.selectedSource)}
                    key={this.state.selectedSource.sid}
                    text={intl.get("sources.delete")}
                  />
                </Stack.Item>
                <Stack.Item>
                  <span className="settings-hint">{intl.get("sources.deleteWarning")}</span>
                </Stack.Item>
              </Stack>
            )}
          </>
        )}
        {this.state.selectedSources &&
          (this.state.selectedSources.filter(s => s.serviceRef).length === 0 ? (
            <>
              <Label>{intl.get("sources.selectedMulti")}</Label>
              <Stack horizontal>
                <Stack.Item>
                  <DangerButton
                    onClick={() => this.props.deleteSources(this.state.selectedSources)}
                    text={intl.get("sources.delete")}
                  />
                </Stack.Item>
                <Stack.Item>
                  <span className="settings-hint">{intl.get("sources.deleteWarning")}</span>
                </Stack.Item>
              </Stack>
            </>
          ) : (
            <MessageBar messageBarType={MessageBarType.info}>
              {intl.get("sources.serviceManaged")}
            </MessageBar>
          ))}
      </div>
    );
  };

  private _onColumnClick = (_ev: React.MouseEvent<HTMLElement>, selectedColumn: IColumn): void => {
    const newColumns = this.state.columns.slice();

    newColumns.forEach(column => {
      if (column.key === selectedColumn.key) {
        if (column.isSorted && column.isSortedDescending) {
          column.isSorted = false;
          this.setState({ sortBy: undefined });
        } else {
          column.isSortedDescending = !column.isSortedDescending;
          column.isSorted = true;
          this.setState({
            announcedMessage: `${column.name} is sorted ${
              column.isSortedDescending ? "descending" : "ascending"
            }`,
            sortBy: column.fieldName,
            sortDescending: column.isSortedDescending,
          });
        }
      } else {
        column.isSorted = false;
        column.isSortedDescending = true;
      }
    });

    this.setState({ columns: newColumns });
  };
}

export default SourcesTab;
