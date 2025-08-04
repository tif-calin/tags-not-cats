import * as React from "react";
import {
  DetailsList,
  IColumn,
  IDetailsListProps,
  IObjectWithKey,
  ISelection,
  SelectionMode,
} from "@fluentui/react";
import { RssSource } from "../../../scripts/models/source";
import intl from "react-intl-universal";

type Props = {
  items: RssSource[];
  onColumnClick?: (ev: React.MouseEvent<HTMLElement>, column: IColumn) => void;
  selection: ISelection<IObjectWithKey>;
  sortBy: string | undefined; // 'name' | 'url'
  sortDescending?: boolean;
};

const getKey: IDetailsListProps["getKey"] = s => s.sid;

const SourcesTable = ({ items, onColumnClick, selection, sortBy, sortDescending }: Props) => {
  const isCompact = items.length >= 10;

  const columns = React.useMemo<IColumn[]>(
    () =>
      [
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
          onColumnClick,
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
          onColumnClick,
        },
      ].map(col => {
        if (sortBy === col.key) {
          return { ...col, isSorted: true, isSortedDescending: sortDescending };
        } else return col;
      }),
    [sortBy, sortDescending, onColumnClick],
  );

  return (
    <DetailsList
      compact={isCompact}
      items={items}
      columns={columns}
      getKey={getKey}
      setKey="selected"
      selection={selection}
      selectionMode={SelectionMode.multiple}
    />
  );
};

export default React.memo(SourcesTable);
