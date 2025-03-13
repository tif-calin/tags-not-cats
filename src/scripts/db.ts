import lf from "lovefield"

const sdbSchema = lf.schema.create("sourcesDB", 3)
sdbSchema
  .createTable("sources")
  .addColumn("sid", lf.Type.INTEGER)
  .addPrimaryKey(["sid"], false)
  .addColumn("fetchFrequency", lf.Type.NUMBER)
  .addColumn("hidden", lf.Type.BOOLEAN)
  .addColumn("iconurl", lf.Type.STRING)
  .addColumn("lastFetched", lf.Type.DATE_TIME)
  .addColumn("name", lf.Type.STRING)
  .addColumn("openTarget", lf.Type.NUMBER)
  .addColumn("rules", lf.Type.OBJECT)
  .addColumn("serviceRef", lf.Type.STRING)
  .addColumn("textDir", lf.Type.NUMBER)
  .addColumn("url", lf.Type.STRING)
  .addNullable(["iconurl", "serviceRef", "rules"])
  .addIndex("idxURL", ["url"], true)

const idbSchema = lf.schema.create("itemsDB", 1)
idbSchema
  .createTable("items")
  .addColumn("_id", lf.Type.INTEGER)
  .addPrimaryKey(["_id"], true)
  .addColumn("content", lf.Type.STRING)
  .addColumn("creator", lf.Type.STRING)
  .addColumn("date", lf.Type.DATE_TIME)
  .addColumn("fetchedDate", lf.Type.DATE_TIME)
  .addColumn("hasRead", lf.Type.BOOLEAN)
  .addColumn("hidden", lf.Type.BOOLEAN)
  .addColumn("link", lf.Type.STRING)
  .addColumn("notify", lf.Type.BOOLEAN)
  .addColumn("serviceRef", lf.Type.STRING)
  .addColumn("snippet", lf.Type.STRING)
  .addColumn("source", lf.Type.INTEGER)
  .addColumn("starred", lf.Type.BOOLEAN)
  .addColumn("thumb", lf.Type.STRING)
  .addColumn("title", lf.Type.STRING)
  .addNullable(["thumb", "creator", "serviceRef"])
  .addIndex("idxDate", ["date"], false, lf.Order.DESC)
  .addIndex("idxService", ["serviceRef"], false)

export let sourcesDB: lf.Database
export let sources: lf.schema.Table
export let itemsDB: lf.Database
export let items: lf.schema.Table

async function onUpgradeSourceDB(rawDb: lf.raw.BackStore) {
  const version = rawDb.getVersion()
  if (version < 2) {
    await rawDb.addTableColumn("sources", "textDir", 0)
  }
  if (version < 3) {
    await rawDb.addTableColumn("sources", "hidden", false)
  }
}

export async function init() {
  sourcesDB = await sdbSchema.connect({ onUpgrade: onUpgradeSourceDB })
  sources = sourcesDB.getSchema().table("sources")
  itemsDB = await idbSchema.connect()
  items = itemsDB.getSchema().table("items")
}
