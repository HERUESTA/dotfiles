// gtd: ワークスペースを TODO / DOING / DONE に並べる cmux のカスタムサイドバー
//
// 1ワークスペース = 1タスク。分類は description のタグで持つ:
//   @todo / @doing / @done
//   （以前のタグも読む: @next・@someday は TODO、@now・@waiting は DOING）
// タグを付けたカードは常にそのセクションに置く（入力待ちなどはカードの点の色と本文で示す）。
// タグなしのカードだけ、エージェントが動いている・入力待ち・未読・レビュー中は DOING、
// merge 済みは DONE、それ以外は TODO に自動で置く。
// PROJECTS はワークスペースグループ、進捗率はグループ内の DONE の割合。
//
// リンク方法（dotfiles の中で実行）:
//   cmux/ ディレクトリごと ~/.config/cmux にリンクしているので、追加のリンクは不要。
//   ln -sfn "$(git rev-parse --show-toplevel)/cmux" ~/.config/cmux
// 表示する:
//   cmux sidebar validate gtd && cmux sidebar select gtd
//   （サイドバーの切り替えボタンを右クリックして gtd を選んでもよい）

// ---------------------------------------------------------------- 定数

const TAGS = ["@todo", "@doing", "@done", "@now", "@next", "@waiting", "@someday"];

const C = {
  inbox: "#F5A524",
  unseen: "#F2D24B",
  now: "#FF7A59",
  next: "#5AA9FF",
  waiting: "#4CC38A",
  review: "#B48CFF",
  idle: "#7D8491",
  branch: "#4CC38A",
  pr: "#B48CFF",
};

const SECTIONS = [
  { id: "todo", label: "TODO", color: C.next, foldable: false, empty: "TODO はありません" },
  { id: "doing", label: "DOING", color: C.now, foldable: false, empty: "進行中のタスクはありません" },
  { id: "done", label: "DONE", color: C.idle, foldable: true, empty: null },
];

// ---------------------------------------------------------------- 状態

const [query, setQuery] = signal("");
const [groupFilter, setGroupFilter] = signal(null);
const [folded, setFolded] = signal({ done: true });
// ドロップしても何も変わらなかったときに、リストを元の並びで描き直すためのカウンタ
const [moveTick, setMoveTick] = signal(0);
// 名前を編集中のワークスペースの id（ダブルクリックか右クリックの「名前を変更」で入る）
const [editingId, setEditingId] = signal(null);

const toggleFold = (id) => {
  const next = Object.assign({}, folded());
  next[id] = !next[id];
  setFolded(next);
};

const epoch = () => data.clock()?.epoch ?? 0;

// ---------------------------------------------------------------- ヘルパー

function fmt(secs) {
  const s = Math.max(0, Math.floor(secs));
  if (s < 60) return s + "s";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h";
  return Math.floor(h / 24) + "d";
}

const descOf = (w) => String(w.description ?? "");
const tagOf = (w) => TAGS.find((t) => descOf(w).includes(t)) ?? null;
const stripTags = (text) =>
  TAGS.reduce((s, t) => s.split(t).join(""), String(text ?? "")).replace(/\s+/g, " ").trim();

const agentsOf = (w) => w.agents ?? [];
const needsInput = (w) =>
  agentsOf(w).some((a) => a.status === "needs_input") || w.status === "needs-attention";
const working = (w) => agentsOf(w).some((a) => a.status === "working") || w.status === "working";

// どのセクションに置くか。手で付けたタグを常に優先し、
// タグがないときだけ cmux の状態から自動で振り分ける。
const BUCKET_OF_TAG = {
  "@todo": "todo", "@doing": "doing", "@done": "done",
  "@next": "todo", "@someday": "todo", "@now": "doing", "@waiting": "doing",
};
function bucketOf(w) {
  const tag = tagOf(w);
  if (tag) return BUCKET_OF_TAG[tag];
  if (w.status === "done") return "done";
  if (needsInput(w) || w.unread > 0 || working(w) || w.status === "review") return "doing";
  return "todo";
}

function dotOf(w) {
  if (needsInput(w)) return C.inbox;
  if (w.unread > 0) return C.unseen;
  if (working(w)) return C.waiting;
  if (w.status === "review") return C.review;
  if (bucketOf(w) === "todo") return C.next;
  return C.idle;
}

function timeOf(w) {
  const live = agentsOf(w).find((a) => a.status === "needs_input" || a.status === "working");
  if (live && live.sinceEpoch) return fmt(epoch() - live.sinceEpoch);
  if (w.latestAt) return fmt(epoch() - w.latestAt);
  return "";
}

function messageOf(w) {
  if (needsInput(w)) return "入力待ち：" + (w.latestMessage ?? "確認してください");
  if (w.unread > 0) return "完了（未確認）：" + (w.latestMessage ?? "");
  const note = stripTags(descOf(w));
  if (note) return note;
  if (working(w)) return "エージェント実行中" + (w.latestMessage ? "：" + w.latestMessage : "");
  if (w.status === "review") return "レビュー待ち";
  return w.latestPrompt ?? "";
}

const groupById = (id) => (data.groups() ?? []).find((g) => g.id === id) ?? null;

function chipsOf(w) {
  const chips = [];
  const g = w.group ? groupById(w.group) : null;
  if (g) chips.push({ key: "g", text: g.name, color: g.color ?? C.next });
  if (w.branch) chips.push({ key: "b", text: "⑂ " + w.branch + (w.dirty ? " ●" : ""), color: C.branch });
  if (w.pr) chips.push({ key: "p", text: "#" + w.pr.number, color: C.pr });
  return chips;
}

// description のタグだけを差し替える（メモ部分は残す）
function setTag(w, tag) {
  const note = stripTags(descOf(w));
  const description = (tag ? tag + " " : "") + note;
  cmux("workspace.action", {
    action: "set_description",
    workspace_id: w.id,
    description: description.trim(),
  });
}

const select = (w) => cmux("workspace.select", { workspace_id: w.id });

function taskMenu(w) {
  return [
    Button("名前を変更", () => setEditingId(w().id)),
    Divider(),
    Button("TODO", () => setTag(w(), "@todo")),
    Button("DOING", () => setTag(w(), "@doing")),
    Button("DONE", () => setTag(w(), "@done")),
    Divider(),
    Button("タグを外して自動で振り分ける", () => setTag(w(), null)),
  ];
}

// ---------------------------------------------------------------- データ

const visible = computed(() => {
  const q = query().trim().toLowerCase();
  const gf = groupFilter();
  return (data.workspaces() ?? []).filter((w) => {
    if (gf && w.group !== gf) return false;
    if (!q) return true;
    const hay = [w.title, w.description, w.branch, w.latestMessage, w.latestPrompt]
      .map((s) => String(s ?? "").toLowerCase())
      .join(" ");
    return hay.includes(q);
  });
});

const buckets = computed(() => {
  const out = { todo: [], doing: [], done: [] };
  for (const w of visible()) out[bucketOf(w)].push(w);
  // 入力待ちを DOING の先頭に
  out.doing.sort((a, b) => (needsInput(b) ? 1 : 0) - (needsInput(a) ? 1 : 0));
  return out;
});

// セクション見出し・カード・サブエージェントを1本の平らなリストにする。
// どの行にも所属セクション（sid）を持たせ、ドロップ先の判定に使う。
// 空のセクションも見出しは出す（ドラッグで入れられるように）。
const entries = computed(() => {
  moveTick();
  const editing = editingId();
  const b = buckets();
  const f = folded();
  const out = [];
  for (const s of SECTIONS) {
    const items = b[s.id];
    out.push({ key: "h:" + s.id, kind: "header", sid: s.id, section: s, count: items.length });
    if (s.foldable && f[s.id]) continue;
    if (items.length === 0) {
      if (s.empty) out.push({ key: "e:" + s.id, kind: "empty", sid: s.id, text: s.empty });
      continue;
    }
    for (const w of items.slice(0, 20)) {
      // 編集中はキーを変えて、行を入力欄として作り直す
      if (editing === w.id) out.push({ key: "w:" + w.id + ":edit", kind: "edit", sid: s.id, w });
      else out.push({ key: "w:" + w.id, kind: "card", sid: s.id, w, highlight: needsInput(w) });
      for (const a of agentsOf(w)) {
        for (const c of (a.children ?? []).filter((c) => c.running)) {
          out.push({ key: "c:" + w.id + ":" + c.id, kind: "child", sid: s.id, w, c });
        }
      }
    }
  }
  return out;
});

const TAG_OF_SECTION = { todo: "@todo", doing: "@doing", done: "@done" };

// カードをドラッグで落としたとき。index は、ドラッグ中の行を除いたリストでの落とした位置。
// 直前の行が属するセクションへ振り分け、同じセクション内なら並び順だけ変える。
function handleMove(key, index) {
  const before = entries();
  const card = before.find((e) => e.key === key);
  if (!card || card.kind !== "card") { setMoveTick(moveTick() + 1); return; } // 見出しなどは動かさない
  const w = card.w;
  const rest = before.filter((e) => e.key !== key);
  const pos = Math.max(0, Math.min(index, rest.length));
  const sid = pos > 0 ? rest[pos - 1].sid : "todo";

  let changed = false;
  if (sid !== card.sid) {
    setTag(w, TAG_OF_SECTION[sid]);
    changed = true;
  }

  // 落とした位置の前後にある同じセクションのカードを基準に、ワークスペースの並びを変える
  const others = (data.workspaces() ?? []).map((x) => x.id).filter((id) => id !== w.id);
  const nextCard = rest.slice(pos).find((e) => e.kind === "card" || e.kind === "header");
  const prevCard = rest.slice(0, pos).reverse().find((e) => e.kind === "card" || e.kind === "header");
  let target = -1;
  if (nextCard && nextCard.kind === "card" && nextCard.sid === sid) target = others.indexOf(nextCard.w.id);
  else if (prevCard && prevCard.kind === "card" && prevCard.sid === sid) target = others.indexOf(prevCard.w.id) + 1;
  const current = (data.workspaces() ?? []).findIndex((x) => x.id === w.id);
  if (target >= 0 && target !== current) {
    cmux("workspace.reorder", { workspace_id: w.id, index: target });
    changed = true;
  }

  if (!changed) setMoveTick(moveTick() + 1);
}

const projects = computed(() =>
  (data.groups() ?? [])
    .map((g) => {
      const members = (data.workspaces() ?? []).filter((w) => w.group === g.id);
      const done = members.filter((w) => bucketOf(w) === "done").length;
      const next =
        members.find((w) => bucketOf(w) === "doing") ?? members.find((w) => bucketOf(w) === "todo");
      return {
        key: g.id,
        name: g.name,
        color: g.color ?? C.next,
        total: members.length,
        ratio: members.length ? done / members.length : 0,
        next: next ? next.title : "—",
      };
    })
    .filter((p) => p.total > 0)
);

const totals = computed(() => {
  const all = data.workspaces() ?? [];
  const done = all.filter((w) => bucketOf(w) === "done").length;
  return { done, total: all.length };
});

// ---------------------------------------------------------------- 部品

// "#RRGGBB" に透明度を足す（それ以外の色指定はそのまま薄いグレーにする）
const tint = (color, alpha) =>
  /^#[0-9a-fA-F]{6}$/.test(String(color)) ? color + alpha : "#7f7f7f" + alpha;

function chip(text, color) {
  return Text(text)
    .font(10).weight("medium").color(color)
    .lineLimit(1).truncation("tail")
    .paddingHorizontal(6).paddingVertical(2)
    .background(tint(color, "26"))
    .cornerRadius(4);
}

function countDot(color, count) {
  return HStack({ spacing: 4 }, [
    Circle({ size: 7 }).fill(color),
    Text(() => String(count())).font(11).monospaced().color("secondary"),
  ]);
}

function headerRow(e) {
  const s = e().section;
  return HStack({ spacing: 6 }, [
    Text(s.label).font(11).weight("bold").color(s.color),
    Text(() => String(e().count)).font(11).color("secondary"),
    Spacer(),
    Image("chevron.right")
      .font(9).color("tertiary")
      .rotation(() => (s.foldable && folded()[s.id] ? 0 : 90))
      .frame({ width: 14, height: 14 }),
  ])
    .paddingHorizontal(8).paddingVertical(4)
    .frame({ maxWidth: "infinity" })
    .cursor("pointer")
    .onTap(() => { if (s.foldable) toggleFold(s.id); })
    .fixed(); // 見出しはつかめないようにする（ドロップ先の目印としては動く）
}

function cardRow(e) {
  const w = () => e().w;
  return VStack({ spacing: 5 }, [
    HStack({ spacing: 7 }, [
      Circle({ size: 7 }).fill(() => dotOf(w())),
      Text(() => w().title)
        .font(13).weight("semibold")
        .lineLimit(1).truncation("tail").marquee(),
      Spacer({ minLength: 0 }),
      Text(() => timeOf(w())).font(10).monospaced().color("tertiary").layoutPriority(2),
    ]),
    HStack({ spacing: 4 }, [
      ForEach({ items: () => chipsOf(w()), key: (c) => c.key }, (c) =>
        chip(() => c().text, c().color)),
      Spacer({ minLength: 0 }),
    ]).paddingHorizontal(14),
    Text(() => messageOf(w()))
      .font(11.5)
      .color(() => (e().highlight ? C.inbox : "secondary"))
      .lineLimit(2).truncation("tail")
      .paddingHorizontal(14),
  ])
    .padding(9)
    .frame({ maxWidth: "infinity" })
    .background(() => (e().highlight ? C.inbox + "26" : w().selected ? "#7f7f7f33" : "#7f7f7f1a"))
    .hoverBackground("#7f7f7f2e")
    .cornerRadius(9)
    .cursor("pointer")
    .onTap(() => select(w()))
    .onDoubleTap(() => setEditingId(w().id))
    .contextMenu(taskMenu(w));
}

// 名前の編集欄。Return で確定、Esc で取り消し。空で確定すると自動の名前に戻す。
function editRow(e) {
  const w = () => e().w;
  return TextField(() => w().title ?? "", {
    placeholder: "タスク名",
    onSubmit: (t) => {
      const title = (t ?? "").trim();
      if (title) cmux("workspace.action", { action: "rename", workspace_id: w().id, title });
      else cmux("workspace.action", { action: "clear_name", workspace_id: w().id });
      setEditingId(null);
    },
    onCancel: () => setEditingId(null),
  })
    .font(13)
    .padding(9)
    .frame({ maxWidth: "infinity" })
    .background("#7f7f7f3d")
    .cornerRadius(9)
    .fixed();
}

function childRow(e) {
  return HStack({ spacing: 7 }, [
    Text("└").font(11).monospaced().color("tertiary"),
    Circle({ size: 5 }).fill(C.waiting),
    Text(() => e().c.label ?? "subagent").font(11.5).color("secondary").lineLimit(1).truncation("tail"),
    Spacer({ minLength: 0 }),
    Text(() => fmt(epoch() - (e().c.startedEpoch ?? epoch()))).font(10).monospaced().color("tertiary"),
  ]).paddingHorizontal(22).paddingVertical(1).fixed();
}

function emptyRow(e) {
  return Text(() => e().text).font(11).color("tertiary").paddingHorizontal(10).paddingVertical(4).fixed();
}

function projectRow(p) {
  return VStack({ spacing: 5 }, [
    HStack({ spacing: 7 }, [
      RoundedRectangle({ width: 7, height: 7, cornerRadius: 2 }).fill(() => p().color),
      Text(() => p().name).font(12.5).weight("semibold").lineLimit(1).truncation("tail"),
      Spacer({ minLength: 0 }),
      Text(() => Math.round(p().ratio * 100) + "%").font(10).monospaced().color("secondary"),
    ]),
    ProgressView({ value: () => p().ratio }).paddingHorizontal(14),
    Text(() => "次：" + p().next).font(11).color("secondary").lineLimit(1).truncation("tail")
      .paddingHorizontal(14),
  ])
    .padding(9)
    .frame({ maxWidth: "infinity" })
    .background("#7f7f7f1a")
    .cornerRadius(9)
    .cursor("pointer")
    .onTap(() => setGroupFilter(p().key));
}

function filterChip(label, active, onTap) {
  return Text(label)
    .font(12).weight("semibold")
    .color(() => (active() ? "primary" : "secondary"))
    .paddingHorizontal(9).paddingVertical(4)
    .background(() => (active() ? "#7f7f7f33" : null))
    .cornerRadius(6)
    .cursor("pointer")
    .onTap(onTap);
}

// ---------------------------------------------------------------- 本体

sidebar(() =>
  VStack({ spacing: 10 }, [
      HStack({ spacing: 8 }, [
        Image("checkmark.square").font(14).color(C.next),
        Text("タスク管理").font(15).weight("bold"),
        Spacer(),
        countDot(C.next, () => buckets().todo.length),
        countDot(C.now, () => buckets().doing.length),
        countDot(C.idle, () => buckets().done.length),
      ]).paddingHorizontal(6),

      HStack({ spacing: 4 }, [
        filterChip("すべて", () => groupFilter() === null, () => setGroupFilter(null)),
        ForEach({ items: () => (data.groups() ?? []).slice(0, 4), key: (g) => g.id }, (g) =>
          filterChip(() => g().name, () => groupFilter() === g().id, () => setGroupFilter(g().id))),
        Spacer({ minLength: 0 }),
      ]).paddingHorizontal(4),

      TextField("", {
        placeholder: "タスクを検索…",
        autofocus: false,
        onEdit: (t) => setQuery(t ?? ""),
        onSubmit: (t) => setQuery(t ?? ""),
      }).paddingHorizontal(4),

      Divider(),

      Reorderable({ items: entries, key: (e) => e.key, onMove: handleMove, spacing: 10 }, (e) => {
        const kind = e().kind; // key ごとに kind は固定
        if (kind === "header") return headerRow(e);
        if (kind === "child") return childRow(e);
        if (kind === "empty") return emptyRow(e);
        if (kind === "edit") return editRow(e);
        return cardRow(e);
      }),

      Text(() => (projects().length ? "PROJECTS" : ""))
        .font(11).weight("bold").color("secondary").paddingHorizontal(8),
      ForEach({ items: projects, key: (p) => p.key }, (p) => projectRow(p)),

      VStack({ spacing: 6 }, [
        HStack({}, [
          Text("進捗").font(11).weight("bold").color("secondary"),
          Spacer(),
          Text(() => "DONE " + totals().done + " / " + totals().total)
            .font(10).monospaced().color("secondary"),
        ]),
        ProgressView({ value: () => (totals().total ? totals().done / totals().total : 0) }),
        Text("ドラッグか右クリックで振り分け、ダブルクリックで名前を変更。Claude に頼んでも更新できます")
          .font(10.5).color("tertiary").lineLimit(3),
      ])
        .padding(10)
        .background("#7f7f7f1a")
        .cornerRadius(9),
  ]).paddingHorizontal(8).paddingVertical(10),
  { surface: "glass" }
)
