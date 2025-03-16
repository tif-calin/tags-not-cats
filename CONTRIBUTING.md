
## OPML

### Usage of OPML attributes
- `category`: a comma-separated list of tags (https://opml.org/spec2.opml#1629042387000)
- `type`: `rss | bucket` (https://opml.org/spec2.opml#1629042385000)

#### OPML Namespace
We use the `tncr:` namespace to store our custom attributes in import/exports.
- `tncr:iconurl`

## Contributing to translations
1. In `src/scripts/i18n` either add or update a *.json file.
2. (if new) In `src/scripts/i18n/_locales.ts` import the json file and add it to the `locales` object.
3. (if new) Update `src/scripts/i18n/README.md` with the new language.
4. (if new) Add it to the app by updating `src/components/settings/app.tsx`.

## Cutting a release

### Checklist
- [ ] bump version in `package.json`
- [ ] update `CHANGELOG.md`
