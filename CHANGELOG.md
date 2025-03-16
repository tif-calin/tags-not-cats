# Changelog

## v2
- Rebranded to Tags Not Cats RSS
  - Added this changelog!
  - Changed package.json fields
  - Rewrote README.md
- Reworked OPML structure
  - Updated to OPML 2.0 spec
  - Namespaced custom attributes
  - Flattened outputted structure and used `category` type for tags
  - Added `tncr:iconurl` attribute to export and import
- Removed all code related to NeDB
- Numerous styling fixes and tweaks
  - Added aria labels to table headers
  - Changed cursor to pointer on all clickable buttons
  - Fixed alignment issue with card view when a row had less than 3 cards
- Fixed url duplication with trailing slash
- Changed UI
  - Added a subscription count in the menu
- Changed and cleaned up a lot of code styling/conventions
  - Ran prettier on codebase with new settings
  - Converted some function parameters to named parameters
  - Renamed some variables
- Updated some dependencies, removed some others
  - Bumped major versions react 16->17, electron 27->35, typescript 4->5, prettier 2->3, and more
  - Updated all up to their latest current major version
  - Removed nedb

## v1.1.4
This was the last version number of the original Fluent Reader before the hard fork.
