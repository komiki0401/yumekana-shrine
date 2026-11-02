export type Rarity = "N" | "R" | "SR" | "SSR" | "UR"
export type MiracleCategory = "animals" | "nature" | "sky" | "mystic" | "divine"
export type MiracleCondition = { season?: "spring" | "summer" | "autumn" | "winter"; time?: "day" | "night" }
export type MiracleDefinition = { id: string; number: number; category: MiracleCategory; title: string; message: string; rarity: Rarity; implemented: boolean; conditions?: MiracleCondition; combinationTags?: readonly string[] }
export const miracleCatalog = [
 {"id": "cat", "number": 1, "category": "animals", "title": "猫が遊びに来る", "message": "小さな猫が境内で足を休め、あなたを見守ります。", "rarity": "N", "implemented": true, "combinationTags": ["cat-and-star"]},
 {"id": "whiteCat", "number": 2, "category": "animals", "title": "白猫が現れる", "message": "白い毛並みが、やさしい光に溶け込みます。", "rarity": "R", "implemented": false},
 {"id": "calicoCat", "number": 3, "category": "animals", "title": "三毛猫が歩いてくる", "message": "三色の毛並みの猫が、参道を気ままにお散歩。", "rarity": "R", "implemented": false},
 {"id": "fox", "number": 4, "category": "animals", "title": "キツネがこちらを振り返る", "message": "ふわりと振り返るキツネと、目が合うひととき。", "rarity": "SR", "implemented": false},
 {"id": "tanuki", "number": 5, "category": "animals", "title": "タヌキが顔を出す", "message": "木陰から、好奇心いっぱいの顔がのぞきます。", "rarity": "R", "implemented": false},
 {"id": "rabbit", "number": 6, "category": "animals", "title": "ウサギが跳ねる", "message": "軽やかな足取りが、境内に小さな喜びを運びます。", "rarity": "N", "implemented": false},
 {"id": "deer", "number": 7, "category": "animals", "title": "鹿が静かに現れる", "message": "静かな足音とともに、森の気配が近づきます。", "rarity": "SR", "implemented": false},
 {"id": "sparrow", "number": 8, "category": "animals", "title": "スズメが飛んでくる", "message": "小さな羽音が、穏やかな空気に弾みます。", "rarity": "N", "implemented": false},
 {"id": "butterfly", "number": 9, "category": "animals", "title": "蝶が舞う", "message": "淡い羽が、風に乗って境内をめぐります。", "rarity": "R", "implemented": true, "combinationTags": ["petals-and-butterfly"]},
 {"id": "firefly", "number": 10, "category": "animals", "title": "ホタルが光る", "message": "小さな灯りが、ゆっくり点いたり消えたり。", "rarity": "R", "implemented": false},
 {"id": "blossoms", "number": 11, "category": "nature", "title": "桜吹雪", "message": "花びらの風が、参道を淡い桜色に染めます。", "rarity": "N", "implemented": true, "combinationTags": ["petals-and-butterfly"]},
 {"id": "rainbow", "number": 12, "category": "nature", "title": "虹が現れる", "message": "柔らかな七色の橋が、空にそっと架かります。", "rarity": "SR", "implemented": true},
 {"id": "doubleRainbow", "number": 13, "category": "nature", "title": "二重虹", "message": "ふたつの虹が、空に静かな輪を描きます。", "rarity": "SSR", "implemented": false},
 {"id": "sunbeams", "number": 14, "category": "nature", "title": "木漏れ日が差し込む", "message": "葉の隙間から、あたたかな光がこぼれます。", "rarity": "R", "implemented": false},
 {"id": "gentleSnow", "number": 15, "category": "nature", "title": "優しい雪が降る", "message": "音もなく降る雪が、境内をふんわり包みます。", "rarity": "R", "implemented": false},
 {"id": "firstSnow", "number": 16, "category": "nature", "title": "初雪が舞う", "message": "季節の始まりを告げる、小さな白い便り。", "rarity": "SR", "implemented": false},
 {"id": "autumnLeaves", "number": 17, "category": "nature", "title": "紅葉が色づく", "message": "木々が少しずつ、あたたかな色をまといます。", "rarity": "R", "implemented": false},
 {"id": "swirlingLeaves", "number": 18, "category": "nature", "title": "落ち葉が風に舞う", "message": "風に遊ぶ葉が、くるりと参道を渡ります。", "rarity": "N", "implemented": false},
 {"id": "dew", "number": 19, "category": "nature", "title": "朝露が輝く", "message": "小さな雫に、朝の光がきらりと宿ります。", "rarity": "R", "implemented": false},
 {"id": "lightMotes", "number": 20, "category": "nature", "title": "光の粒が漂う", "message": "空気の中に、やわらかな光がふわふわ浮かびます。", "rarity": "R", "implemented": false},
 {"id": "shootingStar", "number": 21, "category": "sky", "title": "流れ星", "message": "小さな金色の星が、空を斜めにすっと横切ります。", "rarity": "R", "implemented": true, "combinationTags": ["cat-and-star"]},
 {"id": "meteorShower", "number": 22, "category": "sky", "title": "流星群", "message": "いくつもの星が、静かな空に光の道を描きます。", "rarity": "SSR", "implemented": true},
 {"id": "fullMoon", "number": 23, "category": "sky", "title": "満月が輝く", "message": "まあるい月が、境内に穏やかな光を届けます。", "rarity": "R", "implemented": false},
 {"id": "crescentMoon", "number": 24, "category": "sky", "title": "三日月が現れる", "message": "細い月の舟が、空にそっと浮かびます。", "rarity": "R", "implemented": false},
 {"id": "milkyWay", "number": 25, "category": "sky", "title": "天の川", "message": "無数の星の流れが、遠い空に広がります。", "rarity": "SSR", "implemented": false},
 {"id": "aurora", "number": 26, "category": "sky", "title": "オーロラ", "message": "ゆらめく光のカーテンが、空を彩ります。", "rarity": "SSR", "implemented": false},
 {"id": "comet", "number": 27, "category": "sky", "title": "彗星が通過する", "message": "長い光の尾が、夢の続きのように流れます。", "rarity": "SR", "implemented": false},
 {"id": "constellation", "number": 28, "category": "sky", "title": "星座が光る", "message": "星と星を結ぶ、小さな物語が浮かびます。", "rarity": "SR", "implemented": false},
 {"id": "moonHalo", "number": 29, "category": "sky", "title": "月の周りに光の輪が現れる", "message": "月を囲む淡い輪が、空に神秘を添えます。", "rarity": "SR", "implemented": false},
 {"id": "heartCloud", "number": 30, "category": "sky", "title": "ハート形の雲が浮かぶ", "message": "見上げた先に、心を和ませる雲が流れます。", "rarity": "R", "implemented": false},
 {"id": "foxfire", "number": 31, "category": "mystic", "title": "狐火が漂う", "message": "青白い灯りが、風に揺れるように漂います。", "rarity": "SR", "implemented": false},
 {"id": "glowingTorii", "number": 32, "category": "mystic", "title": "鳥居が光る", "message": "いつもの鳥居が、内側から淡く輝きます。", "rarity": "SR", "implemented": false},
 {"id": "ringingBell", "number": 33, "category": "mystic", "title": "鈴がひとりでに鳴る", "message": "誰かを迎えるような、やさしい鈴の音。", "rarity": "R", "implemented": false},
 {"id": "glowingEma", "number": 34, "category": "mystic", "title": "絵馬が輝く", "message": "願いを預けた絵馬に、小さな光が灯ります。", "rarity": "R", "implemented": false},
 {"id": "lightButterfly", "number": 35, "category": "mystic", "title": "光の蝶が現れる", "message": "光をまとった蝶が、きらめく軌跡を残します。", "rarity": "R", "implemented": true},
 {"id": "rainbowWind", "number": 36, "category": "mystic", "title": "七色の風が吹く", "message": "目には見えない風が、一瞬だけ色をまといます。", "rarity": "SR", "implemented": false},
 {"id": "lightOrb", "number": 37, "category": "mystic", "title": "光の玉が浮かぶ", "message": "丸い光が、ゆっくりと参道の上へ浮かびます。", "rarity": "SR", "implemented": true},
 {"id": "divineFootprints", "number": 38, "category": "mystic", "title": "神様の足跡が現れる", "message": "誰もいない参道に、光の足跡が続きます。", "rarity": "SSR", "implemented": false},
 {"id": "sacredTree", "number": 39, "category": "mystic", "title": "御神木が光る", "message": "長い時を刻む木が、穏やかな輝きを放ちます。", "rarity": "SSR", "implemented": false},
 {"id": "goldenFeather", "number": 40, "category": "mystic", "title": "金色の羽根が舞い落ちる", "message": "一枚の羽根が、ゆらゆらと舞い降ります。", "rarity": "SR", "implemented": false},
 {"id": "deity", "number": 41, "category": "divine", "title": "神様が姿を現す", "message": "柔らかな光とともに、神様がそっと姿を見せます。", "rarity": "UR", "implemented": true},
 {"id": "sacredWhiteFox", "number": 42, "category": "divine", "title": "神聖な白狐が現れる", "message": "清らかな白狐が、静かに参道を進みます。", "rarity": "SSR", "implemented": false},
 {"id": "dragon", "number": 43, "category": "divine", "title": "龍が空を横切る", "message": "悠々と空を渡る龍が、境内に大きな気配を残します。", "rarity": "UR", "implemented": false},
 {"id": "phoenix", "number": 44, "category": "divine", "title": "鳳凰が飛来する", "message": "美しい翼が、空を金色に彩ります。", "rarity": "UR", "implemented": false},
 {"id": "goldenButterfly", "number": 45, "category": "divine", "title": "金色の蝶が舞う", "message": "金色の羽が、夢と感謝を結ぶように舞います。", "rarity": "SSR", "implemented": false},
 {"id": "deitySmile", "number": 46, "category": "divine", "title": "神様が微笑む", "message": "虹色の光の中で、神様がやさしく微笑みます。", "rarity": "SSR", "implemented": true},
 {"id": "goldenGround", "number": 47, "category": "divine", "title": "境内が一瞬黄金色になる", "message": "いつもの景色が、あたたかな金色に包まれます。", "rarity": "SSR", "implemented": false},
 {"id": "rainbowShootingStar", "number": 48, "category": "divine", "title": "七色の流れ星", "message": "七色の尾を引く星が、空を一筋に渡ります。", "rarity": "UR", "implemented": false},
 {"id": "floweringTree", "number": 49, "category": "divine", "title": "御神木に花が咲く", "message": "御神木に、静かな祝福の花がほころびます。", "rarity": "SSR", "implemented": false},
 {"id": "skyTorii", "number": 50, "category": "divine", "title": "空に巨大な光の鳥居が現れる", "message": "空に現れた光の鳥居が、境内を見守ります。", "rarity": "UR", "implemented": false},
] as const satisfies readonly MiracleDefinition[]
export type MiracleId = typeof miracleCatalog[number]["id"]
export type AnimatedMiracleId = Extract<typeof miracleCatalog[number], { implemented: true }>["id"]
export const categoryLabels: Record<MiracleCategory, string> = {"animals": "動物が遊びに来る", "nature": "自然の奇跡", "sky": "空と宇宙の奇跡", "mystic": "神秘的な現象", "divine": "超レア・神様の奇跡"}
export const rarityLabels: Record<Rarity, string> = { N: "日常", R: "珍しい", SR: "幻想", SSR: "奇跡", UR: "神域" }
export const implementedMiracles = miracleCatalog.filter(item => item.implemented)
export function resolveMiracleId(id: string): MiracleId | undefined {
 const normalized = id === "miracle" ? "deitySmile" : id
 return miracleCatalog.find(item => item.id === normalized)?.id
}
export function isAnimatedMiracle(id: string): id is AnimatedMiracleId { return implementedMiracles.some(item => item.id === id) }
